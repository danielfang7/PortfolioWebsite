export type Experiment = {
  slug: string;
  title: string;
  description: string;
  tech: string[];
  color: string;
  year: string;
};

export const experiments: Experiment[] = [
  {
    slug: "particle-field",
    title: "Particle Field",
    description:
      "Mouse-reactive particle network with proximity connections and repulsion physics.",
    tech: ["Canvas 2D", "requestAnimationFrame", "Spatial hashing"],
    color: "#00D8FF",
    year: "2026",
  },
  {
    slug: "mesh-gradient",
    title: "Mesh Gradient",
    description:
      "Organic gradient blobs using additive blending with gentle mouse attraction.",
    tech: ["Canvas 2D", "Radial gradients", "Composite ops"],
    color: "#A78BFA",
    year: "2026",
  },
  {
    slug: "flow-field",
    title: "Flow Field",
    description:
      "Perlin noise-driven particle flow with trail persistence and cursor warping.",
    tech: ["Canvas 2D", "Noise functions", "Trail rendering"],
    color: "#38BDF8",
    year: "2026",
  },
  {
    slug: "chromatic-pulse",
    title: "Chromatic Pulse",
    description:
      "Animatable CSS gradients driven by mouse position using @property registered custom properties.",
    tech: ["CSS @property", "conic-gradient", "mix-blend-mode"],
    color: "#EC4899",
    year: "2026",
  },
  {
    slug: "vertex-terrain",
    title: "Vertex Terrain",
    description:
      "Real-time 3D terrain mesh rendered with raw WebGL2 shaders, displaced by simplex noise.",
    tech: ["WebGL2", "GLSL shaders", "Simplex noise"],
    color: "#10B981",
    year: "2026",
  },
  {
    slug: "frequency-rings",
    title: "Frequency Rings",
    description:
      "Concentric SVG rings pulsing from microphone frequency bands with procedural fallback.",
    tech: ["Web Audio API", "SVG animation", "getUserMedia"],
    color: "#F59E0B",
    year: "2026",
  },
];
