import { TILE_SIZE } from "./tileAtlas";
import { isWalkable, type Tilemap } from "./tilemap";
import { canStand, createCharacter, type Character, type Direction } from "./character";
import {
  createCharacterSprite,
  type CharacterPalette,
} from "./characterSprite";
import type { Interactable } from "./interactables";
import { drawText, measureText, PIXEL_FONT_HEIGHT } from "./pixelFont";
import { LANE_ROW, roomIndexForX, type RoomDef } from "../scenes/world";

/**
 * Ambient museum-goers. Visitors stroll their wing, pause to admire an exhibit,
 * then move on; the curator stands watch and greets the room. They share the
 * player's collision so they read as part of the same world, but run a tiny
 * autonomous brain instead of taking input. NPCs are blind to the player and to
 * each other — overlap is fine and keeps the behaviour cheap and predictable.
 */

/** Muted visitor skins — deliberately desaturated so the player's cyan pops. */
const VISITOR_PALETTES: CharacterPalette[] = [
  {
    hair: "#3a2a1a",
    skin: "#d8b08c",
    skinShadow: "#b78f6c",
    shirt: "#5a2230",
    shirtHi: "#8a3346",
    pants: "#262024",
    shoes: "#0a0708",
    eye: "#1b1b1f",
  },
  {
    hair: "#caa84a",
    skin: "#e0bd99",
    skinShadow: "#c39c74",
    shirt: "#23402a",
    shirtHi: "#3f6b48",
    pants: "#1c2420",
    shoes: "#0a0a08",
    eye: "#1b1b1f",
  },
  {
    hair: "#1a1a22",
    skin: "#c89a78",
    skinShadow: "#a87e5e",
    shirt: "#33285a",
    shirtHi: "#5a4a8a",
    pants: "#201c2a",
    shoes: "#08080a",
    eye: "#1b1b1f",
  },
  {
    hair: "#6a6a72",
    skin: "#d4a887",
    skinShadow: "#b8906f",
    shirt: "#2a3340",
    shirtHi: "#46566a",
    pants: "#1a1d22",
    shoes: "#08090a",
    eye: "#1b1b1f",
  },
];

/** The curator: formal dark suit, grey hair, warm gold trim. */
const CURATOR_PALETTE: CharacterPalette = {
  hair: "#9aa0a8",
  skin: "#d8b594",
  skinShadow: "#bb976f",
  shirt: "#14181f",
  shirtHi: "#c8a24a",
  pants: "#0e1116",
  shoes: "#050506",
  eye: "#1b1b1f",
};

const CURATOR_ACCENT = "#c8a24a";

/** Short greetings — limited to the pixel font's glyph set (no comma/apostrophe). */
const GREETINGS = [
  "WELCOME",
  "ENJOY THE GALLERY",
  "WORKS ARE THIS WAY >",
  "PRESS E TO VIEW",
  "MADE WITH PIXELS",
];

/** Quiet one-word reactions a visitor mutters while admiring an exhibit. */
const REACTIONS = ["NICE", "WOW", "HMM", "COOL", "OOH", "ART"];

/** Visitor bubbles read quieter than the curator's gold greeting. */
const VISITOR_BUBBLE_ACCENT = "#5a6470";

/** How close (pixels) the player must be for an idle NPC to turn and watch. */
const GLANCE_RADIUS = 2.4 * TILE_SIZE;

type Mode = "wander" | "view" | "pause";

type ViewSpot = { x: number; y: number; facing: Direction };

type Bounds = { minX: number; maxX: number; minY: number; maxY: number };

export type Npc = Character & {
  sheet: HTMLCanvasElement;
  /** Stationary curators just stand, turn, and greet. */
  stationary: boolean;
  mode: Mode;
  /** Seconds left in the current view/pause dwell. */
  timer: number;
  /** Pixel-space wander destination. */
  tx: number;
  ty: number;
  /** Where to look once we arrive, if the target is an exhibit. */
  targetFacing: Direction | null;
  /** Accumulated time spent making no headway — triggers a re-path. */
  blocked: number;
  bounds: Bounds;
  viewSpots: ViewSpot[];
  /** Curator-only: idle turn cadence and the floating greeting bubble. */
  turnTimer: number;
  bubble: { text: string; t: number; life: number; accent: string } | null;
  bubbleCooldown: number;
};

/** Velocity smoothing — a touch softer than the player for an unhurried stroll. */
const RESPONSIVENESS = 18;
const STRIDE_PIXELS = 26;
const VISITOR_SPEED = 68;

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pick<T>(arr: T[]): T {
  return arr[(Math.random() * arr.length) | 0];
}

