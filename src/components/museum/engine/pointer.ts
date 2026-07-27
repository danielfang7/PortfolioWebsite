/**
 * Mouse and stylus input for the museum canvas. Touch is deliberately excluded
 * — `touch.ts` owns those pointers for the virtual joystick, and a device with
 * both gets the right control scheme for whichever it's currently using.
 *
 * This layer only reports *where* the visitor clicked or is hovering, in
 * canvas-space pixels. Turning that into a destination is the caller's job,
 * since only it knows the camera offset.
 */

/** A press that travels further than this (canvas px) is a drag, not a click. */
const CLICK_SLOP = 6;
/** …or one that lingers longer than this. Keeps text-drags from teleporting you. */
const CLICK_MS = 600;

export type PointerControls = {
  /** Latest hover position in canvas px, or null when the pointer is away. */
  hover: { x: number; y: number } | null;
  destroy: () => void;
};

export function createPointerControls(
  canvas: HTMLCanvasElement,
  onClick: (canvasX: number, canvasY: number) => void,
): PointerControls {
  const controls: PointerControls = { hover: null, destroy };

  let downId: number | null = null;
  let downTime = 0;
  let downX = 0;
  let downY = 0;
  let travel = 0;

  /** Client coords -> canvas-space px (the canvas is CSS-scaled up from 448×320). */
  function toCanvas(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) * canvas.width) / rect.width,
      y: ((clientY - rect.top) * canvas.height) / rect.height,
    };
  }

  function onDown(e: PointerEvent) {
    if (e.pointerType === "touch" || downId !== null) return;
    const p = toCanvas(e.clientX, e.clientY);
    downId = e.pointerId;
    downTime = e.timeStamp;
    downX = p.x;
    downY = p.y;
    travel = 0;
  }

  function onMove(e: PointerEvent) {
    if (e.pointerType === "touch") return;
    const p = toCanvas(e.clientX, e.clientY);
    controls.hover = p;
    if (e.pointerId === downId) {
      travel = Math.max(travel, Math.hypot(p.x - downX, p.y - downY));
    }
  }

  function onUp(e: PointerEvent) {
    if (e.pointerId !== downId) return;
    const quick = e.timeStamp - downTime < CLICK_MS;
    downId = null;
    if (quick && travel < CLICK_SLOP) {
      const p = toCanvas(e.clientX, e.clientY);
      onClick(p.x, p.y);
    }
  }

  function onCancel(e: PointerEvent) {
    if (e.pointerId === downId) downId = null;
  }

  function onLeave() {
    controls.hover = null;
    downId = null;
  }

  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onCancel);
  canvas.addEventListener("pointerleave", onLeave);

  function destroy() {
    canvas.removeEventListener("pointerdown", onDown);
    canvas.removeEventListener("pointermove", onMove);
    canvas.removeEventListener("pointerup", onUp);
    canvas.removeEventListener("pointercancel", onCancel);
    canvas.removeEventListener("pointerleave", onLeave);
    canvas.style.cursor = "";
  }

  return controls;
}
