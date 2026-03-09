---
name: github-issue-cleanup
description: |
  Use for closing or reopening GitHub issues, especially to clean up smoke-test issues after verification.
---

# GitHub Issue Cleanup

Use this skill when the user asks to:

- 关闭测试 issue
- 重开 issue
- 清理 GitHub 测试数据

Use:

```bash
node tools/github_issue_state.mjs --issueNumber <n> --state closed --execute
```

Rules:

- Default cleanup means `closed`, not deletion.
- Always mention the issue number and repo.
