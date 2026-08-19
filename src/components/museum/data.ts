import type { Interactable } from "./engine/interactables";
import { slotsForRoom, type RoomDef } from "./scenes/world";

export type WorkRef = {
  slug: string;
  title: string;
  description: string;
  role: string;
  year: string;
  stack: string[];
  thumbnail: string;
  liveUrl?: string;
  sourceUrl?: string;
  /** Accent color for the desk's monitor, screen glow, and floor spotlight. */
  color: string;
};

export type InvestmentRef = {
  slug: string;
  company: string;
  description: string;
  sector: string;
  stage: string;
  year: string;
  url?: string;
  logo?: string;
  /** Accent color used for the pedestal trim, plaque, and modal. */
  color: string;
};

/**
 * Places every exhibit into the rooms its wing was allotted. The layout planner
 * sized those rooms from these same counts, so each room gets exactly as many
 * slots as it has exhibits — nothing can be silently dropped for want of floor.
 */
export function buildWorldInteractables(
  rooms: RoomDef[],
  works: WorkRef[],
  investments: InvestmentRef[] = [],
): Interactable[] {
  const result: Interactable[] = [];

  for (const room of rooms) {
    const slots = slotsForRoom(room);

    if (room.wing.kind === "computer") {
      works.slice(room.offset, room.offset + room.count).forEach((work, i) => {
        const slot = slots[i];
        if (!slot) return;
        result.push({
          kind: "computer",
          slug: work.slug,
          title: work.title,
          tileX: slot.tileX,
          tileY: slot.tileY,
          width: slot.width,
          height: slot.height,
          face: slot.face,
          color: work.color,
        });
      });
      continue;
    }

    investments
      .slice(room.offset, room.offset + room.count)
      .forEach((inv, i) => {
        const slot = slots[i];
        if (!slot) return;
        result.push({
          kind: "investment",
          slug: inv.slug,
          title: inv.company,
          tileX: slot.tileX,
          tileY: slot.tileY,
          width: slot.width,
          height: slot.height,
          face: slot.face,
          color: inv.color,
        });
      });
  }

  return result;
}
