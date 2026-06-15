/**
 * Procedural sound for the museum, synthesized with the Web Audio API — no asset
 * files to ship or license. Three layers:
 *   - a low ambient gallery hum (two detuned oscillators under a lowpass),
 *   - footstep ticks fired on each stride,
 *   - short UI cues for focusing and opening an exhibit.
 *
 * Browsers block audio until a user gesture, so the context starts suspended
 * and `resume()` (wired to the first key/tap) brings it to life. Everything
 * routes through a master gain that the mute toggle drives to silence.
 */

export type MuseumAudio = {
  /** Resume the context after a user gesture; starts the ambient hum once. */
  resume: () => void;
  footstep: () => void;
  focus: () => void;
  interact: () => void;
  setMuted: (muted: boolean) => void;
  destroy: () => void;
};

const MASTER_LEVEL = 0.5;

export function createAudio(initialMuted: boolean): MuseumAudio {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let humStarted = false;
  let muted = initialMuted;
  let footTick = 0; // alternate footstep pitch for a left/right feel

  function ensureContext(): AudioContext | null {
    if (ctx) return ctx;
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : MASTER_LEVEL;
    master.connect(ctx.destination);
    return ctx;
  }

  function startHum(): void {
    if (humStarted || !ctx || !master) return;
    humStarted = true;

    const bus = ctx.createGain();
    bus.gain.value = 0.12;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 320;
    bus.connect(filter);
    filter.connect(master);

    // Two slightly detuned low oscillators beat against each other for a warm,
    // non-static drone.
    for (const freq of [55, 55.4]) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(bus);
      osc.start();
    }

    // A breathing LFO on the bus gain keeps the room from sounding flat.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.05;
    lfo.connect(lfoGain);
    lfoGain.connect(bus.gain);
    lfo.start();
  }

  /** Short enveloped tone helper. */
  function blip(
    freq: number,
    duration: number,
    type: OscillatorType,
    peak: number,
  ): void {
    if (!ctx || !master || muted) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  return {
    resume: () => {
      const c = ensureContext();
      if (!c) return;
      if (c.state === "suspended") void c.resume();
      startHum();
    },
    footstep: () => {
      footTick ^= 1;
      // Soft low thud, alternating pitch per foot.
      blip(footTick ? 92 : 84, 0.09, "triangle", 0.18);
    },
    focus: () => blip(880, 0.07, "sine", 0.06),
    interact: () => {
      // Two-note rising chime.
      blip(660, 0.12, "sine", 0.12);
      window.setTimeout(() => blip(990, 0.16, "sine", 0.1), 90);
    },
    setMuted: (m: boolean) => {
      muted = m;
      if (master && ctx) {
        master.gain.setTargetAtTime(
          m ? 0 : MASTER_LEVEL,
          ctx.currentTime,
          0.02,
        );
      }
    },
    destroy: () => {
      if (ctx) void ctx.close();
      ctx = null;
      master = null;
      humStarted = false;
    },
  };
}
