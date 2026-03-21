#!/usr/bin/env python3
"""
Master scraper runner for Prism Hungary intelligence pipeline.

Run order:
  1. parliament   — incumbent MP records (voting, attendance)
  2. media        — Átlátszó, Telex, 444, HVG press mentions
  3. business     — e-cegjegyzek company directorships
  4. procurement  — EKR public procurement records

Usage:
  python3 run_all.py                    # run everything
  python3 run_all.py --phase media      # specific phase only
  python3 run_all.py --limit 20         # test with first 20 candidates
  python3 run_all.py --party tisza      # one party only
"""
import sys
import time
import argparse
import logging
from pathlib import Path

log = logging.getLogger('prism.runner')

sys.path.insert(0, str(Path(__file__).parent))
import scrape_parliament
import scrape_media
import scrape_business
import scrape_procurement


PHASES = {
    'parliament': scrape_parliament.run,
    'media':      scrape_media.run,
    'business':   scrape_business.run,
    'procurement': scrape_procurement.run,
}

PHASE_ORDER = ['parliament', 'media', 'business', 'procurement']


def run_all(phases=None, limit=None, party=None):
    if phases is None:
        phases = PHASE_ORDER

    results = {}
    for phase in phases:
        if phase not in PHASES:
            log.warning(f'Unknown phase: {phase}')
            continue

        log.info(f'\n{"="*50}')
        log.info(f'PHASE: {phase.upper()}')
        log.info(f'{"="*50}')

        try:
            fn = PHASES[phase]
            kwargs = {}
            if limit is not None:
                kwargs['limit'] = limit
            if party is not None:
                if phase == 'media':
                    kwargs['party_filter'] = party
                else:
                    kwargs['party_filter'] = party

            result = fn(**kwargs)
            results[phase] = result
            log.info(f'Phase {phase} complete: {result}')

        except Exception as e:
            log.error(f'Phase {phase} failed: {e}')
            results[phase] = {'error': str(e)}

        # Brief pause between phases
        time.sleep(2)

    log.info('\n=== ALL PHASES COMPLETE ===')
    for phase, result in results.items():
        log.info(f'  {phase}: {result}')

    return results


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')

    parser = argparse.ArgumentParser(description='Run Prism Hungary intelligence scrapers')
    parser.add_argument('--phase', choices=list(PHASES.keys()), help='Run a single phase only')
    parser.add_argument('--phases', nargs='+', choices=list(PHASES.keys()), help='Run specific phases')
    parser.add_argument('--limit', type=int, help='Limit candidates per phase (for testing)')
    parser.add_argument('--party', help='Filter by party_id (e.g. tisza, fidesz-kdnp)')
    args = parser.parse_args()

    phases = None
    if args.phase:
        phases = [args.phase]
    elif args.phases:
        phases = args.phases

    run_all(phases=phases, limit=args.limit, party=args.party)
