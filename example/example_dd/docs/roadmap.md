# dd-bot 落地路线图

## 1. 实施原则

先跑通 `OpenClaw + dingtalk 插件 + 模型 fallback` 主链路，再补业务能力；先让 OpenClaw 变聪明，再补外部写操作。

## 2. Phase 1：OpenClaw 主链路

目标：

- 接入社区 `dingtalk` channel 插件
- 配置 `Router` 主模型
- 配置 `DashScope` fallback
- 让 OpenClaw 在真实钉钉群里可收可回

完成标志：

- `openclaw health` 正常
- `openclaw channels status` 显示 `running`
- 主模型不可用时，能回退到备用模型

## 3. Phase 2：知识与上下文增强

目标：

- 建立最小知识源
- 同步 `docs_source/` 到 OpenClaw workspace 的 `kb/raw/`
- 优化 workspace 提示词与行为规则

完成标志：

- 新人问题能得到更稳定的中文回答
- 机器人回答明显受到 `kb/raw` 检索结果和 workspace 规则约束

## 4. Phase 3：群聊整理与协作草稿

目标：

- 优化摘要能力
- 提炼待办、决策、风险
- 让 OpenClaw 先产出 Issue / Wiki / 日程草稿建议

完成标志：

- 一段讨论可稳定整理为结构化总结
- 草稿内容可读、可审阅、贴近研发群场景

## 5. Phase 4：外部工具接入

目标：

- 接入 `GitHub`
- 接入公司 `Wiki`
- 接入 `钉钉日程`

完成标志：

- 三类工具都至少能先产出预览 / 草稿
- 写操作有明确确认门槛

当前状态：

- `GitHub Issue`：预览 / 创建 / 关闭 已接入
- `钉钉日程`：预览 / 创建 / 删除 / 群回执 已接入
- `确认闭环`：待执行动作保存 / 确认 / 取消 已接入
- `Wiki`：仍未接入

下一步重点：

- 补齐审计日志与 requester / approver 级别追踪
- 继续细化外部写入的审批策略
- 推进 Wiki 真实发布链路

## 6. Phase 5：对接 `yeying-rag`

目标：

- 将 `docs_source/` 与沉淀后的知识逐步同步到 `yeying-rag`
- 评估是否将知识检索从 workspace 文档升级到独立 provider

完成标志：

- `OpenClaw + workspace` 模式与 `yeying-rag` 模式可平滑切换

## 7. 当前待补资产

建议下一步补齐：

- 更贴近研发群的 `AGENTS.md` / `TOOLS.md` 提示词
- 更丰富的 `docs_source/` 知识样本
- GitHub / Wiki / 钉钉日程的工具接入方案
- 群聊操作边界与确认策略文档

## 8. 当前开放问题

还需要进一步确定：

- GitHub 仓库如何与群或项目映射
- 公司 Wiki API 的字段和发布流程
- 钉钉日程对参与人和提醒的支持边界
- 第一批知识文档清单
