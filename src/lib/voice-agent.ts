import { qualifyCustomInput } from "@/lib/qualifier";
import type { LeadScenario } from "@/lib/types";
import type { VoiceTranscriptEntry } from "@/lib/voice-types";

type QuestionSet = { keywords: string[]; questions: string[] };

const QUESTION_BANK: QuestionSet[] = [
  {
    keywords: ["lois", "dashboard", "system down", "washer line", "not working", "scanner down"],
    questions: [
      "Which facility and washer line are affected?",
      "When did the issue start?",
      "Is production blocked, or is this limited to reporting?",
      "What is the best callback number for your plant manager?",
    ],
  },
  {
    keywords: ["replacement", "spare part", "rfid tags", "scanner configuration", "service request"],
    questions: [
      "Which facility is this for?",
      "What RFID tag type and quantity do you need?",
      "Which scanner model needs configuration help?",
      "Is production currently affected?",
    ],
  },
  {
    keywords: ["hospital", "healthcare laundry", "linen tracking"],
    questions: [
      "Are you looking for item-level RFID tracking, cart-level tracking, or both?",
      "How many customer locations need reporting visibility?",
      "Is this for a current facility or a new build?",
      "What is your target implementation timeline?",
    ],
  },
  {
    keywords: ["uniform rental", "garments", "automated sorting", "rfid plus"],
    questions: [
      "Is this a retrofit or a new facility?",
      "How many operators sort garments per shift?",
      "What is your current mis-sort rate?",
      "Which route accounting or ERP system do you use?",
    ],
  },
  {
    keywords: ["erp", "route accounting", "data sync", "integration"],
    questions: [
      "Which ERP and route accounting platforms are in use?",
      "Which data needs to move between systems?",
      "How frequently should the data update?",
      "What plant software is installed today?",
    ],
  },
  {
    keywords: ["three plants", "3 plants", "multi-location", "multiple sites", "across all sites"],
    questions: [
      "What volume does each plant process per day?",
      "Are the sites using the same production systems today?",
      "Which reporting views need to be standardized?",
      "Who is involved in the evaluation this quarter?",
    ],
  },
  {
    keywords: ["pricing", "price", "quote", "sorting system", "sortation"],
    questions: [
      "What type of facility do you operate?",
      "Roughly how many garments do you process each day?",
      "How do you sort today: manually, by barcode, or RFID?",
      "Is this for a retrofit or a new facility?",
      "What is the main project driver: labor, throughput, mis-sorts, or visibility?",
    ],
  },
];

const DEFAULT_QUESTIONS = [
  "What type of facility or operation is this related to?",
  "What volume do you process each day?",
  "What process or system are you trying to improve?",
  "Is this an active project or early research?",
];

export type VoiceAgentDecision = {
  mode: "ai" | "deterministic";
  complete: boolean;
  reply: string;
  lead: LeadScenario;
};

export function prospectMessages(transcript: VoiceTranscriptEntry[]): string[] {
  return transcript
    .filter((entry) => entry.role === "prospect")
    .map((entry) => entry.content.trim())
    .filter(Boolean);
}

export function selectDeterministicQuestions(message: string): string[] {
  const normalized = message.toLowerCase();
  return (
    QUESTION_BANK.find((set) =>
      set.keywords.some((keyword) => normalized.includes(keyword)),
    )?.questions ?? DEFAULT_QUESTIONS
  );
}

