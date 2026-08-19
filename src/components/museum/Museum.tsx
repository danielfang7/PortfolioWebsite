import { useEffect, useMemo, useState } from "react";
// TILE_SIZE is re-exported by MuseumCanvas alongside the canvas dimensions.
import MuseumCanvas, { CANVAS_W, CANVAS_H, TILE_SIZE } from "./MuseumCanvas";
import type { Interactable } from "./engine/interactables";
import InteractPrompt from "./ui/InteractPrompt";
import ListViewToggle from "./ui/ListViewToggle";
import SoundToggle from "./ui/SoundToggle";
import ItemModal from "./ui/ItemModal";
import RoomWayfinder from "./ui/RoomWayfinder";
import { planRooms, roomIndexForX, spawnTile } from "./scenes/world";
import type { WorkRef, InvestmentRef } from "./data";

export type MuseumProps = {
  works: WorkRef[];
  investments: InvestmentRef[];
  /**
   * Attract mode: the character auto-tours the wings behind a "take control"
   * overlay. Used for the embedded preview on the home page.
   */
  attract?: boolean;
};

declare global {
  interface Window {
    __setLabView?: (mode: "museum" | "list") => void;
  }
}

const SOUND_PREF_KEY = "museumSoundOn";

export function Museum({ works, investments, attract = false }: MuseumProps) {
  const [focus, setFocus] = useState<Interactable | null>(null);
  const [selected, setSelected] = useState<Interactable | null>(null);
  // Sound is opt-in: start muted, then honor the visitor's saved preference.
  const [muted, setMuted] = useState(true);
  // Attract mode only: tracks whether the visitor has taken control yet, so the
  // "click to take control" overlay can fade away on their first interaction.
  const [controlled, setControlled] = useState(false);
  // Touch devices have no keyboard, so the attract overlay swaps "WASD" copy for
  // tap/drag wording. Resolved after mount to avoid an SSR hydration mismatch.
  const [coarsePointer, setCoarsePointer] = useState(false);

  // The floor plan grows with the collection: each wing claims as many rooms as
  // its exhibits need. Owned here so the canvas and the wayfinder below it read
  // from the same plan.
  const rooms = useMemo(
    () =>
      planRooms({
        computer: works.length,
        investment: investments.length,
      }),
    [works.length, investments.length],
  );
  const [roomIndex, setRoomIndex] = useState(() =>
    roomIndexForX(rooms, spawnTile(rooms).tileX * TILE_SIZE),
  );

  // Deep link: `/lab?exhibit=<slug>` starts the visitor in front of that piece.
  // Read once, on mount, so later URL rewrites (below) never restart the scene.
  // The home-page preview is an attract reel, not a destination, so it opts out.
  const [initialExhibit] = useState<string | null>(() => {
    if (attract || typeof window === "undefined") return null;
    try {
      return new URLSearchParams(window.location.search).get("exhibit");
    } catch {
      return null;
    }
  });

  // Keep the address bar pointed at whatever the visitor is looking at, so the
  // link they copy reopens on this exhibit. replaceState keeps the back button
  // pointing wherever they came from rather than filling it with exhibits.
  useEffect(() => {
    if (attract || typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      const slug = selected?.slug ?? null;
      if (url.searchParams.get("exhibit") === slug) return;
      if (slug) url.searchParams.set("exhibit", slug);
      else url.searchParams.delete("exhibit");
      window.history.replaceState(null, "", url);
    } catch {
      /* history unavailable — sharing just falls back to the plain /lab URL */
    }
  }, [selected, attract]);

  useEffect(() => {
    try {
      setCoarsePointer(window.matchMedia("(pointer: coarse)").matches);
    } catch {
      /* matchMedia unavailable — assume a precise pointer */
    }
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem(SOUND_PREF_KEY) === "1") setMuted(false);
    } catch {
      /* storage blocked — stay muted */
    }
  }, []);

  function toggleMuted() {
    setMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SOUND_PREF_KEY, next ? "0" : "1");
      } catch {
        /* storage blocked — preference just won't persist */
      }
      return next;
    });
  }

  const workBySlug = useMemo(
    () => new Map(works.map((w) => [w.slug, w])),
    [works],
  );
  const investmentBySlug = useMemo(
    () => new Map(investments.map((inv) => [inv.slug, inv])),
    [investments],
  );

  function switchToList() {
    if (typeof window !== "undefined" && window.__setLabView) {
      window.__setLabView("list");
    }
  }

  const selectedWork =
    selected?.kind === "computer" ? workBySlug.get(selected.slug) : undefined;
  const selectedInvestment =
    selected?.kind === "investment"
      ? investmentBySlug.get(selected.slug)
      : undefined;
  const modalOpen = Boolean(selectedWork || selectedInvestment);
  const showAttractOverlay = attract && !controlled;

  return (
    <div
      className="museum-root"
      style={{
        maxWidth: `${CANVAS_W * 2}px`,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "0.5rem",
          marginBottom: "0.75rem",
        }}
      >
        <SoundToggle muted={muted} onToggle={toggleMuted} />
        {/* The list-view fallback only exists on the full /lab page (it swaps the
            host markup via window.__setLabView). The home-page preview has no
            such host, so the toggle would be a dead button there — hide it and
            let the prominent "Enter the full Lab" link carry that intent. */}
        {!attract && <ListViewToggle onSwitch={switchToList} />}
      </div>
      <div
        style={{
          position: "relative",
          aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
        }}
      >
        <MuseumCanvas
          works={works}
          investments={investments}
          rooms={rooms}
          onRoomChange={setRoomIndex}
          initialExhibit={initialExhibit}
          onFocusChange={setFocus}
          onInteract={setSelected}
          paused={modalOpen}
          muted={muted}
          attract={attract}
          onUserControl={() => setControlled(true)}
        />
        <InteractPrompt
          focused={modalOpen ? null : focus}
          tileSize={TILE_SIZE}
          canvasW={CANVAS_W}
          canvasH={CANVAS_H}
        />
        {showAttractOverlay && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              background:
                "radial-gradient(ellipse at center, rgba(6,8,12,0.15) 0%, rgba(6,8,12,0.55) 100%)",
              borderRadius: "0.75rem",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.55rem 1.05rem",
                borderRadius: "9999px",
                background: "rgba(10, 10, 12, 0.82)",
                border: "1px solid rgba(0, 216, 255, 0.45)",
                boxShadow: "0 0 30px rgba(0,216,255,0.15)",
                color: "#dfeff3",
                fontSize: "0.8rem",
                fontFamily:
                  '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
                letterSpacing: "0.03em",
                whiteSpace: "nowrap",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
              }}
            >
              <span
                style={{
                  width: "0.5rem",
                  height: "0.5rem",
                  borderRadius: "9999px",
                  background: "#00D8FF",
                  boxShadow: "0 0 8px #00D8FF",
                  animation: "museum-attract-pulse 1.6s ease-in-out infinite",
                }}
              />
              {coarsePointer
                ? "Tap to take control · drag to move"
                : "Click to take control · click to walk"}
            </span>
          </div>
        )}
      </div>
      <RoomWayfinder rooms={rooms} current={roomIndex} />
      {selectedWork && (
        <ItemModal
          kind="computer"
          work={selectedWork}
          onClose={() => setSelected(null)}
        />
      )}
      {selectedInvestment && (
        <ItemModal
          kind="investment"
          investment={selectedInvestment}
          onClose={() => setSelected(null)}
        />
      )}
      <nav aria-label="Exhibits" className="sr-only">
        <h2>Exhibits</h2>
        <ul>
          {works.map((w) => (
            <li key={`work-${w.slug}`}>
              <a href={`/works/${w.slug}`}>{w.title}</a>
            </li>
          ))}
          {investments.map((inv) => (
            <li key={`inv-${inv.slug}`}>
              <a href={inv.url ?? "/investments"}>{inv.company}</a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export default Museum;
