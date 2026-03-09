#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "${PROJECT_DIR}"

bash scripts/sync_openclaw_workspace.sh >/dev/null

WORKSPACE_DIR="${OPENCLAW_DD_WORKSPACE:-$HOME/.openclaw/workspace-dd-bot}"
HOOK_FILE="${WORKSPACE_DIR}/hooks/confirmation-bridge/handler.ts"
AUDIT_FILE="${WORKSPACE_DIR}/state/audit/events.jsonl"

export PENDING_SCOPE_SESSION_KEY="agent:test:dingtalk:group:cid-test"
export PENDING_SCOPE_CONVERSATION_ID="cid-test"
export PENDING_SCOPE_ACCOUNT_ID="default"
export PENDING_SCOPE_CHAT_TYPE="group"
export PENDING_SCOPE_LABEL="test-group"
export PENDING_SCOPE_SENDER_ID="user-requester"
export PENDING_SCOPE_SENDER_LABEL="requester"

PENDING_OUT="$(mktemp)"
CLEAR_OUT="$(mktemp)"
DENY_OUT="$(mktemp)"
cleanup() {
  rm -f "${PENDING_OUT}" "${CLEAR_OUT}" "${DENY_OUT}"
}
trap cleanup EXIT

node "${WORKSPACE_DIR}/tools/pending_action.mjs" --action clear >/dev/null 2>&1 || true
rm -f "${AUDIT_FILE}"

npx --yes tsx -e "
import handler from '${HOOK_FILE}';
(async () => {
  await handler({
    type: 'message',
    action: 'sent',
    sessionKey: process.env.PENDING_SCOPE_SESSION_KEY,
    context: {
      channelId: 'dingtalk',
      accountId: 'default',
      conversationId: 'cid-test',
      success: true,
      isGroup: true,
      groupId: 'cid-test',
      content: '## 主题\\n\\n测试 hook\\n\\n## 时间\\n\\n明天 9:00 - 10:00\\n\\n## 组织者\\n\\n当前发起人\\n\\n## 参与人建议\\n\\n- demo_user_a\\n- demo_user_b\\n\\n## 会议形式\\n\\n线上会议\\n\\n## 会议目标\\n\\n校验 hook 预览转 pending'
    }
  });
})();
" >/dev/null

node "${WORKSPACE_DIR}/tools/pending_action.mjs" --action get >"${PENDING_OUT}"
grep -q '"ok": true' "${PENDING_OUT}"
grep -q '"kind": "dingtalk_calendar_create"' "${PENDING_OUT}"
grep -q '"requester"' "${PENDING_OUT}"

export PENDING_SCOPE_SENDER_ID="user-other"
export PENDING_SCOPE_SENDER_LABEL="other-user"

npx --yes tsx -e "
import handler from '${HOOK_FILE}';
(async () => {
  await handler({
    type: 'message',
    action: 'received',
    sessionKey: process.env.PENDING_SCOPE_SESSION_KEY,
    context: {
      channelId: 'dingtalk',
      accountId: 'default',
      conversationId: 'cid-test',
      content: '确认执行',
      isGroup: true,
      groupId: 'cid-test'
    }
  });
})();
" >/dev/null

node "${WORKSPACE_DIR}/tools/pending_action.mjs" --action get >"${DENY_OUT}"
grep -q '"ok": true' "${DENY_OUT}"
grep -q '"type":"confirmation_bridge.authorization_denied"' "${AUDIT_FILE}"

export PENDING_SCOPE_SENDER_ID="mentor-demo"
export PENDING_SCOPE_SENDER_LABEL="mentor-demo"

npx --yes tsx -e "
import handler from '${HOOK_FILE}';
(async () => {
  await handler({
    type: 'message',
    action: 'received',
    sessionKey: process.env.PENDING_SCOPE_SESSION_KEY,
    context: {
      channelId: 'dingtalk',
      accountId: 'default',
      conversationId: 'cid-test',
      content: '取消',
      isGroup: true,
      groupId: 'cid-test'
    }
  });
})();
" >/dev/null

node "${WORKSPACE_DIR}/tools/pending_action.mjs" --action get >"${CLEAR_OUT}" || true
grep -q '"ok": false' "${CLEAR_OUT}"
grep -q '"type":"confirmation_bridge.cancel"' "${AUDIT_FILE}"

unset PENDING_SCOPE_SESSION_KEY
unset PENDING_SCOPE_CONVERSATION_ID
unset PENDING_SCOPE_ACCOUNT_ID
unset PENDING_SCOPE_CHAT_TYPE
unset PENDING_SCOPE_LABEL
unset PENDING_SCOPE_SENDER_ID
unset PENDING_SCOPE_SENDER_LABEL

echo "[ok] confirmation bridge hook verify passed"
