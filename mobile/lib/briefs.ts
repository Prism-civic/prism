import { TOPIC_OPTIONS } from '@/lib/profile';
import type {
  BriefCache,
  BriefFeedbackEvent,
  BriefFeedbackSignal,
  BriefItem,
  BriefListState,
  BriefSyncStatus,
  CoveragePreference,
  ExtractedProfile,
  TopicProfile,
} from '@/types/app';

const SOURCE = 'seeded-local' as const;

const MOCK_BRIEF_ITEMS: BriefItem[] = [
  {
    id: 'brief-housing-supply',
    headline: 'Housing approvals are improving unevenly across local councils',
    summary: 'Planning approvals picked up in some areas, but new supply still trails need. That matters most for users tracking rent pressure and local development.',
    detail: 'Local planning approvals have started to recover, but the gains are patchy. The wider picture still points to constrained supply, which can keep rent and affordability pressure elevated in many towns and cities.',
    topicTags: ['housing', 'cost', 'local'],
    localityLabel: 'Your area',
    localityScope: 'local',
    freshnessLabel: 'Updated this morning',
    publishedAt: '2026-03-20T07:10:00.000Z',
    updatedAt: '2026-03-20T07:40:00.000Z',
    confidence: {
      band: 'medium',
      summary: 'Multiple official sources align, but local effects vary a lot by council and timing.',
    },
    sources: [
      { id: 'src-housing-1', title: 'Local housing approvals bulletin', publisher: 'Prism UK Cache', publishedAt: '2026-03-20T06:30:00.000Z' },
      { id: 'src-housing-2', title: 'Supply trend summary', publisher: 'Prism UK Cache', publishedAt: '2026-03-19T18:00:00.000Z' },
    ],
    evidenceNote: 'Cached locally. Useful offline, but local planning pipelines can change quickly.',
  },
  {
    id: 'brief-health-waits',
    headline: 'Health waiting times remain a steady pressure point',
    summary: 'Recent data still shows a heavy backlog in elective care. The trend is stable enough to watch, even when local service experience differs.',
    detail: 'The latest cached evidence points to waiting lists remaining elevated. This is not a sudden change story, but it is a meaningful background condition if healthcare access is one of your priorities.',
    topicTags: ['health', 'local'],
    localityLabel: 'Regional services',
    localityScope: 'national',
    freshnessLabel: 'Updated today',
    publishedAt: '2026-03-20T06:00:00.000Z',
    updatedAt: '2026-03-20T07:20:00.000Z',
    confidence: {
      band: 'high',
      summary: 'This uses established system data with consistent measurement over time.',
    },
    sources: [
      { id: 'src-health-1', title: 'Care waiting list snapshot', publisher: 'Prism UK Cache', publishedAt: '2026-03-20T05:50:00.000Z' },
      { id: 'src-health-2', title: 'Hospital access summary', publisher: 'Prism UK Cache', publishedAt: '2026-03-19T21:00:00.000Z' },
    ],
    evidenceNote: 'Cached locally. Good for baseline context, not for urgent care decisions.',
  },
  {
    id: 'brief-energy-bills',
    headline: 'Household energy costs are easing, but bills still feel high',
    summary: 'The broad direction is gentler than last year, yet household costs remain above where many people feel comfortable. This is a slower-moving context item rather than a breaking story.',
    detail: 'Energy costs are no longer rising as sharply, but many households are still working with elevated baseline bills. That makes this item most useful as a cost-of-living context check rather than a one-day alert.',
    topicTags: ['cost', 'environment'],
    localityLabel: 'National picture',
    localityScope: 'national',
    freshnessLabel: 'Refreshed from cache',
    publishedAt: '2026-03-19T20:30:00.000Z',
    updatedAt: '2026-03-20T07:15:00.000Z',
    confidence: {
      band: 'high',
      summary: 'This is based on structured price cap evidence and recent household cost tracking.',
    },
    sources: [
      { id: 'src-energy-1', title: 'Energy price cap note', publisher: 'Prism UK Cache', publishedAt: '2026-03-19T20:10:00.000Z' },
      { id: 'src-energy-2', title: 'Household bill overview', publisher: 'Prism UK Cache', publishedAt: '2026-03-19T18:45:00.000Z' },
    ],
    evidenceNote: 'Cached locally. National averages may not fully match your tariff or household use.',
  },
  {
    id: 'brief-local-buses',
    headline: 'Local transport reliability is improving in small steps',
    summary: 'Service reliability is recovering in some corridors, though cancellations are still uneven. This is the kind of practical local item that stays useful offline.',
    detail: 'Local transport performance is improving incrementally, but the pattern is not smooth enough to call resolved. If your priorities lean local, this kind of item helps ground the brief in daily life rather than national noise.',
    topicTags: ['local', 'cost'],
    localityLabel: 'Your area',
    localityScope: 'local',
    freshnessLabel: 'Updated today',
    publishedAt: '2026-03-20T06:40:00.000Z',
    updatedAt: '2026-03-20T07:35:00.000Z',
    confidence: {
      band: 'medium',
      summary: 'Useful local signal, but coverage is patchy and service quality varies by route.',
    },
    sources: [
      { id: 'src-transport-1', title: 'Local transport operations note', publisher: 'Prism UK Cache', publishedAt: '2026-03-20T06:20:00.000Z' },
      { id: 'src-transport-2', title: 'Bus corridor reliability summary', publisher: 'Prism UK Cache', publishedAt: '2026-03-19T19:10:00.000Z' },
    ],
    evidenceNote: 'Cached locally. Route-level changes may outpace the cache.',
  },
  {
    id: 'brief-science-water',
    headline: 'New water-quality research gives a clearer baseline for local monitoring',
    summary: 'Recent monitoring work is improving the baseline for understanding local water conditions. This is a slower, more inspectable evidence item with practical environmental relevance.',
    detail: 'The latest cached science note is not urgent, but it improves the baseline for how local water quality gets measured and compared. This kind of item belongs in Prism because it supports informed attention without urgency bait.',
    topicTags: ['science', 'environment', 'local'],
    localityLabel: 'Catchment area',
    localityScope: 'local',
    freshnessLabel: 'In cache',
    publishedAt: '2026-03-18T16:15:00.000Z',
    updatedAt: '2026-03-20T07:00:00.000Z',
    confidence: {
      band: 'medium',
      summary: 'Methodology is clear, but this is still a partial evidence picture rather than a full trend.',
    },
    sources: [
      { id: 'src-water-1', title: 'Water quality field note', publisher: 'Prism UK Cache', publishedAt: '2026-03-18T15:30:00.000Z' },
      { id: 'src-water-2', title: 'Monitoring method summary', publisher: 'Prism UK Cache', publishedAt: '2026-03-18T14:50:00.000Z' },
    ],
    evidenceNote: 'Cached locally. This item is meant for context and inspection, not instant action.',
  },
];

