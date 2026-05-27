export type CalendarEvent = {
  title: string;
  description: string;
  suggestedDaysFromNow: number;
  durationMinutes: number;
  location?: string;
};

const MAX_DESCRIPTION = 1500;

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function fmtUtc(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

export function eventStart(event: CalendarEvent, now: Date = new Date()): Date {
  const start = new Date(now);
  start.setDate(start.getDate() + Math.max(0, event.suggestedDaysFromNow));
  start.setHours(10, 0, 0, 0);
  return start;
}

export function eventEnd(event: CalendarEvent, start: Date): Date {
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + Math.max(15, event.durationMinutes));
  return end;
}

export function buildGCalUrl(event: CalendarEvent, now: Date = new Date()): string {
  const start = eventStart(event, now);
  const end = eventEnd(event, start);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${fmtUtc(start)}/${fmtUtc(end)}`,
    details: event.description.slice(0, MAX_DESCRIPTION),
  });
  if (event.location) params.set("location", event.location);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
