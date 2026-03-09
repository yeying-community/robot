#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "${PROJECT_DIR}"

bash scripts/sync_openclaw_workspace.sh >/dev/null

OUT_FILE="$(mktemp)"
cleanup() {
  rm -f "${OUT_FILE}"
}
trap cleanup EXIT

openclaw agent \
  --local \
  --to +15555550123 \
  --message "新人开发环境应该怎么配置？请基于当前项目事实回答。" \
  --thinking off \
  --timeout 120 \
  --json >"${OUT_FILE}"

grep -q 'Node.js 22+' "${OUT_FILE}"
grep -q 'bash scripts/configure_openclaw_dingtalk.sh' "${OUT_FILE}"
grep -q 'bash scripts/run_openclaw_gateway.sh' "${OUT_FILE}"
grep -q 'kb/raw/facts/onboarding.md' "${OUT_FILE}"

echo "[ok] OpenClaw grounding verify passed"
