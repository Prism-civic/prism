'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './NewsFeed.module.css';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FeedItem {
  id: string;
  title: string;
  snippet?: string;
  url: string;
  source_name: string;
  source_domain: string;
  weight: 'high' | 'medium' | 'low';
  language: string;
  source_country: string;
  topic: string;
  content_type: string;
  is_sentiment?: boolean;
  is_curated?: boolean;
  published?: string;
}

interface TopicSection {
  id: string;
  label_en: string;
  label_hu: string;
  emoji: string;
}

type UserPrefs = Record<string, 'liked' | 'disliked' | null>;

interface Props {
  lang?: 'en' | 'hu';
}

// ── Source badge colours ───────────────────────────────────────────────────────

const WEIGHT_BADGE: Record<string, string> = {
  high:   'bg-cyan-500/15 text-cyan-300 border-cyan-500/20',
  medium: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  low:    'bg-slate-500/15 text-slate-400 border-slate-500/20',
};

const WEIGHT_LABEL: Record<string, string> = {
  high:   'High credibility',
  medium: 'Independent',
  low:    'Public signal',
};

const COUNTRY_FLAG: Record<string, string> = {
  HU: '🇭🇺', US: '🇺🇸', UK: '🇬🇧', DE: '🇩🇪', EU: '🇪🇺',
};

// ── Prefs persistence ─────────────────────────────────────────────────────────

const PREFS_KEY = 'prism_feed_prefs';

function loadPrefs(): UserPrefs {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}'); }
  catch { return {}; }
}

function savePrefs(prefs: UserPrefs) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

