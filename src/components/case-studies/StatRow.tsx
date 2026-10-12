import type { CSSProperties } from "react";

interface Stat {
  value: string;
  label: string;
}

/**
 * A row of headline figures for a case study. Rendered inside `.prose-project`,
 * so it sticks to divs and spans: the prose rules target p, ul and li.
 */
export function StatRow({ stats, accent = "#00D8FF" }: { stats: Stat[]; accent?: string }) {
  return (
    <div style={{ margin: "2rem 0 2.25rem", containerType: "inline-size" }}>
      {/* One row when there is room; otherwise two columns, with an odd last cell spanning both.
          React 18 SSR escapes text inside <style>: keep quotes, angle brackets and ampersands out of this CSS. */}
      <style>{`
        .sr-grid { display: grid; grid-template-columns: repeat(var(--sr-n), minmax(0, 1fr)); }
        @container (max-width: 559px) {
          .sr-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .sr-cell:last-child:nth-child(odd) { grid-column: 1 / -1; }
        }
      `}</style>
      <div
        className="sr-grid"
        style={{
          ...({ "--sr-n": stats.length } as CSSProperties),
          borderRadius: "14px",
          overflow: "hidden",
          border: "1px solid #222",
          background: "#141414",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        {stats.map((s) => (
          // Dividers are per-cell shadows clipped by the container.
          <div key={s.label} className="sr-cell" style={{ padding: "16px 18px 15px", position: "relative", boxShadow: "1px 0 0 #222, 0 1px 0 #222" }}>
            <div
              aria-hidden="true"
              style={{ position: "absolute", top: 0, left: "18px", width: "18px", height: "2px", background: accent, borderRadius: "0 0 2px 2px" }}
            />
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#F0F0F0", lineHeight: 1.15, letterSpacing: "-0.01em" }}>{s.value}</div>
            <div style={{ fontSize: "12px", color: "#888", lineHeight: 1.4, marginTop: "4px" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
