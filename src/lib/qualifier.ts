import { leadScenarios } from "@/lib/scenarios";
import type {
  LeadScenario,
  QualificationResult,
} from "@/lib/types";

const normalize = (value: string) => value.trim().toLowerCase();

const includesAny = (value: string, terms: string[]) =>
  terms.some((term) => value.includes(term));

const cloneForInput = (
  scenario: LeadScenario,
  input: string,
  idSuffix: string,
): LeadScenario => ({
  ...scenario,
  id: `custom-${idSuffix}`,
  title: "Custom inbound inquiry",
  shortDescription: "Deterministic qualification from custom input",
  inboundMessage: input.trim(),
  source: "Website form",
});

const uncertainLead = (
  input: string,
  kind: "vague" | "unrelated" | "uncertain",
): LeadScenario => {
  const unrelated = kind === "unrelated";
  return {
    id: `custom-${kind}`,
    title: unrelated ? "Unrelated custom inquiry" : "Custom inquiry needs context",
    shortDescription: unrelated
      ? "No clear connection to industrial laundry automation"
      : "Not enough reliable context to classify as a sales opportunity",
    inboundMessage: input.trim(),
    source: "Website form",
    classification: {
      intent: unrelated ? "Spam/other" : "Needs qualification",
      fit: unrelated ? "Low" : "Unknown",
      urgency: "Unknown",
      productArea: unrelated
        ? "No relevant product area identified"
        : "To be determined",
      recommendedRoute: unrelated
        ? "Filtered / general review"
        : "AI follow-up before sales handoff",
      humanReviewRequired: false,
      confidence: unrelated ? 74 : 62,
      reason: unrelated
        ? "The message contains no reliable industrial laundry, textile rental, automation, service, or installed-system context."
        : "The message does not provide enough facility, volume, process, or project information to make a safe routing decision.",
    },
    extractedContext: {},
    missingQuestions: unrelated
      ? ["Is this inquiry related to an industrial laundry operation or Softrol system?"]
      : [
          "What type of facility or operation do you run?",
          "What volume do you process each day?",
          "What process or system are you trying to improve?",
          "Is this an active project or early research?",
        ],
    draftResponse: unrelated
      ? "Thanks for reaching out. We could not identify a clear connection to Softrol’s industrial laundry automation or installed-system support. If this relates to a laundry operation, please share the facility type and the process you are looking to improve."
      : "Thanks for reaching out. I can help route this correctly, but I need a little more operating context first. What type of facility do you operate, what volume do you process, and what process are you trying to improve?",
    salesBrief: {
      subject: unrelated
        ? "Unrelated inquiry held outside sales pipeline"
        : "Custom inquiry requires initial qualification",
      summary: unrelated
        ? "No reliable Softrol product, facility, or support context was identified. The message should remain outside the active sales pipeline unless clarified."
        : "The inbound message is too limited to establish fit, urgency, product area, or sales readiness without follow-up.",
      recommendedNextStep: unrelated
        ? "Send one controlled clarification response or filter after human review."
        : "Collect facility type, daily volume, current process, business need, and project stage before routing.",
      doNotDo: [
        "Do not invent missing facility or project context.",
        "Do not quote or promise technical feasibility.",
      ],
    },
    riskFlags: [
      unrelated
        ? "No relevant business context detected."
        : "Insufficient information for reliable classification.",
    ],
    status: unrelated ? "Filtered" : "Needs qualification",
  };
};

