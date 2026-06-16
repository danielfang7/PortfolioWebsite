import { useEffect, useMemo, useState } from "react";
import MuseumCanvas, { CANVAS_W, CANVAS_H, TILE_SIZE } from "./MuseumCanvas";
import type { Interactable } from "./engine/interactables";
import InteractPrompt from "./ui/InteractPrompt";
import ListViewToggle from "./ui/ListViewToggle";
import SoundToggle from "./ui/SoundToggle";
import ItemModal from "./ui/ItemModal";
import type { Experiment } from "@/data/experiments";
import type { WorkRef, InvestmentRef } from "./data";

export type MuseumProps = {
  experiments: Experiment[];
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

export function Museum({ experiments, works, investments, attract = false }: MuseumProps) {
  const [focus, setFocus] = useState<Interactable | null>(null);
  const [selected, setSelected] = useState<Interactable | null>(null);
  // Sound is opt-in: start muted, then honor the visitor's saved preference.
  const [muted, setMuted] = useState(true);
  // Attract mode only: tracks whether the visitor has taken control yet, so the
  // "click to take control" overlay can fade away on their first interaction.
  const [controlled, setControlled] = useState(false);

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

  const expBySlug = useMemo(
    () => new Map(experiments.map((e) => [e.slug, e])),
    [experiments],
  );
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

  const selectedExperiment =
    selected?.kind === "painting" ? expBySlug.get(selected.slug) : undefined;
  const selectedWork =
    selected?.kind === "computer" ? workBySlug.get(selected.slug) : undefined;
  const selectedInvestment =
    selected?.kind === "investment"
      ? investmentBySlug.get(selected.slug)
      : undefined;
  const modalOpen = Boolean(
    selectedExperiment || selectedWork || selectedInvestment,
  );
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
        <ListViewToggle onSwitch={switchToList} />
      </div>
      <div
        style={{
          position: "relative",
          aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
        }}
      >
        <MuseumCanvas
          experiments={experiments}
          works={works}
          investments={investments}
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
              Click to take control · WASD to move
            </span>
          </div>
        )}
      </div>
      {selectedExperiment && (
        <ItemModal
          kind="painting"
          experiment={selectedExperiment}
          onClose={() => setSelected(null)}
        />
      )}
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
          {experiments.map((e) => (
            <li key={`lab-${e.slug}`}>
              <a href={`/lab/${e.slug}`}>{e.title}</a>
            </li>
          ))}
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
