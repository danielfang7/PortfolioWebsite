type Props = {
  muted: boolean;
  onToggle: () => void;
};

/**
 * Top-bar speaker toggle for the museum's ambient audio. Sound starts muted so
 * nothing plays unexpectedly on load; this opts the visitor in. Mirrors the
 * pill styling of ListViewToggle for a consistent control row.
 */
export function SoundToggle({ muted, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={!muted}
      aria-label={muted ? "Turn museum sound on" : "Turn museum sound off"}
      title={muted ? "Sound off" : "Sound on"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        padding: "0.4rem 0.75rem",
        borderRadius: "9999px",
        background: "rgba(10, 10, 10, 0.85)",
        border: `1px solid ${muted ? "rgba(46, 46, 46, 1)" : "#00d8ff"}`,
        color: muted ? "#f0f0f0" : "#00d8ff",
        fontSize: "0.78rem",
        fontFamily: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
        letterSpacing: "0.02em",
        cursor: "pointer",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        transition: "border-color 160ms, color 160ms",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#00d8ff";
        e.currentTarget.style.color = "#00d8ff";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = muted
          ? "rgba(46, 46, 46, 1)"
          : "#00d8ff";
        e.currentTarget.style.color = muted ? "#f0f0f0" : "#00d8ff";
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M8 2.5L4.5 5.5H2v5h2.5L8 13.5z"
          fill="currentColor"
        />
        {muted ? (
          <path
            d="M11 6l3 3M14 6l-3 3"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M11 5.5a3.5 3.5 0 010 5M12.5 3.8a6 6 0 010 8.4"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        )}
      </svg>
      Sound
    </button>
  );
}

export default SoundToggle;
