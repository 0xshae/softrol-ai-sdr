/* ------------------------------------------------------------------ */
/*  Voice intake types                                                */
/* ------------------------------------------------------------------ */

/** Finite-state machine for the voice intake conversation. */
export type VoiceState =
  | "idle"                  // Waiting for user to start
  | "requesting_permission" // Asking for mic access
  | "listening"             // Mic active — capturing prospect speech
  | "processing"            // Recogniser returned final result, matching intent
  | "speaking"              // Agent speaking a follow-up question
  | "confirming"            // Transcript review before qualification
  | "qualified"             // qualifyCustomInput() ran, result ready
  | "error";                // Mic denied, API unavailable, etc.

/** One turn in the voice conversation transcript. */
export type VoiceTranscriptEntry = {
  role: "prospect" | "assistant";
  content: string;
  timestamp: number;
};

/** Configuration passed to the voice engine. */
export type VoiceConfig = {
  /** BCP-47 language tag, default "en-US". */
  lang: string;
  /** Keep recogniser open between utterances. */
  continuous: boolean;
  /** Show partial results while speaking. */
  interimResults: boolean;
};

export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  lang: "en-US",
  continuous: false,
  interimResults: true,
};

/** Browser compatibility check result. */
export type VoiceSupport = {
  recognition: boolean;
  synthesis: boolean;
};

/** Check whether the current browser supports the Web Speech APIs. */
export function detectVoiceSupport(): VoiceSupport {
  const w = typeof window !== "undefined" ? window : undefined;
  return {
    recognition: Boolean(
      w &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((w as any).SpeechRecognition || (w as any).webkitSpeechRecognition),
    ),
    synthesis: Boolean(w && w.speechSynthesis),
  };
}
