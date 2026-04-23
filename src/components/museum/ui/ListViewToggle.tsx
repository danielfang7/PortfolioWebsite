type Props = {
  onSwitch: () => void;
};

/**
 * Top-right button — opens the list fallback view. Tab-focusable so it's the
 * first keyboard stop on the page for users who can't navigate the canvas.
 */
export function ListViewToggle({ onSwitch }: Props) {
  return (
    <button
      type="button"
      onClick={onSwitch}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        padding: "0.4rem 0.75rem",
        borderRadius: "9999px",
        background: "rgba(10, 10, 10, 0.85)",
        border: "1px solid rgba(46, 46, 46, 1)",
        color: "#f0f0f0",
        fontSize: "0.78rem",
        fontFamily:
          '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
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
        e.currentTarget.style.borderColor = "rgba(46, 46, 46, 1)";
        e.currentTarget.style.color = "#f0f0f0";
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "#00d8ff";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "rgba(46, 46, 46, 1)";
      }}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M2 4h12M2 8h12M2 12h12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      List view
    </button>
  );
}

export default ListViewToggle;
