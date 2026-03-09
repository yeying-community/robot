---
name: knowledge-grounding
description: |
  Use for environment, process, FAQ, permission, and project-navigation questions in the DingTalk R&D group. Read knowledge docs first, answer with project facts, and cite sources.
---

# Knowledge Grounding

Activate this skill when the user asks about:

- 环境配置
- 本地开发启动
- 权限申请
- 流程说明
- FAQ
- 文档导航
- “这个项目怎么跑 / 怎么配 / 去哪看”

## Required behavior

1. Read `knowledge/INDEX.md` first to understand the available scope.
2. Run `node tools/knowledge_search.mjs --query "..."` first.
3. If you need more detail, run `node tools/knowledge_get.mjs --ids "<chunkId>"` or `--docId "<docId>"`.
4. Answer with **project facts**, not generic best practices.
5. If the docs do not support a claim, say the current knowledge is insufficient.
6. Include `来源：kb/raw/<file>.md` when possible.
7. When knowledge is insufficient, prefer the fallback copy from `message_intake.mjs` response plan.
8. For recurring or important unknowns, record a knowledge gap with `node tools/knowledge_gap.mjs --action create ...`.

## Output style

- Do not narrate tool usage.
- Use Chinese by default.
- Prefer this structure:
  1. 结论
  2. 步骤
  3. 验证
  4. 来源

## Forbidden shortcuts

Do not invent or default to claims like:

- `Node.js 18+`
- `docker-compose up`
- `npm install` as the primary startup path

unless the current knowledge explicitly says so.
