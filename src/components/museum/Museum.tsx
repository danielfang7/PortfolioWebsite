import { useEffect, useMemo, useState } from "react";
import MuseumCanvas, { CANVAS_W, CANVAS_H, TILE_SIZE } from "./MuseumCanvas";
import type { Interactable } from "./engine/interactables";
import InteractPrompt from "./ui/InteractPrompt";
import ListViewToggle from "./ui/ListViewToggle";
import SoundToggle from "./ui/SoundToggle";
import ItemModal from "./ui/ItemModal";
import type { Experiment } from "@/data/experiments";
import type { WorkRef } from "./data";

export type MuseumProps = {
  experiments: Experiment[];
  works: WorkRef[];
};

declare global {
  interface Window {
    __setLabView?: (mode: "museum" | "list") => void;
  }
}

const SOUND_PREF_KEY = "museumSoundOn";

export function Museum({ experiments, works }: MuseumProps) {
  const [focus, setFocus] = useState<Interactable | null>(null);
  const [selected, setSelected] = useState<Interactable | null>(null);
  // Sound is opt-in: start muted, then honor the visitor's saved preference.
  const [muted, setMuted] = useState(true);

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

  function switchToList() {
    if (typeof window !== "undefined" && window.__setLabView) {
      window.__setLabView("list");
    }
  }

  const selectedExperiment =
    selected?.kind === "painting" ? expBySlug.get(selected.slug) : undefined;
  const selectedWork =
    selected?.kind === "computer" ? workBySlug.get(selected.slug) : undefined;
  const modalOpen = Boolean(selectedExperiment || selectedWork);

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
          onFocusChange={setFocus}
          onInteract={setSelected}
          paused={modalOpen}
          muted={muted}
        />
        <InteractPrompt
          focused={modalOpen ? null : focus}
          tileSize={TILE_SIZE}
          canvasW={CANVAS_W}
          canvasH={CANVAS_H}
        />
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
        </ul>
      </nav>
    </div>
  );
}

export default Museum;
