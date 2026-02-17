/**
 * Data Adapters
 *
 * Provides normalizeEpisodes() for backward compatibility.
 * The ScoringEngine pipeline always produces Episode[] via buildEpisodes(),
 * so normalizeEpisodes is a simple pass-through.
 */

import type { Episode } from '../types';

/**
 * Normalize episodes - passes through Episode format unchanged.
 */
export function normalizeEpisodes(episodes: any[]): Episode[] {
  if (!episodes || episodes.length === 0) return [];
  return episodes as Episode[];
}

/**
 * Extract rally lengths from episodes for simpleChart.
 */
export function extractRallyLengths(episodes: Episode[]): number[][] {
  const player0Rallies: number[] = [];
  const player1Rallies: number[] = [];

  for (const ep of episodes) {
    const length = ep.point.rallyLength;
    if (length !== undefined) {
      if (ep.point.winner === 0) {
        player0Rallies.push(length);
      } else {
        player1Rallies.push(length);
      }
    }
  }

  return [player0Rallies, player1Rallies];
}
