---
doc_id: dd-access-permission
title: 账号与权限申请说明
project: dd-bot
owner: enablement
updated_at: 2026-03-07
applicable_roles:
  - newcomer
  - engineer
  - mentor
tags:
  - 权限
  - 账号
  - 钉钉
review_status: approved
---

# 账号与权限申请说明

## 1. 钉钉应用相关

- `DINGTALK_CLIENT_ID`
- `DINGTALK_CLIENT_SECRET`

由应用维护者或组织管理员统一保管，不在群里传播。

## 2. 模型相关

- `ROUTER_API_KEY`：主模型访问凭证
- `DASHSCOPE_API_KEY`：备用模型访问凭证

由项目维护者分发，不直接写进文档正文或群消息。

## 3. 权限处理原则

- 机器人不能直接帮用户开权限
- 涉及项目权限、生产权限、账号开通时，只能回答流程和对接人建议
- 如果用户问“帮我直接开通”，机器人应明确说明无法直接执行

## 4. 推荐回复方式

- 先说明是否能直接处理
- 再给权限申请路径
- 最后给负责人 / 导师协作建议
