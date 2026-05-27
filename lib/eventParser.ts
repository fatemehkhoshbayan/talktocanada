import type { CalendarEvent } from "./calendar";

const EVENT_BLOCK_RE = /```event\s*([\s\S]*?)```/g;

function isValidEvent(o: unknown): o is CalendarEvent {
  if (!o || typeof o !== "object") return false;
  const e = o as Record<string, unknown>;
  return (
    typeof e.title === "string" &&
    e.title.trim().length > 0 &&
    typeof e.description === "string" &&
    typeof e.suggestedDaysFromNow === "number" &&
    Number.isFinite(e.suggestedDaysFromNow) &&
    typeof e.durationMinutes === "number" &&
    Number.isFinite(e.durationMinutes) &&
    (e.location === undefined || typeof e.location === "string")
  );
}

export function parseEvents(text: string): { cleanedText: string; events: CalendarEvent[] } {
  const events: CalendarEvent[] = [];
  const cleanedText = text.replace(EVENT_BLOCK_RE, (_match, jsonRaw: string) => {
    try {
      const parsed = JSON.parse(jsonRaw.trim());
      if (isValidEvent(parsed)) {
        // Clamp to safe ranges.
        events.push({
          title: parsed.title.trim().slice(0, 200),
          description: parsed.description.slice(0, 1500),
          suggestedDaysFromNow: Math.max(0, Math.min(60, Math.round(parsed.suggestedDaysFromNow))),
          durationMinutes: Math.max(15, Math.min(240, Math.round(parsed.durationMinutes))),
          location: parsed.location?.slice(0, 200),
        });
      }
    } catch {
      // Malformed JSON — drop silently rather than confuse the user with raw text.
    }
    return "";
  });
  return { cleanedText: cleanedText.trim(), events };
}
