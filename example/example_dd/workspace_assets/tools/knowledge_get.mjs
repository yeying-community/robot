#!/usr/bin/env node

import { getDocMeta, getSourceChunks, resolveKnowledgePaths } from "./lib/knowledge.mjs";
import { parseArgs, workspaceRootFromTool } from "./lib/runtime.mjs";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const workspaceRoot = workspaceRootFromTool(import.meta.url);
  const paths = resolveKnowledgePaths({
    workspaceRoot,
    rawDir: args.rawDir,
    indexDir: args.indexDir,
    manifestPath: args.manifestPath
  });

  if (args.docId && args.meta === "true") {
    console.log(JSON.stringify(getDocMeta({ ...paths, docId: args.docId }), null, 2));
    return;
  }

  const ids = (args.ids || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  console.log(
    JSON.stringify(
      getSourceChunks({
        ...paths,
        ids,
        docId: args.docId || null
      }),
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
