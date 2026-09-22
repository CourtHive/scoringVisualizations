/* eslint-disable */
// @ts-nocheck

import type { EpisodeNeeded } from 'tods-competition-factory';
/**
 * Type definitions for visualization data structures
 * Based on Universal Match Object (UMO) data model
 */

/**
 * Point data structure from UMO
 */
export interface Point {
  index: number;
  game: number;
  set: number;
  server: 0 | 1; // Player index who served
  winner: 0 | 1; // Player index who won the point
  notation?: string; // Rally notation string (e.g., "4fsb1b2f")
  rally?: string; // Legacy: Rally notation or length as string
  rallyLength?: number; // Rally length as number (for rally bars)
  result: string; // Point result: 'Ace', 'Winner', 'Unforced Error', 'Net', 'Out', etc.
  score?: string; // Game score after point (e.g., '15-0', '30-15')
  points?: [number, number]; // Cumulative point count [player0, player1]
  tiebreak?: boolean;
  isBreakpoint?: boolean | number;
}

/**
 * Episode structure from UMO history
 */
export interface Episode {
  point: Point;
  game: {
    index: number;
    complete: boolean;
    games: [number, number]; // Game score [player0, player1]
  };
  set: {
    index: number;
    complete: boolean;
  };
  /**
   * Points/games each side still needs — the FACTORY's type, not ours.
   *
   * Produced by `calculatePointsTo` and stamped on each point by the ScoringEngine. We used to
   * redeclare this shape, and the copy drifted: it never carried `pointsToMatch`, so no chart here
   * could plot "points to win the match" without someone first noticing the field existed.
   *
   * Every field is OPTIONAL, which matters. `buildEpisodes` used to default the absent ones to
   * `[0, 0]`, and "0 points needed" does not mean "unknown" — it means the side has already won.
   * Absent now stays absent, and a renderer must decide what to draw for it.
   */
  needed: EpisodeNeeded;
}

/**
 * Game group structure (from groupGames utility)
 */
export interface GameGroup {
  points: Point[];
  index: number;
  set: number;
  score: [number, number]; // Game score [player0, player1]
  complete: boolean;
  winner?: 0 | 1;
  lastGame?: boolean;
}

/**
 * Set structure for ptsChart
 */
export interface SetData {
  points: Episode[];
  setNumber: number;
}

/**
 * Player metadata
 */
export interface Player {
  index: 0 | 1;
  firstName: string;
  lastName: string;
  name?: string;
}

/**
 * Match metadata
 */
export interface MatchMetadata {
  players: Player[];
  matchUpFormat?: string;
}
