/**
 * Parses ```task JSON blocks out of an assistant message.
 * Mirrors lib/eventParser.ts but for non-dated to-do items.
 */

export type AppTask = {
  title: string;
  description: string;
  priority: "high" | "med" | "low";
};

const TASK_BLOCK_RE = /```task\s*([\s\S]*?)```/g;

function coerceTask(o: unknown): AppTask | null {
  if (!o || typeof o !== "object") return null;
  const e = o as Record<string, unknown>;
  if (typeof e.title !== "string" || e.title.trim().length === 0) return null;
  if (typeof e.description !== "string") return null;

  const rawPriority = typeof e.priority === "string" ? e.priority.toLowerCase() : "med";
  const priority: AppTask["priority"] =
    rawPriority === "high" ? "high" : rawPriority === "low" ? "low" : "med";

  return {
    title: e.title.trim().slice(0, 200),
    description: e.description.slice(0, 600),
    priority,
  };
}

export function parseTasks(text: string): { cleanedText: string; tasks: AppTask[] } {
  const tasks: AppTask[] = [];
  const cleanedText = text.replace(TASK_BLOCK_RE, (_match, raw: string) => {
    try {
      const parsed = JSON.parse(raw.trim());
      const task = coerceTask(parsed);
      if (task) tasks.push(task);
    } catch {
      // drop silently
    }
    return "";
  });
  return { cleanedText: cleanedText.trim(), tasks };
}
