"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import partiesData from "../../data/hungary/parties.json";
import candidatesData from "../../data/hungary/candidates.json";
import { CandidateDrawer } from "../../components/CandidateDrawer";
import { AlignmentQuizInline, loadUserProfile } from "../../components/AlignmentQuiz";
import { AlignmentRadar } from "../../components/AlignmentRadar";

import { HexProfileCard } from "../../components/HexProfileCard";
import type { TraitScores } from "../../components/AlignmentRadar";
import partyPositions from "../../data/hu-party-positions.json";

// ── Types ─────────────────────────────────────────────────────────────────────

type Party = {
  id: string;
  name: string;
  leader: string;
  colour: string;
  key_positions: Record<string, string>;
};

type Candidate = {
  name: string;
  party: string;
  party_id: string | null;
  ballot_number: number;
  photo_id: number | null;
  nvi_id: number;
  registered: string;
};

type ConstituencyWithCandidates = {
  county_code: string;
  county_name_hu: string;
  county_name_en: string;
  constituency_no: string;
  name_hu: string;
  name_en: string;
  seat: string;
  candidates: Candidate[];
};

// ── i18n ──────────────────────────────────────────────────────────────────────

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
    constituency_title: "Jelöltek választókerületenként",
    select_county: "Válassz megyét...",
    candidates_label: "jelölt",
    ballot_prefix: "Szavazólap sorszám",
    registered_label: "Bejegyezve",
    no_candidates: "Nincs aktív jelölt",
    view_record: "Nyilvános adatok megtekintése",
    view_record_icon: "›",
    sources_label: "Forrás",
    sources: "NVI (vtr.valasztas.hu), parlament.hu, párthonlapok",
    disclaimer:
      "Minden pártálláspontot nyilvánosan elérhető manifesztumokból vettük. Nincs szerkesztői álláspont. Nincs szavazási ajánlás.",
    data_note: "A jelölti adatok az NVI hivatalos nyilvántartásából származnak (2026-03-21 17:00).",
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
    constituency_title: "Candidates by Constituency",
    select_county: "Select a county...",
    candidates_label: "candidates",
    ballot_prefix: "Ballot no.",
    registered_label: "Registered",
    no_candidates: "No active candidates",
    view_record: "View public record",
    view_record_icon: "›",
    sources_label: "Sources",
    sources: "NVI (vtr.valasztas.hu), parliament.hu, party websites",
    disclaimer:
      "All party positions are based on publicly stated manifesto positions. No editorial stance. No voting recommendations.",
    data_note: "Candidate data sourced from official NVI register (updated 2026-03-21 17:00).",
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
  const diff = ELECTION_DATE.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

// Party colour map for candidate badges
const PARTY_COLOURS: Record<string, string> = {
  "fidesz-kdnp": "#FF6600",
  tisza: "#0066CC",
  "mi-hazank": "#006400",
  dk: "#CC0000",
  mkkp: "#FF1493",
};

