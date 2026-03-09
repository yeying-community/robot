---
doc_id: dd-dev-env-standard
title: 研发环境基线标准
project: dd-bot
owner: platform
updated_at: 2026-03-07
applicable_roles:
  - newcomer
  - engineer
tags:
  - 环境
  - 基线
  - Node
  - IDE
review_status: approved
---

# 研发环境基线标准

## 1. 适用范围

本标准适用于 `bot/example/example_dd` 当前阶段的本地研发与联调。

## 2. 环境基线

- `Node.js 22+`
- `npm 10+`
- 推荐在 `WSL Ubuntu` 或标准 Linux 开发环境中运行

## 3. 目录与配置

- 项目目录：`example/example_dd/`
- 本地配置文件：`.env.local`
- OpenClaw 工作区：`~/.openclaw/workspace-dd-bot`

## 4. 当前推荐运行方式

当前正式主线不是自定义 Express 服务，而是：

1. 配置 OpenClaw：`bash scripts/configure_openclaw_dingtalk.sh`
2. 启动 Gateway：`bash scripts/run_openclaw_gateway.sh`

## 5. 本地实验方式

当前不再保留单独的本地实验服务主线；如需调试，优先通过：

1. `bash scripts/sync_openclaw_workspace.sh`
2. `bash scripts/verify_openclaw_*.sh`

以及直接查看 OpenClaw session / logs。
