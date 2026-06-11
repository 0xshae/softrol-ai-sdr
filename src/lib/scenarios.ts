import type { LeadScenario } from "@/lib/types";

export const leadScenarios: LeadScenario[] = [
  {
    id: "healthcare-rfid",
    title: "High-fit healthcare RFID opportunity",
    shortDescription: "80,000 lbs/day, multiple hospitals, manual linen counts",
    inboundMessage:
      "Hi, we operate a healthcare laundry facility processing around 80,000 lbs/day across multiple hospital customers. We’re looking for better linen tracking and reporting. We currently rely on manual counts and spreadsheets. Can Softrol help?",
    source: "Website form",
    classification: {
      intent: "New sales opportunity",
      fit: "High",
      urgency: "Medium-high",
      productArea: "RFID linen tracking + LOIS-style reporting",
      recommendedRoute: "Senior sales / healthcare laundry specialist",
      humanReviewRequired: true,
      confidence: 92,
      reason:
        "The inquiry identifies a high-volume healthcare laundry, multiple hospital customers, and specific tracking and reporting pain.",
    },
    extractedContext: {
      facilityType: "Healthcare laundry",
      volume: "Approximately 80,000 lbs/day",
      currentProcess: "Manual counts and spreadsheets",
      painPoint: "Limited linen tracking and reporting visibility",
      customerType: "Multiple hospital customers",
    },
    missingQuestions: [
      "Are you looking for item-level RFID tracking, cart-level tracking, or both?",
      "How many hospital or customer locations need reporting visibility?",
      "What reporting gaps are causing the biggest operational pain today?",
      "Are you evaluating this for a current facility or a new build?",
      "What is your target implementation timeline?",
    ],
    draftResponse:
      "Thanks for reaching out. Your volume and multi-customer reporting needs suggest this is worth a focused conversation with our healthcare laundry team. Before that handoff, could you share whether you need item-level tracking, cart-level tracking, or both, and how many customer locations need reporting visibility?",
    salesBrief: {
      subject: "Healthcare laundry evaluating RFID tracking and reporting",
      summary:
        "High-volume healthcare laundry processing approximately 80,000 lbs/day for multiple hospital customers. Current tracking relies on manual counts and spreadsheets, creating a need for stronger linen visibility and reporting.",
      recommendedNextStep:
        "Senior sales and healthcare laundry specialist to run discovery on tracking level, reporting users, current facility constraints, and implementation timeline.",
      doNotDo: [
        "Do not quote before technical discovery.",
        "Do not promise compatibility or implementation scope.",
      ],
    },
    riskFlags: ["Do not quote yet; needs technical discovery."],
    status: "Ready for sales",
  },
  {
    id: "uniform-rental-sortation",
    title: "Uniform rental RFID + sortation",
    shortDescription: "35,000 garments/day, barcode scanning, manual sorting",
    inboundMessage:
      "We process about 35,000 garments/day at a uniform rental facility. We currently use barcode scanning with manual sortation and are considering RFID plus automated sorting. Can someone send pricing?",
    source: "Sales inbox",
    classification: {
      intent: "New sales opportunity",
      fit: "High",
      urgency: "Medium-high",
      productArea: "RFID garment tracking + automated sortation",
      recommendedRoute: "Sales / automation specialist",
      humanReviewRequired: true,
      confidence: 95,
      reason:
        "The facility type, meaningful garment volume, current barcode workflow, and stated RFID and sortation project are all strong fit signals.",
    },
    extractedContext: {
      facilityType: "Uniform rental facility",
      volume: "Approximately 35,000 garments/day",
      currentProcess: "Barcode scanning with manual sortation",
      painPoint: "Manual sorting workflow",
    },
    missingQuestions: [
      "Is this planned as a retrofit or part of a new facility?",
      "How many sorting operators work per shift?",
      "What is the current mis-sort rate?",
      "Which ERP or route accounting system is in use?",
      "What is the target project timeline?",
    ],
    draftResponse:
      "Thanks for the detail. Pricing for RFID-enabled automated sortation depends on the existing conveyor and scanning environment, target throughput, and whether this is a retrofit or new build. I can collect a few operating details so the right automation specialist follows up prepared.",
    salesBrief: {
      subject: "Uniform rental plant evaluating RFID and automated sortation",
      summary:
        "Uniform rental operator processing roughly 35,000 garments/day is considering a move from barcode scanning and manual sortation to RFID-enabled automated sorting.",
      recommendedNextStep:
        "Automation specialist to assess retrofit constraints, labor baseline, mis-sort rate, system integrations, and target timeline.",
      doNotDo: [
        "Do not provide pricing from the inbound message alone.",
        "Do not assume existing equipment compatibility.",
      ],
    },
    riskFlags: ["Pricing requested before scope and facility discovery."],
    status: "Ready for sales",
  },
  {
    id: "vague-sortation",
    title: "Vague automated sorting quote",
    shortDescription: "Pricing request with no facility or volume context",
    inboundMessage:
      "Need pricing for an automated garment sorting system. Please send details.",
    source: "Website form",
    classification: {
      intent: "Needs qualification",
      fit: "Unknown",
      urgency: "Unknown",
      productArea: "Automated garment sortation",
      recommendedRoute: "AI follow-up before sales handoff",
      humanReviewRequired: false,
      confidence: 88,
      reason:
        "The product interest is relevant, but facility type, daily volume, current process, project type, and business driver are missing.",
    },
    extractedContext: {
      painPoint: "Interested in automated garment sorting",
    },
    missingQuestions: [
      "What type of facility do you operate?",
      "How many garments do you process per day?",
      "Are you currently sorting manually, by barcode, or RFID?",
      "Is this for a retrofit or a new facility?",
      "What is driving the project: labor reduction, throughput, mis-sorts, or visibility?",
    ],
    draftResponse:
      "Thanks for reaching out. Pricing for automated sortation depends heavily on facility type, daily volume, current sorting process, and whether this is a retrofit or new build. I can collect a few details so the right Softrol specialist can follow up prepared. What type of facility do you operate, and roughly how many garments do you process per day?",
    salesBrief: {
      subject: "Automated sortation pricing request needs qualification",
      summary:
        "Inbound contact requested automated garment sorting pricing but provided no operating context.",
      recommendedNextStep:
        "Use controlled follow-up to establish facility type, volume, current process, project type, and primary business driver before assigning sales.",
      doNotDo: [
        "Do not send budgetary pricing yet.",
        "Do not consume specialist time before basic qualification.",
      ],
    },
    riskFlags: ["Insufficient context for pricing or technical recommendation."],
    status: "Needs qualification",
  },
  {
    id: "lois-support",
    title: "Existing customer LOIS issue",
    shortDescription: "Production data missing from a washer line this morning",
    inboundMessage:
      "Our LOIS dashboard stopped showing production data from one washer line this morning. Can someone help?",
    source: "Support form",
    classification: {
      intent: "Existing customer support",
      fit: "Not sales",
      urgency: "High",
      productArea: "LOIS / washer-line production data",
      recommendedRoute: "Priority support queue",
      humanReviewRequired: true,
      confidence: 99,
      reason:
        "An installed LOIS dashboard stopped reporting production data from an operating washer line today.",
    },
    extractedContext: {
      currentProcess: "LOIS production dashboard",
      painPoint: "One washer line stopped reporting production data",
      timeline: "Started this morning",
      existingSystems: "LOIS",
    },
    missingQuestions: [
      "What is the facility name?",
      "Which washer line is affected?",
      "What time did reporting stop?",
      "Is production blocked or is this a reporting-only issue?",
      "What is the best callback number?",
    ],
    draftResponse:
      "I’m routing this to Softrol support as a priority. To help the team respond quickly, please share your facility name, the affected washer line, when reporting stopped, whether production itself is blocked, and the best callback number.",
    salesBrief: {
      subject: "Priority support: LOIS washer-line data interruption",
      summary:
        "Existing customer reports that one washer line stopped sending production data to LOIS this morning. Operational impact is not yet confirmed.",
      recommendedNextStep:
        "Support should confirm production impact, affected line, facility, start time, and callback information immediately.",
      doNotDo: [
        "Do not route to the sales pipeline.",
        "Do not attempt autonomous troubleshooting.",
      ],
    },
    riskFlags: ["Potential operational interruption.", "Support ownership required."],
    status: "Routed to support",
  },
  {
    id: "parts-service",
    title: "RFID parts and scanner service",
    shortDescription: "Replacement tags and scanner configuration support",
    inboundMessage:
      "We need replacement RFID tags and help with scanner configuration at our plant. Who should we contact?",
    source: "Sales inbox",
    classification: {
      intent: "Parts/service request",
      fit: "Not sales",
      urgency: "Medium",
      productArea: "RFID tags + scanner configuration",
      recommendedRoute: "Parts / support",
      humanReviewRequired: true,
      confidence: 97,
      reason:
        "The inquiry requests replacement components and configuration help for an installed RFID environment, with no expansion mentioned.",
    },
    extractedContext: {
      facilityType: "Existing plant",
      painPoint: "Needs replacement RFID tags and scanner configuration",
      existingSystems: "RFID scanners",
    },
    missingQuestions: [
      "What is the facility name and customer account?",
      "Which tag type and quantity are needed?",
      "Which scanner model requires configuration help?",
      "Is production currently affected?",
    ],
    draftResponse:
      "I’ll route this to the parts and support team. Please share your facility name, the RFID tag type and quantity, the scanner model, and whether production is currently affected.",
    salesBrief: {
      subject: "Parts/service request for RFID tags and scanner configuration",
      summary:
        "Existing plant needs replacement RFID tags and scanner configuration assistance. No new-system expansion is mentioned.",
      recommendedNextStep:
        "Parts/support to confirm account, part specifications, scanner model, and operational impact.",
      doNotDo: [
        "Do not create a new sales opportunity unless expansion needs emerge.",
      ],
    },
    riskFlags: ["Confirm whether production is affected."],
    status: "Routed to support",
  },
  {
    id: "small-laundromat",
    title: "Small laundromat app request",
    shortDescription: "Six washers, consumer-scale tracking need",
    inboundMessage:
      "I own a small laundromat with 6 washers and want a cheap app to track customer clothes. What is the price?",
    source: "Website form",
    classification: {
      intent: "Low-fit inquiry",
      fit: "Low",
      urgency: "Low",
      productArea: "Tracking software / outside core industrial scale",
      recommendedRoute: "Nurture / general response",
      humanReviewRequired: false,
      confidence: 96,
      reason:
        "A six-washer retail laundromat seeking a low-cost consumer app is outside Softrol’s typical industrial automation profile.",
    },
    extractedContext: {
      facilityType: "Small retail laundromat",
      currentProcess: "Six washers",
      painPoint: "Customer clothing tracking",
      budget: "Seeking a low-cost application",
    },
    missingQuestions: [
      "Do you process commercial or institutional laundry at another location?",
      "Are you planning a larger production facility or automation project?",
    ],
    draftResponse:
      "Thanks for contacting Softrol. Our systems are generally designed for larger industrial laundry and textile-rental operations. To make sure we route you appropriately, do you also operate a commercial production facility or have plans for a larger automation project?",
    salesBrief: {
      subject: "Small laundromat tracking inquiry",
      summary:
        "Six-washer retail laundromat is looking for an inexpensive customer-clothing tracking app. This appears outside Softrol’s primary industrial market.",
      recommendedNextStep:
        "Send a courteous qualification response and keep out of the active sales pipeline unless a larger commercial operation is identified.",
      doNotDo: ["Do not reject harshly.", "Do not assign senior sales."],
    },
    riskFlags: ["Likely outside industrial-scale product fit."],
    status: "Nurture",
  },
  {
    id: "multi-location",
    title: "Multi-location enterprise visibility",
    shortDescription: "Three regional plants evaluating this quarter",
    inboundMessage:
      "We operate 3 regional laundry plants and want centralized tracking/reporting across all sites. We are evaluating options this quarter.",
    source: "Sales inbox",
    classification: {
      intent: "New sales opportunity",
      fit: "High",
      urgency: "High",
      productArea: "Multi-site tracking + centralized plant reporting",
      recommendedRoute: "Senior sales / enterprise solutions",
      humanReviewRequired: true,
      confidence: 94,
      reason:
        "The inquiry describes a multi-plant laundry organization, cross-site visibility requirements, and an active evaluation this quarter.",
    },
    extractedContext: {
      facilityType: "Regional laundry network",
      timeline: "Evaluating this quarter",
      painPoint: "Centralized tracking and reporting across sites",
      locations: "Three regional plants",
    },
    missingQuestions: [
      "Where are the three plants located?",
      "What is the processing volume at each site?",
      "Which systems and equipment are currently in use?",
      "Which reporting views must be standardized across sites?",
      "Who is involved in the evaluation and approval process?",
    ],
    draftResponse:
      "A three-plant reporting initiative is a strong fit for a structured discovery conversation. I can collect a few details so our enterprise team understands the current systems, volumes, reporting requirements, and decision timeline before following up.",
    salesBrief: {
      subject: "Three-plant operator evaluating centralized visibility",
      summary:
        "Enterprise laundry operator wants centralized tracking and reporting across three regional plants and is evaluating options this quarter.",
      recommendedNextStep:
        "Senior sales to coordinate multi-site discovery with technical support for systems, data, reporting, and rollout requirements.",
      doNotDo: [
        "Do not assume a uniform equipment stack across locations.",
        "Do not promise a rollout sequence before discovery.",
      ],
    },
    riskFlags: ["Multi-site integration scope requires technical validation."],
    status: "Ready for sales",
  },
  {
    id: "erp-integration",
    title: "ERP and route accounting integration",
    shortDescription: "Production and delivery data synchronization",
    inboundMessage:
      "Can Softrol integrate with our existing ERP and route accounting system? We need production and delivery data to sync automatically.",
    source: "Website form",
    classification: {
      intent: "New sales opportunity",
      fit: "Medium",
      urgency: "Medium",
      productArea: "ERP + route accounting integration",
      recommendedRoute: "Sales + technical integration specialist",
      humanReviewRequired: true,
      confidence: 86,
      reason:
        "The requested production and delivery data integration is relevant, but facility scale, current stack, and project timing are unknown.",
    },
    extractedContext: {
      painPoint: "Production and delivery data do not sync automatically",
      existingSystems: "Existing ERP and route accounting system",
    },
    missingQuestions: [
      "Which ERP and route accounting platforms are in use?",
      "Which data must flow in each direction?",
      "How frequently should data update?",
      "What equipment and plant software are currently installed?",
      "What is the target timeline?",
    ],
    draftResponse:
      "Softrol integration possibilities depend on the systems, data flows, update frequency, and equipment environment. I can capture those details for a sales and technical review. Which ERP and route accounting platforms are you using today?",
    salesBrief: {
      subject: "ERP and route accounting integration inquiry",
      summary:
        "Prospect wants production and delivery data to synchronize with existing ERP and route accounting systems. Platform and facility context remain unknown.",
      recommendedNextStep:
        "Joint sales and technical qualification focused on systems, required data flows, update frequency, equipment stack, and timeline.",
      doNotDo: ["Do not promise integration feasibility before technical review."],
    },
    riskFlags: ["Compatibility is unverified.", "Technical discovery required."],
    status: "Needs qualification",
  },
  {
    id: "student-research",
    title: "Student architecture research",
    shortDescription: "College project requesting full system architecture",
    inboundMessage:
      "Hi, I’m a student working on a college project about RFID in laundry automation. Can your sales team explain your full system architecture?",
    source: "Website form",
    classification: {
      intent: "Student/research",
      fit: "Not sales",
      urgency: "Low",
      productArea: "Public RFID education resources",
      recommendedRoute: "Public resources / general inbox",
      humanReviewRequired: false,
      confidence: 99,
      reason:
        "The sender explicitly identifies a college research project rather than a commercial buying process.",
    },
    extractedContext: {
      customerType: "Student / academic research",
      painPoint: "Seeking system architecture information",
    },
    missingQuestions: [],
    draftResponse:
      "Thanks for your interest in laundry automation. Our sales team focuses on active customer projects, but we can point you toward public information about RFID and industrial laundry workflows. We’re not able to provide confidential system architecture details.",
    salesBrief: {
      subject: "Student research request",
      summary:
        "College student requests a detailed explanation of Softrol’s RFID system architecture for an academic project.",
      recommendedNextStep:
        "Respond with approved public resources through the general inbox; do not create a sales lead.",
      doNotDo: [
        "Do not route to sales.",
        "Do not share confidential architecture details.",
      ],
    },
    riskFlags: ["Protect confidential technical information."],
    status: "Filtered",
  },
  {
    id: "vendor-agency",
    title: "SEO agency solicitation",
    shortDescription: "Guaranteed lead-generation pitch to Softrol",
    inboundMessage:
      "We help companies like Softrol generate more SEO traffic and guaranteed leads. Can we book a call with your VP of Sales?",
    source: "Sales inbox",
    classification: {
      intent: "Vendor/agency",
      fit: "Not sales",
      urgency: "Low",
      productArea: "Not applicable",
      recommendedRoute: "Filtered / admin",
      humanReviewRequired: false,
      confidence: 99,
      reason:
        "This is an agency solicitation selling marketing services to Softrol, not a customer inquiry.",
    },
    extractedContext: {
      customerType: "Marketing vendor",
      painPoint: "Soliciting SEO and lead-generation services",
    },
    missingQuestions: [],
    draftResponse:
      "Thank you for reaching out. This inbox is reserved for customer sales and service inquiries. We’ll route vendor proposals through the appropriate administrative channel when relevant.",
    salesBrief: {
      subject: "Vendor solicitation: SEO services",
      summary:
        "Marketing agency is requesting access to the VP of Sales to pitch SEO and lead-generation services.",
      recommendedNextStep: "Filter from the revenue pipeline.",
      doNotDo: ["Do not assign to sales.", "Do not count as inbound demand."],
    },
    riskFlags: ["Non-customer solicitation."],
    status: "Filtered",
  },
  {
    id: "trade-show-hospitality",
    title: "Clean Show hospitality lead",
    shortDescription: "45,000 lbs/day, RFID interest, follow-up next week",
    inboundMessage:
      "Met at Clean Show. Interested in RFID for hospitality linen operation. Around 45,000 lbs/day. Wants follow-up next week.",
    source: "Trade show",
    classification: {
      intent: "New sales opportunity",
      fit: "High",
      urgency: "Medium-high",
      productArea: "RFID hospitality linen tracking",
      recommendedRoute: "Sales / hospitality laundry specialist",
      humanReviewRequired: true,
      confidence: 93,
      reason:
        "A known event contact provided relevant facility type, meaningful volume, RFID interest, and a specific follow-up window.",
    },
    extractedContext: {
      facilityType: "Hospitality linen operation",
      volume: "Approximately 45,000 lbs/day",
      timeline: "Follow up next week",
      painPoint: "Interested in RFID tracking",
    },
    missingQuestions: [
      "Which linen categories need tracking?",
      "What tracking process is used today?",
      "Is this for an existing plant or planned expansion?",
      "Who else should join the follow-up?",
    ],
    draftResponse:
      "It was good meeting you at Clean Show. We noted your interest in RFID for a hospitality linen operation processing about 45,000 lbs/day. Before next week’s follow-up, could you share which linen categories and operational handoffs you most need to track?",
    salesBrief: {
      subject: "Clean Show follow-up: hospitality RFID opportunity",
      summary:
        "Hospitality linen operator processing approximately 45,000 lbs/day expressed RFID interest at Clean Show and requested follow-up next week.",
      recommendedNextStep:
        "Assign hospitality laundry specialist and schedule discovery for next week with event context attached.",
      doNotDo: ["Do not send generic post-event nurture only."],
    },
    riskFlags: ["Follow-up window is time-sensitive."],
    status: "Ready for sales",
  },
  {
    id: "dormant-reactivation",
    title: "Dormant RFID content lead",
    shortDescription: "Guide download followed by renewed page activity",
    inboundMessage:
      "Downloaded RFID laundry guide 3 months ago. Revisited RFID tracking page twice this week. No meeting booked.",
    source: "Landing page",
    classification: {
      intent: "Reactivation opportunity",
      fit: "Unknown",
      urgency: "Medium",
      productArea: "RFID garment / linen tracking",
      recommendedRoute: "AI follow-up before sales handoff",
      humanReviewRequired: false,
      confidence: 79,
      reason:
        "Renewed engagement with RFID content suggests possible active evaluation, but facility profile and buying intent are not yet known.",
    },
    extractedContext: {
      timeline: "Guide downloaded three months ago; two page visits this week",
      painPoint: "Possible renewed RFID evaluation",
    },
    missingQuestions: [
      "Are you actively evaluating RFID tracking or still researching options?",
      "What type of laundry operation do you run?",
      "What volume do you process?",
      "Which tracking problem are you trying to solve?",
    ],
    draftResponse:
      "You recently revisited our RFID tracking resources. If this has become an active priority, I can help route you to the right Softrol specialist. Are you currently evaluating RFID for a facility, or are you still in the research stage?",
    salesBrief: {
      subject: "Reactivation signal from RFID content engagement",
      summary:
        "Dormant content lead downloaded an RFID guide three months ago and returned to the RFID tracking page twice this week. Commercial context is not yet known.",
      recommendedNextStep:
        "Send a low-pressure qualification message to establish active intent, facility type, volume, and tracking need before involving sales.",
      doNotDo: [
        "Do not assume buying intent from page activity alone.",
        "Do not assign sales until basic fit is confirmed.",
      ],
    },
    riskFlags: ["Behavioral signal only; intent is unconfirmed."],
    status: "Needs qualification",
  },
];

export const tradeShowImports: LeadScenario[] = [
  leadScenarios[10],
  {
    ...leadScenarios[1],
    id: "trade-uniform",
    title: "Uniform rental modernization",
    source: "Trade show",
  },
  {
    ...leadScenarios[2],
    id: "trade-vague-sort",
    title: "Booth scan: sortation interest",
    source: "Trade show",
  },
  {
    ...leadScenarios[4],
    id: "trade-service",
    title: "Installed-base scanner request",
    source: "Trade show",
  },
  {
    ...leadScenarios[5],
    id: "trade-low-fit",
    title: "Small retail laundry visitor",
    source: "Trade show",
    status: "Filtered",
  },
];
