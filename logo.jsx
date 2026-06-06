/* global React */
const { useMemo } = React;

// Generate a dandelion seed head with a natural "release" gap on the
// upper-right — filaments simply aren't drawn there, and a few near the
// edge are rendered as bare stubs (puff already departed). No background
// cutouts, so it works on any color.
function useDandelion(seed = 1) {
  return useMemo(() => {
    let s = seed;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };

    // Gap geometry — keep the dandelion mostly whole. Just a small notch
    // where a few seeds have lifted off, with a soft transition.
    const gapCenter = -Math.PI * 0.28;          // ~upper-right
    const gapHalf   = Math.PI * 0.045;          // total ~16° absent
    const fadeHalf  = Math.PI * 0.06;           // soft transition band

    const filaments = [];
    const N = 50;
    for (let i = 0; i < N; i++) {
      const angle = (i / N) * Math.PI * 2 + rand() * 0.04;

      // Normalize angular distance to gap center, in (-π, π]
      let d = angle - gapCenter;
      while (d >  Math.PI) d -= Math.PI * 2;
      while (d <= -Math.PI) d += Math.PI * 2;
      const absd = Math.abs(d);

      if (absd < gapHalf) {
        // Inside the gap — skip entirely (some bare stubs handled below)
        continue;
      }

      const inFade = absd < gapHalf + fadeHalf;
      // A few stragglers in the fade band: bare stems (no puff), shorter
      const isStub = inFade && rand() < 0.65;

      const radius = (isStub ? 0.55 + rand() * 0.25 : 1) * (92 + rand() * 14);
      filaments.push({ angle, radius, isStub, inFade });
    }
    return filaments;
  }, [seed]);
}