/** Interior (walkable-band) tile bounds for a room, excluding its perimeter. */
function roomBounds(r: RoomDef): Bounds {
  return {
    minX: r.originX + 1,
    maxX: r.originX + r.cols - 2,
    minY: 1,
    maxY: r.rows - 2,
  };
}

/** Pixel center of a tile. */
function tileCenter(tx: number, ty: number): { x: number; y: number } {
  return { x: tx * TILE_SIZE + TILE_SIZE / 2, y: ty * TILE_SIZE + TILE_SIZE / 2 };
}

/** The floor tile a visitor stands on to view an exhibit, and the way they face. */
function viewSpotFor(it: Interactable, map: Tilemap): ViewSpot | null {
  const cx = it.tileX + Math.floor(it.width / 2);
  const cy = it.tileY + Math.floor(it.height / 2);
  // Desks (face null) are admired from below; paintings from their facing side.
  const face: Direction = it.face ?? "up";
  let tx = cx;
  let ty = cy;
  switch (face) {
    case "up":
      ty = it.tileY + it.height;
      break;
    case "down":
      ty = it.tileY - 1;
      break;
    case "right":
      tx = it.tileX + it.width;
      break;
    case "left":
      tx = it.tileX - 1;
      break;
  }
  if (!isWalkable(map, tx, ty)) return null;
  const { x, y } = tileCenter(tx, ty);
  return { x, y, facing: face };
}

function makeNpc(
  tileX: number,
  tileY: number,
  palette: CharacterPalette,
  bounds: Bounds,
  viewSpots: ViewSpot[],
  stationary: boolean,
  facing: Direction,
): Npc {
  const base = createCharacter(tileX, tileY);
  return {
    ...base,
    facing,
    speed: VISITOR_SPEED,
    sheet: createCharacterSprite(palette),
    stationary,
    mode: "pause",
    timer: rand(0.4, 1.6),
    tx: base.x,
    ty: base.y,
    targetFacing: null,
    blocked: 0,
    bounds,
    viewSpots,
    turnTimer: rand(2.5, 5),
    bubble: null,
    bubbleCooldown: rand(1.5, 4),
  };
}

/** Visitors placed per room, and the ceiling once the museum has many rooms. */
const VISITORS_PER_ROOM = 2;
const MAX_VISITORS = 8;

/**
 * The first walkable tile at or after (tx, ty), scanning the room's interior.
 * Rooms are generated, so a spawn point that was clear in a three-room museum
 * may be under a desk in a larger one — search rather than assume.
 */
function firstOpenTile(
  map: Tilemap,
  bounds: Bounds,
  preferX: number,
  preferY: number,
  taken: Set<string>,
): { tx: number; ty: number } | null {
  const candidates: Array<{ tx: number; ty: number }> = [];
  for (let ty = bounds.minY; ty <= bounds.maxY; ty++) {
    for (let tx = bounds.minX; tx <= bounds.maxX; tx++) {
      candidates.push({ tx, ty });
    }
  }
  // Nearest to the preferred spot first, so visitors start spread through the
  // room rather than all bunched in one corner.
  candidates.sort(
    (a, b) =>
      Math.abs(a.tx - preferX) + Math.abs(a.ty - preferY) -
      (Math.abs(b.tx - preferX) + Math.abs(b.ty - preferY)),
  );
  for (const c of candidates) {
    const key = `${c.tx},${c.ty}`;
    if (taken.has(key)) continue;
    if (!isWalkable(map, c.tx, c.ty)) continue;
    return c;
  }
  return null;
}

/**
 * Populates the museum with a couple of wandering visitors per room plus a
 * curator in the first one. Sprite sheets are baked here, once.
 */
export function createNpcs(
  map: Tilemap,
  interactables: Interactable[],
  rooms: RoomDef[],
): Npc[] {
  // Group exhibit view-spots by the room they belong to.
  const spotsByRoom: ViewSpot[][] = rooms.map(() => []);
  for (const it of interactables) {
    const center = (it.tileX + it.width / 2) * TILE_SIZE;
    const room = roomIndexForX(rooms, center);
    const spot = viewSpotFor(it, map);
    if (spot) spotsByRoom[room]?.push(spot);
  }

  const npcs: Npc[] = [];
  const taken = new Set<string>();

  // Spread the visitor budget across the rooms so a large museum doesn't end
  // up with a crowd in every wing (and a frame-rate cost to match).
  const perRoom = Math.max(
    1,
    Math.min(VISITORS_PER_ROOM, Math.floor(MAX_VISITORS / Math.max(1, rooms.length))),
  );

  let placed = 0;
  rooms.forEach((room, roomIndex) => {
    const bounds = roomBounds(room);
    for (let i = 0; i < perRoom && placed < MAX_VISITORS; i++) {
      // Aim for opposite quarters of the lane, then settle for what's open.
      const preferX =
        room.originX + Math.round(room.cols * (i === 0 ? 0.32 : 0.68));
      const preferY = i === 0 ? LANE_ROW - 1 : LANE_ROW + 1;
      const spot = firstOpenTile(map, bounds, preferX, preferY, taken);
      if (!spot) continue;
      taken.add(`${spot.tx},${spot.ty}`);
      npcs.push(
        makeNpc(
          spot.tx,
          spot.ty,
          VISITOR_PALETTES[placed % VISITOR_PALETTES.length],
          bounds,
          spotsByRoom[roomIndex],
          false,
          "down",
        ),
      );
      placed++;
    }
  });

  // Curator: stands in the first room, facing the way through the museum.
  const first = rooms[0];
  if (first) {
    const bounds = roomBounds(first);
    const spot = firstOpenTile(
      map,
      bounds,
      first.originX + first.cols - 4,
      LANE_ROW + 1,
      taken,
    );
    if (spot) {
      npcs.push(
        makeNpc(
          spot.tx,
          spot.ty,
          CURATOR_PALETTE,
          bounds,
          spotsByRoom[0],
          true,
          "right",
        ),
      );
    }
  }

  return npcs;
}

