/**
 * Data Adapters for UMO v4 Migration
 * 
 * Provides adapter functions to convert between UMO v4 and legacy Episode formats
 * Allows visualizations to gradually migrate while maintaining backward compatibility
 */

import type { Episode, Point, GameGroup } from '../types';
import type { UMOv4Episode, GameGroup as UMOv4GameGroup } from '../types/UMOv4';

/**
 * Check if data is in UMO v4 format
 */
export function isUMOv4Episode(episode: any): episode is UMOv4Episode {
  return episode && 
    episode.point && 
    typeof episode.point.id === 'string' &&
    typeof episode.point.gameInSet === 'number' &&
    episode.context !== undefined;
}

/**
 * Convert UMO v4 Episode to legacy Episode format
 * Allows old visualizations to work with new data
 */
export function umoV4ToLegacy(umo: UMOv4Episode): Episode {
  return {
    point: {
      index: umo.point.index,
      game: umo.point.game,
      set: umo.point.set,
      server: umo.point.server,
      winner: umo.point.winner,
      points: umo.point.setCumulativePoints, // CRITICAL: Use cumulative points, not gameScore!
      score: umo.point.tennisScore,
      notation: umo.point.rally?.notation, // Keep notation for display (as 'notation' not 'rally')
      rallyLength: umo.point.rally?.length, // Add numeric length for rally bars
      result: umo.point.result,
      tiebreak: umo.point.tiebreak,
      breakpoint: umo.point.breakpoint,
    },
    game: {
      index: umo.point.gameInSet,
      complete: umo.context.gameComplete,
      games: umo.point.gamesScore,
    },
    set: {
      index: umo.point.set,
      complete: umo.context.setComplete,
    },
    needed: {
      points_to_game: umo.context.pointsNeededToWinGame,
      points_to_set: umo.context.pointsNeededToWinSet,
      games_to_set: umo.context.gamesNeededToWinSet,
      is_breakpoint: umo.point.breakpoint,
    },
  };
}

/**
 * Convert array of UMO v4 Episodes to legacy format
 */
export function umoV4ArrayToLegacy(episodes: UMOv4Episode[]): Episode[] {
  return episodes.map(umoV4ToLegacy);
}

/**
 * Convert UMO v4 GameGroup to legacy GameGroup
 */
export function umoV4GameGroupToLegacy(group: UMOv4GameGroup): GameGroup {
  return {
    index: group.index,
    set: group.set,
    points: group.points.map(ep => ({
      index: ep.point.index,
      game: ep.point.game,
      set: ep.point.set,
      server: ep.point.server,
      winner: ep.point.winner,
      points: ep.point.gameScore,
      score: ep.point.tennisScore,
      rally: ep.point.rally?.notation,
      result: ep.point.result,
      tiebreak: ep.point.tiebreak,
      breakpoint: ep.point.breakpoint,
    })),
    score: group.score,
    complete: group.complete,
    winner: group.winner,
    last_game: group.last_game,
  };
}

/**
 * Group UMO v4 episodes by game
 * Used by gameFish and momentumChart
 */
export function groupGamesV4(episodes: UMOv4Episode[]): UMOv4GameGroup[] {
  const games = new Map<string, UMOv4Episode[]>();

  episodes.forEach((ep) => {
    const key = `${ep.point.set}-${ep.point.gameInSet}`;
    if (!games.has(key)) {
      games.set(key, []);
    }
    games.get(key)!.push(ep);
  });

  return Array.from(games.values()).map((gameEpisodes) => {
    const lastEpisode = gameEpisodes[gameEpisodes.length - 1];
    return {
      index: gameEpisodes[0].point.gameInSet,
      set: gameEpisodes[0].point.set,
      points: gameEpisodes,
      score: lastEpisode.point.gamesScore,
      complete: lastEpisode.context.gameComplete,
      winner: lastEpisode.context.gameWinner,
      last_game: lastEpisode.context.setComplete,
    };
  });
}

/**
 * Normalize episodes - accepts both UMO v4 and legacy formats
 * Returns legacy format for backward compatibility
 */
export function normalizeEpisodes(episodes: any[]): Episode[] {
  if (!episodes || episodes.length === 0) return [];
  
  // Check first episode to determine format
  if (isUMOv4Episode(episodes[0])) {
    return umoV4ArrayToLegacy(episodes as UMOv4Episode[]);
  }
  
  // Already in legacy format
  return episodes as Episode[];
}

/**
 * Extract rally lengths from episodes for simpleChart
 */
export function extractRallyLengths(episodes: UMOv4Episode[] | Episode[]): number[][] {
  const normalized = normalizeEpisodes(episodes);
  const player0Rallies: number[] = [];
  const player1Rallies: number[] = [];
  
  normalized.forEach(ep => {
    if (ep.point.rally) {
      const length = ep.point.rally.split(/\d+/).length - 1;
      if (ep.point.winner === 0) {
        player0Rallies.push(length);
      } else {
        player1Rallies.push(length);
      }
    }
  });
  
  return [player0Rallies, player1Rallies];
}

/**
 * Check if episodes array is in UMO v4 format
 */
export function isUMOv4Array(episodes: any[]): episodes is UMOv4Episode[] {
  return episodes.length > 0 && isUMOv4Episode(episodes[0]);
}
