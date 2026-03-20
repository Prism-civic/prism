import type { ExtractedProfile, OnboardingDraft, TopicWeight } from '@/types/app';

export const TOPIC_OPTIONS = [
  { id: 'cost', label: 'Cost of living', aliases: ['cost', 'rent', 'prices', 'bills', 'inflation'] },
  { id: 'housing', label: 'Housing', aliases: ['housing', 'homes', 'rent', 'planning', 'mortgage'] },
  { id: 'health', label: 'Health', aliases: ['health', 'nhs', 'doctor', 'hospital', 'care'] },
  { id: 'science', label: 'Science', aliases: ['science', 'research', 'space'] },
  { id: 'technology', label: 'Technology', aliases: ['technology', 'tech', 'ai', 'software'] },
  { id: 'environment', label: 'Environment', aliases: ['environment', 'climate', 'nature'] },
  { id: 'education', label: 'Education', aliases: ['education', 'school', 'schools', 'university'] },
  { id: 'local', label: 'Local community', aliases: ['local', 'community', 'council', 'town', 'city'] },
  { id: 'politics', label: 'Politics', aliases: ['politics', 'policy', 'government', 'election'] },
  { id: 'sport', label: 'Sport', aliases: ['sport', 'sports', 'football', 'cricket'] },
  { id: 'f1', label: 'Formula 1', aliases: ['f1', 'formula 1', 'motorsport', 'grand prix'] },
] as const;

function inferWeight(rank: number): TopicWeight {
  if (rank === 0) {
    return 'high';
  }

  if (rank <= 2) {
    return 'medium';
  }

  return 'low';
}

function sentenceCase(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return 'your area';
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function buildExtractedProfile(draft: OnboardingDraft): ExtractedProfile {
  const freeText = draft.customInterests.toLowerCase();
  const selected = new Set(draft.topicIds);

  for (const topic of TOPIC_OPTIONS) {
    if (selected.has(topic.id)) {
      continue;
    }

    if (topic.aliases.some((alias) => freeText.includes(alias))) {
      selected.add(topic.id);
    }
  }

  const orderedTopics = TOPIC_OPTIONS.filter((topic) => selected.has(topic.id)).slice(0, 5);
  const fallbackTopics = orderedTopics.length > 0
    ? orderedTopics
    : TOPIC_OPTIONS.filter((topic) => ['local', 'cost', 'health'].includes(topic.id));

  const topics = fallbackTopics.map((topic, index) => ({
    id: topic.id,
    label: topic.label,
    weight: inferWeight(index),
    reason: index === 0
      ? 'Picked directly during onboarding.'
      : freeText.includes(topic.label.toLowerCase()) || draft.topicIds.includes(topic.id)
        ? 'Matched from your answers and quick picks.'
        : 'Added as a sensible starting point for your first brief.',
  }));

  const regionSummary = sentenceCase(draft.region);
  const leadingTopics = topics.slice(0, 2).map((topic) => topic.label.toLowerCase());
  const summary = leadingTopics.length > 0
    ? `I heard ${leadingTopics.join(' and ')} matter most, with ${draft.coverage} coverage centered on ${regionSummary}.`
    : `I heard you want a calm ${draft.coverage} brief centered on ${regionSummary}.`;

  return {
    summary,
    topics,
    coverage: draft.coverage,
    region: regionSummary,
  };
}
