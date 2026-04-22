import { Suspense } from "react";
import { LIVE_PAINTINGS } from "./paintingRegistry";
import { paintingInnerRect } from "../engine/paintingSprite";
import type { Interactable } from "../engine/interactables";

type Props = {
  painting: Interactable;
  /** Canvas native width in base pixels — used to compute overlay percentages. */
  canvasW: number;
  canvasH: number;
};

/**
 * DOM overlay positioned exactly over a painting's inner canvas area. Mounts
 * the live experiment component lazily. Positioned in percentages of the
 * parent container (which matches the canvas CSS box), so it tracks the canvas
 * at any responsive size.
 */
export function LivePainting({ painting, canvasW, canvasH }: Props) {
  const Component = LIVE_PAINTINGS[painting.slug];
  const rect = paintingInnerRect(
    painting.tileX,
    painting.tileY,
    painting.width,
    painting.height,
  );

  const style: React.CSSProperties = {
    position: "absolute",
    left: `${(rect.x / canvasW) * 100}%`,
    top: `${(rect.y / canvasH) * 100}%`,
    width: `${(rect.w / canvasW) * 100}%`,
    height: `${(rect.h / canvasH) * 100}%`,
    overflow: "hidden",
    pointerEvents: "none",
    background: painting.color
      ? `radial-gradient(circle at 50% 50%, ${painting.color}22, transparent 70%)`
      : undefined,
  };

  if (!Component) {
    // No live component — just show the tinted static fill (frame tint already
    // painted on the canvas; this layer is a no-op).
    return <div style={style} aria-hidden="true" />;
  }

  return (
    <div style={style} aria-hidden="true">
      <Suspense fallback={null}>
        <Component />
      </Suspense>
    </div>
  );
}

export default LivePainting;
