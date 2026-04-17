import { useState } from "react";

interface Stage {
  id: string;
  name: string;
  tech: string;
  color: string;
  desc: string;
}

const TOP_ROW: Stage[] = [
  {
    id: "mic",
    name: "Microphone",
    tech: "UCapturableSoundWave",
    color: "#A78BFA",
    desc: "Captures 16 kHz float32 PCM from the player's microphone. Push-to-talk lifecycle: key down starts capture; key release finalizes the pass. Includes debounce (<0.2s ignored), short-hold detection (<0.5s = cancelled), and empty-audio validation.",
  },
  {
    id: "whisper",
    name: "Whisper STT",
    tech: "whisper.cpp",
    color: "#38BDF8",
    desc: "Runs on a dedicated background thread receiving raw PCM. Converts speech to text using OpenAI Whisper running entirely on-device — no cloud, no latency overhead. Empty transcripts are discarded before entering the pipeline.",
  },
  {
    id: "chat-s",
    name: "Chat Server RPC",
    tech: "UChatComponent",
    color: "#00D8FF",
    desc: "The chat component on the client forwards transcribed text to the server via Unreal Engine's Server RPC system. Acts as the authoritative bridge between the client input layer and the server-side AI inference pipeline.",
  },
  {
    id: "llm-mgr",
    name: "LLM Manager",
    tech: "ULLMServiceManager",
    color: "#C084FC",
    desc: "Orchestrates model selection, prompt template formatting (ChatML/Llama3, Mistral Instruct, Minitron, or custom Jinja2), and context window management via EContextResetPolicy — four strategies to prevent hitting model limits mid-conversation.",
  },
  {
    id: "llama",
    name: "Llama.cpp",
    tech: "ULlamaComponent",
    color: "#F472B6",
    desc: "Runs GGUF models entirely on-device via LinkGGML, a thin C++ bridge that compiles and stages llama.dll, whisper.dll, and ggml*.dll at build time. Sentence-level streaming means audio for the first sentence begins playing before the full response is generated.",
  },
];

const BOT_ROW: Stage[] = [
  {
    id: "tts",
    name: "TTS Manager",
    tech: "UTTSManager",
    color: "#F59E0B",
    desc: "Routes audio synthesis to ElevenLabs (cloud) or Piper (local). ElevenLabs: responses are segmented sentence-by-sentence, each dispatched via HTTP POST with exponential backoff, audio URLs broadcast to clients via RPC. Piper: ONNX Runtime synthesizes int16 PCM on a background thread — fully offline.",
  },
  {
    id: "chat-c",
    name: "Chat Client RPC",
    tech: "UChatComponent",
    color: "#00D8FF",
    desc: "Receives audio segments from the server via Client RPC and forwards them to the local playback component. Handles sequential ordering of audio chunks to ensure gap-free sentence assembly.",
  },
  {
    id: "audio",
    name: "Audio Playback",
    tech: "UTextToSpeechComponent",
    color: "#10B981",
    desc: "Plays the NPC's synthesized voice. For Piper, reassembles streamed int16 PCM chunks from the server. For ElevenLabs, downloads and decodes MP3 locally. Queues sentences for seamless, sequential playback with no audible gap between segments.",
  },
];

const GRID_COLS = "minmax(110px,1fr) 32px minmax(110px,1fr) 32px minmax(110px,1fr) 32px minmax(110px,1fr) 32px minmax(110px,1fr)";

