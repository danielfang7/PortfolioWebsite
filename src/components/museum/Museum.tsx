import { useState } from "react";
import MuseumCanvas, {
  CANVAS_W,
  CANVAS_H,
  type FocusEvent,
} from "./MuseumCanvas";
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
  const [focus, setFocus] = useState<FocusEvent | null>(null);

  function switchToList() {
    if (typeof window !== "undefined" && window.__setLabView) {
      window.__setLabView("list");
    }
  }

  return (
    <div
      className="museum-root"
      style={{
        position: "relative",
        maxWidth: `${CANVAS_W * 2}px`,
        margin: "0 auto",
        aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
      }}
    >
      <ListViewToggle onSwitch={switchToList} />
      <MuseumCanvas
        experiments={experiments}
        works={works}
        onFocusChange={setFocus}
      />
      <InteractPrompt
        focused={focus?.interactable ?? null}
        charX={focus?.charX ?? 0}
        charY={focus?.charY ?? 0}
        canvasW={CANVAS_W}
        canvasH={CANVAS_H}
      />
    </div>
  );
}

export default Museum;
