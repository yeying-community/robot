#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { appendAuditEvent } from "./lib/audit.mjs";

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = "true";
      continue;
    }
    args[key] = next;
    index += 1;
  }
  return args;
}

function required(name, value) {
  if (!value) {
    throw new Error(`Missing required argument: ${name}`);
  }
  return value;
}

function workspaceRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

function stateDir() {
  const dir = path.join(workspaceRoot(), "state", "pending-actions");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function sessionsIndexPath() {
  return path.join(os.homedir(), ".openclaw", "agents", "main", "sessions", "sessions.json");
}

function currentScope() {
  const explicitSessionKey = process.env.PENDING_SCOPE_SESSION_KEY;
  if (explicitSessionKey) {
    return {
      sessionKey: explicitSessionKey,
      conversationId: process.env.PENDING_SCOPE_CONVERSATION_ID || null,
      accountId: process.env.PENDING_SCOPE_ACCOUNT_ID || "default",
      chatType: process.env.PENDING_SCOPE_CHAT_TYPE || "unknown",
      label: process.env.PENDING_SCOPE_LABEL || null
    };
  }

  const payload = JSON.parse(fs.readFileSync(sessionsIndexPath(), "utf8"));
  const dingtalkEntries = Object.entries(payload)
    .filter(([, value]) => value?.lastChannel === "dingtalk")
    .sort((left, right) => (right[1]?.updatedAt ?? 0) - (left[1]?.updatedAt ?? 0));

  if (dingtalkEntries.length === 0) {
    throw new Error("No recent DingTalk session found for pending action scope.");
  }

  const [sessionKey, entry] = dingtalkEntries[0];
  return {
    sessionKey,
    conversationId: entry.lastTo || entry.deliveryContext?.to || entry.origin?.to || null,
    accountId: entry.lastAccountId || entry.deliveryContext?.accountId || entry.origin?.accountId || "default",
    chatType: entry.chatType || entry.origin?.chatType || "unknown",
    label: entry.origin?.label || null
  };
}

function scopeFilePath(scope) {
  const safeName = Buffer.from(scope.sessionKey).toString("base64url");
  return path.join(stateDir(), `${safeName}.json`);
}

function readPending(scope) {
  const filePath = scopeFilePath(scope);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writePending(scope, payload) {
  const filePath = scopeFilePath(scope);
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
  return filePath;
}

function clearPending(scope) {
  const filePath = scopeFilePath(scope);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  return filePath;
}

function buildExecCommand(kind, params) {
  const toolsDir = path.join(workspaceRoot(), "tools");

  if (kind === "github_issue_create") {
    const cmd = [path.join(toolsDir, "github_issue_create.mjs")];
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") {
        continue;
      }
      cmd.push(`--${key}`, String(value));
    }
    cmd.push("--execute");
    return cmd;
  }

  if (kind === "dingtalk_calendar_create") {
    const cmd = [path.join(toolsDir, "dingtalk_calendar_event.mjs")];
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") {
        continue;
      }
      if (typeof value === "boolean") {
        if (value) {
          cmd.push(`--${key}`);
        }
        continue;
      }
      cmd.push(`--${key}`, String(value));
    }
    cmd.push("--execute");
    return cmd;
  }

  throw new Error(`Unsupported pending action kind: ${kind}`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const action = args.action || "get";
  const scope = currentScope();

  if (action === "create") {
    const kind = required("kind", args.kind);
    const headline = required("headline", args.headline);
    const paramsJson = required("paramsJson", args.paramsJson);
    const previewNote = args.previewNote || "";
    const confirmHint = args.confirmHint || "回复“确认执行”";
    const cancelHint = args.cancelHint || "回复“取消”";
    const params = JSON.parse(paramsJson);
    const requester = args.requesterId || args.requesterLabel
      ? {
          id: args.requesterId || null,
          label: args.requesterLabel || null
        }
      : null;
    const approval = args.approvalJson ? JSON.parse(args.approvalJson) : null;
    const payload = {
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scope,
      kind,
      headline,
      previewNote,
      confirmHint,
      cancelHint,
      params,
      ...(requester ? { requester } : {}),
      ...(approval ? { approval } : {})
    };
    const filePath = writePending(scope, payload);
    appendAuditEvent({
      workspaceRoot: workspaceRoot(),
      type: "pending_action.create",
      scope,
      actor: requester,
      payload: {
        kind,
        headline,
        previewNote,
        filePath
      }
    });
    console.log(JSON.stringify({ ok: true, action, filePath, pending: payload }, null, 2));
    return;
  }

  if (action === "get") {
    const pending = readPending(scope);
    console.log(JSON.stringify({ ok: Boolean(pending), action, pending, scope }, null, 2));
    process.exit(pending ? 0 : 1);
  }

  if (action === "clear") {
    const filePath = clearPending(scope);
    appendAuditEvent({
      workspaceRoot: workspaceRoot(),
      type: "pending_action.clear",
      scope,
      actor: null,
      payload: { filePath }
    });
    console.log(JSON.stringify({ ok: true, action, filePath, scope }, null, 2));
    return;
  }

  if (action === "execute") {
    const pending = readPending(scope);
    if (!pending) {
      console.log(JSON.stringify({ ok: false, action, error: "No pending action for current scope.", scope }, null, 2));
      process.exit(1);
    }

    const command = buildExecCommand(pending.kind, pending.params);
    const result = spawnSync(process.execPath, command, { env: process.env, encoding: "utf8" });
    const raw = (result.stdout || result.stderr || "").trim();
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { raw };
    }

    if (result.status === 0 && parsed?.ok) {
      clearPending(scope);
      appendAuditEvent({
        workspaceRoot: workspaceRoot(),
        type: "pending_action.execute.success",
        scope,
        actor: pending.requester || null,
        payload: {
          kind: pending.kind,
          headline: pending.headline,
          result: parsed
        }
      });
      console.log(JSON.stringify({ ok: true, action, executed: parsed, scope }, null, 2));
      return;
    }

    appendAuditEvent({
      workspaceRoot: workspaceRoot(),
      type: "pending_action.execute.failure",
      scope,
      actor: pending.requester || null,
      payload: {
        kind: pending.kind,
        headline: pending.headline,
        result: parsed
      }
    });
    console.log(JSON.stringify({ ok: false, action, executed: parsed, scope }, null, 2));
    process.exit(1);
  }

  if (action === "list") {
    const files = fs.readdirSync(stateDir()).filter((name) => name.endsWith(".json")).sort();
    const entries = files.map((name) => JSON.parse(fs.readFileSync(path.join(stateDir(), name), "utf8")));
    console.log(JSON.stringify({ ok: true, action, entries }, null, 2));
    return;
  }

  throw new Error(`Unsupported action: ${action}`);
}

main();