// One floating seed in the reference style: long stem with a small
// brush of curved hairs on one end (the parachute) and a tiny seed body
// on the other.
function FloatingSeed({ x, y, scale = 1, rotate = 0, opacity = 1 }) {
  // Brush: 5 short curved hairs fanning outward from the parachute end
  const hairs = [
    { len: 9,  dy: -6,   curve: 0.9 },
    { len: 11, dy: -3,   curve: 0.4 },
    { len: 12, dy: 0,    curve: 0   },
    { len: 11, dy: 3,    curve: -0.4 },
    { len: 9,  dy: 6,    curve: -0.9 },
  ];
  const stemLen = 34;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale}) rotate(${rotate})`} opacity={opacity}>
      {/* Stem — the seed flies parachute-end-leading, so brush is at +x */}
      <line x1="0" y1="0" x2={stemLen} y2="0"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Seed body at the trailing end */}
      <ellipse cx="-2.2" cy="0" rx="2.6" ry="1.6" fill="currentColor" />
      {/* Brush parachute at the leading end */}
      <g transform={`translate(${stemLen} 0)`}>
        {hairs.map((h, j) => (
          <path key={j}
            d={`M 0 0 Q ${h.len * 0.5} ${h.dy * 0.4 + h.curve * 2} ${h.len} ${h.dy}`}
            fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        ))}
        {hairs.map((h, j) => (
          <circle key={`d-${j}`} cx={h.len} cy={h.dy} r="0.9" fill="currentColor" />
        ))}
      </g>
    </g>
  );
}

// A structurally different dandelion: instead of straight filaments
// radiating from a single center, this version is a soft halo of small
// wispy tufts arranged in a ring. Each tuft is a small splay of curved
// hairs splaying outward + inward — no cross shapes anywhere.
function useTufts(seed = 11) {
  return useMemo(() => {
    let s = seed;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };

    const gapCenter = -Math.PI * 0.28;
    const gapHalf   = Math.PI * 0.045;
    const fadeHalf  = Math.PI * 0.07;

    const tufts = [];
    const N = 26;
    for (let i = 0; i < N; i++) {
      const angle = (i / N) * Math.PI * 2 + rand() * 0.05;

      let d = angle - gapCenter;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d <= -Math.PI) d += Math.PI * 2;
      const absd = Math.abs(d);

      if (absd < gapHalf) continue;

      const inFade = absd < gapHalf + fadeHalf;
      const isSparse = inFade && rand() < 0.55;

      tufts.push({
        angle,
        radius: 70 + rand() * 6,
        wobble: (rand() - 0.5) * 0.2,
        isSparse,
      });
    }
    return tufts;
  }, [seed]);
}

function DandelionOPlume({ size = 1, withSeeds = true, seedCount = 6, seedColor }) {
  const tufts = useTufts(11);

  // One tuft = a small splay of curved hairs from a point on the ring
  const renderTuft = (t, i) => {
    const cx = Math.cos(t.angle) * t.radius;
    const cy = Math.sin(t.angle) * t.radius;
    const angleDeg = (t.angle * 180) / Math.PI;
    // Outward direction is +x in the rotated frame.
    // Generate hairs splaying outward and a couple inward (back toward center)
    const hairs = t.isSparse
      ? [
          { len: 22, dy: 0,   curve: 0.2 },
          { len: 18, dy: -5,  curve: 0.5 },
          { len: 18, dy: 5,   curve: -0.5 },
        ]
      : [
          { len: 30, dy: 0,    curve: 0.0 },
          { len: 26, dy: -7,   curve: 0.6 },
          { len: 26, dy: 7,    curve: -0.6 },
          { len: 18, dy: -12,  curve: 1.0 },
          { len: 18, dy: 12,   curve: -1.0 },
          // a couple short inward hairs for fullness
          { len: 10, dy: -3,   curve: 0.0, inward: true },
          { len: 10, dy: 3,    curve: 0.0, inward: true },
        ];

    return (
      <g key={i} transform={`translate(${cx} ${cy}) rotate(${angleDeg + t.wobble * 30})`}>
        {hairs.map((h, j) => {
          const sign = h.inward ? -1 : 1;
          // Quadratic curve: from origin outward (or inward) with a sideways
          // bow proportional to h.curve, ending at (sign*len, h.dy).
          const ex = sign * h.len;
          const ey = h.dy;
          const cx1 = sign * h.len * 0.55;
          const cy1 = h.dy * 0.4 + h.curve * 4;
          return (
            <path
              key={j}
              d={`M 0 0 Q ${cx1} ${cy1} ${ex} ${ey}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={h.inward ? 1.6 : 2.0}
              strokeLinecap="round"
              opacity={h.inward ? 0.55 : (t.isSparse ? 0.7 : 0.92)}
            />
          );
        })}
      </g>
    );
  };

  return (
    <svg
      viewBox="-160 -160 320 320"
      width={220 * size}
      height={220 * size}
      style={{ display: 'block', overflow: 'visible' }}
    >
      {tufts.map(renderTuft)}

      {/* Tiny center mark — the seed receptacle, much smaller than the
          classic version since the halo carries the silhouette */}
      <circle cx="0" cy="0" r="3.5" fill="currentColor" />

      {withSeeds && (
        <g style={{ color: seedColor || 'currentColor' }}>
          <FloatingSeed x={120} y={-100} scale={0.85} rotate={28} opacity={0.95} />
          <FloatingSeed x={170} y={-55}  scale={0.7}  rotate={48} opacity={0.85} />
          {seedCount >= 3 && <FloatingSeed x={215} y={-120} scale={0.58} rotate={62} opacity={0.7} />}
          {seedCount >= 4 && <FloatingSeed x={195} y={5}    scale={0.5}  rotate={72} opacity={0.6} />}
          {seedCount >= 5 && <FloatingSeed x={260} y={-90}  scale={0.42} rotate={80} opacity={0.5} />}
          {seedCount >= 6 && <FloatingSeed x={140} y={-170} scale={0.46} rotate={20} opacity={0.55} />}
        </g>
      )}
    </svg>
  );
}

function DandelionO({ size = 1, withSeeds = true, seedCount = 6, seedColor, puffStyle = 'cross', variant = 'classic', whole = false }) {
  if (variant === 'plume')     return <DandelionOPlume size={size} withSeeds={withSeeds} seedCount={seedCount} seedColor={seedColor} />;
  if (variant === 'stippled')  return <DandelionOStippled size={size} withSeeds={withSeeds} seedCount={seedCount} seedColor={seedColor} />;
  if (variant === 'starburst') return <DandelionOStarburst size={size} withSeeds={withSeeds} seedCount={seedCount} seedColor={seedColor} />;
  if (variant === 'compact')   return <DandelionOCompact size={size} withSeeds={withSeeds} seedCount={seedCount} seedColor={seedColor} />;
  if (variant === 'orb')       return <DandelionOOrb size={size} withSeeds={withSeeds} seedCount={seedCount} seedColor={seedColor} />;
  return <DandelionOClassic size={size} withSeeds={withSeeds} seedCount={seedCount} seedColor={seedColor} puffStyle={puffStyle} whole={whole} />;
}

