/**
 * IONSport Parser — Parse INTENNSE live tracking platform JSON data
 *
 * Converts IONSport JSON match data to structured types compatible with ScoringEngine.
 * Supports timed and standard formats, singles and doubles, substitutions.
 */

import type { PointResult } from './types';

// ============================================================================
// IONSport Source Types (matching raw JSON structure)
// ============================================================================

export interface IONSportMatchData {
  matchId: string;
  matchFormat: string; // e.g., "SET3-S:10P"
  matchType: 'S' | 'D'; // Singles or Doubles
  matchStatus: string;
  sides: IONSportSide[];
  sets: IONSportSet[];
  playerCourtTimeLog: {
    side1: CourtTimeEntry[];
    side2: CourtTimeEntry[];
  };
  substitutionPolicy?: { perSet: number; perMatch: number };
  schedule?: any;
  clocks?: any[];
  matchWinningSide?: number;
}

export interface IONSportSide {
  sideNumber: number;
  players: IONSportPlayer[];
  _id?: string;
}

export interface IONSportPlayer {
  playerNumber: number;
  participant: {
    _id: string;
    first_name: string;
    last_name: string;
    [key: string]: any;
  };
  _id?: string;
}

export interface IONSportSet {
  games: IONSportGame[];
  winningSide?: number;
  side1Score: number;
  side2Score: number;
}

export interface IONSportGame {
  gameFormat: string;
  gameNumber: number;
  points: IONSportPoint[];
}

export interface IONSportPoint {
  pointNumber: number;
  winningSide?: number; // undefined for phantom points at timer expiry
  winReason: string; // 'NONE' | 'DF' | etc.
  server: {
    sideNumber: number;
    playerNumber: number;
    player: string | null;
    returningSide: 'DEUCE' | 'AD';
  };
  shots: IONSportShot[];
  side1Score: number;
  side2Score: number;
  timestamp: string;
  startPointTimeStamp?: string;
  substitutions: any[];
  onCourtPlayers: { side1: any[]; side2: any[] };
  playerPositions?: any;
  timeout?: any[];
  extensions?: any[];
  _id?: string;
}

export interface IONSportShot {
  participant: string | null;
  shotDetail: string | null;
  shotMadeFrom: string;
  shotNumber: number;
  shotOutcome: string;
  shotType: string;
  side: number;
  _id?: string;
}

export interface CourtTimeEntry {
  player: { _id: string; first_name: string; last_name: string };
  playerNumber: number;
  sideNumber?: number;
  inTime: string;
  outTime: string;
  substitutedBy: string | null;
  substitutedAt: string | null;
  performedBy: string;
  isReverted: boolean;
  setNumber: number;
  pointNumber?: number;
}

// ============================================================================
// Parsed Output Types
// ============================================================================

export interface ParsedIONSportPoint {
  winningSide: 1 | 2;
  serverSideNumber: 1 | 2;
  serverParticipantId?: string;
  result?: PointResult;
  timestamp?: string;
  startPointTimeStamp?: string;
  serveSide?: 'DEUCE' | 'AD';
  scoreValue?: number;
}

export interface PlayerInfo {
  participantId: string;
  firstName: string;
  lastName: string;
  playerNumber: number;
}

export interface ParsedIONSportMatch {
  matchId: string;
  matchFormat: string;
  factoryFormat: string;
  matchType: 'S' | 'D';
  isDoubles: boolean;
  isTimed: boolean;
  side1Players: PlayerInfo[];
  side2Players: PlayerInfo[];
  sets: ParsedIONSportSet[];
  courtTimeLog: {
    side1: CourtTimeEntry[];
    side2: CourtTimeEntry[];
  };
}

export interface ParsedIONSportSet {
  setNumber: number;
  winningSide?: number;
  side1Score: number;
  side2Score: number;
  points: ParsedIONSportPoint[];
}

// ============================================================================
// Parser Functions
// ============================================================================

/**
 * Parse raw IONSport JSON data into structured match
 */
export function parseIONSportMatch(jsonData: any): ParsedIONSportMatch {
  const data = jsonData as IONSportMatchData;

  const matchFormat = data.matchFormat;
  const factoryFormat = mapIONSportFormat(matchFormat);
  const isTimed = isTimedFormat(matchFormat);
  const isDoubles = data.matchType === 'D';

  const side1Players = extractPlayersFromSide(data.sides?.[0]);
  const side2Players = extractPlayersFromSide(data.sides?.[1]);

  const sets: ParsedIONSportSet[] = data.sets.map((set, index) => {
    const allPoints = set.games[0]?.points || [];
    // Filter phantom points (no winningSide) — these occur at timer expiry
    const validPoints = allPoints.filter((p) => p.winningSide !== undefined && p.winningSide !== null);

    // Calculate score deltas to detect multi-value points
    let prevSide1 = 0;
    let prevSide2 = 0;

    const parsedPoints: ParsedIONSportPoint[] = validPoints.map((point) => {
      const parsed = parseIONSportPoint(point);

      // Calculate score value from delta
      if (isTimed) {
        const delta1 = point.side1Score - prevSide1;
        const delta2 = point.side2Score - prevSide2;
        const scoreDelta = point.winningSide === 1 ? delta1 : delta2;
        if (scoreDelta > 1) {
          parsed.scoreValue = scoreDelta;
        }
        prevSide1 = point.side1Score;
        prevSide2 = point.side2Score;
      }

      return parsed;
    });

    return {
      setNumber: index + 1,
      winningSide: set.winningSide,
      side1Score: set.side1Score,
      side2Score: set.side2Score,
      points: parsedPoints,
    };
  });

  return {
    matchId: data.matchId,
    matchFormat,
    factoryFormat,
    matchType: data.matchType,
    isDoubles,
    isTimed,
    side1Players,
    side2Players,
    sets,
    courtTimeLog: data.playerCourtTimeLog || { side1: [], side2: [] },
  };
}

