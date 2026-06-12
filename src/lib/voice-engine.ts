"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { qualifyCustomInput } from "@/lib/qualifier";
import type { QualificationResult } from "@/lib/types";
import {
  DEFAULT_VOICE_CONFIG,
  type VoiceConfig,
  type VoiceState,
  type VoiceTranscriptEntry,
  detectVoiceSupport,
} from "@/lib/voice-types";

/* ------------------------------------------------------------------ */
/*  Deterministic follow-up question bank                             */
/*  Keyed by keyword groups — the engine picks the first matching set */
/* ------------------------------------------------------------------ */

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
      "How do you sort today — manually, by barcode, or RFID?",
      "Is this for a retrofit or a new facility?",
      "What is the main project driver — labor, throughput, mis-sorts, or visibility?",
    ],
  },
];

const DEFAULT_QUESTIONS = [
  "What type of facility or operation is this related to?",
  "What volume do you process each day?",
  "What process or system are you trying to improve?",
  "Is this an active project or early research?",
];

function selectQuestions(transcript: string): string[] {
  const lower = transcript.toLowerCase();
  for (const set of QUESTION_BANK) {
    if (set.keywords.some((kw) => lower.includes(kw))) {
      return set.questions;
    }
  }
  return DEFAULT_QUESTIONS;
}

/* ------------------------------------------------------------------ */
/*  SpeechRecognition type shim                                       */
/* ------------------------------------------------------------------ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSpeechRecognition(): (new () => any) | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null;
}

/* ------------------------------------------------------------------ */
/*  Hook: useVoiceIntake                                              */
/* ------------------------------------------------------------------ */

export type UseVoiceIntakeReturn = {
  /** Current state machine state. */
  state: VoiceState;
  /** Full conversation transcript so far. */
  transcript: VoiceTranscriptEntry[];
  /** Interim (partial) text while the user is still speaking. */
  interimText: string;
  /** Whether the browser supports voice at all. */
  supported: boolean;
  /** Whether browser supports speech synthesis. */
  synthSupported: boolean;
  /** Whether agent voice output is muted. */
  speakerMuted: boolean;
  /** Whether the mic is temporarily muted by the user. */
  micMuted: boolean;
  /** Call duration in seconds since listening first started. */
  callDuration: number;
  /** Current question index (for follow-up progress). */
  questionIndex: number;
  /** Total follow-up questions selected. */
  totalQuestions: number;
  /** Error message, if any. */
  errorMessage: string;
  /** Qualification result after confirming. */
  result: QualificationResult | null;
  /** Start the voice intake session. */
  start: () => void;
  /** Stop/end the session. */
  stop: () => void;
  /** Manually end the current listening turn ("Done speaking" button). */
  skipTurn: () => void;
  /** Toggle mic mute. */
  toggleMic: () => void;
  /** Toggle speaker mute. */
  toggleSpeaker: () => void;
  /** Confirm the transcript and run qualification. */
  confirm: () => void;
  /** Full reset back to idle. */
  reset: () => void;
};