export function GladeCorePipeline() {
  const [selected, setSelected] = useState<string>("llama");

  const allStages = [...TOP_ROW, ...BOT_ROW];
  const selectedStage = allStages.find((s) => s.id === selected) ?? allStages[4];

  return (
    <>
      <style>{`
        @keyframes glcFlowRight {
          0%   { left: -10px; opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { left: calc(100% + 2px); opacity: 0; }
        }
        @keyframes glcFlowLeft {
          0%   { right: -10px; opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { right: calc(100% + 2px); opacity: 0; }
        }
        @keyframes glcFlowDown {
          0%   { top: -10px; opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { top: calc(100% + 2px); opacity: 0; }
        }
        .glc-node {
          transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
          cursor: pointer;
        }
        .glc-node:hover { transform: translateY(-2px); }
        .glc-node[aria-pressed="true"] { transform: translateY(-3px); }
        .glc-detail {
          animation: glcFadeIn 0.18s ease forwards;
        }
        @keyframes glcFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <p style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#555", marginBottom: "20px" }}>
          Click any stage to inspect
        </p>

        {/* Scrollable pipeline */}
        <div style={{ overflowX: "auto", paddingBottom: "4px", paddingTop: "4px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: GRID_COLS,
              gridTemplateRows: "auto 36px auto",
              alignItems: "center",
              minWidth: "720px",
              gap: "0",
            }}
          >
            {/* ── Row 1: top pipeline (left → right) ── */}
            {TOP_ROW.map((stage, i) => (
              <NodeCell key={stage.id} col={i * 2 + 1} row={1}>
                <StageNode stage={stage} selected={selected === stage.id} onClick={() => setSelected(stage.id)} />
              </NodeCell>
            ))}
            {TOP_ROW.slice(0, -1).map((stage, i) => (
              <ConnCell key={`top-conn-${i}`} col={i * 2 + 2} row={1}>
                <HConnector direction="right" color={TOP_ROW[i + 1].color} delay={i * 0.35} />
              </ConnCell>
            ))}

            {/* ── Row 2: vertical connector at col 9 ── */}
            <ConnCell col={9} row={2}>
              <div style={{ display: "flex", justifyContent: "center", height: "100%" }}>
                <VConnector color={BOT_ROW[0].color} delay={1.4} />
              </div>
            </ConnCell>

            {/* ── Row 3: bottom pipeline (TTS at col 9, Chat/C at col 7, Audio at col 5) ── */}
            {/* TTS */}
            <NodeCell col={9} row={3}>
              <StageNode stage={BOT_ROW[0]} selected={selected === BOT_ROW[0].id} onClick={() => setSelected(BOT_ROW[0].id)} />
            </NodeCell>
            {/* connector col 8 */}
            <ConnCell col={8} row={3}>
              <HConnector direction="left" color={BOT_ROW[1].color} delay={1.8} />
            </ConnCell>
            {/* Chat/C */}
            <NodeCell col={7} row={3}>
              <StageNode stage={BOT_ROW[1]} selected={selected === BOT_ROW[1].id} onClick={() => setSelected(BOT_ROW[1].id)} />
            </NodeCell>
            {/* connector col 6 */}
            <ConnCell col={6} row={3}>
              <HConnector direction="left" color={BOT_ROW[2].color} delay={2.15} />
            </ConnCell>
            {/* Audio */}
            <NodeCell col={5} row={3}>
              <StageNode stage={BOT_ROW[2]} selected={selected === BOT_ROW[2].id} onClick={() => setSelected(BOT_ROW[2].id)} />
            </NodeCell>
          </div>
        </div>

        {/* Detail panel */}
        <div
          key={selectedStage.id}
          className="glc-detail"
          style={{
            marginTop: "20px",
            padding: "16px 20px",
            borderRadius: "12px",
            border: `1px solid ${selectedStage.color}3a`,
            background: `${selectedStage.color}0d`,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: selectedStage.color }}>
              {selectedStage.name}
            </span>
            <span style={{ fontSize: "11px", color: "#555", fontFamily: "'JetBrains Mono', monospace" }}>
              {selectedStage.tech}
            </span>
          </div>
          <p style={{ fontSize: "13px", color: "#888", lineHeight: "1.65", margin: 0 }}>
            {selectedStage.desc}
          </p>
        </div>
      </div>
    </>
  );
}

/* ── Layout helpers ── */

function NodeCell({ col, row, children }: { col: number; row: number; children: React.ReactNode }) {
  return (
    <div style={{ gridColumn: String(col), gridRow: String(row) }}>
      {children}
    </div>
  );
}

function ConnCell({ col, row, children }: { col: number; row: number; children: React.ReactNode }) {
  return (
    <div style={{ gridColumn: String(col), gridRow: String(row) }}>
      {children}
    </div>
  );
}

/* ── Stage node ── */

function StageNode({ stage, selected, onClick }: { stage: Stage; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="glc-node"
      aria-pressed={selected}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "6px",
        padding: "12px 8px",
        borderRadius: "12px",
        border: `1px solid ${selected ? stage.color + "80" : "#222"}`,
        background: selected ? `${stage.color}12` : "#141414",
        boxShadow: selected ? `0 0 0 1px ${stage.color}30, 0 4px 24px ${stage.color}18` : "none",
        width: "100%",
        position: "relative",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          background: stage.color,
          boxShadow: `0 0 ${selected ? "10px" : "6px"} ${stage.color}${selected ? "90" : "60"}`,
          transition: "box-shadow 0.2s ease",
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: "11px",
          fontWeight: 600,
          color: selected ? stage.color : "#F0F0F0",
          textAlign: "center",
          lineHeight: 1.3,
          transition: "color 0.2s ease",
        }}
      >
        {stage.name}
      </span>
      <span
        style={{
          fontSize: "9px",
          color: "#4a4a4a",
          fontFamily: "'JetBrains Mono', monospace",
          textAlign: "center",
          lineHeight: 1.3,
          wordBreak: "break-all" as const,
          maxWidth: "100%",
        }}
      >
        {stage.tech}
      </span>
    </button>
  );
}

/* ── Connectors ── */

function HConnector({ direction, color, delay }: { direction: "right" | "left"; color: string; delay: number }) {
  const isRight = direction === "right";
  return (
    <div
      style={{
        position: "relative",
        height: "2px",
        background: "#1e1e1e",
        overflow: "visible",
        width: "100%",
      }}
    >
      {/* Arrow tip */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          [isRight ? "right" : "left"]: "-1px",
          transform: `translateY(-50%) ${isRight ? "" : "rotate(180deg)"}`,
          width: 0,
          height: 0,
          borderLeft: "5px solid #2e2e2e",
          borderTop: "4px solid transparent",
          borderBottom: "4px solid transparent",
        }}
      />
      {/* Animated dot */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 6px ${color}`,
          transform: "translateY(-50%)",
          animationName: isRight ? "glcFlowRight" : "glcFlowLeft",
          animationDuration: "2.2s",
          animationTimingFunction: "ease-in-out",
          animationIterationCount: "infinite",
          animationDelay: `${delay}s`,
        }}
      />
    </div>
  );
}

function VConnector({ color, delay }: { color: string; delay: number }) {
  return (
    <div
      style={{
        width: "2px",
        height: "100%",
        background: "#1e1e1e",
        position: "relative",
        overflow: "visible",
      }}
    >
      {/* Arrow tip */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: "-1px",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderTop: "5px solid #2e2e2e",
          borderLeft: "4px solid transparent",
          borderRight: "4px solid transparent",
        }}
      />
      {/* Animated dot */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 6px ${color}`,
          transform: "translateX(-50%)",
          animationName: "glcFlowDown",
          animationDuration: "2.2s",
          animationTimingFunction: "ease-in-out",
          animationIterationCount: "infinite",
          animationDelay: `${delay}s`,
        }}
      />
    </div>
  );
}
