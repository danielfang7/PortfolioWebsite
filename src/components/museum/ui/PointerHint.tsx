type PointerHintProps = {
  /** Copy for touch screens, where there is no keyboard. */
  touch: string;
  /** Copy for a mouse or trackpad. */
  mouse: string;
};

/**
 * Renders both strings and lets a `(pointer: coarse)` media query show one.
 * Choosing in CSS rather than state keeps the server markup right on the first
 * paint (the home page's preview is server-rendered and hydrates late) and
 * leaves nothing for hydration to disagree about.
 */
export default function PointerHint({ touch, mouse }: PointerHintProps) {
  return (
    <>
      <span className="[@media(pointer:coarse)]:hidden">{mouse}</span>
      <span className="hidden [@media(pointer:coarse)]:inline">{touch}</span>
    </>
  );
}
