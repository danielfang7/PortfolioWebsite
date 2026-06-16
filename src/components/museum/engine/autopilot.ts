import { TILE_SIZE } from "./tileAtlas";
import type { Character, Direction } from "./character";
import type { InputState } from "./input";

/**
 * Attract-mode autopilot: walks the player character on a slow guided loop
 * through all three wings — Workshop → Gallery → Workshop → Portfolio — pausing
 * to face an exhibit here and there, like an arcade demo reel. It drives the
 * character by writing into the same analog input axis the touch joystick uses,
 * so the real movement + collision code does the actual walking. The host hands
 * control to the visitor (and calls `stop`) on their first interaction.
 */

type Waypoint = {
  tx: number;
  ty: number;
  /** Seconds to dwell on arrival (a small default keeps the stroll smooth). */
  pause?: number;
  /** Direction to face while dwelling — used to "admire" a nearby exhibit. */
  face?: Direction;
};

/**
 * The tour runs along the central corridor (tile row 5), which is the doorway
 * lane carved open across every room, so the path never collides with a desk,
 * painting, or pedestal. Listed as a closed loop so it repeats seamlessly.
 */
const TOUR: Waypoint[] = [
  { tx: 20, ty: 5 },
  { tx: 17, ty: 5, pause: 0.7, face: "up" }, // workshop desk
  { tx: 14, ty: 5 },
  { tx: 11, ty: 5 },
  { tx: 7, ty: 5, pause: 0.7, face: "up" }, // gallery painting (top wall)
  { tx: 4, ty: 5, pause: 0.7, face: "down" }, // gallery painting (bottom wall)
  { tx: 8, ty: 5 },
  { tx: 13, ty: 5 },
  { tx: 18, ty: 5 },
  { tx: 23, ty: 5, pause: 0.7, face: "up" }, // workshop desk
  { tx: 27, ty: 5 }, // through the doorway into the Portfolio
  { tx: 31, ty: 5, pause: 0.7, face: "up" }, // pedestal
  { tx: 35, ty: 5, pause: 0.6, face: "up" }, // pedestal
  { tx: 39, ty: 5, pause: 0.7, face: "up" }, // pedestal
  { tx: 33, ty: 5, pause: 0.5, face: "down" },
  { tx: 29, ty: 5 },
  { tx: 24, ty: 5 },
];

/** A relaxed cruise — a touch below full tilt so the stroll reads as unhurried. */
const CRUISE = 0.82;
/** Arrival radius (px) at which a waypoint counts as reached. */
const ARRIVE = 6;
/** Fallback dwell so non-pause waypoints don't thrash at the threshold. */
const DEFAULT_DWELL = 0.18;

export type Autopilot = {
  active: boolean;
  /** Steer toward the current waypoint by setting the analog input axis. */
  steer: (ch: Character, input: InputState, dt: number) => void;
  /** Hand control back: clear the axis and go dormant. */
  stop: (input: InputState) => void;
};

export function createAutopilot(): Autopilot {
  let i = 0;
  let dwell = 0;

  const ap: Autopilot = {
    active: true,
    steer(ch, input, dt) {
      if (!ap.active) return;
      const wp = TOUR[i];
      const targetX = wp.tx * TILE_SIZE + TILE_SIZE / 2;
      const targetY = wp.ty * TILE_SIZE + TILE_SIZE / 2;
      const dx = targetX - ch.x;
      const dy = targetY - ch.y;
      const dist = Math.hypot(dx, dy);

      if (dist > ARRIVE) {
        input.axisX = (dx / dist) * CRUISE;
        input.axisY = (dy / dist) * CRUISE;
        return;
      }

      // Arrived: hold position, optionally turn to admire, then move on.
      input.axisX = 0;
      input.axisY = 0;
      if (wp.face) ch.facing = wp.face;
      if (dwell <= 0) dwell = wp.pause ?? DEFAULT_DWELL;
      dwell -= dt;
      if (dwell <= 0) {
        dwell = 0;
        i = (i + 1) % TOUR.length;
      }
    },
    stop(input) {
      ap.active = false;
      input.axisX = 0;
      input.axisY = 0;
    },
  };

  return ap;
}