// Derive preferred topics from reactions
function derivePreferredTopics(prefs: UserPrefs, items: FeedItem[]): Set<string> {
  const topicScores: Record<string, number> = {};
  for (const [itemId, reaction] of Object.entries(prefs)) {
    const item = items.find(i => i.id === itemId);
    if (!item) continue;
    topicScores[item.topic] = (topicScores[item.topic] ?? 0) + (reaction === 'liked' ? 1 : -1);
  }
  return new Set(Object.entries(topicScores).filter(([, s]) => s > 0).map(([t]) => t));
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NewsFeed({ lang = 'en' }: Props) {
  const [items, setItems]         = useState<FeedItem[]>([]);
  const [sections, setSections]   = useState<TopicSection[]>([]);
  const [activeTopic, setActiveTopic] = useState<string>('all');
  const [showCog, setShowCog]     = useState(false);
  const [prefs, setPrefs]         = useState<UserPrefs>({});
  const [loading, setLoading]     = useState(true);
  const [preferredTopics, setPreferredTopics] = useState<Set<string>>(new Set());

  const topicLabel = (s: TopicSection) => lang === 'hu' ? s.label_hu : s.label_en;

  const fetchFeed = useCallback(async (topic: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '30', lang: 'all' });
      if (topic !== 'all') params.set('topic', topic);
      const res = await fetch(`/api/hu/feed?${params}`);
      const data = await res.json();
      setItems(data.items ?? []);
      setSections(data.sections ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPrefs(loadPrefs());
    fetchFeed('all');
  }, [fetchFeed]);

  useEffect(() => {
    setPreferredTopics(derivePreferredTopics(prefs, items));
  }, [prefs, items]);

  const handleTopic = (id: string) => {
    setActiveTopic(id);
    fetchFeed(id);
    setShowCog(false);
  };

  const react = (itemId: string, reaction: 'liked' | 'disliked') => {
    const current = prefs[itemId];
    const next = current === reaction ? null : reaction;
    const updated = { ...prefs, [itemId]: next };
    setPrefs(updated);
    savePrefs(updated);
  };

  // Sort items: liked topics float up, disliked topics sink
  const sortedItems = [...items].sort((a, b) => {
    const aLiked = preferredTopics.has(a.topic) ? -1 : 0;
    const bLiked = preferredTopics.has(b.topic) ? -1 : 0;
    return aLiked - bLiked;
  });

  // Filter out individually disliked items
  const visibleItems = sortedItems.filter(item => prefs[item.id] !== 'disliked');

  return (
    <section className={styles.shell} aria-label="Prism news feed">
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>
            {lang === 'hu' ? 'Hírek és elemzések' : 'News & Analysis'}
          </h2>
          <p className={styles.subtitle}>
            {lang === 'hu'
              ? 'Magyar és külföldi független források'
              : 'Hungarian & international independent sources'}
          </p>
        </div>
        <button
          className={styles.cogBtn}
          onClick={() => setShowCog(v => !v)}
          aria-label="Customise feed"
          aria-expanded={showCog}
        >
          ⚙️
        </button>
      </div>

      {/* Topic pills */}
      <div className={styles.topics} role="tablist" aria-label="Filter by topic">
        <button
          role="tab"
          aria-selected={activeTopic === 'all'}
          className={`${styles.pill} ${activeTopic === 'all' ? styles.pillActive : ''}`}
          onClick={() => handleTopic('all')}
        >
          {lang === 'hu' ? 'Minden' : 'All'}
        </button>
        {sections.map(s => (
          <button
            key={s.id}
            role="tab"
            aria-selected={activeTopic === s.id}
            className={`${styles.pill} ${activeTopic === s.id ? styles.pillActive : ''} ${preferredTopics.has(s.id) ? styles.pillPreferred : ''}`}
            onClick={() => handleTopic(s.id)}
          >
            {s.emoji} {topicLabel(s)}
            {preferredTopics.has(s.id) && <span className={styles.preferredDot} aria-hidden="true" />}
          </button>
        ))}
      </div>

      {/* Cog drawer — theme selector */}
      {showCog && (
        <div className={styles.cogDrawer} role="dialog" aria-label="Feed preferences">
          <p className={styles.cogTitle}>
            {lang === 'hu' ? 'Témaválasztás' : 'Choose your topics'}
          </p>
          <p className={styles.cogHint}>
            {lang === 'hu'
              ? 'Kattints a témákra a szűréshez. A ❤️ és 👎 reakciók is alakítják a feedet.'
              : 'Click topics to filter. Your ❤️ and 👎 reactions also shape the feed.'}
          </p>
          <div className={styles.cogGrid}>
            {sections.map(s => (
              <button
                key={s.id}
                className={`${styles.cogChip} ${preferredTopics.has(s.id) ? styles.cogChipActive : ''}`}
                onClick={() => handleTopic(s.id)}
              >
                {s.emoji} {topicLabel(s)}
              </button>
            ))}
          </div>
          <button className={styles.cogClose} onClick={() => setShowCog(false)}>
            {lang === 'hu' ? 'Bezárás' : 'Done'}
          </button>
        </div>
      )}

      {/* Feed items */}
      {loading ? (
        <div className={styles.loading} aria-live="polite">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={styles.skeleton} aria-hidden="true" />
          ))}
        </div>
      ) : visibleItems.length === 0 ? (
        <p className={styles.empty}>
          {lang === 'hu' ? 'Nincs találat.' : 'No items found.'}
        </p>
      ) : (
        <ul className={styles.list} role="feed">
          {visibleItems.map(item => (
            <li key={item.id} className={styles.card} role="article">
              {/* Source meta row */}
              <div className={styles.meta}>
                <span className={`${styles.weightBadge} ${WEIGHT_BADGE[item.weight] ?? WEIGHT_BADGE.low}`}>
                  {WEIGHT_LABEL[item.weight] ?? item.weight}
                </span>
                <span className={styles.sourceName}>
                  {COUNTRY_FLAG[item.source_country] ?? ''} {item.source_name}
                </span>
                {item.is_sentiment && (
                  <span className={styles.sentimentTag}>
                    {lang === 'hu' ? 'Közösségi vélemény' : 'Public sentiment'}
                  </span>
                )}
                {item.language !== 'hu' && (
                  <span className={styles.langTag}>{item.language.toUpperCase()}</span>
                )}
              </div>

              {/* Title + snippet */}
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.titleLink}
              >
                <h3 className={styles.itemTitle}>{item.title}</h3>
              </a>
              {item.snippet && (
                <p className={styles.snippet}>{item.snippet}</p>
              )}

              {/* Reaction row */}
              <div className={styles.reactions}>
                <button
                  className={`${styles.reactionBtn} ${prefs[item.id] === 'liked' ? styles.reactionActive : ''}`}
                  onClick={() => react(item.id, 'liked')}
                  aria-label="Show more like this"
                  aria-pressed={prefs[item.id] === 'liked'}
                  title={lang === 'hu' ? 'Többet ilyet' : 'More like this'}
                >
                  ❤️
                </button>
                <button
                  className={`${styles.reactionBtn} ${prefs[item.id] === 'disliked' ? styles.reactionActive : ''}`}
                  onClick={() => react(item.id, 'disliked')}
                  aria-label="Show less like this"
                  aria-pressed={prefs[item.id] === 'disliked'}
                  title={lang === 'hu' ? 'Kevesebbet ilyet' : 'Less like this'}
                >
                  👎
                </button>
                <span className={styles.topicTag}>
                  {sections.find(s => s.id === item.topic)?.emoji ?? ''}{' '}
                  {sections.find(s => s.id === item.topic)?.[lang === 'hu' ? 'label_hu' : 'label_en'] ?? item.topic}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Personalisation hint */}
      {Object.keys(prefs).length > 0 && (
        <p className={styles.prefsHint} aria-live="polite">
          {lang === 'hu'
            ? `${Object.values(prefs).filter(v => v === 'liked').length} kedvelt téma alakítja a feedet.`
            : `${Object.values(prefs).filter(v => v === 'liked').length} liked topic${Object.values(prefs).filter(v => v === 'liked').length !== 1 ? 's' : ''} shaping your feed.`}
        </p>
      )}
    </section>
  );
}
