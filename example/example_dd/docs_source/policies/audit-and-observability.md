---
doc_id: dd-audit-observability
title: 审计与可观测性说明
project: dd-bot
owner: platform
updated_at: 2026-03-09
applicable_roles:
  - engineer
  - mentor
tags:
  - audit
  - observability
  - logging
review_status: approved
---

# 审计与可观测性说明

## 1. 为什么需要审计

- 方便排查机器人为什么回复 / 为什么没回复
- 方便排查为什么创建了 issue / 日程
- 方便排查知识不足时是否已进入待补知识队列

## 2. 当前至少记录

- 消息意图判断结果
- 知识检索命中 / 未命中结果
- pending action 创建 / 执行 / 取消
- 确认权限拒绝
- 知识缺口记录

## 3. 当前工具

- `tools/audit_log.mjs`

## 4. 当前存储位置

- `state/audit/events.jsonl`

## 5. 使用原则

- 审计是为了可追溯，不是为了把所有用户内容暴露给无关人员
- 需要注意脱敏，不泄露密钥、令牌、敏感数据

