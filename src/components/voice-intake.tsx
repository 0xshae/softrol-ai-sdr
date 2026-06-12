"use client";

import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  RefreshCw,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef } from "react";

import { useVoiceIntake } from "@/lib/voice-engine";
import type { LeadScenario } from "@/lib/types";
import type { VoiceState } from "@/lib/voice-types";
import { Badge, Button, Card, cn } from "./ui";

/* ------------------------------------------------------------------ */
/*  Small helpers                                                     */
/* ------------------------------------------------------------------ */

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function stateLabel(state: VoiceState): string {
  switch (state) {
    case "idle":
      return "Ready";
    case "requesting_permission":
      return "Requesting mic access";
    case "listening":
      return "Listening…";
    case "processing":
      return "Processing…";
    case "speaking":
      return "Agent speaking…";
    case "confirming":
      return "Review transcript";
    case "qualified":
      return "Qualification complete";
    case "error":
      return "Error";
  }
}

function stateTone(
  state: VoiceState,
): "cyan" | "emerald" | "amber" | "red" | "slate" {
  switch (state) {
    case "listening":
      return "cyan";
    case "speaking":
    case "processing":
      return "amber";
    case "confirming":
      return "amber";
    case "qualified":
      return "emerald";
    case "error":
      return "red";
    default:
      return "slate";
  }
}

/* ------------------------------------------------------------------ */
/*  Waveform Visualizer                                               */
/* ------------------------------------------------------------------ */

function WaveformVisualizer({
  active,
  className,
}: {
  active: boolean;
  className?: string;
}) {
  const bars = 24;
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-[3px]",
        className,
      )}
      aria-hidden
    >
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "inline-block w-[3px] rounded-full transition-all duration-200",
            active
              ? "voice-bar bg-cyan-300"
              : "h-1 bg-slate-700",
          )}
          style={
            active
              ? {
                  animationDelay: `${(i * 70) % 500}ms`,
                  height: `${12 + Math.sin(i * 0.8) * 10}px`,
                }
              : undefined
          }
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mic Button                                                        */
/* ------------------------------------------------------------------ */

function MicButton({
  listening,
  onClick,
}: {
  listening: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative grid h-20 w-20 place-items-center rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70",
        listening
          ? "bg-cyan-300 text-[#061219] shadow-[0_0_40px_rgba(75,209,229,0.3)]"
          : "border border-white/[0.12] bg-white/[0.05] text-slate-300 hover:bg-white/[0.08]",
      )}
      aria-label={listening ? "Microphone active" : "Start speaking"}
    >
      {listening && (
        <span className="absolute inset-0 animate-pulse-ring rounded-full border-2 border-cyan-300/40" />
      )}
      <Mic size={28} />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Chat bubble (voice version)                                       */
/* ------------------------------------------------------------------ */

function VoiceBubble({
  role,
  content,
  isLatest,
}: {
  role: "prospect" | "assistant";
  content: string;
  isLatest?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex",
        role === "prospect" ? "justify-end" : "justify-start",
        isLatest && "animate-fade-up",
      )}
    >
      <div
        className={cn(
          "max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6",
          role === "prospect"
            ? "rounded-br-md bg-blue-500/15 text-blue-50"
            : "rounded-bl-md border border-white/[0.08] bg-white/[0.035] text-slate-300",
        )}
      >
        {content}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Unsupported notice                                                */
/* ------------------------------------------------------------------ */

