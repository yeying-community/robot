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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const execute = args.execute === "true";
  const owner = args.owner || process.env.GITHUB_DEFAULT_OWNER || process.env.GITHUB_OWNER;
  const repo = args.repo || process.env.GITHUB_DEFAULT_REPO || process.env.GITHUB_REPO;
  const title = required("title", args.title);
  const body = required("body", args.body);
  const labels = parseCsv(args.labels);
  const assignees = parseCsv(args.assignees);

  const payload = {
    title,
    body,
    ...(labels.length > 0 ? { labels } : {}),
    ...(assignees.length > 0 ? { assignees } : {})
  };

  if (!owner || !repo) {
    console.log(JSON.stringify({
      ok: false,
      mode: execute ? "execute" : "preview",
      error: "Missing GitHub repository. Provide --owner/--repo or set GITHUB_DEFAULT_OWNER/GITHUB_DEFAULT_REPO.",
      payload
    }, null, 2));
    process.exit(execute ? 2 : 0);
  }

  if (!execute) {
    console.log(JSON.stringify({ ok: true, mode: "preview", owner, repo, payload }, null, 2));
    return;
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("Missing GITHUB_TOKEN for execute mode");
  }

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

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
      owner,
      repo,
      status: response.status,
      response: parsed
    }, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify({
    ok: true,
    mode: "execute",
    owner,
    repo,
    result: {
      number: parsed.number,
      title: parsed.title,
      htmlUrl: parsed.html_url,
      state: parsed.state
    }
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
