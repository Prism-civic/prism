'use client';

import React, { useState, useEffect } from 'react';
import type { TraitScores } from './AlignmentRadar';

const TRAITS = ['eu', 'migracio', 'gazdasag', 'jogallamisag', 'ukrajna', 'kornyezet'] as const;
type Trait = typeof TRAITS[number];

const QUESTIONS: Record<Trait, { hu: string; en: string }> = {
  eu: {
    hu: 'Magyarország érdeke, hogy aktív és elkötelezett tagja legyen az Európai Uniónak.',
    en: "It is in Hungary's interest to be an active, committed member of the EU.",
  },
  migracio: {
    hu: 'Magyarországnak el kell fogadnia az EU által javasolt menekültkvótákat.',
    en: 'Hungary should accept EU-proposed refugee quotas.',
  },
  gazdasag: {
    hu: 'Az államnak biztosítania kell az erős szociális hálót és csökkentenie kell a gazdasági egyenlőtlenségeket.',
    en: 'The state should provide a strong social safety net and reduce economic inequality.',
  },
  jogallamisag: {
    hu: 'A bírói függetlenség és a sajtószabadság fontosabb, mint a kormányzati hatékonyság.',
    en: 'Judicial independence and press freedom are more important than governmental efficiency.',
  },
  ukrajna: {
    hu: 'Magyarországnak támogatnia kell Ukrajna EU- és NATO-csatlakozását.',
    en: "Hungary should support Ukraine's EU and NATO accession.",
  },
  kornyezet: {
    hu: 'A környezetvédelem kiemelt politikai prioritás kell, hogy legyen.',
    en: 'Environmental protection and climate action are a top political priority.',
  },
};

const TRAIT_LABELS: Record<Trait, { hu: string; en: string }> = {
  eu:           { hu: 'EU',         en: 'EU' },
  migracio:     { hu: 'Migráció',   en: 'Migration' },
  gazdasag:     { hu: 'Gazdaság',   en: 'Economy' },
  jogallamisag: { hu: 'Jogállam.',  en: 'Rule of Law' },
  ukrajna:      { hu: 'Ukrajna',    en: 'Ukraine' },
  kornyezet:    { hu: 'Klíma',      en: 'Climate' },
};

const SCALE_LABELS = {
  hu: ['Egyáltalán nem', 'Teljes mértékben'],
  en: ['Strongly disagree', 'Strongly agree'],
};

const STORAGE_KEY = 'prism_user_profile';

// ── Inline persistent quiz panel ──────────────────────────────────────────────

interface AlignmentQuizInlineProps {
  lang?: 'hu' | 'en';
  /** Called whenever any slider changes — enables live radar update */
  onChange: (scores: TraitScores) => void;
  /** Current saved scores (to initialise sliders) */
  initialScores?: TraitScores | null;
}

const DEFAULT_SCORES: TraitScores = {
  eu: 3, migracio: 3, gazdasag: 3, jogallamisag: 3, ukrajna: 3, kornyezet: 3,
};

const SCORE_LABELS: Record<number, { hu: string; en: string }> = {
  1: { hu: 'Nem értek egyet', en: 'Disagree' },
  2: { hu: 'Inkább nem',      en: 'Lean against' },
  3: { hu: 'Semleges',        en: 'Neutral' },
  4: { hu: 'Inkább igen',     en: 'Lean towards' },
  5: { hu: 'Teljes mértékben', en: 'Agree' },
};

