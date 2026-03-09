---
doc_id: dd-confirmation-loop
title: 预览确认执行闭环
project: dd-bot
owner: platform
updated_at: 2026-03-08
applicable_roles:
  - engineer
  - mentor
tags:
  - confirmation
  - execution
  - rollback
review_status: approved
---

# 预览确认执行闭环

## 1. 适用场景

- 创建 GitHub Issue
- 创建钉钉日程

## 2. 标准流程

1. 先生成预览 / 草稿
2. 保存待执行动作
3. 明确提示用户如何确认或取消
4. 用户确认后再执行真实写入
5. 返回执行结果
6. 必要时支持清理 / 回滚
7. 默认只允许发起人或管理员确认 / 取消

## 3. 确认语义

推荐识别以下表达：

- `确认创建`
- `确认执行`
- `确认创建 issue`
- `确认创建日程`

取消表达：

- `取消`
- `先别创建`
- `取消执行`

## 4. 结果要求

- 执行成功：返回对象 ID 和链接 / 查看方式
- 执行失败：保留待执行动作并说明原因
- 取消：清除待执行动作并明确告知
