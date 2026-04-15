import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

const PARTICLE_COUNT = 90;
const CONNECTION_DIST = 130;
const MOUSE_RADIUS = 180;
const ACCENT = [108, 99, 255];

export function HeroParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    let mouse = { x: -9999, y: -9999 };
    let particles: Particle[] = [];

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const rect = canvas!.getBoundingClientRect();
      canvas!.width = rect.width * dpr;
      canvas!.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function init() {
      resize();
      const w = canvas!.getBoundingClientRect().width;
      const h = canvas!.getBoundingClientRect().height;
      particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        radius: Math.random() * 1.8 + 0.6,
      }));
    }

    function draw() {
      const w = canvas!.getBoundingClientRect().width;
      const h = canvas!.getBoundingClientRect().height;
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS && dist > 0) {
          const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
          p.vx += (dx / dist) * force * 0.15;
          p.vy += (dy / dist) * force * 0.15;
        }

        p.vx *= 0.98;
        p.vy *= 0.98;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        const mouseDist = Math.sqrt(
          (p.x - mouse.x) ** 2 + (p.y - mouse.y) ** 2,
        );
        const brightness =
          mouseDist < MOUSE_RADIUS * 1.5
            ? 0.35 + 0.25 * (1 - mouseDist / (MOUSE_RADIUS * 1.5))
            : 0.25;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${ACCENT[0]}, ${ACCENT[1]}, ${ACCENT[2]}, ${brightness})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const cx = p.x - q.x;
          const cy = p.y - q.y;
          const cd = Math.sqrt(cx * cx + cy * cy);
          if (cd < CONNECTION_DIST) {
            const alpha = (1 - cd / CONNECTION_DIST) * 0.12;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(${ACCENT[0]}, ${ACCENT[1]}, ${ACCENT[2]}, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(draw);
    }

    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        mouse.x = x;
        mouse.y = y;
      } else {
        mouse.x = -9999;
        mouse.y = -9999;
      }
    }

    init();
    raf = requestAnimationFrame(draw);

    document.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", init);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", init);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
