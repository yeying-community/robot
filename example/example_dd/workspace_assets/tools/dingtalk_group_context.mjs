#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

function sessionIndexPath() {
  return path.join(os.homedir(), ".openclaw", "agents", "main", "sessions", "sessions.json");
}

function main() {
  const filePath = sessionIndexPath();
  const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const groupEntries = Object.entries(payload)
    .filter(([, value]) => value?.lastChannel === "dingtalk" && value?.chatType === "group")
    .sort((left, right) => (right[1]?.updatedAt ?? 0) - (left[1]?.updatedAt ?? 0));

  if (groupEntries.length === 0) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          error: "No recent DingTalk group session found."
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  const [sessionKey, entry] = groupEntries[0];
  console.log(
    JSON.stringify(
      {
        ok: true,
        sessionKey,
        conversationId: entry.lastTo || entry.deliveryContext?.to || entry.origin?.to || null,
        accountId: entry.lastAccountId || entry.deliveryContext?.accountId || entry.origin?.accountId || "default",
        label: entry.origin?.label || null,
        updatedAt: entry.updatedAt || null
      },
      null,
      2
    )
  );
}

main();
