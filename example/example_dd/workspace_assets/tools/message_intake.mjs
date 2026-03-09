#!/usr/bin/env node

import { describeIntent, detectMention } from "./lib/intent.mjs";
import { loadPolicy, parseArgs, parseBoolean, resolveSenderFromScope, workspaceRootFromTool } from "./lib/runtime.mjs";
import { resolveKnowledgePaths, searchKnowledge } from "./lib/knowledge.mjs";
import { createKnowledgeGap } from "./lib/gap.mjs";
import { appendAuditEvent } from "./lib/audit.mjs";

function required(name, value) {
  if (!value) {
    throw new Error(`Missing required argument: ${name}`);
  }
  return value;
}

function fallbackReply(query, topic, mode) {
  if (mode === "clarify") {
    return [
      "我在当前知识里找到了一些相关内容，但还不足以直接下结论。",
      `如果你方便，请补充更具体的项目 / 场景 / 目标，我再基于现有知识继续帮你收敛。`,
      `如果只给保守建议，我建议先按 ${topic || "当前场景"} 的常规流程确认负责人后再执行。`
    ].join("");
  }

  return [
    "我没在当前知识库里找到这部分的可靠依据。",
    `如果只给保守建议，我建议先确认更具体的项目背景和负责方，再继续处理“${query}”这件事。`,
    "如果你愿意，我可以先帮你整理成待确认清单、Wiki 草稿或待补知识项。"
  ].join("");
}

