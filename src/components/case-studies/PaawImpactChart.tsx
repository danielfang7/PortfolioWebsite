interface Row {
  label: string;
  before: string;
  after: string;
  /** after ÷ before, 0..1 */
  ratio: number;
  change: string;
  how: string;
}

const GROUPS: { name: string; rows: Row[] }[] = [
  {
    name: "Speed under load",
    rows: [
      {
        label: "Search results, no location",
        before: "8–12 s",
        after: "0.7 s",
        ratio: 0.07,
        change: "−93%",
        how: "Index-served queries read from secondaries instead of an in-memory sort on the primary",
      },
      {
        label: "Documents read per search",
        before: "60,251",
        after: "5,285",
        ratio: 5285 / 60251,
        change: "−91%",
        how: "New compound indexes, pinned with hints so the planner can't regress",
      },
      {
        label: "Radius count query",
        before: "247 ms",
        after: "48 ms",
        ratio: 48 / 247,
        change: "−81%",
        how: "Counts inside a radius moved onto a 2dsphere index (Philadelphia, 80 km)",
      },
      {
        label: "Health check response",
        before: "~3,000 ms",
        after: "2–17 ms",
        ratio: 10 / 3000,
        change: "−99%",
        how: "A pure liveness probe, so a slow database could no longer get healthy instances restarted",
      },
    ],
  },
  {
    name: "Weight and crawl hygiene",
    rows: [
      {
        label: "Sitemap URLs submitted",
        before: "269,756",
        after: "48,430",
        ratio: 48430 / 269756,
        change: "−82%",
        how: "One URL per listing instead of four untranslated copies, adopted pets dropped",
      },
      {
        label: "Blog header images",
        before: "141.2 MB",
        after: "15.2 MB",
        ratio: 15.2 / 141.2,
        change: "−89%",
        how: "Camera originals resized and recompressed; worst image 5.6 MB to 124 KB",
      },
    ],
  },
];

const FILL = "#F0438C";
const TRACK = "#2a1520";

/**
 * Static (no hydration): hovering a row dims the others through CSS alone.
 * React 18 SSR escapes text inside <style>, so its CSS avoids quotes, angle brackets and ampersands.
 */
export function PaawImpactChart() {
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
      <style>{`
        .pic-row { transition: opacity 0.15s ease, background 0.15s ease; }
        .pic-row:hover { background: #ffffff06; }
        .pic-list:has(.pic-row:hover) .pic-row:not(:hover) { opacity: 0.55; }
      `}</style>
      <div style={{ fontSize: "14px", fontWeight: 600, color: "#F0F0F0" }}>Before and after</div>
      <div style={{ fontSize: "12px", color: "#888", marginTop: "3px", marginBottom: "14px" }}>
        Each bar is the new value as a share of the old one. Shorter is better.
      </div>

      {GROUPS.map((g) => (
        <div key={g.name} style={{ marginBottom: "8px" }}>
          <div style={{ fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555", margin: "10px 0 6px", fontWeight: 600 }}>
            {g.name}
          </div>
          <div className="pic-list" role="list">
            {g.rows.map((r) => (
              <div key={r.label}
                className="pic-row"
                role="listitem"
                style={{
                  padding: "8px 10px",
                  margin: "0 -10px",
                  borderRadius: "8px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "13px", color: "#F0F0F0", fontWeight: 500 }}>{r.label}</span>
                  <span style={{ fontSize: "12px", color: "#888", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                    {r.before} → <span style={{ color: "#F0F0F0", fontWeight: 600 }}>{r.after}</span>
                    <span style={{ marginLeft: "8px", color: "#F0F0F0" }}>{r.change}</span>
                  </span>
                </div>
                <div style={{ position: "relative", height: "8px", marginTop: "7px", borderRadius: "4px", background: TRACK }}>
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `max(4px, ${(r.ratio * 100).toFixed(2)}%)`,
                      borderRadius: "4px",
                      background: FILL,
                    }}
                  />
                </div>
                <div style={{ fontSize: "11.5px", color: "#888", marginTop: "6px", lineHeight: 1.5 }}>{r.how}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ fontSize: "11px", color: "#888", marginTop: "6px", lineHeight: 1.5 }}>
        Measured before and after each change, on production data or a production build.
      </div>
    </div>
  );
}
