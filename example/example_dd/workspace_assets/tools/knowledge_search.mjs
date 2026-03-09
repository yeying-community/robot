#!/usr/bin/env node

import { searchKnowledge } from "./lib/knowledge.mjs";
import { parseArgs, workspaceRootFromTool } from "./lib/runtime.mjs";
import { resolveKnowledgePaths } from "./lib/knowledge.mjs";

function required(name, value) {
  if (!value) {
    throw new Error(`Missing required argument: ${name}`);
  }
  return value;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const query = required("query", args.query);
  const workspaceRoot = workspaceRootFromTool(import.meta.url);
  const limit = Number(args.limit || "5");
  const paths = resolveKnowledgePaths({
    workspaceRoot,
    rawDir: args.rawDir,
    indexDir: args.indexDir,
    manifestPath: args.manifestPath
  });

  const result = searchKnowledge({
    rawDir: paths.rawDir,
    indexDir: paths.indexDir,
    manifestPath: paths.manifestPath,
    query,
    topic: args.topic,
    limit: Number.isNaN(limit) ? 5 : limit
  });

  console.log(JSON.stringify(result, null, 2));
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
