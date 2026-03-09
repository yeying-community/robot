# dd-bot

`dd-bot` 是 `bot` 仓库下的钉钉研发群机器人实验目录，目标是在一个研发群里先跑通可控的 MVP：  
机器人能读懂群消息、基于知识库回答问题、整理讨论、辅助创建钉钉日程、生成 GitHub Issue 和公司 Wiki 草稿。

## 当前定位

- 这是一个 **钉钉研发群协作机器人**
- 当前只需要支持 **一个研发群**
- 当前主运行时选择 **OpenClaw**
- 钉钉接入选择 **社区 `dingtalk` channel 插件**
- 模型调用选择 **Router 主模型 + DashScope 备用模型**
- 外部系统已经确定：
  - `GitHub Issues`
  - 公司自研 Wiki
  - `钉钉日程`
- 知识库内容需要 **手工建设**
- `yeying-rag` 会作为后续知识中台方向，但 **不是当前 MVP 的强依赖**

## 当前平台约束

- 当前采用的是钉钉**应用机器人**路线
- 根据钉钉官方文档，**群聊里只有 `@机器人` 的消息才会投递给机器人**
- 这意味着：在现有标准应用机器人方案下，无法实现“群里所有消息都自动进入机器人”
- 如果你希望做到“非 `@` 也能自动介入群聊”，那已经不是当前这条应用机器人 + dingtalk channel 插件路线能解决的问题，需要考虑别的产品形态

## 目录说明

```text
bot/example/example_dd/
├── README.md
└── docs/
    ├── README.md
    ├── product-overview.md
    ├── prd.md
    ├── architecture.md
    ├── workflows.md
    ├── kb-and-rag.md
    └── roadmap.md
```

## 推荐阅读顺序

如果你是第一次接手这个目录，建议按下面顺序读：

1. `bot/example/example_dd/docs/OpenClaw_000_need.md`
2. `bot/example/example_dd/docs/product-overview.md`
3. `bot/example/example_dd/docs/prd.md`
4. `bot/example/example_dd/docs/architecture.md`
5. `bot/example/example_dd/docs/workflows.md`
6. `bot/example/example_dd/docs/kb-and-rag.md`
7. `bot/example/example_dd/docs/roadmap.md`

## 当前主线

`钉钉群消息 -> OpenClaw dingtalk channel -> OpenClaw agent + workspace -> Router / DashScope -> 回复 / 草稿 / 外部系统`

机器人第一阶段重点解决四件事：

- 群问答：基于手工维护的知识库给出短答案和来源
- 群整理：把讨论整理为摘要、待办、决策
- 协作草稿：生成 GitHub Issue 和 Wiki 草稿
- 受控写入：在确认后创建钉钉日程、提交 Issue、发布 Wiki

## 开发原则

- **可靠优先**：有证据再回答
- **少打扰**：不对所有消息插话
- **副作用可控**：写外部系统前先确认
- **知识闭环**：高价值群聊沉淀为 Wiki / FAQ 候选
- **先 MVP 后中台**：先在本目录跑通，再逐步抽象到 `yeying-rag`

## 当前结论

- `README` 只做入口，不再承载全部需求细节
- 详细需求、架构和流程文档统一放到 `docs/`
- 当前推荐主线是 **OpenClaw-first**
- 旧的自定义 TypeScript 实验骨架已删除，不再保留双轨实现
- 当前 Phase 2 已开始把知识、规则和协作草稿能力沉淀到 OpenClaw workspace，而不是继续自建 workflow
- 当前已补齐本地知识检索与群聊策略抽取工具：
  - `knowledge_search.mjs`
  - `message_intake.mjs`
- 当前已开始接入真实工具：
  - GitHub Issue 预览 / 创建
  - 钉钉日程预览 / 创建
- GitHub Issue 关闭 / 钉钉日程删除 已接通
- 钉钉建会后向当前群发送确认消息 已接通
- 预览 → 确认 → 执行 → 回滚 闭环 已接通
- 当前群会话污染时可做“只重置当前群 session”而不影响其他会话
- Wiki 仍然保持未接入

## 当前目录结构

当前目录已经收敛为 OpenClaw 主线，核心内容如下：

```text
bot/example/example_dd/
├── config/
│   ├── env.example
│   └── policy.example.json
├── docs_source/
│   ├── facts/
│   ├── policies/
│   ├── playbooks/
│   ├── templates/
│   ├── examples/
│   ├── INDEX.md
│   └── knowledge_manifest.{yaml,json}
├── kb/
│   └── README.md
├── scripts/
│   ├── configure_openclaw_dingtalk.sh
│   ├── run_openclaw_gateway.sh
│   ├── sync_openclaw_workspace.sh
│   └── verify_openclaw_*.sh
├── docs/
└── workspace_assets/
```

### 环境要求

- `Node.js >= 22`

### 快速开始

1. 进入目录：

```bash
cd example/example_dd
```

2. 准备本地配置：

```bash
cp .env.template .env.local
```

3. 配置 OpenClaw + dingtalk 插件 + 模型：

```bash
bash scripts/configure_openclaw_dingtalk.sh
```

4. 启动 OpenClaw Gateway：

```bash
bash scripts/run_openclaw_gateway.sh
```

5. 执行回归自检：

```bash
bash scripts/verify_openclaw_grounding.sh
bash scripts/verify_openclaw_drafts.sh
```

### 使用 OpenClaw 作为主运行时

