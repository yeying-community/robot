import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { HookHandler } from "openclaw/hooks";

import {
  authorizationForPending,
  loadPolicy,
  normalizeText,
  resolveSenderFromScope,
  workspaceRootFromHook
} from "../../tools/lib/runtime.mjs";
import { appendAuditEvent } from "../../tools/lib/audit.mjs";
import { isCancelText, isConfirmText, parseCalendarDraft, parseIssueDraft } from "../../tools/lib/intent.mjs";

type MessageEvent = {
  type: string;
  action: string;
  sessionKey?: string;
  context?: {
    channelId?: string;
    accountId?: string;
    conversationId?: string;
    content?: string;
    success?: boolean;
    isGroup?: boolean;
    groupId?: string;
  };
};

function toolsDir(): string {
  return path.join(workspaceRootFromHook(import.meta.url), "tools");
}

function runTool(
  toolName: string,
  args: string[],
  scope: {
    sessionKey?: string;
    conversationId?: string;
    accountId?: string;
    chatType?: string;
    label?: string;
  }
) {
  const env = {
    ...process.env,
    ...(scope.sessionKey ? { PENDING_SCOPE_SESSION_KEY: scope.sessionKey } : {}),
    ...(scope.conversationId ? { PENDING_SCOPE_CONVERSATION_ID: scope.conversationId } : {}),
    ...(scope.accountId ? { PENDING_SCOPE_ACCOUNT_ID: scope.accountId } : {}),
    ...(scope.chatType ? { PENDING_SCOPE_CHAT_TYPE: scope.chatType } : {}),
    ...(scope.label ? { PENDING_SCOPE_LABEL: scope.label } : {})
  };

  return spawnSync(process.execPath, [path.join(toolsDir(), toolName), ...args], {
    env,
    encoding: "utf8"
  });
}

function parseJsonOutput(result: ReturnType<typeof runTool>) {
  const raw = (result.stdout || result.stderr || "").trim();
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}

function isDingTalkMessageEvent(event: MessageEvent): boolean {
  return event.type === "message" && event.context?.channelId === "dingtalk";
}

function notifyGroup(scope: { conversationId?: string; accountId?: string }, text: string) {
  runTool("dingtalk_group_send.mjs", ["--conversationId", scope.conversationId || "", "--text", text, "--execute"], scope);
}

function buildPendingArgs(
  draft: ReturnType<typeof parseCalendarDraft> | ReturnType<typeof parseIssueDraft>,
  sender: ReturnType<typeof resolveSenderFromScope>
) {
  if ("summary" in draft) {
    const previewLines = [
      "已生成日程草稿；回复“确认创建日程”或“确认执行”可真实创建。",
      draft.missingRecommended.length > 0 ? `待确认：${draft.missingRecommended.join("、")}` : ""
    ].filter(Boolean);
    return [
      "--action",
      "create",
      "--kind",
      "dingtalk_calendar_create",
      "--headline",
      `待确认日程：${draft.summary}`,
      "--previewNote",
      previewLines.join(" "),
      "--paramsJson",
      JSON.stringify({
        summary: draft.summary,
        start: draft.start,
        end: draft.end,
        ...(draft.attendees.length > 0 ? { attendees: draft.attendees } : {}),
        ...(draft.location ? { location: draft.location } : {}),
        ...(draft.onlineMeeting ? { onlineMeeting: true } : {}),
        notifyCurrentGroup: true
      }),
      ...(sender?.senderId ? ["--requesterId", sender.senderId] : []),
      ...(sender?.senderLabel ? ["--requesterLabel", sender.senderLabel] : [])
    ];
  }

  return [
    "--action",
    "create",
    "--kind",
    "github_issue_create",
    "--headline",
    `待确认 Issue：${draft.title}`,
    "--previewNote",
    "已生成 Issue 草稿；回复“确认创建 issue”或“确认执行”可真实创建。",
    "--paramsJson",
    JSON.stringify({
      owner: draft.owner,
      repo: draft.repo,
      title: draft.title,
      body: draft.body,
      ...(draft.labels.length > 0 ? { labels: draft.labels } : {})
    }),
    ...(sender?.senderId ? ["--requesterId", sender.senderId] : []),
    ...(sender?.senderLabel ? ["--requesterLabel", sender.senderLabel] : [])
  ];
}

