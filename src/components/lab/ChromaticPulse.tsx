import { useEffect, useRef } from "react";

/**
 * Chromatic Pulse — Animatable CSS gradients driven by mouse position.
 *
 * Uses CSS @property to register custom properties so the browser can
 * natively transition hue / angle / stop values. No JS animation loop —
 * all interpolation is handled by CSS transitions.
 */
export function ChromaticPulse() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Inject @property rules (they must be at top-level stylesheet)
    const style = document.createElement("style");
    style.textContent = `
      @property --cp-hue-1 {
        syntax: "<number>";
        inherits: true;
        initial-value: 250;
      }
      @property --cp-hue-2 {
        syntax: "<number>";
        inherits: true;
        initial-value: 300;
      }
      @property --cp-hue-3 {
        syntax: "<number>";
        inherits: true;
        initial-value: 190;
      }
      @property --cp-angle {
        syntax: "<angle>";
        inherits: true;
        initial-value: 135deg;
      }
      @property --cp-x {
        syntax: "<percentage>";
        inherits: true;
        initial-value: 50%;
      }
      @property --cp-y {
        syntax: "<percentage>";
        inherits: true;
        initial-value: 50%;
      }
    `;
    document.head.appendChild(style);

    // Idle animation via interval — gentle hue drift
    let idleRaf: number;
    let t = 0;
    function idleTick() {
      t += 0.003;
      el!.style.setProperty("--cp-hue-1", String(250 + Math.sin(t) * 40));
      el!.style.setProperty("--cp-hue-2", String(300 + Math.sin(t * 0.7 + 1) * 50));
      el!.style.setProperty("--cp-hue-3", String(190 + Math.sin(t * 0.5 + 2) * 35));
      el!.style.setProperty("--cp-angle", `${135 + Math.sin(t * 0.3) * 30}deg`);
      idleRaf = requestAnimationFrame(idleTick);
    }
    idleRaf = requestAnimationFrame(idleTick);

    function onPointerMove(e: PointerEvent) {
      const rect = el!.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * 100;
      const py = ((e.clientY - rect.top) / rect.height) * 100;
      el!.style.setProperty("--cp-x", `${px}%`);
      el!.style.setProperty("--cp-y", `${py}%`);

      // Shift hues towards pointer position
      const hueShift = (px - 50) * 0.8;
      el!.style.setProperty("--cp-hue-1", String(250 + hueShift));
      el!.style.setProperty("--cp-hue-2", String(300 + hueShift * 0.6));
    }

    function onPointerLeave() {
      el!.style.setProperty("--cp-x", "50%");
      el!.style.setProperty("--cp-y", "50%");
    }

    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerleave", onPointerLeave);

    return () => {
      cancelAnimationFrame(idleRaf);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerleave", onPointerLeave);
      style.remove();
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        cursor: "crosshair",
        transition:
          "--cp-x 0.6s cubic-bezier(0.16, 1, 0.3, 1), --cp-y 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Layer 1: conic gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "conic-gradient(from var(--cp-angle) at var(--cp-x) var(--cp-y), hsl(var(--cp-hue-1) 80% 55%), hsl(var(--cp-hue-2) 75% 50%), hsl(var(--cp-hue-3) 70% 55%), hsl(var(--cp-hue-1) 80% 55%))",
          opacity: 0.6,
          filter: "blur(60px)",
        }}
      />
      {/* Layer 2: radial highlight at pointer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle 400px at var(--cp-x) var(--cp-y), hsl(var(--cp-hue-2) 90% 70% / 0.4), transparent 70%)",
          mixBlendMode: "screen",
        }}
      />
      {/* Layer 3: second conic, counter-rotated */}
      <div
        style={{
          position: "absolute",
          inset: "-20%",
          background:
            "conic-gradient(from calc(var(--cp-angle) + 180deg) at 60% 40%, hsl(var(--cp-hue-3) 70% 50% / 0.5), transparent 40%, hsl(var(--cp-hue-1) 80% 60% / 0.3), transparent 80%)",
          filter: "blur(80px)",
          mixBlendMode: "screen",
        }}
      />
      {/* Grain overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.04,
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
          backgroundSize: "128px",
          mixBlendMode: "overlay",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