这是当前推荐的正式做法。如果你希望像社区 `dingtalk` 插件一样，让 `OpenClaw` 充当真正的大脑，而不是继续维护本目录下的自定义 Express 工作流，推荐走下面这条链路：

`DingTalk -> OpenClaw dingtalk channel -> Router model -> OpenClaw agent workspace`

已提供脚本：

```bash
cd example/example_dd
bash scripts/configure_openclaw_dingtalk.sh
bash scripts/run_openclaw_gateway.sh
```

脚本会做这些事：

- 同步 `docs_source/` 和关键产品文档到 `~/.openclaw/workspace-dd-bot`
- 将原始知识文档同步到 `~/.openclaw/workspace-dd-bot/kb/raw`
- 将少量指导性文档同步到 `~/.openclaw/workspace-dd-bot/knowledge`
- 自动构建 `~/.openclaw/workspace-dd-bot/kb/index`
- 同步 workspace skills（知识问答、群聊整理 / 草稿）
- 同步 workspace tools（本地检索、群聊策略、GitHub、钉钉日程、群回执、清理 / 回滚）
- 配置 `agents.defaults.workspace`
- 配置 `Router` provider 和默认模型
- 如果填写了 `DASHSCOPE_API_KEY`，额外配置阿里 `DashScope` 备用模型，并写入 `agents.defaults.model.fallbacks`
- 安装 / 启用社区 `dingtalk` 插件
- 写入 `channels.dingtalk` 配置

当前已经验证通过的链路：

- `openclaw health` 可返回正常状态
- `openclaw channels status` 显示 `DingTalk default: enabled, configured, running`
- 当 `Router` 不可用时，`OpenClaw` 会自动回退到 `dashscope/qwen3-coder-plus`
- GitHub Issue 可真实创建与关闭
- 钉钉日程可真实创建与删除
- 建会后可额外向当前 DingTalk 群发送确认消息
- 支持待执行动作保存、确认执行、取消执行、失败保留待重试
- 问答可先走本地检索，再基于命中文档作答
- 群聊策略、仓库映射、Wiki 空间建议可由 `message_intake.mjs` 统一抽取

启动后可检查：

```bash
openclaw health
openclaw channels status
```

Phase 2 回归验证：

```bash
bash scripts/verify_openclaw_grounding.sh
bash scripts/verify_openclaw_drafts.sh
bash scripts/verify_openclaw_tool_previews.sh
bash scripts/verify_openclaw_confirmation_loop.sh
bash scripts/verify_confirmation_bridge_hook.sh
bash scripts/verify_openclaw_group_scenarios.sh
```

### 当前群上下文被旧错误回答污染时

现在已经提供一个“只重置当前 DingTalk 群会话”的方案：

```bash
node ~/.openclaw/workspace-dd-bot/tools/reset_current_dingtalk_group_session.mjs
node ~/.openclaw/workspace-dd-bot/tools/reset_current_dingtalk_group_session.mjs --execute
```

作用：

- 只清理当前研发群的 session transcript
- 会先归档旧 session，便于排查
- 不影响知识文档、skills、tools，也不影响其他群或主会话

### 当前真实工具能力

当前 workspace tools 已支持：

- 基础治理
  - 本地知识检索
  - 知识 chunk / doc 拉取
  - 群聊策略 / 意图 / 字段抽取
  - 知识缺口记录
  - 审计日志
- GitHub
  - Issue 预览
  - Issue 创建
  - Issue 关闭
- 钉钉日程
  - 日程预览
  - 日程创建
  - 日程删除
  - 当前消息发送人自动作为默认组织者
  - 创建成功后向当前群发送确认消息
- 确认闭环
  - 待执行动作保存
  - 当前会话范围内确认执行
  - 当前会话范围内取消执行
  - 失败后保留待执行动作

### 推荐确认口令

为了让“确认闭环”更稳定，当前建议在群里使用这些明确口令：

- `确认执行`
- `确认创建日程`
- `确认创建 issue`
- `取消`

当前 hook 已经会在消息级别尝试处理这些口令。

### 当前单一执行入口

当前推荐只保留一条“真实写入闭环”入口：

- `hooks/confirmation-bridge`

它负责：

- 从 assistant 草稿中保存 pending action
- 校验当前确认人是否为发起人或管理员
- 执行 / 取消待操作
- 将结果回写到当前 DingTalk 群

### 当前知识目录分层

当前推荐按三层理解：

- `docs_source/`
  - 仓库内的知识原始文档作者目录
- `~/.openclaw/workspace-dd-bot/kb/raw`
  - 运行时原始知识文档目录
- `~/.openclaw/workspace-dd-bot/kb/index`
  - 本地检索索引
- `~/.openclaw/workspace-dd-bot/knowledge`
  - 少量规则、模板、边界说明，不再承载全部原始知识

### 为什么群里未必直接看到日程

钉钉日程 API 创建的是**用户日历事件**，不会天然在研发群里自动冒出一条群消息。

如果希望群里同步看到结果，需要额外发送群确认消息。当前工具链已经支持这条能力。

首次真实群聊联调时，请注意：

- **单聊**：用户直接发消息即可
- **群聊**：必须 `@机器人`，否则钉钉不会把消息投递给机器人

如果你想要“Router 掉了就切到阿里模型”，需要在 `example/example_dd/.env.local` 里再补：

```bash
DASHSCOPE_API_KEY=你的阿里DashScope key
# 可选，默认已经给出：
# DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
# DASHSCOPE_MODEL=qwen3-coder-plus
```

然后重新执行：

```bash
bash scripts/configure_openclaw_dingtalk.sh
```
