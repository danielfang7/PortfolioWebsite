import { gsap } from "gsap";

const magneticInited = new WeakSet<HTMLElement>();

/**
 * Subtle magnetic pull on primary CTAs (pointer devices only).
 * Expects: [data-magnetic] with child .magnetic-cta__inner
 */
export function initMagneticCTAs(): void {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.matchMedia("(pointer: coarse)").matches) return;

  const els = document.querySelectorAll<HTMLElement>("[data-magnetic]");
  if (els.length === 0) return;

  const strength = 0.22;

  els.forEach((root) => {
    if (magneticInited.has(root)) return;
    const inner = root.querySelector<HTMLElement>(".magnetic-cta__inner");
    if (!inner) return;
    magneticInited.add(root);

    const onMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) * strength;
      const dy = (e.clientY - cy) * strength;
      gsap.to(inner, { x: dx, y: dy, duration: 0.25, ease: "power2.out", overwrite: "auto" });
    };

    const onLeave = () => {
      gsap.to(inner, { x: 0, y: 0, duration: 0.45, ease: "power3.out" });
    };

    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("pointercancel", onLeave);
  });
}