function questionAlreadyAnswered(question: string, input: string): boolean {
  const checks: Array<[string[], RegExp]> = [
    [["facility and washer line"], /\b(?:facility|plant|site)\b.*\b(?:line|washer)\b|\b(?:line|washer)\b.*\b(?:facility|plant|site)\b/i],
    [["when did the issue start"], /\b(?:today|this morning|this afternoon|yesterday|since|started|began)\b/i],
    [["production blocked"], /\b(?:production|operations?)\b.*\b(?:blocked|running|stopped|down)|\breporting (?:only|down)\b/i],
    [["callback number"], /\b(?:phone|callback|call me|reach me)\b|\+?\d[\d\s().-]{7,}/i],
    [["type of facility", "type of facility or operation"], /\b(?:healthcare|hospitality|industrial|commercial|uniform rental|textile rental|laundromat|laundry plant|facility|factory|warehouse|manufacturing|plant|hotel|resort|linen|cloth|textile|cleaning|processing|distribution|supply chain|logistics|gym|fitness|spa)\b/i],
    [["how many garments", "what volume", "volume does each plant"], /\b[\d,]+\s*(?:garments|pieces|lbs|pounds|kg|units|items|people)?(?:\s*\/\s*|\s+per\s+)?(?:day|daily|shift|week)?\b|\b(?:small|medium|large|high|low)\s*(?:volume|capacity)\b/i],
    [["how do you sort today"], /\b(?:manual(?:ly)?|barcode|rfid|hand|automated?)\b/i],
    [["retrofit or a new"], /\b(?:retrofit|new build|new facility|new plant|existing|current|upgrading?)\b/i],
    [["main project driver"], /\b(?:labor|throughput|mis-?sorts?|visibility|tracking|reporting|accuracy|efficiency|cost|automat)\b/i],
    [["target implementation timeline", "active project or early research"], /\b(?:within|this quarter|this year|next (?:week|month|quarter|year)|timeline|evaluating|research|looking|planning|asap|urgent|soon)\b/i],
    [["what process", "system are you trying to improve"], /\b(?:sorting|tracking|washing|drying|folding|delivery|automation|process|system|workflow|operations?)\b/i],
    [["active project or early research"], /\b(?:active|project|research|evaluating|exploring|ready|budget|approved|looking into)\b/i],
  ];

  return checks.some(
    ([phrases, pattern]) =>
      phrases.some((phrase) => question.toLowerCase().includes(phrase)) &&
      pattern.test(input),
  );
}

export function createDeterministicVoiceDecision(
  transcript: VoiceTranscriptEntry[],
): VoiceAgentDecision {
  const messages = prospectMessages(transcript);
  const fullInput = messages.join(". ");
  const baseLead = qualifyCustomInput(fullInput || "No inquiry provided").lead;
  const questions = selectDeterministicQuestions(messages[0] ?? "");

  // Collect questions the assistant has already asked (exact text match)
  const askedQuestions = new Set(
    transcript
      .filter((e) => e.role === "assistant")
      .map((e) => e.content.trim()),
  );

  const nextQuestion = questions.find(
    (question) =>
      !askedQuestions.has(question) &&
      !questionAlreadyAnswered(question, fullInput),
  );
  const complete = !nextQuestion;
  const volumeMatch = fullInput.match(
    /([\d,]+)\s*(garments|lbs|pounds)(?:\s*\/\s*|\s+per\s+)(day|daily)/i,
  );
  const timelineMatch = fullInput.match(
    /\b(within\s+(?:\w+\s+){0,2}(?:weeks?|months?|years?)|this quarter|this year|next week)\b/i,
  );
  const process =
    /manual/i.test(fullInput) && /barcode/i.test(fullInput)
      ? "Manual sorting with barcode scans"
      : undefined;
  const projectType = /retrofit/i.test(fullInput)
    ? "Retrofit"
    : /new (?:build|facility|plant)/i.test(fullInput)
      ? "New build"
      : undefined;
  const lead: LeadScenario = {
    ...baseLead,
    extractedContext: {
      ...baseLead.extractedContext,
      ...(volumeMatch
        ? {
            volume: `${volumeMatch[1]} ${volumeMatch[2].toLowerCase()}/day`,
          }
        : {}),
      ...(process ? { currentProcess: process } : {}),
      ...(projectType ? { newBuildOrRetrofit: projectType } : {}),
      ...(timelineMatch ? { timeline: timelineMatch[0] } : {}),
    },
  };

  return {
    mode: "deterministic",
    complete,
    reply: complete
      ? "Thank you. I have enough context to prepare the qualification summary for review."
      : nextQuestion,
    lead: {
      ...lead,
      id: `voice-${Date.now()}`,
      title: "Voice intake inquiry",
      shortDescription: "Qualification prepared from a website voice intake",
      source: "Website voice intake",
      inboundMessage: messages[0] ?? "No inquiry provided",
    },
  };
}
