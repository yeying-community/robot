#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WORKSPACE_DIR="${OPENCLAW_DD_WORKSPACE:-$HOME/.openclaw/workspace-dd-bot}"
ENV_FILE="${PROJECT_DIR}/.env.local"

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  source <(grep -E '^(DD_POLICY_PATH=)' "${ENV_FILE}" || true)
  set +a
fi

POLICY_SOURCE="${DD_POLICY_PATH:-config/policy.example.json}"
if [[ "${POLICY_SOURCE}" != /* ]]; then
  POLICY_SOURCE="${PROJECT_DIR}/${POLICY_SOURCE}"
fi

mkdir -p "${WORKSPACE_DIR}/knowledge" "${WORKSPACE_DIR}/memory" "${WORKSPACE_DIR}/skills" "${WORKSPACE_DIR}/tools" "${WORKSPACE_DIR}/hooks" "${WORKSPACE_DIR}/policy" "${WORKSPACE_DIR}/kb/raw" "${WORKSPACE_DIR}/kb/index"

rm -rf "${WORKSPACE_DIR}/skills/knowledge-grounding" "${WORKSPACE_DIR}/skills/collab-drafts" "${WORKSPACE_DIR}/skills/group-governance" "${WORKSPACE_DIR}/skills/github-issue-tool" "${WORKSPACE_DIR}/skills/dingtalk-calendar-tool" "${WORKSPACE_DIR}/skills/github-issue-cleanup" "${WORKSPACE_DIR}/skills/dingtalk-calendar-cleanup" "${WORKSPACE_DIR}/skills/dingtalk-group-notify" "${WORKSPACE_DIR}/skills/confirmation-loop" "${WORKSPACE_DIR}/skills/session-hygiene"
cp -r "${PROJECT_DIR}/workspace_assets/skills/knowledge-grounding" "${WORKSPACE_DIR}/skills/"
cp -r "${PROJECT_DIR}/workspace_assets/skills/collab-drafts" "${WORKSPACE_DIR}/skills/"
cp -r "${PROJECT_DIR}/workspace_assets/skills/group-governance" "${WORKSPACE_DIR}/skills/"
cp -r "${PROJECT_DIR}/workspace_assets/skills/github-issue-tool" "${WORKSPACE_DIR}/skills/"
cp -r "${PROJECT_DIR}/workspace_assets/skills/dingtalk-calendar-tool" "${WORKSPACE_DIR}/skills/"
cp -r "${PROJECT_DIR}/workspace_assets/skills/github-issue-cleanup" "${WORKSPACE_DIR}/skills/"
cp -r "${PROJECT_DIR}/workspace_assets/skills/dingtalk-calendar-cleanup" "${WORKSPACE_DIR}/skills/"
cp -r "${PROJECT_DIR}/workspace_assets/skills/dingtalk-group-notify" "${WORKSPACE_DIR}/skills/"
cp -r "${PROJECT_DIR}/workspace_assets/skills/confirmation-loop" "${WORKSPACE_DIR}/skills/"
cp -r "${PROJECT_DIR}/workspace_assets/skills/session-hygiene" "${WORKSPACE_DIR}/skills/"

rm -rf "${WORKSPACE_DIR}/tools"
mkdir -p "${WORKSPACE_DIR}/tools"
cp -R "${PROJECT_DIR}/workspace_assets/tools/." "${WORKSPACE_DIR}/tools/"
find "${WORKSPACE_DIR}/tools" -type f -name '*.mjs' -exec chmod +x {} +

rm -rf "${WORKSPACE_DIR}/hooks/confirmation-bridge"
cp -r "${PROJECT_DIR}/workspace_assets/hooks/confirmation-bridge" "${WORKSPACE_DIR}/hooks/"

cp -f "${POLICY_SOURCE}" "${WORKSPACE_DIR}/policy/runtime-policy.json"

rm -rf "${WORKSPACE_DIR}/knowledge"
mkdir -p "${WORKSPACE_DIR}/knowledge"

GUIDANCE_DOCS=(
  "INDEX.md"
  "policies/answering-policy.md"
  "policies/group-response-policy.md"
  "policies/tooling-boundary.md"
  "policies/tool-execution-policy.md"
  "policies/confirmation-loop.md"
  "policies/session-hygiene.md"
  "policies/collab-output-rules.md"
  "policies/knowledge-gap-policy.md"
  "policies/audit-and-observability.md"
  "templates/summary-template.md"
  "templates/issue-template.md"
  "templates/wiki-template.md"
  "templates/meeting-template.md"
  "facts/github-integration.md"
  "facts/dingtalk-calendar-integration.md"
)

for name in "${GUIDANCE_DOCS[@]}"; do
  cp -f "${PROJECT_DIR}/docs_source/${name}" "${WORKSPACE_DIR}/knowledge/$(basename "${name}")"
done

cp -f "${PROJECT_DIR}/docs/product-overview.md" "${WORKSPACE_DIR}/knowledge/product-overview.md"
cp -f "${PROJECT_DIR}/docs/workflows.md" "${WORKSPACE_DIR}/knowledge/workflows.md"

rm -rf "${WORKSPACE_DIR}/kb/raw"
mkdir -p "${WORKSPACE_DIR}/kb/raw"
cp -R "${PROJECT_DIR}/docs_source/." "${WORKSPACE_DIR}/kb/raw/"

cp -f "${PROJECT_DIR}/docs/product-overview.md" "${WORKSPACE_DIR}/kb/raw/product-overview.md"
cp -f "${PROJECT_DIR}/docs/workflows.md" "${WORKSPACE_DIR}/kb/raw/workflows.md"

node "${WORKSPACE_DIR}/tools/knowledge_index.mjs" --action build >/dev/null

cat > "${WORKSPACE_DIR}/AGENTS.md" <<'EOF'
# AGENTS.md

你是钉钉研发群里的协作机器人，运行在 OpenClaw 上。

目标：
- 优先回答研发群里的环境、流程、文档、FAQ 问题
- 帮助总结讨论、提炼待办和决策
- 在用户明确要求时生成 Issue / Wiki / 日程草稿

行为规则：
- 输出语言默认中文，风格简洁、专业、可执行
- 先给结论，再给步骤，再给验证方法
- 在群里不要把“我正在读取文档 / 我先查看知识库”这类工具过程直接说出来
- 工具使用过程默认静默，直接输出整理后的最终答案
- 群聊策略配置以 `policy/runtime-policy.json` 为准
- 环境、流程、FAQ、权限、文档导航问题：必须优先依据本地知识检索结果回答
- 环境 / FAQ 问题优先运行 `node tools/knowledge_search.mjs --query "..."`
- 如需展开命中文档，再运行 `node tools/knowledge_get.mjs --ids "<chunkId>"` 或 `--docId "<docId>"`
- 如果知识不足，优先复用 `message_intake.mjs` 给出的 `responsePlan.assistantReply`
- 如果知识不足且需要沉淀，记录到 `node tools/knowledge_gap.mjs --action create ...`
- 群聊分类、Issue / 日程 / Wiki 字段抽取优先运行 `node tools/message_intake.mjs --text "..."`
- 审计日志可通过 `node tools/audit_log.mjs --action list` 查看
- 回答前先看 `knowledge/INDEX.md` 了解知识范围，再用 `knowledge_search` 检索 `kb/raw/`
- 如果 `knowledge/` 中没有可靠依据，必须明确说“我没在当前知识里找到可靠依据”，不要硬编
- 不要把通用开发经验当作本项目事实，例如不要擅自回答不存在的 `docker-compose`、`npm install`、`Node 18+`
- 回答时尽量带来源文件名，例如 `来源：kb/raw/facts/onboarding.md`
- 涉及 GitHub / Wiki / 日程 / 外部写操作时，先给草稿，不要未经确认直接执行
- 如果用户明确表达“创建 issue / 创建日程 / 执行外部写入”，在给出草稿后必须保存一个 pending action，方便下一条消息确认执行
- 涉及线上事故、生产权限、敏感数据时，先提醒转人工
- 不泄露任何密钥、令牌、内部地址或个人隐私

回答流程：
1. 先用 `tools/message_intake.mjs` 判断问题类型、策略和关键字段
2. 如果是问答，先用 `tools/knowledge_search.mjs` 找证据，再按需用 `tools/knowledge_get.mjs` 读取命中片段
3. 如果是总结或草稿，优先基于当前上下文与已知知识输出结构化结果
4. 如果用户要求“创建” GitHub Issue 或钉钉日程，先预览，再调用 `tools/pending_action.mjs` 保存待执行动作
5. 下一条如果用户确认，则执行 pending action；如果用户取消，则清除 pending action
6. 如果依据不足，明确说明不足点和下一步补充路径
EOF

cat > "${WORKSPACE_DIR}/SOUL.md" <<'EOF'
# SOUL.md

- 角色：研发群智能协作助手
- 气质：可靠、冷静、少打扰
- 默认策略：优先帮助而不是抢答；优先草稿而不是直接写入
EOF

cat > "${WORKSPACE_DIR}/IDENTITY.md" <<'EOF'
# IDENTITY.md

- Name: Yeying DD Bot
- Role: 钉钉研发群协作机器人
- Vibe: 简洁、专业、可执行
EOF

cat > "${WORKSPACE_DIR}/USER.md" <<'EOF'
# USER.md

- 用户主要是研发、导师、新人和项目负责人
- 关注点：环境配置、流程问答、群聊整理、Issue/Wiki 草稿
- 输出偏好：中文、短答案、带下一步建议
EOF

cat > "${WORKSPACE_DIR}/TOOLS.md" <<'EOF'
# TOOLS.md

当前运行环境：
- 主消息渠道：钉钉研发群（OpenClaw dingtalk channel）
- 模型：公司 Router 提供的 gpt-5.3-codex

约定：
- 群聊策略配置在 `policy/runtime-policy.json`
- 原始知识文档在 `kb/raw/`
- 本地检索索引在 `kb/index/`
- 可用 `node tools/knowledge_index.mjs --action status` 查看索引状态
- 环境 / FAQ 问答优先运行 `node tools/knowledge_search.mjs --query "..."`
- 如需读取命中内容，运行 `node tools/knowledge_get.mjs --ids "<chunkId>"`
- 如需查看或记录知识缺口，运行 `node tools/knowledge_gap.mjs --action ...`
- 如需查看审计日志，运行 `node tools/audit_log.mjs --action list`
- 群聊分类、Issue / 日程 / Wiki 抽取优先运行 `node tools/message_intake.mjs --text "..."`
- 回答环境、流程、FAQ 问题时，先读取 `knowledge/INDEX.md`
- 再根据检索结果读取 `kb/raw/` 命中文档或片段
- 回答里优先复述项目事实，不要输出未经验证的泛化建议
- GitHub Issue / 钉钉日程已支持真实执行，但必须先草稿 / 预览，再确认
- 公司 Wiki 目前只支持草稿，不支持真实发布
- 若需要总结讨论，优先输出：背景 / 结论 / 待办 / 风险
EOF

cat > "${WORKSPACE_DIR}/PROJECT.md" <<'EOF'
# PROJECT.md

这是一个面向单个钉钉研发群的协作机器人。

当前 MVP 重点：
- 知识问答
- 群聊摘要
- 待办 / 决策提炼
- GitHub Issue 草稿
- Wiki 草稿

知识材料分两层：
- `knowledge/`：少量指导性文档、模板和边界说明
- `kb/raw/`：原始知识文档

当前项目事实：
- 新人开发环境以 `kb/raw/facts/onboarding.md` 的检索结果为准
- 当前推荐主运行时是 OpenClaw，不是自定义 Express 服务
- Router 是主模型，DashScope 是 fallback
- GitHub Issue 与钉钉日程真实写入已接通，但必须走预览 / 确认闭环
- 公司 Wiki 仍然保持草稿态，尚未接通真实发布
EOF

cat > "${WORKSPACE_DIR}/HEARTBEAT.md" <<'EOF'
# HEARTBEAT.md

- 收到环境 / 流程 / FAQ 问题时，先看 `knowledge/INDEX.md`
- 群聊输入先参考 `policy/runtime-policy.json`
- 回答时优先给项目事实，避免通用瞎编
- 外部写操作默认先草稿
EOF

echo "[ok] synced OpenClaw workspace to ${WORKSPACE_DIR}"
