/**
 * POST /api/transcribe
 *
 * Receives a multipart/form-data audio file (and optional language hint),
 * forwards it to ElevenLabs Scribe v2, and returns:
 *   { text: string, languageCode: string|null, confidence: number|null }
 *
 * languageCode is the ISO-639-3 string from Scribe; the client maps it to our
 * internal 2-letter code via lib/iso.ts.
 */

export const runtime = "nodejs";

const SCRIBE_URL = "https://api.elevenlabs.io/v1/speech-to-text";

export async function POST(req: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "ELEVENLABS_API_KEY is not configured" },
      { status: 500 }
    );
  }

  let incoming: FormData;
  try {
    incoming = await req.formData();
  } catch {
    return Response.json(
      { error: "Expected multipart/form-data with a `file` field" },
      { status: 400 }
    );
  }

  const file = incoming.get("file");
  if (!(file instanceof Blob)) {
    return Response.json({ error: "Missing `file` blob" }, { status: 400 });
  }

  const languageHint = incoming.get("languageHint");

  const fwd = new FormData();
  fwd.append("file", file, "audio.webm");
  fwd.append("model_id", "scribe_v2");
  if (typeof languageHint === "string" && languageHint.trim()) {
    fwd.append("language_code", languageHint.trim());
  }
  fwd.append("timestamps_granularity", "none");

  let res: Response;
  try {
    res = await fetch(SCRIBE_URL, {
      method: "POST",
      headers: { "xi-api-key": apiKey },
      body: fwd,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Network error" },
      { status: 502 }
    );
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return Response.json(
      { error: `Scribe ${res.status}: ${detail.slice(0, 200)}` },
      { status: res.status }
    );
  }

  let data: {
    text?: string;
    language_code?: string;
    language_probability?: number;
  };
  try {
    data = (await res.json()) as typeof data;
  } catch {
    return Response.json({ error: "Scribe returned non-JSON" }, { status: 502 });
  }

  return Response.json({
    text: (data.text ?? "").trim(),
    languageCode: data.language_code ?? null,
    confidence:
      typeof data.language_probability === "number"
        ? data.language_probability
        : null,
  });
}
