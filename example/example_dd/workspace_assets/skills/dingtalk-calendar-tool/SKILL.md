---
name: dingtalk-calendar-tool
description: |
  Use for real DingTalk calendar previews and creation. Supports attendees and online meeting. Preview first; execute only after explicit confirmation.
---

# DingTalk Calendar Tool

Activate this skill when the user wants to:

- 生成日程预览
- 创建真实钉钉日程
- 讨论会议时间、参与人、是否线上会议

## Read first

- `knowledge/dingtalk-calendar-integration.md`
- `knowledge/meeting-template.md`
- `knowledge/meeting-preview-example.md`
- `knowledge/tool-execution-policy.md`

## Tool path

Use the workspace tool:

```bash
node tools/dingtalk_calendar_event.mjs ...
```

## Required flow

1. Run `node tools/message_intake.mjs --text "..."` first.
2. Build a preview first.
3. Make sure these fields are known:
   - summary
   - start
   - end
4. Also ask / confirm when needed:
   - attendees
   - online meeting
   - location
5. Only after explicit confirmation, add `--execute`.
6. If organizer user id is not explicitly given, prefer the current DingTalk message sender as organizer.
7. If the user wants the group to visibly know the meeting was created, add a short group confirmation after success.

## Important note

For calendar creation, you should consider:

- 是否需要添加参与人
- 是否需要钉钉线上会议

If the user did not specify them, include them under “待确认项”.

## Organizer default

The workspace calendar tool can auto-resolve the organizer from the most recent DingTalk session sender metadata.
Use explicit `--organizerUserId` only when the user wants someone other than the current sender to organize the meeting.

## Group confirmation

If you need a visible confirmation in the current group, call the calendar tool with:

```bash
node tools/dingtalk_calendar_event.mjs ... --execute --notifyCurrentGroup
```

That creates the real event and then sends a short follow-up message to the current DingTalk group.
