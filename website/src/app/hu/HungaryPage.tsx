"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import partiesData from "../../data/hungary/parties.json";
import constitData from "../../data/hungary/constituencies.json";

// ── Types ─────────────────────────────────────────────────────────────────────

type Party = {
  id: string;
  name: string;
  leader: string;
  colour: string;
  key_positions: Record<string, string>;
};

type Constituency = {
  id: string;
  name: string;
  name_hu: string;
};

type County = {
  name: string;
  name_hu: string;
  constituencies: Constituency[];
};

// ── i18n strings ──────────────────────────────────────────────────────────────

const strings = {
  hu: {
    lang_toggle: "🇬🇧 EN",
    hero_title: "Magyar választások 2026",
    hero_subtitle: "Április 12. — Megérteni a választást, nem megmondani a szavazatot.",
    days_badge: (d: number) => `${d} nappal a választás előtt`,
    party_title: "Pártok összehasonlítása",
    party_subtitle: "A főbb pártok álláspontjai kulcskérdésekben. Minden forrásból.",
    issues: {
      eu_relations: "EU kapcsolatok",
      migration: "Migráció",
      economy: "Gazdaság",
      rule_of_law: "Jogállamiság",
      ukraine_russia: "Ukrajna/Oroszország",
    },
    constituency_title: "Választókerületek",
    select_county: "Válassz megyét...",
    candidates_soon: "Jelöltek hamarosan",
    sources_label: "Forrás",
    sources: "NVI (vtr.valasztas.hu), parlament.hu, párthonlapok",
    disclaimer:
      "Minden pártálláspontot nyilvánosan elérhető manifesztumokból vettük. Nincs szerkesztői álláspont. Nincs szavazási ajánlás.",
    charter_link: "Humanitárius Charta",
    github_link: "GitHub",
    back_home: "← Prism",
  },
  en: {
    lang_toggle: "🇭🇺 HU",
    hero_title: "Hungary Election 2026",
    hero_subtitle: "12 April — Understand the election, not be told how to vote.",
    days_badge: (d: number) => `${d} days to the election`,
    party_title: "Party Comparison",
    party_subtitle: "Main party positions on key issues. All sourced.",
    issues: {
      eu_relations: "EU Relations",
      migration: "Migration",
      economy: "Economy",
      rule_of_law: "Rule of Law",
      ukraine_russia: "Ukraine/Russia",
    },
    constituency_title: "Constituencies",
    select_county: "Select a county...",
    candidates_soon: "Candidates coming soon",
    sources_label: "Sources",
    sources: "NVI (vtr.valasztas.hu), parliament.hu, party websites",
    disclaimer:
      "All party positions are based on publicly stated manifesto positions. No editorial stance. No voting recommendations.",
    charter_link: "Humanitarian Charter",
    github_link: "GitHub",
    back_home: "← Prism",
  },
} as const;

type Lang = keyof typeof strings;

const ISSUE_KEYS = [
  "eu_relations",
  "migration",
  "economy",
  "rule_of_law",
  "ukraine_russia",
] as const;

const ELECTION_DATE = new Date("2026-04-12T00:00:00");

