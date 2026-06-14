export type LoopCallbacks = {
  update: (dt: number) => void;
  /** `time` is total elapsed seconds since start (pause-correct, unlike
   * performance.now), handy for driving render-only animations. */
  render: (time: number) => void;
};

export type Loop = {
  start: () => void;
  stop: () => void;
};

export function createLoop(cb: LoopCallbacks): Loop {
  let rafId: number | null = null;
  let lastT = 0;
  let elapsed = 0;

  function tick(t: number) {
    if (rafId === null) return;
    const dt = lastT === 0 ? 0 : Math.min((t - lastT) / 1000, 0.1);
    lastT = t;
    elapsed += dt;
    cb.update(dt);
    cb.render(elapsed);
    rafId = requestAnimationFrame(tick);
  }

  return {
    start: () => {
      if (rafId !== null) return;
      // Reset lastT so the first frame after a (re)start has dt≈0 and doesn't
      // jump; elapsed keeps accumulating so animations resume seamlessly.
      lastT = 0;
      rafId = requestAnimationFrame(tick);
    },
    stop: () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
    },
  };
}
