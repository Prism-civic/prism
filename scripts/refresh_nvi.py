#!/usr/bin/env python3
"""
NVI Data Refresh — polls for new data, fetches if changed, reprocesses candidates.

The NVI updates their data at 17:00 daily during the campaign period.
They publish the current version in: /ogy2026/data/config.json  {"ver":"MMDDHHII"}

This script:
  1. Fetches config.json to get the current ver
  2. Compares to the stored ver in data/hungary/nvi-raw/version.json
  3. If changed: downloads all NVI JSON files from the new version path
  4. Reprocesses candidates.json from the new EgyeniJeloltek.json
  5. Copies updated candidates.json to website/src/data/hungary/
  6. Runs merge_intelligence.py to update scored-candidates.json
  7. Records the new version

Usage:
  python3 scripts/refresh_nvi.py              # check and refresh if needed
  python3 scripts/refresh_nvi.py --force      # force refresh regardless of ver
  python3 scripts/refresh_nvi.py --check-only # just print current ver, don't refresh

Designed to be run daily at 17:10 GMT (10 min after NVI updates).
"""
import sys
import json
import os
import time
import argparse
import logging
from pathlib import Path
from datetime import datetime, timezone

import requests

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger('prism.nvi-refresh')

PRISM_ROOT = Path(__file__).parent.parent
NVI_RAW    = PRISM_ROOT / 'data' / 'hungary' / 'nvi-raw'
DATA_HU    = PRISM_ROOT / 'data' / 'hungary'
WEBSITE_DATA = PRISM_ROOT / 'website' / 'src' / 'data' / 'hungary'
VERSION_FILE = NVI_RAW / 'version.json'

CONFIG_URL = 'https://vtr.valasztas.hu/ogy2026/data/config.json'
DATA_BASE  = 'https://vtr.valasztas.hu/ogy2026/data/{ver}/ver'

NVI_FILES = [
    'EgyeniJeloltek',
    'ListakEsJeloltek',
    'Szervezetek',
    'OevkAdatok',
    'Megyek',
    'Telepulesek',
    'KodtablakEn',
]

HEADERS = {
    'User-Agent': 'Prism-CivicIntelligence/0.1 (https://github.com/Prism-civic/prism; public-data-refresh)',
}


def get_current_ver():
    """Fetch the current NVI data version from config.json."""
    resp = requests.get(CONFIG_URL, headers=HEADERS, timeout=15)
    resp.raise_for_status()
    return resp.json().get('ver')


def get_stored_ver():
    """Read the last successfully downloaded version."""
    if VERSION_FILE.exists():
        with open(VERSION_FILE) as f:
            return json.load(f).get('ver')
    return None


def save_ver(ver, fetched_at):
    """Record the version we just downloaded."""
    with open(VERSION_FILE, 'w') as f:
        json.dump({'ver': ver, 'fetched_at': fetched_at}, f, indent=2)


def download_nvi_files(ver):
    """Download all NVI data files for the given version."""
    base = DATA_BASE.format(ver=ver)
    session = requests.Session()
    session.headers.update(HEADERS)

    NVI_RAW.mkdir(parents=True, exist_ok=True)

    for name in NVI_FILES:
        url = f'{base}/{name}.json'
        out = NVI_RAW / f'{name}.json'
        log.info(f'Downloading {name}.json...')

        try:
            resp = session.get(url, timeout=30)
            resp.raise_for_status()
            tmp = str(out) + '.tmp'
            with open(tmp, 'wb') as f:
                f.write(resp.content)
            os.replace(tmp, out)
            log.info(f'  → {len(resp.content):,} bytes')
        except Exception as e:
            log.error(f'  Failed to download {name}.json: {e}')
            raise

        time.sleep(1.5)  # polite between files


