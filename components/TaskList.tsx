"use client";

import type { StoredTask } from "@/lib/storage";

export function TaskList({
  tasks,
  onToggle,
  onClear,
  heading,
  emptyLabel,
  rtl,
  langCode,
}: {
  tasks: StoredTask[];
  onToggle: (id: string) => void;
  onClear?: () => void;
  heading: string;
  emptyLabel?: string;
  rtl?: boolean;
  langCode?: string;
}) {
  if (tasks.length === 0) {
    return emptyLabel ? (
      <p className="text-sm text-muted" dir={rtl ? "rtl" : "ltr"} lang={langCode}>
        {emptyLabel}
      </p>
    ) : null;
  }

  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  return (
    <section
      aria-label={heading}
      className="rounded-md bg-paper-2 px-4 py-3 ring-1 ring-rule/60"
      dir={rtl ? "rtl" : "ltr"}
      lang={langCode}
    >
      <header className="mb-2 flex items-baseline justify-between">
        <h2 className="font-display text-base text-ink">{heading}</h2>
        {onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-muted hover:text-ink transition-colors"
            style={{ transitionDuration: "var(--dur-fast)" }}
          >
            Clear all
          </button>
        ) : null}
      </header>

      <ul role="list" className="space-y-1.5">
        {open.map((t) => (
          <TaskRow key={t.id} task={t} onToggle={onToggle} />
        ))}
        {done.length > 0 && open.length > 0 ? (
          <li aria-hidden className="my-2 h-px bg-rule/40" />
        ) : null}
        {done.map((t) => (
          <TaskRow key={t.id} task={t} onToggle={onToggle} />
        ))}
      </ul>
    </section>
  );
}

function TaskRow({
  task,
  onToggle,
}: {
  task: StoredTask;
  onToggle: (id: string) => void;
}) {
  const priorityDot =
    task.priority === "high"
      ? "var(--color-accent-2)"
      : task.priority === "med"
      ? "var(--color-accent)"
      : "var(--color-rule)";

  return (
    <li>
      <button
        type="button"
        onClick={() => onToggle(task.id)}
        aria-pressed={task.done}
        aria-label={`${task.done ? "Mark not done" : "Mark done"}: ${task.title}`}
        className="group flex w-full items-start gap-3 rounded-sm py-1.5 text-left text-base text-ink hover:bg-paper-3/40 transition-colors"
        style={{ transitionDuration: "var(--dur-fast)" }}
      >
        <span
          aria-hidden
          className={
            "mt-1 inline-flex h-4 w-4 flex-none items-center justify-center rounded-sm ring-1 " +
            (task.done ? "ring-accent bg-accent/20" : "ring-rule")
          }
        >
          {task.done ? <CheckIcon /> : null}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={
              "block text-base " + (task.done ? "text-muted line-through" : "text-ink")
            }
          >
            {task.title}
          </span>
          {task.description ? (
            <span className="mt-0.5 block text-sm text-muted">{task.description}</span>
          ) : null}
        </span>
        <span
          aria-hidden
          className="mt-2 inline-block h-1.5 w-1.5 flex-none rounded-full"
          style={{ backgroundColor: priorityDot }}
        />
      </button>
    </li>
  );
}

function CheckIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--color-accent)"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12l4 4L19 7" />
    </svg>
  );
}
