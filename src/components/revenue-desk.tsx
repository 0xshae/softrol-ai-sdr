"use client";

import {
  Activity,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clipboard,
  Clock3,
  Copy,
  Download,
  Factory,
  FileCheck2,
  Filter,
  Gauge,
  Handshake,
  Headphones,
  Inbox,
  Layers3,
  Menu,
  MessageSquareText,
  PanelTop,
  RefreshCw,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  ThumbsUp,
  UserCheck,
  Users,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  createCustomIntakeFlow,
  scenarioIntakeFlows,
} from "@/lib/intake-flows";
import { formatCrmBrief, qualifyCustomInput } from "@/lib/qualifier";
import { leadScenarios, tradeShowImports } from "@/lib/scenarios";
import type {
  HandoffFeedback,
  LeadScenario,
  LeadStatus,
} from "@/lib/types";
import { Badge, Button, Card, EmptyValue, MetricCard, SectionLabel, cn } from "./ui";

type TabId = "overview" | "prospect" | "console" | "pilot" | "trade";

const tabs: Array<{ id: TabId; label: string; icon: typeof PanelTop }> = [
  { id: "overview", label: "Overview", icon: PanelTop },
  { id: "prospect", label: "Prospect Experience", icon: MessageSquareText },
  { id: "console", label: "Sales Console", icon: BarChart3 },
  { id: "pilot", label: "Pilot Impact", icon: Gauge },
  { id: "trade", label: "Trade Show Mode", icon: Users },
];

const primaryTabs = tabs.filter(
  (tab) => tab.id === "prospect" || tab.id === "console",
);
const supportingTabs = tabs.filter(
  (tab) => tab.id !== "prospect" && tab.id !== "console",
);

const statusTone = (status: LeadStatus) => {
  if (status === "Ready for sales") return "emerald" as const;
  if (status === "Needs qualification") return "amber" as const;
  if (status === "Routed to support") return "red" as const;
  if (status === "Nurture") return "blue" as const;
  return "slate" as const;
};

const fitTone = (fit: LeadScenario["classification"]["fit"]) => {
  if (fit === "High") return "emerald" as const;
  if (fit === "Medium") return "blue" as const;
  if (fit === "Low") return "amber" as const;
  if (fit === "Not sales") return "red" as const;
  return "slate" as const;
};

const urgencyTone = (urgency: LeadScenario["classification"]["urgency"]) => {
  if (urgency === "High") return "red" as const;
  if (urgency === "Medium-high") return "amber" as const;
  if (urgency === "Medium") return "blue" as const;
  return "slate" as const;
};

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-300">
        <Layers3 size={20} />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="font-semibold tracking-tight text-white">Softrol</span>
          <span className="text-slate-500">/</span>
          <span className="text-sm text-slate-300">Revenue Desk</span>
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
          Inbound intelligence
        </p>
      </div>
    </div>
  );
}

function DemoModeNote({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] text-slate-300",
        compact ? "px-3 py-2" : "p-3.5",
      )}
    >
      <ShieldCheck className="mt-0.5 shrink-0 text-slate-500" size={16} />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500">
          Demo Mode
        </p>
        {!compact ? (
          <p className="mt-1 text-xs leading-5 text-slate-500">
            This prototype uses deterministic Softrol-specific qualification rules
            so the evaluation is reliable. In production, the same workflow can run
            on an LLM with approved knowledge and guardrails.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function AppHeader({
  activeTab,
  onTabChange,
}: {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#071018]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1540px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-3 lg:flex">
          <div className="flex items-center gap-1 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.045] p-1">
            <span className="px-2 text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-300">
              Live demo
            </span>
            {primaryTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70",
                    activeTab === tab.id
                      ? "bg-cyan-300 text-[#061219] shadow-[0_8px_24px_rgba(75,209,229,0.14)]"
                      : "text-cyan-100 hover:bg-cyan-300/10",
                  )}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-0.5 rounded-xl border border-white/[0.07] bg-white/[0.025] p-1">
            <span className="px-2 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
              Explore
            </span>
            {supportingTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  title={tab.label}
                  aria-label={tab.label}
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70",
                    activeTab === tab.id
                      ? "bg-white/[0.1] text-white"
                      : "text-slate-600 hover:bg-white/[0.05] hover:text-slate-300",
                  )}
                >
                  <Icon size={15} />
                </button>
              );
            })}
          </div>
        </nav>
        <div className="hidden items-center gap-3 xl:flex">
          <DemoModeNote compact />
        </div>
        <button
          className="rounded-lg border border-white/10 p-2 text-slate-300 lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle navigation"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open ? (
        <nav className="border-t border-white/[0.06] bg-[#08121b] p-3 lg:hidden">
          <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.17em] text-cyan-300">
            Live demo
          </p>
          <div className="grid gap-1 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.035] p-1">
            {primaryTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    onTabChange(tab.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium",
                    activeTab === tab.id
                      ? "bg-cyan-300 text-[#061219]"
                      : "text-cyan-100",
                  )}
                >
                  <Icon size={17} />
                  {tab.label}
                </button>
              );
            })}
          </div>
          <p className="px-3 pb-2 pt-5 text-[10px] font-bold uppercase tracking-[0.17em] text-slate-600">
            Explore
          </p>
          <div className="grid gap-1">
            {supportingTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    onTabChange(tab.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium",
                    activeTab === tab.id
                      ? "bg-white/[0.08] text-white"
                      : "text-slate-500",
                  )}
                >
                  <Icon size={17} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>
      ) : null}
    </header>
  );
}

