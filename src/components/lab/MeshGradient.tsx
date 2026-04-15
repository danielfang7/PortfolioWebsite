import { useEffect, useRef } from "react";

interface Blob {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  color: [number, number, number];
}

const COLORS: [number, number, number][] = [
  [108, 99, 255],  // accent
  [167, 139, 250], // purple
  [56, 189, 248],  // cyan
  [236, 72, 153],  // pink
  [16, 185, 129],  // emerald
];

export function MeshGradient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    let mouse = { x: -9999, y: -9999 };
    let blobs: Blob[] = [];

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
      const minDim = Math.min(w, h);

      blobs = COLORS.map((color, i) => ({
        x: w * 0.2 + Math.random() * w * 0.6,
        y: h * 0.2 + Math.random() * h * 0.6,
        radius: minDim * (0.25 + Math.random() * 0.15),
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        color,
      }));
    }

    function draw() {
      const w = canvas!.getBoundingClientRect().width;
      const h = canvas!.getBoundingClientRect().height;

      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, w, h);

      // Set composite for additive-style blending
      ctx.globalCompositeOperation = "lighter";

      for (const blob of blobs) {
        // Mouse attraction (gentle)
        const dx = mouse.x - blob.x;
        const dy = mouse.y - blob.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 400 && dist > 0) {
          const pull = 0.15 * (1 - dist / 400);
          blob.vx += (dx / dist) * pull;
          blob.vy += (dy / dist) * pull;
        }

        // Damping
        blob.vx *= 0.995;
        blob.vy *= 0.995;

        blob.x += blob.vx;
        blob.y += blob.vy;

        // Soft bounce off edges
        const margin = blob.radius * 0.3;
        if (blob.x < margin) blob.vx += 0.1;
        if (blob.x > w - margin) blob.vx -= 0.1;
        if (blob.y < margin) blob.vy += 0.1;
        if (blob.y > h - margin) blob.vy -= 0.1;

        // Draw radial gradient blob
        const grad = ctx.createRadialGradient(
          blob.x,
          blob.y,
          0,
          blob.x,
          blob.y,
          blob.radius,
        );
        const [r, g, b] = blob.color;
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.35)`);
        grad.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.15)`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";

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
    window.addEventListener("resize", () => { resize(); });

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
