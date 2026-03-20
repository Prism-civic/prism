import { refreshMockBriefCache } from '@/lib/briefs';
import type { BriefCache, ExtractedProfile } from '@/types/app';

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

export type SyncPhase = 'idle' | 'refreshing' | 'error';

export interface SyncResult {
  ok: boolean;
  cache?: BriefCache;
  /** Human-readable message suitable for showing in the UI. */
  errorMessage?: string;
}

export interface SyncAdapter {
  /** Fetches the latest brief for the given profile. Always returns a SyncResult. */
  fetchBrief(profile: ExtractedProfile | null): Promise<SyncResult>;
}

// ---------------------------------------------------------------------------
// MockSyncAdapter — local-first implementation
// Simulates an async round-trip so loading/refreshing states are testable in
// the UI without a real backend. Replace or extend this class to add failure
// scenarios (degraded, timeout, etc.) during development.
// ---------------------------------------------------------------------------

const MOCK_SYNC_DELAY_MS = 700;

class MockSyncAdapter implements SyncAdapter {
  async fetchBrief(profile: ExtractedProfile | null): Promise<SyncResult> {
    await new Promise<void>((resolve) => setTimeout(resolve, MOCK_SYNC_DELAY_MS));
    return {
      ok: true,
      cache: refreshMockBriefCache(profile),
    };
  }
}

// ---------------------------------------------------------------------------
// Factory — returns the active adapter.
// Swap the return value here when a real upstream adapter is ready.
// ---------------------------------------------------------------------------

export function createSyncAdapter(): SyncAdapter {
  return new MockSyncAdapter();
}
