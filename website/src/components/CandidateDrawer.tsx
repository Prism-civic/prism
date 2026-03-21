"use client";

import { useEffect, useState, useCallback } from "react";
import { EvidenceCard } from "./EvidenceCard";

/**
 * CandidateDrawer — slides up from the bottom when a candidate is selected.
 *
 * Fetches intelligence from /api/hu/candidate/[id] on open.
 * Displays evidence grouped by source, ordered by weight.
 * Explicit "no data" state per Prism transparency principles.
 */

type Candidate = {
  name: string;
  party: string;
  party_id: string | null;
  nvi_id: number;
  ballot_number: number;
};

type IntelItem = {
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

type SourceData = {
  label: string;
  weight: "high" | "medium" | "low";
  scraped_at?: string;
  item_count: number;
  items: IntelItem[];
};

type IntelResponse = {
  kpn_id: number;
  sources: Record<string, SourceData>;
  generated_at: string;
};

const WEIGHT_ORDER = { high: 0, medium: 1, low: 2 };

const PARTY_COLOURS: Record<string, string> = {
  "fidesz-kdnp": "#FF6600",
  tisza:          "#0066CC",
  "mi-hazank":    "#006400",
  dk:             "#CC0000",
  mkkp:           "#FF1493",
};

const SOURCE_WEIGHT_LABELS = {
  high:   "High-weight source",
  medium: "Medium-weight source",
  low:    "Low-weight source",
};

type Props = {
  candidate: Candidate | null;
  onClose: () => void;
  lang: "hu" | "en";
};

const strings = {
  hu: {
    intelligence_title: "Nyilvános adatok",
    no_data_title: "Nem találtunk nyilvános adatot",
    no_data_body: "Ez nem jelent sem pozitív, sem negatív értékelést — az adatbázis feltöltése folyamatban van.",
    loading: "Adatok betöltése...",
    error: "Az adatok betöltése nem sikerült",
    source_checked: "Ellenőrzött forrás",
    no_items: "Nem találtunk cikket ebben a forrásban",
    official_record: "Hivatalos NVI adatlap",
    close: "Bezárás",
    data_note: "Az adatok nyilvánosan elérhető forrásokból származnak. Nincs szerkesztői állásfoglalás.",
    items_found: (n: number) => `${n} találat`,
    scraping: "Adatgyűjtés folyamatban...",
  },
  en: {
    intelligence_title: "Public Record",
    no_data_title: "No public data found yet",
    no_data_body: "This is not a positive or negative signal — our database is still being populated.",
    loading: "Loading intelligence...",
    error: "Failed to load intelligence data",
    source_checked: "Source checked",
    no_items: "No articles found in this source",
    official_record: "Official NVI record",
    close: "Close",
    data_note: "All data from publicly available sources. No editorial stance.",
    items_found: (n: number) => `${n} result${n !== 1 ? "s" : ""}`,
    scraping: "Data collection in progress...",
  },
};

export function CandidateDrawer({ candidate, onClose, lang }: Props) {
  const [intel, setIntel] = useState<IntelResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = strings[lang];

  const fetchIntel = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    setIntel(null);
    try {
      const res = await fetch(`/api/hu/candidate/${id}`);
      if (res.status === 404) {
        setIntel(null);
        setError("not_found");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setIntel(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (candidate) {
      fetchIntel(candidate.nvi_id);
    } else {
      setIntel(null);
      setError(null);
    }
  }, [candidate, fetchIntel]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!candidate) return null;

  const partyColour = candidate.party_id ? PARTY_COLOURS[candidate.party_id] ?? "#666" : "#666";

  // Sort sources by weight
  const sortedSources = intel
    ? Object.entries(intel.sources).sort(
        ([, a], [, b]) => WEIGHT_ORDER[a.weight] - WEIGHT_ORDER[b.weight]
      )
    : [];

  const totalItems = sortedSources.reduce((sum, [, s]) => sum + s.item_count, 0);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={candidate.name}
        className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-2xl rounded-t-3xl border border-line/80 bg-background shadow-2xl"
        style={{ maxHeight: "85vh", display: "flex", flexDirection: "column" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div
          className="px-5 pt-2 pb-4 border-b border-line/60 flex-shrink-0"
          style={{ borderLeft: `4px solid ${partyColour}` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground leading-snug">
                {candidate.name}
              </h2>
              <p className="text-sm text-muted mt-0.5">{candidate.party}</p>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 rounded-full border border-line/60 px-3 py-1.5 text-xs text-muted hover:text-foreground hover:border-white/20 transition"
              aria-label={t.close}
            >
              {t.close}
            </button>
          </div>

          <a
            href={`https://vtr.valasztas.hu/ogy2026/jelolo-szervezetek/jeloltek/${candidate.nvi_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2.5 text-xs text-muted/70 hover:text-muted transition"
          >
            ↗ {t.official_record}
          </a>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 overscroll-contain">

          {/* Loading */}
          {loading && (
            <div className="py-8 text-center text-sm text-muted animate-pulse">
              {t.loading}
            </div>
          )}

          {/* Error */}
          {!loading && error && error !== "not_found" && (
            <div className="rounded-xl border border-degraded/30 bg-degraded/5 px-4 py-3 text-sm text-muted">
              {t.error}
            </div>
          )}

          {/* Not found / scraping in progress */}
          {!loading && error === "not_found" && (
            <div className="py-6 space-y-2 text-center">
              <p className="text-sm font-medium text-foreground/70">{t.no_data_title}</p>
              <p className="text-xs text-muted">{t.no_data_body}</p>
              <p className="text-xs text-muted/50 italic mt-3">{t.scraping}</p>
            </div>
          )}

          {/* Intelligence sections */}
          {!loading && intel && (
            <>
              {/* Summary bar */}
              <div className="flex items-center justify-between text-xs text-muted">
                <span>{t.intelligence_title}</span>
                {totalItems > 0 && (
                  <span className="text-foreground/60 font-medium">
                    {t.items_found(totalItems)}
                  </span>
                )}
              </div>

              {sortedSources.map(([dirKey, srcData]) => (
                <div key={dirKey} className="space-y-2">
                  {/* Source header */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground/80">
                      {srcData.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted/60">
                        {SOURCE_WEIGHT_LABELS[srcData.weight]}
                      </span>
                      {srcData.item_count > 0 && (
                        <span className="rounded-full bg-white/8 border border-line/40 px-2 py-0.5 text-[10px] text-muted">
                          {srcData.item_count}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Items */}
                  {srcData.items.length === 0 ? (
                    <p className="text-xs text-muted/50 italic pl-1">{t.no_items}</p>
                  ) : (
                    <div className="space-y-2">
                      {srcData.items.map((item, i) => (
                        <EvidenceCard
                          key={i}
                          item={item}
                          sourceLabel={srcData.label}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Transparency footer */}
              <p className="text-[11px] text-muted/50 pb-2">{t.data_note}</p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
