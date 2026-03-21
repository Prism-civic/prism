'use client';

import React, { useState } from 'react';
import type { TraitScores } from './AlignmentRadar';

const TRAITS = ['eu', 'migracio', 'gazdasag', 'jogallamisag', 'ukrajna', 'kornyezet'] as const;
type Trait = typeof TRAITS[number];

const QUESTIONS: Record<Trait, { hu: string; en: string }> = {
  eu: {
    hu: 'Magyarország érdeke, hogy aktív és elkötelezett tagja legyen az Európai Uniónak.',
    en: "It is in Hungary's interest to be an active, committed member of the European Union.",
  },
  migracio: {
    hu: 'Magyarországnak el kell fogadnia az EU által javasolt menekültkvótákat.',
    en: 'Hungary should accept the EU-proposed refugee quotas.',
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
    en: 'Environmental protection and climate action are among the most important political priorities.',
  },
};

const SCALE_LABELS = {
  hu: ['Egyáltalán nem értek egyet', 'Teljes mértékben egyetértek'],
  en: ['Strongly disagree', 'Strongly agree'],
};

interface AlignmentQuizProps {
  lang?: 'hu' | 'en';
  onComplete: (scores: TraitScores) => void;
  onSkip: () => void;
}

const STORAGE_KEY = 'prism_user_profile';

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
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/50">
            {step + 1} / {TRAITS.length}
          </span>
          <button
            onClick={onSkip}
            className="text-sm text-white/40 hover:text-white/70 transition-colors"
            aria-label={lang === 'hu' ? 'Kihagyás' : 'Skip'}
          >
            {lang === 'hu' ? 'Kihagyás' : 'Skip'}
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-400 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question */}
        <p className="text-lg text-white font-medium leading-relaxed min-h-[80px]">
          {question}
        </p>

        {/* Slider */}
        <div className="space-y-3">
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={current}
            onChange={(e) => setCurrent(Number(e.target.value))}
            className="w-full accent-blue-400"
            aria-label={question}
            aria-valuemin={1}
            aria-valuemax={5}
            aria-valuenow={current}
          />
          <div className="flex justify-between text-xs text-white/40">
            <span>{SCALE_LABELS[lang][0]}</span>
            <span>{SCALE_LABELS[lang][1]}</span>
          </div>
          {/* Dot indicators */}
          <div className="flex justify-between px-1">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                onClick={() => setCurrent(v)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                  current === v
                    ? 'bg-blue-400 text-black scale-110'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
                aria-label={`${v}`}
                aria-pressed={current === v}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Next button */}
        <button
          onClick={handleNext}
          className="w-full py-3 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl transition-colors"
        >
          {isLast
            ? lang === 'hu' ? 'Kész →' : 'Done →'
            : lang === 'hu' ? 'Következő →' : 'Next →'}
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
