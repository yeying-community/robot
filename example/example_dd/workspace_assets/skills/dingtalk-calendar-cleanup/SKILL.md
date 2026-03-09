---
name: dingtalk-calendar-cleanup
description: |
  Use for deleting DingTalk calendar test events after verification.
---

# DingTalk Calendar Cleanup

Use this skill when the user asks to:

- 删除测试日程
- 清理测试会议
- 回滚日程创建

Use:

```bash
node tools/dingtalk_calendar_delete.mjs --eventId <eventId> --execute
```

Rules:

- Prefer using the organizer identity.
- Deleting as organizer removes the event for participants too.
- Keep the response short and confirm the deleted event ID.
