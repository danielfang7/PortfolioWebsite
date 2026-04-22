import type { Interactable } from "../engine/interactables";

type Props = {
  focused: Interactable | null;
  /** Character position in base-canvas pixels. Ignored when `focused` is null. */
  charX: number;
  charY: number;
  canvasW: number;
  canvasH: number;
};

/**
 * Floating interact HUD anchored just above the character's head. Pokemon/
 * Stardew-style floating prompt — follows where the player is rather than
 * sitting at a fixed corner of the screen.
 */
export function InteractPrompt({
  focused,
  charX,
  charY,
  canvasW,
  canvasH,
}: Props) {
  // Anchor point: roughly the top of the character sprite. The sprite is 24px
  // tall drawn feet-aligned to charY+4, so sprite top ~ charY - 20. Back off a
  // few more px so the pill doesn't overlap hair.
  const anchorX = charX;
  const anchorY = charY - 26;

  return (
    <div
      aria-live="polite"
      style={{
        position: "absolute",
        left: `${(anchorX / canvasW) * 100}%`,
        top: `${(anchorY / canvasH) * 100}%`,
        // translate pill so its bottom-center sits at the anchor point.
        transform: "translate(-50%, -100%)",
        pointerEvents: "none",
        opacity: focused ? 1 : 0,
        transition: "opacity 160ms ease-out",
        whiteSpace: "nowrap",
      }}
    >
      {focused && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.3rem 0.6rem",
            borderRadius: "9999px",
            background: "rgba(10, 10, 10, 0.88)",
            border: "1px solid rgba(0, 216, 255, 0.5)",
            color: "#f0f0f0",
            fontSize: "0.72rem",
            fontFamily:
              '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
            letterSpacing: "0.02em",
            boxShadow: "0 2px 10px rgba(0, 216, 255, 0.25)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
        >
          <kbd
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "1.1rem",
              height: "1.1rem",
              padding: "0 0.3rem",
              borderRadius: "0.2rem",
              background: "#00d8ff",
              color: "#050506",
              fontSize: "0.66rem",
              fontWeight: 700,
              fontFamily: "inherit",
            }}
          >
            E
          </kbd>
          <span>
            {focused.kind === "painting" ? "view" : "open"} {focused.title}
          </span>
        </div>
      )}
    </div>
  );
}

export default InteractPrompt;
