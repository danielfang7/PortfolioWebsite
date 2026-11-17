interface Row {
  label: string;
  /** Measured reduction in whole percent, rounded down from the measurements noted beside each row (a range uses its midpoint). */
  reduction: number;
  how: string;
}

const GROUPS: { name: string; rows: Row[] }[] = [
  {
    name: "Speed under load",
    rows: [
      {
        label: "Search response time, no location",
        reduction: 93, // 8–12 s to 0.7 s
        how: "Queries served from indexes on read replicas",
      },
      {
        label: "Documents read per search",
        reduction: 91, // 60,251 to 5,285
        how: "New compound indexes, pinned with query hints to keep plans stable",
      },
      {
        label: "Radius count query time",
        reduction: 80, // 247 ms to 48 ms
        how: "Counts inside a radius served from a 2dsphere geospatial index (Philadelphia, 80 km)",
      },
      {
        label: "Health check response time",
        reduction: 99, // ~3,000 ms to 2–17 ms
        how: "A lightweight liveness probe that answers without opening a database connection",
      },
    ],
  },
  {
    name: "Page weight and crawl efficiency",
    rows: [
      {
        label: "Sitemap size",
        reduction: 82, // 269,756 to 48,430 URLs
        how: "One canonical URL per listing, covering only pets still up for adoption",
      },
      {
        label: "Blog header image weight",
        reduction: 89, // 141.2 MB to 15.2 MB
        how: "Images resized and recompressed for the web, the largest by 97%",
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
      <div style={{ fontSize: "14px", fontWeight: 600, color: "#F0F0F0" }}>Performance gains</div>
      <div style={{ fontSize: "12px", color: "#888", marginTop: "3px", marginBottom: "14px" }}>
        Each bar is the reduction achieved. Longer is better.
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
                  <span style={{ fontSize: "13px", color: "#F0F0F0", fontWeight: 600, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                    −{r.reduction}%
                  </span>
                </div>
                <div style={{ position: "relative", height: "8px", marginTop: "7px", borderRadius: "4px", background: TRACK }}>
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${r.reduction}%`,
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
        Each reduction measured on production data or a production build.
      </div>
    </div>
  );
}
