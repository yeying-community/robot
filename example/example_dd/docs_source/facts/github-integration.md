---
doc_id: dd-github-integration
title: GitHub Issue 集成说明
project: dd-bot
owner: platform
updated_at: 2026-03-07
applicable_roles:
  - engineer
  - mentor
tags:
  - github
  - issue
  - integration
review_status: approved
---

# GitHub Issue 集成说明

## 当前能力

- 可以生成 Issue 草稿
- 可以在明确确认后创建真实 GitHub Issue

## 所需配置

- `GITHUB_TOKEN`
- `GITHUB_DEFAULT_OWNER`
- `GITHUB_DEFAULT_REPO`

当前测试仓库：

- `GITHUB_DEFAULT_OWNER=sheng1feng`
- `GITHUB_DEFAULT_REPO=yeying-rag-rebase`

## 当前规则

- 默认先预览
- 只有用户明确确认后才执行真实创建
- 如果仓库信息不明确，需要先追问
- 群里确认时，默认只允许发起人或管理员确认 / 取消
- 如果策略文件里存在仓库映射，应优先使用策略映射

## 真实创建结果

真实创建成功后，应返回：

- issue 编号
- issue 链接
- 使用的仓库
