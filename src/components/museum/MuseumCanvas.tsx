import { useEffect, useRef, useState } from "react";
import { createLoop } from "./engine/loop";
import { createInput } from "./engine/input";
import { createTileAtlas, TILE_SIZE } from "./engine/tileAtlas";
import { drawTilemap } from "./engine/tilemap";
import { createCharacter, updateCharacter } from "./engine/character";
import {
  createCharacterSprite,
  drawCharacter,
} from "./engine/characterSprite";
import {
  focusedInteractable,
  nearbyInteractable,
  type Interactable,
} from "./engine/interactables";
import { drawPaintingSprite } from "./engine/paintingSprite";
import { drawComputerSprite } from "./engine/computerSprite";
import {
  drawAmbientFloor,
  drawFloorDecor,
  drawPaintingSpotlights,
  drawPlayerGlow,
  drawDust,
  drawVignette,
} from "./engine/lighting";
import { createTouchControls, drawJoystick } from "./engine/touch";
import { DustField } from "./engine/particles";
import { buildHallInteractables, type WorkRef } from "./data";
import {
  createHallScene,
  HALL_WIDTH,
  HALL_HEIGHT,
  HALL_SPAWN,
} from "./scenes/hall";
import LivePainting from "./paintings/LivePainting";
import type { Experiment } from "@/data/experiments";

export const CANVAS_W = HALL_WIDTH * TILE_SIZE; // 14 * 32 = 448
export const CANVAS_H = HALL_HEIGHT * TILE_SIZE; // 10 * 32 = 320
export { TILE_SIZE };

/** Activation radius for live painting mount (Manhattan tiles). */
const LIVE_RADIUS = 3;

export type MuseumCanvasProps = {
  experiments: Experiment[];
  works: WorkRef[];
  onFocusChange?: (focused: Interactable | null) => void;
  /** Fired when the player activates the focused exhibit (E / tap). */
  onInteract?: (focused: Interactable) => void;
  /** When true, the scene freezes — used while the summary overlay is open. */
  paused?: boolean;
};

