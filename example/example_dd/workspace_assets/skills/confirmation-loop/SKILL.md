---
name: confirmation-loop
description: |
  Use for preview -> confirm -> execute loops for real write operations like GitHub issue creation and DingTalk calendar creation.
---

# Confirmation Loop

Activate this skill when the user asks to:

- 真正创建 GitHub Issue
- 真正创建钉钉日程
- 确认执行一个预览过的写操作
- 取消一个待执行动作

## Read first

- `knowledge/confirmation-loop.md`
- `knowledge/tool-execution-policy.md`
- `knowledge/rollback-policy.md`

## Tool path

Use:

```bash
node tools/pending_action.mjs --action ...
```

## Required flow

### When user asks to create something

1. Generate the draft / preview first.
2. Always save a pending action in the same turn when the user intent is “创建 / 提交 / 执行” for GitHub issue or DingTalk calendar.
3. Save a pending action:

```bash
node tools/pending_action.mjs \
  --action create \
  --kind github_issue_create|dingtalk_calendar_create \
  --headline "..." \
  --previewNote "..." \
  --paramsJson '{...}'
```

4. Tell the user how to confirm or cancel.

### When user confirms

1. Read current pending action:

```bash
node tools/pending_action.mjs --action get
```

2. If it matches the request, execute:

```bash
node tools/pending_action.mjs --action execute
```

3. Return the result.

### When user cancels

```bash
node tools/pending_action.mjs --action clear
```

## Important rules

- Never do the real write on the first turn if it is a destructive or external side effect.
- Keep one pending action per current DingTalk conversation scope.
- On success, pending action should be cleared.
- On failure, pending action should remain so the user can retry or cancel.
- If the user asked to create and no pending action was saved, the task is incomplete.
- Default confirmer policy is requester-or-admin, not arbitrary group members.
