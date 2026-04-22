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

export function drawTilemap(
  ctx: CanvasRenderingContext2D,
  map: Tilemap,
  atlas: HTMLCanvasElement,
): void {
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
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
