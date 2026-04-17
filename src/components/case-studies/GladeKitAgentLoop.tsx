import { useState } from "react";

interface Runtime {
  id: string;
  label: string;
  sublabel: string;
  color: string;
  desc: string;
  items: string[];
}

const RUNTIMES: Runtime[] = [
  {
    id: "unity",
    label: "Unity Editor Plugin",
    sublabel: "C# / Unity 6",
    color: "#10B981",
    desc: "Runs inside the Unity Editor process. Gathers live project context (scene hierarchy, script contents, installed packages, selected objects) and exposes 220+ typed tools via an embedded HTTP server. All Editor API calls are dispatched to Unity's main thread via EditorApplication.delayCall — the entire Editor API is single-threaded.",
    items: ["220+ typed tools", "Live scene context", "HTTP bridge server", "EditorApplication.delayCall dispatch"],
  },
  {
    id: "backend",
    label: "Cloud Backend",
    sublabel: "FastAPI / AWS ECS",
    color: "#00D8FF",
    desc: "The orchestration brain. Runs a streaming agentic loop: receives user prompts from Electron, filters relevant tools, augments with RAG-retrieved Unity documentation, injects conversation and project memory, streams model responses, and dispatches tool calls mid-stream to the Unity bridge. Dockerized on AWS ECS/Fargate with an ALB for routing.",
    items: ["Streaming agentic loop", "RAG documentation injection", "Multi-model support (OpenAI/Anthropic/Gemini)", "Redis-backed caching & cost tracking"],
  },
  {
    id: "electron",
    label: "Electron Desktop App",
    sublabel: "TypeScript / React",
    color: "#F59E0B",
    desc: "The user-facing surface. Handles chat UI, streaming display, authentication, and session management. Distributes as a signed, auto-updating app on macOS and Windows via S3-hosted update flows. Connects to the cloud backend for AI orchestration and listens to Unity via the embedded HTTP bridge.",
    items: ["Chat & streaming UI", "Auth & session management", "Signed macOS + Windows releases", "S3 auto-updater flow"],
  },
];

interface Flow {
  from: string;
  to: string;
  label: string;
  color: string;
}

const FLOWS: Flow[] = [
  { from: "electron", to: "backend", label: "user prompt + project context", color: "#F59E0B" },
  { from: "backend", to: "unity", label: "tool dispatch (HTTP POST)", color: "#00D8FF" },
  { from: "unity", to: "backend", label: "tool results", color: "#10B981" },
  { from: "backend", to: "electron", label: "streamed response", color: "#A78BFA" },
];