function daysToElection(): number {
  const now = new Date();
  const diff = ELECTION_DATE.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ── Component ─────────────────────────────────────────────────────────────────

export function HungaryPage() {
  const [lang, setLang] = useState<Lang>("hu");
  const [selectedCounty, setSelectedCounty] = useState<string>("");

  // Restore language preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("prism-lang-hu") as Lang | null;
      if (saved === "en" || saved === "hu") setLang(saved);
    } catch {
      // localStorage unavailable — stay on default
    }
  }, []);

  function toggleLang() {
    const next: Lang = lang === "hu" ? "en" : "hu";
    setLang(next);
    try {
      localStorage.setItem("prism-lang-hu", next);
    } catch {
      // ignore
    }
  }

  const t = strings[lang];
  const parties = partiesData.parties as Party[];
  const counties = constitData.counties as County[];
  const days = daysToElection();

  const selectedCountyData = counties.find((c) => c.name === selectedCounty);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="flex items-center justify-between rounded-full border border-line/80 bg-panel-strong/90 px-4 py-3 backdrop-blur sm:px-6">
        <Link
          href="/"
          className="text-sm text-muted hover:text-foreground transition"
        >
          {t.back_home}
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-xs text-muted">
            {t.party_title}
          </span>
          <button
            onClick={toggleLang}
            className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-foreground hover:border-white/30 hover:bg-white/5 transition"
            aria-label="Toggle language"
          >
            {t.lang_toggle}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="section-card rounded-[2rem] px-6 py-8 sm:px-10 sm:py-10">
        <div className="space-y-4 max-w-2xl">
          <span className="inline-block rounded-full border border-amber/40 bg-amber/10 px-3 py-1 text-xs font-medium text-amber">
            {t.days_badge(days)}
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {t.hero_title}
          </h1>
          <p className="text-lg leading-8 text-muted">{t.hero_subtitle}</p>
        </div>
      </section>

      {/* Party Comparison */}
      <section className="section-card rounded-[2rem] px-5 py-6 sm:px-8 sm:py-8">
        <div className="mb-6 space-y-1">
          <p className="eyebrow text-xs font-medium text-muted">
            {t.party_title}
          </p>
          <p className="text-sm text-muted">{t.party_subtitle}</p>
        </div>

        {/* Scrollable table */}
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full min-w-[700px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-36 py-3 pr-4 text-left text-xs font-medium text-muted" />
                {parties.map((p) => (
                  <th
                    key={p.id}
                    className="py-3 px-3 text-center text-xs font-semibold text-foreground"
                    style={{ borderTop: `3px solid ${p.colour}` }}
                  >
                    <div>{p.name}</div>
                    <div className="mt-0.5 font-normal text-muted">
                      {p.leader}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ISSUE_KEYS.map((key, i) => (
                <tr
                  key={key}
                  className={i % 2 === 0 ? "bg-white/[0.02]" : ""}
                >
                  <td className="py-3 pr-4 text-xs font-medium text-muted align-top">
                    {t.issues[key]}
                  </td>
                  {parties.map((p) => (
                    <td
                      key={p.id}
                      className="py-3 px-3 text-xs leading-6 text-foreground/80 align-top border-t border-line/40"
                    >
                      {p.key_positions[key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Constituency Lookup */}
      <section className="section-card rounded-[2rem] px-5 py-6 sm:px-8 sm:py-8">
        <p className="eyebrow text-xs font-medium text-muted mb-4">
          {t.constituency_title}
        </p>

        <select
          value={selectedCounty}
          onChange={(e) => setSelectedCounty(e.target.value)}
          className="w-full max-w-sm rounded-xl border border-line bg-panel px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-white/20"
          aria-label={t.select_county}
        >
          <option value="">{t.select_county}</option>
          {counties.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name_hu}
            </option>
          ))}
        </select>

        {selectedCountyData && (
          <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {selectedCountyData.constituencies.map((con) => (
              <li
                key={con.id}
                className="rounded-xl border border-line/60 bg-panel/60 px-4 py-3"
              >
                <p className="text-sm font-medium text-foreground">
                  {con.name_hu}
                </p>
                <p className="mt-0.5 text-xs text-muted">{con.id}</p>
                <p className="mt-1.5 text-xs text-muted/70 italic">
                  {t.candidates_soon}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Footer */}
      <footer className="mb-4 rounded-[1.75rem] border border-line/80 bg-panel/70 px-5 py-5 text-xs text-muted backdrop-blur space-y-2">
        <p>
          <span className="font-medium text-foreground/60">
            {t.sources_label}:
          </span>{" "}
          {t.sources}
        </p>
        <p>{t.disclaimer}</p>
        <div className="flex gap-4 pt-1">
          <a
            href="https://github.com/Prism-civic/prism/blob/main/docs/HUMANITARIAN_CHARTER.md"
            className="hover:text-foreground underline transition"
          >
            {t.charter_link}
          </a>
          <a
            href="https://github.com/Prism-civic/prism"
            className="hover:text-foreground underline transition"
          >
            {t.github_link}
          </a>
        </div>
      </footer>
    </main>
  );
}
