---
doc_id: dd-tooling-boundary
title: 工具与写操作边界
project: dd-bot
owner: platform
updated_at: 2026-03-07
applicable_roles:
  - engineer
  - mentor
tags:
  - 工具
  - 边界
review_status: approved
---

# 工具与写操作边界

## 当前已经具备

- 钉钉群消息接入
- OpenClaw 智能体运行
- Router 主模型 + DashScope fallback
- workspace 知识问答
- 本地知识检索工具（`knowledge_search.mjs`）
- 知识 chunk / doc 拉取工具（`knowledge_get.mjs`）
- 本地索引构建 / 状态工具（`knowledge_index.mjs`）
- 知识缺口记录工具（`knowledge_gap.mjs`）
- 审计日志工具（`audit_log.mjs`）
- 群聊策略 / 意图抽取工具（`message_intake.mjs`）
- GitHub Issue 真实创建 / 关闭
- 钉钉日程真实创建 / 删除
- 建会成功后向当前群发送确认消息
- 待执行动作保存与确认执行

## 当前尚未真正具备

- 公司 Wiki 真实发布

## 当前默认策略

- 先给草稿
- 先给预览
- 问答先检索，再回答
- 不默认声称“已经创建 / 已经发布 / 已经提交”
