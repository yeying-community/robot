---
name: group-governance
description: |
  Use in DingTalk group chats to decide whether to answer, clarify, stay quiet, or hand off. Helps reduce noise and avoid over-eager replies.
---

# Group Governance

Activate this skill when the conversation is in a group and you need to decide:

- should I answer now?
- should I ask one clarifying question?
- should I stay quiet?
- should I hand off to a human?

## Read first

- `knowledge/group-response-policy.md`
- `knowledge/tooling-boundary.md`
- `policy/runtime-policy.json`

## Tool path

Use:

```bash
node tools/message_intake.mjs --text "..."
```

If the message turns into a knowledge-insufficient QA case, also use:

```bash
node tools/knowledge_gap.mjs --action create ...
```

## Decision rules

1. If the user asks a clear environment / process / FAQ question, answer.
2. If the user asks for summary / issue / wiki / meeting preview, answer with a structured draft.
3. If the message is casual chatter or has no clear task, stay concise or stay quiet.
4. If the request implies a real external write, present a draft first.
5. If the request is high-risk, hand off.
6. In group chats, default to concise answers unless the user explicitly asks for a detailed draft.

## Output behavior

- Group replies should be concise by default.
- Ask at most one clarifying question when required.
- Do not over-explain internal reasoning.
