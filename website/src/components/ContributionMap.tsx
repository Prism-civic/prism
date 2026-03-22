"use client";

import { useEffect, useState } from "react";

/**
 * ContributionMap — The Prism observer network visualisation.
 *
 * Shows:
 * - Total contributors and contribution breakdown by type
 * - Regional participation (all 20 Hungarian counties)
 * - Contribution types with explanations
 * - CTA to join the network
 *
 * D-022: Mock data for Phase 1. Real contributions from phone app
 * will be plugged in during Phase 2.
 */

type Region = {
  county_code: string;
  county_name_en: string;
  county_name_hu: string;
  contributors: number;
  verifications: number;
  reports: number;
  translations: number;
  flags: number;
  active_today: number;
};

type ContributionsData = {
  meta: {
    generated_at: string;
    total_contributors: number;
    total_verifications: number;
    total_reports: number;
    total_translations: number;
    total_flags: number;
    last_contribution: string;
  };
  regions: Region[];
};

type Props = {
  lang: "en" | "hu";
};

const strings = {
  en: {
    title: "A Prism hálózat",
    subtitle: "Intelligence pipeline output for Hungary — 666 candidates tracked.",
    stats_contributors: "Candidates Tracked",
    stats_verifications: "Evidence Items",
    stats_reports: "Flags Raised",
    stats_translations: "Translations",
    stats_flags: "Source Checks",
    regional_title: "Regional Participation",
    regional_subtitle: "Contribution activity by county",
    types_title: "How Contributions Work",
    type_verifications: "✅ Verifications",
    type_verifications_desc: "Users confirm or dispute public record accuracy",
    type_reports: "📍 Ground Reports",
    type_reports_desc: "Timestamped observations from local contributors",
    type_translations: "🌐 Cultural Context",
    type_translations_desc: "Corrections and meaning for local phrases",
    type_flags: "🔍 Evidence Flags",
    type_flags_desc: "Users identify new public record items",
    cta_title: "Join the Network",
    cta_subtitle:
      "The phone app will let you contribute directly. Website users can help too — coming soon.",
    cta_button: "Get Involved",
    last_contribution: (date: string) => {
      const d = new Date(date);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "just now";
      if (diffMins < 60) return `${diffMins} min ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    },
  },
  hu: {
    title: "A Prism hálózat",
    subtitle:
      "Intelligencia pipeline — 666 jelölt nyomon követve Magyarországon.",
    stats_contributors: "Nyomon követett jelöltek",
    stats_verifications: "Bizonyítékok",
    stats_reports: "Jelzések",
    stats_translations: "Fordítások",
    stats_flags: "Forrásellenőrzések",
    regional_title: "Regionális részvétel",
    regional_subtitle: "Közreműködés a megyék szerint",
    types_title: "Hogyan működik a közreműködés",
    type_verifications: "✅ Megerősítések",
    type_verifications_desc: "A felhasználók igazolják vagy vitatják meg a nyilvános adatok helyességét",
    type_reports: "📍 Helyi jelentések",
    type_reports_desc: "Időbélyeggel ellátott megfigyelések a közösségtől",
    type_translations: "🌐 Kulturális kontextus",
    type_translations_desc: "Helyi kifejezések fordítása és értelmezése",
    type_flags: "🔍 Bizonyítékok",
    type_flags_desc: "Felhasználók új nyilvános adatokat azonosítanak",
    cta_title: "Csatlakozz a hálózathoz",
    cta_subtitle:
      "A telefonos alkalmazás lehetővé teszi a közvetlen közreműködést. Az weboldal felhasználói hamarosan csatornát kapnak.",
    cta_button: "Légy részese",
    last_contribution: (date: string) => {
      const d = new Date(date);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "éppen most";
      if (diffMins < 60) return `${diffMins} perce`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} órával ezelőtt`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} nappal ezelőtt`;
    },
  },
};

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let current = 0;
    const increment = Math.ceil(value / 30); // Animate over ~30 frames
    const interval = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(interval);
      } else {
        setDisplayValue(current);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [value]);

  return (
    <div className="flex flex-col items-center p-4 rounded-xl border border-line/40 bg-white/3 hover:bg-white/5 transition">
      <span className="text-2xl mb-1">{icon}</span>
      <p className="text-2xl font-bold text-foreground">{displayValue.toLocaleString()}</p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  );
}

function RegionCard({ region, lang, maxContributors }: { region: Region; lang: "en" | "hu"; maxContributors: number }) {
  const name = lang === "en" ? region.county_name_en : region.county_name_hu;
  const activity = (region.contributors / maxContributors) * 100;

  return (
    <div className="p-3 rounded-lg border border-line/30 bg-white/2 hover:bg-white/5 transition">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-medium text-foreground">{name}</p>
          <p className="text-xs text-muted mt-0.5">
            {region.contributors} {lang === "en" ? "contributor" : "közreműködő"}
            {region.contributors !== 1 ? "s" : ""}
          </p>
        </div>
        {region.active_today > 0 && (
          <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded">
            {region.active_today} {lang === "en" ? "today" : "ma"}
          </span>
        )}
      </div>
      <div className="w-full h-1.5 rounded-full bg-line/20 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
          style={{ width: `${activity}%` }}
        />
      </div>
      <div className="flex gap-2 mt-2 text-[10px] text-muted/60">
        <span>✅ {region.verifications}</span>
        <span>📍 {region.reports}</span>
        <span>🌐 {region.translations}</span>
      </div>
    </div>
  );
}

export function ContributionMap({ lang }: Props) {
  const [data, setData] = useState<ContributionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const t = strings[lang];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/contributions");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error("Failed to load contributions:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !data) {
    return (
      <section className="w-full py-20 px-4 border-t border-line/40 bg-gradient-to-b from-transparent via-purple-950/5 to-transparent">
        <div className="max-w-6xl mx-auto animate-pulse">
          <div className="h-8 bg-white/10 rounded w-1/3 mb-4" />
          <div className="h-4 bg-white/5 rounded w-1/2 mb-12" />
        </div>
      </section>
    );
  }

  const maxContributors = Math.max(...data.regions.map((r) => r.contributors));

  return (
    <section className="w-full py-20 px-4 border-t border-line/40 bg-gradient-to-b from-transparent via-purple-950/5 to-transparent">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">{t.title}</h2>
          <p className="text-lg text-muted max-w-2xl">{t.subtitle}</p>
          <p className="text-xs text-muted/60 mt-2">
            {lang === "en" ? "Last activity: " : "Utolsó tevékenység: "}
            {t.last_contribution(data.meta.last_contribution)}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard
            label={t.stats_contributors}
            value={data.meta.total_contributors}
            icon="👥"
          />
          <StatCard
            label={t.stats_verifications}
            value={data.meta.total_verifications}
            icon="✅"
          />
          <StatCard label={t.stats_reports} value={data.meta.total_reports} icon="📍" />
          <StatCard
            label={t.stats_translations}
            value={data.meta.total_translations}
            icon="🌐"
          />
          <StatCard label={t.stats_flags} value={data.meta.total_flags} icon="🔍" />
        </div>

        {/* Regional Map */}
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-foreground">{t.regional_title}</h3>
            <p className="text-sm text-muted mt-1">{t.regional_subtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {data.regions.map((region) => (
              <RegionCard
                key={region.county_code}
                region={region}
                lang={lang}
                maxContributors={maxContributors}
              />
            ))}
          </div>
        </div>

        {/* Contribution Types */}
        <div className="space-y-6 bg-white/3 rounded-2xl border border-line/20 p-8">
          <div>
            <h3 className="text-xl font-semibold text-foreground">{t.types_title}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <p className="font-medium text-foreground">{t.type_verifications}</p>
              <p className="text-sm text-muted/80">{t.type_verifications_desc}</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">{t.type_reports}</p>
              <p className="text-sm text-muted/80">{t.type_reports_desc}</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">{t.type_translations}</p>
              <p className="text-sm text-muted/80">{t.type_translations_desc}</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">{t.type_flags}</p>
              <p className="text-sm text-muted/80">{t.type_flags_desc}</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/30 p-8 text-center space-y-4">
          <h3 className="text-2xl font-bold text-indigo-300">{t.cta_title}</h3>
          <p className="text-indigo-200/80 max-w-lg mx-auto">{t.cta_subtitle}</p>
          <button className="inline-block mt-4 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition">
            {t.cta_button}
          </button>
        </div>
      </div>
    </section>
  );
}
