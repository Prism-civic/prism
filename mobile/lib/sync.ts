import { refreshMockBriefCache } from '@/lib/briefs';
import type { BriefCache, ExtractedProfile, MockSyncScenario, SyncStatus } from '@/types/app';

// ---------------------------------------------------------------------------
// Sync adapter seam — Slice E
//
// SyncAdapter is the interface boundary between the app and any upstream data
// source. The app only talks to this interface; it does not care whether the
// data comes from a local mock, a pre-bundled cache, or a live country-mind
// endpoint.
//
// To wire in a real backend later:
//   1. Implement SyncAdapter with your HTTP/WebSocket client.
//   2. Update createSyncAdapter() to return it (env-flag or config-driven).
//   3. No other file needs to change.
// ---------------------------------------------------------------------------

export type SyncPhase = 'idle' | 'refreshing' | 'degraded';

export interface SyncRequest {
  profile: ExtractedProfile | null;
  currentCache: BriefCache;
  scenario: MockSyncScenario;
  trigger: 'manual' | 'queued-retry';
}

export interface SyncResult {
  ok: boolean;
  cache?: BriefCache;
  status: SyncStatus;
  /** Human-readable message suitable for showing in the UI. */
  message?: string | null;
  retryAt?: string | null;
}

export interface SyncAdapter {
  /** Fetches the latest brief for the given profile. Always returns a SyncResult. */
  fetchBrief(request: SyncRequest): Promise<SyncResult>;
}

// ---------------------------------------------------------------------------
// MockSyncAdapter — local-first implementation
// Simulates an async round-trip so loading/refreshing states are testable in
// the UI without a real backend. Replace or extend this class to add failure
// scenarios (degraded, timeout, etc.) during development.
// ---------------------------------------------------------------------------

const MOCK_SYNC_DELAY_MS = 700;
const MOCK_RETRY_DELAY_MS = 8_000;

class MockSyncAdapter implements SyncAdapter {
  async fetchBrief({ profile, currentCache, scenario, trigger }: SyncRequest): Promise<SyncResult> {
    await new Promise<void>((resolve) => setTimeout(resolve, MOCK_SYNC_DELAY_MS));

    if (scenario === 'temporary_failure' && trigger === 'manual') {
      return {
        ok: false,
        cache: currentCache,
        status: 'retry_scheduled',
        message: 'Refresh paused for now. Your saved brief is still here.',
        retryAt: new Date(Date.now() + MOCK_RETRY_DELAY_MS).toISOString(),
      };
    }

    if (scenario === 'stale_cache') {
      return {
        ok: false,
        cache: createStaleCacheSnapshot(currentCache, profile),
        status: 'refresh_recommended',
        message: 'This device is still showing an older saved brief. You can keep reading and refresh when convenient.',
        retryAt: null,
      };
    }

    return {
      ok: true,
      cache: refreshMockBriefCache(profile),
      status: 'clear',
      message: null,
      retryAt: null,
    };
  }
}

function createStaleCacheSnapshot(cache: BriefCache, profile: ExtractedProfile | null): BriefCache {
  const snapshot = cache.items.length > 0 ? cache : refreshMockBriefCache(profile);

  return {
    ...snapshot,
    isOffline: true,
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    generatedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  };
}

export function getMockRetryDelayMs() {
  return MOCK_RETRY_DELAY_MS;
}

// ---------------------------------------------------------------------------
// Factory — returns the active adapter.
// Swap the return value here when a real upstream adapter is ready.
// ---------------------------------------------------------------------------

export function createSyncAdapter(): SyncAdapter {
  return new MockSyncAdapter();
}
