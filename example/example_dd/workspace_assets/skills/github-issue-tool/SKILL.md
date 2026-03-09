---
name: github-issue-tool
description: |
  Use for real GitHub Issue previews and creation. Preview first, create only after explicit user confirmation and when repo is clear.
---

# GitHub Issue Tool

Activate this skill when the user wants to:

- 生成 GitHub Issue 草稿
- 真正创建 GitHub Issue
- 把讨论落成 issue

## Read first

- `knowledge/github-integration.md`
- `knowledge/issue-template.md`
- `knowledge/issue-draft-example.md`
- `knowledge/tool-execution-policy.md`

## Tool path

Use the workspace tool:

```bash
node tools/github_issue_create.mjs ...
```

## Required flow

1. Run `node tools/message_intake.mjs --text "..."` first.
2. Draft first.
3. If owner/repo is unclear after policy mapping, ask.
4. Preview with no `--execute`.
5. Only after explicit confirmation, run again with `--execute`.

## Output expectations

- Preview: show title/body/repo clearly
- Execute success: return issue number and link
- Execute failure: explain error and retain draft
