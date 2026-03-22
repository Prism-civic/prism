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
  is_local_prompt?: boolean;
  local_region?: string;
  published?: string;
}

interface TopicSection {
  id: string;
  label_en: string;
  label_hu: string;
  emoji: string;
  group: 'civic' | 'general' | 'local';
}

interface LocalSource {
  label: string;
  rss: string[];
}

type UserPrefs    = Record<string, 'liked' | 'disliked' | null>;
type TopicPrefs   = Record<string, boolean>; // true = enabled, false = hidden

interface Props {
  lang?: 'en' | 'hu';
}

// ── Constants ─────────────────────────────────────────────────────────────────

const WEIGHT_BADGE: Record<string, string> = {
  high:   'bg-cyan-500/15 text-cyan-300 border-cyan-500/20',
  medium: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  low:    'bg-slate-500/15 text-slate-400 border-slate-500/20',
};

const WEIGHT_LABEL: Record<string, { en: string; hu: string }> = {
  high:   { en: 'High credibility', hu: 'Magas megbízhatóság' },
  medium: { en: 'Independent',      hu: 'Független forrás'   },
  low:    { en: 'Public signal',    hu: 'Közösségi jelzés'   },
};

const COUNTRY_FLAG: Record<string, string> = {
  HU: '🇭🇺', US: '🇺🇸', UK: '🇬🇧', DE: '🇩🇪', EU: '🇪🇺',
};

const GROUP_LABELS = {
  civic:   { en: 'Civic & Politics', hu: 'Közélet és politika' },
  general: { en: 'World & Culture',  hu: 'Világ és kultúra'    },
  local:   { en: 'Local',            hu: 'Helyi'               },
};

// ── LocalStorage helpers ──────────────────────────────────────────────────────

const PREFS_KEY        = 'prism_feed_prefs';
const TOPIC_PREFS_KEY  = 'prism_topic_prefs';
const LOCAL_REGION_KEY = 'prism_local_region';

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; }
  catch { return fallback; }
}

