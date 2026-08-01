import type { RoomDef } from "../scenes/world";

type Props = {
  rooms: RoomDef[];
  /** Index of the room the visitor is currently standing in. */
  current: number;
};

const MONO =
  '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

/**
 * A floor plan strip: one tick per room, grouped into wings, with the room the
 * visitor occupies lit up. The camera only ever frames one room, so without
 * this there is no way to tell a three-room museum from an eight-room one, or
 * to know how much is left to see. Purely informational — the map is not a
 * shortcut, since walking the rooms is the point.
 */
export function RoomWayfinder({ rooms, current }: Props) {
  // A single room per wing is the old three-room museum, where the wing banner
  // already says everything this strip would.
  if (rooms.length <= 1) return null;

  // Consecutive rooms sharing a wing render as one group.
  const groups: Array<{ wingId: string; label: string; indices: number[] }> = [];
  rooms.forEach((room, i) => {
    const last = groups[groups.length - 1];
    if (last && last.wingId === room.wing.id) last.indices.push(i);
    else
      groups.push({
        wingId: room.wing.id,
        label: room.wing.name.replace(/^The\s+/i, ""),
        indices: [i],
      });
  });

  const activeWing = rooms[current]?.wing.id;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: "1.1rem",
        marginTop: "0.75rem",
      }}
    >
      {groups.map((group) => {
        const on = group.wingId === activeWing;
        return (
          <div
            key={group.wingId}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <span
              style={{
                fontFamily: MONO,
                fontSize: "0.62rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: on ? "#00D8FF" : "rgba(223,239,243,0.35)",
                transition: "color 220ms ease-out",
              }}
            >
              {group.label}
            </span>
            <span style={{ display: "inline-flex", gap: "0.22rem" }}>
              {group.indices.map((i) => {
                const here = i === current;
                return (
                  <span
                    key={i}
                    style={{
                      width: here ? "0.85rem" : "0.3rem",
                      height: "0.3rem",
                      borderRadius: "9999px",
                      background: here ? "#00D8FF" : "rgba(223,239,243,0.22)",
                      boxShadow: here ? "0 0 8px rgba(0,216,255,0.6)" : "none",
                      transition:
                        "width 240ms ease-out, background 240ms ease-out",
                    }}
                  />
                );
              })}
            </span>
          </div>
        );
      })}
      <span className="sr-only" aria-live="polite">
        {rooms[current]
          ? `Room ${current + 1} of ${rooms.length}: ${rooms[current].name}`
          : ""}
      </span>
    </div>
  );
}

export default RoomWayfinder;
