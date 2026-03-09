---
doc_id: dd-issue-draft-example
title: Issue 草稿示例
project: dd-bot
owner: rd-management
updated_at: 2026-03-07
applicable_roles:
  - engineer
  - mentor
tags:
  - issue
  - example
review_status: approved
---

# Issue 草稿示例

## 标题

研发群机器人未按项目知识回答新人环境配置问题

## 仓库

`sheng1feng/yeying-rag-rebase`

## 背景

用户在研发群询问新人开发环境配置方式时，机器人给出了与项目事实不一致的泛化回答。

## 现象 / 问题

- 回答中出现了 `Node.js 18+`
- 回答中提到了当前项目不存在的 `docker-compose up`
- 没有引用项目知识文档

## 影响

- 降低新人对机器人回答的信任
- 可能引导错误的本地环境配置

## 建议优先级

高。因为它直接影响新人 onboarding 场景的可用性。

## 标签 / 指派建议

- `bot`
- `knowledge`
- 指派建议：机器人维护者

## 待确认项

- 是否仅环境类问题受影响
- 是否需要补更多知识文档
- 是否需要加更强的来源约束

## 来源

- 研发群关于环境配置的讨论
- `kb/raw/facts/onboarding.md`
