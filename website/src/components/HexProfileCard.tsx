"use client";

import React from "react";
import { AlignmentRadar } from "./AlignmentRadar";
import type { TraitScores } from "./AlignmentRadar";

/**
 * HexProfileCard — hexagonal photo with radar overlay.
 *
 * Used for both candidates (NVI photo) and parties (local logo).
 * Radar overlay renders the user's alignment against the party/candidate.
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

// Hexagonal SVG clip path — pointy-top orientation
const HEX_CLIP_ID = "hex-clip-prism";

function HexClipDef({ id, size }: { id: string; size: number }) {
  const w = size;
  const h = size;
  // Flat-top hex points, normalized to size
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) / 2;
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(" ");

  return (
    <defs>
      <clipPath id={id} clipPathUnits="userSpaceOnUse">
        <polygon points={points} />
      </clipPath>
    </defs>
  );
}

type Props = {
  /** Candidate NVI photo_id — if provided, fetches from vtr.valasztas.hu */
  photoId?: number | null;
  /** Party id — used to load /parties/{id}.png logo */
  partyId?: string | null;
  /** Party accent colour */
  partyColour?: string;
  /** Size in px (both width and height) */
  size?: number;
  /** Alt text */
  alt?: string;
  /** User alignment scores (for radar overlay) */
  userScores?: TraitScores | null;
  /** Party scores (for radar overlay) */
  partyScores?: TraitScores | null;
  /** Lang for radar labels */
  lang?: "en" | "hu";
  /** Show radar overlay */
  showRadar?: boolean;
};

/**
 * Fallback — initials or party colour placeholder.
 */
function HexPlaceholder({
  size,
  colour,
  initial,
}: {
  size: number;
  colour: string;
  initial?: string;
}) {
  return (
    <div
      className="flex items-center justify-center rounded-sm text-white font-bold select-none"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${colour}44, ${colour}22)`,
        border: `1.5px solid ${colour}66`,
        clipPath:
          "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
        fontSize: size * 0.28,
      }}
    >
      {initial ?? "?"}
    </div>
  );
}

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

  const clipId = `${HEX_CLIP_ID}-${size}`;
  const hasRadar = showRadar && userScores && partyScores;
  const radarSize = Math.round(size * 1.15);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {/* Hex photo */}
      <svg
        width={size}
        height={size}
        style={{ position: "absolute", top: 0, left: 0 }}
        aria-hidden="true"
      >
        <HexClipDef id={clipId} size={size} />

        {/* Party colour ring */}
        <polygon
          points={(() => {
            const w = size;
            const h = size;
            const cx = w / 2;
            const cy = h / 2;
            const r = Math.min(w, h) / 2;
            return Array.from({ length: 6 }, (_, i) => {
              const angle = (Math.PI / 3) * i - Math.PI / 6;
              return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
            }).join(" ");
          })()}
          fill="none"
          stroke={partyColour}
          strokeWidth="2"
          opacity="0.7"
        />

        {imgSrc && !imgError ? (
          <image
            href={imgSrc}
            x="0"
            y="0"
            width={size}
            height={size}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${clipId})`}
            onError={() => setImgError(true)}
          />
        ) : (
          <polygon
            points={(() => {
              const w = size;
              const h = size;
              const cx = w / 2;
              const cy = h / 2;
              const r = Math.min(w, h) / 2 - 1;
              return Array.from({ length: 6 }, (_, i) => {
                const angle = (Math.PI / 3) * i - Math.PI / 6;
                return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
              }).join(" ");
            })()}
            fill={`${partyColour}22`}
          />
        )}
      </svg>

      {/* Initials fallback text when no image */}
      {(!imgSrc || imgError) && (
        <div
          className="absolute inset-0 flex items-center justify-center text-white/60 font-bold pointer-events-none"
          style={{ fontSize: size * 0.28 }}
        >
          {alt.charAt(0)}
        </div>
      )}

      {/* Radar overlay — semi-transparent, centered */}
      {hasRadar && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            opacity: 0.75,
          }}
        >
          <AlignmentRadar
            userScores={userScores}
            partyScores={partyScores}
            size={radarSize}
            lang={lang}
          />
        </div>
      )}
    </div>
  );
}
