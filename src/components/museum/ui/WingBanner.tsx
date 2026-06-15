import { useEffect, useRef } from "react";

type Props = {
  /** Display name of the wing the player just entered. */
  name: string;
};

/**
 * Brief wing title that fades in and out when the player crosses into a new
 * room. The parent remounts this with a `key` per room, so the entry animation
 * replays on every transition. Uses the Web Animations API to avoid wiring a
 * global keyframe just for this.
 */
export function WingBanner({ name }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const anim = el.animate(
      [
        { opacity: 0, transform: "translate(-50%, -8px)" },
        { opacity: 1, transform: "translate(-50%, 0)", offset: 0.18 },
        { opacity: 1, transform: "translate(-50%, 0)", offset: 0.75 },
        { opacity: 0, transform: "translate(-50%, -8px)" },
      ],
      { duration: 2200, easing: "ease-out", fill: "forwards" },
    );
    return () => anim.cancel();
  }, [name]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: "absolute",
        left: "50%",
        top: "8%",
        transform: "translate(-50%, -8px)",
        opacity: 0,
        pointerEvents: "none",
        padding: "0.3rem 1rem",
        borderRadius: "9999px",
        background: "rgba(10, 10, 10, 0.82)",
        border: "1px solid rgba(0, 216, 255, 0.4)",
        color: "#dfeff3",
        fontSize: "0.82rem",
        fontWeight: 600,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        fontFamily: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      {name}
    </div>
  );
}

export default WingBanner;
