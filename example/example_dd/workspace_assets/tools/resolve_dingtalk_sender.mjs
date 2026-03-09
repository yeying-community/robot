#!/usr/bin/env node

import { parseArgs, resolveSenderFromScope } from "./lib/runtime.mjs";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const scope = {
    sessionKey: args.sessionKey || process.env.PENDING_SCOPE_SESSION_KEY || "",
    conversationId: args.conversationId || process.env.PENDING_SCOPE_CONVERSATION_ID || "",
    accountId: args.accountId || process.env.PENDING_SCOPE_ACCOUNT_ID || "default",
    chatType: args.chatType || process.env.PENDING_SCOPE_CHAT_TYPE || "group",
    label: args.label || process.env.PENDING_SCOPE_LABEL || ""
  };

  const sender = resolveSenderFromScope(scope);
  if (!sender) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          error: "No recent DingTalk sender metadata found in session transcripts.",
          scope
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
        scope,
        senderId: sender.senderId || null,
        senderLabel: sender.senderLabel || null,
        source: sender.source || null,
        sourceSessionFile: sender.sourceSessionFile || null
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
        error: error instanceof Error ? error.message : String(error)
      },
      null,
      2
    )
  );
  process.exit(1);
});
