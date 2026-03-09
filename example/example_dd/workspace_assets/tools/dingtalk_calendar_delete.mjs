#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

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

function tryResolveSenderFromRecentSession() {
  try {
    const sessionDir = path.join(os.homedir(), ".openclaw", "agents", "main", "sessions");
    const files = fs
      .readdirSync(sessionDir)
      .filter((name) => name.endsWith(".jsonl"))
      .map((name) => path.join(sessionDir, name))
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

    for (const filePath of files) {
      const lines = fs.readFileSync(filePath, "utf8").trim().split("\n").filter(Boolean).reverse();
      for (const line of lines) {
        let record;
        try {
          record = JSON.parse(line);
        } catch {
          continue;
        }
        if (record?.type !== "message" || record?.message?.role !== "user") {
          continue;
        }
        const contentBlocks = Array.isArray(record.message.content) ? record.message.content : [];
        const textBlock = contentBlocks.find((block) => block?.type === "text" && typeof block.text === "string");
        if (!textBlock) {
          continue;
        }
        const match = textBlock.text.match(/"sender_id"\s*:\s*"([^"]+)"/);
        if (match) {
          return match[1];
        }
      }
    }
  } catch {
    return null;
  }
  return null;
}

async function getAccessToken(clientId, clientSecret) {
  const query = new URLSearchParams({ appkey: clientId, appsecret: clientSecret });
  const response = await fetch(`https://oapi.dingtalk.com/gettoken?${query.toString()}`);
  const payload = await response.json();
  if (!payload.access_token) {
    throw new Error(`Failed to get DingTalk access token: ${payload.errmsg ?? "missing access_token"}`);
  }
  return payload.access_token;
}

async function resolveUnionId(candidateUserId, accessToken) {
  if (!candidateUserId) {
    return null;
  }
  const response = await fetch(
    `https://oapi.dingtalk.com/topapi/v2/user/get?access_token=${encodeURIComponent(accessToken)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: "zh_CN", userid: candidateUserId })
    }
  );
  const payload = await response.json();
  return payload?.result?.unionid || null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const execute = args.execute === "true";
  const clientId = process.env.DINGTALK_CLIENT_ID;
  const clientSecret = process.env.DINGTALK_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing DINGTALK_CLIENT_ID or DINGTALK_CLIENT_SECRET");
  }
  const accessToken = await getAccessToken(clientId, clientSecret);

  const rawOrganizerUserId =
    args.organizerUserId ||
    args.userId ||
    process.env.DINGTALK_CALENDAR_DEFAULT_USER_ID ||
    tryResolveSenderFromRecentSession();
  const organizerUserId = (await resolveUnionId(rawOrganizerUserId, accessToken)) || rawOrganizerUserId;
  const calendarId = args.calendarId || process.env.DINGTALK_CALENDAR_DEFAULT_ID || "primary";
  const eventId = required("eventId", args.eventId);
  const pushNotification = args.pushNotification !== "false";

  if (!execute) {
    console.log(JSON.stringify({
      ok: true,
      mode: "preview",
      rawOrganizerUserId,
      organizerUserId,
      calendarId,
      eventId,
      pushNotification
    }, null, 2));
    return;
  }

  const query = pushNotification ? "?pushNotification=true" : "";
  const response = await fetch(
    `https://api.dingtalk.com/v1.0/calendar/users/${encodeURIComponent(organizerUserId)}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}${query}`,
    {
      method: "DELETE",
      headers: {
        "x-acs-dingtalk-access-token": accessToken
      }
    }
  );

  const responseText = await response.text();
  let parsed = {};
  try {
    parsed = responseText ? JSON.parse(responseText) : {};
  } catch {
    parsed = { raw: responseText };
  }

  if (!response.ok) {
    console.log(JSON.stringify({
      ok: false,
      mode: "execute",
      organizerUserId,
      calendarId,
      eventId,
      status: response.status,
      response: parsed
    }, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify({
    ok: true,
    mode: "execute",
    organizerUserId,
    calendarId,
    eventId
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    mode: "execute",
    error: error instanceof Error ? error.message : String(error)
  }, null, 2));
  process.exit(1);
});
