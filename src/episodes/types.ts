import type { EpisodeNeeded } from 'tods-competition-factory';

export interface EpisodePoint {
  winner: number;
  server: number;
  pointNumber: number;
  index: number;
  isBreakpoint: boolean;
  score: string;
  set: number;
  game: number;
  // Fields from ScoringEngine / MCP data
  rallyLength?: number;
  result?: string;
  notation?: string;
  tiebreak?: boolean;
  serve?: 1 | 2; // 1 = first serve, 2 = second serve (from ScoringEngine)
  points?: [number, number];
  setCumulativePoints?: [number, number];
}

export interface EpisodeGame {
  complete: boolean;
  winner: number | undefined;
  games: number[];
  index: number;
}

export interface EpisodeSet {
  complete: boolean;
  winner: number | undefined;
  sets: number[][];
  index: number;
}

/**
 * Re-exported from the factory rather than redeclared.
 *
 * The local copy required `pointsToGame` / `pointsToSet` / `gamesToSet` as `number[]`, while the
 * factory declares each as an OPTIONAL `[number, number]` and carries two more members
 * (`pointsToMatch`, `isBreakpoint`). A required field cannot represent "no points-to applies here",
 * which is what forced the `[0, 0]` default this branch removes — a rendered zero that means
 * "absent" is indistinguishable from one that means zero.
 *
 * Same remedy courthive-components #581 applied to `SideExitProvenanceEntry`: re-export the
 * authority instead of keeping a copy free to drift from it.
 */
export type { EpisodeNeeded } from 'tods-competition-factory';

export interface Episode {
  action: 'addPoint';
  point: EpisodePoint;
  game: EpisodeGame;
  set: EpisodeSet;
  needed: EpisodeNeeded;
  nextService: number;
  result: boolean;
  complete: boolean;
}
