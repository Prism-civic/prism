import type { NetworkStatsSnapshot } from "@/lib/network-stats";
import { StatsRefresh } from "@/components/stats-refresh";

type StatsBarProps = {
  initialSnapshot: NetworkStatsSnapshot;
};

export function StatsBar({ initialSnapshot }: StatsBarProps) {
  return (
    <section
      aria-labelledby="stats-title"
      className="section-card rounded-[2rem] px-5 py-6 sm:px-8"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-xs font-medium text-muted">Network status</p>
          <h2 id="stats-title" className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Live stats bar with a clean mock/live seam.
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-muted">
          The page renders with server data first, then refreshes in the browser when JavaScript is available. A future heartbeat API can replace the mock provider without changing the homepage contract.
        </p>
      </div>
      <div className="mt-6">
        <StatsRefresh initialSnapshot={initialSnapshot} />
      </div>
    </section>
  );
}
