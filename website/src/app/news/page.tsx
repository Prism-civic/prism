import { NewsFeed } from "@/components/NewsFeed";
import Link from "next/link";

export const metadata = {
  title: "News — Prism",
  description: "Civic news and analysis from independent sources. No editorial stance.",
};

export default function NewsPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between rounded-full border border-line/80 bg-panel-strong/90 px-4 py-3 backdrop-blur sm:px-6">
        <Link href="/" className="text-sm text-muted hover:text-foreground transition">
          ← Prism
        </Link>
        <p className="text-sm font-semibold tracking-widest text-foreground">NEWS</p>
        <div className="flex items-center gap-2">
          <Link href="/hu" className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/5 hover:text-foreground transition">
            🇭🇺 HU
          </Link>
          <Link href="/network" className="rounded-full px-3 py-1.5 text-xs text-muted hover:text-foreground hover:bg-white/5 transition">
            Network
          </Link>
        </div>
      </header>

      <section className="section-card rounded-[2rem] px-5 py-6 sm:px-8 sm:py-8">
        <NewsFeed lang="en" />
      </section>

      <footer className="mb-4 rounded-[1.75rem] border border-line/80 bg-panel/70 px-5 py-4 text-xs text-muted backdrop-blur">
        All news from publicly available sources. No editorial stance. No tracking.
      </footer>
    </main>
  );
}
