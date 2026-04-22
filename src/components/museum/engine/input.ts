export type InputState = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  /** Edge-triggered: true for one frame after a press. Consumer must call clearInteract(). */
  interact: boolean;
};

export type Input = {
  state: InputState;
  clearInteract: () => void;
  destroy: () => void;
};

export function createInput(): Input {
  const state: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    interact: false,
  };

  function handleKey(e: KeyboardEvent, pressed: boolean) {
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

  const onKeyDown = (e: KeyboardEvent) => handleKey(e, true);
  const onKeyUp = (e: KeyboardEvent) => handleKey(e, false);

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  return {
    state,
    clearInteract: () => {
      state.interact = false;
    },
    destroy: () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    },
  };
}
