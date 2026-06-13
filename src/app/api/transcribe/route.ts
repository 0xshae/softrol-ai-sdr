import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // Groq allows up to 25MB

export async function POST(request: Request) {
  // Accept either GROQ_API_KEY or OPENROUTER_API_KEY for flexibility
  const groqKey = process.env.GROQ_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;

  // Determine which transcription service to use
  const useGroq = Boolean(groqKey);
  const apiKey = groqKey || openrouterKey;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Voice transcription is not configured. Set GROQ_API_KEY in your environment." },
      { status: 503 },
    );
  }

  let audio: File;
  try {
    const formData = await request.formData();
    const value = formData.get("audio");
    if (!(value instanceof File)) {
      return NextResponse.json(
        { error: "An audio recording is required." },
        { status: 400 },
      );
    }
    audio = value;
  } catch {
    return NextResponse.json(
      { error: "The audio recording could not be read." },
      { status: 400 },
    );
  }

  if (!audio.size || audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      {
        error: audio.size
          ? "The recording is too large. Keep each response under 30 seconds."
          : "No audio was captured. Please speak and try again.",
      },
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  try {
    if (useGroq) {
      // --- Groq Whisper API (free tier, OpenAI-compatible) ---
      const uploadForm = new FormData();
      uploadForm.append("file", audio, `voice-turn.${extensionFromMime(audio.type)}`);
      uploadForm.append("model", process.env.GROQ_STT_MODEL ?? "whisper-large-v3-turbo");
      uploadForm.append("language", "en");
      uploadForm.append("temperature", "0");
      uploadForm.append("response_format", "json");

      const response = await fetch(
        "https://api.groq.com/openai/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey}`,
          },
          body: uploadForm,
          signal: controller.signal,
        },
      );

      const payload = (await response.json().catch(() => null)) as
        | { text?: unknown; error?: { message?: unknown } | string }
        | null;

      if (!response.ok) {
        const providerMessage =
          typeof payload?.error === "string"
            ? payload.error
            : typeof payload?.error === "object" && payload?.error && typeof payload.error.message === "string"
              ? payload.error.message
              : "The transcription provider rejected the recording.";
        return NextResponse.json({ error: providerMessage }, { status: 502 });
      }

      const text = typeof payload?.text === "string" ? payload.text.trim() : "";
      if (!text) {
        return NextResponse.json(
          { error: "No speech was detected. Please speak clearly and try again." },
          { status: 422 },
        );
      }

      return NextResponse.json({ text });
    } else {
      // --- OpenRouter audio transcription (requires paid balance) ---
      const data = Buffer.from(await audio.arrayBuffer()).toString("base64");
      const response = await fetch(
        "https://openrouter.ai/api/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openrouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": request.headers.get("origin") ?? "https://softrol-revenue-desk.vercel.app",
            "X-Title": "Softrol Revenue Desk",
          },
          body: JSON.stringify({
            model: process.env.OPENROUTER_STT_MODEL ?? "openai/gpt-4o-mini-transcribe",
            input_audio: {
              data,
              format: extensionFromMime(audio.type),
            },
            language: "en",
            temperature: 0,
          }),
          signal: controller.signal,
        },
      );

      const payload = (await response.json().catch(() => null)) as
        | { text?: unknown; error?: { message?: unknown } | string }
        | null;

      if (!response.ok) {
        const providerMessage =
          typeof payload?.error === "string"
            ? payload.error
            : typeof payload?.error === "object" && payload?.error && typeof payload.error.message === "string"
              ? payload.error.message
              : "The transcription provider rejected the recording.";
        return NextResponse.json({ error: providerMessage }, { status: 502 });
      }

      const text = typeof payload?.text === "string" ? payload.text.trim() : "";
      if (!text) {
        return NextResponse.json(
          { error: "No speech was detected. Please speak clearly and try again." },
          { status: 422 },
        );
      }

      return NextResponse.json({ text });
    }
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Transcription timed out. Please try a shorter response."
        : "Voice transcription could not be reached. Please try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}

function extensionFromMime(mime: string): string {
  const lower = mime.toLowerCase();
  if (lower.includes("ogg")) return "ogg";
  if (lower.includes("wav")) return "wav";
  if (lower.includes("mpeg") || lower.includes("mp3")) return "mp3";
  if (lower.includes("mp4") || lower.includes("m4a")) return "mp4";
  return "webm";
}
