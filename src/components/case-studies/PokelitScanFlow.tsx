import { useState } from "react";

type Where = "device" | "server" | "model";

interface Step {
  title: string;
  where: Where;
  desc: string;
  metric?: string;
}

const WHERE: Record<Where, { label: string; color: string }> = {
  device: { label: "On device", color: "#A78BFA" },
  server: { label: "Server", color: "#00D8FF" },
  model: { label: "Claude vision", color: "#FB7185" },
};

const SCAN_STEPS: Step[] = [
  {
    title: "Photograph a card or a slab",
    where: "device",
    desc: "One still from the camera. Nothing is uploaded yet.",
  },
  {
    title: "Read the text on the phone",
    where: "device",
    desc: "Apple Vision OCR pulls the name, collector number, set code, and a slab's grader, grade and cert number.",
    metric: "~150 ms",
  },
  {
    title: "Match against the catalogue",
    where: "server",
    desc: "A deterministic scorer weighs number and total, name, set and printing hints against every priced card, and only auto-confirms a card that leads every rival clearly.",
    metric: "69.6K priced cards",
  },
];

const SCAN_BRANCHES: { when: string; step: Step }[] = [
  {
    when: "Clear winner",
    step: {
      title: "Confirmed",
      where: "server",
      desc: "Price, history, graded prices and the most to pay, raw or slab. A slab read entirely on the phone lands with no model call.",
      metric: "1.6 s slab read",
    },
  },
  {
    when: "Ambiguous",
    step: {
      title: "Fallback read",
      where: "model",
      desc: "Claude transcribes the photo into a typed schema, then the same matcher decides. Cached by photo hash; a failed read refunds the scan.",
      metric: "~$0.005 / read",
    },
  },
];

const GRADE_STEPS: Step[] = [
  {
    title: "Front and back photos",
    where: "device",
    desc: "Raw card on a plain surface, in a sleeve or out.",
  },
  {
    title: "Find and straighten the card",
    where: "device",
    desc: "Rectangle detection and a perspective correction resample the card to a fixed physical scale, with a margin of background kept around it.",
  },
  {
    title: "Measure the borders",
    where: "server",
    desc: "Classical computer vision, no ML: each border strip is converted to a perceptual color space and walked inward to find the cut and the print edge, row by row, with shadows, glare and sleeves rejected.",
    metric: "±0.06 mm · 109 ms",
  },
  {
    title: "Centering against the grader's lines",
    where: "server",
    desc: "Left/right and top/bottom ratios on both faces, compared with the published thresholds for each grade, become a chance for each PSA grade alongside corner, edge and surface scores.",
  },
  {
    title: "Price every outcome",
    where: "server",
    desc: "Each grade's sale price, net of grading tiers and selling fees, against the raw price: the grade at which grading starts to pay.",
  },
];

export function PokelitScanFlow() {
  const [tab, setTab] = useState<"scan" | "grade">("scan");

  return (
    <>
      {/* React 18 SSR escapes text inside <style>: keep quotes, angle brackets and ampersands out of this CSS. */}
      <style>{`
        .psf-branches { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        @media (max-width: 520px) { .psf-branches { grid-template-columns: 1fr; } }
        .psf-tab { transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease; }
        .psf-tab:hover { color: #F0F0F0; }
        .psf-panel { animation: psfFade 0.18s ease forwards; }
        @keyframes psfFade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .psf-panel { animation: none; } }
      `}</style>
      <div
        style={{
          margin: "2rem 0 2.25rem",
          padding: "18px",
          borderRadius: "14px",
          border: "1px solid #222",
          background: "#141414",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
          <div role="group" aria-label="Pipeline" style={{ display: "inline-flex", padding: "3px", borderRadius: "999px", border: "1px solid #222", background: "#0A0A0A" }}>
            {(
              [
                ["scan", "Scan a card"],
                ["grade", "Grade check"],
              ] as const
            ).map(([id, label]) => (
              <button key={id}
                aria-pressed={tab === id}
                className="psf-tab"
                onClick={() => setTab(id)}
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "6px 14px",
                  borderRadius: "999px",
                  border: "none",
                  cursor: "pointer",
                  background: tab === id ? "#1e1e1e" : "transparent",
                  color: tab === id ? "#F0F0F0" : "#888",
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {(Object.keys(WHERE) as Where[]).map((w) => (
              <span key={w} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#888" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: WHERE[w].color }} />
                {WHERE[w].label}
              </span>
            ))}
          </div>
        </div>

        <div key={tab} className="psf-panel">
          {tab === "scan" ? (
            <>
              {SCAN_STEPS.map((s, i) => (
                <StepRow key={s.title} step={s} index={i + 1} last={false} />
              ))}
              <div style={{ paddingLeft: "34px", marginTop: "2px" }}>
                <div className="psf-branches">
                  {SCAN_BRANCHES.map((b) => (
                    <div key={b.when}>
                      <div style={{ fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#888", margin: "0 0 6px 2px" }}>
                        {b.when}
                      </div>
                      <StepCard step={b.step} />
                    </div>
                  ))}
                </div>
              </div>
              <Principle text="The model reads. It never chooses the card." />
            </>
          ) : (
            <>
              {GRADE_STEPS.map((s, i) => (
                <StepRow key={s.title} step={s} index={i + 1} last={i === GRADE_STEPS.length - 1} />
              ))}
              <Principle text="Measured, not guessed: the output is labelled an estimate until it is calibrated on graded slabs." />
            </>
          )}
        </div>
      </div>
    </>
  );
}

function StepRow({ step, index, last }: { step: Step; index: number; last: boolean }) {
  const c = WHERE[step.where].color;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "24px minmax(0, 1fr)", gap: "10px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            border: `1px solid ${c}70`,
            background: `${c}14`,
            color: "#F0F0F0",
            fontSize: "11px",
            fontWeight: 600,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          {index}
        </div>
        <div style={{ flex: 1, width: "1px", background: last ? "transparent" : "#2E2E2E", minHeight: "10px" }} />
      </div>
      <div style={{ paddingBottom: "10px" }}>
        <StepCard step={step} />
      </div>
    </div>
  );
}

function StepCard({ step }: { step: Step }) {
  const w = WHERE[step.where];
  return (
    <div style={{ padding: "11px 14px", borderRadius: "10px", border: "1px solid #222", background: "#0A0A0A" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "#F0F0F0" }}>{step.title}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase", color: "#888" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: w.color }} />
          {w.label}
        </span>
      </div>
      <div style={{ fontSize: "12.5px", color: "#888", lineHeight: 1.6, marginTop: "4px" }}>{step.desc}</div>
      {step.metric && (
        <div style={{ marginTop: "8px" }}>
          <span
            style={{
              fontSize: "11px",
              fontFamily: "'JetBrains Mono', monospace",
              color: "#F0F0F0",
              padding: "2px 8px",
              borderRadius: "6px",
              border: `1px solid ${w.color}40`,
              background: `${w.color}10`,
            }}
          >
            {step.metric}
          </span>
        </div>
      )}
    </div>
  );
}

function Principle({ text }: { text: string }) {
  return (
    <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #222", fontSize: "12px", color: "#888", fontStyle: "italic" }}>
      {text}
    </div>
  );
}
