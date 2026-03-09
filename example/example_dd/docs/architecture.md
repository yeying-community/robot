# dd-bot 架构设计

## 1. 系统角色

`dd-bot` 当前在整体系统中更准确的角色是：

- **OpenClaw 的业务工作区与部署封装层**
- 而不是继续自建一套独立的机器人主运行时

它负责：

- 提供研发群机器人的业务目标、知识材料和工作区上下文
- 提供 OpenClaw 的配置脚本、workspace 同步脚本和运行脚本
- 约束机器人在研发群里的行为边界与输出风格
- 为后续外部工具接入预留文档与结构

真正的消息接入、会话编排、模型调用和 channel 生命周期由 OpenClaw 负责。

## 2. 外部系统

当前明确接入的外部系统：

- `钉钉`：消息入口、消息回复、群 / 私聊上下文
- `GitHub`：Issue 系统
- 公司自研 Wiki：文档沉淀
- `OpenClaw`：主运行时 / 模型调用编排 / 会话与工作区注入
- `Router`：主模型 provider
- `DashScope`：备用模型 provider
- `yeying-rag`：后续知识检索中台

## 3. 核心模块

当前推荐目录职责：

```text
bot/example/example_dd/
├── README.md
├── docs/
├── config/
├── docs_source/
│   ├── facts/
│   ├── policies/
│   ├── playbooks/
│   ├── templates/
│   ├── examples/
│   ├── INDEX.md
│   └── knowledge_manifest.{yaml,json}
├── scripts/
├── workspace_assets/
└── data/
```

### 3.1 `docs_source/`

职责：

- 维护最小可控知识源
- 作为 OpenClaw workspace 中 `kb/raw/` 的主要来源
- 存放 FAQ、环境配置、流程说明等稳定文档
- 按类别拆分为：
  - `facts/`：事实性知识
  - `policies/`：机器人规则与边界
  - `playbooks/`：流程与协作打法
  - `templates/`：固定输出模板
  - `examples/`：草稿与预览示例

### 3.2 `scripts/`

职责：

- `configure_openclaw_dingtalk.sh`：配置 OpenClaw、Router、DashScope fallback、dingtalk channel
- `sync_openclaw_workspace.sh`：把本目录的知识与角色文件同步到 OpenClaw workspace
- `run_openclaw_gateway.sh`：启动 OpenClaw Gateway
- `verify_openclaw_grounding.sh`：验证知识问答 grounding
- `verify_openclaw_drafts.sh`：验证总结 / 草稿结构
- `verify_openclaw_tool_previews.sh`：验证工具预览
- `verify_openclaw_confirmation_loop.sh`：验证确认执行闭环
- `verify_openclaw_grounding.sh`：验证问答是否受知识约束
- `verify_openclaw_drafts.sh`：验证总结 / 草稿输出结构
- `verify_openclaw_tool_previews.sh`：验证真实工具预览链路

### 3.3 OpenClaw workspace

职责：

- 位于 `~/.openclaw/workspace-dd-bot`
- 注入 `AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、`TOOLS.md`
- 注入 `knowledge/` 指导性文档，作为智能体回答时的重要规则上下文
- 注入 `kb/raw/` 原始文档，作为本地检索数据源
- 注入 `kb/index/` 本地检索索引
- 注入 `skills/`，为知识问答、协作草稿、群聊治理、真实工具调用提供 on-demand 指导
- 注入 `tools/`，承载本地检索、群聊策略、GitHub Issue / 钉钉日程 / 群确认消息 / 清理回滚脚本
- 注入 `policy/runtime-policy.json`，作为群聊治理、仓库映射、管理员确认的运行时事实
- 注入 `state/`，用于保存待执行动作，实现“预览→确认→执行”闭环
- 注入 `state/knowledge-gaps/`，用于保存待补知识项
- 注入 `state/audit/`，用于保存消息与动作审计日志

### 3.4 `workspace_assets/`

职责：

- `skills/`：知识问答、群聊治理、草稿、确认闭环、会话卫生
- `tools/`：本地检索、群聊策略、GitHub、钉钉日程、群回执、pending action、session reset
- `state/knowledge-gaps/`：待补知识项
- `state/audit/`：审计日志
- `hooks/`：单一确认桥接入口

## 4. 运行时数据分层

系统中至少要分开 4 类数据：

### 4.1 长期知识

- 新人手册
- 流程文档
- FAQ
- 已审核 Wiki

### 4.2 运行态消息

- 群消息原文
- 最近上下文
- 线程状态
- 用户身份信息

### 4.3 沉淀草稿

- 摘要
- 决策记录
- Issue 草稿
- Wiki 草稿
- 日程预览

### 4.4 运行态治理数据

- 待执行动作
- 待补知识项
- 审计事件日志

## 5. OpenClaw-first 数据流

当前推荐主链路：

`DingTalk -> 社区 dingtalk channel -> OpenClaw Gateway -> Router 主模型 / DashScope fallback -> 群回复`

辅助链路：

- `docs_source/ -> sync_openclaw_workspace.sh -> ~/.openclaw/workspace-dd-bot/kb/raw`
- `guidance docs -> sync_openclaw_workspace.sh -> ~/.openclaw/workspace-dd-bot/knowledge`
- `kb/raw -> tools/knowledge_index.mjs -> kb/index`
- `docs_source/knowledge_manifest.json -> tools/knowledge_search.mjs -> 本地检索结果`
- `config/policy.example.json -> ~/.openclaw/workspace-dd-bot/policy/runtime-policy.json -> tools/message_intake.mjs / confirmation-bridge hook`
- `docs/*.md -> workspace 角色与项目上下文`

## 6. 后续工具边界

后续建议补的工具 / 连接器能力：

- `GitHub`：Issue 草稿与提交（已接入）
- 公司 `Wiki`：草稿与发布（未接入）
- `钉钉日程`：预览、创建、删除、群回执（已接入）
- `yeying-rag`：知识检索 provider
- `Pending Action State`：当前会话范围内的待执行动作（已接入）

## 7. 日志与审计

当前至少要记录：

- Gateway 是否启动成功
- DingTalk channel 是否连通
- 当前主模型与 fallback 是否生效
- 智能体 workspace 是否同步到最新

## 8. 架构原则

- OpenClaw 优先，不重复自建机器人主脑
- 文档与 workspace 同步优先于复杂代码抽象
- 主模型失败时要能自动 fallback
- 为 `yeying-rag` 与外部工具接入预留清晰边界
