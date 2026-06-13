# Softrol Revenue Desk

**Inbound qualification for complex laundry automation sales**

Softrol Revenue Desk is a demoware product showing how Softrol Systems could turn messy inbound demand into a clear, human-owned next step.

Softrol sells complex industrial systems: RFID garment and linen tracking, automated sortation, LOIS reporting, wash aisle controls, rail and material handling, ERP integrations, parts, and service. An inbound channel for this business does not contain only sales leads. It also receives existing-customer support issues, service requests, vague pricing questions, low-fit inquiries, vendors, students, and trade-show follow-ups.

Revenue Desk acts as a controlled qualification layer between those inquiries and Softrol's teams. It collects missing operating context, identifies intent and fit, routes the inquiry, and prepares a sales-ready, CRM-ready brief before a rep spends time on it.

> The system prepares the inquiry; Softrol's team owns discovery and the commercial conversation.

## What Revenue Desk is meant to do

Revenue Desk is designed to improve the first mile of a complex industrial sales process.

It helps Softrol:

- distinguish new sales opportunities from support, service, low-fit, and non-sales traffic
- ask qualification questions specific to industrial laundry operations
- capture facility type, processing volume, current workflow, pain point, existing systems, timeline, and project type
- recognize relevant product areas such as RFID, sortation, LOIS, ERP integration, and wash aisle controls
- prioritize high-fit or urgent inquiries
- route each inquiry to the appropriate sales, technical, support, parts, or nurture workflow
- create a CRM-ready brief with context, missing information, risk flags, and a recommended next step

Revenue Desk does not replace Softrol's commercial or technical process. Pricing follows qualified human discovery, technical feasibility is confirmed by Softrol specialists, and high-fit handoffs remain human-reviewed.

## The product workflow

```text
Inbound inquiry
      ↓
Website intake conversation
      ↓
Missing context collected
      ↓
Intent, fit, urgency, and product area classified
      ↓
Correct team and next step recommended
      ↓
CRM-ready brief prepared
      ↓
Human review and follow-up
```

The distinction between **intake** and **qualification** is intentional:

1. Intake gathers the facts that are missing from the original inquiry.
2. Qualification evaluates the completed context using Softrol-specific rules.
3. Revenue Desk prepares the route and brief.
4. A human decides how Softrol should proceed.

## How the demoware works

The app has two primary demo surfaces and three supporting sections.

### 1. Prospect Experience

Prospect Experience simulates how a buyer would try the system through a Softrol website intake chat.

The demo flow is:

1. Select one of the 12 inbound scenarios or enter a custom inquiry.
2. The prospect's original message appears as the first chat message.
3. The intake assistant asks relevant follow-up questions.
4. Deterministic customer replies appear message by message to demonstrate the complete conversation.
5. A typing indicator, intake status, and automatic scrolling make the interaction behave like a live website chat.
6. **Run qualification** remains disabled until the intake conversation is complete.
7. The user manually runs qualification.
8. Revenue Desk displays the classification, recommended route, captured context, confidence reasoning, and CRM-ready handoff.

This separation makes the workflow visible: the assistant does not classify a vague message and immediately hand it to sales. It first collects the context needed to make the classification useful.

Custom inputs use the same flow, but unknown details are not invented. If the inquiry is vague, strange, unrelated, or incomplete, the system asks for foundational context and preserves uncertainty in the result.

### 2. Sales Console

Sales Console shows what Softrol's sales or revenue operations team receives after intake.

It includes:

- today's inbound snapshot and operating metrics
- searchable and filterable lead queue
- lead intent, fit, urgency, product area, route, and status
- raw inbound message and captured operating context
- classification confidence and reasoning
- unanswered qualification questions
- controlled first-response draft
- risk flags and explicit instructions about what not to do
- sales-ready, CRM-ready brief
- copy and export brief actions
- approve, assign, support-route, and low-fit controls
- rep feedback: `Useful`, `Needs edits`, or `Wrong route`

The console keeps the original inquiry and the prepared handoff visible together so a rep can understand why Revenue Desk recommended a route.

### Supporting sections

