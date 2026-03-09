---
doc_id: dd-wiki-draft-example
title: Wiki 草稿示例
project: dd-bot
owner: enablement
updated_at: 2026-03-07
applicable_roles:
  - engineer
  - mentor
tags:
  - wiki
  - example
review_status: approved
---

# Wiki 草稿示例

## 标题

dd-bot 新人开发环境配置说明

## 空间 / 分类建议

平台空间 / 新人入门分类

## 背景

研发群中多次出现关于本地环境配置的重复提问，需要整理成统一文档。

## 结论

当前推荐基线为 `Node.js 22+`，在 `example/example_dd/` 下复制 `.env.local` 并使用脚本启动。

## 操作步骤 / 建议

1. 安装 `Node.js 22+`
2. 复制 `config/env.example` 为 `.env.local`
3. 执行 `bash scripts/configure_openclaw_dingtalk.sh`
4. 执行 `bash scripts/run_openclaw_gateway.sh`

## 注意事项

- 当前正式主线是 OpenClaw，不是实验版 Express 服务
- GitHub Issue 与钉钉日程已支持真实写入，但必须先预览再确认
- 公司 Wiki 仍然保持草稿态

## 待补充项

- 权限申请流程
- 真实钉钉群联调注意事项

## 来源

- `kb/raw/facts/onboarding.md`
- `kb/raw/facts/project-map.md`
