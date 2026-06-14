import type { Input } from "./input";

/** Joystick travel radius in canvas-space pixels (canvas is 448px wide). */
const JOY_RADIUS = 46;
/** A press that moves less than this (canvas px) and releases quickly counts as
 * a tap → interact, rather than a joystick drag. */
const TAP_SLOP = 10;
const TAP_MS = 300;

export type JoystickState = {
  active: boolean;
  baseX: number;
  baseY: number;
  knobX: number;
  knobY: number;
  radius: number;
};

export type TouchControls = {
  joystick: JoystickState;
  destroy: () => void;
};

/**
 * Floating virtual joystick for touch devices. On touch-start anywhere on the
 * canvas the stick spawns under the finger; dragging drives the analog input
 * vector; a quick tap (no real drag) fires interact. Mouse/pen pointers are
 * ignored so desktop keeps using the keyboard.
 */
export function createTouchControls(
  canvas: HTMLCanvasElement,
  input: Input,
): TouchControls {
  const joystick: JoystickState = {
    active: false,
    baseX: 0,
    baseY: 0,
    knobX: 0,
    knobY: 0,
    radius: JOY_RADIUS,
  };

  let pointerId: number | null = null;
  let startTime = 0;
  let dragMax = 0;

  /** Convert a client point to canvas-space pixel coords. */
  function toCanvas(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    return { x: (clientX - rect.left) * sx, y: (clientY - rect.top) * sy };
  }

  function onDown(e: PointerEvent) {
    if (e.pointerType !== "touch" || pointerId !== null) return;
    pointerId = e.pointerId;
    startTime = e.timeStamp;
    dragMax = 0;
    const p = toCanvas(e.clientX, e.clientY);
    joystick.active = true;
    joystick.baseX = joystick.knobX = p.x;
    joystick.baseY = joystick.knobY = p.y;
    input.setAxis(0, 0);
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* pointer may already be gone — capture is best-effort */
    }
    e.preventDefault();
  }

  function onMove(e: PointerEvent) {
    if (e.pointerId !== pointerId) return;
    const p = toCanvas(e.clientX, e.clientY);
    let dx = p.x - joystick.baseX;
    let dy = p.y - joystick.baseY;
    const dist = Math.hypot(dx, dy);
    dragMax = Math.max(dragMax, dist);
    if (dist > JOY_RADIUS) {
      dx = (dx / dist) * JOY_RADIUS;
      dy = (dy / dist) * JOY_RADIUS;
    }
    joystick.knobX = joystick.baseX + dx;
    joystick.knobY = joystick.baseY + dy;
    input.setAxis(dx / JOY_RADIUS, dy / JOY_RADIUS);
    e.preventDefault();
  }

  function onUp(e: PointerEvent) {
    if (e.pointerId !== pointerId) return;
    const quick = e.timeStamp - startTime < TAP_MS;
    if (quick && dragMax < TAP_SLOP) input.triggerInteract();
    pointerId = null;
    joystick.active = false;
    input.setAxis(0, 0);
    try {
      if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
    } catch {
      /* best-effort release */
    }
  }

  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  // Prevent the page from scrolling/zooming while the stick is in use.
  canvas.style.touchAction = "none";

  return {
    joystick,
    destroy: () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    },
  };
}

/** Draws the floating joystick (base ring + knob) when active. */
export function drawJoystick(
  ctx: CanvasRenderingContext2D,
  j: JoystickState,
): void {
  if (!j.active) return;
  ctx.save();
  // Base ring.
  ctx.beginPath();
  ctx.arc(j.baseX, j.baseY, j.radius, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(10, 14, 16, 0.35)";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(0, 216, 255, 0.4)";
  ctx.stroke();
  // Knob.
  ctx.beginPath();
  ctx.arc(j.knobX, j.knobY, j.radius * 0.42, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0, 216, 255, 0.55)";
  ctx.fill();
  ctx.strokeStyle = "rgba(0, 216, 255, 0.9)";
  ctx.stroke();
  ctx.restore();
}
