export type IntakeMessage = {
  role: "assistant" | "prospect";
  content: string;
};

export const scenarioIntakeFlows: Record<string, IntakeMessage[]> = {
  "healthcare-rfid": [
    {
      role: "assistant",
      content:
        "Thanks for reaching out. Are you looking for item-level RFID tracking, cart-level tracking, or both?",
    },
    {
      role: "prospect",
      content:
        "Ideally both. We need better accountability inside the plant and visibility for our hospital customers.",
    },
    {
      role: "assistant",
      content:
        "Understood. How many customer locations need reporting access, and is this for your current facility or a new build?",
    },
    {
      role: "prospect",
      content:
        "About 14 hospital locations. This would be a retrofit at our current plant, and we would like to evaluate implementation this year.",
    },
  ],
  "uniform-rental-sortation": [
    {
      role: "assistant",
      content:
        "To prepare the right specialist, is this a retrofit or a new facility, and how many people currently sort garments per shift?",
    },
    {
      role: "prospect",
      content:
        "It is a retrofit. We usually have 12 operators sorting on first shift and 8 on second.",
    },
    {
      role: "assistant",
      content:
        "Which route accounting or ERP system do you use, and what is driving the project most: labor, throughput, or mis-sorts?",
    },
    {
      role: "prospect",
      content:
        "We use ABS. Labor and mis-sorts are the main issues, and we want to make a decision within six months.",
    },
  ],
  "vague-sortation": [
    {
      role: "assistant",
      content:
        "Pricing depends on the operating environment. What type of facility do you run, and roughly how many garments do you process each day?",
    },
    {
      role: "prospect",
      content:
        "We are a uniform rental plant processing about 22,000 garments per day.",
    },
    {
      role: "assistant",
      content:
        "How do you sort today, and is this planned as a retrofit or part of a new build?",
    },
    {
      role: "prospect",
      content:
        "Mostly manual with barcode scans. It would be a retrofit, and labor availability is the main project driver.",
    },
  ],
  "lois-support": [
    {
      role: "assistant",
      content:
        "I’ll collect the details for priority support. Which facility and washer line are affected, and when did the data stop?",
    },
    {
      role: "prospect",
      content:
        "Softrol Healthcare Laundry in Nashville, washer line 3. It stopped updating around 7:15 this morning.",
    },
    {
      role: "assistant",
      content:
        "Is production blocked, or is the issue limited to reporting? Please also confirm the best callback number.",
    },
    {
      role: "prospect",
      content:
        "Production is still running; reporting is the issue. The plant manager can be reached at 615-555-0148.",
    },
  ],
  "parts-service": [
    {
      role: "assistant",
      content:
        "Which facility is this for, and what RFID tag type and quantity do you need?",
    },
    {
      role: "prospect",
      content:
        "Our Dallas uniform plant. We need 2,500 reusable garment tags.",
    },
    {
      role: "assistant",
      content:
        "Which scanner model needs configuration help, and is production currently affected?",
    },
    {
      role: "prospect",
      content:
        "It is an Impinj fixed reader. Production is running, but one station cannot commission new tags.",
    },
  ],
  "small-laundromat": [
    {
      role: "assistant",
      content:
        "To route this appropriately, do you also operate a commercial or institutional laundry facility?",
    },
    {
      role: "prospect",
      content:
        "No, this is only my neighborhood laundromat with six washers.",
    },
    {
      role: "assistant",
      content:
        "Are you planning a larger production facility or industrial automation project?",
    },
    {
      role: "prospect",
      content: "No, I’m only looking for a simple customer tracking app.",
    },
  ],
  "multi-location": [
    {
      role: "assistant",
      content:
        "What volume does each plant process, and are the three sites using the same production systems today?",
    },
    {
      role: "prospect",
      content:
        "The plants process 30,000, 42,000, and 55,000 pounds per day. The equipment mix varies by site.",
    },
    {
      role: "assistant",
      content:
        "Which reporting views need to be standardized, and who is involved in the evaluation this quarter?",
    },
    {
      role: "prospect",
      content:
        "Operations wants plant throughput and customer-level reporting. Our COO, three plant managers, and IT director are involved.",
    },
  ],
  "erp-integration": [
    {
      role: "assistant",
      content:
        "Which ERP and route accounting platforms are in use, and which data needs to move between systems?",
    },
    {
      role: "prospect",
      content:
        "We use Microsoft Dynamics 365 and ABS. We need production totals, route status, and delivery confirmation synchronized.",
    },
    {
      role: "assistant",
      content:
        "How frequently should the data update, and what plant software is installed today?",
    },
    {
      role: "prospect",
      content:
        "Near real-time would be ideal. We have mixed equipment and are still documenting the current software stack.",
    },
  ],
  "student-research": [
    {
      role: "assistant",
      content:
        "Is this request connected to an active laundry facility project or a commercial evaluation?",
    },
    {
      role: "prospect",
      content:
        "No, it is only for a college research project on industrial RFID systems.",
    },
    {
      role: "assistant",
      content:
        "Thanks for clarifying. Would approved public material on RFID laundry workflows be useful?",
    },
    {
      role: "prospect",
      content: "Yes, public material would be helpful.",
    },
  ],
  "vendor-agency": [
    {
      role: "assistant",
      content:
        "Is your message related to a Softrol customer project, installed system, or laundry automation requirement?",
    },
    {
      role: "prospect",
      content:
        "No, we are offering marketing and lead-generation services to Softrol.",
    },
    {
      role: "assistant",
      content:
        "Understood. Should this be treated as a vendor proposal rather than a customer inquiry?",
    },
    {
      role: "prospect",
      content: "Yes, it is a vendor proposal.",
    },
  ],
  "trade-show-hospitality": [
    {
      role: "assistant",
      content:
        "Which linen categories and operational handoffs do you most need to track?",
    },
    {
      role: "prospect",
      content:
        "Sheets, towels, and banquet linen. We lose visibility between finishing, cart makeup, and hotel delivery.",
    },
    {
      role: "assistant",
      content:
        "Is this for the existing plant, and who should join the follow-up next week?",
    },
    {
      role: "prospect",
      content:
        "It is for our existing plant. Our operations director and IT manager should join.",
    },
  ],
  "dormant-reactivation": [
    {
      role: "assistant",
      content:
        "Are you actively evaluating RFID for a facility, or are you still researching options?",
    },
    {
      role: "prospect",
      content:
        "We have moved into active evaluation for a regional healthcare laundry.",
    },
    {
      role: "assistant",
      content:
        "What volume does the plant process, and which tracking problem is the priority?",
    },
    {
      role: "prospect",
      content:
        "About 28,000 pounds per day. Customer linen accountability is the main issue.",
    },
  ],
};

export function createCustomIntakeFlow(
  questions: string[],
): IntakeMessage[] {
  const firstQuestion =
    questions[0] ?? "What type of facility or operation is this related to?";
  const secondQuestion =
    questions[1] ?? "What outcome are you trying to improve?";

  return [
    { role: "assistant", content: firstQuestion },
    {
      role: "prospect",
      content: "Those details are not available in the original request.",
    },
    { role: "assistant", content: secondQuestion },
    {
      role: "prospect",
      content:
        "Please have the appropriate team review the inquiry and confirm the next step.",
    },
  ];
}
