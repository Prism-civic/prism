import { ContributionMap } from "@/components/ContributionMap";
import Link from "next/link";

export const metadata = {
  title: "The Prism Network — Prism",
  description: "Observer network participation and contribution statistics across regions.",
};

export default function NetworkPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between rounded-full border border-line/80 bg-panel-strong/90 px-4 py-3 backdrop-blur sm:px-6">
        <Link href="/" className="text-sm text-muted hover:text-foreground transition">
          ← Prism
        </Link>
        <p className="text-sm font-semibold tracking-widest text-foreground">NETWORK</p>
        <div className="flex items-center gap-2 text-sm text-muted">
          <Link href="/hu" className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/5 hover:text-foreground transition">
            🇭🇺 Hungary 2026
          </Link>
        </div>
      </header>

      <ContributionMap lang="en" />

      <footer className="mb-4 rounded-[1.75rem] border border-line/80 bg-panel/70 px-5 py-4 text-xs text-muted backdrop-blur">
        Network participation data. Regional statistics only — no individual tracking.
      </footer>
    </main>
  );
}
