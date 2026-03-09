#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "${PROJECT_DIR}"

bash scripts/sync_openclaw_workspace.sh >/dev/null

WORKSPACE_DIR="${OPENCLAW_DD_WORKSPACE:-$HOME/.openclaw/workspace-dd-bot}"
AUDIT_FILE="${WORKSPACE_DIR}/state/audit/events.jsonl"
GAP_DIR="${WORKSPACE_DIR}/state/knowledge-gaps"

rm -f "${AUDIT_FILE}"
rm -rf "${GAP_DIR}"
mkdir -p "${GAP_DIR}"

KNOWN_QA="$(mktemp)"
UNKNOWN_QA="$(mktemp)"
HIGH_RISK="$(mktemp)"
CAL_CLARIFY="$(mktemp)"
GAP_LIST="$(mktemp)"
AUDIT_LIST="$(mktemp)"
cleanup() {
  rm -f "${KNOWN_QA}" "${UNKNOWN_QA}" "${HIGH_RISK}" "${CAL_CLARIFY}" "${GAP_LIST}" "${AUDIT_LIST}"
}
trap cleanup EXIT

node "${WORKSPACE_DIR}/tools/message_intake.mjs" \
  --conversationId "cid-test" \
  --chatType group \
  --senderId "user-a" \
  --senderLabel "user-a" \
  --text "新人开发环境应该怎么配置？" >"${KNOWN_QA}"

grep -q '"intent": "qa"' "${KNOWN_QA}"
grep -q '"decision": "answer"' "${KNOWN_QA}"
grep -q '"mode": "grounded_answer"' "${KNOWN_QA}"
grep -q '"sourcePath": "kb/raw/facts/onboarding.md"' "${KNOWN_QA}"

node "${WORKSPACE_DIR}/tools/message_intake.mjs" \
  --conversationId "cid-test" \
  --chatType group \
  --senderId "user-b" \
  --senderLabel "user-b" \
  --text "我们新上线的火星审批链是否也要接机器人自动确认？" >"${UNKNOWN_QA}"

grep -q '"intent": "qa"' "${UNKNOWN_QA}"
grep -Eq '"mode": "(clarify_then_answer|insufficient_knowledge)"' "${UNKNOWN_QA}"
grep -q '"knowledgeGap"' "${UNKNOWN_QA}"

GAP_ID="$(node -e "const fs=require('fs');const payload=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));process.stdout.write(payload.knowledgeGap.gap.gapId);" "${UNKNOWN_QA}")"
node "${WORKSPACE_DIR}/tools/knowledge_gap.mjs" --action get --gapId "${GAP_ID}" >"${GAP_LIST}"
grep -q "\"gapId\": \"${GAP_ID}\"" "${GAP_LIST}"
grep -q '"status": "open"' "${GAP_LIST}"

node "${WORKSPACE_DIR}/tools/message_intake.mjs" \
  --conversationId "cid-test" \
  --chatType group \
  --senderId "user-c" \
  --senderLabel "user-c" \
  --text "帮我直接开生产权限" >"${HIGH_RISK}"

grep -q '"intent": "handoff"' "${HIGH_RISK}"
grep -q '"mode": "handoff"' "${HIGH_RISK}"

node "${WORKSPACE_DIR}/tools/message_intake.mjs" \
  --conversationId "cid-test" \
  --chatType group \
  --senderId "user-d" \
  --senderLabel "user-d" \
  --text "帮我安排一个会议" >"${CAL_CLARIFY}"

grep -q '"intent": "calendar"' "${CAL_CLARIFY}"
grep -q '"mode": "clarify_required"' "${CAL_CLARIFY}"

node "${WORKSPACE_DIR}/tools/audit_log.mjs" --action list >"${AUDIT_LIST}"
grep -q '"type":"message_intake"' "${AUDIT_FILE}"
grep -q '"entries"' "${AUDIT_LIST}"

node "${WORKSPACE_DIR}/tools/knowledge_gap.mjs" --action resolve --gapId "${GAP_ID}" >/dev/null
node "${WORKSPACE_DIR}/tools/knowledge_gap.mjs" --action get --gapId "${GAP_ID}" >"${GAP_LIST}"
grep -q '"status": "resolved"' "${GAP_LIST}"

echo "[ok] OpenClaw group scenarios verify passed"
