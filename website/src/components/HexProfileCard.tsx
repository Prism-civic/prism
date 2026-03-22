"use client";

import React from "react";
import type { TraitScores } from "./AlignmentRadar";

/**
 * HexProfileCard — hexagonal photo with radar overlay.
 *
 * Inverse mask overlay: the area OUTSIDE the trait polygon is dimmed to
 * greyscale, making the trait shape pop clearly against any background.
 *
 * NVI photo URL pattern (reverse-engineered from vtr.valasztas.hu JS bundle):
 *   /kepek/${n[-2]}/${n[-1]}/Kep-${photoId}.JPG
 */

const NVI_PHOTO_BASE = "https://vtr.valasztas.hu/ogy2026/kepek";

function nviPhotoUrl(photoId: number): string {
  const s = String(photoId);
  const secondLast = s[s.length - 2] ?? "0";
  const last = s[s.length - 1] ?? "0";
  return `${NVI_PHOTO_BASE}/${secondLast}/${last}/Kep-${photoId}.JPG`;
}

// ── Hex geometry helpers ──────────────────────────────────────────────────────

function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(" ");
}

// ── Radar path helper (mirrors AlignmentRadar logic) ─────────────────────────

const TRAITS = ["eu", "migracio", "gazdasag", "jogallamisag", "ukrajna", "kornyezet"] as const;
type Trait = typeof TRAITS[number];

const TRAIT_LABELS: Record<Trait, { hu: string; en: string }> = {
  eu:           { hu: "EU",          en: "EU" },
  migracio:     { hu: "Migráció",    en: "Migration" },
  gazdasag:     { hu: "Gazdaság",    en: "Economy" },
  jogallamisag: { hu: "Jogáll.",     en: "Law" },
  ukrajna:      { hu: "Ukrajna",     en: "Ukraine" },
  kornyezet:    { hu: "Klíma",       en: "Climate" },
};

function calcAlignment(user: number, party: number): number {
  return (5 - Math.abs(user - party) - 1) / 4;
}

function radarPath(
  userScores: TraitScores,
  partyScores: TraitScores,
  cx: number,
  cy: number,
  maxR: number
): string {
  const n = TRAITS.length;
  const angles = TRAITS.map((_, i) => -Math.PI / 2 + (2 * Math.PI * i) / n);
  const pts = TRAITS.map((t, i) => {
    const v = calcAlignment(userScores[t], partyScores[t]);
    return {
      x: cx + v * maxR * Math.cos(angles[i]),
      y: cy + v * maxR * Math.sin(angles[i]),
    };
  });
  return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";
}

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  photoId?: number | null;
  partyId?: string | null;
  partyColour?: string;
  size?: number;
  alt?: string;
  userScores?: TraitScores | null;
  partyScores?: TraitScores | null;
  lang?: "en" | "hu";
  showRadar?: boolean;
};

// ── Component ─────────────────────────────────────────────────────────────────

