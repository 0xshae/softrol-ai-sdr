import { NextResponse } from "next/server";

import type {
  Fit,
  LeadIntent,
  LeadScenario,
  LeadStatus,
  Urgency,
} from "@/lib/types";
import {
  createDeterministicVoiceDecision,
  prospectMessages,
  type VoiceAgentDecision,
} from "@/lib/voice-agent";
import type { VoiceTranscriptEntry } from "@/lib/voice-types";

export const runtime = "nodejs";

const intents: LeadIntent[] = [
  "New sales opportunity",
  "Needs qualification",
  "Reactivation opportunity",
  "Existing customer support",
  "Parts/service request",
  "Low-fit inquiry",
  "Vendor/agency",
  "Student/research",
  "Job seeker",
  "Partnership",
  "Spam/other",
];
const fits: Fit[] = ["High", "Medium", "Low", "Unknown", "Not sales"];
const urgencies: Urgency[] = ["High", "Medium-high", "Medium", "Low", "Unknown"];
const statuses: LeadStatus[] = [
  "Ready for sales",
  "Needs qualification",
  "Routed to support",
  "Filtered",
  "Nurture",
];

const stringField = { type: "string" };
const stringArray = { type: "array", items: stringField };
const contextProperties = {
  facilityType: stringField,
  volume: stringField,
  currentProcess: stringField,
  painPoint: stringField,
  timeline: stringField,
  budget: stringField,
  existingSystems: stringField,
  newBuildOrRetrofit: stringField,
  customerType: stringField,
  locations: stringField,
};

const responseSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "complete",
    "reply",
    "classification",
    "extractedContext",
    "missingQuestions",
    "draftResponse",
    "salesBrief",
    "riskFlags",
    "status",
  ],
  properties: {
    complete: { type: "boolean" },
    reply: stringField,
    classification: {
      type: "object",
      additionalProperties: false,
      required: [
        "intent",
        "fit",
        "urgency",
        "productArea",
        "recommendedRoute",
        "humanReviewRequired",
        "confidence",
        "reason",
      ],
      properties: {
        intent: { type: "string", enum: intents },
        fit: { type: "string", enum: fits },
        urgency: { type: "string", enum: urgencies },
        productArea: stringField,
        recommendedRoute: stringField,
        humanReviewRequired: { type: "boolean" },
        confidence: { type: "integer", minimum: 0, maximum: 100 },
        reason: stringField,
      },
    },
    extractedContext: {
      type: "object",
      additionalProperties: false,
      properties: contextProperties,
    },
    missingQuestions: stringArray,
    draftResponse: stringField,
    salesBrief: {
      type: "object",
      additionalProperties: false,
      required: ["subject", "summary", "recommendedNextStep", "doNotDo"],
      properties: {
        subject: stringField,
        summary: stringField,
        recommendedNextStep: stringField,
        doNotDo: stringArray,
      },
    },
    riskFlags: stringArray,
    status: { type: "string", enum: statuses },
  },
};

const systemPrompt = `You are the website voice intake assistant for Softrol Systems.
Softrol sells industrial laundry automation, RFID garment and linen tracking, automated
sortation, wash aisle controls, rail and material handling, LOIS plant reporting, ERP
integrations, parts, service, and support.

Use the transcript to ask one concise, natural follow-up question at a time. Do not repeat
questions already answered. Collect only context needed to route the inquiry: facility type,
operational scale, current process, pain or project driver, product area, timeline, existing
systems, and whether the request is sales, support, service, low-fit, or non-sales.

Set complete=true once there is enough context for a useful human handoff. Complete immediately
for obvious vendor, student, job, spam, or urgent support routing when the route is clear. Never
provide pricing, confirm technical feasibility, troubleshoot an urgent installed-system issue,
or claim that Softrol can solve the problem. Human review is required for high-fit sales,
technical feasibility, pricing, proposals, and urgent support.

When complete=false, reply must contain only the next question. When complete=true, reply must
briefly confirm that a qualification summary is ready. Do not invent facts.`;

const turnSchema = {
  type: "object",
  additionalProperties: false,
  required: ["complete", "reply"],
  properties: {
    complete: { type: "boolean" },
    reply: stringField,
  },
};

const finalizationPrompt = `${systemPrompt}

The transcript is complete. Return the full classification and CRM-ready handoff. Leave unknown
context fields out and list important unknowns in missingQuestions. The brief must preserve human
control and must not contain pricing, technical promises, autonomous troubleshooting, or invented
product claims. draftResponse must be a concise customer-facing follow-up from Softrol's team, not
a description of the qualification process.`;

