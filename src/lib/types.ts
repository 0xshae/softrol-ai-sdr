export type LeadIntent =
  | "New sales opportunity"
  | "Needs qualification"
  | "Reactivation opportunity"
  | "Existing customer support"
  | "Parts/service request"
  | "Low-fit inquiry"
  | "Vendor/agency"
  | "Student/research"
  | "Job seeker"
  | "Partnership"
  | "Spam/other";

export type Fit = "High" | "Medium" | "Low" | "Unknown" | "Not sales";

export type Urgency =
  | "High"
  | "Medium-high"
  | "Medium"
  | "Low"
  | "Unknown";

export type LeadSource =
  | "Website form"
  | "Sales inbox"
  | "Support form"
  | "Trade show"
  | "Landing page";

export type LeadStatus =
  | "Ready for sales"
  | "Needs qualification"
  | "Routed to support"
  | "Filtered"
  | "Nurture";

export type HandoffFeedback = "Useful" | "Needs edits" | "Wrong route";

export type LeadScenario = {
  id: string;
  title: string;
  shortDescription: string;
  inboundMessage: string;
  source: LeadSource;
  classification: {
    intent: LeadIntent;
    fit: Fit;
    urgency: Urgency;
    productArea: string;
    recommendedRoute: string;
    humanReviewRequired: boolean;
    confidence: number;
    reason: string;
  };
  extractedContext: {
    facilityType?: string;
    volume?: string;
    currentProcess?: string;
    painPoint?: string;
    timeline?: string;
    budget?: string;
    existingSystems?: string;
    newBuildOrRetrofit?: string;
    customerType?: string;
    locations?: string;
  };
  missingQuestions: string[];
  draftResponse: string;
  salesBrief: {
    subject: string;
    summary: string;
    recommendedNextStep: string;
    doNotDo: string[];
  };
  riskFlags: string[];
  status: LeadStatus;
};

export type QualificationResult = {
  lead: LeadScenario;
  inputKind: "matched" | "vague" | "unrelated" | "uncertain";
};
