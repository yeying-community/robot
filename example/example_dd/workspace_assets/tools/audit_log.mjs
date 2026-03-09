#!/usr/bin/env node

import fs from "node:fs";

import { appendAuditEvent, auditFilePath } from "./lib/audit.mjs";
import { parseArgs, parseJsonArg, scopeFromArgs, workspaceRootFromTool } from "./lib/runtime.mjs";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const action = args.action || "append";
  const workspaceRoot = workspaceRootFromTool(import.meta.url);

  if (action === "append") {
    console.log(
      JSON.stringify(
        appendAuditEvent({
          workspaceRoot,
          type: args.type || "custom",
          scope: scopeFromArgs(args),
          actor: parseJsonArg(args.actorJson),
          payload: parseJsonArg(args.payloadJson)
        }),
        null,
        2
      )
    );
    return;
  }

  if (action === "list") {
    const filePath = auditFilePath(workspaceRoot);
    const entries = fs.existsSync(filePath)
      ? fs
          .readFileSync(filePath, "utf8")
          .split("\n")
          .filter(Boolean)
          .map((line) => JSON.parse(line))
      : [];
    console.log(JSON.stringify({ ok: true, filePath, entries }, null, 2));
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
