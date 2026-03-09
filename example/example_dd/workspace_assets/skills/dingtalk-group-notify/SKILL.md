---
name: dingtalk-group-notify
description: |
  Use for proactively sending a short confirmation message back to the current DingTalk group, especially after successful tool actions like calendar creation.
---

# DingTalk Group Notify

Use this skill when you need to send a short confirmation message to the current DingTalk group.

Tool:

```bash
node tools/dingtalk_group_send.mjs --text "..." --execute
```

Rules:

- Keep the confirmation short.
- Include key result fields only.
- Use explicit test wording for smoke tests.
