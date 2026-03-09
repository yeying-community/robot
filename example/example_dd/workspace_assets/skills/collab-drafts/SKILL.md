---
name: collab-drafts
description: |
  Use for summary, issue draft, wiki draft, and meeting-preview requests. Produce structured drafts first; do not assume real write access.
---

# Collaboration Drafts

Activate this skill when the user asks to:

- 总结讨论
- 提炼待办 / 决策 / 风险
- 生成 Issue 草稿
- 生成 Wiki 草稿
- 生成日程预览

## Required behavior

1. Prefer structured outputs over long free-form chat.
2. Draft first; do not imply that GitHub / Wiki / DingTalk calendar has already been updated.
3. If required fields are missing, surface them clearly.
4. For create-intent or draft-intent requests, run `node tools/message_intake.mjs --text "..."` first to extract fields and mapped repo / Wiki space.
5. If you need background evidence from knowledge, run `node tools/knowledge_search.mjs --query "..."` first and `node tools/knowledge_get.mjs --ids "<chunkId>"` only for the top hits.
6. For issue/wiki/calendar questions, read these docs when relevant:
   - `knowledge/issue-and-wiki-playbook.md`
   - `knowledge/calendar-and-meeting-policy.md`
   - `knowledge/release-process.md`
   - `knowledge/summary-template.md`
   - `knowledge/summary-playbook.md`
   - `knowledge/issue-template.md`
   - `knowledge/issue-draft-example.md`
   - `knowledge/wiki-template.md`
   - `knowledge/wiki-draft-example.md`
   - `knowledge/meeting-template.md`
   - `knowledge/meeting-preview-example.md`
   - `knowledge/tooling-boundary.md`
   - `knowledge/collab-output-rules.md`
7. Do not say “已创建 / 已提交 / 已发布” unless a real tool call succeeded.
8. Do not narrate tool usage in the final answer.
9. Prefer concise, product-ready output over generic advisory prose.
10. If the user explicitly says “创建 issue / 创建日程 / 提交 / 执行”， do not stop at a draft only:
   - produce the preview
   - then hand off to `confirmation-loop`
   - save a pending action for the current conversation
11. If the draft request reveals a missing knowledge area, also create a knowledge gap record.

## Required output templates

When asked for these outputs, use the exact section headers below whenever possible.

### Summary

- `## 结论`
- `## 背景`
- `## 关键结论`
- `## 待办`
- `## 风险 / 待确认`
- `## 来源`

### Issue Draft

- `## 标题`
- `## 仓库`
- `## 背景`
- `## 现象 / 问题`
- `## 影响`
- `## 建议优先级`
- `## 标签 / 指派建议`
- `## 待确认项`
- `## 来源`

### Wiki Draft

- `## 标题`
- `## 空间 / 分类建议`
- `## 背景`
- `## 结论`
- `## 操作步骤 / 建议`
- `## 注意事项`
- `## 待补充项`
- `## 来源`

### Meeting Preview

- `## 主题`
- `## 时间`
- `## 组织者`
- `## 参与人建议`
- `## 会议形式`
- `## 会议目标`
- `## 待确认项`

## Quality bar

- Prefer output that a mentor could directly forward into the group.
- If there is not enough context, say so in one short sentence and still give a best-effort draft skeleton.
- For create-intent requests, the answer should mention how to confirm or cancel after the pending action is saved.
