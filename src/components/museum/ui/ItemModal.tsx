import { Suspense, useEffect, useRef, useState } from "react";
import type { Experiment } from "@/data/experiments";
import type { WorkRef, InvestmentRef } from "../data";
import { LIVE_PAINTINGS } from "../paintings/paintingRegistry";

type Props =
  | { kind: "painting"; experiment: Experiment; onClose: () => void }
  | { kind: "computer"; work: WorkRef; onClose: () => void }
  | { kind: "investment"; investment: InvestmentRef; onClose: () => void };

const ACCENT = "#00D8FF";
const MONO =
  '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

/** Map a raster asset path to its WebP sibling (generated at build time). */
const toWebp = (src: string) => src.replace(/\.(png|jpe?g)$/i, ".webp");

type ExternalLink = { label: string; href: string };

/** Normalized presentation model so the markup stays kind-agnostic. */
type View = {
  kindLabel: string;
  title: string;
  description: string;
  year: string;
  tags: string[];
  accent: string;
  /** Primary CTA. */
  href: string;
  ctaLabel: string;
  /** Optional subtitle under the title (e.g. a work's role). */
  subtitle?: string;
  /** Header preview. */
  preview:
    | { type: "live"; Comp: React.LazyExoticComponent<React.ComponentType> }
    | { type: "image"; src: string }
    | { type: "logo"; src: string }
    | { type: "none" };
  external: ExternalLink[];
};

function buildView(props: Props): View {
  if (props.kind === "painting") {
    const e = props.experiment;
    const Comp = LIVE_PAINTINGS[e.slug];
    return {
      kindLabel: "Experiment",
      title: e.title,
      description: e.description,
      year: e.year,
      tags: e.tech,
      accent: e.color || ACCENT,
      href: `/lab/${e.slug}`,
      ctaLabel: "View experiment",
      preview: Comp ? { type: "live", Comp } : { type: "none" },
      external: [],
    };
  }
  if (props.kind === "computer") {
    const w = props.work;
    const external: ExternalLink[] = [];
    if (w.liveUrl) external.push({ label: "Live ↗", href: w.liveUrl });
    if (w.sourceUrl) external.push({ label: "Source ↗", href: w.sourceUrl });
    return {
      kindLabel: "Work",
      title: w.title,
      description: w.description,
      year: w.year,
      tags: w.stack,
      accent: ACCENT,
      href: `/works/${w.slug}`,
      ctaLabel: "View project",
      subtitle: w.role,
      preview: { type: "image", src: w.thumbnail },
      external,
    };
  }
  const inv = props.investment;
  return {
    kindLabel: "Investment",
    title: inv.company,
    description: inv.description,
    year: inv.year,
    tags: [inv.sector, inv.stage],
    accent: inv.color || ACCENT,
    href: "/investments",
    ctaLabel: "View portfolio",
    preview: inv.logo ? { type: "logo", src: inv.logo } : { type: "none" },
    external: inv.url ? [{ label: "Visit ↗", href: inv.url }] : [],
  };
}

/**
 * In-page summary overlay for a museum exhibit. Opens over the museum canvas
 * (no navigation), closes on Escape / backdrop click / the × button, and links
 * out to the full project page for visitors who want more detail.
 */
