---
doc_id: dd-onboarding-dev-setup
title: 新人开发环境配置
project: dd-bot
owner: platform
updated_at: 2026-03-07
applicable_roles:
  - newcomer
  - engineer
tags:
  - onboarding
  - 环境
  - 配置
  - Node
review_status: approved
---

# 新人开发环境配置

## 准备步骤

1. 安装 `Node.js 22+`
2. 在 `example/example_dd/` 下复制 `.env.template` 为 `.env.local`
3. 执行 `bash scripts/configure_openclaw_dingtalk.sh`
4. 执行 `bash scripts/run_openclaw_gateway.sh`
5. 如需自定义群策略，可修改 `config/policy.example.json` 或在 `.env.local` 中覆盖 `DD_POLICY_PATH`

## 本地验证

- 用 `openclaw health` 检查 Gateway 状态
- 用 `openclaw channels status` 检查 DingTalk channel 状态
- 用 `bash scripts/verify_openclaw_grounding.sh` 做知识问答回归

## 常见说明

- 第一版本地环境不依赖代理，也不依赖 WhatsApp
- DingTalk、GitHub、Wiki 的真实密钥先写到 `.env.local`
- 当前主线是 OpenClaw，不是自定义本地服务
- GitHub Issue 与钉钉日程支持真实写入，但默认仍先走草稿和预览
- 问答默认先走本地检索，再基于命中文档回答
