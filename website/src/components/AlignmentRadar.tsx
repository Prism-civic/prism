'use client';

import React from 'react';

const TRAITS = ['eu', 'migracio', 'gazdasag', 'jogallamisag', 'ukrajna', 'kornyezet'] as const;
type Trait = typeof TRAITS[number];

const TRAIT_LABELS: Record<Trait, { hu: string; en: string }> = {
  eu:           { hu: 'EU',           en: 'EU' },
  migracio:     { hu: 'Migráció',     en: 'Migration' },
  gazdasag:     { hu: 'Gazdaság',     en: 'Economy' },
  jogallamisag: { hu: 'Jogállamiság', en: 'Rule of Law' },
  ukrajna:      { hu: 'Ukrajna',      en: 'Ukraine' },
  kornyezet:    { hu: 'Környezet',    en: 'Environment' },
};

export type TraitScores = Record<Trait, number>;

interface AlignmentRadarProps {
  userScores?: TraitScores;
  partyScores: TraitScores;
  size?: number;
  lang?: 'hu' | 'en';
  className?: string;
}

function calcAlignment(user: number, party: number): number {
  // 1 (opposite) → 5 (full alignment), normalised to 0–1
  return (5 - Math.abs(user - party) - 1) / 4;
}

function polarToCartesian(cx: number, cy: number, r: number, angleRad: number) {
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

export function AlignmentRadar({
  userScores,
  partyScores,
  size = 220,
  lang = 'hu',
  className = '',
}: AlignmentRadarProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.36;
  const labelR = size * 0.47;
  const n = TRAITS.length;

  // Angles: start from top (−π/2), go clockwise
  const angles = TRAITS.map((_, i) => -Math.PI / 2 + (2 * Math.PI * i) / n);

  // Radar values: if userScores provided, show alignment; else show raw party score
  const values = TRAITS.map((t, i) => {
    const raw = userScores
      ? calcAlignment(userScores[t], partyScores[t])
      : (partyScores[t] - 1) / 4;
    const pt = polarToCartesian(cx, cy, raw * maxR, angles[i]);
    return { raw, pt };
  });

  const radarPath = values
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${v.pt.x.toFixed(1)},${v.pt.y.toFixed(1)}`)
    .join(' ') + ' Z';

  // Background grid rings
  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      role="img"
      aria-label={lang === 'hu' ? 'Igazodási radar' : 'Alignment radar'}
    >
      {/* Grid rings */}
      {rings.map((r) => {
        const pts = angles.map((a) => polarToCartesian(cx, cy, r * maxR, a));
        const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';
        return <path key={r} d={d} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />;
      })}

      {/* Axis lines */}
      {angles.map((a, i) => {
        const pt = polarToCartesian(cx, cy, maxR, a);
        return <line key={i} x1={cx} y1={cy} x2={pt.x.toFixed(1)} y2={pt.y.toFixed(1)} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />;
      })}

      {/* Radar fill */}
      <path d={radarPath} fill="rgba(99,179,237,0.35)" stroke="rgba(99,179,237,0.9)" strokeWidth="1.5" />

      {/* Trait labels */}
      {TRAITS.map((t, i) => {
        const pt = polarToCartesian(cx, cy, labelR, angles[i]);
        const label = TRAIT_LABELS[t][lang];
        return (
          <text
            key={t}
            x={pt.x.toFixed(1)}
            y={pt.y.toFixed(1)}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={size * 0.058}
            fill="rgba(255,255,255,0.85)"
            fontWeight="500"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}