export function GladeKitAgentLoop() {
  const [selected, setSelected] = useState<string>("backend");

  const selectedRuntime = RUNTIMES.find((r) => r.id === selected) ?? RUNTIMES[1];

  return (
    <>
      <style>{`
        @keyframes glkPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.15); }
        }
        @keyframes glkFlowH {
          0%   { left: -10px; opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { left: calc(100% + 2px); opacity: 0; }
        }
        @keyframes glkFlowHBack {
          0%   { right: -10px; opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { right: calc(100% + 2px); opacity: 0; }
        }
        .glk-card {
          transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
          cursor: pointer;
        }
        .glk-card:hover { transform: translateY(-2px); }
        .glk-card[aria-pressed="true"] { transform: translateY(-3px); }
        .glk-detail {
          animation: glkFadeIn 0.18s ease forwards;
        }
        @keyframes glkFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <p style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#555", marginBottom: "20px" }}>
          Click any runtime to inspect
        </p>

        {/* Three-column runtime layout with connectors */}
        <div style={{ overflowX: "auto", paddingBottom: "4px", paddingTop: "4px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 64px 1fr 64px 1fr",
              alignItems: "center",
              gap: "0",
              minWidth: "560px",
            }}
          >
            {RUNTIMES.map((runtime, i) => (
              <>
                <RuntimeCard
                  key={runtime.id}
                  runtime={runtime}
                  selected={selected === runtime.id}
                  onClick={() => setSelected(runtime.id)}
                />
                {i < RUNTIMES.length - 1 && (
                  <div key={`conn-${i}`} style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "0 4px" }}>
                    {/* Forward flow */}
                    <FlowConnector
                      color={FLOWS[i * 2]?.color ?? "#00D8FF"}
                      direction="right"
                      delay={i * 0.5}
                      label={i === 0 ? "prompt" : "results"}
                    />
                    {/* Return flow */}
                    <FlowConnector
                      color={FLOWS[i * 2 + 1]?.color ?? "#A78BFA"}
                      direction="left"
                      delay={i * 0.5 + 1.1}
                      label={i === 0 ? "stream" : "dispatch"}
                    />
                  </div>
                )}
              </>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div
          key={selectedRuntime.id}
          className="glk-detail"
          style={{
            marginTop: "20px",
            padding: "16px 20px",
            borderRadius: "12px",
            border: `1px solid ${selectedRuntime.color}3a`,
            background: `${selectedRuntime.color}0d`,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: selectedRuntime.color }}>
              {selectedRuntime.label}
            </span>
            <span style={{ fontSize: "11px", color: "#555", fontFamily: "'JetBrains Mono', monospace" }}>
              {selectedRuntime.sublabel}
            </span>
          </div>
          <p style={{ fontSize: "13px", color: "#888", lineHeight: "1.65", margin: "0 0 12px" }}>
            {selectedRuntime.desc}
          </p>
          <ul style={{ display: "flex", flexWrap: "wrap", gap: "6px", listStyle: "none", padding: 0, margin: 0 }}>
            {selectedRuntime.items.map((item) => (
              <li
                key={item}
                style={{
                  fontSize: "11px",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  border: `1px solid ${selectedRuntime.color}30`,
                  color: "#888",
                  background: `${selectedRuntime.color}0a`,
                }}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

function RuntimeCard({
  runtime,
  selected,
  onClick,
}: {
  runtime: Runtime;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="glk-card"
      aria-pressed={selected}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        padding: "14px 12px",
        borderRadius: "14px",
        border: `1px solid ${selected ? runtime.color + "70" : "#222"}`,
        background: selected ? `${runtime.color}10` : "#141414",
        boxShadow: selected ? `0 0 0 1px ${runtime.color}28, 0 4px 24px ${runtime.color}15` : "none",
        textAlign: "left",
        width: "100%",
      }}
    >
      {/* Indicator dot */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: runtime.color,
            boxShadow: `0 0 ${selected ? "10px" : "5px"} ${runtime.color}${selected ? "90" : "50"}`,
            flexShrink: 0,
            animationName: selected ? "glkPulse" : "none",
            animationDuration: "2s",
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
          }}
        />
        <span
          style={{
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: selected ? runtime.color : "#555",
            transition: "color 0.2s",
          }}
        >
          {runtime.sublabel}
        </span>
      </div>

      <span
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: selected ? runtime.color : "#F0F0F0",
          lineHeight: 1.3,
          transition: "color 0.2s",
        }}
      >
        {runtime.label}
      </span>

      {/* Feature pills */}
      <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginTop: "2px" }}>
        {runtime.items.slice(0, 2).map((item) => (
          <span
            key={item}
            style={{
              fontSize: "10px",
              color: "#444",
              lineHeight: 1.4,
            }}
          >
            · {item}
          </span>
        ))}
      </div>
    </button>
  );
}

function FlowConnector({
  color,
  direction,
  delay,
  label,
}: {
  color: string;
  direction: "right" | "left";
  delay: number;
  label: string;
}) {
  const isRight = direction === "right";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
      <span style={{ fontSize: "9px", color: "#3a3a3a", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
        {label}
      </span>
      <div style={{ position: "relative", width: "100%", height: "2px", background: "#1e1e1e", overflow: "visible" }}>
        {/* Arrow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            [isRight ? "right" : "left"]: "-1px",
            transform: `translateY(-50%) ${isRight ? "" : "rotate(180deg)"}`,
            width: 0,
            height: 0,
            borderLeft: "4px solid #2a2a2a",
            borderTop: "3px solid transparent",
            borderBottom: "3px solid transparent",
          }}
        />
        {/* Flowing dot */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 5px ${color}`,
            transform: "translateY(-50%)",
            animationName: isRight ? "glkFlowH" : "glkFlowHBack",
            animationDuration: "2.4s",
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
            animationDelay: `${delay}s`,
          }}
        />
      </div>
    </div>
  );
}
