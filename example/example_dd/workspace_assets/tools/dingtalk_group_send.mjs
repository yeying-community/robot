#!/usr/bin/env node

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

function detectMarkdown(text) {
  return text.includes("\n") || /[#>*`\-\d]/.test(text);
}

function buildTitle(text) {
  const first = text.split(/\n+/).map((line) => line.trim()).find(Boolean) || "钉钉通知";
  return first.length > 32 ? `${first.slice(0, 29)}...` : first;
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

async function resolveCurrentGroupContext() {
  const response = await import("./dingtalk_group_context.mjs");
  return response;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const execute = args.execute === "true";
  const text = required("text", args.text);
  const clientId = process.env.DINGTALK_CLIENT_ID;
  const clientSecret = process.env.DINGTALK_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing DINGTALK_CLIENT_ID or DINGTALK_CLIENT_SECRET");
  }

  let conversationId = args.conversationId || "";
  let label = null;

  if (!conversationId) {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const os = await import("node:os");
    const filePath = path.join(os.homedir(), ".openclaw", "agents", "main", "sessions", "sessions.json");
    const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const groupEntries = Object.entries(payload)
      .filter(([, value]) => value?.lastChannel === "dingtalk" && value?.chatType === "group")
      .sort((left, right) => (right[1]?.updatedAt ?? 0) - (left[1]?.updatedAt ?? 0));
    if (groupEntries.length === 0) {
      throw new Error("No recent DingTalk group session found.");
    }
    const [, entry] = groupEntries[0];
    conversationId = entry.lastTo || entry.deliveryContext?.to || entry.origin?.to || "";
    label = entry.origin?.label || null;
  }

  const useMarkdown = args.markdown === "true" || detectMarkdown(text);
  const payload = {
    robotCode: process.env.DINGTALK_ROBOT_CODE || clientId,
    msgKey: useMarkdown ? "sampleMarkdown" : "sampleText",
    msgParam: useMarkdown ? JSON.stringify({ title: buildTitle(text), text }) : JSON.stringify({ content: text }),
    openConversationId: conversationId
  };

  if (!execute) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: "preview",
          conversationId,
          label,
          payload
        },
        null,
        2
      )
    );
    return;
  }

  const accessToken = await getAccessToken(clientId, clientSecret);
  const response = await fetch("https://api.dingtalk.com/v1.0/robot/groupMessages/send", {
    method: "POST",
    headers: {
      "x-acs-dingtalk-access-token": accessToken,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const responseText = await response.text();
  let parsed = {};
  try {
    parsed = responseText ? JSON.parse(responseText) : {};
  } catch {
    parsed = { raw: responseText };
  }

  if (!response.ok) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          mode: "execute",
          conversationId,
          status: response.status,
          response: parsed
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: "execute",
        conversationId,
        response: parsed
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        mode: "execute",
        error: error instanceof Error ? error.message : String(error)
      },
      null,
      2
    )
  );
  process.exit(1);
});
