"use client";

/**
 * EvidenceCard — a single intelligence item from one source.
 *
 * Prism principle: every evidence item is sourced, dated, and confidence-labelled.
 * "No data" is shown explicitly. No item is shown without attribution.
 */

type EvidenceItem = {
  title?: string;
  url?: string;
  date?: string;
  excerpt?: string;
  text?: string;
  source: string;
  weight: "high" | "medium" | "low";
  confidence: "high" | "medium" | "low";
  type?: string;
  note?: string;
  tags?: string[];
};

type Props = {
  item: EvidenceItem;
  sourceLabel: string;
};

const WEIGHT_COLOURS = {
  high:   "border-l-amber/70",
  medium: "border-l-ice/30",
  low:    "border-l-muted/20",
};

const CONFIDENCE_LABELS: Record<string, { label: string; colour: string }> = {
  high:   { label: "Verified source",  colour: "text-healthy" },
  medium: { label: "Likely match",     colour: "text-amber"   },
  low:    { label: "Possible match",   colour: "text-muted"   },
};

function cleanDate(raw?: string): string | null {
  if (!raw) return null;
  // Skip relative strings like "perc" (Hungarian: "minutes ago")
  if (/^[a-zA-ZáéíóöőüűÁÉÍÓÖŐÜŰ\s]+$/.test(raw.trim())) return null;
  // ISO or YYYY-MM-DD
  const match = raw.match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : null;
}

export function EvidenceCard({ item, sourceLabel }: Props) {
  const conf = CONFIDENCE_LABELS[item.confidence] ?? CONFIDENCE_LABELS.medium;
  const weight = WEIGHT_COLOURS[item.weight] ?? WEIGHT_COLOURS.medium;
  const date = cleanDate(item.date);
  const displayText = item.title ?? item.text ?? "—";
  const excerpt = item.excerpt;

  return (
    <div
      className={`rounded-xl border border-line/50 bg-panel/60 border-l-2 ${weight} px-4 py-3 space-y-1.5`}
    >
      {/* Source + confidence row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium tracking-wide text-muted uppercase">
          {sourceLabel}
        </span>
        <span className={`text-[11px] ${conf.colour}`}>{conf.label}</span>
      </div>

      {/* Title / text */}
      {item.url ? (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm font-medium text-foreground/90 hover:text-foreground leading-snug transition"
        >
          {displayText}
          <span className="ml-1 text-muted/50 text-xs">↗</span>
        </a>
      ) : (
        <p className="text-sm font-medium text-foreground/90 leading-snug">{displayText}</p>
      )}

      {/* Excerpt */}
      {excerpt && (
        <p className="text-xs text-muted leading-relaxed line-clamp-3">{excerpt}</p>
      )}

      {/* Note (for business/procurement) */}
      {item.note && !excerpt && (
        <p className="text-xs text-muted/70 italic">{item.note}</p>
      )}

      {/* Footer: date + tags */}
      <div className="flex items-center gap-3 pt-0.5">
        {date && (
          <span className="text-[11px] text-muted/60">{date}</span>
        )}
        {item.tags?.filter(Boolean).slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-white/5 border border-line/40 px-2 py-0.5 text-[10px] text-muted/70"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