function Overview({ onExplore }: { onExplore: (tab: TabId) => void }) {
  const workflow = [
    ["01", "Inbound inquiry", Inbox],
    ["02", "Classify intent", Filter],
    ["03", "Ask what’s missing", MessageSquareText],
    ["04", "Route correctly", Route],
    ["05", "Generate CRM brief", FileCheck2],
    ["06", "Human follow-up", UserCheck],
  ] as const;

  return (
    <div className="animate-fade-up">
      <section className="grid-surface relative overflow-hidden border-b border-white/[0.07]">
        <div className="mx-auto grid max-w-[1540px] gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.15fr_.85fr] lg:px-8">
          <div className="max-w-4xl">
            <Badge tone="cyan" className="mb-6">
              <Sparkles className="mr-1.5" size={12} />
              Inbound qualification for complex laundry automation sales
            </Badge>
            <h1 className="text-balance text-5xl font-semibold leading-[1.04] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
              Turn every inbound inquiry into a{" "}
              <span className="text-cyan-300">clear next step.</span>
            </h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-400 sm:text-xl">
              Qualify, route, and summarize inbound interest before the commercial
              conversation begins.
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-500">
              Built around RFID tracking, automated sortation, LOIS support, ERP
              integration, wash aisle controls, and service requests.
            </p>
            <div className="mt-9">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">
                Start the live demo
              </p>
              <div className="grid max-w-3xl gap-3 sm:grid-cols-2">
                <button
                  onClick={() => onExplore("prospect")}
                  className="group rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] p-5 text-left transition hover:border-cyan-300/35 hover:bg-cyan-300/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-cyan-300">
                      01 · BUYER VIEW
                    </span>
                    <MessageSquareText size={18} className="text-cyan-300" />
                  </div>
                  <p className="mt-5 text-lg font-semibold text-white">
                    Prospect Experience
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Watch AI qualify a real inbound inquiry.
                  </p>
                  <span className="mt-5 flex items-center gap-2 text-xs font-semibold text-cyan-200">
                    Run qualification
                    <ArrowRight
                      size={14}
                      className="transition group-hover:translate-x-1"
                    />
                  </span>
                </button>
                <button
                  onClick={() => onExplore("console")}
                  className="group rounded-2xl border border-blue-400/20 bg-blue-400/[0.06] p-5 text-left transition hover:border-blue-400/35 hover:bg-blue-400/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/70"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-blue-300">
                      02 · SELLER VIEW
                    </span>
                    <BarChart3 size={18} className="text-blue-300" />
                  </div>
                  <p className="mt-5 text-lg font-semibold text-white">
                    Sales Console
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Review routing, context, and CRM-ready briefs.
                  </p>
                  <span className="mt-5 flex items-center gap-2 text-xs font-semibold text-blue-200">
                    Open sales workspace
                    <ArrowRight
                      size={14}
                      className="transition group-hover:translate-x-1"
                    />
                  </span>
                </button>
              </div>
            </div>
            <div className="mt-10 max-w-3xl border-l-2 border-cyan-300/50 pl-5">
              <p className="text-lg font-medium leading-8 text-slate-200">
                The system prepares the inquiry; Softrol&apos;s team owns discovery
                and the commercial conversation.
              </p>
            </div>
          </div>
          <div className="self-center">
            <Card className="overflow-hidden border-white/[0.12] bg-[#0a1520]/95">
              <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Activity size={16} className="text-emerald-300" />
                  Today&apos;s inbound snapshot
                </div>
                <Badge tone="emerald">System ready</Badge>
              </div>
              <div className="space-y-3 p-5">
                {[
                  ["Healthcare RFID project", "Ready for sales", "92%", "emerald"],
                  ["LOIS washer-line issue", "Priority support", "99%", "red"],
                  ["Automated sortation quote", "Needs context", "88%", "amber"],
                  ["SEO agency solicitation", "Filtered", "99%", "slate"],
                ].map(([name, status, confidence, tone], index) => (
                  <div
                    key={name}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5"
                  >
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-xs font-bold text-slate-400">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-200">{name}</p>
                      <Badge tone={tone as "emerald" | "red" | "amber" | "slate"} className="mt-1">
                        {status}
                      </Badge>
                    </div>
                    <span className="font-mono text-xs text-slate-500">{confidence}</span>
                  </div>
                ))}
              </div>
            </Card>
            <div className="mt-4">
              <DemoModeNote />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1540px] px-4 py-16 sm:px-6 lg:px-8">
        <SectionLabel>Controlled first-mile workflow</SectionLabel>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {workflow.map(([number, label, Icon], index) => (
            <div key={label} className="relative">
              <Card className="h-full p-4">
                <div className="flex items-center justify-between">
                  <Icon size={19} className="text-cyan-300" />
                  <span className="font-mono text-[10px] text-slate-600">{number}</span>
                </div>
                <p className="mt-7 text-sm font-semibold text-slate-200">{label}</p>
              </Card>
              {index < workflow.length - 1 ? (
                <ChevronRight className="absolute -right-2.5 top-1/2 z-10 hidden -translate-y-1/2 text-slate-700 xl:block" size={18} />
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1540px] gap-6 px-4 pb-16 sm:px-6 lg:grid-cols-2 lg:px-8">
        <Card className="p-6 md:p-8">
          <SectionLabel>Before</SectionLabel>
          <p className="text-xl font-medium text-white">A vague message lands in sales</p>
          <blockquote className="mt-6 rounded-xl border border-amber-300/15 bg-amber-300/[0.05] p-5 text-lg leading-8 text-slate-300">
            “Need pricing for an automated garment sorting system. Please send
            details.”
          </blockquote>
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-amber-200">
            Rep still needs to know
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-400">
            {[
              "Facility type",
              "Daily volume",
              "Current sorting method",
              "Retrofit or new build",
              "Timeline",
              "Project driver",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CircleAlert size={13} className="shrink-0 text-amber-200" />
                {item}
              </div>
            ))}
          </div>
        </Card>
        <Card className="relative overflow-hidden p-6 md:p-8">
          <div className="absolute inset-y-0 left-0 w-1 bg-emerald-400" />
          <SectionLabel>After</SectionLabel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xl font-medium text-white">A structured CRM-ready brief</p>
            <Badge tone="amber">Needs qualification</Badge>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              ["Intent", "Automated sortation evaluation"],
              [
                "Fit",
                "Unknown until facility type and daily volume are confirmed",
              ],
              [
                "Missing",
                "Facility type, daily volume, current sorting method, retrofit/new build, timeline",
              ],
              ["Recommended route", "AI follow-up before sales handoff"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-white/[0.035] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">{label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/[0.045] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-200">
              Rep note
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Do not quote yet. First confirm operational scale and project driver.
            </p>
          </div>
        </Card>
      </section>

      <section className="border-y border-white/[0.07] bg-white/[0.018]">
        <div className="mx-auto grid max-w-[1540px] gap-6 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
          <CapabilityCard
            title="Where the system helps"
            icon={Zap}
            tone="cyan"
            items={[
              "Classifies sales, support, low-fit, and noise",
              "Asks plant-specific qualification questions",
              "Extracts facility, volume, process, pain, and timeline",
              "Routes to sales, support, service, or nurture",
              "Creates sales-ready, CRM-ready briefs",
              "Logs risks, confidence, and missing information",
            ]}
          />
          <CapabilityCard
            title="Where humans stay involved"
            icon={ShieldCheck}
            tone="red"
            items={[
              "Pricing follows qualified human discovery",
              "Softrol specialists confirm technical feasibility",
              "Reps own relationships, proposals, and closing",
              "Support teams handle urgent operational issues",
              "Human review governs product and technical claims",
              "Specialists approve technical recommendations",
            ]}
          />
        </div>
      </section>

      <section className="mx-auto max-w-[1540px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <Card className="p-6 md:p-8">
            <SectionLabel>Softrol qualification rules</SectionLabel>
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              The logic is visible, tunable, and specific.
            </h2>
            <p className="mt-3 leading-7 text-slate-400">
              Reps can see why an inquiry was classified and which approved signals
              shaped the route.
            </p>
            <div className="mt-7 space-y-5">
              <RuleGroup
                title="High-fit indicators"
                tone="emerald"
                items={[
                  "Industrial, healthcare, hospitality, or uniform rental laundry",
                  "Meaningful daily volume or multi-location operation",
                  "RFID, sortation, LOIS, ERP, rail, or wash aisle interest",
                  "Active evaluation timeline",
                ]}
              />
              <RuleGroup
                title="Escalation indicators"
                tone="red"
                items={[
                  "System down, dashboard stopped, scanner not working",
                  "Washer-line issue, urgent language, existing customer context",
                ]}
              />
              <RuleGroup
                title="Low-fit / noise indicators"
                tone="amber"
                items={[
                  "Small laundromat, student research, vendor solicitation",
                  "Consumer app, job seeker, or unrelated request",
                ]}
              />
            </div>
          </Card>
          <Card className="p-6 md:p-8">
            <SectionLabel>Built for sales control</SectionLabel>
            <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-white">
              Clear ownership at every step.
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                ["Commercial discovery", "Pricing stays with qualified human discovery.", Clipboard],
                ["Rep ownership", "Reps keep ownership of relationships, proposals, and closing.", Handshake],
                ["Technical validation", "Technical feasibility is confirmed by Softrol specialists.", Factory],
                ["Reviewed handoffs", "High-fit sales handoffs stay human-reviewed.", UserCheck],
              ].map(([title, copy, Icon]) => (
                <div key={title as string} className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
                  <Icon className="text-cyan-300" size={20} />
                  <p className="mt-5 font-semibold text-slate-100">{title as string}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{copy as string}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

function CapabilityCard({
  title,
  icon: Icon,
  tone,
  items,
}: {
  title: string;
  icon: typeof Zap;
  tone: "cyan" | "red";
  items: string[];
}) {
  return (
    <Card className="p-6 md:p-8">
      <div className="flex items-center gap-3">
        <div className={cn("grid h-10 w-10 place-items-center rounded-xl", tone === "cyan" ? "bg-cyan-300/10 text-cyan-300" : "bg-rose-400/10 text-rose-300")}>
          <Icon size={20} />
        </div>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
      </div>
      <div className="mt-7 grid gap-3">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-3">
            <CheckCircle2 size={16} className={cn("mt-1 shrink-0", tone === "cyan" ? "text-cyan-300" : "text-slate-500")} />
            <p className="text-sm leading-6 text-slate-300">{item}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RuleGroup({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "emerald" | "red" | "amber";
  items: string[];
}) {
  return (
    <div>
      <Badge tone={tone}>{title}</Badge>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6 text-slate-400">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-600" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProspectExperience({
  onOpenLead,
}: {
  onOpenLead: (lead: LeadScenario) => void;
}) {
  const [selectedId, setSelectedId] = useState(leadScenarios[2].id);
  const [customInput, setCustomInput] = useState("");
  const [activeLead, setActiveLead] = useState<LeadScenario | null>(null);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [error, setError] = useState("");
  const [visibleMessageCount, setVisibleMessageCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [intakeReady, setIntakeReady] = useState(false);
  const [intakeKey, setIntakeKey] = useState(0);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const qualificationTimerRef = useRef<number | null>(null);

  const selected = leadScenarios.find((lead) => lead.id === selectedId) ?? leadScenarios[2];
  const customValue = customInput.trim();
  const intakeLead = useMemo(
    () => (customValue ? qualifyCustomInput(customValue).lead : selected),
    [customValue, selected],
  );
  const intakeFlow = useMemo(
    () =>
      customValue
        ? createCustomIntakeFlow(intakeLead.missingQuestions)
        : (scenarioIntakeFlows[selected.id] ??
          createCustomIntakeFlow(selected.missingQuestions)),
    [customValue, intakeLead.missingQuestions, selected],
  );

  const resetConversation = () => {
    if (qualificationTimerRef.current !== null) {
      window.clearTimeout(qualificationTimerRef.current);
      qualificationTimerRef.current = null;
    }
    setVisibleMessageCount(0);
    setIsTyping(false);
    setIntakeReady(false);
    setActiveLead(null);
    setStep(0);
    setError("");
  };

  useEffect(() => {
    let cancelled = false;
    const wait = (duration: number) =>
      new Promise((resolve) => window.setTimeout(resolve, duration));

    if (customInput.length > 0 && !customValue) {
      return () => {
        cancelled = true;
      };
    }

    const playIntake = async () => {
      await wait(customValue ? 850 : 450);

      for (let index = 0; index < intakeFlow.length; index += 1) {
        if (cancelled) return;
        const message = intakeFlow[index];

        if (message.role === "assistant") {
          setIsTyping(true);
          await wait(850);
          if (cancelled) return;
          setIsTyping(false);
        } else {
          await wait(650);
          if (cancelled) return;
        }

        setVisibleMessageCount(index + 1);
        await wait(500);
      }

      if (!cancelled) setIntakeReady(true);
    };

    void playIntake();

    return () => {
      cancelled = true;
    };
  }, [customInput, customValue, intakeFlow, intakeKey]);

  useEffect(() => {
    const container = chatScrollRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [activeLead, isTyping, step, visibleMessageCount]);

  const intakeStatus = intakeReady
    ? "Ready for qualification"
    : visibleMessageCount > 0 || isTyping
      ? "Collecting missing context"
      : "Intake in progress";

  const runQualification = () => {
    setError("");
    if (customInput.length > 0 && !customValue) {
      setError("Enter a real inquiry before running qualification.");
      return;
    }
    if (!intakeReady) return;
    setActiveLead(intakeLead);
    setStep(1);
    qualificationTimerRef.current = window.setTimeout(() => {
      setStep(2);
      qualificationTimerRef.current = null;
    }, 700);
  };

  const restartIntake = () => {
    resetConversation();
    setIntakeKey((value) => value + 1);
  };

  return (
    <div className="mx-auto max-w-[1540px] animate-fade-up px-4 py-8 sm:px-6 lg:px-8">
      <PageHeading
        eyebrow="External experience"
        title="A professional first response — before sales gets involved."
        copy="Customers try the agent through a website intake chat. The chat collects missing context before generating a CRM-ready handoff for Softrol’s team."
      />
      <div className="mt-8 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)_340px]">
        <Card className="h-fit p-5">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-white">Choose an inquiry</p>
            <Badge tone="cyan">12 scenarios</Badge>
          </div>
          <div className="mt-4 max-h-[410px] space-y-2 overflow-y-auto pr-1">
            {leadScenarios.map((lead) => (
              <button
                key={lead.id}
                onClick={() => {
                  resetConversation();
                  setSelectedId(lead.id);
                  setCustomInput("");
                  setIntakeKey((value) => value + 1);
                }}
                className={cn(
                  "w-full rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70",
                  selectedId === lead.id && !customInput
                    ? "border-cyan-300/25 bg-cyan-300/[0.07]"
                    : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium leading-5 text-slate-200">{lead.title}</p>
                  <Badge tone={statusTone(lead.status)} className="shrink-0 px-2 py-0.5">
                    {lead.classification.fit}
                  </Badge>
                </div>
                <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500">
                  {lead.shortDescription}
                </p>
              </button>
            ))}
          </div>
          <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
            <span className="h-px flex-1 bg-white/[0.07]" />
            or use custom input
            <span className="h-px flex-1 bg-white/[0.07]" />
          </div>
          <textarea
            value={customInput}
            onChange={(event) => {
              resetConversation();
              setCustomInput(event.target.value);
            }}
            placeholder="Paste an inbound message..."
            className="min-h-28 w-full resize-none rounded-xl border border-white/10 bg-[#071018] p-3 text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-300/10"
            aria-label="Custom inbound inquiry"
          />
          {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
          <Button
            className="mt-3 w-full"
            onClick={runQualification}
            disabled={!intakeReady}
          >
            <WandSparkles size={16} />
            {intakeReady ? "Run qualification" : "Complete intake first"}
          </Button>
        </Card>

        <Card className="min-h-[680px] overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-white">Softrol qualification assistant</p>
              <p className="mt-0.5 text-xs text-slate-600">Softrol website intake</p>
            </div>
            <Badge tone={intakeReady ? "emerald" : "cyan"}>
              {intakeStatus}
            </Badge>
          </div>
          <div
            ref={chatScrollRef}
            className="max-h-[700px] min-h-[620px] overflow-y-auto p-5 sm:p-7"
          >
            <div className="space-y-5">
              <ChatBubble side="user">{intakeLead.inboundMessage}</ChatBubble>
              {intakeFlow
                .slice(0, visibleMessageCount)
                .map((message, index) => (
                  <ChatBubble
                    key={`${message.role}-${index}-${message.content}`}
                    side={message.role === "prospect" ? "user" : "assistant"}
                  >
                    {message.content}
                  </ChatBubble>
                ))}
              {isTyping ? <TypingIndicator /> : null}
              {intakeReady && !activeLead ? (
                <div className="animate-fade-up flex items-start gap-3 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.05] p-4">
                  <CheckCircle2
                    className="mt-0.5 shrink-0 text-cyan-300"
                    size={19}
                  />
                  <div>
                    <p className="text-sm font-semibold text-cyan-100">
                      Website intake complete
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      The conversation is ready for the qualification rules to run.
                    </p>
                  </div>
                </div>
              ) : null}
              {activeLead ? (
                <>
                {step >= 1 ? (
                  <div className="animate-fade-up rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <Sparkles size={16} className="text-cyan-300" />
                      Qualification result
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <KeyValue label="Intent" value={activeLead.classification.intent} />
                      <KeyValue label="Fit" value={activeLead.classification.fit} />
                      <KeyValue
                        label="Product area"
                        value={activeLead.classification.productArea}
                      />
                      <KeyValue
                        label="Route"
                        value={activeLead.classification.recommendedRoute}
                      />
                    </div>
                  </div>
                ) : null}
                {step === 2 ? (
                  <div className="animate-fade-up flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4">
                    <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-300" size={19} />
                    <div>
                      <p className="text-sm font-semibold text-emerald-100">
                        Qualification route prepared
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        {activeLead.classification.recommendedRoute}. A CRM-ready brief
                        is ready for human review.
                      </p>
                    </div>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2 pt-2">
                  {step === 2 ? (
                    <Button onClick={() => onOpenLead(activeLead)}>
                      Review CRM-ready brief <ArrowRight size={15} />
                    </Button>
                  ) : null}
                  <Button variant="ghost" onClick={restartIntake}>
                    <RefreshCw size={15} /> Restart intake
                  </Button>
                </div>
                </>
              ) : null}
            </div>
          </div>
        </Card>

        <Card className="h-fit p-5">
          <div className="flex items-center gap-2">
            <Target size={17} className="text-cyan-300" />
            <p className="font-semibold text-white">AI captured context</p>
          </div>
          {activeLead ? (
            <>
              <div className="mt-5 grid gap-3">
                {Object.entries(activeLead.extractedContext)
                  .filter(([, value]) => Boolean(value))
                  .map(([key, value]) => (
                    <div key={key} className="rounded-xl bg-white/[0.03] p-3.5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
                        {key.replace(/([A-Z])/g, " $1")}
                      </p>
                      <p className="mt-1.5 text-sm leading-5 text-slate-300">{value}</p>
                    </div>
                  ))}
              </div>
              <div className="mt-5 border-t border-white/[0.07] pt-5">
                <div className="flex flex-wrap gap-2">
                  <Badge tone={fitTone(activeLead.classification.fit)}>
                    {activeLead.classification.fit} fit
                  </Badge>
                  <Badge tone={urgencyTone(activeLead.classification.urgency)}>
                    {activeLead.classification.urgency} urgency
                  </Badge>
                </div>
                <p className="mt-4 text-xs leading-5 text-slate-500">
                  Confidence {activeLead.classification.confidence}% ·{" "}
                  {activeLead.classification.reason}
                </p>
              </div>
            </>
          ) : (
            <div className="py-20 text-center">
              <Target className="mx-auto text-slate-700" size={28} />
              <p className="mt-3 text-sm text-slate-600">
                Context appears here after qualification.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function ChatBubble({
  side,
  children,
}: {
  side: "user" | "assistant";
  children: string;
}) {
  return (
    <div className={cn("flex", side === "user" ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6", side === "user" ? "rounded-br-md bg-blue-500/15 text-blue-50" : "rounded-bl-md border border-white/[0.08] bg-white/[0.035] text-slate-300")}>
        {children}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start" aria-label="Assistant is typing">
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-white/[0.08] bg-white/[0.035] px-4 py-3">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300"
            style={{ animationDelay: `${dot * 140}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function PageHeading({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="max-w-4xl">
      <SectionLabel>{eyebrow}</SectionLabel>
      <h1 className="text-balance text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">
        {title}
      </h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">{copy}</p>
    </div>
  );
}

function SalesConsole({
  initialLead,
  notify,
}: {
  initialLead: LeadScenario | null;
  notify: (message: string, tone?: "success" | "error") => void;
}) {
  const [selectedId, setSelectedId] = useState(initialLead?.id ?? leadScenarios[0].id);
  const [externalLead, setExternalLead] = useState<LeadScenario | null>(initialLead);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [feedback, setFeedback] = useState<Record<string, HandoffFeedback>>({});
  const [assigned, setAssigned] = useState<Record<string, string>>({});

  const allLeads = useMemo(
    () => (externalLead && !leadScenarios.some((lead) => lead.id === externalLead.id) ? [externalLead, ...leadScenarios] : leadScenarios),
    [externalLead],
  );

  const filtered = allLeads.filter((lead) => {
    const value = `${lead.title} ${lead.classification.intent} ${lead.classification.productArea}`.toLowerCase();
    return value.includes(search.toLowerCase()) && (status === "All" || lead.status === status);
  });
  const selected = allLeads.find((lead) => lead.id === selectedId) ?? allLeads[0];

  const copyBrief = async () => {
    try {
      await navigator.clipboard.writeText(formatCrmBrief(selected));
      notify("CRM-ready brief copied to clipboard.");
    } catch {
      notify("Clipboard access was blocked. Use Export brief instead.", "error");
    }
  };

  const exportBrief = () => {
    const blob = new Blob([formatCrmBrief(selected)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${selected.id}-crm-brief.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    notify("CRM-ready brief exported.");
  };

  const action = (message: string) => notify(message);

  return (
    <div className="mx-auto max-w-[1540px] animate-fade-up px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <PageHeading
          eyebrow="Internal revenue operations"
          title="Sales Console"
          copy="One view for what deserves sales attention, what needs more context, and what should never reach the pipeline."
        />
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock3 size={14} />
          Snapshot updated 2 minutes ago
        </div>
      </div>

      <Card className="mt-8 overflow-hidden border-cyan-300/15 bg-cyan-300/[0.035]">
        <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-300/10 text-cyan-300">
              <BarChart3 size={20} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-300">
                Today’s inbound summary
              </p>
              <p className="mt-2 max-w-3xl text-lg leading-7 text-slate-200">
                12 inquiries analyzed. <strong className="text-emerald-300">4 ready for sales</strong>,{" "}
                <strong className="text-amber-200">3 need qualification</strong>,{" "}
                <strong className="text-rose-200">2 routed to support/service</strong>, and{" "}
                <strong className="text-slate-300">3 kept out of the pipeline.</strong>
              </p>
            </div>
          </div>
          <Badge tone="cyan" className="w-fit shrink-0">
            Human review active
          </Badge>
        </div>
      </Card>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Total analyzed" value="12" detail="Across all inbound sources" accent="cyan" />
        <MetricCard label="High-fit" value="4" detail="Sales-ready opportunities" accent="emerald" />
        <MetricCard label="Needs qualification" value="3" detail="Context before rep time" accent="amber" />
        <MetricCard label="Support / service" value="2" detail="Routed away from sales" accent="red" />
        <MetricCard label="Filtered / nurture" value="3" detail="Pipeline noise prevented" accent="blue" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(440px,.88fr)]">
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-white/[0.08] p-4 sm:flex-row">
            <label className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search leads, intent, or product area"
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#071018] pl-10 pr-3 text-sm text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-300/30"
              />
            </label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-10 rounded-xl border border-white/[0.08] bg-[#071018] px-3 text-sm text-slate-300 outline-none focus:border-cyan-300/30"
              aria-label="Filter lead status"
            >
              {["All", "Ready for sales", "Needs qualification", "Routed to support", "Filtered", "Nurture"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </div>
          <div className="hidden overflow-x-auto lg:block xl:hidden 2xl:block">
            <table className="w-full min-w-[930px] text-left">
              <thead className="border-b border-white/[0.07] bg-white/[0.018] text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
                <tr>
                  {["Lead", "Source", "Intent", "Fit", "Urgency", "Product area", "Status"].map((heading) => (
                    <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => {
                      setSelectedId(lead.id);
                      setExternalLead(lead.id.startsWith("custom") ? lead : externalLead);
                    }}
                    className={cn("cursor-pointer border-b border-white/[0.055] text-xs transition hover:bg-white/[0.025]", selected.id === lead.id && "bg-cyan-300/[0.045]")}
                  >
                    <td className="max-w-52 px-4 py-4">
                      <p className="font-semibold leading-5 text-slate-200">{lead.title}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-500">{lead.source}</td>
                    <td className="max-w-36 px-4 py-4 leading-5 text-slate-400">{lead.classification.intent}</td>
                    <td className="px-4 py-4"><Badge tone={fitTone(lead.classification.fit)}>{lead.classification.fit}</Badge></td>
                    <td className="px-4 py-4"><Badge tone={urgencyTone(lead.classification.urgency)}>{lead.classification.urgency}</Badge></td>
                    <td className="max-w-48 px-4 py-4 leading-5 text-slate-400">{lead.classification.productArea}</td>
                    <td className="px-4 py-4"><Badge tone={statusTone(lead.status)}>{lead.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-2 p-3 lg:hidden xl:grid 2xl:hidden">
            {filtered.map((lead) => (
              <button
                key={lead.id}
                onClick={() => setSelectedId(lead.id)}
                className={cn("rounded-xl border p-4 text-left", selected.id === lead.id ? "border-cyan-300/25 bg-cyan-300/[0.05]" : "border-white/[0.07] bg-white/[0.02]")}
              >
                <p className="font-semibold text-slate-200">{lead.title}</p>
                <p className="mt-1.5 text-xs leading-5 text-slate-500">
                  {lead.source} · {lead.classification.intent}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone={fitTone(lead.classification.fit)}>{lead.classification.fit}</Badge>
                  <Badge tone={statusTone(lead.status)}>{lead.status}</Badge>
                </div>
              </button>
            ))}
          </div>
          {!filtered.length ? (
            <div className="py-16 text-center text-sm text-slate-600">No leads match these filters.</div>
          ) : null}
        </Card>

        <LeadDetail
          lead={selected}
          feedback={feedback[selected.id]}
          assigned={assigned[selected.id]}
          onFeedback={(value) => {
            setFeedback((current) => ({ ...current, [selected.id]: value }));
            notify(`Feedback recorded: ${value}.`);
          }}
          onCopy={copyBrief}
          onExport={exportBrief}
          onAction={action}
          onAssign={(rep) => {
            setAssigned((current) => ({ ...current, [selected.id]: rep }));
            notify(`Assigned to ${rep}.`);
          }}
        />
      </div>
    </div>
  );
}

function LeadDetail({
  lead,
  feedback,
  assigned,
  onFeedback,
  onCopy,
  onExport,
  onAction,
  onAssign,
}: {
  lead: LeadScenario;
  feedback?: HandoffFeedback;
  assigned?: string;
  onFeedback: (value: HandoffFeedback) => void;
  onCopy: () => void;
  onExport: () => void;
  onAction: (message: string) => void;
  onAssign: (rep: string) => void;
}) {
  const context = Object.entries(lead.extractedContext).filter(([, value]) => Boolean(value));
  return (
    <Card className="h-fit overflow-hidden xl:sticky xl:top-24">
      <div className="border-b border-white/[0.08] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge tone={statusTone(lead.status)}>{lead.status}</Badge>
              <Badge tone={fitTone(lead.classification.fit)}>{lead.classification.fit} fit</Badge>
            </div>
            <h2 className="mt-4 text-xl font-semibold leading-7 text-white">{lead.title}</h2>
            <p className="mt-1 text-xs text-slate-600">{lead.source} · {lead.id}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-2xl font-semibold text-cyan-300">{lead.classification.confidence}%</p>
            <p className="text-[10px] uppercase tracking-[0.13em] text-slate-600">confidence</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-400">{lead.classification.reason}</p>
      </div>
      <div className="max-h-[calc(100vh-180px)] space-y-5 overflow-y-auto p-5">
        <DetailSection title="Raw inbound message" icon={Inbox}>
          <p className="rounded-xl bg-white/[0.03] p-4 text-sm leading-6 text-slate-300">{lead.inboundMessage}</p>
        </DetailSection>
        <DetailSection title="AI classification" icon={Sparkles}>
          <div className="grid gap-3 sm:grid-cols-2">
            <KeyValue label="Intent" value={lead.classification.intent} />
            <KeyValue label="Urgency" value={lead.classification.urgency} />
            <KeyValue label="Product area" value={lead.classification.productArea} />
            <KeyValue label="Recommended route" value={lead.classification.recommendedRoute} />
          </div>
        </DetailSection>
        <DetailSection title="Extracted context" icon={Target}>
          <div className="grid gap-3 sm:grid-cols-2">
            {context.length ? context.map(([key, value]) => (
              <KeyValue key={key} label={key.replace(/([A-Z])/g, " $1")} value={String(value)} />
            )) : <EmptyValue>No reliable context extracted</EmptyValue>}
          </div>
        </DetailSection>
        <DetailSection title="Missing qualification" icon={CircleAlert}>
          {lead.missingQuestions.length ? (
            <ol className="space-y-2">
              {lead.missingQuestions.map((question, index) => (
                <li key={question} className="flex gap-3 text-sm leading-6 text-slate-400">
                  <span className="font-mono text-xs text-amber-200">{String(index + 1).padStart(2, "0")}</span>
                  {question}
                </li>
              ))}
            </ol>
          ) : <p className="text-sm text-slate-500">No additional questions required.</p>}
        </DetailSection>
        <DetailSection title="Draft first response" icon={MessageSquareText}>
          <p className="rounded-xl border border-blue-400/10 bg-blue-400/[0.04] p-4 text-sm leading-6 text-slate-300">{lead.draftResponse}</p>
          <Button variant="ghost" className="mt-2 px-0" onClick={() => onAction("Draft opened for editing.")}>Edit response</Button>
        </DetailSection>
        <DetailSection title="CRM-ready brief" icon={FileCheck2}>
          <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] p-4">
            <p className="font-semibold text-emerald-100">{lead.salesBrief.subject}</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">{lead.salesBrief.summary}</p>
            <div className="mt-4 border-t border-white/[0.07] pt-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">Recommended next step</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{lead.salesBrief.recommendedNextStep}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onCopy}><Copy size={15} /> Copy brief</Button>
            <Button variant="secondary" onClick={onExport}><Download size={15} /> Export brief</Button>
          </div>
        </DetailSection>
        <DetailSection title="Risk flags" icon={ShieldCheck}>
          <div className="space-y-2">
            {lead.riskFlags.map((risk) => (
              <div key={risk} className="flex gap-2 rounded-lg bg-rose-400/[0.05] p-3 text-sm leading-5 text-rose-100">
                <CircleAlert className="mt-0.5 shrink-0 text-rose-300" size={15} />
                {risk}
              </div>
            ))}
          </div>
        </DetailSection>
        <DetailSection title="Was this handoff useful?" icon={ThumbsUp}>
          <div className="grid grid-cols-3 gap-2">
            {(["Useful", "Needs edits", "Wrong route"] as HandoffFeedback[]).map((value) => (
              <button
                key={value}
                onClick={() => onFeedback(value)}
                className={cn("rounded-lg border px-2 py-2 text-xs font-semibold transition", feedback === value ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-200" : "border-white/[0.08] bg-white/[0.025] text-slate-500 hover:text-slate-200")}
              >
                {value}
              </button>
            ))}
          </div>
        </DetailSection>
        <DetailSection title="Human control actions" icon={UserCheck}>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => onAction("Handoff approved for human follow-up.")}><Check size={15} /> Approve</Button>
            <Button variant="secondary" onClick={() => onAction("Lead routed to support.")}><Headphones size={15} /> Send to support</Button>
            <Button variant="secondary" onClick={() => onAction("Lead marked low-fit.")}><Filter size={15} /> Mark low-fit</Button>
            <select
              value={assigned ?? ""}
              onChange={(event) => event.target.value && onAssign(event.target.value)}
              className="min-h-10 rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 text-xs font-semibold text-slate-300 outline-none"
              aria-label="Assign sales representative"
            >
              <option value="">Assign rep</option>
              <option>Jordan · Enterprise</option>
              <option>Casey · Healthcare</option>
              <option>Riley · Automation</option>
            </select>
          </div>
        </DetailSection>
      </div>
    </Card>
  );
}

function DetailSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Inbox;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Icon size={15} className="text-cyan-300" />
        <h3 className="text-xs font-bold uppercase tracking-[0.13em] text-slate-500">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] p-3">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-600">{label}</p>
      <p className="mt-1.5 text-xs leading-5 text-slate-300">{value}</p>
    </div>
  );
}

function PilotImpact() {
  const weeks = [
    ["Week 1", "Configure Softrol-specific qualification rules and approved responses."],
    ["Week 2", "Run on one controlled flow, starting with RFID and garment tracking inquiries."],
    ["Week 3", "Review AI handoffs with sales and tune routing, questions, and confidence."],
    ["Week 4", "Measure response time, routing accuracy, qualified meetings, usefulness, and trust."],
  ];
  return (
    <div className="mx-auto max-w-[1540px] animate-fade-up px-4 py-8 sm:px-6 lg:px-8">
      <PageHeading
        eyebrow="30-day controlled pilot"
        title="Prove usefulness before scaling automation."
        copy="Measure whether Revenue Desk protects high-value opportunities, improves routing, and gives reps a better starting point."
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Inbound analyzed" value="24" detail="Across sales and service channels" />
        <MetricCard label="High-fit identified" value="7" detail="Prioritized for human follow-up" accent="emerald" />
        <MetricCard label="Meetings ready" value="4" detail="Qualified for rep follow-up" accent="blue" />
        <MetricCard label="Rep hours saved" value="8.5" detail="Estimated first-mile triage time" accent="amber" />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["5", "Vague quote requests qualified"],
          ["6", "Support/service requests rerouted"],
          ["5", "Low-fit and non-sales filtered"],
          ["92%", "Leads with complete CRM-ready brief"],
        ].map(([value, label]) => (
          <Card key={label} className="flex items-center gap-4 p-5">
            <p className="text-2xl font-semibold text-slate-200">{value}</p>
            <p className="text-sm leading-5 text-slate-500">{label}</p>
          </Card>
        ))}
      </div>
      <Card className="mt-6 overflow-hidden border-emerald-400/15">
        <div className="grid lg:grid-cols-[.72fr_1.28fr]">
          <div className="bg-emerald-400/[0.055] p-6 md:p-8">
            <SectionLabel>Revenue impact hypothesis</SectionLabel>
            <p className="text-3xl font-semibold tracking-tight text-white">One opportunity can justify the pilot.</p>
          </div>
          <div className="p-6 md:p-8">
            <p className="text-lg leading-8 text-slate-300">
              The pilot is justified if Softrol advances one additional high-fit
              automation opportunity faster, prevents serious leads from going cold,
              or keeps sales focused on qualified opportunities.
            </p>
            <p className="mt-4 text-sm leading-6 text-slate-500">
              Revenue Desk prepares the inquiry so Softrol&apos;s team can move into
              discovery with clearer context and the correct route.
            </p>
          </div>
        </div>
      </Card>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <Card className="p-6 md:p-8">
          <SectionLabel>Pilot plan</SectionLabel>
          <div className="mt-6 space-y-0">
            {weeks.map(([week, detail], index) => (
              <div key={week} className="relative flex gap-5 pb-7 last:pb-0">
                {index < weeks.length - 1 ? <div className="absolute left-[19px] top-10 h-[calc(100%-24px)] w-px bg-white/10" /> : null}
                <div className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-cyan-300/20 bg-[#0c1722] text-xs font-bold text-cyan-300">{index + 1}</div>
                <div>
                  <p className="font-semibold text-slate-200">{week}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6 md:p-8">
          <SectionLabel>Success metrics</SectionLabel>
          <div className="mt-6 grid gap-3">
            {[
              "Qualified opportunities identified",
              "Qualified meetings booked",
              "Time to first useful response",
              "Routing accuracy",
              "Rep rating of handoff quality",
              "Incorrect classifications",
              "AI responses needing correction",
              "Customer complaints or negative feedback",
            ].map((metric) => (
              <div key={metric} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-300" />
                <p className="text-sm text-slate-300">{metric}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function TradeShowMode({ notify }: { notify: (message: string) => void }) {
  const [imported, setImported] = useState(false);
  const [loading, setLoading] = useState(false);
  const runImport = () => {
    setLoading(true);
    window.setTimeout(() => {
      setImported(true);
      setLoading(false);
      notify("Five trade show leads categorized.");
    }, 900);
  };
  return (
    <div className="mx-auto max-w-[1540px] animate-fade-up px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <PageHeading
          eyebrow="Event lead acceleration"
          title="Turn booth scans into prioritized follow-up."
          copy="Batch-qualify event notes while context is fresh, then give sales a clean queue instead of a spreadsheet of names."
        />
        <Button onClick={runImport} disabled={loading}>
          {loading ? <RefreshCw className="animate-spin" size={16} /> : <Download size={16} />}
          {loading ? "Categorizing leads..." : imported ? "Re-import sample leads" : "Import sample trade show leads"}
        </Button>
      </div>
      {!imported ? (
        <Card className="mt-8 grid min-h-[460px] place-items-center p-8 text-center">
          <div>
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] text-cyan-300">
              <Users size={28} />
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-white">Five leads waiting for triage</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
              Sample Clean Show notes include qualified projects, vague interest,
              installed-base service, and low-fit traffic.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Imported" value="5" detail="Clean Show sample leads" />
            <MetricCard label="High-fit" value="2" detail="Ready for sales follow-up" accent="emerald" />
            <MetricCard label="Needs qualification" value="1" detail="AI follow-up first" accent="amber" />
            <MetricCard label="Diverted" value="2" detail="Service and low-fit" accent="red" />
          </div>
          <Card className="mt-6 overflow-hidden">
            <div className="border-b border-white/[0.07] px-5 py-4">
              <p className="font-semibold text-white">Imported lead queue</p>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {tradeShowImports.map((lead, index) => (
                <div key={lead.id} className="grid gap-4 p-5 md:grid-cols-[36px_1fr_auto] md:items-center">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/[0.04] font-mono text-xs text-slate-500">{String(index + 1).padStart(2, "0")}</div>
                  <div>
                    <p className="font-semibold text-slate-200">{lead.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{lead.shortDescription}</p>
                    <p className="mt-2 text-xs text-slate-600">{lead.classification.recommendedRoute}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <Badge tone={fitTone(lead.classification.fit)}>{lead.classification.fit} fit</Badge>
                    <Badge tone={statusTone(lead.status)}>{lead.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function Toast({
  message,
  tone,
  onClose,
}: {
  message: string;
  tone: "success" | "error";
  onClose: () => void;
}) {
  return (
    <div className={cn("fixed bottom-5 right-5 z-50 flex max-w-sm items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-xl", tone === "success" ? "border-emerald-400/20 bg-[#10241f]/95 text-emerald-100" : "border-rose-400/20 bg-[#2a151b]/95 text-rose-100")}>
      {tone === "success" ? <CheckCircle2 size={18} className="text-emerald-300" /> : <CircleAlert size={18} className="text-rose-300" />}
      <p className="text-sm">{message}</p>
      <button onClick={onClose} className="ml-2 text-current opacity-60 hover:opacity-100" aria-label="Close notification"><X size={15} /></button>
    </div>
  );
}

export function RevenueDesk() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [consoleLead, setConsoleLead] = useState<LeadScenario | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  const notify = (message: string, tone: "success" | "error" = "success") => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3200);
  };

  const openLead = (lead: LeadScenario) => {
    setConsoleLead(lead);
    setActiveTab("console");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const changeTab = (tab: TabId) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen">
      <AppHeader activeTab={activeTab} onTabChange={changeTab} />
      {activeTab === "overview" ? <Overview onExplore={changeTab} /> : null}
      {activeTab === "prospect" ? <ProspectExperience onOpenLead={openLead} /> : null}
      {activeTab === "console" ? <SalesConsole initialLead={consoleLead} notify={notify} /> : null}
      {activeTab === "pilot" ? <PilotImpact /> : null}
      {activeTab === "trade" ? <TradeShowMode notify={notify} /> : null}
      <footer className="border-t border-white/[0.07] px-4 py-7 text-center text-xs text-slate-700">
        Softrol Revenue Desk · Controlled qualification for complex industrial sales
      </footer>
      {toast ? <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} /> : null}
    </main>
  );
}