export function HexProfileCard({
  photoId,
  partyId,
  partyColour = "#666",
  size = 80,
  alt = "Profile",
  userScores,
  partyScores,
  lang = "en",
  showRadar = true,
}: Props) {
  const [imgError, setImgError] = React.useState(false);

  const imgSrc = photoId
    ? nviPhotoUrl(photoId)
    : partyId
    ? `/parties/${partyId}.png`
    : null;

  const hasRadar = showRadar && userScores && partyScores;

  // Unique IDs for SVG defs (per size + partyId to avoid conflicts on the same page)
  const uid = `${partyId ?? photoId ?? "p"}-${size}`;
  const clipId    = `hpc-clip-${uid}`;
  const maskId    = `hpc-mask-${uid}`;
  const filterId  = `hpc-gray-${uid}`;

  const cx = size / 2;
  const cy = size / 2;
  const r  = size / 2 - 1;
  const hexPts = hexPoints(cx, cy, r);

  // Radar geometry (drawn inside the hex)
  const maxR  = size * 0.38;
  const labelR = size * 0.47;
  const n = TRAITS.length;
  const angles = TRAITS.map((_, i) => -Math.PI / 2 + (2 * Math.PI * i) / n);
  const rPath = hasRadar ? radarPath(userScores!, partyScores!, cx, cy, maxR) : "";

  // Hex inner ring for colour border (slightly smaller)
  const rRing = hexPoints(cx, cy, r - 1);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        overflow="visible"
      >
        <defs>
          {/* Hex clip — confines image to hex shape */}
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <polygon points={hexPts} />
          </clipPath>

          {/* Greyscale + dim filter for "outside" overlay */}
          <filter id={filterId} x="0" y="0" width="100%" height="100%">
            <feColorMatrix type="saturate" values="0" result="grey" />
            <feComponentTransfer in="grey">
              <feFuncR type="linear" slope="0.35" />
              <feFuncG type="linear" slope="0.35" />
              <feFuncB type="linear" slope="0.35" />
            </feComponentTransfer>
          </filter>

          {/* Mask: white = show filtered (outside), black = show original (inside trait shape) */}
          {hasRadar && (
            <mask id={maskId}>
              {/* White fills the whole hex — everything gets filter by default */}
              <polygon points={hexPts} fill="white" />
              {/* Black = trait shape = exclude from filter (stays vivid) */}
              <path d={rPath} fill="black" />
            </mask>
          )}
        </defs>

        {/* ── Photo / placeholder ── */}
        {imgSrc && !imgError ? (
          <>
            {/* Vivid layer — clipped to hex, only shows through where mask is black (inside trait) */}
            <image
              href={imgSrc}
              x="0" y="0"
              width={size} height={size}
              preserveAspectRatio="xMidYMid slice"
              clipPath={`url(#${clipId})`}
              onError={() => setImgError(true)}
            />
            {/* Greyscale+dim layer — only shows where mask is white (outside trait) */}
            {hasRadar && (
              <image
                href={imgSrc}
                x="0" y="0"
                width={size} height={size}
                preserveAspectRatio="xMidYMid slice"
                clipPath={`url(#${clipId})`}
                filter={`url(#${filterId})`}
                mask={`url(#${maskId})`}
              />
            )}
          </>
        ) : (
          <polygon
            points={hexPts}
            fill={`${partyColour}22`}
          />
        )}

        {/* ── Initials fallback ── */}
        {(!imgSrc || imgError) && (
          <text
            x={cx} y={cy}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={size * 0.28}
            fill="rgba(255,255,255,0.6)"
            fontWeight="bold"
          >
            {alt.charAt(0)}
          </text>
        )}

        {/* ── Radar overlay ── */}
        {hasRadar && (
          <>
            {/* Grid rings */}
            {[0.25, 0.5, 0.75, 1].map((frac) => {
              const pts = angles.map((a) => ({
                x: cx + frac * maxR * Math.cos(a),
                y: cy + frac * maxR * Math.sin(a),
              }));
              const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";
              return <path key={frac} d={d} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" />;
            })}
            {/* Axis lines */}
            {angles.map((a, i) => (
              <line
                key={i}
                x1={cx} y1={cy}
                x2={(cx + maxR * Math.cos(a)).toFixed(1)}
                y2={(cy + maxR * Math.sin(a)).toFixed(1)}
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="0.5"
              />
            ))}
            {/* Trait fill */}
            <path
              d={rPath}
              fill="rgba(99,179,237,0.28)"
              stroke="rgba(147,210,255,0.95)"
              strokeWidth={Math.max(1, size * 0.018)}
            />
            {/* Trait labels — only shown if size big enough */}
            {size >= 100 && TRAITS.map((t, i) => {
              const lx = cx + labelR * Math.cos(angles[i]);
              const ly = cy + labelR * Math.sin(angles[i]);
              return (
                <text
                  key={t}
                  x={lx.toFixed(1)} y={ly.toFixed(1)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={Math.max(6, size * 0.055)}
                  fill="rgba(255,255,255,0.92)"
                  fontWeight="600"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
                >
                  {TRAIT_LABELS[t][lang]}
                </text>
              );
            })}
          </>
        )}

        {/* ── Party colour ring ── */}
        <polygon
          points={rRing}
          fill="none"
          stroke={partyColour}
          strokeWidth={Math.max(1.5, size * 0.025)}
          opacity="0.8"
        />
      </svg>
    </div>
  );
}
