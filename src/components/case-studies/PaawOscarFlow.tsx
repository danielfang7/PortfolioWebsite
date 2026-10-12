type Where = "browser" | "server" | "model";

interface Step {
  title: string;
  where: Where;
  desc: string;
}

const WHERE: Record<Where, { label: string; color: string }> = {
  browser: { label: "Browser", color: "#F0438C" },
  server: { label: "Server", color: "#00D8FF" },
  model: { label: "LLM", color: "#34D399" },
};

const BEFORE: Step[] = [
  {
    title: "A visitor asks",
    where: "browser",
    desc: "From the docked panel, the full-screen results board, or a peek card that appears after engaged browsing on a pet page.",
  },
  {
    title: "Rollout gate",
    where: "server",
    desc: "A config document, read server-side, decides who gets Oscar and holds the kill switch, so launching or rolling back needs no deploy.",
  },
  {
    title: "Assemble the prompt",
    where: "server",
    desc: "Built fresh each turn from the visitor's language, the pet page they are on and, when signed in, their own pets. Every trace carries the prompt version.",
  },
];

const LOOP: Step[] = [
  {
    title: "Model streams and calls tools",
    where: "model",
    desc: "Typed tools: search pets, explain how contact works, look up my requests, suggest products for the pet's life stage.",
  },
  {
    title: "Deterministic engine answers",
    where: "server",
    desc: "Search and ranking run in TypeScript, not in the model. Cursors and the set of pets shown are signed, so a reply can't invent a pet or a page.",
  },
  {
    title: "Redact before the model sees it",
    where: "server",
    desc: "Shelter phone numbers are stripped from listing text. Validated on 14,000+ real listings: zero dialable numbers left, microchip numbers untouched.",
  },
];

const AFTER: Step = {
  title: "Pet cards, not paragraphs",
  where: "browser",
  desc: "Results render as real pet cards and a results board the visitor can act on, with the reply narrated around them.",
};

export function PaawOscarFlow() {
  return (
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
        <span style={{ fontSize: "14px", fontWeight: 600, color: "#F0F0F0" }}>One Oscar turn</span>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {(Object.keys(WHERE) as Where[]).map((w) => (
            <span key={w} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#888" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: WHERE[w].color }} />
              {WHERE[w].label}
            </span>
          ))}
        </div>
      </div>

      {BEFORE.map((s, i) => (
        <StepRow key={s.title} step={s} index={i + 1} />
      ))}

      <div style={{ display: "grid", gridTemplateColumns: "24px minmax(0, 1fr)", gap: "10px" }}>
        <Rail index={BEFORE.length + 1} color={WHERE.model.color} />
        <div style={{ padding: "10px 10px 2px", marginBottom: "10px", borderRadius: "12px", border: "1px dashed #2e2e2e" }}>
          <div style={{ fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#888", margin: "0 0 8px 2px" }}>
            Tool loop · repeats until the answer is ready
          </div>
          {LOOP.map((s) => (
            <div key={s.title} style={{ paddingBottom: "8px" }}>
              <Card step={s} />
            </div>
          ))}
        </div>
      </div>

      <StepRow step={AFTER} index={BEFORE.length + 2} last />

      <div
        style={{
          marginTop: "8px",
          paddingTop: "12px",
          borderTop: "1px solid #222",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "10px",
        }}
      >
        <Guard title="Evals gate every prompt change" body="Scenario suite with an LLM judge; a prompt or model change can't merge without it." />
        <Guard title="Traced end to end" body="Every turn traced with its prompt version, through the existing error-monitoring pipeline." />
      </div>
      <div style={{ marginTop: "12px", fontSize: "12px", color: "#888", fontStyle: "italic" }}>The model narrates. It never computes.</div>
    </div>
  );
}

/** The numbered circle and the connector line below it, shared by every step. */
function Rail({ index, color, last = false }: { index: number; color: string; last?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div
        style={{
          width: "22px",
          height: "22px",
          borderRadius: "50%",
          border: `1px solid ${color}70`,
          background: `${color}14`,
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
  );
}

function StepRow({ step, index, last = false }: { step: Step; index: number; last?: boolean }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "24px minmax(0, 1fr)", gap: "10px" }}>
      <Rail index={index} color={WHERE[step.where].color} last={last} />
      <div style={{ paddingBottom: "10px" }}>
        <Card step={step} />
      </div>
    </div>
  );
}

function Card({ step }: { step: Step }) {
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
    </div>
  );
}

function Guard({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ padding: "10px 12px", borderRadius: "10px", border: "1px solid #222", background: "#0A0A0A" }}>
      <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#F0F0F0" }}>{title}</div>
      <div style={{ fontSize: "12px", color: "#888", lineHeight: 1.55, marginTop: "3px" }}>{body}</div>
    </div>
  );
}
