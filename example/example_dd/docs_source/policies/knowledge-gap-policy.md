---
doc_id: dd-knowledge-gap-policy
title: 知识缺口与待补知识策略
project: dd-bot
owner: platform
updated_at: 2026-03-09
applicable_roles:
  - engineer
  - mentor
tags:
  - knowledge
  - gap
  - escalation
review_status: approved
---

# 知识缺口与待补知识策略

## 1. 什么叫知识缺口

以下场景都应视为知识缺口候选：

- 当前知识库没有命中可靠依据
- 只命中到模糊相关内容，不能直接下结论
- 同一类问题在群里反复出现，但仍没有稳定文档

## 2. 默认动作

- 先明确说当前知识不足
- 再给保守建议
- 再记录一条待补知识项

## 3. 待补知识项至少记录

- 原问题
- 群 / 会话范围
- 发起人
- 主题
- 当前检索结果摘要
- 建议下一步动作

## 4. 什么时候可以关闭

- 已补充正式知识文档
- 或已确认该问题不应进入知识库

## 5. 当前工具

- `tools/knowledge_gap.mjs`

