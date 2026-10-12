import { useState } from "react";

interface Node {
  id: string;
  label: string;
  tech: string;
  color: string;
  role: string;
  mine: string;
}

interface Layer {
  name: string;
  nodes: Node[];
}

const LAYERS: Layer[] = [
  {
    name: "People",
    nodes: [
      {
        id: "adopters",
        label: "Adopters",
        tech: "paaw.co · 4 languages",
        color: "#F0438C",
        role: "Browse, search, chat with Oscar, contact shelters, donate and shop essentials, in English, French, Spanish or German.",
        mine: "Most of the adopter-facing surface: search, pet pages, the contact and donation flows, Oscar and Welcome Home.",
      },
      {
        id: "staff",
        label: "Shelter staff",
        tech: "Shelter dashboard",
        color: "#A78BFA",
        role: "List animals, answer adopters and keep their shelter page up to date.",
        mine: "The redesigned dashboard: animal form with photo handling, filterable applications, profile and inquiry settings.",
      },
    ],
  },
  {
    name: "Edge",
    nodes: [
      {
        id: "edge",
        label: "Cloudflare",
        tech: "Cache · WAF · bot checks",
        color: "#F59E0B",
        role: "DNS, firewall, bot verification and the edge cache in front of every page and image.",
        mine: "Day-long edge caching of pet pages with purge-on-change, and deploys that drain and purge cleanly.",
      },
    ],
  },
  {
    name: "Apps",
    nodes: [
      {
        id: "web",
        label: "Web app",
        tech: "Next.js 15 · React 19",
        color: "#00D8FF",
        role: "Server-rendered public site and adopter app; reads the catalogue directly and calls services for writes. Hosts Oscar's chat API.",
        mine: "264 merged PRs: search, payments, Oscar, SEO, i18n, security hardening, the first test suite and CI gate.",
      },
    ],
  },
  {
    name: "Services",
    nodes: [
      {
        id: "api",
        label: "Data API",
        tech: "Node · Express",
        color: "#38BDF8",
        role: "REST API over shelters, animals and requests; Stripe Connect, email sends, geocoding.",
        mine: "Bounded connection pools, a database-free health check and account-management features.",
      },
      {
        id: "auth",
        label: "Accounts",
        tech: "JWT auth",
        color: "#38BDF8",
        role: "Sign-up, sign-in and password reset for email, Google and Facebook accounts.",
        mine: "Password reset that works for Google and Facebook accounts, sent in the account's own language.",
      },
      {
        id: "jobs",
        label: "Scheduled jobs",
        tech: "ECS · EventBridge",
        color: "#38BDF8",
        role: "Nightly listing imports, payouts and refunds, reminder and lifecycle emails, metrics exports.",
        mine: "New jobs for SEO inventory, inbox deliverability and email metrics, plus data-repair migrations with plan, apply, audit and rollback.",
      },
    ],
  },
  {
    name: "Data & partners",
    nodes: [
      {
        id: "db",
        label: "MongoDB Atlas",
        tech: "Primary + secondaries",
        color: "#34D399",
        role: "The platform's single source of truth for listings, shelters, users and requests.",
        mine: "Read routing to secondaries, hinted and new indexes, and a 2dsphere index for radius counts.",
      },
      {
        id: "stripe",
        label: "Stripe",
        tech: "Payments · Connect",
        color: "#34D399",
        role: "Donations, Express Contact, subscriptions, and payouts to shelters, across US and EU accounts.",
        mine: "Single-step donation checkout, server-built Express sessions, and Cash App Pay restored.",
      },
      {
        id: "ai",
        label: "OpenAI",
        tech: "via Vercel AI SDK",
        color: "#34D399",
        role: "The language model behind Oscar, traced end to end.",
        mine: "Model changes gated on the eval suite; prompts version-stamped on every trace.",
      },
    ],
  },
];

export function PaawPlatform() {
  const [selected, setSelected] = useState("web");
  const node = LAYERS.flatMap((l) => l.nodes).find((n) => n.id === selected)!;

  return (
    <>
      {/* React 18 SSR escapes text inside <style>: keep quotes, angle brackets and ampersands out of this CSS. */}
      <style>{`
        .pp-node { transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease; cursor: pointer; }
        .pp-node:hover { transform: translateY(-1px); }
        .pp-detail { animation: ppFade 0.18s ease forwards; }
        @keyframes ppFade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        .pp-row { display: grid; grid-template-columns: 92px minmax(0, 1fr); gap: 12px; align-items: center; }
        @media (max-width: 520px) { .pp-row { grid-template-columns: 1fr; gap: 6px; } }
        @media (prefers-reduced-motion: reduce) { .pp-node, .pp-node:hover { transform: none; } .pp-detail { animation: none; } }
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
        <div style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#555", marginBottom: "14px" }}>
          The platform, top to bottom · click a box
        </div>

        {LAYERS.map((layer, li) => (
          <div key={layer.name}>
            <div className="pp-row">
              <div style={{ fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555", fontWeight: 600 }}>
                {layer.name}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(132px, 1fr))", gap: "8px" }}>
                {layer.nodes.map((n) => {
                  const isSel = n.id === selected;
                  return (
                    <button key={n.id}
                      className="pp-node"
                      aria-pressed={isSel}
                      onClick={() => setSelected(n.id)}
                      style={{
                        textAlign: "left",
                        padding: "9px 11px",
                        borderRadius: "10px",
                        border: `1px solid ${isSel ? n.color + "90" : "#222"}`,
                        background: isSel ? `${n.color}14` : "#0A0A0A",
                        minWidth: 0,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: n.color, flexShrink: 0 }} />
                        <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#F0F0F0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {n.label}
                        </span>
                      </div>
                      <div style={{ fontSize: "10.5px", color: "#888", marginTop: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {n.tech}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            {li < LAYERS.length - 1 && (
              <div className="pp-row" aria-hidden="true">
                <div />
                <div style={{ display: "flex", justifyContent: "center", height: "18px" }}>
                  <svg width="10" height="18" viewBox="0 0 10 18">
                    <line x1="5" y1="0" x2="5" y2="13" stroke="#2E2E2E" strokeWidth="1" />
                    <path d="M1.5 11.5 L5 16 L8.5 11.5" fill="none" stroke="#2E2E2E" strokeWidth="1" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        ))}

        <div key={node.id}
          className="pp-detail"
          style={{ marginTop: "16px", padding: "14px 16px", borderRadius: "10px", border: `1px solid ${node.color}40`, background: `${node.color}0c` }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#F0F0F0" }}>{node.label}</span>
            <span style={{ fontSize: "11px", color: "#888", fontFamily: "'JetBrains Mono', monospace" }}>{node.tech}</span>
          </div>
          <div style={{ fontSize: "12.5px", color: "#888", lineHeight: 1.6 }}>{node.role}</div>
          <div style={{ fontSize: "12.5px", color: "#F0F0F0", lineHeight: 1.6, marginTop: "8px" }}>
            <span style={{ fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: node.color, marginRight: "8px", fontWeight: 600 }}>
              My work
            </span>
            {node.mine}
          </div>
        </div>
      </div>
    </>
  );
}
