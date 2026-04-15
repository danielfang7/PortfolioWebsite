import { useEffect, useRef } from "react";

/*
 * Simplex-inspired 2D noise (good enough for visual flow fields).
 * Produces smooth, continuous noise without external dependencies.
 */
const PERM = new Uint8Array(512);
(function buildPerm() {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) PERM[i] = p[i & 255];
})();

const GRAD = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [0, 1], [0, -1],
];

function noise2D(x: number, y: number): number {
  const xi = Math.floor(x) & 255;
  const yi = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);

  const aa = PERM[PERM[xi] + yi] & 7;
  const ab = PERM[PERM[xi] + yi + 1] & 7;
  const ba = PERM[PERM[xi + 1] + yi] & 7;
  const bb = PERM[PERM[xi + 1] + yi + 1] & 7;

  const d00 = GRAD[aa][0] * xf + GRAD[aa][1] * yf;
  const d10 = GRAD[ba][0] * (xf - 1) + GRAD[ba][1] * yf;
  const d01 = GRAD[ab][0] * xf + GRAD[ab][1] * (yf - 1);
  const d11 = GRAD[bb][0] * (xf - 1) + GRAD[bb][1] * (yf - 1);

  const x1 = d00 + u * (d10 - d00);
  const x2 = d01 + u * (d11 - d01);
  return x1 + v * (x2 - x1);
}

interface FlowParticle {
  x: number;
  y: number;
  age: number;
  maxAge: number;
}

const PARTICLE_COUNT = 2000;
const NOISE_SCALE = 0.003;
const SPEED = 1.8;

export function FlowField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    let time = 0;
    let mouse = { x: -9999, y: -9999 };
    let particles: FlowParticle[] = [];
    let w = 0;
    let h = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const rect = canvas!.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Clear trails on resize
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, w, h);
    }

    function spawnParticle(): FlowParticle {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        age: 0,
        maxAge: 80 + Math.random() * 120,
      };
    }

    function init() {
      resize();
      particles = Array.from({ length: PARTICLE_COUNT }, spawnParticle);
    }

    function draw() {
      time += 0.002;

      // Semi-transparent overlay for trail effect
      ctx.fillStyle = "rgba(10, 10, 10, 0.04)";
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.age++;

        if (p.age > p.maxAge || p.x < 0 || p.x > w || p.y < 0 || p.y > h) {
          particles[i] = spawnParticle();
          continue;
        }

        const n = noise2D(p.x * NOISE_SCALE, p.y * NOISE_SCALE + time);
        let angle = n * Math.PI * 4;

        // Mouse influence — warp the flow around cursor
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200 && dist > 0) {
          const influence = (200 - dist) / 200;
          const mouseAngle = Math.atan2(dy, dx) + Math.PI * 0.5;
          angle += (mouseAngle - angle) * influence * 0.5;
        }

        const prevX = p.x;
        const prevY = p.y;
        p.x += Math.cos(angle) * SPEED;
        p.y += Math.sin(angle) * SPEED;

        // Color based on angle + age fade
        const lifeFraction = p.age / p.maxAge;
        const alpha = Math.sin(lifeFraction * Math.PI) * 0.6;
        const hue = ((angle / (Math.PI * 2)) * 60 + 250) % 360; // purple-blue range

        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = `hsla(${hue}, 70%, 65%, ${alpha})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    }

    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }

    function onMouseLeave() {
      mouse.x = -9999;
      mouse.y = -9999;
    }

    init();
    raf = requestAnimationFrame(draw);

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("resize", () => {
      resize();
      particles = Array.from({ length: PARTICLE_COUNT }, spawnParticle);
    });

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
