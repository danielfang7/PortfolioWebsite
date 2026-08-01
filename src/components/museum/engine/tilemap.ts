import { TILE_SIZE, type TileId } from "./tileAtlas";

export type Tilemap = {
  width: number;
  height: number;
  /** Flat row-major array of length width*height. */
  tiles: TileId[];
  /** Flat row-major array of length width*height. True = player can stand here. */
  walkable: boolean[];
};

export function tileAt(map: Tilemap, tx: number, ty: number): TileId | null {
  if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) return null;
  return map.tiles[ty * map.width + tx];
}

export function isWalkable(map: Tilemap, tx: number, ty: number): boolean {
  if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) return false;
  return map.walkable[ty * map.width + tx];
}

/** World-space pixel rect the camera currently frames. */
export type Viewport = { x: number; y: number; w: number; h: number };

/**
 * Draws the floor and walls. `view` clips the loop to the tiles the camera can
 * actually see — the museum grows a room per wing overflow, so drawing the
 * whole world every frame would make the cost of a large collection show up as
 * frame time on every visitor's machine.
 */
export function drawTilemap(
  ctx: CanvasRenderingContext2D,
  map: Tilemap,
  atlas: HTMLCanvasElement,
  view?: Viewport,
): void {
  ctx.imageSmoothingEnabled = false;
  const minX = view ? Math.max(0, Math.floor(view.x / TILE_SIZE)) : 0;
  const maxX = view
    ? Math.min(map.width - 1, Math.ceil((view.x + view.w) / TILE_SIZE))
    : map.width - 1;
  const minY = view ? Math.max(0, Math.floor(view.y / TILE_SIZE)) : 0;
  const maxY = view
    ? Math.min(map.height - 1, Math.ceil((view.y + view.h) / TILE_SIZE))
    : map.height - 1;

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const id = map.tiles[y * map.width + x];
      ctx.drawImage(
        atlas,
        id * TILE_SIZE,
        0,
        TILE_SIZE,
        TILE_SIZE,
        x * TILE_SIZE,
        y * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE,
      );
    }
  }
}
