#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "${PROJECT_DIR}"

bash scripts/sync_openclaw_workspace.sh >/dev/null

WORKSPACE_DIR="${OPENCLAW_DD_WORKSPACE:-$HOME/.openclaw/workspace-dd-bot}"
OUT_FILE="$(mktemp)"
PENDING_FILE="$(mktemp)"
cleanup() {
  rm -f "${OUT_FILE}" "${PENDING_FILE}"
}
trap cleanup EXIT

node "${WORKSPACE_DIR}/tools/pending_action.mjs" --action clear >/dev/null 2>&1 || true

openclaw agent \
  --local \
  --to +15555550123 \
  --message "请帮我创建一个测试 bot 的日程：明天 9:00 到 10:00，线上会议。请按项目规则先处理。" \
  --thinking off \
  --timeout 120 \
  --json >"${OUT_FILE}"

node "${WORKSPACE_DIR}/tools/pending_action.mjs" --action get >"${PENDING_FILE}"

grep -q '"ok": true' "${PENDING_FILE}"
grep -q '"kind": "dingtalk_calendar_create"' "${PENDING_FILE}"

echo "[ok] OpenClaw pending trigger verify passed"