// ─── Stippled ───────────────────────────────────────────────────────────
// No lines anywhere. The seed-head is built entirely from small filled
// dots in soft concentric rings — sparser at the perimeter so the
// silhouette feathers naturally.
function DandelionOStippled({ size = 1, withSeeds = true, seedCount = 6, seedColor }) {
  const dots = useMemo(() => {
    let s = 23;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const gapCenter = -Math.PI * 0.28, gapHalf = Math.PI * 0.05, fadeHalf = Math.PI * 0.08;
    const out = [];
    const rings = [
      { r: 35, n: 14, size: 4.2, op: 1 },
      { r: 60, n: 22, size: 3.6, op: 0.95 },
      { r: 82, n: 28, size: 2.8, op: 0.85 },
      { r: 100, n: 30, size: 2.2, op: 0.7 },
    ];
    for (const ring of rings) {
      for (let i = 0; i < ring.n; i++) {
        const a = (i / ring.n) * Math.PI * 2 + rand() * 0.12;
        let d = a - gapCenter;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d <= -Math.PI) d += Math.PI * 2;
        if (Math.abs(d) < gapHalf) continue;
        const fade = Math.abs(d) < gapHalf + fadeHalf && rand() < 0.5;
        if (fade) continue;
        const r = ring.r + (rand() - 0.5) * 6;
        out.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, size: ring.size, op: ring.op });
      }
    }
    return out;
  }, []);

  return (
    <svg viewBox="-160 -160 320 320" width={220 * size} height={220 * size} style={{ display: 'block', overflow: 'visible' }}>
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.size} fill="currentColor" opacity={d.op} />
      ))}
      <circle cx="0" cy="0" r="11" fill="currentColor" />
      {withSeeds && <FloatingFlock seedColor={seedColor} seedCount={seedCount} />}
    </svg>
  );
}

// ─── Starburst ──────────────────────────────────────────────────────────
// Few, long, bare filaments meeting at a generous center — graphic, almost
// asterisk-like. No tip ornaments at all.
function DandelionOStarburst({ size = 1, withSeeds = true, seedCount = 6, seedColor }) {
  const N = 14;
  const filaments = useMemo(() => {
    const gapCenter = -Math.PI * 0.28, gapHalf = Math.PI * 0.13;
    const out = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      let d = a - gapCenter;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d <= -Math.PI) d += Math.PI * 2;
      if (Math.abs(d) < gapHalf) continue;
      out.push(a);
    }
    return out;
  }, []);

  return (
    <svg viewBox="-160 -160 320 320" width={220 * size} height={220 * size} style={{ display: 'block', overflow: 'visible' }}>
      {filaments.map((a, i) => (
        <line key={i} x1="0" y1="0" x2={Math.cos(a) * 105} y2={Math.sin(a) * 105}
          stroke="currentColor" strokeWidth="4.4" strokeLinecap="round" />
      ))}
      <circle cx="0" cy="0" r="22" fill="currentColor" />
      {withSeeds && <FloatingFlock seedColor={seedColor} seedCount={seedCount} />}
    </svg>
  );
}

// ─── Compact pom ────────────────────────────────────────────────────────
// Many short filaments tightly packed into a smaller, denser bloom — reads
// as a tight pom-pom rather than a big airy puff.
function DandelionOCompact({ size = 1, withSeeds = true, seedCount = 6, seedColor }) {
  const filaments = useMemo(() => {
    let s = 41;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const gapCenter = -Math.PI * 0.28, gapHalf = Math.PI * 0.04, fadeHalf = Math.PI * 0.06;
    const N = 84;
    const out = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 + rand() * 0.03;
      let d = a - gapCenter;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d <= -Math.PI) d += Math.PI * 2;
      if (Math.abs(d) < gapHalf) continue;
      const inFade = Math.abs(d) < gapHalf + fadeHalf && rand() < 0.55;
      const radius = (inFade ? 0.5 : 1) * (52 + rand() * 8);
      out.push({ a, radius, isStub: inFade });
    }
    return out;
  }, []);

  return (
    <svg viewBox="-160 -160 320 320" width={220 * size} height={220 * size} style={{ display: 'block', overflow: 'visible' }}>
      {filaments.map((f, i) => {
        const x = Math.cos(f.a) * f.radius;
        const y = Math.sin(f.a) * f.radius;
        return (
          <g key={i}>
            <line x1="0" y1="0" x2={x} y2={y}
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
              opacity={f.isStub ? 0.6 : 0.9} />
            {!f.isStub && <circle cx={x} cy={y} r="2.4" fill="currentColor" />}
          </g>
        );
      })}
      <circle cx="0" cy="0" r="14" fill="currentColor" />
      {withSeeds && <FloatingFlock seedColor={seedColor} seedCount={seedCount} compact />}
    </svg>
  );
}

