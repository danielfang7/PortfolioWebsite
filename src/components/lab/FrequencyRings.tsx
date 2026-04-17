import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Frequency Rings — Concentric SVG rings pulsing from microphone input.
 * Falls back to a procedural sine-wave animation if mic is denied.
 */

const RING_COUNT = 10;
const COLORS = [
  "#00D8FF", "#A78BFA", "#38BDF8", "#06B6D4", "#10B981",
  "#F59E0B", "#EF4444", "#EC4899", "#C084FC", "#818CF8",
];

interface RingState {
  scale: number;
  rotation: number;
  dashOffset: number;
  opacity: number;
}

export function FrequencyRings() {
  const [rings, setRings] = useState<RingState[]>(() =>
    Array.from({ length: RING_COUNT }, () => ({
      scale: 1,
      rotation: 0,
      dashOffset: 0,
      opacity: 0.5,
    })),
  );
  const [micActive, setMicActive] = useState(false);
  const [fallback, setFallback] = useState(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array>(new Uint8Array(0));
  const rafRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Start the animation loop
  const startLoop = useCallback((useMic: boolean) => {
    let t = 0;

    function tick() {
      t += 0.016;
      const newRings: RingState[] = [];

      if (useMic && analyserRef.current && dataRef.current.length > 0) {
        analyserRef.current.getByteFrequencyData(dataRef.current);
        const binSize = Math.floor(dataRef.current.length / RING_COUNT);

        for (let i = 0; i < RING_COUNT; i++) {
          let sum = 0;
          for (let j = 0; j < binSize; j++) {
            sum += dataRef.current[i * binSize + j];
          }
          const avg = sum / binSize / 255;
          newRings.push({
            scale: 1 + avg * 0.4,
            rotation: t * (8 + i * 3) + avg * 30,
            dashOffset: avg * 50,
            opacity: 0.3 + avg * 0.6,
          });
        }
      } else {
        // Procedural fallback — layered sine waves
        for (let i = 0; i < RING_COUNT; i++) {
          const phase = i * 0.4;
          const wave = Math.sin(t * 1.5 + phase) * 0.5 + 0.5;
          const wave2 = Math.sin(t * 0.8 + phase * 1.3) * 0.5 + 0.5;
          newRings.push({
            scale: 1 + wave * 0.2,
            rotation: t * (5 + i * 2),
            dashOffset: wave2 * 40,
            opacity: 0.25 + wave * 0.35,
          });
        }
      }

      setRings(newRings);
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // Enable microphone
  const enableMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      dataRef.current = new Uint8Array(analyser.frequencyBinCount);
      setMicActive(true);
      // Restart loop with mic
      cancelAnimationFrame(rafRef.current);
      startLoop(true);
    } catch {
      setFallback(true);
    }
  }, [startLoop]);

  // Start fallback loop on mount
  useEffect(() => {
    setFallback(true);
    startLoop(false);
    return () => cancelAnimationFrame(rafRef.current);
  }, [startLoop]);

  const size = 500;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: "#0a0a0a",
      }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        style={{ width: "min(90vw, 90vh)", height: "min(90vw, 90vh)" }}
      >
        {rings.map((ring, i) => {
          const baseR = 30 + i * 22;
          const circumference = 2 * Math.PI * baseR;
          const dashLen = circumference * 0.6;
          const gapLen = circumference * 0.4;

          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={baseR}
              fill="none"
              stroke={COLORS[i]}
              strokeWidth={2 + (RING_COUNT - i) * 0.15}
              strokeDasharray={`${dashLen} ${gapLen}`}
              strokeDashoffset={ring.dashOffset}
              strokeLinecap="round"
              opacity={ring.opacity}
              style={{
                transform: `rotate(${ring.rotation}deg) scale(${ring.scale})`,
                transformOrigin: `${cx}px ${cy}px`,
                transition: "opacity 0.1s",
                filter: `blur(${ring.opacity > 0.5 ? 0.5 : 0}px) drop-shadow(0 0 ${4 + ring.opacity * 6}px ${COLORS[i]}40)`,
              }}
            />
          );
        })}
        {/* Center glow */}
        <circle
          cx={cx}
          cy={cy}
          r="8"
          fill={COLORS[0]}
          opacity={0.6 + (rings[0]?.scale ?? 1 - 1) * 2}
          style={{
            filter: `blur(3px) drop-shadow(0 0 12px ${COLORS[0]})`,
          }}
        />
      </svg>

      {/* Mic prompt */}
      {!micActive && (
        <button
          onClick={enableMic}
          style={{
            position: "absolute",
            bottom: "8%",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "8px 20px",
            borderRadius: "9999px",
            background: "rgba(0, 216, 255, 0.15)",
            border: "1px solid rgba(0, 216, 255, 0.3)",
            color: "#A78BFA",
            fontSize: "13px",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0, 216, 255, 0.25)";
            e.currentTarget.style.borderColor = "rgba(0, 216, 255, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0, 216, 255, 0.15)";
            e.currentTarget.style.borderColor = "rgba(0, 216, 255, 0.3)";
          }}
        >
          {fallback ? "Enable microphone for live audio" : "Connecting..."}
        </button>
      )}
    </div>
  );
}
