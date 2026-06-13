/* ------------------------------------------------------------------ */
/*  Voice intake types                                                */
/* ------------------------------------------------------------------ */

/** Finite-state machine for the voice intake conversation. */
export type VoiceState =
  | "idle"                  // Waiting for user to start
  | "requesting_permission" // Asking for mic access
  | "listening"             // Mic active — capturing prospect speech
  | "transcribing"          // Recorded turn is being converted to text
  | "processing"            // Transcript returned, matching intent
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
  /** Reserved for alternate voice transports. */
  continuous: boolean;
  /** Reserved for alternate voice transports. */
  interimResults: boolean;
};

export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  lang: "en-US",
  continuous: false,
  interimResults: true,
};

/** Browser compatibility check result. */
export type VoiceSupport = {
  recording: boolean;
  synthesis: boolean;
};

/** Check whether the browser can capture microphone audio and speak responses. */
export function detectVoiceSupport(): VoiceSupport {
  const w = typeof window !== "undefined" ? window : undefined;
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  return {
    recording: Boolean(w?.MediaRecorder && nav?.mediaDevices?.getUserMedia),
    synthesis: Boolean(w && w.speechSynthesis),
  };
}
