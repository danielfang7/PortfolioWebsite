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
import { drawPlaques } from "./engine/plaque";
import { drawDoorways, drawDoorwaySigns } from "./engine/doorway";
import {
  drawAmbientFloor,
  drawFloorDecor,
  drawPaintingSpotlights,
  drawPlayerGlow,
  drawDust,
  drawVignette,
} from "./engine/lighting";
import { createTouchControls, drawJoystick } from "./engine/touch";
import { createNpcs, drawNpcBubble, updateNpc } from "./engine/npc";
import { DustField } from "./engine/particles";
import { createAudio, type MuseumAudio } from "./engine/audio";
import { createCRT } from "./engine/postprocess";
import {
  createCamera,
  setCameraTarget,
  updateCamera,
} from "./engine/camera";
import { buildWorldInteractables, type WorkRef } from "./data";
import {
  createWorldScene,
  roomIndexForX,
  roomOriginPx,
  ROOMS,
  VIEW_COLS,
  VIEW_ROWS,
  WORLD_SPAWN,
} from "./scenes/world";
import WingBanner from "./ui/WingBanner";
import LivePainting from "./paintings/LivePainting";
import type { Experiment } from "@/data/experiments";

export const CANVAS_W = VIEW_COLS * TILE_SIZE; // 14 * 32 = 448
export const CANVAS_H = VIEW_ROWS * TILE_SIZE; // 10 * 32 = 320
export { TILE_SIZE };

/** Per-room light rects, derived once from the world definition. */
const ROOM_LIGHTS = ROOMS.map((r) => ({
  x: r.originX,
  y: 0,
  cols: r.cols,
  rows: r.rows,
  floorTint: r.floorTint,
  ambient: r.ambient,
}));

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
  /** Silences all procedural audio when true. */
  muted?: boolean;
};

