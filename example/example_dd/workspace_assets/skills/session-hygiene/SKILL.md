---
name: session-hygiene
description: |
  Use when the DingTalk group session is polluted by stale assistant replies and you need to preview/reset the current group session safely.
---

# Session Hygiene

Activate this skill when:

- the assistant keeps repeating outdated capability claims
- permissions or tools were fixed, but the group keeps acting as if they were still broken
- the user wants to clear the current group context only

## Read first

- `knowledge/session-hygiene.md`
- `knowledge/rollback-policy.md`

## Tool path

Preview reset:

```bash
node tools/reset_current_dingtalk_group_session.mjs
```

Execute reset:

```bash
node tools/reset_current_dingtalk_group_session.mjs --execute
```

## Rules

- Reset only the current DingTalk group session, not all sessions.
- Archive before delete.
- Tell the user that knowledge / skills / tools remain intact after reset.
