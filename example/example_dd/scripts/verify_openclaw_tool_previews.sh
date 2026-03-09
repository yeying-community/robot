#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "${PROJECT_DIR}"

set -a
source <(grep -E '^(DINGTALK_|GITHUB_)' .env.local)
set +a

bash scripts/sync_openclaw_workspace.sh >/dev/null

WORKSPACE_DIR="${OPENCLAW_DD_WORKSPACE:-$HOME/.openclaw/workspace-dd-bot}"

ISSUE_PREVIEW="$(mktemp)"
CAL_PREVIEW="$(mktemp)"
GROUP_PREVIEW="$(mktemp)"
SEARCH_PREVIEW="$(mktemp)"
INTAKE_PREVIEW="$(mktemp)"
INDEX_STATUS="$(mktemp)"
CHUNK_PREVIEW="$(mktemp)"
cleanup() {
  rm -f "${ISSUE_PREVIEW}" "${CAL_PREVIEW}" "${GROUP_PREVIEW}" "${SEARCH_PREVIEW}" "${INTAKE_PREVIEW}" "${INDEX_STATUS}" "${CHUNK_PREVIEW}" "${SENDER_INFO:-}"
}
trap cleanup EXIT

node "${WORKSPACE_DIR}/tools/github_issue_create.mjs" \
  --owner demo-org \
  --repo demo-repo \
  --title "修正研发群机器人回答质量" \
  --body "需要加强知识约束与来源引用。" >"${ISSUE_PREVIEW}"

grep -q '"mode": "preview"' "${ISSUE_PREVIEW}"
grep -q '"owner": "demo-org"' "${ISSUE_PREVIEW}"
grep -q '"repo": "demo-repo"' "${ISSUE_PREVIEW}"

node "${WORKSPACE_DIR}/tools/knowledge_search.mjs" \
  --topic environment \
  --query "新人开发环境应该怎么配置" >"${SEARCH_PREVIEW}"
grep -q '"decision": "answer"' "${SEARCH_PREVIEW}"
grep -q '"sourcePath": "kb/raw/facts/onboarding.md"' "${SEARCH_PREVIEW}"

node "${WORKSPACE_DIR}/tools/knowledge_index.mjs" --action status >"${INDEX_STATUS}"
grep -q '"exists": true' "${INDEX_STATUS}"
grep -q '"dirty": false' "${INDEX_STATUS}"

FIRST_CHUNK_ID="$(node -e "const fs=require('fs');const payload=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));process.stdout.write(payload.hits[0].chunkId);" "${SEARCH_PREVIEW}")"
node "${WORKSPACE_DIR}/tools/knowledge_get.mjs" --ids "${FIRST_CHUNK_ID}" >"${CHUNK_PREVIEW}"
grep -q "\"chunkId\": \"${FIRST_CHUNK_ID}\"" "${CHUNK_PREVIEW}"
grep -q '"sourcePath": "kb/raw/facts/onboarding.md"' "${CHUNK_PREVIEW}"

node "${WORKSPACE_DIR}/tools/message_intake.mjs" \
  --conversationId "cid-test" \
  --chatType group \
  --text "请帮我提个 yeying-rag 的 issue：修复知识检索漂移" >"${INTAKE_PREVIEW}"
grep -q '"intent": "issue"' "${INTAKE_PREVIEW}"
grep -q '"owner": "sheng1feng"' "${INTAKE_PREVIEW}"
grep -q '"repo": "yeying-rag-rebase"' "${INTAKE_PREVIEW}"

node "${WORKSPACE_DIR}/tools/dingtalk_calendar_event.mjs" \
  --organizerUserId demo-user \
  --summary "机器人质量修正讨论" \
  --start "2026-03-10T15:00:00+08:00" \
  --end "2026-03-10T15:30:00+08:00" \
  --attendees "user_a,user_b" \
  --onlineMeeting >"${CAL_PREVIEW}"

grep -q '"mode": "preview"' "${CAL_PREVIEW}"
grep -q '"organizerUserId": "demo-user"' "${CAL_PREVIEW}"
grep -q '"summary": "机器人质量修正讨论"' "${CAL_PREVIEW}"
grep -q '"onlineMeetingInfo"' "${CAL_PREVIEW}"

SENDER_INFO="$(mktemp)"
PENDING_SCOPE_SENDER_ID="demo-sender" node "${WORKSPACE_DIR}/tools/resolve_dingtalk_sender.mjs" >"${SENDER_INFO}"
grep -q '"ok": true' "${SENDER_INFO}"
grep -q '"senderId"' "${SENDER_INFO}"

node "${WORKSPACE_DIR}/tools/dingtalk_group_send.mjs" \
  --text "[TEST群通知] 预览消息" >"${GROUP_PREVIEW}"
grep -q '"mode": "preview"' "${GROUP_PREVIEW}"
grep -q '"openConversationId"' "${GROUP_PREVIEW}"

echo "[ok] OpenClaw tool preview verify passed"
