import { lazy, type LazyExoticComponent, type ComponentType } from "react";

/**
 * Lazy-loaded experiment components keyed by slug. Only paintings with an entry
 * here mount a live preview; others (notably frequency-rings — asks for mic
 * permission) fall back to the static tinted inner painting area.
 */
export const LIVE_PAINTINGS: Record<
  string,
  LazyExoticComponent<ComponentType> | undefined
> = {
  "particle-field": lazy(() =>
    import("@/components/lab/ParticleField").then((m) => ({
      default: m.ParticleField,
    })),
  ),
  "mesh-gradient": lazy(() =>
    import("@/components/lab/MeshGradient").then((m) => ({
      default: m.MeshGradient,
    })),
  ),
  "flow-field": lazy(() =>
    import("@/components/lab/FlowField").then((m) => ({
      default: m.FlowField,
    })),
  ),
  "chromatic-pulse": lazy(() =>
    import("@/components/lab/ChromaticPulse").then((m) => ({
      default: m.ChromaticPulse,
    })),
  ),
  "vertex-terrain": lazy(() =>
    import("@/components/lab/VertexTerrain").then((m) => ({
      default: m.VertexTerrain,
    })),
  ),
  // frequency-rings intentionally omitted — prompts for mic, not desired in a
  // passive preview. Static tint on the painting inner handles its frame.
};
