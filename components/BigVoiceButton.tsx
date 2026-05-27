"use client";

export function BigVoiceButton({
  onClick,
  recording,
  label,
  ariaLabel,
  className = "",
}: {
  onClick: () => void;
  recording?: boolean;
  label?: string;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div className={"big-voice-wrap " + className}>
      <button
        type="button"
        className={"big-voice" + (recording ? " recording" : "")}
        onClick={onClick}
        aria-label={ariaLabel}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          focusable="false"
        >
          <rect x="9" y="3" width="6" height="12" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </svg>
      </button>
      {label ? <div className="big-voice-label">{label}</div> : null}
    </div>
  );
}