function getTopicWeight(profile: ExtractedProfile | null, tag: string) {
  return profile?.topics.find((topic) => topic.id === tag)?.weight;
}

function getWeightScore(weight?: TopicProfile['weight']) {
  if (weight === 'high') {
    return 3;
  }

  if (weight === 'medium') {
    return 2;
  }

  if (weight === 'low') {
    return 1;
  }

  return 0;
}

function getCoverageScore(itemScope: CoveragePreference, preferred: CoveragePreference) {
  if (itemScope === preferred) {
    return 2;
  }

  if (preferred === 'national' && itemScope !== 'global') {
    return 1;
  }

  return 0;
}

function rankBriefItems(profile: ExtractedProfile | null) {
  const preferredCoverage = profile?.coverage ?? 'national';

  return [...MOCK_BRIEF_ITEMS]
    .map((item) => ({
      item,
      score: item.topicTags.reduce((sum, tag) => sum + getWeightScore(getTopicWeight(profile, tag)), 0)
        + getCoverageScore(item.localityScope, preferredCoverage),
    }))
    .sort((left, right) => right.score - left.score)
    .map(({ item }) => item)
    .slice(0, 5);
}

export function createInitialBriefCache(profile: ExtractedProfile | null): BriefCache {
  return {
    items: rankBriefItems(profile),
    generatedAt: '2026-03-20T07:45:00.000Z',
    lastSyncAt: '2026-03-20T07:45:00.000Z',
    isOffline: true,
    mockSource: SOURCE,
  };
}

export function refreshMockBriefCache(profile: ExtractedProfile | null): BriefCache {
  return createInitialBriefCache(profile);
}

function nextWeight(weight: TopicProfile['weight'], direction: 'up' | 'down'): TopicProfile['weight'] {
  if (direction === 'up') {
    if (weight === 'low') {
      return 'medium';
    }

    if (weight === 'medium') {
      return 'high';
    }

    return 'high';
  }

  if (weight === 'high') {
    return 'medium';
  }

  if (weight === 'medium') {
    return 'low';
  }

  return 'low';
}

function signalReason(signal: BriefFeedbackSignal, item: BriefItem) {
  if (signal === 'like') {
    return `You liked "${item.headline}" on device.`;
  }

  if (signal === 'useful') {
    return `You marked "${item.headline}" useful on device.`;
  }

  return `You marked "${item.headline}" not relevant on device.`;
}

export function applyBriefFeedback(
  profile: ExtractedProfile | null,
  item: BriefItem,
  signal: BriefFeedbackSignal,
) {
  const event: BriefFeedbackEvent = {
    briefItemId: item.id,
    itemHeadline: item.headline,
    topicTags: item.topicTags,
    signal,
    timestamp: new Date().toISOString(),
    rationale: signalReason(signal, item),
  };

  if (!profile) {
    return {
      profile,
      event,
    };
  }

  const direction = signal === 'not_relevant' ? 'down' : 'up';
  const updatedTopics = profile.topics.map((topic) => {
    if (!item.topicTags.includes(topic.id)) {
      return topic;
    }

    return {
      ...topic,
      weight: nextWeight(topic.weight, direction),
      reason: event.rationale,
    };
  });

  return {
    event,
    profile: {
      ...profile,
      topics: updatedTopics,
      summary: profile.summary,
    },
  };
}

export function getBriefListState({
  allowMorningBrief,
  onboardingComplete,
  items,
  isOffline,
}: {
  allowMorningBrief: boolean;
  onboardingComplete: boolean;
  items: BriefItem[];
  isOffline: boolean;
}): BriefListState {
  if (!allowMorningBrief) {
    return 'disabled';
  }

  if (!onboardingComplete || items.length === 0) {
    return 'empty';
  }

  if (isOffline) {
    return 'offline';
  }

  return 'ready';
}

export function getBriefSyncStatus(cache: BriefCache, allowEveningSync: boolean): BriefSyncStatus {
  if (cache.isOffline || !allowEveningSync) {
    return 'offline';
  }

  return cache.items.length > 0 ? 'ready' : 'idle';
}

export function getTopicLabel(topicId: string) {
  return TOPIC_OPTIONS.find((topic) => topic.id === topicId)?.label ?? topicId;
}

export const briefRepository = {
  loadLatestBrief(profile: ExtractedProfile | null) {
    return refreshMockBriefCache(profile);
  },
  recordFeedback(profile: ExtractedProfile | null, item: BriefItem, signal: BriefFeedbackSignal) {
    return applyBriefFeedback(profile, item, signal);
  },
};