function save(key: string, val: unknown) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(val));
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NewsFeed({ lang = 'en' }: Props) {
  const [items, setItems]           = useState<FeedItem[]>([]);
  const [sections, setSections]     = useState<TopicSection[]>([]);
  const [localSources, setLocalSources] = useState<Record<string, LocalSource>>({});
  const [activeTopic, setActiveTopic]   = useState<string>('all');
  const [showCog, setShowCog]       = useState(false);
  const [prefs, setPrefs]           = useState<UserPrefs>({});
  const [topicPrefs, setTopicPrefs] = useState<TopicPrefs>({});
  const [localRegion, setLocalRegion] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState('');
  const [loading, setLoading]       = useState(true);

  // Derived
  const likedTopics = useCallback((p: UserPrefs, its: FeedItem[]) => {
    const scores: Record<string, number> = {};
    for (const [id, r] of Object.entries(p)) {
      const item = its.find(i => i.id === id);
      if (!item) continue;
      scores[item.topic] = (scores[item.topic] ?? 0) + (r === 'liked' ? 1 : -1);
    }
    return new Set(Object.entries(scores).filter(([, s]) => s > 0).map(([t]) => t));
  }, []);

  const fetchFeed = useCallback(async (topic: string, region?: string | null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '40', lang: 'all' });
      if (topic !== 'all') params.set('topic', topic);
      if (region) params.set('localRegion', region);
      const res  = await fetch(`/api/hu/feed?${params}`);
      const data = await res.json();
      setItems(data.items ?? []);
      setSections(data.sections ?? []);
      setLocalSources(data.localSources ?? {});
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const p  = load<UserPrefs>(PREFS_KEY, {});
    const tp = load<TopicPrefs>(TOPIC_PREFS_KEY, {});
    const lr = load<string | null>(LOCAL_REGION_KEY, null);
    setPrefs(p);
    setTopicPrefs(tp);
    setLocalRegion(lr);
    fetchFeed('all', lr);
  }, [fetchFeed]);

  const handleTopic = (id: string) => {
    setActiveTopic(id);
    fetchFeed(id, localRegion);
    setShowCog(false);
  };

  const react = (itemId: string, reaction: 'liked' | 'disliked') => {
    const next = prefs[itemId] === reaction ? null : reaction;
    const updated = { ...prefs, [itemId]: next };
    setPrefs(updated);
    save(PREFS_KEY, updated);
  };

  const toggleTopicPref = (topicId: string) => {
    const updated = { ...topicPrefs, [topicId]: !topicPrefs[topicId] };
    setTopicPrefs(updated);
    save(TOPIC_PREFS_KEY, updated);
  };

  const selectLocalRegion = (regionId: string) => {
    setLocalRegion(regionId);
    save(LOCAL_REGION_KEY, regionId);
    fetchFeed(activeTopic, regionId);
  };

  const clearLocalRegion = () => {
    setLocalRegion(null);
    save(LOCAL_REGION_KEY, null);
    fetchFeed(activeTopic, null);
  };

  const preferred = likedTopics(prefs, items);

  // Filter: hide user-hidden topics + individually disliked items
  const visibleItems = [...items]
    .filter(item => prefs[item.id] !== 'disliked')
    .filter(item => topicPrefs[item.topic] !== false)
    .sort((a, b) => {
      // Liked topics float up
      const aL = preferred.has(a.topic) ? -1 : 0;
      const bL = preferred.has(b.topic) ? -1 : 0;
      return aL - bL;
    });

  const tl = (en: string, hu: string) => lang === 'hu' ? hu : en;
  const topicLabel = (s: TopicSection) => tl(s.label_en, s.label_hu);

  // Group sections
  const groupedSections = sections.reduce<Record<string, TopicSection[]>>((acc, s) => {
    (acc[s.group] ??= []).push(s);
    return acc;
  }, {});

  // Local source search
  const filteredLocalSources = Object.entries(localSources).filter(([id, src]) =>
    !localSearch || src.label.toLowerCase().includes(localSearch.toLowerCase()) || id.includes(localSearch.toLowerCase())
  );

  const likedCount    = Object.values(prefs).filter(v => v === 'liked').length;
  const hiddenTopics  = Object.values(topicPrefs).filter(v => v === false).length;

  return (
    <section className={styles.shell} aria-label="Prism news feed">

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>
            {tl('News & Analysis', 'Hírek és elemzések')}
          </h2>
          <p className={styles.subtitle}>
            {localRegion
              ? tl(
                  `${localSources[localRegion]?.label ?? 'Local'} · national · international`,
                  `${localSources[localRegion]?.label ?? 'Helyi'} · országos · nemzetközi`
                )
              : tl('Independent sources · multiple countries', 'Független források · több ország')}
          </p>
        </div>
        <div className={styles.headerRight}>
          {localRegion && (
            <button className={styles.localTag} onClick={clearLocalRegion} title={tl('Clear location', 'Helyszín törlése')}>
              📍 {localSources[localRegion]?.label ?? localRegion} ✕
            </button>
          )}
          <button
            className={`${styles.cogBtn} ${(likedCount > 0 || hiddenTopics > 0) ? styles.cogBtnActive : ''}`}
            onClick={() => setShowCog(v => !v)}
            aria-label={tl('Customise feed', 'Feed testreszabása')}
            aria-expanded={showCog}
          >
            ⚙️
            {(likedCount > 0 || hiddenTopics > 0) && (
              <span className={styles.cogDot} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* ── Topic pills ── */}
      <div className={styles.topics} role="tablist">
        <button
          role="tab" aria-selected={activeTopic === 'all'}
          className={`${styles.pill} ${activeTopic === 'all' ? styles.pillActive : ''}`}
          onClick={() => handleTopic('all')}
        >
          {tl('All', 'Minden')}
        </button>
        {sections.map(s => (
          <button
            key={s.id} role="tab" aria-selected={activeTopic === s.id}
            className={[
              styles.pill,
              activeTopic === s.id   ? styles.pillActive    : '',
              preferred.has(s.id)    ? styles.pillPreferred : '',
              topicPrefs[s.id] === false ? styles.pillHidden : '',
              s.group === 'local'    ? styles.pillLocal     : '',
            ].join(' ')}
            onClick={() => handleTopic(s.id)}
          >
            {s.emoji} {topicLabel(s)}
            {preferred.has(s.id) && <span className={styles.preferredDot} aria-hidden="true" />}
            {s.id === 'local' && localRegion && <span className={styles.localDot} aria-hidden="true">📍</span>}
          </button>
        ))}
      </div>

      {/* ── Cog drawer ── */}
      {showCog && (
        <div className={styles.cogDrawer} role="dialog" aria-label={tl('Feed preferences', 'Feed beállítások')}>

          {/* Topic toggles */}
          <p className={styles.cogSection}>{tl('Topics', 'Témák')}</p>
          <p className={styles.cogHint}>
            {tl('Hide topics you never want to see. Your ❤️ reactions also shape the feed.', 'Rejtsd el a nem kívánt témákat. A ❤️ reakciók is alakítják a feedet.')}
          </p>
          {(['civic', 'general', 'local'] as const).map(group => (
            <div key={group} className={styles.cogGroup}>
              <p className={styles.cogGroupLabel}>
                {tl(GROUP_LABELS[group].en, GROUP_LABELS[group].hu)}
              </p>
              <div className={styles.cogGrid}>
                {(groupedSections[group] ?? []).map(s => (
                  <button
                    key={s.id}
                    className={[
                      styles.cogChip,
                      topicPrefs[s.id] === false ? styles.cogChipHidden : '',
                      preferred.has(s.id) ? styles.cogChipLiked : '',
                    ].join(' ')}
                    onClick={() => toggleTopicPref(s.id)}
                    aria-pressed={topicPrefs[s.id] !== false}
                  >
                    {topicPrefs[s.id] === false ? '✕ ' : ''}{s.emoji} {topicLabel(s)}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Local region picker */}
          <p className={styles.cogSection}>📍 {tl('Your local area', 'Helyszíned')}</p>
          <p className={styles.cogHint}>
            {tl(
              'Set your town or city to get local headlines mixed into your feed. Stored locally — never sent to a server.',
              'Állítsd be a városodat a helyi hírek megjelenítéséhez. Csak a böngésződben tárolódik.'
            )}
          </p>
          <input
            type="text"
            className={styles.localSearch}
            placeholder={tl('Search your city…', 'Keress városra…')}
            value={localSearch}
            onChange={e => setLocalSearch(e.target.value)}
            aria-label={tl('Search local areas', 'Helyszín keresés')}
          />
          <div className={styles.localGrid}>
            {filteredLocalSources.slice(0, 16).map(([id, src]) => (
              <button
                key={id}
                className={`${styles.localChip} ${localRegion === id ? styles.localChipActive : ''}`}
                onClick={() => { selectLocalRegion(id); setShowCog(false); }}
              >
                {localRegion === id ? '📍 ' : ''}{src.label}
              </button>
            ))}
          </div>
          {localRegion && (
            <button className={styles.clearLocal} onClick={clearLocalRegion}>
              {tl('Clear location', 'Helyszín törlése')}
            </button>
          )}

          <button className={styles.cogClose} onClick={() => setShowCog(false)}>
            {tl('Done', 'Kész')}
          </button>
        </div>
      )}

      {/* ── Feed ── */}
      {loading ? (
        <div className={styles.loading} aria-live="polite">
          {[...Array(4)].map((_, i) => <div key={i} className={styles.skeleton} aria-hidden="true" />)}
        </div>
      ) : visibleItems.length === 0 ? (
        <p className={styles.empty}>{tl('No items found.', 'Nincs találat.')}</p>
      ) : (
        <ul className={styles.list} role="feed">
          {visibleItems.map(item => (
            <li key={item.id} className={`${styles.card} ${item.content_type === 'local' ? styles.cardLocal : ''}`} role="article">

              {/* Meta */}
              <div className={styles.meta}>
                <span className={`${styles.weightBadge} ${WEIGHT_BADGE[item.weight] ?? WEIGHT_BADGE.low}`}>
                  {tl(WEIGHT_LABEL[item.weight]?.en ?? item.weight, WEIGHT_LABEL[item.weight]?.hu ?? item.weight)}
                </span>
                <span className={styles.sourceName}>
                  {COUNTRY_FLAG[item.source_country] ?? ''} {item.source_name}
                </span>
                {item.is_sentiment && (
                  <span className={styles.sentimentTag}>{tl('Public sentiment', 'Közösségi vélemény')}</span>
                )}
                {item.content_type === 'local' && (
                  <span className={styles.localItemTag}>📍 {tl('Local', 'Helyi')}</span>
                )}
                {item.language !== 'hu' && item.language !== 'en' && (
                  <span className={styles.langTag}>{item.language.toUpperCase()}</span>
                )}
              </div>

              {/* Title */}
              <a
                href={item.is_local_prompt ? undefined : item.url}
                onClick={item.is_local_prompt ? () => setShowCog(true) : undefined}
                target={item.is_local_prompt ? undefined : '_blank'}
                rel="noopener noreferrer"
                className={`${styles.titleLink} ${item.is_local_prompt ? styles.titleLinkPrompt : ''}`}
              >
                <h3 className={styles.itemTitle}>{item.title}</h3>
              </a>
              {item.snippet && <p className={styles.snippet}>{item.snippet}</p>}

              {/* Reactions */}
              <div className={styles.reactions}>
                <button
                  className={`${styles.reactionBtn} ${prefs[item.id] === 'liked' ? styles.reactionActive : ''}`}
                  onClick={() => react(item.id, 'liked')}
                  aria-label={tl('More like this', 'Többet ilyet')}
                  aria-pressed={prefs[item.id] === 'liked'}
                >❤️</button>
                <button
                  className={`${styles.reactionBtn} ${prefs[item.id] === 'disliked' ? styles.reactionActive : ''}`}
                  onClick={() => react(item.id, 'disliked')}
                  aria-label={tl('Less like this', 'Kevesebbet ilyet')}
                  aria-pressed={prefs[item.id] === 'disliked'}
                >👎</button>
                <span className={styles.topicTag}>
                  {sections.find(s => s.id === item.topic)?.emoji}{' '}
                  {sections.find(s => s.id === item.topic)?.[lang === 'hu' ? 'label_hu' : 'label_en'] ?? item.topic}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Prefs hint */}
      {(likedCount > 0 || hiddenTopics > 0) && (
        <p className={styles.prefsHint} aria-live="polite">
          {likedCount > 0 && tl(`${likedCount} liked topic${likedCount !== 1 ? 's' : ''} shaping your feed`, `${likedCount} kedvelt téma alakítja a feedet`)}
          {likedCount > 0 && hiddenTopics > 0 && ' · '}
          {hiddenTopics > 0 && tl(`${hiddenTopics} topic${hiddenTopics !== 1 ? 's' : ''} hidden`, `${hiddenTopics} téma elrejtve`)}
        </p>
      )}
    </section>
  );
}
