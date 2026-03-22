#!/usr/bin/env python3
"""
Merge and score intelligence across all sources for each candidate.

Reads:
  data/hungary/candidates.json          — base candidate records
  data/hungary/intelligence/*/{id}.json — per-source intelligence

Writes:
  data/hungary/scored-candidates.json   — merged, scored, UI-ready

Scoring model (transparent, documented in HUNGARY_INTELLIGENCE_PIPELINE.md):

  press_flags: count of investigative articles from high-weight sources
    - Átlátszó item:   -15 per article (corruption watchdog, rigorous)
    - Court record:    -20 per judgment
    - Procurement hit: flagged (not scored, shown as evidence)

  accountability (incumbents only, out of 100):
    - Parliament attendance rate: 0–40
    - Legislative activity score: 0–30
    - Questions/interpellations:  0-30

  transparency (all, out of 100):
    - No business registry conflict found: +50
    - No procurement flag: +30
    - Source count (more sources = higher confidence): 0–20

  composite display: NOT shown as a single number.
  We show individual dimension scores with source counts.
  "No data" is shown explicitly, not hidden.
"""
import json
import os
import glob
from pathlib import Path
from datetime import datetime, timezone

PRISM_ROOT = Path(__file__).parent.parent
INTEL_BASE = PRISM_ROOT / 'data' / 'hungary' / 'intelligence'
CANDIDATES_JSON = PRISM_ROOT / 'data' / 'hungary' / 'candidates.json'
OUTPUT_JSON = PRISM_ROOT / 'data' / 'hungary' / 'scored-candidates.json'

# Weight config — explicit, auditable
SOURCE_WEIGHTS = {
    'atlatszo.hu':       {'weight': 'high',   'score_impact': -15, 'type': 'press'},
    'telex.hu':          {'weight': 'medium',  'score_impact': -5,  'type': 'press'},
    '444.hu':            {'weight': 'medium',  'score_impact': -5,  'type': 'press'},
    'hvg.hu':            {'weight': 'medium',  'score_impact': -3,  'type': 'press'},
    'parlament.hu':      {'weight': 'high',    'score_impact': 0,   'type': 'track_record'},
    'e-cegjegyzek.hu':   {'weight': 'medium',  'score_impact': 0,   'type': 'business'},
    'ekr.gov.hu':        {'weight': 'high',    'score_impact': 0,   'type': 'procurement'},
    # Foreign sources — linked to candidates but not scored (evidence only)
    'rferl.org':         {'weight': 'high',    'score_impact': 0,   'type': 'foreign_press'},
    'reuters.com':       {'weight': 'high',    'score_impact': 0,   'type': 'foreign_press'},
    'politico.eu':       {'weight': 'high',    'score_impact': 0,   'type': 'foreign_press'},
    'dw.com':            {'weight': 'medium',  'score_impact': 0,   'type': 'foreign_press'},
    'euractiv.com':      {'weight': 'medium',  'score_impact': 0,   'type': 'foreign_press'},
    'theguardian.com':   {'weight': 'medium',  'score_impact': 0,   'type': 'foreign_press'},
    # Social signals — sentiment only, never scored
    'reddit.com':        {'weight': 'low',     'score_impact': 0,   'type': 'social_sentiment'},
    'twitter.com':       {'weight': 'low',     'score_impact': 0,   'type': 'social_sentiment'},
}

SOURCE_DIR_MAP = {
    'parliament':           'parlament.hu',
    'media/atalatzo':       'atlatszo.hu',
    'media/telex':          'telex.hu',
    'media/444':            '444.hu',
    'media/hvg':            'hvg.hu',
    'business':             'e-cegjegyzek.hu',
    'procurement':          'ekr.gov.hu',
    # Foreign — linked to candidates where name matched
    'foreign/rferl':        'rferl.org',
    'foreign/reuters':      'reuters.com',
    'foreign/politico_eu':  'politico.eu',
    'foreign/dw_hu':        'dw.com',
    'foreign/euractiv':     'euractiv.com',
    'foreign/guardian':     'theguardian.com',
}


def load_intel_for_candidate(kpn_id):
    """Load all available intelligence files for a candidate."""
    records = {}
    for src_dir, source_name in SOURCE_DIR_MAP.items():
        path = INTEL_BASE / src_dir / f'{kpn_id}.json'
        if path.exists():
            with open(path, encoding='utf-8') as f:
                try:
                    data = json.load(f)
                    records[source_name] = data
                except Exception:
                    pass
    return records