// ─── Orb ────────────────────────────────────────────────────────────────
// A solid filled disc as the body, with a fringe of seed-parachute hairs
// extending from its perimeter. Reads as a heavy, grounded mark.
function DandelionOOrb({ size = 1, withSeeds = true, seedCount = 6, seedColor }) {
  const fringe = useMemo(() => {
    let s = 53;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const gapCenter = -Math.PI * 0.28, gapHalf = Math.PI * 0.05, fadeHalf = Math.PI * 0.07;
    const N = 36;
    const out = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 + rand() * 0.02;
      let d = a - gapCenter;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d <= -Math.PI) d += Math.PI * 2;
      if (Math.abs(d) < gapHalf) continue;
      const inFade = Math.abs(d) < gapHalf + fadeHalf && rand() < 0.55;
      out.push({ a, len: inFade ? 10 + rand() * 6 : 22 + rand() * 6, isStub: inFade });
    }
    return out;
  }, []);

  const R = 65;
  return (
    <svg viewBox="-160 -160 320 320" width={220 * size} height={220 * size} style={{ display: 'block', overflow: 'visible' }}>
      {fringe.map((f, i) => {
        const x1 = Math.cos(f.a) * R;
        const y1 = Math.sin(f.a) * R;
        const x2 = Math.cos(f.a) * (R + f.len);
        const y2 = Math.sin(f.a) * (R + f.len);
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"
              opacity={f.isStub ? 0.55 : 0.92} />
            {!f.isStub && <circle cx={x2} cy={y2} r="2.6" fill="currentColor" />}
          </g>
        );
      })}
      <circle cx="0" cy="0" r={R} fill="currentColor" />
      {withSeeds && <FloatingFlock seedColor={seedColor} seedCount={seedCount} />}
    </svg>
  );
}

// Shared floating-seeds cluster used by every variant
function FloatingFlock({ seedColor, seedCount = 6, compact = false }) {
  const k = compact ? 0.85 : 1;
  return (
    <g style={{ color: seedColor || 'currentColor' }}>
      <FloatingSeed x={130 * k} y={-110 * k} scale={0.95} rotate={28} opacity={0.95} />
      <FloatingSeed x={185 * k} y={-60 * k}  scale={0.78} rotate={48} opacity={0.85} />
      {seedCount >= 3 && <FloatingSeed x={235 * k} y={-130 * k} scale={0.62} rotate={62} opacity={0.7} />}
      {seedCount >= 4 && <FloatingSeed x={210 * k} y={10 * k}   scale={0.55} rotate={72} opacity={0.6} />}
      {seedCount >= 5 && <FloatingSeed x={285 * k} y={-95 * k}  scale={0.46} rotate={80} opacity={0.5} />}
      {seedCount >= 6 && <FloatingSeed x={155 * k} y={-180 * k} scale={0.5}  rotate={20} opacity={0.55} />}
    </g>
  );
}