export function MuseumCanvas({
  experiments,
  works,
  onFocusChange,
  onInteract,
  paused = false,
}: MuseumCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [livePainting, setLivePainting] = useState<Interactable | null>(null);
  const [hasMoved, setHasMoved] = useState(false);
  const [isTouch] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches,
  );
  const onFocusChangeRef = useRef(onFocusChange);
  onFocusChangeRef.current = onFocusChange;
  const onInteractRef = useRef(onInteract);
  onInteractRef.current = onInteract;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const atlas = createTileAtlas();
    const charSprite = createCharacterSprite();
    const interactables = buildHallInteractables(experiments, works);
    const paintings = interactables.filter((i) => i.kind === "painting");
    const computers = interactables.filter((i) => i.kind === "computer");
    const tilemap = createHallScene(interactables);
    const character = createCharacter(HALL_SPAWN.tileX, HALL_SPAWN.tileY);
    const input = createInput(canvas);
    const touch = createTouchControls(canvas, input);
    const dust = new DustField();

    let focused: Interactable | null = null;
    let prevLiveSlug: string | null = null;
    let prevFocusKey: string | null = null;
    let movedOnce = false;

    const loop = createLoop({
      update: (dt) => {
        // While the summary overlay is open the scene is frozen: the character
        // holds position and a queued interact is dropped so it can't re-fire
        // when the overlay closes.
        if (pausedRef.current) {
          input.clearInteract();
          return;
        }
        updateCharacter(character, input.state, tilemap, dt);
        dust.update(character, dt);
        if (!movedOnce && character.moving) {
          movedOnce = true;
          setHasMoved(true);
        }
        focused = focusedInteractable(character, interactables, TILE_SIZE);

        // Notify parent when the focused hotspot changes — drives InteractPrompt.
        const focusKey = focused ? `${focused.kind}:${focused.slug}` : null;
        if (focusKey !== prevFocusKey) {
          prevFocusKey = focusKey;
          onFocusChangeRef.current?.(focused);
        }

        // Live-painting activation: nearest painting within LIVE_RADIUS tiles.
        const near = nearbyInteractable(
          character,
          paintings,
          TILE_SIZE,
          LIVE_RADIUS,
        );
        const nearSlug = near?.slug ?? null;
        if (nearSlug !== prevLiveSlug) {
          prevLiveSlug = nearSlug;
          setLivePainting(near);
        }

        if (input.state.interact) {
          input.clearInteract();
          if (focused) {
            // Open the in-page summary overlay instead of navigating away.
            onInteractRef.current?.(focused);
          }
        }
      },
      render: (time) => {
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = "#050506";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Floor + light pools (under sprites so light reads as cast on the floor).
        drawTilemap(ctx, tilemap, atlas);
        drawFloorDecor(ctx, canvas.width, canvas.height);
        drawAmbientFloor(ctx, canvas.width, canvas.height);
        drawPaintingSpotlights(ctx, paintings);

        // Computers drawn as sprites over their floor footprint. A per-desk
        // phase offset keeps their screen animations out of sync.
        computers.forEach((c, i) => {
          drawComputerSprite(ctx, c.tileX, c.tileY, c.width, c.height, time, i * 1.7);
        });
        // Paintings drawn as sprites over wall tiles.
        for (const p of paintings) {
          drawPaintingSprite(
            ctx,
            p.tileX,
            p.tileY,
            p.width,
            p.height,
            p.color ?? null,
          );
        }

        if (focused) drawFocusGlow(ctx, focused, time);
        drawPlayerGlow(ctx, character);
        dust.draw(ctx);
        drawCharacter(ctx, charSprite, character, time);

        // Overlay atmosphere on top of everything in the scene.
        drawDust(ctx, canvas.width, canvas.height, time);
        drawVignette(ctx, canvas.width, canvas.height);
        // Touch joystick is UI — drawn last, over everything.
        drawJoystick(ctx, touch.joystick);
      },
    });

    // Only run the loop while the canvas is on-screen — saves CPU/battery when
    // the visitor scrolls past the museum.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loop.start();
        else loop.stop();
      },
      { threshold: 0.01 },
    );
    io.observe(canvas);

    return () => {
      io.disconnect();
      loop.stop();
      input.destroy();
      touch.destroy();
      onFocusChangeRef.current?.(null);
    };
  }, [experiments, works]);

  return (
    <>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        aria-label="Interactive pixel-art museum. Use the List view button above for an accessible grid."
        role="application"
        tabIndex={0}
        className="museum-canvas focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          imageRendering: "pixelated",
          backgroundColor: "#0a0a0a",
          borderRadius: "0.75rem",
        }}
      />
      {livePainting && (
        <LivePainting
          painting={livePainting}
          canvasW={CANVAS_W}
          canvasH={CANVAS_H}
        />
      )}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          bottom: "5%",
          transform: "translateX(-50%)",
          pointerEvents: "none",
          opacity: hasMoved ? 0 : 1,
          transition: "opacity 400ms ease-out",
          padding: "0.35rem 0.75rem",
          borderRadius: "9999px",
          background: "rgba(10, 10, 10, 0.78)",
          border: "1px solid rgba(0, 216, 255, 0.35)",
          color: "#dfeff3",
          fontSize: "0.72rem",
          fontFamily:
            '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
          letterSpacing: "0.02em",
          whiteSpace: "nowrap",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      >
        {isTouch
          ? "Drag to move · tap an exhibit to open"
          : "Move with WASD / arrows · press E to interact"}
      </div>
    </>
  );
}

function drawFocusGlow(
  ctx: CanvasRenderingContext2D,
  it: Interactable,
  timeSec: number,
): void {
  const pulse = 0.55 + 0.35 * Math.sin(timeSec * 4);
  const px = it.tileX * TILE_SIZE;
  const py = it.tileY * TILE_SIZE;
  const w = it.width * TILE_SIZE;
  const h = it.height * TILE_SIZE;

  // Soft outer halo.
  const cx = px + w / 2;
  const cy = py + h / 2;
  const r = Math.max(w, h);
  const grad = ctx.createRadialGradient(cx, cy, r * 0.35, cx, cy, r * 1.1);
  grad.addColorStop(0, `rgba(0, 216, 255, ${pulse * 0.35})`);
  grad.addColorStop(1, "rgba(0, 216, 255, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(px - TILE_SIZE, py - TILE_SIZE, w + 2 * TILE_SIZE, h + 2 * TILE_SIZE);

  // Hard 2px cyan outline around the focused footprint.
  ctx.fillStyle = `rgba(0, 216, 255, ${pulse})`;
  ctx.fillRect(px, py, w, 2);
  ctx.fillRect(px, py + h - 2, w, 2);
  ctx.fillRect(px, py + 2, 2, h - 4);
  ctx.fillRect(px + w - 2, py + 2, 2, h - 4);
}

export default MuseumCanvas;
