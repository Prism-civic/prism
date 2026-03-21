import { NetworkVisual } from "@/components/network-visual";
import { StatsBar } from "@/components/stats-bar";
import { getPublicNetworkStats } from "@/lib/network-stats";

const contributionLinks = [
  {
    href: "https://github.com/Prism-civic/prism",
    label: "GitHub repo",
    body: "Read the code, issues, and current project roadmap.",
  },
  {
    href: "https://github.com/Prism-civic/prism/blob/main/CONTRIBUTING.md",
    label: "CONTRIBUTING.md",
    body: "Contributor expectations, workflow, and where help is useful now.",
  },
  {
    href: "https://github.com/Prism-civic/prism/blob/main/docs/HUMANITARIAN_CHARTER.md",
    label: "Humanitarian Charter",
    body: "The baseline principles Prism will not violate in any country.",
  },
  {
    href: "https://github.com/Prism-civic/prism/issues",
    label: "Open Collective",
    body: "Funding transparency is planned. Until then, follow progress in public.",
  },
];

const howItWorks = [
  {
    title: "You",
    body: "You tell Prism what you care about in your own words. Rent. Healthcare. Schools. Corruption. Whatever is real to you. Your words stay on your phone by default while a small local model turns them into topics and evidence requests.",
  },
  {
    title: "The Network",
    body: "A Prism node has already processed public sources on that topic: parliamentary records, policy outcomes, voting histories, verified data, and source snapshots. The network returns the evidence, not a hidden profile of you.",
  },
  {
    title: "The Answer",
    body: "Prism shows which positions align with your priorities, how strong the evidence is, and where uncertainty remains. It shows its sources. It tells you when it does not know. It never tells you how to vote.",
  },
];

export default async function Home() {
  const initialStats = await getPublicNetworkStats();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-12 px-4 py-6 sm:px-6 lg:px-8">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-foreground focus:px-4 focus:py-2 focus:text-background"
      >
        Skip to content
      </a>

      <header className="flex items-center justify-between rounded-full border border-line/80 bg-panel-strong/90 px-4 py-3 backdrop-blur sm:px-6">
        <div>
          <p className="text-lg font-semibold tracking-[0.18em] text-foreground">PRISM</p>
          <p className="text-sm text-muted">Civic intelligence for everyone</p>
        </div>
        <nav aria-label="Primary" className="flex items-center gap-2 text-sm text-muted">
          <a className="rounded-full px-3 py-2 hover:bg-white/5 hover:text-foreground" href="#how-it-works">
            How it works
          </a>
          <a className="rounded-full px-3 py-2 hover:bg-white/5 hover:text-foreground" href="#contribute">
            Contribute
          </a>
          <a
            className="rounded-full border border-white/10 px-3 py-2 text-xs font-medium hover:bg-white/5 hover:text-foreground hover:border-white/20 transition"
            href="/hu"
          >
            🇭🇺 Hungary 2026
          </a>
        </nav>
      </header>

      <section className="section-card overflow-hidden rounded-[2rem] px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6" id="main-content">
            <p className="eyebrow text-xs font-medium text-muted">Phase 1 public site</p>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
                A live window into an open civic intelligence network.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-muted sm:text-xl">
                Prism turns verified public evidence into clear, sourced answers without hidden persuasion, tracking, or ownership by any single institution.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="#how-it-works"
                className="rounded-full bg-foreground px-5 py-3 text-center text-sm font-semibold text-background transition hover:bg-ice"
              >
                How it works
              </a>
              <a
                href="#contribute"
                className="rounded-full border border-white/15 px-5 py-3 text-center text-sm font-semibold text-foreground transition hover:border-white/30 hover:bg-white/5"
              >
                Run a node
              </a>
            </div>

            <p className="max-w-lg text-sm leading-7 text-muted">
              Transparent. Open source. Owned by no one. The website uses no cookies, no analytics, and no tracking code.
            </p>
          </div>

          <div className="space-y-4">
            <NetworkVisual />
            <noscript>
              <p className="rounded-3xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-muted">
                JavaScript is off. The visualization remains decorative and the homepage content is fully available in text.
              </p>
            </noscript>
          </div>
        </div>
      </section>

      <StatsBar initialSnapshot={initialStats} />

      <section
        id="how-it-works"
        className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]"
      >
        <div className="section-card rounded-[2rem] p-6 sm:p-8">
          <p className="eyebrow text-xs font-medium text-muted">How it works</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Honest by default.
          </h2>
          <p className="mt-4 max-w-lg text-base leading-8 text-muted">
            The website explains the system in plain language. It is deliberately restrained: what Prism can do, what it cannot do, and where the evidence comes from.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {howItWorks.map((panel) => (
            <article
              key={panel.title}
              className="section-card rounded-[1.75rem] p-6"
            >
              <p className="eyebrow text-xs font-medium text-muted">{panel.title}</p>
              <p className="mt-4 text-base leading-8 text-foreground/90">{panel.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="contribute"
        className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]"
      >
        <div className="section-card rounded-[2rem] p-6 sm:p-8">
          <p className="eyebrow text-xs font-medium text-muted">Contribute</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Help the network become real.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-8 text-muted">
            Phase 1 focuses on credible public presence, not on pretending the whole network already exists. The next useful contributions are operational: documentation, verification infrastructure, node software, and source work.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href="https://github.com/Prism-civic/prism"
              className="rounded-full bg-amber px-5 py-3 text-center text-sm font-semibold text-slate-950 transition hover:brightness-110"
            >
              Contribute
            </a>
            <a
              href="https://github.com/Prism-civic/prism/tree/main/docs"
              className="rounded-full border border-white/15 px-5 py-3 text-center text-sm font-semibold text-foreground transition hover:border-white/30 hover:bg-white/5"
            >
              Read the docs
            </a>
            <a
              href="https://github.com/Prism-civic/prism/issues/1"
              className="rounded-full border border-white/15 px-5 py-3 text-center text-sm font-semibold text-foreground transition hover:border-white/30 hover:bg-white/5"
            >
              Run a node
            </a>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {contributionLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="section-card rounded-[1.6rem] p-5 transition hover:-translate-y-0.5 hover:border-white/25"
            >
              <p className="text-lg font-semibold text-foreground">{item.label}</p>
              <p className="mt-3 text-sm leading-7 text-muted">{item.body}</p>
            </a>
          ))}
        </div>
      </section>

      <footer className="mb-4 rounded-[1.75rem] border border-line/80 bg-panel/70 px-5 py-4 text-sm text-muted backdrop-blur">
        Built for low-friction public trust: no cookies, no analytics, no ad tech, and a server-rendered core that still reads cleanly when JavaScript is unavailable.
      </footer>
    </main>
  );
}