/**
 * Parse a single IONSport point into engine-compatible format
 */
export function parseIONSportPoint(point: IONSportPoint): ParsedIONSportPoint {
  const parsed: ParsedIONSportPoint = {
    winningSide: point.winningSide as 1 | 2,
    serverSideNumber: point.server.sideNumber as 1 | 2,
    timestamp: point.timestamp,
  };

  if (point.startPointTimeStamp) {
    parsed.startPointTimeStamp = point.startPointTimeStamp;
  }

  // Extract server participant ID
  if (point.server.player) {
    parsed.serverParticipantId = point.server.player;
  }

  // Map serve side (returningSide tells us the RECEIVER's position, not server's)
  if (point.server.returningSide) {
    parsed.serveSide = point.server.returningSide;
  }

  // Map win reason to point result
  if (point.winReason === 'DF') {
    parsed.result = 'Double Fault';
  }

  return parsed;
}

/**
 * Map IONSport format code to factory matchUpFormatCode
 *
 * IONSport uses "SET3-S:10P" for timed 10-minute point-based sets.
 * Factory uses "SET3-S:T10P" (with T prefix for timed).
 *
 * Detection: if format contains `P` suffix without `T` prefix before the number, add `T`.
 */
export function mapIONSportFormat(ionFormat: string): string {
  if (!ionFormat) return 'SET3-S:6/TB7';

  // Already has T prefix before number → pass through
  if (/S:T\d/.test(ionFormat)) return ionFormat;

  // IONSport timed format: S:NP → S:TNP (add T prefix)
  return ionFormat.replace(/S:(\d+P)/g, 'S:T$1');
}

/**
 * Detect if format is timed (requires endSegment)
 */
export function isTimedFormat(matchFormat: string): boolean {
  // Timed if contains T before number+P in set format, or raw NP without T
  return /S:T?\d+P/.test(matchFormat);
}

/**
 * Extract player info from an IONSport side
 */
export function extractPlayersFromSide(side: IONSportSide | undefined): PlayerInfo[] {
  if (!side?.players) return [];

  return side.players.map((player) => ({
    participantId: player.participant._id,
    firstName: (player.participant.first_name || '').trim(),
    lastName: (player.participant.last_name || '').trim(),
    playerNumber: player.playerNumber,
  }));
}

/**
 * Extract all players from match data
 */
export function extractPlayers(matchData: any): { side1: PlayerInfo[]; side2: PlayerInfo[] } {
  const data = matchData as IONSportMatchData;
  return {
    side1: extractPlayersFromSide(data.sides?.[0]),
    side2: extractPlayersFromSide(data.sides?.[1]),
  };
}

/**
 * Build substitution events from playerCourtTimeLog
 *
 * Returns substitution events sorted by (setNumber, pointNumber).
 * Each event represents a player leaving and being replaced.
 */
export function buildSubstitutionEvents(
  courtTimeLog: { side1: CourtTimeEntry[]; side2: CourtTimeEntry[] },
): SubstitutionInfo[] {
  const events: SubstitutionInfo[] = [];

  for (const sideNumber of [1, 2] as const) {
    const entries = sideNumber === 1 ? courtTimeLog.side1 : courtTimeLog.side2;
    for (const entry of entries) {
      if (entry.substitutedBy && entry.substitutedAt && !entry.isReverted) {
        events.push({
          sideNumber,
          outParticipantId: entry.player._id,
          inParticipantId: entry.substitutedBy,
          setNumber: entry.setNumber,
          pointNumber: entry.pointNumber,
          timestamp: entry.substitutedAt,
        });
      }
    }
  }

  // Sort by set then point number
  events.sort((a, b) => {
    if (a.setNumber !== b.setNumber) return a.setNumber - b.setNumber;
    return (a.pointNumber || 0) - (b.pointNumber || 0);
  });

  return events;
}

export interface SubstitutionInfo {
  sideNumber: 1 | 2;
  outParticipantId: string;
  inParticipantId: string;
  setNumber: number;
  pointNumber?: number;
  timestamp: string;
}
