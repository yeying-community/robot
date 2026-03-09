---
doc_id: dd-rollback-policy
title: 清理与回滚策略
project: dd-bot
owner: platform
updated_at: 2026-03-08
applicable_roles:
  - engineer
  - mentor
tags:
  - rollback
  - cleanup
  - policy
review_status: approved
---

# 清理与回滚策略

## 1. 测试数据原则

- 测试 issue 应显式带测试标记
- 测试日程应显式带测试标记
- 测试完成后应尽快清理

## 2. GitHub 清理

- 默认关闭测试 issue
- 不做硬删除
- 返回 issue 编号和链接

## 3. 钉钉日程清理

- 删除测试日程时，应使用组织者身份
- 删除成功后，参与人日历中的该测试日程也应消失

## 4. 群里为什么看不到日程

- 当前通过日程 API 创建的是用户日历事件
- 它不会自动在研发群里发一条“群消息”
- 用户通常应在自己的钉钉日历 / 会议入口看到该事件
