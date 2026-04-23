import { useState } from "react";
import MuseumCanvas, { CANVAS_W, CANVAS_H, TILE_SIZE } from "./MuseumCanvas";
import type { Interactable } from "./engine/interactables";
import InteractPrompt from "./ui/InteractPrompt";
import ListViewToggle from "./ui/ListViewToggle";
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

export function Museum({ experiments, works }: MuseumProps) {
  const [focus, setFocus] = useState<Interactable | null>(null);

  function switchToList() {
    if (typeof window !== "undefined" && window.__setLabView) {
      window.__setLabView("list");
    }
  }

  return (
    <div
      className="museum-root"
      style={{
        maxWidth: `${CANVAS_W * 2}px`,
        margin: "0 auto",
      }}
    >
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.75rem" }}>
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
        />
        <InteractPrompt
          focused={focus}
          tileSize={TILE_SIZE}
          canvasW={CANVAS_W}
          canvasH={CANVAS_H}
        />
      </div>
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
