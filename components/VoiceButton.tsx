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

  const useAltSurface = isSpeaking || isThinking;
  const iconColor = useAltSurface
    ? isSpeaking
      ? "var(--color-speaking)"
      : "var(--color-thinking)"
    : "currentColor";

  return (
    <button
      type="button"
      onClick={onTap}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={isListening}
      className={
        "voice-btn h-28 w-28 shrink-0 " +
        (isListening ? "is-recording " : "") +
        (useAltSurface ? "voice-btn--alt " : "")
      }
    >
      {isThinking ? (
        <span
          aria-hidden
          className="voice-thinking-ring pointer-events-none absolute inset-[-6px] rounded-full"
          style={{
            background: `conic-gradient(from 0deg, transparent 0deg, transparent 240deg, var(--color-thinking) 360deg)`,
            WebkitMask:
              "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
            mask:
              "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
          }}
        />
      ) : null}

      {isSpeaking ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2"
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="voice-wave-bar"
              style={{
                height: 44,
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
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="transition-colors duration-200 ease-soft"
    >
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
      <path d="M9 21h6" />
    </svg>
  );
}
