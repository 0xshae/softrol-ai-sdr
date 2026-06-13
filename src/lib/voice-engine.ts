"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { qualifyCustomInput } from "@/lib/qualifier";
import type { QualificationResult } from "@/lib/types";
import {
  createDeterministicVoiceDecision,
  type VoiceAgentDecision,
} from "@/lib/voice-agent";
import {
  DEFAULT_VOICE_CONFIG,
  type VoiceConfig,
  type VoiceState,
  type VoiceTranscriptEntry,
  detectVoiceSupport,
} from "@/lib/voice-types";

/* ------------------------------------------------------------------ */
/*  SpeechRecognition type shim                                       */
/* ------------------------------------------------------------------ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSpeechRecognition(): (new () => any) | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null;
}

function subscribeToVoiceSupport() {
  return () => {};
}

function getVoiceSupportSnapshot() {
  const support = detectVoiceSupport();
  return `${support.recognition ? "1" : "0"}:${support.synthesis ? "1" : "0"}`;
}

function getServerVoiceSupportSnapshot() {
  return "unchecked";
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
  /** Whether browser capability detection has completed on the client. */
  supportChecked: boolean;
  /** Whether browser supports speech synthesis. */
  synthSupported: boolean;
  /** Whether agent voice output is muted. */
  speakerMuted: boolean;
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
  start: () => Promise<void>;
  /** Stop/end the session. */
  stop: () => void;
  /** Manually end the current listening turn ("Done speaking" button). */
  skipTurn: () => void;
  /** Toggle speaker mute. */
  toggleSpeaker: () => void;
  /** Confirm the transcript and run qualification. */
  confirm: () => Promise<void>;
  /** Full reset back to idle. */
  reset: () => void;
};

