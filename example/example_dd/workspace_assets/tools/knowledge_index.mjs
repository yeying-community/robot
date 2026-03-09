#!/usr/bin/env node

import { buildIndex, getIndexStatus, resolveKnowledgePaths } from "./lib/knowledge.mjs";
import { parseArgs, workspaceRootFromTool } from "./lib/runtime.mjs";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const action = args.action || "status";
  const workspaceRoot = workspaceRootFromTool(import.meta.url);
  const paths = resolveKnowledgePaths({
    workspaceRoot,
    rawDir: args.rawDir,
    indexDir: args.indexDir,
    manifestPath: args.manifestPath
  });

  if (action === "build") {
    console.log(JSON.stringify(buildIndex(paths), null, 2));
    return;
  }

  if (action === "status") {
    console.log(JSON.stringify(getIndexStatus(paths), null, 2));
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
