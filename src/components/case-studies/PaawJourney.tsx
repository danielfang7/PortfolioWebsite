import { Fragment, useState } from "react";

interface Step {
  id: string;
  label: string;
  short: string;
  built: string[];
  impact: { value: string; label: string }[];
}

const PINK = "#F0438C";
const LAVENDER = "#A78BFA";

const ADOPTER_STEPS: Step[] = [
  {
    id: "discover",
    label: "Discover",
    short: "Search, map, city pages",
    built: [
      "Rebuilt search: a radius bar over the map, filters that apply live, breed search scoped to species, and a list that widens its radius instead of ending",
      "Ranking on a measured shelter-response ladder, so pets from shelters that actually reply rise to the top",
      "City and breed landing pages across US metros, homepage browse rows, and quiz answers carried into search",
    ],
    impact: [
      { value: "8–12 s → 0.7 s", label: "search results, no location" },
      { value: "−50%", label: "page-one distance, Atlanta (simulated)" },
    ],
  },
  {
    id: "oscar",
    label: "Ask Oscar",
    short: "AI adoption assistant",
    built: [
      "Ported a stranded prototype onto main and rebuilt it on the Vercel AI SDK with per-request tools",
      "Docked panel, full-screen results board, pet-page awareness and a post-contact companion that tracks request status",
      "Deterministic ranking, version-stamped prompts, and an eval suite that every prompt change must pass",
    ],
    impact: [
      { value: "0", label: "dialable numbers left, 14K+ listings tested" },
      { value: "6", label: "species, in the visitor's language" },
    ],
  },
  {
    id: "meet",
    label: "Meet the pet",
    short: "Profile pages",
    built: [
      "Animal pages held at the Cloudflare edge for a day, purged the moment a pet is adopted or edited",
      "Images served from the edge cache, with origin load cut accordingly",
      "Save, share and Facebook link previews that render the pet",
    ],
    impact: [
      { value: "0% → 83%", label: "image edge-cache hit rate" },
      { value: "−63%", label: "origin bytes served" },
    ],
  },
  {
    id: "contact",
    label: "Contact a shelter",
    short: "The core conversion",
    built: [
      "Found and fixed a client-side state race that silently dropped free contact requests before they reached a shelter",
      "Express Contact: a paid tier whose checkout runs end to end on the server",
      "A deliverability gate that catches unreachable shelter inboxes before an adopter is asked to pay",
    ],
    impact: [
      { value: "Fixed", label: "silent loss of free contact requests" },
    ],
  },
  {
    id: "support",
    label: "Support Paaw",
    short: "Donations",
    built: [
      "Rebuilt the donation window so a one-time gift plus monthly support confirms in a single payment step",
      "Restored Cash App Pay and fixed two Stripe accounts loading on one page",
      "A success page that handles every payment state: processing, retry, failed card and auto-continue",
    ],
    impact: [
      { value: "1 step", label: "to confirm a gift plus monthly support" },
    ],
  },
  {
    id: "home",
    label: "Welcome home",
    short: "Essentials + insurance",
    built: [
      "Essentials for pets: a partner catalogue with daily-refreshed prices, budget chips and search",
      "Safety rules enforced by tests, e.g. products toxic to cats are never shown on a cat",
      "Insurance partners swapped behind one config, with a click ledger for attribution",
    ],
    impact: [
      { value: "57", label: "curated products, prices refreshed daily" },
    ],
  },
];

const SHELTER_STEPS: Step[] = [
  {
    id: "claim",
    label: "Claim & list",
    short: "Shelter dashboard",
    built: [
      "Redesigned dashboard: animal form with HEIC conversion and photo reordering, filterable applications table",
      "Claim-your-page flow, editable inquiry address and profile photo",
      "Accurate adoption counts on every shelter page",
    ],
    impact: [
      { value: "4,000+", label: "shelters on the platform" },
      { value: "4", label: "languages" },
    ],
  },
  {
    id: "respond",
    label: "Respond",
    short: "Badges + reminders",
    built: [
      "Response badges that tell adopters which shelters reply",
      "Reminder emails in the shelter's language, sent to its current address, capped so they never spam",
      "A weekly deliverability check on every shelter inbox",
    ],
    impact: [
      { value: "Weekly", label: "health check on every shelter inbox" },
    ],
  },
];