/** Choose the next wander destination: usually an exhibit, sometimes a stroll. */
function pickTarget(npc: Npc, map: Tilemap): void {
  if (npc.viewSpots.length && Math.random() < 0.55) {
    const spot = pick(npc.viewSpots);
    npc.tx = spot.x;
    npc.ty = spot.y;
    npc.targetFacing = spot.facing;
  } else {
    // Random open interior tile — a few tries, then fall back to standing still.
    npc.targetFacing = null;
    const { minX, maxX, minY, maxY } = npc.bounds;
    for (let i = 0; i < 8; i++) {
      const tx = (rand(minX, maxX + 1)) | 0;
      const ty = (rand(minY, maxY + 1)) | 0;
      if (isWalkable(map, tx, ty)) {
        const c = tileCenter(tx, ty);
        npc.tx = c.x;
        npc.ty = c.y;
        break;
      }
    }
  }
  npc.mode = "wander";
  npc.blocked = 0;
}

/** How far ahead (px) an NPC probes for obstacles when choosing a heading. */
const PROBE = 11;

/**
 * Steer toward (tx, ty), walking *around* the desks rather than into them.
 * Each frame we test the straight-to-target heading and, if a step that way
 * would collide, fan out to alternatives — slide along the obstacle, then
 * detour around its corner — and take the first heading that stays clear. The
 * axis-separated move below still slides on contact as a final safety net.
 */
function steer(npc: Npc, map: Tilemap, dt: number): void {
  const dx = npc.tx - npc.x;
  const dy = npc.ty - npc.y;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;

  // Candidate headings, best-first: straight at the target, slide along the
  // dominant axis, slide along the other, then the two perpendicular detours.
  const along = Math.abs(ux) > Math.abs(uy);
  const headings: Array<[number, number]> = [
    [ux, uy],
    along ? [Math.sign(ux), 0] : [0, Math.sign(uy)],
    along ? [0, Math.sign(uy)] : [Math.sign(ux), 0],
    [-uy, ux],
    [uy, -ux],
  ];
  let hx = ux;
  let hy = uy;
  for (const [cx, cy] of headings) {
    const m = Math.hypot(cx, cy) || 1;
    const px = npc.x + (cx / m) * PROBE;
    const py = npc.y + (cy / m) * PROBE;
    if (canStand(map, px, py, npc.w, npc.h)) {
      hx = cx / m;
      hy = cy / m;
      break;
    }
  }

  if (Math.abs(hx) > Math.abs(hy)) npc.facing = hx < 0 ? "left" : "right";
  else if (hy !== 0) npc.facing = hy < 0 ? "up" : "down";

  // Ease off near the destination so arrival doesn't overshoot and jitter.
  const speed = npc.speed * Math.min(1, dist / 12);
  const k = 1 - Math.exp(-dt * RESPONSIVENESS);
  npc.vx += (hx * speed - npc.vx) * k;
  npc.vy += (hy * speed - npc.vy) * k;

  const nx = npc.x + npc.vx * dt;
  if (canStand(map, nx, npc.y, npc.w, npc.h)) npc.x = nx;
  else npc.vx = 0;
  const ny = npc.y + npc.vy * dt;
  if (canStand(map, npc.x, ny, npc.w, npc.h)) npc.y = ny;
  else npc.vy = 0;

  const moved = Math.hypot(npc.vx, npc.vy);
  npc.moving = moved > 6;
  if (npc.moving) npc.walkPhase = (npc.walkPhase + (moved * dt) / STRIDE_PIXELS) % 1;
  else npc.walkPhase = 0;

  // No headway (truly boxed in) for long enough → choose a fresh target.
  npc.blocked = moved < 8 ? npc.blocked + dt : 0;
}

