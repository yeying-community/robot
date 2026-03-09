---
doc_id: dd-knowledge-index
title: dd-bot 知识索引
project: dd-bot
owner: platform
updated_at: 2026-03-07
applicable_roles:
  - newcomer
  - engineer
  - mentor
tags:
  - index
  - knowledge
  - 文档导航
review_status: approved
---

# dd-bot 知识索引

回答研发群问题时，优先参考下面这些文档：

作者侧目录分层：

- `facts/`：事实知识
- `policies/`：规则与边界
- `playbooks/`：协作打法
- `templates/`：模板
- `examples/`：示例

## 1. 环境与本地开发

- `onboarding.md`
  - 新人开发环境配置
  - 本地验证方法
  - `.env.local`、`scripts/configure_openclaw_dingtalk.sh`、`scripts/run_openclaw_gateway.sh`
- `knowledge_manifest.json`
  - 本地检索工具使用的机器可读索引
  - topic -> 文档范围、authority 权重

## 2. 常见问题

- `faq.md`
  - 权限申请
  - 文档沉淀
  - Bug 讨论后如何生成 Issue 草稿
- `access-and-permission.md`
  - 账号与权限边界
  - 机器人不能直接开权限

## 3. 协作与沉淀

- `release-process.md`
  - 讨论之后应该先整理、再草稿、再确认写入
- `summary-playbook.md`
  - 总结时优先提炼什么、弱化什么
- `summary-template.md`
  - 群聊总结固定结构
- `issue-template.md`
  - GitHub Issue 草稿固定结构
- `issue-draft-example.md`
  - Issue 草稿参考示例
- `wiki-template.md`
  - Wiki 草稿固定结构
- `wiki-draft-example.md`
  - Wiki 草稿参考示例
- `meeting-template.md`
  - 会议 / 日程预览固定结构
- `meeting-preview-example.md`
  - 会议预览参考示例
- `issue-and-wiki-playbook.md`
  - Issue / Wiki 草稿约定
- `calendar-and-meeting-policy.md`
  - 日程与会议策略
- `tooling-boundary.md`
  - 当前已接通 / 未接通的能力边界
- `collab-output-rules.md`
  - 草稿产出时的全局规则
- `github-integration.md`
  - GitHub Issue 预览 / 创建规则
- `dingtalk-calendar-integration.md`
  - 钉钉日程预览 / 创建规则
- `tool-execution-policy.md`
  - 外部工具执行策略
- `rollback-policy.md`
  - 测试数据清理与回滚规则
- `session-hygiene.md`
  - 群会话污染时如何只重置当前群上下文
- `knowledge-gap-policy.md`
  - 知识不足时如何记录待补知识项
- `audit-and-observability.md`
  - 审计日志和可追溯规则

## 4. 产品上下文

- `product-overview.md`
  - 机器人定位、范围、非目标、产品原则
- `group-response-policy.md`
  - 群聊里什么时候该答、什么时候不该打扰

## 5. 工作流参考

- `workflows.md`
  - 问答、总结、Issue、Wiki、日程处理逻辑

## 回答规则

1. 遇到环境、流程、FAQ 问题，先根据这些文档回答
2. 优先使用本地检索结果，再读具体文档
3. 如需展开命中文档，优先读取命中 chunk / doc，而不是全量加载所有原始文档
4. 如果文档里没有，不要编造“通用最佳实践”冒充项目事实
5. 回答时尽量带来源文件名
6. 如果文档不足，明确说“我没在当前知识里找到可靠依据”