const handler: HookHandler = async (rawEvent) => {
  const event = rawEvent as unknown as MessageEvent;
  if (!isDingTalkMessageEvent(event)) {
    return;
  }

  const scope = {
    sessionKey: event.sessionKey,
    conversationId: event.context?.conversationId || event.context?.groupId,
    accountId: event.context?.accountId || "default",
    chatType: event.context?.isGroup ? "group" : "direct",
    label: event.context?.conversationId || event.context?.groupId
  };
  const policy = loadPolicy({ workspaceRoot: workspaceRootFromHook(import.meta.url) });
  const conversationAllowed =
    !Array.isArray(policy.allowedConversationIds) ||
    policy.allowedConversationIds.length === 0 ||
    policy.allowedConversationIds.includes(scope.conversationId);

  if (event.action === "sent" && event.context?.success) {
    if (!conversationAllowed) {
      return;
    }

    const text = normalizeText(event.context?.content || "");
    if (!text) {
      return;
    }

    const existing = parseJsonOutput(runTool("pending_action.mjs", ["--action", "get"], scope));
    if (existing?.ok) {
      return;
    }

    const sender = resolveSenderFromScope(scope);
    const calendarDraft = parseCalendarDraft(text);
    if (calendarDraft.summary && calendarDraft.missingCritical.length === 0) {
      runTool("pending_action.mjs", buildPendingArgs(calendarDraft, sender), scope);
      appendAuditEvent({
        workspaceRoot: workspaceRootFromHook(import.meta.url),
        type: "confirmation_bridge.pending_from_calendar_draft",
        scope,
        actor: sender,
        payload: {
          summary: calendarDraft.summary
        }
      });
      return;
    }

    const issueDraft = parseIssueDraft(text, policy, scope);
    if (issueDraft.title && issueDraft.missingCritical.length === 0) {
      runTool("pending_action.mjs", buildPendingArgs(issueDraft, sender), scope);
      appendAuditEvent({
        workspaceRoot: workspaceRootFromHook(import.meta.url),
        type: "confirmation_bridge.pending_from_issue_draft",
        scope,
        actor: sender,
        payload: {
          title: issueDraft.title,
          owner: issueDraft.owner,
          repo: issueDraft.repo
        }
      });
    }
    return;
  }

  if (event.action !== "received") {
    return;
  }

  const text = normalizeText(event.context?.content || "");
  if (!text || (!isConfirmText(text) && !isCancelText(text))) {
    return;
  }

  const pending = parseJsonOutput(runTool("pending_action.mjs", ["--action", "get"], scope));
  if (!pending?.ok || !pending?.pending) {
    return;
  }

  const sender = resolveSenderFromScope(scope);
  if (!sender) {
    notifyGroup(scope, "当前无法识别确认人的身份，请重试或由管理员重新发起确认。");
    return;
  }

  const authorization = authorizationForPending(policy, pending.pending, sender);
  if (!authorization.allowed) {
    appendAuditEvent({
      workspaceRoot: workspaceRootFromHook(import.meta.url),
      type: "confirmation_bridge.authorization_denied",
      scope,
      actor: sender,
      payload: {
        kind: pending.pending.kind,
        headline: pending.pending.headline
      }
    });
    notifyGroup(scope, authorization.reason || "当前发送人没有权限确认 / 取消该操作。");
    return;
  }

  if (isCancelText(text)) {
    runTool("pending_action.mjs", ["--action", "clear"], scope);
    appendAuditEvent({
      workspaceRoot: workspaceRootFromHook(import.meta.url),
      type: "confirmation_bridge.cancel",
      scope,
      actor: sender,
      payload: {
        kind: pending.pending.kind,
        headline: pending.pending.headline
      }
    });
    notifyGroup(scope, "已取消当前待执行操作。");
    return;
  }

  const executed = parseJsonOutput(runTool("pending_action.mjs", ["--action", "execute"], scope));
  if (!executed?.ok) {
    appendAuditEvent({
      workspaceRoot: workspaceRootFromHook(import.meta.url),
      type: "confirmation_bridge.execute_failure",
      scope,
      actor: sender,
      payload: {
        kind: pending.pending.kind,
        headline: pending.pending.headline
      }
    });
    notifyGroup(scope, "执行失败，当前草稿仍已保留。请修正后重试，或回复“取消”。");
    return;
  }

  appendAuditEvent({
    workspaceRoot: workspaceRootFromHook(import.meta.url),
    type: "confirmation_bridge.execute_success",
    scope,
    actor: sender,
    payload: {
      kind: pending.pending.kind,
      headline: pending.pending.headline
    }
  });

  if (pending.pending.kind === "github_issue_create") {
    const issue = executed.executed?.result;
    if (issue?.htmlUrl) {
      notifyGroup(scope, `已创建 GitHub Issue：#${issue.number} ${issue.title}\n${issue.htmlUrl}`);
      return;
    }
  }

  if (pending.pending.kind === "dingtalk_calendar_create" && !pending.pending.params?.notifyCurrentGroup) {
    const eventResult = executed.executed?.result;
    if (eventResult?.id) {
      notifyGroup(scope, `已创建日程：${eventResult.summary || pending.pending.params?.summary}\n日程ID：${eventResult.id}`);
    }
  }
};

export default handler;
