import { Fragment, useState } from "react";

interface Stage {
  id: string;
  label: string;
  sublabel: string;
  color: string;
  desc: string;
  items: string[];
  stats: { value: string; label: string }[];
}

const STAGES: Stage[] = [
  {
    id: "sources",
    label: "Market Data",
    sublabel: "External feeds",
    color: "#94A3B8",
    desc: "Daily marketplace prices for English and Japanese cards, the card catalogue and its images, graded sales from eBay and Fanatics Collect, and an on-demand sold-listing search. Every raw payload is archived as it arrived, so the whole lake can be rebuilt offline and a missed night is backfilled rather than lost.",
    items: ["Daily raw prices, EN + JP", "Graded sales, PSA / CGC / BGS", "Catalogue + card art", "Archived raw payloads"],
    stats: [
      { value: "2022", label: "price history since" },
      { value: "2", label: "languages" },
    ],
  },
  {
    id: "pipeline",
    label: "Nightly Pipeline",
    sublabel: "Python / DuckDB",
    color: "#F5C518",
    desc: "A chain of idempotent jobs: ingest into a Parquet lake, rebuild point-in-time features, reprice every card, read and classify new sale titles, mark every binder, then publish to the serving database and the static site. Any step can be retried safely, and the health ping is withheld unless the whole night succeeded.",
    items: ["Parquet lake + DuckDB", "Point-in-time feature engine", "Scorecard model + study", "Sale-title classifier"],
    stats: [
      { value: "57M", label: "price observations" },
      { value: "1.9M", label: "sales classified" },
    ],
  },
  {
    id: "serving",
    label: "Serving Layer",
    sublabel: "FastAPI / Postgres",
    color: "#00D8FF",
    desc: "The request path never touches the lake. A FastAPI service reads Postgres, where row-level security is enforced per request from the user's JWT. It owns matching, scans, grade checks, order and collection imports, the binder, and billing, with Stripe and App Store subscriptions reconciled onto a single account.",
    items: ["Row-level security per user", "Scan + grade-check endpoints", "Claude vision as a fallback reader", "Stripe + App Store on one account"],
    stats: [
      { value: "34", label: "API routes" },
      { value: "25", label: "tables under RLS" },
    ],
  },
  {
    id: "apps",
    label: "iPhone + Web",
    sublabel: "SwiftUI / React",
    color: "#A78BFA",
    desc: "A native SwiftUI app does on-device OCR and perspective correction before anything is uploaded. The web app is a React SPA, and the marketing pages and blog are prerendered static HTML. Shared golden fixtures keep the Swift and TypeScript clients computing identical numbers.",
    items: ["On-device OCR + straightening", "StoreKit 2 subscriptions", "Prerendered marketing + blog", "Swift / TS parity fixtures"],
    stats: [
      { value: "69.6K", label: "cards priced nightly" },
      { value: "~150 ms", label: "on-device OCR" },
    ],
  },
];

/** Labels for the link after each stage; the forward dot takes that stage's color. */
const CONNECTORS: { fwd: string; back: string }[] = [
  { fwd: "nightly pull", back: "backfill" },
  { fwd: "publish", back: "marks" },
  { fwd: "JSON API", back: "scans" },
];

