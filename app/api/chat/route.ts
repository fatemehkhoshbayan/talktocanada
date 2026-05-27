import Anthropic from "@anthropic-ai/sdk";
import { systemPrompt } from "@/lib/prompts";
import { parseEvents } from "@/lib/eventParser";
import type { Language } from "@/lib/languages";

type ChatMessage = { role: "user" | "assistant"; text: string };

type ReqBody = {
  messages: ChatMessage[];
  language: Language;
};

export const runtime = "nodejs";

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 500 }
    );
  }

  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.language || !Array.isArray(body.messages) || body.messages.length === 0) {
    return Response.json({ error: "language and non-empty messages are required" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt(body.language),
      messages: body.messages.map((m) => ({
        role: m.role,
        content: m.text,
      })),
    });

    const firstBlock = response.content[0];
    const rawText =
      firstBlock && firstBlock.type === "text" ? firstBlock.text : "";

    const { cleanedText, events } = parseEvents(rawText);

    return Response.json({ text: cleanedText, events });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