function DandelionOClassic({ size = 1, withSeeds = true, seedCount = 6, seedColor, puffStyle = 'brush', whole = false }) {
  const filamentsWithGap = useDandelion(7);
  // For "whole" mode, generate filaments around the full circle with no
  // release gap and no stubs.
  const filamentsWhole = useMemo(() => {
    let s = 7;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const out = [];
    const N = 50;
    for (let i = 0; i < N; i++) {
      out.push({
        angle: (i / N) * Math.PI * 2 + rand() * 0.04,
        radius: 92 + rand() * 14,
        isStub: false,
        inFade: false,
      });
    }
    return out;
  }, []);
  const filaments = whole ? filamentsWhole : filamentsWithGap;

  const renderPuff = (f, x2, y2) => {
    const angleDeg = (f.angle * 180) / Math.PI;
    if (puffStyle === 'brush') {
      // Reference style: a small fan of 5 curved hairs splaying outward
      // from the filament tip, with tiny dot tips. Reads as a seed-pappus
      // brush rather than a cross.
      const hairs = [
        { len: 11, dy: -7,   curve: 0.9 },
        { len: 12, dy: -3.5, curve: 0.4 },
        { len: 13, dy: 0,    curve: 0   },
        { len: 12, dy: 3.5,  curve: -0.4 },
        { len: 11, dy: 7,    curve: -0.9 },
      ];
      return (
        <g transform={`translate(${x2} ${y2}) rotate(${angleDeg})`}>
          {hairs.map((h, j) => (
            <path key={j}
              d={`M 0 0 Q ${h.len * 0.5} ${h.dy * 0.4 + h.curve * 2} ${h.len} ${h.dy}`}
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          ))}
          {hairs.map((h, j) => (
            <circle key={`d-${j}`} cx={h.len} cy={h.dy} r="1.0" fill="currentColor" />
          ))}
        </g>
      );
    }
    if (puffStyle === 'cross') {
      return (
        <g transform={`translate(${x2} ${y2}) rotate(${angleDeg})`}>
          <line x1="-5" y1="0" x2="5" y2="0" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="0" y1="-4" x2="0" y2="4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      );
    }
    if (puffStyle === 'tuft') {
      return (
        <g transform={`translate(${x2} ${y2}) rotate(${angleDeg})`}>
          <line x1="0" y1="0" x2="6" y2="0"  stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="0" y1="0" x2="5" y2="-3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="0" y1="0" x2="5" y2="3"  stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      );
    }
    if (puffStyle === 'dot') {
      return <circle cx={x2} cy={y2} r="4.2" fill="currentColor" />;
    }
    return null;
  };

  return (
    <svg
      viewBox="-160 -160 320 320"
      width={220 * size}
      height={220 * size}
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* Filaments — each a thin line from center to a tip puff.
          Stubs (in the release zone) are bare stems with no puff. */}
      {filaments.map((f, i) => {
        const x2 = Math.cos(f.angle) * f.radius;
        const y2 = Math.sin(f.angle) * f.radius;
        const w = f.isStub ? 2.4 : 3.2;
        return (
          <g key={i}>
            <line
              x1="0"
              y1="0"
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth={w}
              strokeLinecap="round"
              opacity={f.isStub ? 0.6 : 0.92}
            />
            {!f.isStub && renderPuff(f, x2, y2)}
          </g>
        );
      })}

      {/* Center receptacle — generous, like the reference */}
      <circle cx="0" cy="0" r="22" fill="currentColor" />

      {whole ? null : (withSeeds && (
        <g style={{ color: seedColor || 'currentColor' }}>
          {/* Floating seeds drifting up & right */}
          <FloatingSeed x={130} y={-110} scale={0.95} rotate={28} opacity={0.95} />
          <FloatingSeed x={185} y={-60} scale={0.78} rotate={48} opacity={0.85} />
          {seedCount >= 3 && <FloatingSeed x={235} y={-130} scale={0.62} rotate={62} opacity={0.7} />}
          {seedCount >= 4 && <FloatingSeed x={210} y={10} scale={0.55} rotate={72} opacity={0.6} />}
          {seedCount >= 5 && <FloatingSeed x={285} y={-95} scale={0.46} rotate={80} opacity={0.5} />}
          {seedCount >= 6 && <FloatingSeed x={155} y={-180} scale={0.5} rotate={20} opacity={0.55} />}
        </g>
      ))}
    </svg>
  );
}

// The full logo: "H[dandelion]nest digital"
function HonestDigitalLogo({
  size = 1,                 // overall scale multiplier
  color = '#14110E',
  bg,                       // background color, used by the "release" cutouts
  seedColor,                // optional separate color for floating seeds
  withSeeds = true,
  seedCount = 6,
  layout = 'inline',        // 'inline' | 'stacked'
  digitalAlign = 'baseline', // 'baseline' | 'tight'
  textCase = 'sentence',    // 'sentence' (Honest) | 'lower' (honest)
  puffStyle = 'brush',      // 'brush' | 'cross' | 'tuft' | 'dot'
  variant = 'classic',      // 'classic' | 'plume'
  tagline,                  // optional sub-brand line, e.g. "for artists"
  taglineStyle = 'serif',   // 'serif' | 'serif-rules' | 'caps' | 'caps-rules'
  taglineAlign = 'right',   // 'right' (under "digital") | 'center'
}) {
  const fontPx = 220 * size;
  const isLower = textCase === 'lower';
  // Lowercase letters sit at x-height (~70% of cap height), so the
  // dandelion needs to scale down to match the visual rhythm.
  const oSize = size * (isLower ? 0.66 : 0.95);
  // In lowercase, the dandelion sits at x-height — shift it down so it
  // sits on the baseline like an "o", not centered like an "O".
  const oNudgeY = isLower ? 0.08 : -0.02;

  const honest = (
    <span
      style={{
        fontFamily: '"Raleway", "Helvetica Neue", sans-serif',
        fontWeight: 700,
        fontSize: fontPx,
        lineHeight: 0.86,
        letterSpacing: isLower ? '-0.015em' : '-0.02em',
        display: 'inline-flex',
        alignItems: 'center',
        color,
      }}
    >
      <span>{isLower ? 'h' : 'H'}</span>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          // Optical sizing — pull the dandelion in slightly so it sits
          // on the same rhythm as the surrounding letters.
          margin: `0 ${(isLower ? -0.04 : -0.06) * fontPx}px`,
          transform: `translateY(${oNudgeY * fontPx}px)`,
          // Background color lets the "release" cutouts blend
          ['--logo-bg']: bg || 'transparent',
          color,
        }}
      >
        <DandelionO size={oSize} withSeeds={withSeeds} seedCount={seedCount} seedColor={seedColor} puffStyle={puffStyle} variant={variant} />
      </span>
      <span>nest</span>
    </span>
  );

  const digital = (
    <span
      style={{
        fontFamily: '"Times New Roman", "Times", serif',
        fontStyle: 'italic',
        fontWeight: 400,
        fontSize: fontPx * 0.92,
        lineHeight: 1,
        letterSpacing: '0.005em',
        color,
        marginLeft: layout === 'inline' ? `${0.06 * fontPx}px` : 0,
        transform: digitalAlign === 'tight' ? `translateY(${0.04 * fontPx}px)` : 'none',
        display: 'inline-block',
      }}
    >
      digital
    </span>
  );

  // ── Tagline (sub-brand line) ──────────────────────────────────────
  const renderTagline = (alignSelf) => {
    if (!tagline) return null;
    const isCaps = taglineStyle === 'caps' || taglineStyle === 'caps-rules';
    const withRules = taglineStyle === 'serif-rules' || taglineStyle === 'caps-rules';
    const label = isCaps ? (
      <span style={{
        fontFamily: '"Raleway", "Helvetica Neue", sans-serif',
        fontWeight: 700,
        fontSize: fontPx * 0.165,
        letterSpacing: '0.34em',
        textTransform: 'uppercase',
        color,
        paddingLeft: '0.34em', // optical compensation for tracking
      }}>{tagline}</span>
    ) : (
      <span style={{
        fontFamily: '"Times New Roman", "Times", serif',
        fontStyle: 'italic',
        fontWeight: 400,
        fontSize: fontPx * 0.34,
        letterSpacing: '0.01em',
        color,
      }}>{tagline}</span>
    );
    const rule = (
      <span style={{ display: 'block', height: 1, flex: 1, background: color, opacity: 0.5 }} />
    );
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: fontPx * 0.12,
        marginTop: fontPx * (isCaps ? 0.14 : 0.04),
        alignSelf,
        width: withRules ? '100%' : 'auto',
      }}>
        {withRules && rule}
        {label}
        {withRules && rule}
      </div>
    );
  };

  let lockup;
  if (layout === 'stacked') {
    lockup = (
      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
        {honest}
        <div style={{ marginTop: -0.04 * fontPx, marginLeft: 0.16 * fontPx }}>{digital}</div>
      </div>
    );
  } else if (layout === 'stack-center') {
    lockup = (
      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        {honest}
        <div style={{ marginTop: -0.06 * fontPx }}>{digital}</div>
      </div>
    );
  } else {
    lockup = (
      <div style={{ display: 'inline-flex', alignItems: 'baseline', whiteSpace: 'nowrap' }}>
        {honest}
        {digital}
      </div>
    );
  }

  if (!tagline) return lockup;

  // Wrap the lockup + tagline. Default aligns the tagline flush-right under
  // "digital"; 'center' centers it under the whole lockup.
  const centerAll = taglineAlign === 'center' || layout === 'stack-center';
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: centerAll ? 'center' : 'stretch' }}>
      {lockup}
      {renderTagline(centerAll ? 'center' : 'flex-end')}
    </div>
  );
}

Object.assign(window, { HonestDigitalLogo, DandelionO, FloatingSeed });
