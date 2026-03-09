#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "${PROJECT_DIR}"

bash scripts/sync_openclaw_workspace.sh >/dev/null

ISSUE_OUT="$(mktemp)"
SUMMARY_OUT="$(mktemp)"
cleanup() {
  rm -f "${ISSUE_OUT}" "${SUMMARY_OUT}"
}
trap cleanup EXIT

openclaw agent \
  --local \
  --to +15555550123 \
  --message "请根据下面讨论生成 Issue 草稿：用户反馈研发群机器人对新人环境问题回答不准确，需要修正知识约束。请严格使用项目草稿结构。" \
  --thinking off \
  --timeout 120 \
  --json >"${ISSUE_OUT}"

grep -Eq 'Issue 草稿|## 标题' "${ISSUE_OUT}"
grep -Eq '## 仓库' "${ISSUE_OUT}"
grep -Eq '背景' "${ISSUE_OUT}"
grep -Eq '结论|现象|问题描述' "${ISSUE_OUT}"
grep -Eq '待办|待办事项|验证方法' "${ISSUE_OUT}"
grep -Eq '风险|待确认项' "${ISSUE_OUT}"

openclaw agent \
  --local \
  --to +15555550123 \
  --message "请总结这段讨论：1）主模型 Router 已额度耗尽；2）系统自动切到了 DashScope；3）群消息和回复链路已通。请严格使用项目总结模板。" \
  --thinking off \
  --timeout 120 \
  --json >"${SUMMARY_OUT}"

grep -Eq '结论' "${SUMMARY_OUT}"
grep -Eq '背景' "${SUMMARY_OUT}"
grep -Eq '待办' "${SUMMARY_OUT}"
grep -Eq '风险' "${SUMMARY_OUT}"

echo "[ok] OpenClaw draft verify passed"