export function PaawJourney() {
  const [lane, setLane] = useState<"adopters" | "shelters">("adopters");
  const steps = lane === "adopters" ? ADOPTER_STEPS : SHELTER_STEPS;
  const color = lane === "adopters" ? PINK : LAVENDER;
  const [selectedId, setSelectedId] = useState<string>("contact");
  const step = steps.find((s) => s.id === selectedId) ?? steps[0];
  const selectedIndex = steps.indexOf(step);

  function switchLane(next: "adopters" | "shelters") {
    if (next === lane) return;
    setLane(next);
    setSelectedId(next === "adopters" ? "contact" : "respond");
  }

  return (
    <>
      {/* React 18 SSR escapes text inside <style>: keep quotes, angle brackets and ampersands out of this CSS. */}
      <style>{`
        .pj-step { transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease; cursor: pointer; }
        .pj-step:hover { transform: translateY(-2px); }
        .pj-detail { animation: pjFade 0.18s ease forwards; }
        @keyframes pjFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        @keyframes pjFlow { 0% { transform: translateX(-6px); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateX(calc(100% - 1px)); opacity: 0; } }
        .pj-tab { transition: color 0.15s ease, background 0.15s ease; }
        .pj-tab:hover { color: #F0F0F0; }
        .pj-detail-grid { display: grid; grid-template-columns: minmax(0, 1fr) 220px; gap: 20px; }
        @media (max-width: 720px) { .pj-detail-grid { grid-template-columns: 1fr; } }
        @media (prefers-reduced-motion: reduce) {
          .pj-step, .pj-step:hover { transform: none; }
          .pj-detail { animation: none; }
          .pj-dot { display: none; }
        }
      `}</style>

      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
          <p style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#555", margin: 0 }}>
            Click any step to see what I built there
          </p>
          <div role="group" aria-label="Journey" style={{ display: "inline-flex", padding: "3px", borderRadius: "999px", border: "1px solid #222", background: "#141414" }}>
            {(
              [
                ["adopters", "Adopters"],
                ["shelters", "Shelters"],
              ] as const
            ).map(([id, label]) => (
              <button key={id}
                aria-pressed={lane === id}
                className="pj-tab"
                onClick={() => switchLane(id)}
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "6px 14px",
                  borderRadius: "999px",
                  border: "none",
                  cursor: "pointer",
                  background: lane === id ? "#1e1e1e" : "transparent",
                  color: lane === id ? "#F0F0F0" : "#888",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Stepper */}
        <div style={{ overflowX: "auto", paddingTop: "4px", paddingBottom: "4px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: steps.map((_, i) => (i === 0 ? "1fr" : "28px 1fr")).join(" "),
              alignItems: "stretch",
              minWidth: lane === "adopters" ? "860px" : "560px",
            }}
          >
            {steps.map((s, i) => {
              const isSel = s.id === step.id;
              const isPast = i < selectedIndex;
              return (
                <Fragment key={s.id}>
                  {i > 0 && (
                    <div style={{ position: "relative", alignSelf: "center", height: "2px", background: isPast || isSel ? `${color}55` : "#1e1e1e" }}>
                      <div
                        className="pj-dot"
                        style={{
                          position: "absolute",
                          inset: 0,
                          opacity: 0,
                          pointerEvents: "none",
                          animationName: "pjFlow",
                          animationDuration: "2.2s",
                          animationTimingFunction: "ease-in-out",
                          animationIterationCount: "infinite",
                          animationDelay: `${i * 0.35}s`,
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            left: 0,
                            top: "50%",
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: color,
                            boxShadow: `0 0 5px ${color}`,
                            transform: "translateY(-50%)",
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <button
                    className="pj-step"
                    aria-pressed={isSel}
                    onClick={() => setSelectedId(s.id)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      padding: "12px",
                      borderRadius: "14px",
                      textAlign: "left",
                      border: `1px solid ${isSel ? color + "80" : "#222"}`,
                      background: isSel ? `${color}12` : "#141414",
                      boxShadow: isSel ? `0 0 0 1px ${color}28, 0 4px 24px ${color}18` : "none",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: isSel ? color : "#555",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#F0F0F0", lineHeight: 1.25 }}>{s.label}</span>
                    <span style={{ fontSize: "10.5px", color: "#888", lineHeight: 1.35 }}>{s.short}</span>
                  </button>
                </Fragment>
              );
            })}
          </div>
        </div>

        {/* Detail */}
        <div key={lane + step.id}
          className="pj-detail"
          style={{ marginTop: "20px", padding: "16px 20px", borderRadius: "12px", border: `1px solid ${color}3a`, background: `${color}0b` }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color }}>{step.label}</span>
            <span style={{ fontSize: "12px", color: "#888" }}>{step.short}</span>
          </div>
          <div className="pj-detail-grid">
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {step.built.map((b) => (
                <div key={b} style={{ display: "grid", gridTemplateColumns: "12px minmax(0,1fr)", gap: "8px", fontSize: "13px", color: "#888", lineHeight: 1.6 }}>
                  <span aria-hidden="true" style={{ width: "5px", height: "5px", borderRadius: "50%", background: color, marginTop: "8px" }} />
                  <span>{b}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {step.impact.map((m) => (
                <div key={m.label} style={{ padding: "10px 12px", borderRadius: "10px", border: "1px solid #222", background: "#0A0A0A" }}>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#F0F0F0", lineHeight: 1.15 }}>{m.value}</div>
                  <div style={{ fontSize: "11px", color: "#888", marginTop: "3px", lineHeight: 1.35 }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
