/**
 * UMO v4 Type Definitions
 *
 * Complete type system for Universal Match Object v4
 * Aligns with Tennis Open Data Standards (TODS) nomenclature
 *
 * Key improvements over v3:
 * - Plain data structures (no accessor methods)
 * - Type-safe with complete TypeScript definitions
 * - Easy to serialize/deserialize
 * - Clear separation of point data vs derived context
 */

/**
 * Point result classifications
 */
export type PointResult =
  | 'Ace'
  | 'Winner'
  | 'Serve Winner'
  | 'Unforced Error'
  | 'Forced Error'
  | 'Touch'
  | 'Net'
  | 'Out'
  | 'Double Fault'
  | 'Passing Shot'
  | 'Volley Error'
  | 'Return Winner';

/**
 * Rally data for a point
 */
export interface RallyData {
  notation: string; // Rally notation: "4fsb1b2f3"
  length: number; // Number of shots
  duration?: number; // Milliseconds
}

/**
 * UMO v4 Episode
 * Represents a single point in a matchUp with all contextual data
 */
export interface UMOv4Episode {
  // Point data
  point: {
    // Identity
    id: string; // Unique ID: "set0-game5-point12"
    index: number; // MatchUp-wide point number (0-based)
    timestamp?: string; // ISO 8601 timestamp

    // Context
    set: number; // Set index (0-based)
    game: number; // MatchUp-wide game index (0-based)
    gameInSet: number; // Per-set game index (0-based, resets each set)
    pointInGame: number; // Point number in this game (0-based)

    // Participants
    server: 0 | 1; // Which player served
    winner: 0 | 1; // Which player won the point

    // Score State
    gameScore: [number, number]; // Point counts in game (0-4+)
    gamesScore: [number, number]; // Games won in set
    setsScore: [number, number]; // Sets won in matchUp
    setCumulativePoints: [number, number]; // Total points won in current set (for momentum visualization)
    tennisScore: string; // "15-0", "40-30", "40-A", "G"

    // Rally Data
    notation?: string; // Rally notation string (e.g., "4fsb1b2f")
    rally?: RallyData;
    rallyLength?: number; // Numeric length of rally (for rally bars)

    // Point Classification
    result: PointResult;
    stroke?: string; // "Forehand", "Backhand", "Volley"
    hand?: string; // "Forehand", "Backhand"

    // Special Situations
    tiebreak: boolean;
    breakpoint: boolean;
    setpoint: boolean;
    matchUpPoint: boolean;
  };

  // Derived Context (computed from state)
  context: {
    // What's needed to win
    pointsNeededToWinGame: [number, number];
    pointsNeededToWinSet: [number, number];
    gamesNeededToWinSet: [number, number];

    // Game state
    gameComplete: boolean;
    gameWinner?: 0 | 1;

    // Set state
    setComplete: boolean;
    setWinner?: 0 | 1;

    // MatchUp state
    matchUpComplete: boolean;
    matchUpWinner?: 0 | 1;
  };
}

/**
 * MatchUp format configuration
 */
export interface MatchUpFormat {
  bestOf: 3 | 5;
  gamesPerSet: 6 | 8;
  finalSetFormat: 'advantage' | 'tiebreak' | 'super-tiebreak';
  tiebreakAt: number; // Usually 6
  tiebreakGamesTo: number; // Usually 7
  noAd?: boolean; // No-ad scoring
}

/**
 * Player/Participant information
 * Aligned with TODS structure
 */
export interface Participant {
  participantId: string;
  participantName: string;
  participantType: 'INDIVIDUAL' | 'PAIR' | 'TEAM';
  person?: {
    personId: string;
    standardFamilyName: string;
    standardGivenName: string;
  };
  // For doubles/teams
  individualParticipants?: Array<{
    participantId: string;
    person: {
      personId: string;
      standardFamilyName: string;
      standardGivenName: string;
    };
  }>;
}

/**
 * MatchUp state snapshot
 */
export interface MatchUpState {
  score: {
    sets: [number, number];
    games: [number, number];
    points: [number, number];
  };
  currentSet: number;
  currentGame: number;
  servingSide: 0 | 1;
  serverParticipantId: string;
  complete: boolean;
  winningSide?: 0 | 1;
}

/**
 * Complete UMO v4 MatchUp
 */
export interface UMOv4MatchUp {
  // Identity
  matchUpId: string;
  timestamp: string; // ISO 8601

  // Format
  matchUpFormat: MatchUpFormat;

  // Participants (TODS-aligned)
  participants: [Participant, Participant];

  // History
  episodes: UMOv4Episode[];

  // Current State (derived from episodes)
  state: MatchUpState;
}

/**
 * Game Group structure (used by gameFish and momentumChart)
 * Groups episodes by game for visualization purposes
 */
export interface GameGroup {
  index: number; // Per-set game index
  set: number; // Set index
  points: UMOv4Episode[]; // All points in this game
  score: [number, number]; // Games score after this game
  complete: boolean; // Is game complete
  winner?: 0 | 1; // Who won the game
  last_game?: boolean; // Is this the last game of the set
}

/**
 * Set data for ptsChart
 */
export interface SetData {
  index: number;
  episodes: UMOv4Episode[];
  winner?: 0 | 1;
  complete: boolean;
  gamesScore: [number, number];
}

/**
 * MatchUp data organized by sets for ptsChart
 */
export interface PtsChartData {
  matchUp: UMOv4MatchUp;
  sets: SetData[];
}
