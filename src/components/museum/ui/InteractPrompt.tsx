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
  // gap so the pill doesn't touch the sprite. The world is a row of
  // viewport-sized rooms, so subtract the exhibit's room offset to map its
  // world-x back into the visible viewport (the camera frames that room
  // whenever this prompt is shown).
  const GAP_PX = 6;
  const worldX = target ? (target.tileX + target.width / 2) * tileSize : 0;
  const roomOffsetX = Math.floor(worldX / canvasW) * canvasW;
  const anchorX = worldX - roomOffsetX;

  // Paintings hang on the top wall, where there is no room overhead for the
  // pill — it would spill out of the canvas and over the page header. When the
  // headroom isn't there, hang the prompt under the exhibit instead. Roughly
  // the pill's own height in canvas units; the canvas is upscaled by CSS.
  const CLEARANCE_PX = 26;
  const above = target ? target.tileY * tileSize - GAP_PX : 0;
  const flipBelow = Boolean(target) && above < CLEARANCE_PX;
  const anchorY = !target
    ? 0
    : flipBelow
      ? (target.tileY + target.height) * tileSize + GAP_PX
      : above;

  return (
    <div
      aria-live="polite"
      style={{
        position: "absolute",
        left: `${(anchorX / canvasW) * 100}%`,
        top: `${(anchorY / canvasH) * 100}%`,
        // Pin the pill's bottom-centre to the anchor, or its top-centre when
        // it had to flip below the exhibit.
        transform: flipBelow ? "translate(-50%, 0)" : "translate(-50%, -100%)",
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
