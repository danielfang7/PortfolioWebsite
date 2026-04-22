export type LoopCallbacks = {
  update: (dt: number) => void;
  render: () => void;
};

export type Loop = {
  start: () => void;
  stop: () => void;
};

export function createLoop(cb: LoopCallbacks): Loop {
  let rafId: number | null = null;
  let lastT = 0;

  function tick(t: number) {
    if (rafId === null) return;
    const dt = lastT === 0 ? 0 : Math.min((t - lastT) / 1000, 0.1);
    lastT = t;
    cb.update(dt);
    cb.render();
    rafId = requestAnimationFrame(tick);
  }

  return {
    start: () => {
      if (rafId !== null) return;
      lastT = 0;
      rafId = requestAnimationFrame(tick);
    },
    stop: () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
    },
  };
}
