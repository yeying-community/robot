#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${PROJECT_DIR}/.env.local"

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  source <(grep -E '^(ROUTER_|DINGTALK_|DASHSCOPE_|GITHUB_|COMPANY_WIKI_|DD_POLICY_PATH=)' "${ENV_FILE}")
  set +a
fi

exec openclaw gateway run
