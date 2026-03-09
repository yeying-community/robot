#!/usr/bin/env node

import crypto from "node:crypto";
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

function parseCsv(value) {
  if (!value) {
    return [];
  }
  return value.split(",").map((item) => item.trim()).filter(Boolean);
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

async function tryResolveUnionId(candidateUserId, clientId, clientSecret) {
  if (!candidateUserId || !clientId || !clientSecret) {
    return null;
  }

  try {
    const accessToken = await getAccessToken(clientId, clientSecret);
    const response = await fetch(
      `https://oapi.dingtalk.com/topapi/v2/user/get?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          language: "zh_CN",
          userid: candidateUserId
        })
      }
    );

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    const unionId = payload?.result?.unionid;
    return typeof unionId === "string" && unionId.trim().length > 0 ? unionId.trim() : null;
  } catch {
    return null;
  }
}

async function resolveAttendeeIds(rawIds, clientId, clientSecret) {
  const result = [];
  for (const rawId of rawIds) {
    const resolved = (await tryResolveUnionId(rawId, clientId, clientSecret)) || rawId;
    result.push(resolved);
  }
  return result;
}

async function getAccessToken(clientId, clientSecret) {
  const query = new URLSearchParams({
    appkey: clientId,
    appsecret: clientSecret
  });
  const response = await fetch(`https://oapi.dingtalk.com/gettoken?${query.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" }
  });
  if (!response.ok) {
    throw new Error(`Failed to get DingTalk access token: HTTP ${response.status}`);
  }
  const payload = await response.json();
  if (!payload.access_token) {
    throw new Error(`Failed to get DingTalk access token: ${payload.errmsg ?? "missing access_token"}`);
  }
  return payload.access_token;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const execute = args.execute === "true";
  const clientId = process.env.DINGTALK_CLIENT_ID;
  const clientSecret = process.env.DINGTALK_CLIENT_SECRET;
  const rawOrganizerUserId =
    args.organizerUserId ||
    args.userId ||
    process.env.DINGTALK_CALENDAR_DEFAULT_USER_ID ||
    tryResolveSenderFromRecentSession();
  const organizerUserId =
    (args.organizerUserId || args.userId || process.env.DINGTALK_CALENDAR_DEFAULT_USER_ID
      ? rawOrganizerUserId
      : await tryResolveUnionId(rawOrganizerUserId, clientId, clientSecret)) || rawOrganizerUserId;
  const calendarId = args.calendarId || process.env.DINGTALK_CALENDAR_DEFAULT_ID || "primary";
  const timeZone = args.timeZone || process.env.DINGTALK_CALENDAR_TIMEZONE || "Asia/Shanghai";

  const summary = required("summary", args.summary);
  const startDateTime = required("start", args.start);
  const endDateTime = required("end", args.end);
  const description = args.description || "";
  const location = args.location || "";
  const rawAttendeeIds = parseCsv(args.attendees);
  const rawOptionalAttendeeIds = parseCsv(args.optionalAttendees);
  const resolvedAttendeeIds = await resolveAttendeeIds(rawAttendeeIds, clientId, clientSecret);
  const resolvedOptionalAttendeeIds = await resolveAttendeeIds(rawOptionalAttendeeIds, clientId, clientSecret);
  const attendees = resolvedAttendeeIds.map((id) => ({ id, isOptional: false }));
  const optionalAttendees = resolvedOptionalAttendeeIds.map((id) => ({ id, isOptional: true }));
  const reminders = parseCsv(args.reminderMinutes).map((minutes) => ({ method: "dingtalk", minutes: Number(minutes) }));
  const onlineMeeting = args.onlineMeeting === "true";
  const notifyCurrentGroup = args.notifyCurrentGroup === "true";

  const payload = {
    summary,
    ...(description ? { description } : {}),
    start: { dateTime: startDateTime, timeZone },
    end: { dateTime: endDateTime, timeZone },
    isAllDay: false,
    ...((attendees.length > 0 || optionalAttendees.length > 0) ? { attendees: [...attendees, ...optionalAttendees] } : {}),
    ...(location ? { location: { displayName: location } } : {}),
    ...(reminders.length > 0 ? { reminders } : {}),
    ...(onlineMeeting ? { onlineMeetingInfo: { type: "dingtalk" } } : {})
  };

  if (!organizerUserId) {
    console.log(JSON.stringify({
      ok: false,
      mode: execute ? "execute" : "preview",
      error: "Missing organizer user id. Provide --organizerUserId/--userId, set DINGTALK_CALENDAR_DEFAULT_USER_ID, or ensure a recent DingTalk session contains sender metadata.",
      calendarId,
      payload
    }, null, 2));
    process.exit(execute ? 2 : 0);
  }

  if (!execute) {
    console.log(JSON.stringify({
      ok: true,
      mode: "preview",
      rawOrganizerUserId,
      organizerUserId,
      rawAttendeeIds,
      resolvedAttendeeIds,
      calendarId,
      payload
    }, null, 2));
    return;
  }

  if (!clientId || !clientSecret) {
    throw new Error("Missing DINGTALK_CLIENT_ID or DINGTALK_CLIENT_SECRET for execute mode");
  }

  const accessToken = await getAccessToken(clientId, clientSecret);
  const response = await fetch(
    `https://api.dingtalk.com/v1.0/calendar/users/${encodeURIComponent(organizerUserId)}/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        "x-acs-dingtalk-access-token": accessToken,
        "x-client-token": args.clientToken || crypto.randomUUID(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  );

  const responseText = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    parsed = { raw: responseText };
  }

  if (!response.ok) {
    console.log(JSON.stringify({
      ok: false,
      mode: "execute",
      organizerUserId,
      calendarId,
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
    result: {
      id: parsed.id,
      summary: parsed.summary,
      start: parsed.start,
      end: parsed.end,
      attendees: parsed.attendees,
      onlineMeetingInfo: parsed.onlineMeetingInfo
    }
  }, null, 2));

  if (notifyCurrentGroup) {
    const lines = [
      `已创建测试日程：${parsed.summary || summary}`,
      `时间：${startDateTime} - ${endDateTime}`,
      parsed?.onlineMeetingInfo?.url ? `会议链接：${parsed.onlineMeetingInfo.url}` : "",
      `日程ID：${parsed.id || "(unknown)"}`
    ].filter(Boolean);
    const { spawnSync } = await import("node:child_process");
    const notify = spawnSync(
      process.execPath,
      [new URL("./dingtalk_group_send.mjs", import.meta.url).pathname, "--text", lines.join("\n"), "--execute"],
      {
        env: process.env,
        encoding: "utf8"
      }
    );
    if (notify.stdout) {
      console.error(notify.stdout.trim());
    }
    if (notify.stderr) {
      console.error(notify.stderr.trim());
    }
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    mode: "execute",
    error: error instanceof Error ? error.message : String(error)
  }, null, 2));
  process.exit(1);
});
