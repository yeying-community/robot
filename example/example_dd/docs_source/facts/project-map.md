---
doc_id: dd-project-map
title: dd-bot 项目结构导航
project: dd-bot
owner: platform
updated_at: 2026-03-07
applicable_roles:
  - newcomer
  - engineer
tags:
  - 项目结构
  - 导航
  - OpenClaw
review_status: approved
---

# dd-bot 项目结构导航

## 1. 业务文档

- `docs/`：产品、架构、流程、路线图
- `docs_source/`：知识原始文档作者目录，会同步到 workspace 的 `kb/raw/`
  - `facts/`：事实知识
  - `policies/`：规则与边界
  - `playbooks/`：协作打法
  - `templates/`：模板
  - `examples/`：示例

## 2. OpenClaw 运行脚本

- `scripts/configure_openclaw_dingtalk.sh`
- `scripts/run_openclaw_gateway.sh`
- `scripts/sync_openclaw_workspace.sh`

## 3. 本地实验骨架

- `workspace_assets/skills/`：OpenClaw workspace skills
- `workspace_assets/tools/`：本地检索、群聊策略、真实工具与回滚工具
- `workspace_assets/hooks/`：确认桥接 hook
- `kb/README.md`：本地知识目录分层说明

## 4. 当前推荐主线

如果用户问“这个项目现在应该怎么启动”，优先回答：

1. 先跑 `bash scripts/configure_openclaw_dingtalk.sh`
2. 再跑 `bash scripts/run_openclaw_gateway.sh`

不要再寻找或依赖旧的 `src/` 本地实验服务。
