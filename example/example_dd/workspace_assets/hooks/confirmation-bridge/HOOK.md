---
name: confirmation-bridge
description: "Save pending actions from outgoing drafts and hard-handle confirm/cancel messages for GitHub issue and DingTalk calendar writes."
metadata:
  { "openclaw": { "emoji": "🪝", "events": ["message:received", "message:sent"], "requires": { "bins": ["node"] } } }
---

# Confirmation Bridge

This hook turns preview-first drafts into real confirmable actions.

It should:

- detect outbound draft messages
- save a pending action for the current conversation
- detect inbound confirm / cancel messages
- enforce requester / admin confirmation policy
- execute or clear the pending action
- send a short result message back to the current DingTalk group