function isTranscript(value: unknown): value is VoiceTranscriptEntry[] {
  return (
    Array.isArray(value) &&
    value.length <= 20 &&
    value.every(
      (entry) =>
        typeof entry === "object" &&
        entry !== null &&
        ("role" in entry) &&
        (entry.role === "prospect" || entry.role === "assistant") &&
        ("content" in entry) &&
        typeof entry.content === "string" &&
        entry.content.length <= 2_000,
    )
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function normalizeDecision(
  value: unknown,
  transcript: VoiceTranscriptEntry[],
): VoiceAgentDecision | null {
  if (typeof value !== "object" || value === null) return null;
  const data = value as Record<string, unknown>;
  const classification = data.classification as Record<string, unknown> | undefined;
  const salesBrief = data.salesBrief as Record<string, unknown> | undefined;
  const extractedContext = data.extractedContext as Record<string, unknown> | undefined;

  if (
    typeof data.complete !== "boolean" ||
    typeof data.reply !== "string" ||
    !classification ||
    !salesBrief ||
    !extractedContext ||
    !intents.includes(classification.intent as LeadIntent) ||
    !fits.includes(classification.fit as Fit) ||
    !urgencies.includes(classification.urgency as Urgency) ||
    !statuses.includes(data.status as LeadStatus) ||
    typeof classification.productArea !== "string" ||
    typeof classification.recommendedRoute !== "string" ||
    typeof classification.humanReviewRequired !== "boolean" ||
    typeof classification.confidence !== "number" ||
    typeof classification.reason !== "string" ||
    !isStringArray(data.missingQuestions) ||
    typeof data.draftResponse !== "string" ||
    typeof salesBrief.subject !== "string" ||
    typeof salesBrief.summary !== "string" ||
    typeof salesBrief.recommendedNextStep !== "string" ||
    !isStringArray(salesBrief.doNotDo) ||
    !isStringArray(data.riskFlags)
  ) {
    return null;
  }

  const messages = prospectMessages(transcript);
  const guardedLead = createDeterministicVoiceDecision(transcript).lead;
  const preserveDeterministicRoute =
    guardedLead.classification.confidence >= 85;
  const context = Object.fromEntries(
    Object.entries(extractedContext).filter(
      ([key, item]) => key in contextProperties && typeof item === "string" && item.trim(),
    ),
  );

  const lead: LeadScenario = {
    id: `voice-${Date.now()}`,
    title: "Voice intake inquiry",
    shortDescription: "AI-assisted qualification from a website voice intake",
    inboundMessage: messages[0] ?? "No inquiry provided",
    source: "Website voice intake",
    classification: {
      intent: preserveDeterministicRoute
        ? guardedLead.classification.intent
        : (classification.intent as LeadIntent),
      fit: preserveDeterministicRoute
        ? guardedLead.classification.fit
        : (classification.fit as Fit),
      urgency: preserveDeterministicRoute
        ? guardedLead.classification.urgency
        : (classification.urgency as Urgency),
      productArea: preserveDeterministicRoute
        ? guardedLead.classification.productArea
        : classification.productArea,
      recommendedRoute: preserveDeterministicRoute
        ? guardedLead.classification.recommendedRoute
        : classification.recommendedRoute,
      humanReviewRequired: preserveDeterministicRoute
        ? guardedLead.classification.humanReviewRequired
        : classification.humanReviewRequired,
      confidence: preserveDeterministicRoute
        ? guardedLead.classification.confidence
        : Math.max(0, Math.min(100, Math.round(classification.confidence))),
      reason: classification.reason,
    },
    extractedContext: {
      ...guardedLead.extractedContext,
      ...context,
    },
    missingQuestions: data.missingQuestions,
    draftResponse: data.draftResponse,
    salesBrief: {
      subject: salesBrief.subject,
      summary: salesBrief.summary,
      recommendedNextStep: salesBrief.recommendedNextStep,
      doNotDo: Array.from(
        new Set([
          ...salesBrief.doNotDo,
          "Do not provide final pricing or promise technical feasibility.",
        ]),
      ),
    },
    riskFlags: data.riskFlags,
    status: preserveDeterministicRoute
      ? guardedLead.status
      : (data.status as LeadStatus),
  };

  return {
    mode: "ai",
    complete: data.complete,
    reply: data.reply.trim(),
    lead,
  };
}

export async function POST(request: Request) {
  let transcript: VoiceTranscriptEntry[] = [];

  try {
    const body = (await request.json()) as {
      transcript?: unknown;
      finalize?: unknown;
    };
    if (!isTranscript(body.transcript) || !prospectMessages(body.transcript).length) {
      return NextResponse.json({ error: "A valid prospect transcript is required." }, { status: 400 });
    }
    transcript = body.transcript;
    const finalize = body.finalize === true;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(createDeterministicVoiceDecision(transcript));
    }

    const deterministic = createDeterministicVoiceDecision(transcript);
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": request.headers.get("origin") ?? "https://softrol-ai-sdr.vercel.app",
        "X-OpenRouter-Title": "Softrol Revenue Desk",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL ?? "openrouter/free",
        messages: [
          { role: "system", content: finalize ? finalizationPrompt : systemPrompt },
          {
            role: "user",
            content: JSON.stringify(
              transcript.map(({ role, content }) => ({ role, content })),
            ),
          },
        ],
        temperature: 0.2,
        max_tokens: finalize ? 2_600 : 120,
        reasoning: {
          effort: "none",
          exclude: true,
        },
        response_format: {
          type: "json_schema",
          json_schema: {
            name: finalize ? "softrol_voice_handoff" : "softrol_voice_turn",
            strict: true,
            schema: finalize ? responseSchema : turnSchema,
          },
        },
        provider: {
          require_parameters: true,
          allow_fallbacks: true,
        },
      }),
      signal: AbortSignal.timeout(finalize ? 45_000 : 12_000),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter returned ${response.status}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    const parsed = content ? (JSON.parse(content) as Record<string, unknown>) : null;
    const normalizedDecision = finalize
      ? normalizeDecision(parsed, transcript)
      : parsed &&
          typeof parsed.complete === "boolean" &&
          typeof parsed.reply === "string" &&
          parsed.reply.trim()
        ? {
            ...deterministic,
            mode: "ai" as const,
            complete: parsed.complete,
            reply: parsed.reply.trim(),
          }
        : null;
    const decision =
      finalize && normalizedDecision
        ? {
            ...normalizedDecision,
            complete: true,
            reply:
              "Thank you. The qualification summary is ready for your review.",
          }
        : normalizedDecision;

    if (!decision) throw new Error("OpenRouter returned an invalid qualification");
    return NextResponse.json(decision);
  } catch (error) {
    console.error("Voice agent fallback:", error);
    if (!transcript.length) {
      return NextResponse.json({ error: "Unable to process voice intake." }, { status: 400 });
    }
    return NextResponse.json(createDeterministicVoiceDecision(transcript));
  }
}
