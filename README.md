# Softrol Revenue Desk — AI Inbound SDR Demoware

Softrol Revenue Desk is a lightweight demoware product for Gushwork's AI-powered Inbound SDR assignment. It demonstrates how a controlled AI qualification layer could help Softrol Systems classify, qualify, route, and summarize inbound inquiries across sales, support, service, low-fit, and non-sales categories.

## Product thesis

Softrol sells complex, high-value industrial laundry automation systems. Its inbound inquiries are valuable but messy: serious automation projects arrive beside support issues, parts requests, vague quote requests, small laundromat inquiries, students, vendors, and trade-show notes.

Softrol does not need AI to sell for its reps. It needs AI to make every inbound inquiry sales-ready before a rep spends time on it.

Revenue Desk:

- separates sales opportunities from support, service, low-fit, and noise
- asks plant-specific qualification questions
- extracts facility, volume, process, pain, timeline, and systems context
- recommends the correct human route
- produces a sales-ready, CRM-ready brief
- keeps pricing, technical feasibility, relationships, and closing with people

## Demo Mode

This prototype uses deterministic Softrol-specific qualification rules so the evaluation is reliable. In production, the same workflow can run on an LLM with approved knowledge and guardrails.

The deterministic runtime is intentional: reviewers can experience every scenario without an API key, network dependency, variable model output, or an unsafe response.

## What the demo shows

### Overview

The product thesis, controlled first-mile workflow, visible qualification rules, explicit AI boundaries, a before-and-after qualification example, and the trust model for a skeptical VP of Sales.

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

A 30-day controlled pilot model focused on response quality, routing accuracy, qualified meetings, rep usefulness, and trust. The economic case is not replacing reps; it is advancing one additional high-fit opportunity faster and preventing valuable demand from going cold or being misrouted.

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

## Guardrails

This demo intentionally avoids autonomous quoting or technical promises. The goal is to demonstrate a controlled first-mile qualification layer for a complex industrial sales motion. Softrol's reps remain in control; the AI prepares inbound inquiries so humans can follow up faster and with better context.

The product never:

- provides final pricing
- promises technical feasibility or compatibility
- replaces sales judgment
- troubleshoots critical support issues autonomously
- invents product capabilities or missing customer context
- sends unsupported technical recommendations

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

## Why this matters to a skeptical VP of Sales

Revenue Desk does not ask sales leadership to trust an autonomous agent with complex deals. It makes the first mile visible and controlled:

- every classification includes confidence and reasoning
- high-fit inquiries are prioritized with relevant plant context
- support and service are routed away from sales
- low-fit and non-sales traffic stays out of the pipeline
- reps approve handoffs and rate usefulness
- technical discovery, pricing, proposals, and closing remain human-owned

The useful question is not "Can AI replace a rep?" It is "Can Softrol respond to its best opportunities faster, with better context, while protecting rep time and customer trust?"
