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
  breakpoint?: boolean | number;
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
  needed: {
    points_to_game: [number, number]; // points needed for each player to win current game
    points_to_set: [number, number]; // points needed for each player to win current set
    games_to_set: [number, number]; // games needed for each player to win current set
    is_breakpoint?: boolean;
  };
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
  last_game?: boolean;
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
