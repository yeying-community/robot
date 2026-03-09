# kb

本目录用于说明 `dd-bot` 的本地知识库分层。

当前约定：

- 仓库内作者侧原始文档仍放在 `docs_source/`
  - `facts/`：事实知识
  - `policies/`：规则与边界
  - `playbooks/`：协作打法
  - `templates/`：模板
  - `examples/`：示例
- 同步到 OpenClaw workspace 后，原始文档进入 `kb/raw/`
- 本地检索索引进入 `kb/index/`
- `knowledge/` 只保留少量指导性文档、模板和边界说明

也就是说，OpenClaw 不再直接把全部原始文档塞进 `knowledge/`，而是：

1. 先通过 `tools/knowledge_search.mjs` 检索 `kb/raw/`
2. 再按需通过 `tools/knowledge_get.mjs` 读取命中 chunk / doc
3. 最后基于命中结果回答或产出草稿