export function AlignmentQuizInline({ lang = 'hu', onChange, initialScores }: AlignmentQuizInlineProps) {
  const [scores, setScores] = useState<TraitScores>(initialScores ?? DEFAULT_SCORES);

  // Sync if parent provides updated initial scores (e.g. loaded from localStorage)
  useEffect(() => {
    if (initialScores) {
      setScores(initialScores);
    }
  }, [initialScores]);

  function handleChange(trait: Trait, value: number) {
    const updated = { ...scores, [trait]: value };
    setScores(updated);
    // Persist immediately
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 1, completedAt: new Date().toISOString(), scores: updated })
      );
    } catch { /* ignore */ }
    onChange(updated);
  }

  return (
    <div className="space-y-4">
      {TRAITS.map((trait) => (
        <div key={trait} className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-semibold text-cyan-300/90 shrink-0">
              {TRAIT_LABELS[trait][lang]}
            </label>
            <span className="text-[10px] text-white/40 text-right leading-tight max-w-[55%]">
              {SCORE_LABELS[scores[trait]][lang]}
            </span>
          </div>
          <p className="text-[11px] text-white/55 leading-relaxed">
            {QUESTIONS[trait][lang]}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-white/30 shrink-0">{SCALE_LABELS[lang][0]}</span>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={scores[trait]}
              onChange={(e) => handleChange(trait, Number(e.target.value))}
              className="flex-1 accent-cyan-400 h-1.5"
              aria-label={QUESTIONS[trait][lang]}
            />
            <span className="text-[9px] text-white/30 shrink-0">{SCALE_LABELS[lang][1]}</span>
          </div>
          {/* Dot pip indicators */}
          <div className="flex gap-1 justify-center">
            {[1,2,3,4,5].map((v) => (
              <button
                key={v}
                onClick={() => handleChange(trait, v)}
                className={`w-6 h-6 rounded-full text-[10px] font-semibold transition-all ${
                  scores[trait] === v
                    ? 'bg-cyan-400 text-black scale-110 shadow-[0_0_8px_rgba(34,211,238,0.6)]'
                    : 'bg-white/8 text-white/40 hover:bg-white/15'
                }`}
                aria-label={`${v}`}
                aria-pressed={scores[trait] === v}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Legacy modal version (kept for compatibility but no longer used by default) ──

interface AlignmentQuizProps {
  lang?: 'hu' | 'en';
  onComplete: (scores: TraitScores) => void;
  onSkip: () => void;
}

export function AlignmentQuiz({ lang = 'hu', onComplete, onSkip }: AlignmentQuizProps) {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<Partial<TraitScores>>({});
  const [current, setCurrent] = useState(3);

  const trait = TRAITS[step];
  const question = QUESTIONS[trait][lang];
  const isLast = step === TRAITS.length - 1;

  function handleNext() {
    const updated = { ...scores, [trait]: current };
    if (isLast) {
      const final = updated as TraitScores;
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 1, completedAt: new Date().toISOString(), scores: final })
      );
      onComplete(final);
    } else {
      setScores(updated);
      setStep(step + 1);
      setCurrent(3);
    }
  }

  const progress = ((step + 1) / TRAITS.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-gray-900 border border-white/10 rounded-2xl p-8 space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/50">{step + 1} / {TRAITS.length}</span>
          <button onClick={onSkip} className="text-sm text-white/40 hover:text-white/70 transition-colors">
            {lang === 'hu' ? 'Kihagyás' : 'Skip'}
          </button>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-blue-400 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-lg text-white font-medium leading-relaxed min-h-[80px]">{question}</p>
        <div className="space-y-3">
          <input type="range" min={1} max={5} step={1} value={current}
            onChange={(e) => setCurrent(Number(e.target.value))}
            className="w-full accent-blue-400" />
          <div className="flex justify-between text-xs text-white/40">
            <span>{SCALE_LABELS[lang][0]}</span>
            <span>{SCALE_LABELS[lang][1]}</span>
          </div>
          <div className="flex justify-between px-1">
            {[1,2,3,4,5].map((v) => (
              <button key={v} onClick={() => setCurrent(v)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                  current === v ? 'bg-blue-400 text-black scale-110' : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}>
                {v}
              </button>
            ))}
          </div>
        </div>
        <button onClick={handleNext} className="w-full py-3 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl transition-colors">
          {isLast ? (lang === 'hu' ? 'Kész →' : 'Done →') : (lang === 'hu' ? 'Következő →' : 'Next →')}
        </button>
      </div>
    </div>
  );
}

export function loadUserProfile(): TraitScores | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.scores ?? null;
  } catch {
    return null;
  }
}