function partyBadgeStyle(partyId: string | null) {
  const colour = partyId ? PARTY_COLOURS[partyId] ?? "#666" : "#666";
  return { borderLeft: `3px solid ${colour}` };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function HungaryPage() {
  const [lang, setLang] = useState<Lang>("hu");
  const [selectedCounty, setSelectedCounty] = useState<string>("");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [userProfile, setUserProfile] = useState<TraitScores | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const closeDrawer = useCallback(() => setSelectedCandidate(null), []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("prism-lang-hu") as Lang | null;
      if (saved === "en" || saved === "hu") setLang(saved);
    } catch { /* ignore */ }
  }, []);

  // Suppress body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = selectedCandidate ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selectedCandidate]);

  useEffect(() => {
    const profile = loadUserProfile();
    if (profile) {
      setUserProfile(profile);
      setQuizOpen(false);
    } else {
      setQuizOpen(true);
    }
  }, []);

  const t = strings[lang];
  const parties = partiesData.parties as Party[];
  const constituencies = candidatesData.constituencies as ConstituencyWithCandidates[];
  const days = daysToElection();

  // Build county list from candidates data
  const countiesMap = new Map<string, { name_hu: string; name_en: string; constituencyCount: number }>();
  for (const c of constituencies) {
    if (!countiesMap.has(c.county_name_hu)) {
      countiesMap.set(c.county_name_hu, {
        name_hu: c.county_name_hu,
        name_en: c.county_name_en,
        constituencyCount: 0,
      });
    }
    countiesMap.get(c.county_name_hu)!.constituencyCount++;
  }
  const counties = Array.from(countiesMap.values());

  const countyConstituencies = selectedCounty
    ? constituencies.filter((c) => c.county_name_hu === selectedCounty)
    : [];

  return (
    <>
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="flex items-center justify-between rounded-full border border-line/80 bg-panel-strong/90 px-4 py-3 backdrop-blur sm:px-6">
        <Link href="/" className="text-sm text-muted hover:text-foreground transition">
          {t.back_home}
        </Link>
        <nav className="flex items-center gap-1 text-sm text-muted">
          <Link href="/news" className="rounded-full px-3 py-1.5 text-xs hover:bg-white/5 hover:text-foreground transition">
            {lang === "hu" ? "Hírek" : "News"}
          </Link>
          <Link href="/network" className="rounded-full px-3 py-1.5 text-xs hover:bg-white/5 hover:text-foreground transition">
            {lang === "hu" ? "Hálózat" : "Network"}
          </Link>
          {/* Language selector */}
          <div className="flex items-center rounded-full border border-white/10 overflow-hidden ml-1">
            <button
              onClick={() => { setLang("hu"); try { localStorage.setItem("prism-lang-hu", "hu"); } catch { /* ignore */ } }}
              className={`px-3 py-1.5 text-xs font-medium transition ${lang === "hu" ? "bg-white/10 text-foreground" : "text-muted hover:text-foreground"}`}
            >
              🇭🇺 HU
            </button>
            <button
              onClick={() => { setLang("en"); try { localStorage.setItem("prism-lang-hu", "en"); } catch { /* ignore */ } }}
              className={`px-3 py-1.5 text-xs font-medium transition ${lang === "en" ? "bg-white/10 text-foreground" : "text-muted hover:text-foreground"}`}
            >
              🇬🇧 EN
            </button>
          </div>
        </nav>
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

          {userProfile && (
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/30 px-3 py-1 text-xs text-cyan-300">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                {lang === "hu" ? "Személyes profil aktív — a radar az Ön értékeit mutatja" : "Your profile is active — radar shows your alignment"}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Party Comparison + inline quiz */}
      <section className="section-card rounded-[2rem] px-5 py-6 sm:px-8 sm:py-8">
        <div className="mb-6 space-y-1">
          <p className="eyebrow text-xs font-medium text-muted">{t.party_title}</p>
          <p className="text-sm text-muted">{t.party_subtitle}</p>
        </div>

        {/* Two-column: quiz left, party hexes right */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

          {/* ── Inline quiz panel ── */}
          <div className="lg:w-72 xl:w-80 shrink-0">
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/15 px-4 py-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-cyan-300">
                  {lang === "hu" ? "🎯 Az Ön álláspontjai" : "🎯 Your positions"}
                </p>
                <button
                  onClick={() => setQuizOpen(!quizOpen)}
                  className="text-[10px] text-white/30 hover:text-white/60 transition"
                >
                  {quizOpen
                    ? (lang === "hu" ? "▲ csukja be" : "▲ collapse")
                    : (lang === "hu" ? "▼ nyissa ki" : "▼ expand")}
                </button>
              </div>
              <p className="text-[11px] text-white/45 leading-relaxed">
                {lang === "hu"
                  ? "Állítsa be az egyes csúszkákat — a hatszögek azonnal frissülnek."
                  : "Adjust the sliders — the hexagons update live."}
              </p>
              {quizOpen && (
                <AlignmentQuizInline
                  lang={lang as "hu" | "en"}
                  initialScores={userProfile}
                  onChange={(scores) => setUserProfile(scores)}
                />
              )}
              {!quizOpen && userProfile && (
                <button
                  onClick={() => setQuizOpen(true)}
                  className="text-[11px] text-cyan-400/70 hover:text-cyan-300 transition underline"
                >
                  {lang === "hu" ? "Profil szerkesztése →" : "Edit profile →"}
                </button>
              )}
            </div>
          </div>

          {/* ── Party hexagons ── */}
          <div className="flex-1 min-w-0">
            {/* Party hex row */}
            <div className="flex flex-wrap gap-4 justify-start mb-6">
              {parties.map((p) => (
                <div key={p.id} className="flex flex-col items-center gap-2" style={{ borderTop: `3px solid ${p.colour}`, paddingTop: "8px" }}>
                  <HexProfileCard
                    partyId={p.id}
                    partyColour={p.colour}
                    size={144}
                    alt={p.name}
                    userScores={userProfile}
                    partyScores={(partyPositions.parties as Record<string, TraitScores>)[p.id] ?? null}
                    lang={lang as "en" | "hu"}
                    showRadar={!!userProfile}
                  />
                  <div className="text-center max-w-[144px]">
                    <p className="text-xs font-semibold text-foreground leading-tight">{p.name}</p>
                    <p className="text-[10px] text-muted mt-0.5">{p.leader}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Policy comparison table — scrollable on small screens */}
            <div className="overflow-x-auto -mx-1 px-1">
              <table className="w-full min-w-[600px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="w-28 py-2 pr-4 text-left text-xs font-medium text-muted" />
                    {parties.map((p) => (
                      <th key={p.id} className="py-2 px-2 text-center text-[10px] font-semibold text-foreground/70" style={{ color: p.colour }}>
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ISSUE_KEYS.map((key, i) => (
                    <tr key={key} className={i % 2 === 0 ? "bg-white/[0.02]" : ""}>
                      <td className="py-2.5 pr-4 text-xs font-medium text-muted align-top whitespace-nowrap">{t.issues[key]}</td>
                      {parties.map((p) => (
                        <td key={p.id} className="py-2.5 px-2 text-xs leading-5 text-foreground/75 align-top border-t border-line/30">
                          {p.key_positions[key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* News + Network quick links */}
      <div className="flex flex-wrap gap-3">
        <a
          href="/news"
          className="flex-1 min-w-[140px] section-card rounded-[1.5rem] px-5 py-4 hover:-translate-y-0.5 hover:border-white/25 transition group"
        >
          <p className="eyebrow text-xs font-medium text-muted">{lang === "hu" ? "Hírek" : "News"}</p>
          <p className="mt-1 text-sm text-foreground/80 group-hover:text-foreground transition">
            {lang === "hu" ? "Független forrásokból →" : "From independent sources →"}
          </p>
        </a>
        <a
          href="/network"
          className="flex-1 min-w-[140px] section-card rounded-[1.5rem] px-5 py-4 hover:-translate-y-0.5 hover:border-white/25 transition group"
        >
          <p className="eyebrow text-xs font-medium text-muted">{lang === "hu" ? "Hálózat" : "Network"}</p>
          <p className="mt-1 text-sm text-foreground/80 group-hover:text-foreground transition">
            {lang === "hu" ? "Prism részvétel →" : "Observer network →"}
          </p>
        </a>
      </div>

      {/* Constituency + Candidate Lookup */}
      <section className="section-card rounded-[2rem] px-5 py-6 sm:px-8 sm:py-8">
        <p className="eyebrow text-xs font-medium text-muted mb-4">
          {t.constituency_title}
        </p>

        <select
          value={selectedCounty}
          onChange={(e) => setSelectedCounty(e.target.value)}
          className="w-full max-w-sm rounded-xl border border-line bg-panel px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          <option value="">{t.select_county}</option>
          {counties.map((c) => (
            <option key={c.name_hu} value={c.name_hu}>
              {lang === "hu" ? c.name_hu : c.name_en}
            </option>
          ))}
        </select>

        {countyConstituencies.length > 0 && (
          <div className="mt-6 space-y-5">
            {countyConstituencies.map((con) => (
              <div
                key={`${con.county_code}-${con.constituency_no}`}
                className="rounded-2xl border border-line/60 bg-panel/40 px-5 py-4"
              >
                {/* Constituency header */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {lang === "hu" ? con.name_hu : con.name_en}
                    </p>
                    {con.seat && (
                      <p className="text-xs text-muted mt-0.5">{con.seat}</p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-white/5 border border-line/50 px-2.5 py-0.5 text-xs text-muted">
                    {con.candidates.length} {t.candidates_label}
                  </span>
                </div>

                {/* Candidate grid */}
                {con.candidates.length === 0 ? (
                  <p className="text-xs text-muted/60 italic">{t.no_candidates}</p>
                ) : (
                  <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 mt-2">
                    {con.candidates.map((cand) => (
                      <li
                        key={cand.nvi_id}
                        className="flex flex-col items-center gap-2 rounded-2xl border border-line/40 bg-panel/60 px-3 py-4 cursor-pointer hover:border-line/80 hover:bg-panel/90 transition group text-center"
                        onClick={() => setSelectedCandidate(cand)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && setSelectedCandidate(cand)}
                        aria-label={`${cand.name} — ${t.view_record}`}
                        style={{ borderTop: `3px solid ${cand.party_id ? PARTY_COLOURS[cand.party_id] ?? "#555" : "#555"}` }}
                      >
                        <HexProfileCard
                          photoId={cand.photo_id}
                          partyId={cand.party_id}
                          partyColour={cand.party_id ? PARTY_COLOURS[cand.party_id] ?? "#666" : "#666"}
                          size={120}
                          alt={cand.name}
                          userScores={userProfile}
                          partyScores={cand.party_id ? (partyPositions.parties as Record<string, TraitScores>)[cand.party_id] ?? null : null}
                          lang={lang as "en" | "hu"}
                          showRadar={!!userProfile && !!cand.party_id}
                        />
                        <div className="space-y-0.5 w-full">
                          <p className="text-xs font-semibold text-foreground leading-tight line-clamp-2">{cand.name}</p>
                          <p className="text-[10px] text-muted">{cand.party}</p>
                          <p className="text-[9px] text-muted/40">#{cand.ballot_number}</p>
                        </div>
                        <span className="text-[10px] text-muted/30 group-hover:text-muted/60 transition">{t.view_record_icon}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Candidate Drawer */}
      <CandidateDrawer
        candidate={selectedCandidate}
        onClose={closeDrawer}
        lang={lang}
        userProfile={userProfile}
      />

      {/* ContributionMap moved to /network */}

      {/* Footer */}
      <footer className="mb-4 rounded-[1.75rem] border border-line/80 bg-panel/70 px-5 py-5 text-xs text-muted backdrop-blur space-y-2">
        <p>
          <span className="font-medium text-foreground/60">{t.sources_label}:</span>{" "}
          {t.sources}
        </p>
        <p>{t.disclaimer}</p>
        <p className="text-muted/60">{t.data_note}</p>
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
    </>
  );
}
