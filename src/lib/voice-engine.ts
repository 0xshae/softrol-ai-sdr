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

function subscribeToVoiceSupport() {
  return () => {};
}

function getVoiceSupportSnapshot() {
  const support = detectVoiceSupport();
  return `${support.recording ? "1" : "0"}:${support.synthesis ? "1" : "0"}`;
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
    recording: supportSnapshot.startsWith("1:"),
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
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
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

  const stopMediaStream = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }, []);

  const ensureMediaStream = useCallback(async () => {
    const current = mediaStreamRef.current;
    if (current?.getAudioTracks().some((track) => track.readyState === "live")) {
      return current;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    mediaStreamRef.current = stream;
    return stream;
  }, []);

  function preferredAudioMimeType(): string | undefined {
    return [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
    ].find((mime) => MediaRecorder.isTypeSupported(mime));
  }

  /* ----- record and transcribe one prospect turn ----- */

  const listenOnceRef = useRef<() => Promise<string>>(null);
  const listenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipResolveRef = useRef<(() => void) | null>(null);
  const LISTEN_TIMEOUT_MS = 30_000;

  const transcribeRecording = useCallback(async (audio: Blob) => {
    const formData = new FormData();
    formData.append("audio", audio, `voice-turn.${audio.type.includes("ogg") ? "ogg" : audio.type.includes("mp4") ? "mp4" : "webm"}`);
    const response = await fetch("/api/transcribe", {
      method: "POST",
      body: formData,
    });
    const payload = (await response.json().catch(() => null)) as
      | { text?: unknown; error?: unknown }
      | null;
    if (!response.ok) {
      throw new Error(
        typeof payload?.error === "string"
          ? payload.error
          : "Voice transcription failed. Please try again.",
      );
    }
    const text = typeof payload?.text === "string" ? payload.text.trim() : "";
    if (!text) {
      throw new Error("No speech was detected. Please speak clearly and try again.");
    }
    return text;
  }, []);

  const listenOnceImpl = async (): Promise<string> => {
    const stream = await ensureMediaStream();
    return new Promise((resolve, reject) => {
      const chunks: BlobPart[] = [];
      let settled = false;
      const mimeType = preferredAudioMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      recorderRef.current = recorder;

      const cleanup = () => {
        if (listenTimeoutRef.current) {
          clearTimeout(listenTimeoutRef.current);
          listenTimeoutRef.current = null;
        }
        skipResolveRef.current = null;
        setInterimText("");
        if (recorderRef.current === recorder) recorderRef.current = null;
      };

      const fail = (error: Error) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      };

      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onerror = () => {
        fail(new Error("The microphone recording could not be completed."));
      };
      recorder.onstop = () => {
        if (settled) return;
        if (!sessionActiveRef.current) {
          fail(new Error("Voice intake stopped."));
          return;
        }
        const audio = new Blob(chunks, {
          type: recorder.mimeType || mimeType || "audio/webm",
        });
        if (!audio.size) {
          fail(new Error("No audio was captured. Please speak and try again."));
          return;
        }
        transition("transcribing");
        void transcribeRecording(audio).then(
          (text) => {
            if (settled) return;
            settled = true;
            cleanup();
            resolve(text);
          },
          (error: unknown) => {
            fail(
              error instanceof Error
                ? error
                : new Error("Voice transcription failed. Please try again."),
            );
          },
        );
      };

      skipResolveRef.current = () => {
        if (recorder.state === "recording") recorder.stop();
      };
      listenTimeoutRef.current = setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, LISTEN_TIMEOUT_MS);

      try {
        recorder.start(250);
      } catch {
        fail(new Error("The microphone recording could not be started."));
      }
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
    if (!support.recording) {
      setErrorMessage("Voice recording is not supported in this browser.");
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
      await ensureMediaStream();
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
  }, [ensureMediaStream, support.recording, startCallTimer, runConversation, transition]);

  const stop = useCallback(() => {
    sessionActiveRef.current = false;
    stateRef.current = "idle";
    try {
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    } catch {
      // ignore
    }
    stopMediaStream();
    window.speechSynthesis?.cancel();
    stopCallTimer();
    setInterimText("");
    if (listenTimeoutRef.current) {
      clearTimeout(listenTimeoutRef.current);
      listenTimeoutRef.current = null;
    }
    skipResolveRef.current = null;
    transition("idle");
  }, [stopCallTimer, stopMediaStream, transition]);

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
    stopMediaStream();
    window.speechSynthesis?.cancel();
  }, [requestAgentDecision, stopCallTimer, stopMediaStream, transition]);

  const reset = useCallback(() => {
    sessionActiveRef.current = false;
    try {
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    } catch {
      // ignore
    }
    stopMediaStream();
    window.speechSynthesis?.cancel();
    stopCallTimer();
    if (listenTimeoutRef.current) {
      clearTimeout(listenTimeoutRef.current);
      listenTimeoutRef.current = null;
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
  }, [stopCallTimer, stopMediaStream, transition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sessionActiveRef.current = false;
      try {
        if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      } catch {
        // ignore
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      window.speechSynthesis?.cancel();
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      if (listenTimeoutRef.current) clearTimeout(listenTimeoutRef.current);
    };
  }, []);

  return {
    state,
    transcript,
    interimText,
    supported: support.recording,
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
