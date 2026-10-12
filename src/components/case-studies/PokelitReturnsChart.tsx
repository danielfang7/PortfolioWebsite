import { useEffect, useRef, useState } from "react";

/**
 * Median return of a randomly chosen studied single, by holding horizon,
 * before and after every cost of trading (spread, tax, shipping, fees,
 * realisation, illiquidity, capital gains). Source: the study's RESULTS.md.
 */
const DATA = [
  { horizon: "3 mo", gross: 5.9, net: -17.6 },
  { horizon: "6 mo", gross: 15.5, net: -10.5 },
  { horizon: "12 mo", gross: 38.4, net: 4.8 },
  { horizon: "24 mo", gross: 94.4, net: 34.7 },
];

// Reference palette, dark steps (slots 1 and 2), validated on #141414.
const GROSS = "#3987e5";
const NET = "#d95926";

const Y_MIN = -30;
const Y_MAX = 100;
const TICKS = [-25, 0, 25, 50, 75, 100];
const HEIGHT = 280;
const PAD = { top: 18, right: 8, bottom: 30, left: 40 };
const BAR_W_MAX = 22;
const TOOLTIP_W = 180;
const TOOLTIP_GAP = 4;
/** Below this plot width a tooltip cannot sit beside every column, so readings go in a line under the chart. */
const NARROW_W = 420;
/** Server render and first paint use this width, scaled to fit via viewBox until measured. */
const SSR_W = 620;
const BAR_GAP = 2;
const R = 4;

const fmt = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;

/** A column with a 4px rounded data end and a square end on the baseline. */
function barPath(x: number, w: number, yZero: number, yVal: number) {
  const h = Math.abs(yVal - yZero);
  const r = Math.min(R, h);
  if (yVal < yZero) {
    // positive: grows up
    return `M${x},${yZero} V${yVal + r} Q${x},${yVal} ${x + r},${yVal} H${x + w - r} Q${x + w},${yVal} ${x + w},${yVal + r} V${yZero} Z`;
  }
  // negative: grows down
  return `M${x},${yZero} V${yVal - r} Q${x},${yVal} ${x + r},${yVal} H${x + w - r} Q${x + w},${yVal} ${x + w},${yVal - r} V${yZero} Z`;
}

