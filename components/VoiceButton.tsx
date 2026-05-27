"use client";

export type VoiceState = "idle" | "listening" | "thinking" | "speaking";

export function VoiceButton({
  state,
  onTap,
  disabled,
  ariaLabel,
}: {
  state: VoiceState;
  onTap: () => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  const isListening = state === "listening";
  const isThinking = state === "thinking";
  const isSpeaking = state === "speaking";

  const iconColor =
    isListening
      ? "var(--color-listening)"
      : isSpeaking
      ? "var(--color-speaking)"
      : isThinking
      ? "var(--color-thinking)"
      : "var(--color-ink)";

  return (
    <button
      type="button"
      onClick={onTap}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={isListening}
      className={
        "relative inline-flex h-[112px] w-[112px] items-center justify-center rounded-full bg-paper-3 " +
        "ring-1 ring-rule transition-colors disabled:opacity-50 disabled:cursor-not-allowed " +
        "hover:ring-accent focus-visible:ring-accent " +
        (isListening ? "landed-listening" : "")
      }
      style={{ transitionDuration: "var(--dur-med)" }}
    >
      {/* Thinking: rotating accent ring */}
      {isThinking ? (
        <span
          aria-hidden
          className="landed-thinking-ring pointer-events-none absolute inset-[-6px] rounded-full"
          style={{
            background: `conic-gradient(from 0deg, transparent 0deg, transparent 240deg, var(--color-thinking) 360deg)`,
            WebkitMask:
              "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
            mask:
              "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
          }}
        />
      ) : null}

      {/* Speaking: equalizer bars beside the mic */}
      {isSpeaking ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center gap-1.5"
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="landed-bar inline-block w-1.5 rounded-full"
              style={{
                height: 36,
                backgroundColor: "var(--color-speaking)",
              }}
            />
          ))}
        </span>
      ) : (
        <MicIcon color={iconColor} />
      )}
    </button>
  );
}

function MicIcon({ color }: { color: string }) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ transition: "stroke var(--dur-med) var(--ease-out-soft)" }}
    >
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
      <path d="M9 21h6" />
    </svg>
  );
}
