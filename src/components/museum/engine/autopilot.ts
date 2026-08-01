import { TILE_SIZE } from "./tileAtlas";
import type { Character, Direction } from "./character";
import type { InputState } from "./input";
import { LANE_ROW, type RoomDef } from "../scenes/world";

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
 * Builds the tour route from the room layout. It runs along the central
 * corridor (the doorway lane carved open across every room), so the path never
 * collides with a desk, painting, or pedestal no matter how many rooms the
 * museum has. Walks the full length of the museum admiring exhibits on the way
 * out, then strolls back to the start so the loop repeats seamlessly.
 */
function buildTour(rooms: RoomDef[]): Waypoint[] {
  if (rooms.length === 0) return [{ tx: 1, ty: LANE_ROW }];

  const tour: Waypoint[] = [];
  // Outbound: pause twice per room, alternating which wall we admire.
  rooms.forEach((room, i) => {
    const near = room.originX + Math.round(room.cols * 0.3);
    const far = room.originX + Math.round(room.cols * 0.7);
    tour.push({ tx: near, ty: LANE_ROW, pause: 0.7, face: "up" });
    tour.push({
      tx: far,
      ty: LANE_ROW,
      pause: i % 2 === 0 ? 0.6 : 0.7,
      face: i % 2 === 0 ? "down" : "up",
    });
  });
  // Return leg: the same corridor with one unhurried pause per room, so the
  // character ends where it began and the loop closes cleanly.
  for (let i = rooms.length - 1; i >= 0; i--) {
    const room = rooms[i];
    tour.push({
      tx: room.originX + Math.round(room.cols * 0.5),
      ty: LANE_ROW,
      pause: i === 0 ? 0 : 0.5,
      face: "down",
    });
  }
  return tour;
}

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

export function createAutopilot(rooms: RoomDef[]): Autopilot {
  const tour = buildTour(rooms);
  let i = 0;
  let dwell = 0;

  const ap: Autopilot = {
    active: true,
    steer(ch, input, dt) {
      if (!ap.active) return;
      const wp = tour[i];
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
        i = (i + 1) % tour.length;
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
