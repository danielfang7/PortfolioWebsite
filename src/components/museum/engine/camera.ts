/**
 * For the MVP single-room scene the whole map fits in the canvas, so the
 * camera is a fixed identity. Keeping the abstraction lets later steps (or a
 * multi-room follow-up) swap in a scrolling camera without touching renderers.
 */
export type Camera = {
  x: number;
  y: number;
};

export function createCamera(): Camera {
  return { x: 0, y: 0 };
}
