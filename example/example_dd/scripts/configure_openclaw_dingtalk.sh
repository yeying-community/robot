#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${PROJECT_DIR}/.env.local"
WORKSPACE_DIR="${OPENCLAW_DD_WORKSPACE:-$HOME/.openclaw/workspace-dd-bot}"
NPM_REGISTRY="${NPM_CONFIG_REGISTRY:-https://registry.npmmirror.com}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "[fail] missing ${ENV_FILE}" >&2
  exit 2
fi

set -a
source <(grep -E '^(ROUTER_|DINGTALK_|DASHSCOPE_)' "${ENV_FILE}")
set +a

: "${ROUTER_API_KEY:?ROUTER_API_KEY is required}"
: "${DINGTALK_CLIENT_ID:?DINGTALK_CLIENT_ID is required}"
: "${DINGTALK_CLIENT_SECRET:?DINGTALK_CLIENT_SECRET is required}"

bash "${PROJECT_DIR}/scripts/sync_openclaw_workspace.sh"

if ! openclaw plugins list 2>/dev/null | grep -q 'dingtalk'; then
  echo "[info] installing dingtalk plugin"
  NPM_CONFIG_REGISTRY="${NPM_REGISTRY}" openclaw plugins install @soimy/dingtalk
fi

ROUTER_PROVIDER=$(cat <<JSON
{
  "baseUrl": "${ROUTER_BASE_URL:-https://test-router.yeying.pub/v1}",
  "auth": "api-key",
  "apiKey": "${ROUTER_API_KEY}",
  "api": "openai-responses",
  "models": [
    {
      "id": "${ROUTER_MODEL:-gpt-5.3-codex}",
      "name": "${ROUTER_MODEL:-gpt-5.3-codex}",
      "reasoning": true,
      "input": ["text"],
      "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 },
      "contextWindow": 200000,
      "maxTokens": 8192
    }
  ]
}
JSON
)

DINGTALK_CHANNEL=$(cat <<JSON
{
  "enabled": true,
  "clientId": "${DINGTALK_CLIENT_ID}",
  "clientSecret": "${DINGTALK_CLIENT_SECRET}",
  "dmPolicy": "open",
  "groupPolicy": "open",
  "allowFrom": ["*"],
  "debug": false,
  "messageType": "markdown"
}
JSON
)

openclaw config set plugins.allow '["dingtalk"]'
openclaw config set agents.defaults.workspace "${WORKSPACE_DIR}"
openclaw config set gateway.mode local
openclaw config set hooks.internal.enabled true
openclaw config set hooks.internal.entries.confirmation-bridge.enabled true
openclaw config set --strict-json models.providers.router "${ROUTER_PROVIDER}"
openclaw config set agents.defaults.model.primary "router/${ROUTER_MODEL:-gpt-5.3-codex}"
openclaw config set --strict-json channels.dingtalk "${DINGTALK_CHANNEL}"

if [[ -n "${DASHSCOPE_API_KEY:-}" ]]; then
  DASHSCOPE_PROVIDER=$(cat <<JSON
{
  "baseUrl": "${DASHSCOPE_BASE_URL:-https://dashscope.aliyuncs.com/compatible-mode/v1}",
  "auth": "api-key",
  "authHeader": true,
  "apiKey": "${DASHSCOPE_API_KEY}",
  "api": "openai-completions",
  "models": [
    {
      "id": "${DASHSCOPE_MODEL:-qwen3-coder-plus}",
      "name": "${DASHSCOPE_MODEL:-qwen3-coder-plus}",
      "reasoning": false,
      "input": ["text"],
      "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 },
      "contextWindow": 128000,
      "maxTokens": 8192
    }
  ]
}
JSON
)

  openclaw config set --strict-json models.providers.dashscope "${DASHSCOPE_PROVIDER}"
  openclaw config set --strict-json agents.defaults.model.fallbacks "[\"dashscope/${DASHSCOPE_MODEL:-qwen3-coder-plus}\"]"
  echo "[ok] enabled DashScope fallback: dashscope/${DASHSCOPE_MODEL:-qwen3-coder-plus}"
else
  echo "[warn] DASHSCOPE_API_KEY not set; skip Alibaba fallback model configuration"
fi

echo "[ok] OpenClaw DingTalk environment configured"
