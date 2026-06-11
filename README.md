# Softrol Revenue Desk — Inbound Qualification Demoware

Softrol Revenue Desk is a lightweight demoware product for Gushwork's AI-powered Inbound SDR assignment. It demonstrates how Softrol Systems could qualify, route, and summarize inbound inquiries across sales, support, service, low-fit, and non-sales categories.

## Product thesis

Softrol sells complex, high-value industrial laundry automation systems. Its inbound channels receive serious automation projects alongside support issues, parts requests, vague quote requests, small laundromat inquiries, students, vendors, and trade-show notes.

Revenue Desk turns each inquiry into a clear next step. The system prepares the inquiry; Softrol's team owns discovery and the commercial conversation.

The qualification logic is specific to Softrol's world: RFID garment and linen tracking, automated sortation, LOIS support, ERP integration, wash aisle controls, rail and material handling, and service requests.

Revenue Desk:

- separates sales opportunities from support, service, low-fit, and noise
- asks plant-specific qualification questions
- extracts facility, volume, process, pain, timeline, and systems context
- recommends the correct human route
- produces a sales-ready, CRM-ready brief
- keeps discovery, technical validation, pricing, proposals, and closing with Softrol's team

## Demo Mode

This prototype uses deterministic Softrol-specific qualification rules so the evaluation is reliable. In production, the same workflow can run on an LLM with approved knowledge and guardrails.

The deterministic runtime is intentional: reviewers can experience every scenario without an API key, network dependency, or variable model output.

## What the demo shows

### Overview

The product thesis, controlled first-mile workflow, visible qualification rules, a before-and-after qualification example, and clear ownership between the system and Softrol's team.

### Prospect Experience

A professional qualification conversation using a predefined scenario or custom inquiry. The experience asks only for missing context, then prepares the route and CRM-ready brief for human review.

### Sales Console

An internal revenue operations view with:

- executive inbound summary and pipeline-protection metrics
- searchable and filterable lead queue
- confidence and classification reasoning
- extracted context and missing questions
- controlled first-response draft
- CRM-ready brief copy and export actions
- risk flags and human control actions
- rep usefulness feedback

### Pilot Impact

A 30-day controlled pilot model focused on response quality, routing accuracy, qualified meetings, rep usefulness, and trust. The economic case is advancing high-fit opportunities faster and preventing valuable demand from going cold or being misrouted.

### Trade Show Mode

A sample import of five event leads categorized into high-fit, needs qualification, support/service, and low-fit outcomes.

## Demo scenarios

The application includes 12 complete scenarios:

1. High-fit healthcare RFID and reporting opportunity
2. Uniform rental RFID and automated sortation
3. Vague automated sorting quote request
4. Existing-customer LOIS support issue
5. RFID parts and scanner service request
6. Low-fit small laundromat
7. Multi-location enterprise visibility
8. ERP and route accounting integration
9. Student research request
10. Vendor/agency solicitation
11. Clean Show hospitality RFID lead
12. Dormant RFID content reactivation

Custom messages are handled conservatively. Empty input is rejected, vague input asks for foundational context, unrelated input is held outside the sales pipeline, and unknown details are never invented.

## Sales control

Revenue Desk is a controlled first-mile qualification layer for a complex industrial sales motion. The system qualifies, routes, prepares, summarizes, flags risks, asks missing questions, and creates a CRM-ready brief.

Softrol's team retains ownership:

- pricing stays with qualified human discovery
- reps own relationships, proposals, and closing
- Softrol specialists confirm technical feasibility and compatibility
- support teams own urgent operational response
- high-fit sales handoffs remain human-reviewed
- product and technical recommendations use approved knowledge

## Architecture

- Next.js App Router and React
- TypeScript domain model for every lead and classification
- Tailwind CSS with local accessible UI primitives
- Lucide icons and an offline-safe system font stack
- deterministic keyword-based qualification engine
- hardcoded scenario data
- browser-local interaction state
- no database, authentication, or external API

The shared `LeadScenario` contract keeps the prospect experience, console, exported briefs, and future model integration aligned.

## Run locally

Requirements: Node.js 20.9 or later and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Quality checks:

```bash
npm run lint
npm run typecheck
npm run build
```

## Deploy to Vercel

The application requires no environment variables.

```bash
vercel
```

For a production deployment:

```bash
vercel --prod
```

Alternatively, import the GitHub repository into Vercel and use the default Next.js build settings.

## Why this matters to sales leadership

Revenue Desk makes the first mile visible and controlled:

- every classification includes confidence and reasoning
- high-fit inquiries are prioritized with relevant plant context
- support and service are routed away from sales
- low-fit and non-sales traffic stays out of the pipeline
- reps approve handoffs and rate usefulness
- technical discovery, pricing, proposals, and closing remain with Softrol's team

The practical question is whether Softrol can respond to its best opportunities faster, with better context, while protecting rep time and customer trust.
