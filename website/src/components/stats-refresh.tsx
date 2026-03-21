"use client";

import { useEffect, useState } from "react";
import type { NetworkStatsSnapshot } from "@/lib/network-stats";

type StatsRefreshProps = {
  initialSnapshot: NetworkStatsSnapshot;
};

const REFRESH_INTERVAL_MS = 30_000;

function formatTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-GB").format(value);
}

export function StatsRefresh({ initialSnapshot }: StatsRefreshProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);

  useEffect(() => {
    let isMounted = true;

    async function refresh() {
      try {
        const response = await fetch("/api/network-stats", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const nextSnapshot = (await response.json()) as NetworkStatsSnapshot;
        if (isMounted) {
          setSnapshot(nextSnapshot);
        }
      } catch {
        // Keep the current snapshot visible when refresh fails.
      }
    }

    const intervalId = window.setInterval(refresh, REFRESH_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {snapshot.metrics.map((metric) => (
          <div
            key={metric.id}
            className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] px-4 py-4"
          >
            <p className="text-sm text-muted">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              {formatCount(metric.value)}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-2 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 ${
              snapshot.isLive
                ? "bg-healthy/15 text-healthy"
                : snapshot.isStale
                  ? "bg-degraded/15 text-degraded"
                  : "bg-amber/15 text-amber"
            }`}
          >
            {snapshot.isLive
              ? "Live"
              : snapshot.isStale
                ? "Fallback snapshot"
                : "Mock snapshot"}
          </span>
          <span>{snapshot.note}</span>
        </div>
        <p>Last updated {formatTimestamp(snapshot.asOf)}</p>
      </div>
    </>
  );
}