export function useVoiceIntake(
  config: VoiceConfig = DEFAULT_VOICE_CONFIG,
): UseVoiceIntakeReturn {
  const supportSnapshot = useSyncExternalStore(
    subscribeToVoiceSupport,
    getVoiceSupportSnapshot,
    getServerVoiceSupportSnapshot,
  );
  const supportChecked = supportSnapshot !== "unchecked";
  const support = {
    recognition: supportSnapshot.startsWith("1:"),
    synthesis: supportSnapshot.endsWith(":1"),
  };
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState<VoiceTranscriptEntry[]>([]);
  const [interimText, setInterimText] = useState("");
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<QualificationResult | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // Refs for mutable state accessed inside callbacks
  const recogniserRef = useRef<ReturnType<typeof createRecogniser> | null>(null);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptRef = useRef<VoiceTranscriptEntry[]>([]);
  const stateRef = useRef<VoiceState>("idle");
  const speakerMutedRef = useRef(false);
  const initialMessageRef = useRef("");
  const pendingDecisionRef = useRef<VoiceAgentDecision | null>(null);
  const sessionActiveRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);
  useEffect(() => { speakerMutedRef.current = speakerMuted; }, [speakerMuted]);

  /* ----- helpers ----- */

  const transition = useCallback((nextState: VoiceState) => {
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  const addEntry = useCallback((role: "prospect" | "assistant", content: string) => {
    const entry: VoiceTranscriptEntry = { role, content, timestamp: Date.now() };
    setTranscript((prev) => [...prev, entry]);
  }, []);

  const requestAgentDecision = useCallback(
    async (
      currentTranscript: VoiceTranscriptEntry[],
      finalize = false,
    ) => {
      try {
        const response = await fetch("/api/voice-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: currentTranscript, finalize }),
        });
        if (!response.ok) throw new Error(`Voice agent returned ${response.status}`);
        return (await response.json()) as VoiceAgentDecision;
      } catch {
        return createDeterministicVoiceDecision(currentTranscript);
      }
    },
    [],
  );

  const speak = useCallback(
    (text: string): Promise<void> =>
      new Promise((resolve) => {
        if (!support.synthesis || speakerMutedRef.current) {
          resolve();
          return;
        }

        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          window.clearTimeout(watchdog);
          setTimeout(resolve, 350);
        };
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = config.lang;
        utterance.rate = 0.95;
        utterance.pitch = 1;
        utterance.onend = finish;
        utterance.onerror = finish;
        const watchdog = window.setTimeout(() => {
          window.speechSynthesis.cancel();
          finish();
        }, Math.max(8_000, text.length * 90));
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
    // Chrome's remote recognition service is more reliable in single-utterance
    // mode. We restart short sessions inside one bounded listening turn.
    r.continuous = false;
    r.interimResults = config.interimResults;
    r.maxAlternatives = 1;
    return r;
  }

  /* ----- listen for one turn ----- */
  /*
   * The listening turn remains open across short recognition sessions until:
   *  1. 30s hard timeout fires (no speech at all)
   *  2. 3s of silence AFTER speech was detected (natural end of utterance)
   *  3. User clicks the "Done speaking" button (skipTurn)
   *  4. Permission is denied or network retries are exhausted
   */

  const listenOnceRef = useRef<() => Promise<string>>(null);
  const listenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceAfterSpeechRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipResolveRef = useRef<(() => void) | null>(null);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const LISTEN_TIMEOUT_MS = 30_000;
  const SILENCE_AFTER_SPEECH_MS = 3_000;

  const listenOnceImpl = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      let finalText = "";
      let interimText = "";
      let resolved = false;
      let networkFailures = 0;
      let activeRecogniser: ReturnType<typeof createRecogniser> | null = null;

      const cleanup = () => {
        if (listenTimeoutRef.current) {
          clearTimeout(listenTimeoutRef.current);
          listenTimeoutRef.current = null;
        }
        if (silenceAfterSpeechRef.current) {
          clearTimeout(silenceAfterSpeechRef.current);
          silenceAfterSpeechRef.current = null;
        }
        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = null;
        }
        skipResolveRef.current = null;
        setInterimText("");
      };

      const doResolve = (text: string) => {
        const normalized = text.trim();
        if (resolved || !normalized) return;
        resolved = true;
        cleanup();
        try { activeRecogniser?.stop(); } catch { /* ignore */ }
        resolve(normalized);
      };

      const doReject = (err: Error) => {
        if (resolved) return;
        resolved = true;
        cleanup();
        try { activeRecogniser?.stop(); } catch { /* ignore */ }
        reject(err);
      };

      // Hook for the "Done speaking" button
      skipResolveRef.current = () => {
        const capturedText = `${finalText} ${interimText}`.trim();
        if (capturedText) {
          doResolve(capturedText);
        }
      };

      // Hard timeout — auto-stop after LISTEN_TIMEOUT_MS
      listenTimeoutRef.current = setTimeout(() => {
        const capturedText = `${finalText} ${interimText}`.trim();
        if (capturedText) {
          doResolve(capturedText);
        } else {
          doReject(
            new Error(
              networkFailures
                ? "Chrome could not reach its speech recognition service during the listening window. Keep the tab active, disable VPN or strict privacy blocking for this site, and try again."
                : "No speech was detected. Keep this tab active, check your microphone input, and try again.",
            ),
          );
        }
      }, LISTEN_TIMEOUT_MS);

      const scheduleRestart = (delay = 200) => {
        if (resolved || !sessionActiveRef.current) return;
        if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = setTimeout(() => {
          restartTimeoutRef.current = null;
          startRecognition();
        }, delay);
      };

      const startRecognition = () => {
        if (resolved || !sessionActiveRef.current) return;
        const recogniser = createRecogniser();
        if (!recogniser) {
          doReject(new Error("Speech recognition is not available in this browser."));
          return;
        }
        activeRecogniser = recogniser;
        recogniserRef.current = recogniser;
        let handledError = false;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recogniser.onresult = (event: any) => {
          if (resolved) return;
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const text = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalText += text;
            } else {
              interim += text;
            }
          }
          interimText = interim;
          setInterimText(interim);

          if (finalText.trim()) {
            networkFailures = 0;
            if (silenceAfterSpeechRef.current) {
              clearTimeout(silenceAfterSpeechRef.current);
            }
            silenceAfterSpeechRef.current = setTimeout(() => {
              doResolve(finalText);
            }, SILENCE_AFTER_SPEECH_MS);
          }
        };

        recogniser.onend = () => {
          if (resolved || handledError) return;
          const capturedText = `${finalText} ${interimText}`.trim();
          if (capturedText) {
            doResolve(capturedText);
          } else {
            scheduleRestart();
          }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recogniser.onerror = (event: any) => {
          if (resolved) return;
          handledError = true;
          if (
            event.error === "not-allowed" ||
            event.error === "service-not-allowed"
          ) {
            doReject(
              new Error(
                "Microphone permission denied. Please allow microphone access and try again.",
              ),
            );
          } else if (event.error === "network") {
            networkFailures += 1;
            scheduleRestart(Math.min(500 + networkFailures * 500, 3_000));
          } else if (
            event.error === "aborted" ||
            event.error === "no-speech" ||
            event.error === "audio-capture"
          ) {
            scheduleRestart();
          } else {
            doReject(
              new Error(event.error || "Speech recognition could not start."),
            );
          }
        };

        try {
          recogniser.start();
        } catch {
          scheduleRestart(400);
        }
      };

      startRecognition();
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
    await new Promise((r) => setTimeout(r, 300));
  };

  const runConversation = useCallback(async () => {
    try {
      // 1. Agent introduction
      transition("speaking");
      const intro =
        "This is an automated intake assistant for Softrol Systems. Please describe your inquiry, and I'll collect the details needed before connecting you with the right team.";
      addEntry("assistant", intro);
      await speak(intro);
      if (!sessionActiveRef.current) return;

      // 2. Listen for the prospect's initial inquiry
      await prepareForListening();
      if (!sessionActiveRef.current) return;
      transition("listening");
      const initialMessage = await listenOnce();
      if (!sessionActiveRef.current) return;
      addEntry("prospect", initialMessage);
      initialMessageRef.current = initialMessage;

      const conversation: VoiceTranscriptEntry[] = [
        { role: "assistant", content: intro, timestamp: Date.now() },
        { role: "prospect", content: initialMessage, timestamp: Date.now() },
      ];

      // 3. Let the model select adaptive follow-ups and maintain the handoff.
      transition("processing");
      let decision = await requestAgentDecision(conversation);
      if (!sessionActiveRef.current) return;
      pendingDecisionRef.current = decision;
      setTotalQuestions(5);
      setQuestionIndex(0);
      let followUpCount = 0;

      // 4. Continue until the model has enough context or the turn cap is reached.
      while (!decision.complete && followUpCount < 5) {
        if (!sessionActiveRef.current) return;

        const question = decision.reply;
        transition("speaking");
        addEntry("assistant", question);
        conversation.push({ role: "assistant", content: question, timestamp: Date.now() });
        followUpCount += 1;
        setQuestionIndex(followUpCount);
        await speak(question);
        if (!sessionActiveRef.current) return;

        await prepareForListening();
        if (!sessionActiveRef.current) return;
        transition("listening");
        const answer = await listenOnce();
        if (!sessionActiveRef.current) return;
        addEntry("prospect", answer);
        conversation.push({ role: "prospect", content: answer, timestamp: Date.now() });

        transition("processing");
        decision = await requestAgentDecision(conversation);
        if (!sessionActiveRef.current) return;
        pendingDecisionRef.current = decision;
      }

      // 5. Confirmation message
      transition("speaking");
      const confirmMsg = decision.complete
        ? decision.reply
        : "Thank you. I have captured the available context. Please review the transcript and confirm so I can prepare the qualification summary.";
      addEntry("assistant", confirmMsg);
      await speak(confirmMsg);
      if (!sessionActiveRef.current) return;

      // 6. Move to confirming state
      transition("confirming");
    } catch (err) {
      if (!sessionActiveRef.current) return;
      const message = err instanceof Error ? err.message : "Voice intake failed";
      setErrorMessage(message);
      sessionActiveRef.current = false;
      transition("error");
    }
  }, [addEntry, listenOnce, requestAgentDecision, speak, transition]);

  /* ----- public API ----- */

  const start = useCallback(async () => {
    if (!support.recognition) {
      setErrorMessage("Voice recognition is not supported in this browser.");
      transition("error");
      return;
    }
    sessionActiveRef.current = true;
    setTranscript([]);
    setResult(null);
    setErrorMessage("");
    setQuestionIndex(0);
    setTotalQuestions(0);
    initialMessageRef.current = "";
    pendingDecisionRef.current = null;
    transition("requesting_permission");

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch (error) {
      sessionActiveRef.current = false;
      const permissionDenied =
        error instanceof DOMException &&
        (error.name === "NotAllowedError" || error.name === "SecurityError");
      setErrorMessage(
        permissionDenied
          ? "Microphone permission was denied. Allow microphone access for this site, then try again."
          : "The microphone could not be opened. Check that a microphone is connected and available.",
      );
      transition("error");
      return;
    }

    startCallTimer();
    void runConversation().catch(() => {
      // handled inside runConversation
    });
  }, [support.recognition, startCallTimer, runConversation, transition]);

  const stop = useCallback(() => {
    sessionActiveRef.current = false;
    stateRef.current = "idle";
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
    if (silenceAfterSpeechRef.current) {
      clearTimeout(silenceAfterSpeechRef.current);
      silenceAfterSpeechRef.current = null;
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    skipResolveRef.current = null;
    transition("idle");
  }, [stopCallTimer, transition]);

  const skipTurn = useCallback(() => {
    if (skipResolveRef.current) {
      skipResolveRef.current();
    }
  }, []);

  const toggleSpeaker = useCallback(() => {
    setSpeakerMuted((prev) => !prev);
    // If currently speaking and we mute, cancel current speech
    if (!speakerMutedRef.current) {
      window.speechSynthesis?.cancel();
    }
  }, []);

  const confirm = useCallback(async () => {
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

    transition("processing");
    const finalDecision = transcriptRef.current.length
      ? await requestAgentDecision(transcriptRef.current, true)
      : pendingDecisionRef.current;
    const qualResult = finalDecision
      ? { lead: finalDecision.lead, inputKind: "matched" as const }
      : qualifyCustomInput(fullInput);
    setResult(qualResult);
    sessionActiveRef.current = false;
    transition("qualified");
    stopCallTimer();
    window.speechSynthesis?.cancel();
  }, [requestAgentDecision, stopCallTimer, transition]);

  const reset = useCallback(() => {
    sessionActiveRef.current = false;
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
    if (silenceAfterSpeechRef.current) {
      clearTimeout(silenceAfterSpeechRef.current);
      silenceAfterSpeechRef.current = null;
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    skipResolveRef.current = null;
    transition("idle");
    setTranscript([]);
    setInterimText("");
    setResult(null);
    setErrorMessage("");
    setCallDuration(0);
    setQuestionIndex(0);
    setTotalQuestions(0);
    initialMessageRef.current = "";
    pendingDecisionRef.current = null;
  }, [stopCallTimer, transition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sessionActiveRef.current = false;
      try {
        recogniserRef.current?.stop();
      } catch {
        // ignore
      }
      window.speechSynthesis?.cancel();
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      if (listenTimeoutRef.current) clearTimeout(listenTimeoutRef.current);
      if (silenceAfterSpeechRef.current) clearTimeout(silenceAfterSpeechRef.current);
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
    };
  }, []);

  return {
    state,
    transcript,
    interimText,
    supported: support.recognition,
    supportChecked,
    synthSupported: support.synthesis,
    speakerMuted,
    callDuration,
    questionIndex,
    totalQuestions,
    errorMessage,
    result,
    start,
    stop,
    skipTurn,
    toggleSpeaker,
    confirm,
    reset,
  };
}