function standStill(npc: Npc, dt: number): void {
  const k = 1 - Math.exp(-dt * RESPONSIVENESS);
  npc.vx += (0 - npc.vx) * k;
  npc.vy += (0 - npc.vy) * k;
  npc.moving = false;
  npc.walkPhase = 0;
}

/** Turn to watch the player when they pass within range. Returns true if so. */
function glanceAtPlayer(npc: Npc, player: Character): boolean {
  const dx = player.x - npc.x;
  const dy = player.y - npc.y;
  if (Math.hypot(dx, dy) > GLANCE_RADIUS) return false;
  npc.facing =
    Math.abs(dx) > Math.abs(dy)
      ? dx < 0
        ? "left"
        : "right"
      : dy < 0
        ? "up"
        : "down";
  return true;
}

/** Advance and expire whatever bubble is showing. */
function tickBubble(npc: Npc, dt: number): void {
  if (!npc.bubble) return;
  npc.bubble.t += dt;
  if (npc.bubble.t >= npc.bubble.life) npc.bubble = null;
}

function updateCurator(npc: Npc, dt: number, player: Character): void {
  standStill(npc, dt);

  // Watching the player takes priority over the idle glances around the room.
  const watching = glanceAtPlayer(npc, player);
  npc.turnTimer -= dt;
  if (npc.turnTimer <= 0) {
    if (!watching) npc.facing = pick<Direction>(["right", "down", "left"]);
    npc.turnTimer = rand(2.5, 5.5);
  }

  // Float a greeting now and then.
  if (!npc.bubble) {
    npc.bubbleCooldown -= dt;
    if (npc.bubbleCooldown <= 0) {
      npc.bubble = { text: pick(GREETINGS), t: 0, life: 3.4, accent: CURATOR_ACCENT };
      npc.bubbleCooldown = rand(7, 12);
    }
  }
}

export function updateNpc(
  npc: Npc,
  map: Tilemap,
  dt: number,
  player: Character,
): void {
  tickBubble(npc, dt);

  if (npc.stationary) {
    updateCurator(npc, dt, player);
    return;
  }

  if (npc.mode === "wander") {
    steer(npc, map, dt);
    const dist = Math.hypot(npc.tx - npc.x, npc.ty - npc.y);
    if (dist < 7) {
      // Arrived: linger and admire if this was an exhibit, else a short pause.
      if (npc.targetFacing) {
        npc.facing = npc.targetFacing;
        npc.mode = "view";
        npc.timer = rand(2.5, 5);
        // A small chance to mutter an approving reaction at the artwork.
        if (!npc.bubble && Math.random() < 0.5) {
          npc.bubble = {
            text: pick(REACTIONS),
            t: 0,
            life: 2.2,
            accent: VISITOR_BUBBLE_ACCENT,
          };
        }
      } else {
        npc.mode = "pause";
        npc.timer = rand(0.6, 1.4);
      }
    } else if (npc.blocked > 0.8) {
      pickTarget(npc, map);
    }
    return;
  }

  // view / pause: hold position, turn to watch a passing player, then move on.
  standStill(npc, dt);
  glanceAtPlayer(npc, player);
  npc.timer -= dt;
  if (npc.timer <= 0) pickTarget(npc, map);
}

/**
 * Draws the curator's floating greeting in the museum's pixel font. World-space;
 * call inside the camera transform, above the actors so it isn't occluded.
 */
export function drawNpcBubble(ctx: CanvasRenderingContext2D, npc: Npc): void {
  const b = npc.bubble;
  if (!b) return;
  const alpha = Math.max(
    0,
    Math.min(b.t / 0.3, (b.life - b.t) / 0.5, 1),
  );
  if (alpha <= 0) return;

  const padX = 4;
  const padY = 3;
  const w = measureText(b.text, 1) + padX * 2;
  const h = PIXEL_FONT_HEIGHT + padY * 2;
  const cx = Math.round(npc.x);
  const headTop = Math.round(npc.y) - 19; // sprite top, mirrors drawCharacter
  const x = cx - Math.round(w / 2);
  const y = headTop - h - 6;

  ctx.save();
  ctx.globalAlpha = alpha;
  // Trimmed dark bubble + a small tail pointing down to the speaker. Curators
  // get gold; visitors a quieter slate.
  ctx.fillStyle = b.accent;
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillRect(cx - 2, y + h, 4, 3);
  ctx.fillStyle = "#0a0d12";
  ctx.fillRect(x, y, w, h);
  ctx.fillRect(cx - 1, y + h, 2, 2);
  ctx.fillStyle = "#e8ecf0";
  drawText(ctx, b.text, x + padX, y + padY, 1);
  ctx.restore();
}