function buildResponsePlan(intent, knowledge) {
  if (intent.intent === "handoff") {
    return {
      mode: "handoff",
      assistantReply: "这类场景属于高风险或需要拍板的问题，建议直接转负责人 / 导师人工处理。",
      shouldCreateKnowledgeGap: false
    };
  }

  if (intent.intent === "qa") {
    if (!knowledge) {
      return {
        mode: "missing_knowledge_lookup",
        assistantReply: "当前还没有执行知识检索，建议先检索后再回答。",
        shouldCreateKnowledgeGap: false
      };
    }

    if (knowledge.decision === "answer") {
      return {
        mode: "grounded_answer",
        assistantReply: "基于命中文档直接回答，并明确引用来源。",
        shouldCreateKnowledgeGap: false
      };
    }

    if (knowledge.decision === "clarify") {
      return {
        mode: "clarify_then_answer",
        assistantReply: fallbackReply(knowledge.query, knowledge.topic, "clarify"),
        shouldCreateKnowledgeGap: true,
        suggestedAction: "记录待补知识项，并向用户追问一个关键上下文。"
      };
    }

    return {
      mode: "insufficient_knowledge",
      assistantReply: fallbackReply(knowledge.query, knowledge.topic, "no_answer"),
      shouldCreateKnowledgeGap: true,
      suggestedAction: "记录待补知识项，并建议转人工或整理成 Wiki / Issue 草稿。"
    };
  }

  if (intent.intent === "calendar" && intent.calendar?.missingCritical?.length > 0) {
    return {
      mode: "clarify_required",
      assistantReply: `我已识别到你想创建日程，但还缺少这些关键信息：${intent.calendar.missingCritical.join("、")}。请补充后我再继续。`,
      shouldCreateKnowledgeGap: false
    };
  }

  if (intent.intent === "issue" && intent.issue?.missingCritical?.length > 0) {
    return {
      mode: "clarify_required",
      assistantReply: `我可以先帮你整理 Issue 草稿，但目前还缺少：${intent.issue.missingCritical.join("、")}。`,
      shouldCreateKnowledgeGap: false
    };
  }

  if (intent.intent === "wiki" && intent.wiki?.missingCritical?.length > 0) {
    return {
      mode: "clarify_required",
      assistantReply: `我可以先帮你整理 Wiki 草稿，但目前还缺少：${intent.wiki.missingCritical.join("、")}。`,
      shouldCreateKnowledgeGap: false
    };
  }

  return {
    mode: "structured_reply",
    assistantReply: "按当前意图输出结构化结果。",
    shouldCreateKnowledgeGap: false
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const text = required("text", args.text);
  const workspaceRoot = workspaceRootFromTool(import.meta.url);
  const policy = loadPolicy({ workspaceRoot, policyPath: args.policyPath });
  const scope = {
    sessionKey: args.sessionKey || process.env.PENDING_SCOPE_SESSION_KEY || "",
    conversationId: args.conversationId || process.env.PENDING_SCOPE_CONVERSATION_ID || "",
    accountId: args.accountId || process.env.PENDING_SCOPE_ACCOUNT_ID || "default",
    chatType: args.chatType || process.env.PENDING_SCOPE_CHAT_TYPE || "group",
    label: args.label || process.env.PENDING_SCOPE_LABEL || ""
  };
  const sender =
    args.senderId || args.senderLabel
      ? {
          senderId: args.senderId || null,
          senderLabel: args.senderLabel || null,
          source: "cli-args"
        }
      : resolveSenderFromScope(scope);

  const intent = describeIntent(text, policy, scope);
  const withKnowledge = parseBoolean(args.withKnowledge, true);
  const knowledgePaths = resolveKnowledgePaths({ workspaceRoot, rawDir: args.rawDir, indexDir: args.indexDir, manifestPath: args.manifestPath });
  const knowledge =
    withKnowledge && intent.intent === "qa"
      ? searchKnowledge({
          rawDir: knowledgePaths.rawDir,
          indexDir: knowledgePaths.indexDir,
          manifestPath: knowledgePaths.manifestPath,
          query: text,
          topic: intent.topic,
          limit: Number(args.limit || "5")
        })
      : null;
  const responsePlan = buildResponsePlan(intent, knowledge);
  const shouldRecordGap =
    parseBoolean(args.recordGapOnNoAnswer, true) &&
    responsePlan.shouldCreateKnowledgeGap &&
    intent.intent === "qa" &&
    Boolean(knowledge);
  const gapResult = shouldRecordGap
    ? createKnowledgeGap({
        workspaceRoot,
        scope,
        sender,
        query: text,
        topic: knowledge.topic,
        reason:
          knowledge.decision === "clarify"
            ? "知识命中不足以直接回答，需要补充上下文。"
            : "当前知识库没有找到可靠依据。",
        suggestedAction: responsePlan.suggestedAction || null,
        searchResult: knowledge,
        source: "message_intake"
      })
    : null;
  const conversationAllowed =
    !Array.isArray(policy.allowedConversationIds) ||
    policy.allowedConversationIds.length === 0 ||
    policy.allowedConversationIds.includes(scope.conversationId);
  const mentioned = args.mentioned !== undefined ? parseBoolean(args.mentioned) : detectMention(text);
  const auditEnabled = parseBoolean(args.audit, true);

  const result = {
    ok: true,
    scope,
    sender,
    policy: {
      allowedConversationIds: policy.allowedConversationIds,
      admins: policy.admins,
      requireAtBot: policy.autoReply?.requireAtBot ?? true,
      allowQuestionWithoutMention: policy.autoReply?.allowQuestionWithoutMention ?? false,
      confirmationRequired: policy.safety?.confirmationRequired || []
    },
    gating: {
      conversationAllowed,
      mentionDetected: mentioned,
      mentionRequiredByPolicy: scope.chatType === "group" ? Boolean(policy.autoReply?.requireAtBot) : false,
      mentionEnforcedByPlatform: scope.chatType === "group" ? "dingtalk-app-bot" : null,
      shouldRespond: conversationAllowed && intent.action !== "ignore",
      confirmationRequired: (policy.safety?.confirmationRequired || []).includes(intent.intent)
    },
    intent,
    ...(knowledge ? { knowledge } : {}),
    responsePlan,
    ...(gapResult ? { knowledgeGap: gapResult } : {})
  };

  if (auditEnabled) {
    appendAuditEvent({
      workspaceRoot,
      type: "message_intake",
      scope,
      actor: sender,
      payload: {
        text,
        intent: intent.intent,
        action: intent.action,
        responsePlan: responsePlan.mode,
        knowledgeDecision: knowledge?.decision || null,
        gapId: gapResult?.gap?.gapId || null
      }
    });
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      },
      null,
      2
    )
  );
  process.exit(1);
});