export function ItemModal(props: Props) {
  const { onClose } = props;
  const [shown, setShown] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Entrance transition + Escape-to-close + body scroll lock.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prevOverflow;
      // Hand keyboard control back to the canvas so WASD/arrows work again
      // without the visitor having to re-click the scene.
      document
        .querySelector<HTMLCanvasElement>("canvas.museum-canvas")
        ?.focus();
    };
  }, [onClose]);

  const v = buildView(props);
  const { accent } = v;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${v.title} — ${v.kindLabel}`}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.25rem",
        background: "rgba(4, 4, 6, 0.72)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        opacity: shown ? 1 : 0,
        transition: "opacity 220ms ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "560px",
          maxHeight: "calc(100vh - 2.5rem)",
          overflowY: "auto",
          borderRadius: "1rem",
          border: `1px solid ${accent}40`,
          background:
            "linear-gradient(180deg, rgba(16,16,20,0.98), rgba(10,10,12,0.98))",
          boxShadow: `0 24px 80px rgba(0,0,0,0.6), 0 0 60px ${accent}1a`,
          transform: shown ? "translateY(0) scale(1)" : "translateY(12px) scale(0.98)",
          transition: "transform 240ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* Preview header — live experiment, work thumbnail, or company logo. */}
        <div
          style={{
            position: "relative",
            aspectRatio: "16 / 9",
            overflow: "hidden",
            borderTopLeftRadius: "1rem",
            borderTopRightRadius: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `radial-gradient(circle at 50% 40%, ${accent}1f, #08080a 72%)`,
          }}
        >
          {v.preview.type === "live" ? (
            <Suspense fallback={null}>
              <v.preview.Comp />
            </Suspense>
          ) : v.preview.type === "image" ? (
            <picture>
              <source srcSet={toWebp(v.preview.src)} type="image/webp" />
              <img
                src={v.preview.src}
                alt={v.title}
                loading="lazy"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </picture>
          ) : v.preview.type === "logo" ? (
            <picture>
              <source srcSet={toWebp(v.preview.src)} type="image/webp" />
              <img
                src={v.preview.src}
                alt={`${v.title} logo`}
                loading="lazy"
                style={{
                  maxWidth: "44%",
                  maxHeight: "56%",
                  objectFit: "contain",
                  display: "block",
                  filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.5))",
                }}
              />
            </picture>
          ) : null}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, transparent 55%, rgba(10,10,12,0.92))",
              pointerEvents: "none",
            }}
          />
        </div>

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: "0.75rem",
            right: "0.75rem",
            width: "2rem",
            height: "2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "9999px",
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(8,8,10,0.7)",
            color: "#dfeff3",
            cursor: "pointer",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M4 4l8 8M12 4l-8 8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div style={{ padding: "1.25rem 1.4rem 1.4rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              fontFamily: MONO,
              fontSize: "0.68rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: accent,
              marginBottom: "0.55rem",
            }}
          >
            <span>{v.kindLabel}</span>
            <span style={{ color: "rgba(223,239,243,0.4)" }}>·</span>
            <span style={{ color: "rgba(223,239,243,0.6)" }}>{v.year}</span>
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#f4f8fa",
              lineHeight: 1.15,
            }}
          >
            {v.title}
          </h2>

          {v.subtitle && (
            <p
              style={{
                margin: "0.4rem 0 0",
                fontSize: "0.85rem",
                color: "rgba(223,239,243,0.55)",
              }}
            >
              {v.subtitle}
            </p>
          )}

          <p
            style={{
              margin: "0.85rem 0 0",
              fontSize: "0.95rem",
              lineHeight: 1.6,
              color: "rgba(223,239,243,0.82)",
            }}
          >
            {v.description}
          </p>

          {v.tags.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.45rem",
                marginTop: "1rem",
              }}
            >
              {v.tags.map((t) => (
                <span
                  key={t}
                  style={{
                    fontFamily: MONO,
                    fontSize: "0.7rem",
                    padding: "0.25rem 0.6rem",
                    borderRadius: "9999px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.04)",
                    color: "rgba(223,239,243,0.7)",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.6rem",
              marginTop: "1.4rem",
            }}
          >
            <a
              href={v.href}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.55rem 1rem",
                borderRadius: "9999px",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#04141a",
                background: accent,
                textDecoration: "none",
              }}
            >
              {v.ctaLabel}
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M6 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>

            {v.external.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                style={secondaryLink}
              >
                {link.label}
              </a>
            ))}
          </div>

          <p
            style={{
              margin: "1.1rem 0 0",
              fontFamily: MONO,
              fontSize: "0.66rem",
              letterSpacing: "0.04em",
              color: "rgba(223,239,243,0.35)",
            }}
          >
            Press Esc to close
          </p>
        </div>
      </div>
    </div>
  );
}

const secondaryLink: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "0.55rem 1rem",
  borderRadius: "9999px",
  fontSize: "0.85rem",
  fontWeight: 500,
  color: "#dfeff3",
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.03)",
  textDecoration: "none",
};

export default ItemModal;