**Overview** explains the product thesis, qualification rules, human-control boundaries, and the before-to-after transformation from a vague inquiry to a structured brief.

**Pilot Impact** describes a controlled 30-day rollout and the metrics used to evaluate response quality, routing accuracy, qualified opportunities, rep usefulness, and trust.

**Trade Show Mode** demonstrates the same qualification system applied to event leads, including sales opportunities, incomplete leads, service requests, and low-fit contacts.

## How the voice intake agent works

The Prospect Experience tab offers both **typed** and **voice** intake modes, toggled via a switch in the UI.

### Architecture

The voice agent uses a server-side transcription pipeline instead of relying on the browser's built-in `SpeechRecognition` API (which requires Chrome's remote servers and fails in many environments).

```text
User speaks into mic
      ↓
Browser MediaRecorder captures audio (WebM/Opus)
      ↓
User clicks "Done speaking" (or 30s timeout)
      ↓
/api/transcribe → Groq Whisper (free) transcribes audio to text
      ↓
Transcript fed into adaptive question engine
      ↓
/api/voice-agent → OpenRouter LLM selects next follow-up question
      ↓ (fallback: deterministic Softrol-specific rules)
Agent speaks response via browser speechSynthesis
      ↓
Repeat until qualification is complete
      ↓
CRM-ready brief generated
```

### Key design decisions

- **Groq Whisper for transcription**: Free tier, no credit card required, OpenAI-compatible API. Falls back to OpenRouter's paid transcription endpoint if `GROQ_API_KEY` is not set.
- **MediaRecorder over SpeechRecognition**: Chrome's `webkitSpeechRecognition` depends on Google's remote servers and fails behind VPNs, strict privacy settings, or non-Chrome browsers. `MediaRecorder` captures audio locally and works everywhere.
- **Deterministic fallback**: If the `/api/voice-agent` LLM call fails, the engine falls back to a keyword-matched question bank with Softrol-specific follow-ups. The qualification result uses the same `LeadScenario` schema either way.
- **Transcript deduplication**: The deterministic fallback tracks which questions have already been asked and skips them, preventing repeated questions even when the user's answer doesn't match expected patterns.
- **No audio persistence**: The recorded audio blob is sent to the server, transcribed, and discarded. Only the text transcript is retained for the session.
- **Browser speech synthesis**: Agent responses are spoken using the native `speechSynthesis` API — no TTS API costs.

### Voice controls

| Control | Action |
|---------|--------|
| **Start voice intake** | Requests mic permission, begins the conversation |
| **Done speaking** ✓ | Manually end your turn and submit for transcription |
| **30s timeout** | Auto-submits if user doesn't click Done |
| **Speaker mute** 🔇 | Silence agent speech while keeping the flow running |
| **End call** 📞 | Terminate the session |

## How qualification works

The qualification engine looks for combinations of domain signals rather than treating every inquiry as a sales lead.

### High-fit signals

- industrial laundry, textile rental, healthcare laundry, hospitality linen, or uniform rental
- meaningful daily processing volume
- multi-location operations
- RFID, automated sortation, LOIS, ERP, rail, or wash aisle requirements
- active project timeline or evaluation language

### Support and escalation signals

- existing-customer language
- system, dashboard, scanner, or washer-line issues
- production disruption or urgent language
- replacement parts and configuration requests

### Low-fit and non-sales signals

- small retail laundromat requirements
- student or research requests
- vendor and agency solicitation
- unrelated consumer software needs
- incomplete or nonsensical messages

The engine combines these signals with the inquiry's extracted context to produce:

- intent
- fit
- urgency
- relevant product area
- recommended route
- confidence and reasoning
- missing questions
- risk flags
- a draft response
- a CRM-ready brief

## Demo scenarios

The app includes 12 complete inbound scenarios:

1. High-fit healthcare RFID and reporting opportunity
2. Uniform rental RFID and automated sortation project
3. Vague automated sorting quote request
4. Existing-customer LOIS support issue
5. RFID parts and scanner service request
6. Low-fit small laundromat inquiry
7. Multi-location enterprise visibility project
8. ERP and route accounting integration
9. Student research request
10. Vendor or agency solicitation
11. Clean Show hospitality RFID lead
12. Dormant RFID content reactivation

