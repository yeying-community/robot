#!/usr/bin/env node

import { createKnowledgeGap, getKnowledgeGap, listKnowledgeGaps, updateKnowledgeGap } from "./lib/gap.mjs";
import { parseArgs, parseJsonArg, scopeFromArgs, workspaceRootFromTool } from "./lib/runtime.mjs";

function required(name, value) {
  if (!value) {
    throw new Error(`Missing required argument: ${name}`);
  }
  return value;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const action = args.action || "list";
  const workspaceRoot = workspaceRootFromTool(import.meta.url);

  if (action === "create") {
    const result = createKnowledgeGap({
      workspaceRoot,
      scope: scopeFromArgs(args),
      sender: args.senderJson ? JSON.parse(args.senderJson) : null,
      query: required("query", args.query),
      topic: args.topic || null,
      reason: required("reason", args.reason),
      suggestedAction: args.suggestedAction || null,
      searchResult: parseJsonArg(args.searchResultJson),
      source: args.source || "manual"
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (action === "get") {
    console.log(JSON.stringify(getKnowledgeGap({ workspaceRoot, gapId: required("gapId", args.gapId) }), null, 2));
    return;
  }

  if (action === "resolve" || action === "close") {
    console.log(
      JSON.stringify(
        updateKnowledgeGap({
          workspaceRoot,
          gapId: required("gapId", args.gapId),
          status: "resolved",
          resolutionNote: args.resolutionNote || null
        }),
        null,
        2
      )
    );
    return;
  }

  if (action === "reopen") {
    console.log(
      JSON.stringify(
        updateKnowledgeGap({
          workspaceRoot,
          gapId: required("gapId", args.gapId),
          status: "open",
          resolutionNote: args.resolutionNote || null
        }),
        null,
        2
      )
    );
    return;
  }

  if (action === "list") {
    console.log(JSON.stringify(listKnowledgeGaps({ workspaceRoot, status: args.status || null }), null, 2));
    return;
  }

  throw new Error(`Unsupported action: ${action}`);
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