export function VoiceUnsupportedNotice() {
  return (
    <Card className="mx-auto max-w-lg p-8 text-center">
      <MicOff className="mx-auto text-slate-600" size={36} />
      <p className="mt-4 text-lg font-semibold text-white">
        Voice intake not available
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Your browser does not support the Web Speech API required for voice
        intake. Please use <strong>Google Chrome</strong> or{" "}
        <strong>Microsoft Edge</strong> for the voice experience, or continue
        with the typed intake below.
      </p>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Voice Intake Panel                                           */
/* ------------------------------------------------------------------ */

export function VoiceIntakePanel({
  onQualified,
}: {
  onQualified: (lead: LeadScenario) => void;
}) {
  const voice = useVoiceIntake();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [voice.transcript, voice.interimText, voice.state]);

  const isActive =
    voice.state !== "idle" &&
    voice.state !== "error" &&
    voice.state !== "qualified";

  const isListening = voice.state === "listening";

  if (!voice.supported) {
    return <VoiceUnsupportedNotice />;
  }

  /* --- Idle state: big CTA to start --- */
  if (voice.state === "idle") {
    return (
      <Card className="flex min-h-[680px] flex-col items-center justify-center p-8">
        <div className="grid h-24 w-24 place-items-center rounded-full border border-cyan-300/20 bg-cyan-300/[0.06]">
          <Phone size={36} className="text-cyan-300" />
        </div>
        <p className="mt-6 text-xl font-semibold text-white">
          Talk to Softrol intake assistant
        </p>
        <p className="mt-2 max-w-md text-center text-sm leading-6 text-slate-400">
          Describe your inquiry by voice. The assistant will ask Softrol-specific
          follow-up questions and prepare a CRM-ready qualification summary.
        </p>
        <Button className="mt-8" onClick={voice.start}>
          <Mic size={18} />
          Start voice intake
        </Button>
        <p className="mt-4 text-xs text-slate-600">
          Requires microphone access · No audio is recorded
        </p>
      </Card>
    );
  }

  /* --- Error state --- */
  if (voice.state === "error") {
    return (
      <Card className="flex min-h-[680px] flex-col items-center justify-center p-8">
        <div className="grid h-20 w-20 place-items-center rounded-full border border-rose-400/20 bg-rose-400/[0.08]">
          <CircleAlert size={32} className="text-rose-300" />
        </div>
        <p className="mt-5 text-lg font-semibold text-white">
          Voice intake unavailable
        </p>
        <p className="mt-2 max-w-md text-center text-sm leading-6 text-slate-400">
          {voice.errorMessage || "An unexpected error occurred."}
        </p>
        <Button className="mt-6" onClick={voice.reset}>
          <RefreshCw size={16} />
          Try again
        </Button>
      </Card>
    );
  }

  /* --- Active / Confirming / Qualified state --- */
  return (
    <Card className="flex min-h-[680px] flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-white">
            Softrol intake assistant · Voice
          </p>
          <p className="mt-0.5 text-xs text-slate-600">
            {formatDuration(voice.callDuration)}
            {voice.totalQuestions > 0 && (
              <span className="ml-3">
                Question {Math.min(voice.questionIndex, voice.totalQuestions)}/{voice.totalQuestions}
              </span>
            )}
          </p>
        </div>
        <Badge tone={stateTone(voice.state)}>{stateLabel(voice.state)}</Badge>
      </div>

      {/* Transcript area */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7"
      >
        <div className="space-y-4">
          {voice.transcript.map((entry, i) => (
            <VoiceBubble
              key={`${entry.role}-${i}-${entry.timestamp}`}
              role={entry.role}
              content={entry.content}
              isLatest={i === voice.transcript.length - 1}
            />
          ))}

          {/* Interim text (user still speaking) */}
          {voice.interimText && (
            <div className="flex justify-end">
              <div className="max-w-[88%] rounded-2xl rounded-br-md bg-blue-500/10 px-4 py-3 text-sm leading-6 text-blue-200/60">
                {voice.interimText}
                <span className="ml-1 inline-block h-4 w-px animate-pulse bg-blue-300" />
              </div>
            </div>
          )}

          {/* Listening indicator */}
          {isListening && !voice.interimText && (
            <div className="flex justify-end">
              <div className="rounded-2xl rounded-br-md bg-blue-500/10 px-4 py-3">
                <WaveformVisualizer active className="h-5" />
              </div>
            </div>
          )}

          {/* Speaking indicator */}
          {voice.state === "speaking" && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-white/[0.08] bg-white/[0.035] px-4 py-3">
                <WaveformVisualizer active className="h-4" />
                <span className="text-xs text-slate-500">Speaking…</span>
              </div>
            </div>
          )}

          {/* Processing indicator */}
          {voice.state === "processing" && (
            <div className="flex justify-start">
              <div className="flex items-center gap-3 rounded-2xl rounded-bl-md border border-white/[0.08] bg-white/[0.035] px-4 py-3 text-sm text-slate-400">
                <Sparkles size={16} className="animate-spin text-cyan-300" />
                Analyzing inquiry and selecting follow-up questions…
              </div>
            </div>
          )}

          {/* Confirming state */}
          {voice.state === "confirming" && (
            <div className="animate-fade-up space-y-4 pt-2">
              <div className="flex items-start gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-4">
                <CircleAlert
                  className="mt-0.5 shrink-0 text-amber-300"
                  size={19}
                />
                <div>
                  <p className="text-sm font-semibold text-amber-100">
                    Review your transcript
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    Please confirm the details are accurate before the
                    qualification summary is generated.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={voice.confirm}>
                  <CheckCircle2 size={16} />
                  Confirm and qualify
                </Button>
                <Button variant="ghost" onClick={voice.reset}>
                  <RefreshCw size={16} />
                  Start over
                </Button>
              </div>
            </div>
          )}

          {/* Qualified result */}
          {voice.state === "qualified" && voice.result && (
            <div className="animate-fade-up space-y-4 pt-2">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Sparkles size={16} className="text-cyan-300" />
                  Qualification result
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <QualKV
                    label="Intent"
                    value={voice.result.lead.classification.intent}
                  />
                  <QualKV
                    label="Fit"
                    value={voice.result.lead.classification.fit}
                  />
                  <QualKV
                    label="Product area"
                    value={voice.result.lead.classification.productArea}
                  />
                  <QualKV
                    label="Route"
                    value={voice.result.lead.classification.recommendedRoute}
                  />
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4">
                <CheckCircle2
                  className="mt-0.5 shrink-0 text-emerald-300"
                  size={19}
                />
                <div>
                  <p className="text-sm font-semibold text-emerald-100">
                    Qualification complete
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    {voice.result.lead.classification.recommendedRoute}. A
                    CRM-ready brief is ready for human review.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => onQualified(voice.result!.lead)}>
                  Review CRM-ready brief <ArrowRight size={15} />
                </Button>
                <Button variant="ghost" onClick={voice.reset}>
                  <RefreshCw size={15} />
                  New intake
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls bar — shown during active conversation */}
      {isActive && (
        <div className="border-t border-white/[0.08] bg-[#071018]/80 px-5 py-4">
          <div className="flex items-center justify-center gap-4">
            {/* Speaker toggle */}
            <button
              onClick={voice.toggleSpeaker}
              className={cn(
                "grid h-11 w-11 place-items-center rounded-full border transition",
                voice.speakerMuted
                  ? "border-rose-400/30 bg-rose-400/10 text-rose-300"
                  : "border-white/[0.1] bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]",
              )}
              aria-label={
                voice.speakerMuted ? "Unmute speaker" : "Mute speaker"
              }
            >
              {voice.speakerMuted ? (
                <VolumeX size={18} />
              ) : (
                <Volume2 size={18} />
              )}
            </button>

            {/* Main mic button */}
            <MicButton
              listening={isListening}
              onClick={voice.toggleMic}
            />

            {/* End call */}
            <button
              onClick={voice.stop}
              className="grid h-11 w-11 place-items-center rounded-full border border-rose-400/30 bg-rose-400/10 text-rose-300 transition hover:bg-rose-400/20"
              aria-label="End call"
            >
              <PhoneOff size={18} />
            </button>
          </div>

          {/* Waveform */}
          <div className="mt-3">
            <WaveformVisualizer active={isListening} className="h-6" />
          </div>
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Key-value display for qualification results                       */
/* ------------------------------------------------------------------ */

function QualKV({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] p-3.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
        {label}
      </p>
      <p className="mt-1.5 text-sm leading-5 text-slate-300">{value}</p>
    </div>
  );
}