Each scenario has its own scripted intake conversation while retaining the original classification and CRM-ready output.

## Human control and guardrails

Revenue Desk can qualify, route, prepare, summarize, flag, and ask missing questions. It does not:

- provide final pricing
- confirm technical feasibility or compatibility
- create unsupported product claims
- autonomously troubleshoot urgent operational issues
- send a high-fit sales handoff without human review
- own relationships, proposals, negotiation, or closing

Softrol's sales, technical, support, and service teams remain responsible for the decisions that require product expertise, commercial judgment, or customer accountability.

## Architecture

- Next.js App Router
- React and TypeScript
- Tailwind CSS with local accessible UI primitives
- Lucide icons
- shared `LeadScenario` domain model
- 12 hardcoded Softrol-specific scenarios
- deterministic keyword and rule-based qualification
- scripted intake flows for scenario conversations
- browser-local interaction state and feedback
- `MediaRecorder` audio capture with server-side Groq Whisper transcription
- optional OpenRouter LLM integration for adaptive voice follow-ups
- deterministic Softrol-specific fallback with no database or authentication

The shared lead contract keeps Prospect Experience, Sales Console, brief exports, and future AI integrations aligned. A production implementation could replace the deterministic classifier and scripted replies with an approved LLM or voice channel while preserving the same intake states, qualification schema, guardrails, and human-review workflow.

## Project structure

```text
src/
├── app/
│   ├── api/
│   │   ├── transcribe/route.ts  Groq Whisper / OpenRouter STT endpoint
│   │   └── voice-agent/route.ts OpenRouter LLM for adaptive follow-ups
│   └── ...                      Next.js application shell
├── components/
│   ├── revenue-desk.tsx         Main product UI and interactions
│   └── voice-intake.tsx         Voice intake panel, waveform, controls
└── lib/
    ├── intake-flows.ts          Scripted website intake conversations
    ├── qualifier.ts             Deterministic custom-input qualification
    ├── scenarios.ts             Softrol lead scenarios and expected outputs
    ├── voice-agent.ts           Deterministic fallback rules and question bank
    ├── voice-engine.ts          MediaRecorder capture and conversation state machine
    ├── voice-types.ts           Voice state machine types and browser detection
    └── types.ts                 Shared lead and classification contracts
```

## Run locally

Requirements: Node.js 20.9 or later and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The core app runs without environment variables. To enable voice intake, add to `.env.local`:

```bash
# Required for voice transcription (free, no credit card)
GROQ_API_KEY=your_groq_api_key

# Required for adaptive LLM-driven follow-up questions
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=nex-agi/nex-n2-pro:free
```

Get a free Groq API key at [console.groq.com](https://console.groq.com). The transcription uses `whisper-large-v3-turbo` by default (override with `GROQ_STT_MODEL`). If `GROQ_API_KEY` is not set, the route falls back to OpenRouter's paid transcription endpoint (`openai/gpt-4o-mini-transcribe`, requires balance).

For Vercel deployments, add these variables in **Settings → Environment Variables** and redeploy. Qualification automatically falls back to deterministic Softrol-specific rules when the LLM is unavailable; voice transcription requires at least `GROQ_API_KEY`.

Quality checks:

```bash
npm run lint
npm run typecheck
npm run build
```

## Deployment

The core app requires no environment variables or external services. OpenRouter variables are optional and only enable the model-backed voice path.

Use the current Vercel CLI:

```bash
npm install --global vercel@latest
```

Then create or link the deployment:

```bash
vercel
```

For a production deployment:

```bash
vercel --prod
```

The repository can also be imported directly into Vercel using the default Next.js build settings.

## Pilot hypothesis

The business case is not based only on replacing manual work. It is based on helping Softrol:

- respond to serious opportunities while buyer intent is fresh
- prevent high-value inquiries from going slow or being misrouted
- keep support and service traffic out of the sales pipeline
- give reps better context before discovery begins
- create a consistent and measurable inbound qualification process

If Revenue Desk advances even one additional high-fit automation opportunity faster, the value of the pilot can exceed the operational time saved.
