---
doc_id: dd-dingtalk-calendar-integration
title: 钉钉日程集成说明
project: dd-bot
owner: platform
updated_at: 2026-03-07
applicable_roles:
  - engineer
  - mentor
tags:
  - dingtalk
  - calendar
  - integration
review_status: approved
---

# 钉钉日程集成说明

## 当前能力

- 可以生成日程预览
- 可以在明确确认后调用真实钉钉日程 API 创建事件
- 可以在创建成功后向当前研发群发送一条确认消息

## 所需配置

- `DINGTALK_CLIENT_ID`
- `DINGTALK_CLIENT_SECRET`
- `DINGTALK_CALENDAR_DEFAULT_USER_ID`
- `DINGTALK_CALENDAR_DEFAULT_ID`（默认 `primary`）

## 所需权限

- `Calendar.Event.Write`
- `qyapi_get_member`（动态发送人模式推荐）

## 创建日程时必须考虑的字段

- 主题
- 开始时间
- 结束时间
- 时区

## 建议同时考虑的字段

- 参与人
- 是否需要线上会议
- 地点
- 提醒时间

## 当前规则

- 默认先给预览
- 缺少主题或时间时，不直接创建
- 缺少参与人或会议方式时，应在预览里列入待确认项
- 群里确认时，默认只允许发起人或管理员确认 / 取消

## 参与人与会议

日程接入应考虑：

- 是否需要添加参与人
- 是否需要钉钉线上会议

如果用户没有明确说明，默认先在预览里展示“参与人建议”和“是否需要线上会议”的待确认项。

## 当前组织者默认值

当前工具优先使用：

1. 显式传入的 `organizerUserId`
2. 当前 DingTalk 消息发送人的 `sender_id`，并尽量转换成 `unionId`
3. `.env.local` 中的 `DINGTALK_CALENDAR_DEFAULT_USER_ID`

也就是说，当前默认行为已经偏向“谁发起，默认谁来组织会议”。

## 群确认消息

创建日程本身不会自动在研发群里出现一条群消息。

如果希望群里能明显看到“会议已创建”，应在创建成功后额外发送一条确认消息。

当前工具已支持：

- `--notifyCurrentGroup`

它会在建会成功后，向当前 DingTalk 群发送简短确认。
