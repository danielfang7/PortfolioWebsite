import { useRef } from "react";
import type { Interactable } from "../engine/interactables";

type Props = {
  focused: Interactable | null;
  tileSize: number;
  canvasW: number;
  canvasH: number;
};

/**
 * Floating interact HUD anchored just above the focused exhibit. Anchoring to
 * the interactable (not the player) keeps the prompt in the same spot every
 * time the player walks up to the same exhibit, regardless of approach angle.
 */
export function InteractPrompt({
  focused,
  tileSize,
  canvasW,
  canvasH,
}: Props) {
  // Keep the last focused target around during fade-out so position doesn't
  // snap to (0,0) when focused goes null.
  const lastRef = useRef<Interactable | null>(null);
  if (focused) lastRef.current = focused;
  const target = focused ?? lastRef.current;

  // Anchor above the top-center of the interactable's footprint, with a small
  // gap so the pill doesn't touch the sprite.
  const GAP_PX = 6;
  const anchorX = target
    ? (target.tileX + target.width / 2) * tileSize
    : 0;
  const anchorY = target ? target.tileY * tileSize - GAP_PX : 0;

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
      {target && (
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
            {target.kind === "painting" ? "view" : "open"} {target.title}
          </span>
        </div>
      )}
    </div>
  );
}

export default InteractPrompt;
