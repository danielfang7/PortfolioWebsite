import { Suspense, useEffect, useRef, useState } from "react";
import type { Experiment } from "@/data/experiments";
import type { WorkRef } from "../data";
import { LIVE_PAINTINGS } from "../paintings/paintingRegistry";

type Props =
  | { kind: "painting"; experiment: Experiment; onClose: () => void }
  | { kind: "computer"; work: WorkRef; onClose: () => void };

const ACCENT = "#00D8FF";
const MONO =
  '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

/**
 * In-page summary overlay for a museum exhibit. Opens over the museum canvas
 * (no navigation), closes on Escape / backdrop click / the × button, and links
 * out to the full project page for visitors who want more detail.
 */
export function ItemModal(props: Props) {
  const { kind, onClose } = props;
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

  const isPainting = kind === "painting";
  const title = isPainting ? props.experiment.title : props.work.title;
  const description = isPainting
    ? props.experiment.description
    : props.work.description;
  const year = isPainting ? props.experiment.year : props.work.year;
  const tags = isPainting ? props.experiment.tech : props.work.stack;
  const accent = isPainting ? props.experiment.color || ACCENT : ACCENT;
  const href = isPainting
    ? `/lab/${props.experiment.slug}`
    : `/works/${props.work.slug}`;
  const kindLabel = isPainting ? "Experiment" : "Work";
  const Live = isPainting ? LIVE_PAINTINGS[props.experiment.slug] : undefined;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} — ${kindLabel}`}
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
        {/* Preview header — live experiment or work thumbnail. */}
        <div
          style={{
            position: "relative",
            aspectRatio: "16 / 9",
            overflow: "hidden",
            borderTopLeftRadius: "1rem",
            borderTopRightRadius: "1rem",
            background: `radial-gradient(circle at 50% 40%, ${accent}1f, #08080a 72%)`,
          }}
        >
          {isPainting && Live ? (
            <Suspense fallback={null}>
              <Live />
            </Suspense>
          ) : !isPainting ? (
            <img
              src={props.work.thumbnail}
              alt={title}
              loading="lazy"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
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
            <span>{kindLabel}</span>
            <span style={{ color: "rgba(223,239,243,0.4)" }}>·</span>
            <span style={{ color: "rgba(223,239,243,0.6)" }}>{year}</span>
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
            {title}
          </h2>

          {!isPainting && (
            <p
              style={{
                margin: "0.4rem 0 0",
                fontSize: "0.85rem",
                color: "rgba(223,239,243,0.55)",
              }}
            >
              {props.work.role}
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
            {description}
          </p>

          {tags.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.45rem",
                marginTop: "1rem",
              }}
            >
              {tags.map((t) => (
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
              href={href}
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
              View full project
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

            {!isPainting && props.work.liveUrl && (
              <a
                href={props.work.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={secondaryLink}
              >
                Live ↗
              </a>
            )}
            {!isPainting && props.work.sourceUrl && (
              <a
                href={props.work.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={secondaryLink}
              >
                Source ↗
              </a>
            )}
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
