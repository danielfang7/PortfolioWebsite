import { useEffect, useRef, useState } from "react";
import { createLoop } from "./engine/loop";
import { createInput } from "./engine/input";
import { createTileAtlas, TILE_SIZE } from "./engine/tileAtlas";
import { drawTilemap } from "./engine/tilemap";
import { createCharacter, updateCharacter } from "./engine/character";
import {
  createCharacterSprite,
  drawCharacter,
  drawPlayerMarker,
  drawPlayerRing,
} from "./engine/characterSprite";
import {
  focusedInteractable,
  interactableAtTile,
  type Interactable,
} from "./engine/interactables";
import {
  cancelNavigation,
  createNavigator,
  drawNavMarker,
  exhibitViewpoint,
  navigateToExhibit,
  navigateToTile,
  steerNavigator,
} from "./engine/navigation";
import { createPointerControls } from "./engine/pointer";
import { drawComputerSprite } from "./engine/computerSprite";
import { drawInvestmentSprite } from "./engine/investmentSprite";
import { drawPlaques } from "./engine/plaque";
import { drawDoorways, drawDoorwaySigns } from "./engine/doorway";
import { createAutopilot } from "./engine/autopilot";
import {
  drawAmbientFloor,
  drawFloorDecor,
  drawFloorSpotlights,
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
import { buildWorldInteractables, type WorkRef, type InvestmentRef } from "./data";
import {
  buildDoorways,
  createWorldScene,
  roomIndexForX,
  roomOriginPx,
  spawnTile,
  VIEW_COLS,
  VIEW_ROWS,
  type RoomDef,
} from "./scenes/world";
import WingBanner from "./ui/WingBanner";

export const CANVAS_W = VIEW_COLS * TILE_SIZE; // 14 * 32 = 448
export const CANVAS_H = VIEW_ROWS * TILE_SIZE; // 10 * 32 = 320
export { TILE_SIZE };

export type MuseumCanvasProps = {
  works: WorkRef[];
  investments: InvestmentRef[];
  /** The planned floor plan. Owned by the host so the wayfinder can share it. */
  rooms: RoomDef[];
  /** Fired when the player crosses into a different room. */
  onRoomChange?: (index: number) => void;
  /**
   * Slug of an exhibit to start in front of, from a shared `?exhibit=` link.
   * Unknown or unreachable slugs fall back to the usual spawn.
   */
  initialExhibit?: string | null;
  onFocusChange?: (focused: Interactable | null) => void;
  /** Fired when the player activates the focused exhibit (E / tap). */
  onInteract?: (focused: Interactable) => void;
  /** When true, the scene freezes — used while the summary overlay is open. */
  paused?: boolean;
  /** Silences all procedural audio when true. */
  muted?: boolean;
  /** Attract mode: the character auto-tours the wings until the visitor acts. */
  attract?: boolean;
  /** Fired once, when the visitor takes control during attract mode. */
  onUserControl?: () => void;
};

export function MuseumCanvas({
  works,
  investments,
  rooms,
  onRoomChange,
  initialExhibit = null,
  onFocusChange,
  onInteract,
  paused = false,
  muted = true,
  attract = false,
  onUserControl,
}: MuseumCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<MuseumAudio | null>(null);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const [roomIndex, setRoomIndex] = useState(() =>
    roomIndexForX(rooms, spawnTile(rooms).tileX * TILE_SIZE),
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
  const onUserControlRef = useRef(onUserControl);
  onUserControlRef.current = onUserControl;
  const onRoomChangeRef = useRef(onRoomChange);
  onRoomChangeRef.current = onRoomChange;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  // Honours the OS "reduce motion" setting: ambient animation (strolling NPCs,
  // drifting dust, the CRT roll, breathing glows) is frozen while the
  // user-driven walk still plays. Read into a ref + live listener so toggling
  // the setting takes effect without rebuilding the scene.
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mq.matches;
    const onChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

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
    const interactables = buildWorldInteractables(rooms, works, investments);
    const computers = interactables.filter((i) => i.kind === "computer");
    const pedestals = interactables.filter((i) => i.kind === "investment");
    const tilemap = createWorldScene(rooms, interactables);
    const doorways = buildDoorways(rooms);
    const npcs = createNpcs(tilemap, interactables, rooms);

    // A shared `?exhibit=` link drops the visitor straight in front of the
    // piece it names, already facing it, so the exhibit is focused (glow and
    // interact prompt included) the moment the scene appears. Anything we can't
    // place — unknown slug, exhibit walled in — quietly uses the usual spawn.
    const target = initialExhibit
      ? interactables.find((it) => it.slug === initialExhibit)
      : undefined;
    const viewpoint = target ? exhibitViewpoint(target, tilemap) : null;
    const spawn = viewpoint ?? spawnTile(rooms);
    const character = createCharacter(spawn.tileX, spawn.tileY);
    if (viewpoint) character.facing = viewpoint.facing;

    const startRoom = roomIndexForX(rooms, character.x);
    // The room states were seeded from the default spawn; a deep link may have
    // landed us in a different wing entirely.
    setRoomIndex(startRoom);
    onRoomChangeRef.current?.(startRoom);
    const camera = createCamera(roomOriginPx(rooms, startRoom), 0);
    // Per-room light rects, derived from the plan for this world.
    const roomLights = rooms.map((r) => ({
      x: r.originX,
      y: 0,
      cols: r.cols,
      rows: r.rows,
      floorTint: r.floorTint,
      ambient: r.ambient,
    }));
    const input = createInput(canvas);
    const touch = createTouchControls(canvas, input);
    const dust = new DustField();
    // Click-to-walk: the mouse equivalent of WASD. Clicks are resolved against
    // the camera here because only this scope knows where the camera is.
    const nav = createNavigator();
    const pointer = createPointerControls(canvas, (cx, cy) => {
      const worldX = cx + camera.x;
      const worldY = cy + camera.y;
      const tx = Math.floor(worldX / TILE_SIZE);
      const ty = Math.floor(worldY / TILE_SIZE);
      const hit = interactableAtTile(interactables, tx, ty);
      if (hit) {
        // Walking to the exhibit and opening it on arrival (rather than opening
        // it from across the room) keeps the click and the keyboard route to
        // the same exhibit telling the same story.
        if (navigateToExhibit(nav, tilemap, character, hit) && !nav.active) {
          // Already in position — open immediately.
          audio.interact();
          onInteractRef.current?.(hit);
        }
        return;
      }
      navigateToTile(nav, tilemap, character, tx, ty);
    });
    // Attract mode: the character strolls a guided tour of the wings until the
    // visitor takes over (first pointer press, or a movement key once engaged).
    const autopilot = attract ? createAutopilot(rooms) : null;

    // Audio can't start until the visitor interacts (browser autoplay policy).
    // The first key or pointer brings the context to life and kicks off the hum.
    const wakeAudio = () => audio.resume();
    window.addEventListener("keydown", wakeAudio, { once: true });
    canvas.addEventListener("pointerdown", wakeAudio, { once: true });

    // Attract-mode handover: the first deliberate interaction (a press on the
    // canvas, or a movement key while the canvas is engaged) stops the tour and
    // gives the visitor the controls.
    const MOVE_KEYS = new Set([
      "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
      "w", "a", "s", "d", "W", "A", "S", "D",
    ]);
    const takeOver = () => {
      if (!autopilot || !autopilot.active) return;
      autopilot.stop(input.state);
      onUserControlRef.current?.();
    };
    const onTakeoverKey = (e: KeyboardEvent) => {
      if (MOVE_KEYS.has(e.key) && input.isActive()) takeOver();
    };
    if (autopilot) {
      canvas.addEventListener("pointerdown", takeOver);
      window.addEventListener("keydown", onTakeoverKey);
    }

    let focused: Interactable | null = null;
    let prevFocusKey: string | null = null;
    let prevWalkHalf = 0;
    let prevRoom = roomIndexForX(rooms, character.x);
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
        const reduced = reducedMotionRef.current;
        // Drive the guided tour before reading input. Under reduced-motion the
        // tour holds still (no scripted movement); the visitor can still take
        // control and walk. Once they do, autopilot goes dormant.
        if (autopilot?.active && !reduced) {
          autopilot.steer(character, input.state, dt);
        }
        // Reaching for the keyboard cancels a click-walk in progress, so the
        // visitor never has to fight the character for control.
        const s = input.state;
        if (nav.active && (s.up || s.down || s.left || s.right)) {
          cancelNavigation(nav, input.state);
        }
        steerNavigator(nav, character, input.state, dt, (it) => {
          // Arriving at a clicked exhibit opens it through the same path the
          // keyboard takes, so the focus sound and modal behave identically.
          audio.interact();
          onInteractRef.current?.(it);
        });
        updateCharacter(character, input.state, tilemap, dt);
        // Under reduced-motion the visitors hold position and no dust drifts;
        // only the player (user-driven) keeps moving.
        if (!reduced) {
          for (const n of npcs) updateNpc(n, tilemap, dt, character);
          // Footstep dust grounds the player and every walking visitor alike.
          dust.track(character);
          for (const n of npcs) dust.track(n);
          dust.step(dt);
        }
        if (!movedOnce && character.moving) {
          movedOnce = true;
          setHasMoved(true);
        }

        // Room-snap camera: when the player crosses a doorway, retarget the
        // camera to the new room's origin and let updateCamera glide it there.
        const room = roomIndexForX(rooms, character.x);
        if (room !== prevRoom) {
          prevRoom = room;
          setCameraTarget(camera, roomOriginPx(rooms, room), 0);
          setRoomIndex(room);
          onRoomChangeRef.current?.(room);
        }
        updateCamera(camera, dt);

        // Footstep audio on each stride boundary, matched to the dust puffs.
        const walkHalf = Math.floor(character.walkPhase * 2);
        if (character.moving && walkHalf !== prevWalkHalf) {
          audio.footstep();
        }
        prevWalkHalf = walkHalf;

        // Hovering an exhibit shows the hand cursor — the affordance that tells
        // mouse visitors the scene is clickable at all.
        if (pointer.hover) {
          const hx = Math.floor((pointer.hover.x + camera.x) / TILE_SIZE);
          const hy = Math.floor((pointer.hover.y + camera.y) / TILE_SIZE);
          const over = interactableAtTile(interactables, hx, hy);
          canvas.style.cursor = over ? "pointer" : "default";
        }

        focused = focusedInteractable(character, interactables, TILE_SIZE);

        // Notify parent when the focused hotspot changes — drives InteractPrompt.
        const focusKey = focused ? `${focused.kind}:${focused.slug}` : null;
        if (focusKey !== prevFocusKey) {
          prevFocusKey = focusKey;
          if (focused) audio.focus();
          onFocusChangeRef.current?.(focused);
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
        const reduced = reducedMotionRef.current;
        // Frozen clock fed to the ambient sprite animation (idle bob, screen
        // flicker) so they hold still under reduced-motion; the walk cycle is
        // driven by walkPhase and keeps animating regardless.
        const animTime = reduced ? 0 : time;
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = "#050506";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Everything in the room is drawn in world space under the camera
        // transform; screen-space atmosphere is drawn after the restore.
        ctx.save();
        ctx.translate(-Math.round(camera.x), -Math.round(camera.y));

        // Only the framed room and a tile of bleed are worth drawing. The world
        // grows a room whenever a wing overflows, so every per-frame pass is
        // clipped to what the camera can see rather than to the whole museum.
        const view = {
          x: camera.x,
          y: camera.y,
          w: canvas.width,
          h: canvas.height,
        };
        const viewLeft = camera.x - TILE_SIZE;
        const viewRight = camera.x + canvas.width + TILE_SIZE;
        const onScreen = (it: Interactable) =>
          (it.tileX + it.width) * TILE_SIZE >= viewLeft &&
          it.tileX * TILE_SIZE <= viewRight;
        const shownPedestals = pedestals.filter(onScreen);
        const shownComputers = computers.filter(onScreen);

        // Floor + light pools (under sprites so light reads as cast on the floor).
        drawTilemap(ctx, tilemap, atlas, view);
        drawFloorDecor(ctx, roomLights);
        drawAmbientFloor(ctx, roomLights);
        drawFloorSpotlights(ctx, shownPedestals);
        drawFloorSpotlights(ctx, shownComputers, "#00d8ff");
        drawPlayerGlow(ctx, character);
        // A pulsing selection ring on the floor marks "you" — drawn on the
        // floor so it reads as cast under the player, beneath every sprite.
        drawPlayerRing(ctx, character, animTime);
        // Click destination, on the floor with the other cast-light markers.
        drawNavMarker(ctx, nav, time, reduced);

        // Doorways: arch, light spill, and the wayfinding signs between wings.
        drawDoorways(ctx, doorways, time, reduced);

        // Engraved nameplates sit with the exhibits, under the moving actors.
        drawPlaques(ctx, interactables.filter(onScreen));

        // Depth sort the desks and the player by their floor baseline so the
        // character walks *behind* a desk when standing north of it, and in
        // front when below — cheap 2.5D occlusion.
        const actors: Array<{ baseline: number; draw: () => void }> = [
          ...computers.flatMap((c, i) => !onScreen(c) ? [] : [{
            baseline: (c.tileY + c.height) * TILE_SIZE,
            draw: () =>
              drawComputerSprite(
                ctx,
                c.tileX,
                c.tileY,
                c.width,
                c.height,
                animTime,
                i * 1.7,
                c.color ?? "#00d8ff",
                c.title.charAt(0),
              ),
          }]),
          ...pedestals.flatMap((p, i) => !onScreen(p) ? [] : [{
            baseline: (p.tileY + p.height) * TILE_SIZE,
            draw: () =>
              drawInvestmentSprite(
                ctx,
                p.tileX,
                p.tileY,
                p.width,
                p.height,
                p.color ?? "#a78bfa",
                p.title.charAt(0),
                animTime,
                i * 2.1,
              ),
          }]),
          {
            baseline: character.y + 9,
            draw: () => drawCharacter(ctx, charSprite, character, animTime),
          },
          // Visitors and the curator share the same floor-baseline sort so they
          // occlude (and are occluded by) the desks and player correctly.
          ...npcs.map((n) => ({
            baseline: n.y + 9,
            draw: () => drawCharacter(ctx, n.sheet, n, animTime),
          })),
        ];
        actors.sort((a, b) => a.baseline - b.baseline);
        if (!reduced) dust.draw(ctx);
        for (const a of actors) a.draw();

        // "You are here" beacon: a bobbing chevron over the player's head,
        // drawn after the actors so no desk or NPC can hide it.
        drawPlayerMarker(ctx, character, animTime);

        // Curator greetings float above the actors, still in world space.
        for (const n of npcs) drawNpcBubble(ctx, n);

        // Doorway signs hang at the doorway plane, above the desks/player.
        drawDoorwaySigns(ctx, doorways);

        if (focused) drawFocusGlow(ctx, focused, time, reduced);
        ctx.restore();

        // Overlay atmosphere on top of everything in the scene (screen space).
        // The drifting motes are ambient motion, so they're skipped when reduced.
        if (!reduced) drawDust(ctx, canvas.width, canvas.height, time);
        drawVignette(ctx, canvas.width, canvas.height);
        // CRT scanlines + rolling band as the final screen-space pass.
        crt.draw(ctx, time, reduced);
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
      pointer.destroy();
      window.removeEventListener("keydown", wakeAudio);
      canvas.removeEventListener("pointerdown", wakeAudio);
      if (autopilot) {
        canvas.removeEventListener("pointerdown", takeOver);
        window.removeEventListener("keydown", onTakeoverKey);
      }
      audio.destroy();
      audioRef.current = null;
      onFocusChangeRef.current?.(null);
    };
  }, [rooms, works, investments, attract, initialExhibit]);

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
      <WingBanner key={roomIndex} name={rooms[roomIndex]?.name ?? ""} />
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
          : "Click to walk · WASD / arrows · E to interact"}
      </div>
    </>
  );
}

function drawFocusGlow(
  ctx: CanvasRenderingContext2D,
  it: Interactable,
  timeSec: number,
  reduced = false,
): void {
  // Steady highlight under reduced-motion instead of the pulsing beacon.
  const pulse = reduced ? 0.7 : 0.55 + 0.35 * Math.sin(timeSec * 4);
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