export function qualifyCustomInput(input: string): QualificationResult {
  const value = normalize(input);

  if (includesAny(value, ["lois", "dashboard stopped", "system down", "washer line", "not working", "scanner down"])) {
    return {
      lead: cloneForInput(leadScenarios[3], input, "support"),
      inputKind: "matched",
    };
  }

  if (includesAny(value, ["replacement", "spare part", "rfid tags", "scanner configuration", "service request"])) {
    return {
      lead: cloneForInput(leadScenarios[4], input, "parts"),
      inputKind: "matched",
    };
  }

  if (includesAny(value, ["seo", "marketing agency", "guaranteed leads", "sell you", "book with your vp"])) {
    return {
      lead: cloneForInput(leadScenarios[9], input, "vendor"),
      inputKind: "matched",
    };
  }

  if (includesAny(value, ["student", "college project", "research paper", "school project"])) {
    return {
      lead: cloneForInput(leadScenarios[8], input, "student"),
      inputKind: "matched",
    };
  }

  if (includesAny(value, ["job", "resume", "career", "hiring", "internship"])) {
    return {
      lead: {
        ...uncertainLead(input, "unrelated"),
        classification: {
          ...uncertainLead(input, "unrelated").classification,
          intent: "Job seeker",
          fit: "Not sales",
          confidence: 94,
          recommendedRoute: "Careers / general inbox",
          reason: "The message is seeking employment rather than discussing a customer project.",
        },
        status: "Filtered",
      },
      inputKind: "matched",
    };
  }

  if (includesAny(value, ["laundromat", "coin laundry", "six washers", "6 washers", "cheap app"])) {
    return {
      lead: cloneForInput(leadScenarios[5], input, "low-fit"),
      inputKind: "matched",
    };
  }

  if (includesAny(value, ["downloaded", "revisited", "page twice", "content lead"])) {
    return {
      lead: cloneForInput(leadScenarios[11], input, "reactivation"),
      inputKind: "matched",
    };
  }

  if (includesAny(value, ["three plants", "3 plants", "multi-location", "multiple sites", "across all sites"])) {
    return {
      lead: cloneForInput(leadScenarios[6], input, "enterprise"),
      inputKind: "matched",
    };
  }

  if (includesAny(value, ["erp", "route accounting", "data sync", "integration"])) {
    return {
      lead: cloneForInput(leadScenarios[7], input, "integration"),
      inputKind: "matched",
    };
  }

  if (includesAny(value, ["hospital", "healthcare laundry", "linen tracking"])) {
    return {
      lead: cloneForInput(leadScenarios[0], input, "healthcare"),
      inputKind: "matched",
    };
  }

  if (includesAny(value, ["uniform rental", "garments/day", "rfid plus", "automated sorting"])) {
    return {
      lead: cloneForInput(leadScenarios[1], input, "uniform"),
      inputKind: "matched",
    };
  }

  if (includesAny(value, ["pricing", "price", "quote", "sorting system", "sortation"])) {
    return {
      lead: cloneForInput(leadScenarios[2], input, "quote"),
      inputKind: "matched",
    };
  }

  const words = value.split(/\s+/).filter(Boolean);
  if (words.length < 4) {
    return { lead: uncertainLead(input, "vague"), inputKind: "vague" };
  }

  const relevant = includesAny(value, [
    "laundry",
    "linen",
    "garment",
    "rfid",
    "softrol",
    "plant",
    "automation",
    "washer",
    "tracking",
  ]);

  if (!relevant) {
    return {
      lead: uncertainLead(input, "unrelated"),
      inputKind: "unrelated",
    };
  }

  return {
    lead: uncertainLead(input, "uncertain"),
    inputKind: "uncertain",
  };
}

export function formatCrmBrief(lead: LeadScenario): string {
  const context = Object.entries(lead.extractedContext)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => `- ${key.replace(/([A-Z])/g, " $1")}: ${value}`)
    .join("\n");

  const questions = lead.missingQuestions.map((question) => `- ${question}`).join("\n");
  const risks = lead.riskFlags.map((risk) => `- ${risk}`).join("\n");
  const guardrails = lead.salesBrief.doNotDo.map((item) => `- ${item}`).join("\n");

  return [
    `CRM-READY BRIEF: ${lead.salesBrief.subject}`,
    "",
    `Status: ${lead.status}`,
    `Intent: ${lead.classification.intent}`,
    `Fit: ${lead.classification.fit}`,
    `Urgency: ${lead.classification.urgency}`,
    `Product area: ${lead.classification.productArea}`,
    `Recommended route: ${lead.classification.recommendedRoute}`,
    `Confidence: ${lead.classification.confidence}%`,
    "",
    "SUMMARY",
    lead.salesBrief.summary,
    "",
    "EXTRACTED CONTEXT",
    context || "- No reliable context extracted",
    "",
    "MISSING QUALIFICATION",
    questions || "- No additional questions required",
    "",
    "RECOMMENDED NEXT STEP",
    lead.salesBrief.recommendedNextStep,
    "",
    "RISK FLAGS",
    risks || "- None",
    "",
    "DO NOT",
    guardrails,
  ].join("\n");
}
