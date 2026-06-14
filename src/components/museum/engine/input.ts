export type InputState = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  /** Analog move vector from touch/joystick, each component in -1..1. Added to
   * the digital keys and clamped to the unit circle in updateCharacter. */
  axisX: number;
  axisY: number;
  /** Edge-triggered: true for one frame after a press. Consumer must call clearInteract(). */
  interact: boolean;
};

export type Input = {
  state: InputState;
  clearInteract: () => void;
  /** Drive the analog vector from a touch joystick (values clamped to unit). */
  setAxis: (x: number, y: number) => void;
  /** Queue an interact (tap on touch, etc.). */
  triggerInteract: () => void;
  destroy: () => void;
  /** True while the game owns the keyboard (canvas focused or hovered). */
  isActive: () => boolean;
};

/**
 * Keyboard input scoped to the game surface. We only consume (and
 * preventDefault) movement keys while the player is actually engaged with the
 * canvas — i.e. it's focused or the pointer is hovering it. This stops the
 * museum from hijacking arrow-key page scrolling when the visitor is reading
 * elsewhere on the page, which is the expected behaviour for an embedded
 * mini-game rather than a full-screen one. Touch input (setAxis /
 * triggerInteract) is analog and not gated on focus — the joystick owns its
 * own pointer.
 */
export function createInput(target: HTMLElement): Input {
  const state: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    axisX: 0,
    axisY: 0,
    interact: false,
  };

  let hovering = false;
  const isActive = () => hovering || document.activeElement === target;

  function handleKey(e: KeyboardEvent, pressed: boolean) {
    if (!isActive()) return;
    let matched = true;
    switch (e.key) {
      case "ArrowUp":
      case "w":
      case "W":
        state.up = pressed;
        break;
      case "ArrowDown":
      case "s":
      case "S":
        state.down = pressed;
        break;
      case "ArrowLeft":
      case "a":
      case "A":
        state.left = pressed;
        break;
      case "ArrowRight":
      case "d":
      case "D":
        state.right = pressed;
        break;
      case "e":
      case "E":
      case "Enter":
      case " ":
        if (pressed) state.interact = true;
        break;
      default:
        matched = false;
    }
    if (matched) e.preventDefault();
  }

  function clearMovement() {
    state.up = state.down = state.left = state.right = false;
    state.axisX = state.axisY = 0;
  }

  const onKeyDown = (e: KeyboardEvent) => handleKey(e, true);
  const onKeyUp = (e: KeyboardEvent) => handleKey(e, false);
  const onEnter = () => {
    hovering = true;
  };
  const onLeave = () => {
    hovering = false;
    // Drop held keys so the character doesn't keep gliding after the pointer
    // leaves while the canvas is unfocused.
    if (document.activeElement !== target) clearMovement();
  };
  // A keyup can be missed if the window loses focus mid-press (alt-tab, etc.).
  const onBlur = () => clearMovement();

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  target.addEventListener("pointerenter", onEnter);
  target.addEventListener("pointerleave", onLeave);
  window.addEventListener("blur", onBlur);

  return {
    state,
    isActive,
    setAxis: (x, y) => {
      state.axisX = x;
      state.axisY = y;
    },
    triggerInteract: () => {
      state.interact = true;
    },
    clearInteract: () => {
      state.interact = false;
    },
    destroy: () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      target.removeEventListener("pointerenter", onEnter);
      target.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onBlur);
    },
  };
}
