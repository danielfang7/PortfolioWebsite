import type { Character } from "./character";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
};

/**
 * Tiny footstep-dust system. Puffs are spawned at the character's feet on each
 * stride and drift outward while fading — cheap "juice" that grounds the walk
 * cycle. Capped so a long walk can't grow the array unbounded.
 */
export class DustField {
  private particles: Particle[] = [];
  /** Tracks stride crossings so we emit once per footfall, not per frame. */
  private lastPhase = 0;

  /** Call every frame; spawns on stride boundaries, ages everything out. */
  update(ch: Character, dt: number): void {
    if (ch.moving) {
      // Emit when the walk phase crosses a half-cycle (each footfall).
      const half = Math.floor(ch.walkPhase * 2);
      const lastHalf = Math.floor(this.lastPhase * 2);
      if (half !== lastHalf) this.emit(ch);
    }
    this.lastPhase = ch.walkPhase;

    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.9;
      p.vy *= 0.9;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  private emit(ch: Character): void {
    if (this.particles.length > 40) return;
    const count = 2;
    for (let i = 0; i < count; i++) {
      const ang = Math.PI + (i === 0 ? -0.5 : 0.5); // kick out to the sides/back
      const spd = 8 + (i * 3);
      this.particles.push({
        x: ch.x + (i === 0 ? -3 : 3),
        y: ch.y + 7,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd * 0.4,
        life: 0.45,
        maxLife: 0.45,
        size: 2,
      });
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const t = p.life / p.maxLife;
      ctx.globalAlpha = t * 0.4;
      ctx.fillStyle = "#6b7480";
      const s = Math.max(1, Math.round(p.size * t));
      ctx.fillRect(Math.round(p.x), Math.round(p.y), s, s);
    }
    ctx.globalAlpha = 1;
  }
}
