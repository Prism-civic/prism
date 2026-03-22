'use client';

import dynamic from 'next/dynamic';

// Three.js globe — must be loaded client-side only (needs browser + WebGL)
const HiveGlobe = dynamic(
  () => import('./HiveGlobe').then(m => ({ default: m.HiveGlobe })),
  {
    ssr: false,
    loading: () => (
      <div
        style={{ aspectRatio: '1.15' }}
        className="w-full rounded-[2rem] border border-white/8 bg-black/35 animate-pulse"
        aria-label="Loading Prism hive globe…"
      />
    ),
  }
);

export function HiveGlobeClient({ mockMode }: { mockMode?: boolean }) {
  return <HiveGlobe mockMode={mockMode} />;
}
