import type { Character, Direction } from "./character";

const SPRITE_W = 16;
const SPRITE_H = 24;
/** Two walk frames per direction. Frame 0 = contact/idle, frame 1 = mid-step. */
const FRAMES = 2;

/**
 * Every drawable region of the character references a palette slot rather than a
 * literal color, so the same 16x24 art can be re-skinned for the player, museum
 * visitors, and the curator just by swapping the palette.
 */
export type CharacterPalette = {
  hair: string;
  skin: string;
  skinShadow: string;
  shirt: string;
  shirtHi: string;
  pants: string;
  shoes: string;
  eye: string;
};

/** The player: signature electric-cyan shirt trim and eyes so "you" read at a
 * glance against the muted NPC crowd. */
export const PLAYER_PALETTE: CharacterPalette = {
  hair: "#0a0a0a",
  skin: "#d4a887",
  skinShadow: "#b8906f",
  shirt: "#0b3a46",
  shirtHi: "#00d8ff",
  pants: "#17171a",
  shoes: "#050506",
  eye: "#00d8ff",
};

type Slot = keyof CharacterPalette;
type Rect = { x: number; y: number; w: number; h: number; c: Slot };

// Body (everything above the legs) is shared across a direction's frames; only
// the legs/shoes swap between frames to animate the stride.
const BODY_DOWN: Rect[] = [
  { x: 5, y: 2, w: 6, h: 5, c: "hair" },
  { x: 5, y: 6, w: 6, h: 3, c: "skin" },
  { x: 6, y: 7, w: 1, h: 1, c: "eye" },
  { x: 9, y: 7, w: 1, h: 1, c: "eye" },
  { x: 6, y: 9, w: 4, h: 1, c: "skinShadow" },
  { x: 3, y: 10, w: 10, h: 7, c: "shirt" },
  { x: 3, y: 13, w: 10, h: 1, c: "shirtHi" },
  { x: 2, y: 11, w: 1, h: 4, c: "skin" },
  { x: 13, y: 11, w: 1, h: 4, c: "skin" },
];

const BODY_UP: Rect[] = [
  { x: 5, y: 2, w: 6, h: 6, c: "hair" },
  { x: 6, y: 8, w: 4, h: 2, c: "skinShadow" },
  { x: 3, y: 10, w: 10, h: 7, c: "shirt" },
  { x: 5, y: 10, w: 6, h: 1, c: "shirtHi" },
  { x: 2, y: 11, w: 1, h: 4, c: "skin" },
  { x: 13, y: 11, w: 1, h: 4, c: "skin" },
];

const BODY_LEFT: Rect[] = [
  { x: 5, y: 2, w: 6, h: 5, c: "hair" },
  { x: 5, y: 6, w: 5, h: 3, c: "skin" },
  { x: 5, y: 7, w: 1, h: 1, c: "eye" },
  { x: 6, y: 9, w: 4, h: 1, c: "skinShadow" },
  { x: 3, y: 10, w: 10, h: 7, c: "shirt" },
  { x: 3, y: 13, w: 10, h: 1, c: "shirtHi" },
  { x: 3, y: 11, w: 1, h: 5, c: "skin" },
];

// Leg sets: index 0 is the planted/contact pose, index 1 is mid-stride.
const LEGS_VERT: Rect[][] = [
  [
    { x: 4, y: 17, w: 8, h: 4, c: "pants" },
    { x: 4, y: 21, w: 3, h: 2, c: "shoes" },
    { x: 9, y: 21, w: 3, h: 2, c: "shoes" },
  ],
  [
    { x: 4, y: 17, w: 8, h: 4, c: "pants" },
    { x: 5, y: 20, w: 3, h: 2, c: "shoes" }, // lead foot lifted + forward
    { x: 8, y: 22, w: 3, h: 1, c: "shoes" }, // trailing foot pushed back
  ],
];

const LEGS_LEFT: Rect[][] = [
  [
    { x: 4, y: 17, w: 8, h: 4, c: "pants" },
    { x: 3, y: 21, w: 4, h: 2, c: "shoes" },
    { x: 8, y: 21, w: 4, h: 2, c: "shoes" },
  ],
  [
    { x: 4, y: 17, w: 8, h: 4, c: "pants" },
    { x: 5, y: 20, w: 4, h: 2, c: "shoes" }, // front foot swung forward + up
    { x: 7, y: 22, w: 4, h: 1, c: "shoes" }, // back foot trailing
  ],
];

function frame(body: Rect[], legs: Rect[]): Rect[] {
  return [...legs.slice(0, 1), ...body, ...legs.slice(1)];
}

const POSES_LEFT: Rect[][] = LEGS_LEFT.map((legs) => frame(BODY_LEFT, legs));

const POSES: Record<Direction, Rect[][]> = {
  down: LEGS_VERT.map((legs) => frame(BODY_DOWN, legs)),
  up: LEGS_VERT.map((legs) => frame(BODY_UP, legs)),
  left: POSES_LEFT,
  // Right is a horizontal mirror of left, per frame.
  right: POSES_LEFT.map((pose) =>
    pose.map((r) => ({ ...r, x: SPRITE_W - r.x - r.w })),
  ),
};

const DIR_ROW: Record<Direction, number> = {
  down: 0,
  up: 1,
  left: 2,
  right: 3,
};

/**
 * Bakes a 4-direction x 2-frame sprite sheet for the given palette. Built once
 * per character skin and reused across the session.
 */
export function createCharacterSprite(
  palette: CharacterPalette = PLAYER_PALETTE,
): HTMLCanvasElement {
  const sprite = document.createElement("canvas");
  sprite.width = SPRITE_W * FRAMES;
  sprite.height = SPRITE_H * 4;
  const ctx = sprite.getContext("2d");
  if (!ctx) throw new Error("characterSprite: 2d context unavailable");
  ctx.imageSmoothingEnabled = false;

  (Object.keys(DIR_ROW) as Direction[]).forEach((dir) => {
    const oy = DIR_ROW[dir] * SPRITE_H;
    POSES[dir].forEach((pose, f) => {
      const ox = f * SPRITE_W;
      for (const r of pose) {
        ctx.fillStyle = palette[r.c];
        ctx.fillRect(ox + r.x, oy + r.y, r.w, r.h);
      }
    });
  });

  return sprite;
}

export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  sprite: HTMLCanvasElement,
  ch: Character,
  time = 0,
): void {
  const sx = Math.round(ch.x);
  const sy = Math.round(ch.y);

  // Pick the walk frame from the phase; idle holds the contact pose.
  const frameIdx = ch.moving && ch.walkPhase >= 0.5 ? 1 : 0;
  // A 1px body bob on the mid-step frame sells the gait without new art.
  const bob = ch.moving && frameIdx === 1 ? 1 : 0;
  // While idle the shadow gently breathes for a hint of life.
  const idleBreathe = ch.moving ? 0 : Math.sin(time * 1.6) * 0.5;

  // Drop shadow under feet, gives depth against the flat floor. Shrinks a touch
  // on the bob frame so the character reads as lifting off the ground.
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.beginPath();
  ctx.ellipse(sx, sy + 8, (bob ? 6 : 7) + idleBreathe, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const row = DIR_ROW[ch.facing];
  ctx.drawImage(
    sprite,
    frameIdx * SPRITE_W,
    row * SPRITE_H,
    SPRITE_W,
    SPRITE_H,
    sx - SPRITE_W / 2,
    sy - SPRITE_H + 5 - bob,
    SPRITE_W,
    SPRITE_H,
  );
}

export { SPRITE_H, SPRITE_W };
