---
doc_id: dd-session-hygiene
title: 群会话清理与上下文卫生
project: dd-bot
owner: platform
updated_at: 2026-03-08
applicable_roles:
  - engineer
  - mentor
tags:
  - session
  - hygiene
  - reset
review_status: approved
---

# 群会话清理与上下文卫生

## 1. 为什么需要会话清理

OpenClaw 会把同一个群聊持续映射到同一个 session。

如果早期 assistant 回复中出现了错误结论，例如：

- “无法直接创建外部日历日程”
- “只能手动创建”

这些历史 assistant 消息可能继续影响后续轮次判断。

## 2. 什么时候建议重置当前群会话

- 机器人已经连续重复错误说法
- 模型能力、权限或工具状态已经变化
- 你刚刚修复了工具链路，但机器人还沿用旧结论

## 3. 推荐做法

- 保留知识文档和工具能力
- 只重置**当前群**的会话历史
- 不影响其他群或主会话

## 4. 重置后效果

- 当前群会话会以新 session 重新开始
- 旧 session 会被归档，便于排查
- 新会话仍然会继续使用当前 workspace、knowledge、skills、tools

## 5. 当前建议

当你发现机器人被旧结论污染时：

1. 先执行“当前群会话重置”
2. 再在群里重新发起同一请求
3. 再用明确确认口令测试真实写入闭环