export function useVoiceIntake(
  config: VoiceConfig = DEFAULT_VOICE_CONFIG,
): UseVoiceIntakeReturn {
  const support = detectVoiceSupport();

  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState<VoiceTranscriptEntry[]>([]);
  const [interimText, setInterimText] = useState("");
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<QualificationResult | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // Refs for mutable state accessed inside callbacks
  const recogniserRef = useRef<ReturnType<typeof createRecogniser> | null>(null);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionsRef = useRef<string[]>([]);
  const qIndexRef = useRef(0);
  const transcriptRef = useRef<VoiceTranscriptEntry[]>([]);
  const stateRef = useRef<VoiceState>("idle");
  const speakerMutedRef = useRef(false);
  const initialMessageRef = useRef("");

  // Keep refs in sync
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);
  useEffect(() => { speakerMutedRef.current = speakerMuted; }, [speakerMuted]);

  /* ----- helpers ----- */

  const addEntry = useCallback((role: "prospect" | "assistant", content: string) => {
    const entry: VoiceTranscriptEntry = { role, content, timestamp: Date.now() };
    setTranscript((prev) => [...prev, entry]);
  }, []);

  const speak = useCallback(
    (text: string): Promise<void> =>
      new Promise((resolve) => {
        if (!support.synthesis || speakerMutedRef.current) {
          resolve();
          return;
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = config.lang;
        utterance.rate = 0.95;
        utterance.pitch = 1;
        utterance.onend = () => {
          // Allow the audio system to fully release before we start
          // listening — Chrome aborts SpeechRecognition if synthesis
          // audio hasn't settled.
          setTimeout(resolve, 350);
        };
        utterance.onerror = () => setTimeout(resolve, 350);
        window.speechSynthesis.cancel(); // clear any pending
        window.speechSynthesis.speak(utterance);
      }),
    [config.lang, support.synthesis],
  );

  const startCallTimer = useCallback(() => {
    if (callTimerRef.current) return;
    setCallDuration(0);
    callTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopCallTimer = useCallback(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function createRecogniser(): any {
    const SRClass = getSpeechRecognition();
    if (!SRClass) return null;
    const r = new SRClass();
    r.lang = config.lang;
    r.continuous = false;
    r.interimResults = config.interimResults;
    r.maxAlternatives = 1;
    return r;
  }

  /* ----- listen for one utterance ----- */

  const listenOnceRef = useRef<() => Promise<string>>(null);
  const networkRetryRef = useRef(0);
  const abortRetryRef = useRef(0);
  const silenceRestartRef = useRef(0);
  const listenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipResolveRef = useRef<((value: string) => void) | null>(null);
  const accumulatedTextRef = useRef("");
  const MAX_NETWORK_RETRIES = 3;
  const MAX_ABORT_RETRIES = 3;
  const MAX_SILENCE_RESTARTS = 2;
  const LISTEN_TIMEOUT_MS = 15_000;

  const listenOnceImpl = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const r = createRecogniser();
      if (!r) {
        reject(new Error("SpeechRecognition not available"));
        return;
      }
      recogniserRef.current = r;
      let finalText = "";

      // Store the resolve so skipTurn() can call it
      skipResolveRef.current = (value: string) => {
        skipResolveRef.current = null;
        if (listenTimeoutRef.current) {
          clearTimeout(listenTimeoutRef.current);
          listenTimeoutRef.current = null;
        }
        try { r.stop(); } catch { /* ignore */ }
        resolve(value || accumulatedTextRef.current || "(No response provided)");
      };

      // Per-turn timeout: auto-resolve after LISTEN_TIMEOUT_MS
      if (listenTimeoutRef.current) clearTimeout(listenTimeoutRef.current);
      listenTimeoutRef.current = setTimeout(() => {
        listenTimeoutRef.current = null;
        skipResolveRef.current = null;
        try { r.stop(); } catch { /* ignore */ }
        const text = finalText.trim() || accumulatedTextRef.current;
        resolve(text || "(No response — timed out)");
      }, LISTEN_TIMEOUT_MS);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      r.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += t;
            accumulatedTextRef.current += t;
            // Reset silence counter when we get actual speech
            silenceRestartRef.current = 0;
          } else {
            interim += t;
          }
        }
        setInterimText(interim);
      };

      r.onend = () => {
        setInterimText("");
        if (listenTimeoutRef.current) {
          clearTimeout(listenTimeoutRef.current);
          listenTimeoutRef.current = null;
        }
        skipResolveRef.current = null;
        networkRetryRef.current = 0;
        if (finalText.trim()) {
          resolve(finalText.trim());
        } else {
          // User was silent — restart up to MAX_SILENCE_RESTARTS times
          silenceRestartRef.current += 1;
          if (
            silenceRestartRef.current <= MAX_SILENCE_RESTARTS &&
            stateRef.current === "listening" &&
            listenOnceRef.current
          ) {
            listenOnceRef.current().then(resolve).catch(reject);
          } else {
            resolve(accumulatedTextRef.current || "(No response provided)");
          }
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      r.onerror = (event: any) => {
        setInterimText("");
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          reject(new Error("Microphone permission denied. Please allow microphone access and try again."));
        } else if (event.error === "no-speech") {
          // Silence — restart up to limit
          silenceRestartRef.current += 1;
          if (
            silenceRestartRef.current <= MAX_SILENCE_RESTARTS &&
            stateRef.current === "listening" &&
            listenOnceRef.current
          ) {
            listenOnceRef.current().then(resolve).catch(reject);
          } else {
            if (listenTimeoutRef.current) {
              clearTimeout(listenTimeoutRef.current);
              listenTimeoutRef.current = null;
            }
            skipResolveRef.current = null;
            resolve(accumulatedTextRef.current || "(No response provided)");
          }
        } else if (event.error === "network") {
          // Network errors can be transient — retry with backoff
          if (
            networkRetryRef.current < MAX_NETWORK_RETRIES &&
            stateRef.current === "listening" &&
            listenOnceRef.current
          ) {
            networkRetryRef.current += 1;
            const delay = networkRetryRef.current * 500;
            setTimeout(() => {
              if (stateRef.current === "listening" && listenOnceRef.current) {
                listenOnceRef.current().then(resolve).catch(reject);
              } else {
                reject(
                  new Error(
                    "Speech recognition requires a secure connection. Please use localhost or HTTPS, and ensure you have internet access."
                  )
                );
              }
            }, delay);
          } else {
            // Exhausted retries — give a helpful message
            const isSecure =
              typeof window !== "undefined" &&
              (window.location.protocol === "https:" ||
                window.location.hostname === "localhost" ||
                window.location.hostname === "127.0.0.1");
            reject(
              new Error(
                isSecure
                  ? "Speech recognition could not connect to the recognition service. Please check your internet connection and try again."
                  : "Speech recognition requires a secure connection (HTTPS). You are currently on an insecure origin. Please access this page via localhost or deploy with HTTPS."
              )
            );
          }
        } else if (event.error === "aborted") {
          // Chrome often aborts recognition right after speechSynthesis
          // finishes — retry with increasing delay to let audio settle
          if (
            abortRetryRef.current < MAX_ABORT_RETRIES &&
            stateRef.current === "listening" &&
            listenOnceRef.current
          ) {
            abortRetryRef.current += 1;
            const delay = abortRetryRef.current * 400;
            setTimeout(() => {
              // Make sure synthesis is fully stopped before retrying
              window.speechSynthesis?.cancel();
              if (stateRef.current === "listening" && listenOnceRef.current) {
                listenOnceRef.current().then(resolve).catch(reject);
              } else {
                reject(new Error("Speech recognition was stopped."));
              }
            }, delay);
          } else {
            reject(new Error("Speech recognition was stopped. Please try again — make sure no other tabs are using the microphone."));
          }
        } else {
          reject(new Error(event.error || "Speech recognition error"));
        }
      };

      r.start();
    });
  };

  useEffect(() => {
    listenOnceRef.current = listenOnceImpl;
  });

  const listenOnce = useCallback(() => listenOnceRef.current!(), []);

  /* ----- main conversation loop ----- */

  /** Ensure synthesis is fully stopped and audio system is free. */
  const prepareForListening = async () => {
    window.speechSynthesis?.cancel();
    // Give the audio subsystem time to release
    await new Promise((r) => setTimeout(r, 250));
    // Reset per-turn counters
    abortRetryRef.current = 0;
    silenceRestartRef.current = 0;
    accumulatedTextRef.current = "";
  };

  const runConversation = useCallback(async () => {
    try {
      // 1. Agent introduction
      setState("speaking");
      const intro =
        "This is an automated intake assistant for Softrol Systems. Please describe your inquiry, and I'll collect the details needed before connecting you with the right team.";
      addEntry("assistant", intro);
      await speak(intro);

      // 2. Listen for the prospect's initial inquiry
      await prepareForListening();
      setState("listening");
      const initialMessage = await listenOnce();
      addEntry("prospect", initialMessage);
      initialMessageRef.current = initialMessage;

      // 3. Select follow-up questions based on keywords
      setState("processing");
      const questions = selectQuestions(initialMessage);
      questionsRef.current = questions;
      qIndexRef.current = 0;
      setTotalQuestions(questions.length);
      setQuestionIndex(0);

      // Small delay for visual processing state
      await new Promise((r) => setTimeout(r, 600));

      // 4. Ask each follow-up question and capture response
      for (let i = 0; i < questions.length; i++) {
        if (stateRef.current === "error" || stateRef.current === "idle") return;

        const question = questions[i];
        setState("speaking");
        addEntry("assistant", question);
        qIndexRef.current = i + 1;
        setQuestionIndex(i + 1);
        await speak(question);

        await prepareForListening();
        setState("listening");
        try {
          const answer = await listenOnce();
          addEntry("prospect", answer);
        } catch {
          // If they don't respond, note it and continue
          addEntry("prospect", "(No response provided)");
        }
      }

      // 5. Confirmation message
      setState("speaking");
      const confirmMsg =
        "Thank you. I have collected the details from your inquiry. Please review the transcript and confirm so I can generate the qualification summary.";
      addEntry("assistant", confirmMsg);
      await speak(confirmMsg);

      // 6. Move to confirming state
      setState("confirming");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Voice intake failed";
      setErrorMessage(message);
      setState("error");
    }
  }, [addEntry, listenOnce, speak]);

  /* ----- public API ----- */

  const start = useCallback(() => {
    if (!support.recognition) {
      setErrorMessage("Voice recognition is not supported in this browser.");
      setState("error");
      return;
    }
    setTranscript([]);
    setResult(null);
    setErrorMessage("");
    setQuestionIndex(0);
    setTotalQuestions(0);
    initialMessageRef.current = "";
    setState("requesting_permission");
    startCallTimer();

    // The conversation starts once we call runConversation — mic permission
    // is implicitly requested when SpeechRecognition.start() is called.
    void runConversation().catch(() => {
      // handled inside runConversation
    });
  }, [support.recognition, startCallTimer, runConversation]);

  const stop = useCallback(() => {
    try {
      recogniserRef.current?.stop();
    } catch {
      // ignore
    }
    window.speechSynthesis?.cancel();
    stopCallTimer();
    setInterimText("");
    if (listenTimeoutRef.current) {
      clearTimeout(listenTimeoutRef.current);
      listenTimeoutRef.current = null;
    }
    skipResolveRef.current = null;
    if (stateRef.current !== "qualified") {
      setState("idle");
    }
  }, [stopCallTimer]);

  const skipTurn = useCallback(() => {
    if (skipResolveRef.current) {
      skipResolveRef.current(accumulatedTextRef.current);
    }
  }, []);

  const toggleMic = useCallback(() => {
    setMicMuted((prev) => !prev);
  }, []);

  const toggleSpeaker = useCallback(() => {
    setSpeakerMuted((prev) => !prev);
    // If currently speaking and we mute, cancel current speech
    if (!speakerMutedRef.current) {
      window.speechSynthesis?.cancel();
    }
  }, []);

  const confirm = useCallback(() => {
    // Build full prospect text from all prospect entries
    const prospectText = transcriptRef.current
      .filter((e) => e.role === "prospect")
      .map((e) => e.content)
      .join(". ");

    // Use the initial message as the primary input for qualification
    // (mirrors how the typed flow works), but include follow-up context
    const fullInput = initialMessageRef.current
      ? `${initialMessageRef.current}. ${prospectText}`
      : prospectText;

    const qualResult = qualifyCustomInput(fullInput);
    setResult(qualResult);
    setState("qualified");
    stopCallTimer();
    window.speechSynthesis?.cancel();
  }, [stopCallTimer]);

  const reset = useCallback(() => {
    try {
      recogniserRef.current?.stop();
    } catch {
      // ignore
    }
    window.speechSynthesis?.cancel();
    stopCallTimer();
    if (listenTimeoutRef.current) {
      clearTimeout(listenTimeoutRef.current);
      listenTimeoutRef.current = null;
    }
    skipResolveRef.current = null;
    accumulatedTextRef.current = "";
    setState("idle");
    setTranscript([]);
    setInterimText("");
    setResult(null);
    setErrorMessage("");
    setCallDuration(0);
    setQuestionIndex(0);
    setTotalQuestions(0);
    initialMessageRef.current = "";
  }, [stopCallTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        recogniserRef.current?.stop();
      } catch {
        // ignore
      }
      window.speechSynthesis?.cancel();
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      if (listenTimeoutRef.current) clearTimeout(listenTimeoutRef.current);
    };
  }, []);

  return {
    state,
    transcript,
    interimText,
    supported: support.recognition,
    synthSupported: support.synthesis,
    speakerMuted,
    micMuted,
    callDuration,
    questionIndex,
    totalQuestions,
    errorMessage,
    result,
    start,
    stop,
    skipTurn,
    toggleMic,
    toggleSpeaker,
    confirm,
    reset,
  };
}
