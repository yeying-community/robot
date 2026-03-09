#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

function sessionsDir() {
  return path.join(os.homedir(), ".openclaw", "agents", "main", "sessions");
}

function sessionsIndexPath() {
  return path.join(sessionsDir(), "sessions.json");
}

function archiveDir() {
  const dir = path.join(os.homedir(), ".openclaw", "workspace-dd-bot", "state", "session-archive");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function findLatestDingTalkGroupSession() {
  const payload = JSON.parse(fs.readFileSync(sessionsIndexPath(), "utf8"));
  const entries = Object.entries(payload)
    .filter(([, value]) => value?.lastChannel === "dingtalk" && value?.chatType === "group")
    .sort((left, right) => (right[1]?.updatedAt ?? 0) - (left[1]?.updatedAt ?? 0));

  if (entries.length === 0) {
    throw new Error("No DingTalk group session found.");
  }

  const [sessionKey, entry] = entries[0];
  return { sessionKey, entry, payload };
}

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function copyIfExists(sourcePath, targetPath) {
  if (sourcePath && fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, targetPath);
    return true;
  }
  return false;
}

function main() {
  const execute = process.argv.includes("--execute");
  const { sessionKey, entry, payload } = findLatestDingTalkGroupSession();
  const archiveRoot = archiveDir();
  const stamp = nowStamp();
  const archiveBase = path.join(archiveRoot, `${stamp}-${Buffer.from(sessionKey).toString("base64url")}`);

  const sessionFile = entry.sessionFile || null;
  const sessionsIndex = sessionsIndexPath();

  const preview = {
    ok: true,
    mode: execute ? "execute" : "preview",
    sessionKey,
    sessionFile,
    conversationId: entry.lastTo || entry.deliveryContext?.to || entry.origin?.to || null,
    accountId: entry.lastAccountId || entry.deliveryContext?.accountId || entry.origin?.accountId || "default",
    chatType: entry.chatType || "group",
    archiveBase
  };

  if (!execute) {
    console.log(JSON.stringify(preview, null, 2));
    return;
  }

  copyIfExists(sessionFile, `${archiveBase}.jsonl`);
  fs.writeFileSync(`${archiveBase}.session-entry.json`, JSON.stringify(entry, null, 2));

  if (sessionFile && fs.existsSync(sessionFile)) {
    fs.unlinkSync(sessionFile);
  }

  delete payload[sessionKey];
  fs.writeFileSync(sessionsIndex, JSON.stringify(payload, null, 2));

  console.log(
    JSON.stringify(
      {
        ...preview,
        archived: true,
        deletedSessionFile: Boolean(sessionFile),
        removedFromIndex: true
      },
      null,
      2
    )
  );
}

main();
