import styles from "./graphics.module.css";

/** Signature device: a dark disk whose upper rim catches a thin spectral light. */
export function Horizon() {
  return (
    <div className={styles.horizon} aria-hidden="true">
      <div className={styles.ribs} />
      <div className={styles.ringBlur} />
      <div className={styles.ring} />
      <div className={styles.disk} />
    </div>
  );
}

/**
 * The relationship model as a funnel: many listings narrow to the businesses
 * with findings, then to one pitch. Low-contrast lines on black.
 */
export function Funnel() {
  const rings = [0, 1, 2, 3, 4, 5, 6, 7];
  const spokes = Array.from({ length: 13 }, (_, i) => i);
  const top = { cx: 260, cy: 70, rx: 230, ry: 46 };
  const bottom = { cx: 260, cy: 380, rx: 26, ry: 6 };
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  return (
    <svg className={styles.funnel} viewBox="0 0 520 420" role="img" aria-label="Funnel from listings to findings to one pitch">
      {rings.map((i) => {
        const t = Math.pow(i / (rings.length - 1), 0.85);
        return (
          <ellipse
            key={i}
            cx={lerp(top.cx, bottom.cx, t)}
            cy={lerp(top.cy, bottom.cy, t)}
            rx={lerp(top.rx, bottom.rx, t)}
            ry={lerp(top.ry, bottom.ry, t)}
            fill="none"
            stroke="#fff"
            strokeOpacity={0.14 + i * 0.02}
          />
        );
      })}
      {spokes.map((i) => {
        const a = Math.PI * (i / (spokes.length - 1));
        const x1 = top.cx - Math.cos(a) * top.rx;
        const y1 = top.cy + Math.sin(a) * top.ry;
        const x2 = bottom.cx - Math.cos(a) * bottom.rx;
        const y2 = bottom.cy + Math.sin(a) * bottom.ry;
        return (
          <path
            key={i}
            d={`M${x1} ${y1} C ${x1} ${y1 + 150}, ${x2} ${y2 - 120}, ${x2} ${y2}`}
            fill="none"
            stroke="#fff"
            strokeOpacity={0.12}
          />
        );
      })}
      {[
        [96, 104],
        [380, 92],
        [205, 120],
        [318, 180],
        [190, 238],
        [262, 300],
      ].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x - 2} y={y - 2} width="4" height="4" fill="#cfd9f8" />
      ))}
      <circle cx={bottom.cx} cy={bottom.cy} r="4" fill="#6f95ff" />
      <g className={styles.funnelLabels}>
        <text x="30" y="30">Listings</text>
        <text x="372" y="210">Findings</text>
        <text x="282" y="404">One pitch</text>
      </g>
    </svg>
  );
}

/** Atmospheric scale curve: a thin blue line over fine stems. Not a data chart. */
export function ScaleCurve() {
  return (
    <svg className={styles.curve} viewBox="0 0 1000 560" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="curve-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#386be5" stopOpacity="0.18" />
          <stop offset="1" stopColor="#386be5" stopOpacity="0" />
        </linearGradient>
        <pattern id="curve-stems" width="8" height="560" patternUnits="userSpaceOnUse">
          <rect width="1" height="560" fill="#e4e7ec" />
        </pattern>
        <clipPath id="curve-clip">
          <path d="M0 520 C 420 515, 700 420, 1000 20 L 1000 560 L 0 560 Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#curve-clip)">
        <rect width="1000" height="560" fill="url(#curve-stems)" />
        <rect width="1000" height="560" fill="url(#curve-fill)" />
      </g>
      <path
        d="M0 520 C 420 515, 700 420, 1000 20"
        fill="none"
        stroke="#386be5"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