export function MuseumCanvas({
  experiments,
  works,
  onFocusChange,
  onInteract,
  paused = false,
  muted = true,
}: MuseumCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<MuseumAudio | null>(null);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const [livePainting, setLivePainting] = useState<Interactable | null>(null);
  const [roomIndex, setRoomIndex] = useState(() =>
    roomIndexForX(WORLD_SPAWN.tileX * TILE_SIZE),
  );
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

  // Mute toggling lives in a separate effect so flipping it never rebuilds the
  // scene (the heavy effect below only depends on the exhibit data).
  useEffect(() => {
    audioRef.current?.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const atlas = createTileAtlas();
    const crt = createCRT(canvas.width, canvas.height);
    const audio = createAudio(mutedRef.current);
    audioRef.current = audio;
    const charSprite = createCharacterSprite();
    const interactables = buildWorldInteractables(experiments, works);
    const paintings = interactables.filter((i) => i.kind === "painting");
    const computers = interactables.filter((i) => i.kind === "computer");
    const tilemap = createWorldScene(interactables);
    const npcs = createNpcs(tilemap, interactables);
    const character = createCharacter(WORLD_SPAWN.tileX, WORLD_SPAWN.tileY);
    const camera = createCamera(roomOriginPx(roomIndexForX(character.x)), 0);
    const input = createInput(canvas);
    const touch = createTouchControls(canvas, input);
    const dust = new DustField();

    // Audio can't start until the visitor interacts (browser autoplay policy).
    // The first key or pointer brings the context to life and kicks off the hum.
    const wakeAudio = () => audio.resume();
    window.addEventListener("keydown", wakeAudio, { once: true });
    canvas.addEventListener("pointerdown", wakeAudio, { once: true });

    let focused: Interactable | null = null;
    let prevLiveSlug: string | null = null;
    let prevFocusKey: string | null = null;
    let prevWalkHalf = 0;
    let prevRoom = roomIndexForX(character.x);
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
        for (const n of npcs) updateNpc(n, tilemap, dt, character);
        // Footstep dust grounds the player and every walking visitor alike.
        dust.track(character);
        for (const n of npcs) dust.track(n);
        dust.step(dt);
        if (!movedOnce && character.moving) {
          movedOnce = true;
          setHasMoved(true);
        }

        // Room-snap camera: when the player crosses a doorway, retarget the
        // camera to the new room's origin and let updateCamera glide it there.
        const room = roomIndexForX(character.x);
        if (room !== prevRoom) {
          prevRoom = room;
          setCameraTarget(camera, roomOriginPx(room), 0);
          setRoomIndex(room);
        }
        updateCamera(camera, dt);

        // Footstep audio on each stride boundary, matched to the dust puffs.
        const walkHalf = Math.floor(character.walkPhase * 2);
        if (character.moving && walkHalf !== prevWalkHalf) {
          audio.footstep();
        }
        prevWalkHalf = walkHalf;

        focused = focusedInteractable(character, interactables, TILE_SIZE);

        // Notify parent when the focused hotspot changes — drives InteractPrompt.
        const focusKey = focused ? `${focused.kind}:${focused.slug}` : null;
        if (focusKey !== prevFocusKey) {
          prevFocusKey = focusKey;
          if (focused) audio.focus();
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
            audio.interact();
            onInteractRef.current?.(focused);
          }
        }
      },
      render: (time) => {
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = "#050506";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Everything in the room is drawn in world space under the camera
        // transform; screen-space atmosphere is drawn after the restore.
        ctx.save();
        ctx.translate(-Math.round(camera.x), -Math.round(camera.y));

        // Floor + light pools (under sprites so light reads as cast on the floor).
        drawTilemap(ctx, tilemap, atlas);
        drawFloorDecor(ctx, ROOM_LIGHTS);
        drawAmbientFloor(ctx, ROOM_LIGHTS);
        drawPaintingSpotlights(ctx, paintings);
        drawPlayerGlow(ctx, character);

        // Doorways: arch, light spill, and the wayfinding signs between wings.
        drawDoorways(ctx, time);

        // Paintings live on the walls — always behind the actors in the room.
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

        // Engraved nameplates sit with the exhibits, under the moving actors.
        drawPlaques(ctx, interactables);

        // Depth sort the desks and the player by their floor baseline so the
        // character walks *behind* a desk when standing north of it, and in
        // front when below — cheap 2.5D occlusion.
        const actors: Array<{ baseline: number; draw: () => void }> = [
          ...computers.map((c, i) => ({
            baseline: (c.tileY + c.height) * TILE_SIZE,
            draw: () =>
              drawComputerSprite(
                ctx,
                c.tileX,
                c.tileY,
                c.width,
                c.height,
                time,
                i * 1.7,
              ),
          })),
          {
            baseline: character.y + 9,
            draw: () => drawCharacter(ctx, charSprite, character, time),
          },
          // Visitors and the curator share the same floor-baseline sort so they
          // occlude (and are occluded by) the desks and player correctly.
          ...npcs.map((n) => ({
            baseline: n.y + 9,
            draw: () => drawCharacter(ctx, n.sheet, n, time),
          })),
        ];
        actors.sort((a, b) => a.baseline - b.baseline);
        dust.draw(ctx);
        for (const a of actors) a.draw();

        // Curator greetings float above the actors, still in world space.
        for (const n of npcs) drawNpcBubble(ctx, n);

        // Doorway signs hang at the doorway plane, above the desks/player.
        drawDoorwaySigns(ctx);

        if (focused) drawFocusGlow(ctx, focused, time);
        ctx.restore();

        // Overlay atmosphere on top of everything in the scene (screen space).
        drawDust(ctx, canvas.width, canvas.height, time);
        drawVignette(ctx, canvas.width, canvas.height);
        // CRT scanlines + rolling band as the final screen-space pass.
        crt.draw(ctx, time);
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
      window.removeEventListener("keydown", wakeAudio);
      canvas.removeEventListener("pointerdown", wakeAudio);
      audio.destroy();
      audioRef.current = null;
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
      <WingBanner key={roomIndex} name={ROOMS[roomIndex].name} />
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
