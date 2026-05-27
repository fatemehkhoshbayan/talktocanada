/**
 * Parses ```action JSON blocks out of an assistant message.
 * Unknown action types and malformed JSON are dropped silently.
 */

export type AppAction =
  | { type: "switch_language"; to: string }
  | { type: "set_playback_rate"; rate: number }
  | { type: "repeat_last" }
  | { type: "set_city"; city: string }
  | { type: "checkoff_task"; title: string }
  | { type: "stop" }
  | { type: "reset_conversation" };

const ACTION_BLOCK_RE = /```action\s*([\s\S]*?)```/g;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function coerceAction(o: unknown): AppAction | null {
  if (!isPlainObject(o)) return null;
  const t = o.type;
  if (typeof t !== "string") return null;

  switch (t) {
    case "switch_language":
      return typeof o.to === "string" && o.to.length > 0
        ? { type: "switch_language", to: o.to.toLowerCase() }
        : null;
    case "set_playback_rate": {
      const r = Number(o.rate);
      if (!Number.isFinite(r)) return null;
      const clamped = Math.max(0.6, Math.min(1.4, r));
      return { type: "set_playback_rate", rate: clamped };
    }
    case "repeat_last":
      return { type: "repeat_last" };
    case "set_city":
      return typeof o.city === "string" && o.city.trim()
        ? { type: "set_city", city: o.city.trim() }
        : null;
    case "checkoff_task":
      return typeof o.title === "string" && o.title.trim()
        ? { type: "checkoff_task", title: o.title.trim() }
        : null;
    case "stop":
      return { type: "stop" };
    case "reset_conversation":
      return { type: "reset_conversation" };
    default:
      return null;
  }
}

export function parseActions(text: string): {
  cleanedText: string;
  actions: AppAction[];
} {
  const actions: AppAction[] = [];
  const cleanedText = text.replace(ACTION_BLOCK_RE, (_match, raw: string) => {
    try {
      const parsed = JSON.parse(raw.trim());
      const action = coerceAction(parsed);
      if (action) actions.push(action);
    } catch {
      // Silently drop malformed JSON.
    }
    return "";
  });
  return { cleanedText: cleanedText.trim(), actions };
}