export function PokelitReturnsChart() {
  const wrapRef = useRef<HTMLDivElement>(null);
  // null until measured: the first render scales a 620-wide drawing to its container,
  // so it never overflows a phone before hydration (body clips horizontal overflow).
  const [width, setWidth] = useState<number | null>(null);
  // Focus and hover are tracked apart so the pointer can never clear or move the keyboard cue.
  const [hovered, setHovered] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const active = focused ?? hovered;
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(200, entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const w = width ?? SSR_W;
  const plotW = w - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const y = (v: number) => PAD.top + ((Y_MAX - v) / (Y_MAX - Y_MIN)) * plotH;
  const band = plotW / DATA.length;
  const BAR_W = Math.min(BAR_W_MAX, Math.floor((band - 10) / 2));
  const yZero = y(0);
  // Beside the active group so it never covers the marks being read, flipping left near the edge.
  // Null when neither side has room (phones): the reading then goes in a line under the chart.
  const tooltipLeft = (i: number): number | null => {
    const right = PAD.left + band * (i + 1) + TOOLTIP_GAP;
    if (right + TOOLTIP_W <= w) return right;
    const left = PAD.left + band * i - TOOLTIP_W - TOOLTIP_GAP;
    return left >= 0 ? left : null;
  };
  const narrow = width !== null && width < NARROW_W;

  return (
    <div
      style={{
        margin: "2rem 0 2.25rem",
        padding: "18px 18px 14px",
        borderRadius: "14px",
        border: "1px solid #222",
        background: "#141414",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        containerType: "inline-size",
      }}
    >
      {/* React 18 SSR escapes text inside <style>: keep quotes, angle brackets and ampersands out of this CSS. */}
      <style>{`
        .prc-toggle { transition: color 0.15s ease, border-color 0.15s ease; }
        .prc-toggle:hover { color: #F0F0F0; border-color: #444; }
        .prc-reading { display: none; }
        @container (max-width: 419px) { .prc-reading { display: block; } }
      `}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#F0F0F0" }}>What a random card returned, before and after costs</div>
          <div style={{ fontSize: "12px", color: "#888", marginTop: "3px" }}>Median across 20K to 74K buy windows per holding period</div>
        </div>
        <button
          className="prc-toggle"
          onClick={() => setShowTable((t) => !t)}
          style={{
            fontSize: "11px",
            minHeight: "32px",
            padding: "4px 12px",
            borderRadius: "999px",
            border: "1px solid #2e2e2e",
            background: "transparent",
            color: "#888",
            cursor: "pointer",
          }}
        >
          {showTable ? "Show chart" : "Show table"}
        </button>
      </div>

      {/* Legend: always present for two series */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "6px", fontSize: "12px", color: "#888" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: GROSS }} /> Gross price move
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: NET }} /> Net of every cost
        </span>
      </div>

      <div ref={wrapRef} style={{ position: "relative", width: "100%" }}>
        {showTable ? (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", margin: "8px 0 4px" }}>
            <thead>
              <tr style={{ color: "#888", textAlign: "left" }}>
                <th style={{ padding: "6px 4px", fontWeight: 500, borderBottom: "1px solid #222" }}>Held for</th>
                <th style={{ padding: "6px 4px", fontWeight: 500, borderBottom: "1px solid #222", textAlign: "right" }}>Gross</th>
                <th style={{ padding: "6px 4px", fontWeight: 500, borderBottom: "1px solid #222", textAlign: "right" }}>Net</th>
                <th style={{ padding: "6px 4px", fontWeight: 500, borderBottom: "1px solid #222", textAlign: "right" }}>Lost to costs</th>
              </tr>
            </thead>
            <tbody>
              {DATA.map((d) => (
                <tr key={d.horizon} style={{ color: "#F0F0F0", fontVariantNumeric: "tabular-nums" }}>
                  <td style={{ padding: "6px 4px", borderBottom: "1px solid #1e1e1e", color: "#888" }}>{d.horizon}</td>
                  <td style={{ padding: "6px 4px", borderBottom: "1px solid #1e1e1e", textAlign: "right" }}>{fmt(d.gross)}</td>
                  <td style={{ padding: "6px 4px", borderBottom: "1px solid #1e1e1e", textAlign: "right" }}>{fmt(d.net)}</td>
                  <td style={{ padding: "6px 4px", borderBottom: "1px solid #1e1e1e", textAlign: "right", color: "#888" }}>
                    {(d.gross - d.net).toFixed(1)} pts
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <svg
            width={width === null ? "100%" : w}
            height={HEIGHT}
            viewBox={`0 0 ${w} ${HEIGHT}`}
            preserveAspectRatio={width === null ? "xMidYMin meet" : undefined}
            role="group"
            aria-label={`Grouped columns. Median gross versus net return by holding period: ${DATA.map((d) => `${d.horizon} ${fmt(d.gross)} gross, ${fmt(d.net)} net`).join("; ")}.`}
            style={{ display: "block", overflow: "visible" }}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Recessive hairline grid */}
            {TICKS.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={w - PAD.right} y1={y(t)} y2={y(t)} stroke={t === 0 ? "#3a3a3a" : "#1E1E1E"} strokeWidth={1} />
                <text
                  x={PAD.left - 8}
                  y={y(t)}
                  dy="0.32em"
                  textAnchor="end"
                  fontSize={11}
                  fill="#888"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {t > 0 ? `+${t}%` : `${t}%`}
                </text>
              </g>
            ))}

            {DATA.map((d, i) => {
              const cx = PAD.left + band * i + band / 2;
              const xG = cx - BAR_W - BAR_GAP / 2;
              const xN = cx + BAR_GAP / 2;
              const isActive = active === i;
              const isFocused = focused === i;
              const dim = active !== null && !isActive;
              return (
                <g key={d.horizon}
                  tabIndex={0}
                  role="img"
                  aria-label={`${d.horizon}: gross ${fmt(d.gross)}, net ${fmt(d.net)}`}
                  onMouseEnter={() => setHovered(i)}
                  onFocus={(e) => (isKeyboardFocus(e.currentTarget) ? setFocused(i) : setHovered(i))}
                  onBlur={() => {
                    setFocused(null);
                    setHovered((h) => (h === i ? null : h));
                  }}
                  style={{ outline: "none", cursor: "default" }}
                >
                  {/* Hit target: the whole band. Keyboard focus draws a 2px accent ring; hover a hairline. */}
                  <rect
                    x={PAD.left + band * i + 0.5}
                    y={PAD.top + 0.5}
                    width={band - 1}
                    height={plotH - 1}
                    rx={6}
                    fill={isActive ? "#ffffff08" : "transparent"}
                    stroke={isFocused ? "#00D8FF" : isActive ? "#3a3a3a" : "none"}
                    strokeWidth={isFocused ? 2 : 1}
                  />
                  <path d={barPath(xG, BAR_W, yZero, y(d.gross))} fill={GROSS} opacity={dim ? 0.35 : 1} />
                  <path d={barPath(xN, BAR_W, yZero, y(d.net))} fill={NET} opacity={dim ? 0.35 : 1} />
                  {/* Selective direct label: the net value, which is the story. Anchored
                      to the net bar's left edge so it never runs into the taller gross bar. */}
                  <text
                    x={d.net >= 0 ? xN : xN + BAR_W / 2}
                    y={d.net >= 0 ? y(d.net) - 6 : y(d.net) + 14}
                    textAnchor={d.net >= 0 ? "start" : "middle"}
                    fontSize={11}
                    fontWeight={600}
                    fill="#F0F0F0"
                    opacity={dim ? 0.4 : 1}
                  >
                    {fmt(d.net)}
                  </text>
                  <text x={cx} y={HEIGHT - 8} textAnchor="middle" fontSize={11} fill="#888">
                    {d.horizon}
                  </text>
                </g>
              );
            })}
          </svg>
        )}

        {/* Tooltip */}
        {!showTable && !narrow && active !== null && tooltipLeft(active) !== null && (
          <div
            role="status"
            style={{
              position: "absolute",
              top: PAD.top,
              left: tooltipLeft(active) ?? 0,
              width: `${TOOLTIP_W}px`,
              padding: "10px 12px",
              borderRadius: "10px",
              background: "#0a0a0a",
              border: "1px solid #2e2e2e",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              fontSize: "12px",
              color: "#888",
              pointerEvents: "none",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <div style={{ color: "#F0F0F0", fontWeight: 600, marginBottom: "6px" }}>Held {DATA[active].horizon}</div>
            <Row swatch={GROSS} label="Gross" value={fmt(DATA[active].gross)} />
            <Row swatch={NET} label="Net" value={fmt(DATA[active].net)} />
            <div style={{ borderTop: "1px solid #222", marginTop: "6px", paddingTop: "6px", display: "flex", justifyContent: "space-between" }}>
              <span>Lost to costs</span>
              <span style={{ color: "#F0F0F0" }}>{(DATA[active].gross - DATA[active].net).toFixed(1)} pts</span>
            </div>
          </div>
        )}
      </div>

      {/* Narrow-width reading. Rendered from the server on, shown by a container query until the width
          is measured and by the same `narrow` test as the tooltip after; room for two lines, so neither
          hydration nor a tap moves the text below it. */}
      {!showTable && (
        <div className="prc-reading" role="status" style={{ ...(width === null ? {} : { display: narrow ? "block" : "none" }), minHeight: "3em", lineHeight: 1.5, marginTop: "6px", fontSize: "12px", color: "#888", fontVariantNumeric: "tabular-nums" }}>
          {active !== null ? (
            <>
              <span style={{ color: "#F0F0F0", fontWeight: 600 }}>Held {DATA[active].horizon}</span> · gross {fmt(DATA[active].gross)} · net{" "}
              <span style={{ color: "#F0F0F0" }}>{fmt(DATA[active].net)}</span> · {(DATA[active].gross - DATA[active].net).toFixed(1)} pts to costs
            </>
          ) : (
            "Tap a column for its numbers"
          )}
        </div>
      )}

      <div style={{ fontSize: "11px", color: "#888", marginTop: "8px", lineHeight: 1.5 }}>
        Costs: entry spread, sales tax, shipping, venue fees, realisation, an illiquidity haircut and capital gains tax.
      </div>
    </div>
  );
}

/** Keyboard focus only: a mouse click or tap also focuses the column, and must not pin the reading. */
function isKeyboardFocus(el: Element) {
  try {
    return el.matches(":focus-visible");
  } catch {
    return false;
  }
}

function Row({ swatch, label, value }: { swatch: string; label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px" }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
        <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: swatch }} />
        {label}
      </span>
      <span style={{ color: "#F0F0F0" }}>{value}</span>
    </div>
  );
}