export function PokelitSystem() {
  const [selected, setSelected] = useState<string>("pipeline");
  const stage = STAGES.find((s) => s.id === selected) ?? STAGES[1];

  return (
    <>
      {/* React 18 SSR escapes text inside <style>: keep quotes, angle brackets and ampersands out of this CSS. */}
      <style>{`
        @keyframes plkPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.15); }
        }
        @keyframes plkRun {
          0%   { transform: translateX(-8px); opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { transform: translateX(calc(100% + 2px)); opacity: 0; }
        }
        @keyframes plkRunBack {
          0%   { transform: translateX(calc(100% + 2px)); opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { transform: translateX(-8px); opacity: 0; }
        }
        @keyframes plkFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .plk-card {
          transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
          cursor: pointer;
        }
        .plk-card:hover { transform: translateY(-2px); }
        .plk-card[aria-pressed=true] { transform: translateY(-3px); }
        .plk-detail { animation: plkFadeIn 0.18s ease forwards; }
        .plk-pulse { animation: plkPulse 2s ease-in-out infinite; }
        .plk-detail-grid { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 20px; align-items: start; }
        .plk-stats { display: flex; flex-direction: column; gap: 12px; padding-left: 20px; border-left: 1px solid #222; }
        @media (max-width: 600px) {
          .plk-detail-grid { grid-template-columns: 1fr; gap: 14px; }
          .plk-stats { flex-direction: row; gap: 24px; padding-left: 0; border-left: none; padding-top: 14px; border-top: 1px solid #222; }
        }
        @media (prefers-reduced-motion: reduce) {
          .plk-dot { display: none; }
          .plk-pulse { animation: none; }
          .plk-card, .plk-card:hover, .plk-card[aria-pressed=true] { transform: none; }
          .plk-detail { animation: none; }
        }
      `}</style>

      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <p style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#555", marginBottom: "20px" }}>
          Click any stage to inspect
        </p>

        <div style={{ overflowX: "auto", paddingTop: "4px", paddingBottom: "4px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: STAGES.map((_, i) => (i === 0 ? "1fr" : "56px 1fr")).join(" "),
              alignItems: "center",
              minWidth: "760px",
            }}
          >
            {STAGES.map((s, i) => (
              <Fragment key={s.id}>
                <StageCard stage={s} selected={selected === s.id} onClick={() => setSelected(s.id)} />
                {i < STAGES.length - 1 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "0 4px" }}>
                    <Connector color={s.color} direction="right" delay={i * 0.45} label={CONNECTORS[i]?.fwd ?? ""} />
                    <Connector color="#555" direction="left" delay={i * 0.45 + 1.2} label={CONNECTORS[i]?.back ?? ""} />
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div key={stage.id}
          className="plk-detail"
          style={{
            marginTop: "20px",
            padding: "16px 20px",
            borderRadius: "12px",
            border: `1px solid ${stage.color}3a`,
            background: `${stage.color}0d`,
          }}
        >
          <div className="plk-detail-grid">
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: stage.color }}>{stage.label}</span>
              <span style={{ fontSize: "11px", color: "#555", fontFamily: "'JetBrains Mono', monospace" }}>{stage.sublabel}</span>
            </div>
            <div style={{ fontSize: "13px", color: "#888", lineHeight: 1.65, marginBottom: "12px" }}>{stage.desc}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {stage.items.map((item) => (
                <span key={item}
                  style={{
                    fontSize: "11px",
                    padding: "3px 10px",
                    borderRadius: "20px",
                    border: `1px solid ${stage.color}30`,
                    color: "#888",
                    background: `${stage.color}0a`,
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="plk-stats">
            {stage.stats.map((st) => (
              <div key={st.label}>
                <div style={{ fontSize: "22px", fontWeight: 700, color: "#F0F0F0", lineHeight: 1.1 }}>{st.value}</div>
                <div style={{ fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase", color: "#888", marginTop: "3px", whiteSpace: "nowrap" }}>
                  {st.label}
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>
      </div>
    </>
  );
}

function StageCard({ stage, selected, onClick }: { stage: Stage; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="plk-card"
      aria-pressed={selected}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        padding: "14px 12px",
        borderRadius: "14px",
        border: `1px solid ${selected ? stage.color + "70" : "#222"}`,
        background: selected ? `${stage.color}10` : "#141414",
        boxShadow: selected ? `0 0 0 1px ${stage.color}28, 0 4px 24px ${stage.color}15` : "none",
        textAlign: "left",
        width: "100%",
        height: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          className={selected ? "plk-pulse" : undefined}
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: stage.color,
            boxShadow: `0 0 ${selected ? "10px" : "5px"} ${stage.color}${selected ? "90" : "50"}`,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: selected ? stage.color : "#555",
            transition: "color 0.2s",
          }}
        >
          {stage.sublabel}
        </span>
      </div>
      <span style={{ fontSize: "12px", fontWeight: 700, color: selected ? stage.color : "#F0F0F0", lineHeight: 1.3, transition: "color 0.2s" }}>
        {stage.label}
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginTop: "2px" }}>
        {stage.items.slice(0, 2).map((item) => (
          <span key={item} style={{ fontSize: "10px", color: "#444", lineHeight: 1.4 }}>
            · {item}
          </span>
        ))}
      </div>
    </button>
  );
}

function Connector({ color, direction, delay, label }: { color: string; direction: "right" | "left"; delay: number; label: string }) {
  const isRight = direction === "right";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
      <span style={{ fontSize: "10px", color: "#888", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ position: "relative", width: "100%", height: "2px", background: "#1e1e1e", overflow: "visible" }}>
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
        {/* A full-width runner moved with transform (compositor-only), carrying the dot. */}
        <div
          className="plk-dot"
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            pointerEvents: "none",
            animationName: isRight ? "plkRun" : "plkRunBack",
            animationDuration: "2.4s",
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
            animationDelay: `${delay}s`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: "50%",
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: color,
              boxShadow: `0 0 5px ${color}`,
              transform: "translateY(-50%)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