def reprocess_candidates():
    """Rebuild candidates.json from fresh NVI source files."""
    log.info('Reprocessing candidates.json...')

    with open(NVI_RAW / 'EgyeniJeloltek.json', encoding='utf-8') as f:
        ej = json.load(f)
    with open(NVI_RAW / 'OevkAdatok.json', encoding='utf-8') as f:
        oevk_raw = json.load(f)

    # Build OEVK lookup
    oevk_map = {}
    for o in oevk_raw['list']:
        key = f"{o['maz']}-{o['evk']}"
        oevk_map[key] = {
            'county_code':      o['maz'],
            'county_name_hu':   o['maz_nev'],
            'county_name_en':   o['maz_nev_en'],
            'constituency_no':  o['evk'],
            'name_hu':          o['evk_nev'],
            'name_en':          o['evk_nev_en'],
            'seat':             o.get('szekhely', ''),
            'seat_en':          o.get('szekhely_en', ''),
            'registered_voters': o.get('letszam', {}).get('honos'),
            'candidates':       [],
        }

    party_id_map = {
        'FIDESZ-KDNP': 'fidesz-kdnp',
        'Mi Hazánk':   'mi-hazank',
        'TISZA':       'tisza',
        'DK':          'dk',
        'MKKP':        'mkkp',
    }

    active = [c for c in ej['list'] if c.get('allapot') == '1']

    for c in active:
        key = f"{c['maz']}-{c['evk']}"
        if key not in oevk_map:
            continue
        name = f"{c.get('dr_jelzo', '')} {c['neve']}".strip()
        party_name = c.get('jlcs_nev', 'Unknown')
        oevk_map[key]['candidates'].append({
            'name':          name,
            'party':         party_name,
            'party_id':      party_id_map.get(party_name),
            'ballot_number': c.get('szavlap_sorsz'),
            'photo_id':      c.get('fenykep'),
            'nvi_id':        c['kpn_id'],
            'registered':    c.get('allapot_valt', '')[:10],
        })

    for key in oevk_map:
        oevk_map[key]['candidates'].sort(key=lambda x: x.get('ballot_number') or 99)

    output = {
        'meta': {
            'election':               '2026 Hungarian Parliamentary Election',
            'date':                   '2026-04-12',
            'source':                 'NVI — Nemzeti Választási Iroda (vtr.valasztas.hu)',
            'data_version':           ej['PvOnHeader']['generated'],
            'total_constituencies':   len(oevk_map),
            'total_active_candidates': len(active),
            'refreshed_at':           datetime.now(timezone.utc).isoformat(),
        },
        'constituencies': sorted(oevk_map.values(), key=lambda x: (x['county_code'], x['constituency_no'])),
    }

    out_path = DATA_HU / 'candidates.json'
    tmp = str(out_path) + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    os.replace(tmp, out_path)

    log.info(f'candidates.json: {len(active)} active candidates across {len(oevk_map)} constituencies')
    return len(active), len(oevk_map)


def sync_website_data():
    """Copy updated candidates.json into website/src/data/hungary/."""
    src = DATA_HU / 'candidates.json'
    dst = WEBSITE_DATA / 'candidates.json'
    WEBSITE_DATA.mkdir(parents=True, exist_ok=True)

    import shutil
    shutil.copy2(src, dst)
    log.info(f'Synced candidates.json → website/src/data/hungary/')


def run_merge():
    """Run the intelligence merge/scoring engine."""
    import subprocess
    merge_script = PRISM_ROOT / 'scripts' / 'merge_intelligence.py'
    if not merge_script.exists():
        log.warning('merge_intelligence.py not found — skipping merge')
        return
    log.info('Running intelligence merge...')
    result = subprocess.run(
        [sys.executable, str(merge_script)],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        log.error(f'Merge failed: {result.stderr[-500:]}')
    else:
        log.info(result.stdout.strip()[-300:])


def main():
    parser = argparse.ArgumentParser(description='Refresh NVI candidate data')
    parser.add_argument('--force',      action='store_true', help='Force refresh even if version unchanged')
    parser.add_argument('--check-only', action='store_true', help='Print current version and exit')
    parser.add_argument('--no-merge',   action='store_true', help='Skip intelligence merge after refresh')
    args = parser.parse_args()

    log.info('Checking NVI data version...')
    current_ver = get_current_ver()
    stored_ver  = get_stored_ver()

    log.info(f'  Current NVI ver: {current_ver}')
    log.info(f'  Stored ver:      {stored_ver or "none"}')

    if args.check_only:
        print(f'NVI current ver: {current_ver}')
        print(f'Stored ver:      {stored_ver or "none"}')
        print(f'Update needed:   {current_ver != stored_ver}')
        return

    if current_ver == stored_ver and not args.force:
        log.info('Data is already up to date. Nothing to do.')
        return

    log.info(f'New version detected: {stored_ver} → {current_ver}. Refreshing...')

    # 1. Download fresh NVI files
    download_nvi_files(current_ver)

    # 2. Reprocess candidates.json
    active_count, oevk_count = reprocess_candidates()

    # 3. Sync to website
    sync_website_data()

    # 4. Run intelligence merge
    if not args.no_merge:
        run_merge()

    # 5. Record new version
    save_ver(current_ver, datetime.now(timezone.utc).isoformat())

    log.info(f'✅ NVI refresh complete: ver={current_ver}, {active_count} candidates, {oevk_count} constituencies')


if __name__ == '__main__':
    main()
