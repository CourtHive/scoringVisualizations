/**
 * Match Statistics — Factory Adapter
 *
 * Delegates all statistics computation to tods-competition-factory's scoringEngine.
 * This module preserves the public API (computeMatchStats, computeMatchStatsFromMatchUp,
 * StatObject type) while factory handles the actual calculations.
 *
 * Flow: episodes → PointWithMetadata[] → factory.calculateMatchStatistics → toStatObjects
 */

import type { Episode } from "../episodes/types";
import { buildEpisodes } from "../episodes/buildEpisodes";
import {
  calculateMatchStatistics,
  toStatObjects,
} from "tods-competition-factory";

export type { StatObject } from "tods-competition-factory";

// ── Helpers ────────────────────────────────────────────────────

/**
 * Convert Episode[] to the PointWithMetadata[] shape factory expects.
 *
 * Maps Episode.point fields to factory's point format, including:
 * - isBreakpoint → breakpoint (field rename)
 * - notation-based 2nd-serve fallback for legacy MCP data
 */
function episodesToPoints(episodes: Episode[]) {
  return episodes.map((ep) => {
    const pt = ep.point;

    // Second serve detection: prefer ScoringEngine's serve field,
    // fall back to notation prefix for legacy MCP data
    const serve: 1 | 2 | undefined =
      pt.serve ?? (pt.notation?.startsWith("2") ? 2 : undefined);

    return {
      winner: pt.winner as 0 | 1,
      server: pt.server as 0 | 1,
      index: pt.index,
      set: pt.set,
      game: pt.game,
      result: pt.result as any,
      serve,
      breakpoint: pt.isBreakpoint,
      tiebreak: pt.tiebreak,
    };
  });
}

// ── Public API ─────────────────────────────────────────────────

/**
 * Compute match statistics from an Episode array.
 * Returns display-ready StatObject[] suitable for statView.
 */
export function computeMatchStats(episodes: Episode[]) {
  if (!episodes.length) return [];

  const points = episodesToPoints(episodes);
  const stats = calculateMatchStatistics({} as any, points);
  return toStatObjects(stats);
}

/**
 * Compute match statistics directly from a ScoringEngine MatchUp state.
 * Convenience wrapper: buildEpisodes(matchUp) → computeMatchStats(episodes).
 */
export function computeMatchStatsFromMatchUp(matchUp: any) {
  const episodes = buildEpisodes(matchUp);
  return computeMatchStats(episodes);
}