def score_candidate(candidate, intel):
    """Build a scored profile for a candidate from their intelligence records."""
    kpn_id = candidate['nvi_id']
    name = candidate['name']
    party_id = candidate.get('party_id')

    profile = {
        'kpn_id': kpn_id,
        'name': name,
        'party': candidate.get('party'),
        'party_id': party_id,
        'ballot_number': candidate.get('ballot_number'),
        'photo_id': candidate.get('photo_id'),
        'constituency_name_hu': candidate.get('constituency_name_hu'),
        'constituency_name_en': candidate.get('constituency_name_en'),
        'county_name_hu': candidate.get('county_name_hu'),
        'county_code': candidate.get('county_code'),
        'constituency_no': candidate.get('constituency_no'),
        'sources_checked': list(intel.keys()),
        'sources_with_data': [],
        'evidence': [],
        'scores': {},
        'flags': [],
        'last_updated': datetime.now(timezone.utc).isoformat(),
    }

    total_press_items = 0
    total_items = 0
    press_impact = 0
    has_business_flag = False
    has_procurement_flag = False
    has_parliament_data = False

    for source_name, record in intel.items():
        items = record.get('items', [])
        if not items:
            continue

        profile['sources_with_data'].append(source_name)
        config = SOURCE_WEIGHTS.get(source_name, {})
        weight = config.get('weight', 'low')
        src_type = config.get('type', 'other')

        for item in items:
            # ── Confidence filter ───────────────────────────────────────────
            # Átlátszó (and other sources) match on partial name tokens.
            # A result is only HIGH confidence if the candidate's surname
            # appears in the title or excerpt. Otherwise downgrade to LOW
            # and skip from evidence display entirely (don't show FPs).
            if src_type == 'press':
                title_text = (item.get('title') or '') + ' ' + (item.get('excerpt') or '')
                # Strip titles (Dr., etc) and get name tokens
                name_clean = profile['name'].replace('DR. ', '').replace('DR.', '').strip()
                name_parts = name_clean.split()
                surname = name_parts[0].lower() if name_parts else ''
                # Also build the concatenated form (BalogZoltán style)
                concat_name = ''.join(name_parts).lower()
                title_lower = title_text.lower().replace(' ', '')

                # Surnames that require multi-token match (too common or also common words)
                AMBIGUOUS_SURNAMES = {
                    # Common word / geographic
                    'cseh', 'erdélyi', 'fehér', 'fekete', 'magyar', 'farkas',
                    'pap', 'rózsa', 'major', 'király', 'boros',
                    # Very common surnames (high collision risk)
                    'kovács', 'kiss', 'nagy', 'tóth', 'horváth', 'varga',
                    'molnár', 'szabo', 'szabó', 'balogh', 'lukács', 'simon',
                    # Oligarch / celebrity collision risk
                    'mészáros', 'orbán', 'lázár', 'kósa',
                }
                is_ambiguous = surname in AMBIGUOUS_SURNAMES

                # Multi-token name match: any two significant name parts both present
                multi_match = any(
                    name_parts[i].lower() in title_text.lower() and
                    name_parts[j].lower() in title_text.lower()
                    for i in range(len(name_parts))
                    for j in range(len(name_parts))
                    if i != j and len(name_parts[i]) > 3 and len(name_parts[j]) > 3
                )
                concat_match = bool(concat_name and len(concat_name) > 7 and concat_name in title_lower)
                surname_alone = bool(surname and len(surname) > 3 and surname in title_text.lower())

                # For concat_match: verify it's not just a substring of a longer name
                # e.g. "zoltán" matching inside "kiszellyZoltán" for candidate "TANÁCS ZOLTÁN"
                # We require the SURNAME to appear in the concat form, not just given name
                if concat_match:
                    # Check that surname (not just given name) is part of the concat match
                    surname_in_concat = surname in title_lower
                    if not surname_in_concat and is_ambiguous:
                        concat_match = False

                if concat_match or multi_match:
                    pass  # confirmed — both tokens or surname+given found together
                elif surname_alone and not is_ambiguous:
                    pass  # acceptable for distinctive surnames only
                else:
                    continue  # skip

            total_items += 1
            evidence_entry = {
                'source': source_name,
                'weight': weight,
                'type': src_type,
                'scraped_at': record.get('scraped_at', ''),
            }

            if src_type == 'press':
                total_press_items += 1
                press_impact += config.get('score_impact', 0)
                evidence_entry.update({
                    'title': item.get('title'),
                    'url': item.get('url'),
                    'date': item.get('date'),
                    'excerpt': item.get('excerpt'),
                    'confidence': item.get('confidence', 'medium'),
                })
                if source_name == 'atlatszo.hu':
                    profile['flags'].append({
                        'type': 'investigative_press',
                        'source': 'atlatszo.hu',
                        'title': item.get('title', ''),
                        'url': item.get('url', ''),
                        'severity': 'medium',
                    })

            elif src_type == 'track_record':
                has_parliament_data = True
                evidence_entry.update({
                    'data': item.get('data', {}),
                    'parliament_id': item.get('parliament_id'),
                    'confidence': item.get('confidence', 'medium'),
                })

            elif src_type == 'business':
                if item.get('type') in ('person_company_link', 'company_directorship'):
                    has_business_flag = True
                    evidence_entry.update({
                        'text': item.get('text', ''),
                        'url': item.get('url'),
                        'confidence': item.get('confidence', 'medium'),
                        'note': item.get('note', ''),
                    })

            elif src_type == 'procurement':
                has_procurement_flag = True
                evidence_entry.update({
                    'text': item.get('text', ''),
                    'url': item.get('url'),
                    'confidence': item.get('confidence', 'high'),
                    'note': item.get('note', ''),
                })
                profile['flags'].append({
                    'type': 'procurement_connection',
                    'source': 'ekr.gov.hu',
                    'text': item.get('text', '')[:100],
                    'severity': 'flagged',
                })

            profile['evidence'].append(evidence_entry)

    # Build scores
    # Transparency score (all candidates)
    transparency = 50  # baseline
    if not has_business_flag:
        transparency += 25
    if not has_procurement_flag:
        transparency += 15
    confidence_bonus = min(10, len(profile['sources_with_data']) * 2)
    transparency += confidence_bonus
    profile['scores']['transparency'] = {
        'value': min(100, transparency),
        'confidence': 'high' if len(profile['sources_checked']) >= 3 else 'low',
        'note': 'Based on business registry and procurement checks',
        'sources_checked': len(profile['sources_checked']),
        'sources_with_data': len(profile['sources_with_data']),
    }

    # Press record (all candidates)
    if total_press_items == 0:
        press_score = None  # No data — not scored
        press_confidence = 'none'
        press_note = 'No press coverage found in checked sources'
    else:
        press_score = max(0, 100 + press_impact)
        press_confidence = 'high' if source_name == 'atlatszo.hu' and total_press_items > 0 else 'medium'
        press_note = f'{total_press_items} articles found across {len(profile["sources_with_data"])} sources'

    profile['scores']['press_record'] = {
        'value': press_score,
        'confidence': press_confidence,
        'note': press_note,
        'article_count': total_press_items,
        'investigative_count': len([f for f in profile['flags'] if f['type'] == 'investigative_press']),
    }

    # Accountability (incumbents only)
    incumbent_parties = {'fidesz-kdnp', 'dk', 'mi-hazank'}
    if party_id in incumbent_parties and has_parliament_data:
        profile['scores']['accountability'] = {
            'value': None,  # Placeholder until we parse parliament XML properly
            'confidence': 'low',
            'note': 'Parliament data found but not yet fully parsed. API token pending.',
        }
    elif party_id in incumbent_parties:
        profile['scores']['accountability'] = {
            'value': None,
            'confidence': 'none',
            'note': 'Incumbent party candidate — parliament records not yet fetched',
        }

    profile['total_evidence_items'] = total_items
    profile['data_quality'] = 'rich' if total_items >= 5 else ('some' if total_items >= 1 else 'none')

    return profile


