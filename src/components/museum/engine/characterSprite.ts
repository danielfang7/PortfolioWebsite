import type { Character, Direction } from "./character";

const SPRITE_W = 16;
const SPRITE_H = 24;

type Rect = { x: number; y: number; w: number; h: number; c: string };

const HAIR = "#0a0a0a";
const SKIN = "#d4a887";
const SKIN_SHADOW = "#b8906f";
const SHIRT = "#0b3a46";
const SHIRT_HI = "#00d8ff";
const PANTS = "#17171a";
const SHOES = "#050506";
const EYE = "#00d8ff";

const POSE_DOWN: Rect[] = [
  { x: 5, y: 2, w: 6, h: 5, c: HAIR },
  { x: 5, y: 6, w: 6, h: 3, c: SKIN },
  { x: 6, y: 7, w: 1, h: 1, c: EYE },
  { x: 9, y: 7, w: 1, h: 1, c: EYE },
  { x: 6, y: 9, w: 4, h: 1, c: SKIN_SHADOW },
  { x: 3, y: 10, w: 10, h: 7, c: SHIRT },
  { x: 3, y: 13, w: 10, h: 1, c: SHIRT_HI },
  { x: 2, y: 11, w: 1, h: 4, c: SKIN },
  { x: 13, y: 11, w: 1, h: 4, c: SKIN },
  { x: 4, y: 17, w: 8, h: 4, c: PANTS },
  { x: 4, y: 21, w: 3, h: 2, c: SHOES },
  { x: 9, y: 21, w: 3, h: 2, c: SHOES },
];

const POSE_UP: Rect[] = [
  { x: 5, y: 2, w: 6, h: 6, c: HAIR },
  { x: 6, y: 8, w: 4, h: 2, c: SKIN_SHADOW },
  { x: 3, y: 10, w: 10, h: 7, c: SHIRT },
  { x: 5, y: 10, w: 6, h: 1, c: SHIRT_HI },
  { x: 2, y: 11, w: 1, h: 4, c: SKIN },
  { x: 13, y: 11, w: 1, h: 4, c: SKIN },
  { x: 4, y: 17, w: 8, h: 4, c: PANTS },
  { x: 4, y: 21, w: 3, h: 2, c: SHOES },
  { x: 9, y: 21, w: 3, h: 2, c: SHOES },
];

const POSE_LEFT: Rect[] = [
  { x: 5, y: 2, w: 6, h: 5, c: HAIR },
  { x: 5, y: 6, w: 5, h: 3, c: SKIN },
  { x: 5, y: 7, w: 1, h: 1, c: EYE },
  { x: 6, y: 9, w: 4, h: 1, c: SKIN_SHADOW },
  { x: 3, y: 10, w: 10, h: 7, c: SHIRT },
  { x: 3, y: 13, w: 10, h: 1, c: SHIRT_HI },
  { x: 3, y: 11, w: 1, h: 5, c: SKIN },
  { x: 4, y: 17, w: 8, h: 4, c: PANTS },
  { x: 3, y: 21, w: 4, h: 2, c: SHOES },
  { x: 8, y: 21, w: 4, h: 2, c: SHOES },
];

// Right is a horizontal mirror of left.
const POSE_RIGHT: Rect[] = POSE_LEFT.map((r) => ({
  ...r,
  x: SPRITE_W - r.x - r.w,
}));

const POSES: Record<Direction, Rect[]> = {
  down: POSE_DOWN,
  up: POSE_UP,
  left: POSE_LEFT,
  right: POSE_RIGHT,
};

const DIR_COLUMN: Record<Direction, number> = {
  down: 0,
  up: 1,
  left: 2,
  right: 3,
};

export function createCharacterSprite(): HTMLCanvasElement {
  const sprite = document.createElement("canvas");
  sprite.width = SPRITE_W * 4;
  sprite.height = SPRITE_H;
  const ctx = sprite.getContext("2d");
  if (!ctx) throw new Error("characterSprite: 2d context unavailable");
  ctx.imageSmoothingEnabled = false;

  (Object.keys(DIR_COLUMN) as Direction[]).forEach((dir) => {
    const ox = DIR_COLUMN[dir] * SPRITE_W;
    for (const r of POSES[dir]) {
      ctx.fillStyle = r.c;
      ctx.fillRect(ox + r.x, r.y, r.w, r.h);
    }
  });

  return sprite;
}

export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  sprite: HTMLCanvasElement,
  ch: Character,
): void {
  const sx = Math.round(ch.x);
  const sy = Math.round(ch.y);

  // Drop shadow under feet, gives depth against the flat floor.
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.beginPath();
  ctx.ellipse(sx, sy + 8, 7, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const col = DIR_COLUMN[ch.facing];
  // ch.x/ch.y is the character's body-center; draw sprite so feet sit ~4px below center.
  ctx.drawImage(
    sprite,
    col * SPRITE_W,
    0,
    SPRITE_W,
    SPRITE_H,
    sx - SPRITE_W / 2,
    sy - SPRITE_H + 5,
    SPRITE_W,
    SPRITE_H,
  );
}
