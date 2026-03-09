#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "${PROJECT_DIR}"

bash scripts/sync_openclaw_workspace.sh >/dev/null

WORKSPACE_DIR="${OPENCLAW_DD_WORKSPACE:-$HOME/.openclaw/workspace-dd-bot}"
AUDIT_FILE="${WORKSPACE_DIR}/state/audit/events.jsonl"
GET_OUT="$(mktemp)"
CREATE_OUT="$(mktemp)"
EXEC_OUT="$(mktemp)"
CLEAR_OUT="$(mktemp)"
cleanup() {
  rm -f "${GET_OUT}" "${CREATE_OUT}" "${EXEC_OUT}" "${CLEAR_OUT}"
}
trap cleanup EXIT

node "${WORKSPACE_DIR}/tools/pending_action.mjs" --action clear >/dev/null 2>&1 || true
rm -f "${AUDIT_FILE}"

node "${WORKSPACE_DIR}/tools/pending_action.mjs" \
  --action create \
  --kind github_issue_create \
  --headline "测试：Issue 创建确认闭环" \
  --previewNote "这是一条测试预览" \
  --paramsJson '{"owner":"demo-org","repo":"demo-repo","title":"测试 issue","body":"测试正文"}' >"${CREATE_OUT}"

grep -q '"ok": true' "${CREATE_OUT}"
grep -q '"kind": "github_issue_create"' "${CREATE_OUT}"
grep -q '"type":"pending_action.create"' "${AUDIT_FILE}"

node "${WORKSPACE_DIR}/tools/pending_action.mjs" --action get >"${GET_OUT}"
grep -q '"ok": true' "${GET_OUT}"
grep -q '"headline": "测试：Issue 创建确认闭环"' "${GET_OUT}"

node "${WORKSPACE_DIR}/tools/pending_action.mjs" --action execute >"${EXEC_OUT}" || true
grep -q '"ok": false' "${EXEC_OUT}"

node "${WORKSPACE_DIR}/tools/pending_action.mjs" --action clear >"${CLEAR_OUT}"
grep -q '"ok": true' "${CLEAR_OUT}"
grep -q '"type":"pending_action.clear"' "${AUDIT_FILE}"

echo "[ok] OpenClaw confirmation loop verify passed"
