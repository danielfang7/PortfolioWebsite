/**
 * Room-snap camera. The world is a row of viewport-sized rooms; the camera
 * frames exactly one room and glides to the next when the player crosses a
 * doorway. Keeping the camera quantised to room origins (rather than a free
 * follow) means the canvas-anchored DOM overlays only have to account for a
 * fixed per-room offset, so they never jitter mid-scroll.
 */
export type Camera = {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
};

/** How quickly the camera glides to a new room. Gentle — this is the "pan". */
const RESPONSIVENESS = 9;

export function createCamera(x = 0, y = 0): Camera {
  return { x, y, targetX: x, targetY: y };
}

export function setCameraTarget(cam: Camera, x: number, y: number): void {
  cam.targetX = x;
  cam.targetY = y;
}

/** Frame-rate-independent glide toward the target room origin. */
export function updateCamera(cam: Camera, dt: number): void {
  const k = 1 - Math.exp(-dt * RESPONSIVENESS);
  cam.x += (cam.targetX - cam.x) * k;
  cam.y += (cam.targetY - cam.y) * k;
  if (Math.abs(cam.targetX - cam.x) < 0.5) cam.x = cam.targetX;
  if (Math.abs(cam.targetY - cam.y) < 0.5) cam.y = cam.targetY;
}