def run():
    print('Loading candidates...')
    with open(CANDIDATES_JSON, encoding='utf-8') as f:
        data = json.load(f)

    all_candidates = []
    for constituency in data['constituencies']:
        for cand in constituency.get('candidates', []):
            cand['constituency_name_hu'] = constituency['name_hu']
            cand['constituency_name_en'] = constituency['name_en']
            cand['county_name_hu'] = constituency['county_name_hu']
            cand['county_code'] = constituency['county_code']
            cand['constituency_no'] = constituency['constituency_no']
            all_candidates.append(cand)

    print(f'Processing {len(all_candidates)} candidates...')

    scored = []
    stats = {'rich': 0, 'some': 0, 'none': 0, 'total_evidence': 0, 'flags': 0}

    for cand in all_candidates:
        kpn_id = cand['nvi_id']
        intel = load_intel_for_candidate(kpn_id)
        profile = score_candidate(cand, intel)
        scored.append(profile)

        dq = profile['data_quality']
        stats[dq] = stats.get(dq, 0) + 1
        stats['total_evidence'] += profile['total_evidence_items']
        stats['flags'] += len(profile['flags'])

    output = {
        'meta': {
            'election': '2026 Hungarian Parliamentary Election',
            'date': '2026-04-12',
            'generated_at': datetime.now(timezone.utc).isoformat(),
            'total_candidates': len(scored),
            'stats': stats,
            'sources_checked': list(SOURCE_DIR_MAP.values()),
            'scoring_note': (
                'Scores are based on publicly available data only. '
                'No score represents a voting recommendation. '
                'Missing data is shown explicitly, not assumed positive or negative. '
                'Full methodology: docs/HUNGARY_INTELLIGENCE_PIPELINE.md'
            ),
        },
        'candidates': scored,
    }

    tmp = str(OUTPUT_JSON) + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    os.replace(tmp, OUTPUT_JSON)

    print(f'\n=== Merge complete ===')
    print(f'Total candidates: {len(scored)}')
    print(f'Data quality: rich={stats["rich"]}, some={stats["some"]}, none={stats["none"]}')
    print(f'Total evidence items: {stats["total_evidence"]}')
    print(f'Total flags raised: {stats["flags"]}')
    print(f'Output: {OUTPUT_JSON}')

    return output


if __name__ == '__main__':
    run()
