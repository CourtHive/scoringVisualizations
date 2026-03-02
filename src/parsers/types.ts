/**
 * Scoring type definitions for parser/validator modules.
 *
 * Subset of factory types (src/types/scoring/types.ts) needed by
 * ProTracker and IONSport parsers. Pure types — zero runtime cost.
 */

/**
 * Point result types (how the point ended)
 */
export type PointResult =
  | 'Ace'
  | 'Winner'
  | 'Serve Winner'
  | 'Forced Error'
  | 'Unforced Error'
  | 'Double Fault'
  | 'Penalty'
  | 'Unknown';

/**
 * Stroke types in tennis
 */
export type StrokeType =
  | 'Forehand'
  | 'Backhand'
  | 'Forehand Slice'
  | 'Backhand Slice'
  | 'Forehand Volley'
  | 'Backhand Volley'
  | 'Overhead Smash'
  | 'Backhand Overhead Smash'
  | 'Forehand Drop Shot'
  | 'Backhand Drop Shot'
  | 'Forehand Lob'
  | 'Backhand Lob'
  | 'Forehand Half-volley'
  | 'Backhand Half-volley'
  | 'Forehand Drive Volley'
  | 'Backhand Drive Volley'
  | 'Trick Shot'
  | 'Unknown Shot';

/**
 * Serve locations
 */
export type ServeLocation = 'Wide' | 'Body' | 'T';

/**
 * Rally shot with court position and stroke details
 */
export interface RallyShot {
  shotNumber: number;
  player: 0 | 1;
  stroke: StrokeType;
  direction?: 1 | 2 | 3;
  depth?: 'shallow' | 'deep' | 'very deep';
  position?: 'baseline' | 'net' | 'approach';
  code?: string;
}

/**
 * Options for adding a point (used by validators)
 */
export interface AddPointOptions {
  winner?: 0 | 1;
  server?: 0 | 1;
  winningSide?: 1 | 2;
  serverSideNumber?: 1 | 2;
  serverParticipantId?: string;
  scoreValue?: number;
  timestamp?: string;
  rallyLength?: number;
  result?: PointResult;
  penaltyType?: string;
  wrongSide?: boolean;
  wrongServer?: boolean;
  penaltyPoint?: boolean;
}
