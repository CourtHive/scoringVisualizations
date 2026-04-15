/**
 * ProTracker Parser — Parse ProTracker Tennis .ptf files
 *
 * TypeScript port of ptf.js. Converts UTF-16 LE encoded CSV content
 * into structured match data compatible with ScoringEngine.
 *
 * PTF row types: Header, Match Details, Format, Shot, Point, Game, Set, Match
 */

import type { PointResult, StrokeType, ServeLocation, RallyShot } from './types';

// Duplicated string constants (sonarjs/no-duplicate-string)
const NEAR_COURT = 'Near Court';
const FAR_COURT = 'Far Court';
const TIEBREAK_6_6 = '7-point Tiebreak at 6-6';
const FIRST_SERVE = 'First Serve';
const SECOND_SERVE = 'Second Serve';
const SERVE_WINNER = 'Serve Winner';

// ============================================================================
// Types
// ============================================================================

export interface PTFMatch {
  players: [string, string];
  format: PTFFormat;
  sets: PTFSet[];
  statistician?: string;
  tournament?: string;
  surface?: string;
  date?: Date;
  round?: string;
  inOut?: string;
  winner?: string;
  startTime?: string;
  finishTime?: string;
  firstServer?: number; // 0 or 1 (index into players)
}

export interface PTFFormat {
  numberOfSets: number;
  gamesForSet: number;
  setFormat: string; // "7-point Tiebreak at 6-6"
  finalSetFormat: string;
  advantages: boolean;
  lets: boolean;
}

export interface PTFSet {
  setNumber: number;
  winner: string;
  score: Record<string, string>;
  games: PTFGame[];
  finishTime?: string;
}

export interface PTFGame {
  gameNumber: number;
  server: string;
  receiver: string;
  winner: string;
  score: Record<string, string>;
  points: PTFPoint[];
  finishTime?: string;
}

export interface PTFPoint {
  pointNumber: number;
  winner: string; // Player name
  server: string; // Player name
  receiver: string;
  score: Record<string, string>;
  shots: PTFShot[];
  rallyLength: number;
  finishTime?: string;
  breakpoint: boolean;
}

export interface PTFShot {
  player: string;
  stroke: string; // 'Serve', 'Forehand', 'Backhand', 'Return', etc.
  strokeType: string; // FIRST_SERVE, 'Drive', 'Slice', etc.
  result: string; // 'In', 'Winner', 'Ace', 'Out', 'Netted', etc.
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  time?: string;
  receiver?: string;
  isKeyShot?: boolean;
}

// ============================================================================
// Parsed Output Types
// ============================================================================

export interface ParsedPTFPoint {
  winningSide: 1 | 2;
  serverSideNumber: 1 | 2;
  result?: PointResult;
  stroke?: StrokeType;
  hand?: 'Forehand' | 'Backhand';
  serveLocation?: ServeLocation;
  rally?: RallyShot[];
  rallyLength?: number;
  timestamp?: string;
  metadata?: {
    coordinates?: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  };
}

// ============================================================================
// Court Constants (from ptf.js)
// ============================================================================

const NET_Y = 160;

const SERVICE_LOCATIONS: Record<
  string,
  {
    court: string;
    x: [number, number];
    placements: Record<string, [number, number]>;
  }
> = {
  'Near Deuce': {
    court: NEAR_COURT,
    x: [120, 180],
    placements: { Wide: [45, 65], Body: [65, 78], T: [78, 90], O: [90, 180] },
  },
  'Near Ad': {
    court: NEAR_COURT,
    x: [60, 120],
    placements: { Wide: [115, 135], Body: [102, 115], T: [90, 102], O: [45, 90] },
  },
  'Far Deuce': {
    court: FAR_COURT,
    x: [60, 120],
    placements: { Wide: [115, 135], Body: [102, 115], T: [90, 102], O: [45, 90] },
  },
  'Far Ad': {
    court: FAR_COURT,
    x: [120, 180],
    placements: { Wide: [45, 65], Body: [65, 78], T: [78, 90], O: [90, 180] },
  },
};

// ============================================================================
// Parser Functions
// ============================================================================

/**
 * Parse PTF CSV rows into structured match data
 *
 * @param csvRows - Array of string arrays (split CSV rows)
 * @returns Structured PTF match
 */
export function parsePTFContent(csvRows: string[][]): PTFMatch {
  const players: Record<string, string> = {};
  let format: PTFFormat = {
    numberOfSets: 3,
    gamesForSet: 6,
    setFormat: TIEBREAK_6_6,
    finalSetFormat: TIEBREAK_6_6,
    advantages: true,
    lets: true,
  };

  let statistician: string | undefined;
  let tournament: string | undefined;
  let surface: string | undefined;
  let matchDate: Date | undefined;
  let round: string | undefined;
  let inOut: string | undefined;
  let startTime: string | undefined;
  let matchWinner: string | undefined;
  let matchFinishTime: string | undefined;

  let shots: PTFShot[] = [];
  let points: PTFPoint[] = [];
  let games: PTFGame[] = [];
  const sets: PTFSet[] = [];
  let pointCounter = 1;

  for (const line of csvRows) {
    const rowType = line[0]?.trim();
    if (!rowType) continue;

    switch (rowType) {
      case 'Header': {
        statistician = line[6]?.trim();
        break;
      }

      case 'Match Details': {
        players['T'] = (line[1] || '').trim();
        players['O'] = (line[2] || '').trim();
        const dateStr = line[3]?.trim();
        if (dateStr) matchDate = new Date(dateStr);
        tournament = (line[4] || '').trim();
        surface = (line[5] || '').trim();
        inOut = (line[6] || '').trim();
        round = (line[7] || '').trim();
        break;
      }

      case 'Format': {
        format = parseFormatLine(line, format);
        break;
      }

      case 'Start Time': {
        startTime = line[1]?.trim();
        break;
      }

      case 'Shot': {
        shots.push(parseShotLine(line, players));
        break;
      }

      case 'Point': {
        const point = parsePointLine(line, players, shots, pointCounter);
        points.push(point);
        pointCounter++;
        shots = [];
        break;
      }

      case 'Game': {
        const game = parseGameLine(line, players, points, games.length + 1);
        games.push(game);
        points = [];
        break;
      }

      case 'Set': {
        const setScore: Record<string, string> = {};
        setScore[players['T']] = line[2] || '0';
        setScore[players['O']] = line[3] || '0';
        const setWinner = players[line[1] as 'T' | 'O'] || '';

        sets.push({
          setNumber: sets.length + 1,
          winner: setWinner,
          score: setScore,
          games: [...games],
          finishTime: line[4]?.trim(),
        });
        games = [];
        break;
      }

      case 'Match': {
        matchWinner = players[line[1] as 'T' | 'O'];
        matchFinishTime = line[2]?.trim();
        break;
      }

      case 'Format Change': {
        if (line[1]?.trim() === 'Set Game to Tie-Break') {
          const newTiebreakPoints = line[2]?.trim();
          const gamesPlayed = games.length / 2;
          format.finalSetFormat = `${newTiebreakPoints}-point Tiebreak at ${gamesPlayed}-${gamesPlayed}`;
        }
        break;
      }
    }
  }

  // Handle incomplete set at end of match
  if (games.length > 0) {
    const score: Record<string, string> = {};
    const p1 = players['T'];
    const p2 = players['O'];
    score[p1] = '0';
    score[p2] = '0';
    let finishTime: string | undefined;
    for (const g of games) {
      score[g.winner] = String(Number(score[g.winner] || 0) + 1);
      finishTime = g.finishTime;
    }
    const scoreP1 = Number(score[p1]);
    const scoreP2 = Number(score[p2]);
    let winner = '';
    if (scoreP1 > scoreP2) winner = p1;
    else if (scoreP2 > scoreP1) winner = p2;

    sets.push({
      setNumber: sets.length + 1,
      winner,
      score,
      games: [...games],
      finishTime,
    });
  }

  return {
    players: [players['T'], players['O']],
    format,
    sets,
    statistician,
    tournament,
    surface,
    date: matchDate,
    round,
    inOut,
    winner: matchWinner,
    startTime,
    finishTime: matchFinishTime,
    firstServer: sets[0]?.games[0]?.server === players['T'] ? 0 : 1,
  };
}

/**
 * Parse a PTF point into engine-compatible format
 */
export function parsePTFPoint(point: PTFPoint, players: [string, string]): ParsedPTFPoint {
  const winnerIndex = point.winner === players[0] ? 0 : 1;
  const serverIndex = point.server === players[0] ? 0 : 1;

  const parsed: ParsedPTFPoint = {
    winningSide: (winnerIndex + 1) as 1 | 2,
    serverSideNumber: (serverIndex + 1) as 1 | 2,
    rallyLength: point.rallyLength,
    timestamp: point.finishTime,
  };

  // Classify result from shot data
  parsed.result = classifyResult(point.shots);

  // Extract stroke from last key shot
  const lastShot = point.shots[point.shots.length - 1];
  if (lastShot) {
    const mappedStroke = mapPTFStroke(lastShot.stroke, lastShot.strokeType);
    if (mappedStroke) {
      parsed.stroke = mappedStroke;
      if (isForhandStroke(mappedStroke)) {
        parsed.hand = 'Forehand';
      } else if (isBackhandStroke(mappedStroke)) {
        parsed.hand = 'Backhand';
      }
    }
  }

  // Extract serve location from first serve
  const firstServe = point.shots.find(
    (s) => s.strokeType === FIRST_SERVE || s.strokeType === SECOND_SERVE,
  );
  if (firstServe) {
    parsed.serveLocation = mapServeLocation(firstServe);
  }

  // Build rally sequence
  const rally = buildPTFRallySequence(point.shots, players, serverIndex as 0 | 1);
  if (rally.length > 0) {
    parsed.rally = rally;
  }

  // Preserve shot coordinates
  const coordinates = point.shots
    .filter((s) => s.x1 || s.y1 || s.x2 || s.y2)
    .map((s) => ({ x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2 }));
  if (coordinates.length > 0) {
    parsed.metadata = { coordinates };
  }

  return parsed;
}

/**
 * Map PTF format to factory matchUpFormatCode
 */
export function mapPTFFormat(format: PTFFormat): string {
  const parts: string[] = [];

  // Number of sets
  parts.push(`SET${format.numberOfSets}`);

  // Set format
  const setTo = format.gamesForSet;
  const setFormatCode = parseSetFormatString(format.setFormat, setTo);

  // Final set format
  const finalSetFormatCode = parseSetFormatString(format.finalSetFormat, setTo);

  let formatStr = `${parts.join('')}-S:${setFormatCode}`;

  // Add final set format if different
  if (finalSetFormatCode !== setFormatCode) {
    formatStr += `-F:${finalSetFormatCode}`;
  }

  // No-Ad modifier
  if (!format.advantages) {
    formatStr += 'NoAD';
  }

  return formatStr;
}

/**
 * Classify point result from shot data
 */
export function classifyResult(shots: PTFShot[]): PointResult {
  if (shots.length === 0) return 'Unknown';

  const lastShot = shots[shots.length - 1];
  if (!lastShot) return 'Unknown';

  // Ace
  if (lastShot.result === 'Ace') return 'Ace';

  // Serve Winner
  if (lastShot.result === SERVE_WINNER) return SERVE_WINNER;

  // Winner
  if (lastShot.result === 'Winner') return 'Winner';

  // Check for double fault: two consecutive serve faults
  const serves = shots.filter(
    (s) => s.strokeType === FIRST_SERVE || s.strokeType === SECOND_SERVE,
  );
  if (serves.length >= 2) {
    const firstServe = serves.find((s) => s.strokeType === FIRST_SERVE);
    const secondServe = serves.find((s) => s.strokeType === SECOND_SERVE);
    if (firstServe && secondServe) {
      const isFault = (r: string) => ['Out', 'Netted', 'Out Off-Net'].includes(r);
      if (isFault(firstServe.result) && isFault(secondServe.result)) {
        return 'Double Fault';
      }
    }
  }

  // Check for errors
  const errorResults = ['Out', 'Netted', 'Out Off-Net', 'Out Passing Shot', 'Netted Passing Shot'];
  if (errorResults.includes(lastShot.result)) {
    // Determine if forced or unforced
    // In PTF, if the result is a direct error on a shot, it's unforced
    // unless it's a passing shot (forced)
    if (lastShot.result.includes('Passing Shot')) {
      return 'Forced Error';
    }
    return 'Unforced Error';
  }

  return 'Unknown';
}

/**
 * Map serve location from shot coordinates using angle calculations
 */
export function mapServeLocation(shot: PTFShot): ServeLocation | undefined {
  if (shot.stroke !== 'Serve') return undefined;
  if (!shot.x1 && !shot.y1 && !shot.x2 && !shot.y2) return undefined;

  // Determine which court the impact is on
  const impactCourt = shot.y1 < NET_Y ? FAR_COURT : NEAR_COURT;

  // Calculate angle
  const deltaX = shot.x1 - shot.x2;
  const deltaY = shot.y1 - shot.y2;
  const angle = Math.abs((Math.atan2(deltaY, deltaX) * 180) / Math.PI);

  // Find matching service location
  for (const [, location] of Object.entries(SERVICE_LOCATIONS)) {
    if (location.court !== impactCourt) continue;
    if (shot.x1 < location.x[0] || shot.x1 > location.x[1]) continue;

    for (const [placementName, angles] of Object.entries(location.placements)) {
      if (angle > angles[0] && angle < angles[1]) {
        if (placementName === 'O') continue; // Out, not a placement
        return placementName as ServeLocation;
      }
    }
  }

  return undefined;
}

// ============================================================================
// Internal Helpers
// ============================================================================

function parseFormatLine(line: string[], defaults: PTFFormat): PTFFormat {
  const format = { ...defaults };

  if (line.length >= 7) {
    // Standard 7-field format line
    format.numberOfSets = parseInt(line[1] || '3', 10);
    format.gamesForSet = parseInt(line[2] || '6', 10);
    format.setFormat = (line[3] || TIEBREAK_6_6).trim();
    format.finalSetFormat = (line[4] || format.setFormat).trim();
    format.advantages = (line[5] || '').trim() === 'Ad';
    format.lets = (line[6] || '').trim() === 'Let';
  } else if (line.length === 6) {
    // Old format
    format.numberOfSets = parseInt(line[1] || '3', 10);
    format.gamesForSet = parseInt(line[2] || '6', 10);
    format.advantages = (line[4] || '').trim() === 'Ad';

    const setFormatStr = (line[3] || '').trim();
    const setsTo = (line[5] || '').trim();

    if (setFormatStr.includes('Set +')) {
      format.setFormat = `7-point Tiebreak at ${setsTo}`;
      format.finalSetFormat = format.setFormat;
    } else if (setFormatStr.includes('Point Tie-Break Only')) {
      format.setFormat = `7-point Tiebreak at ${setsTo}`;
      format.finalSetFormat = '10-point Tie-Break Only';
    }
  } else if (line.length === 5) {
    format.numberOfSets = parseInt(line[1] || '3', 10);
    format.gamesForSet = parseInt(line[2] || '6', 10);
    format.advantages = (line[4] || '').trim() === 'Ad';
    format.setFormat = TIEBREAK_6_6;
    format.finalSetFormat = '10-point Tie-Break Only';
  }

  return format;
}

function parseShotLine(line: string[], players: Record<string, string>): PTFShot {
  const playerKey = (line[1] || '').trim();
  const strokeType = (line[3] || '').trim();

  let stroke = (line[2] || '').trim();
  let actualStrokeType = strokeType;

  // Normalize serve/return strokes
  if ([FIRST_SERVE, SECOND_SERVE].includes(strokeType)) {
    stroke = 'Serve';
    actualStrokeType = strokeType;
  } else if (['First Return', 'Second Return'].includes(strokeType)) {
    stroke = 'Return';
    actualStrokeType = strokeType;
  }

  const result = (line[6] || '').trim();
  const isKeyShot =
    ['Ace', SERVE_WINNER].includes(result) ||
    ![FIRST_SERVE, SECOND_SERVE, 'First Return', 'Second Return'].includes(strokeType);

  return {
    player: players[playerKey] || playerKey,
    stroke,
    strokeType: actualStrokeType,
    result,
    x1: parseFloat(line[4] || '0'),
    y1: parseFloat(line[5] || '0'),
    x2: parseFloat(line[7] || '0'),
    y2: parseFloat(line[8] || '0'),
    time: (line[10] || '').trim() || undefined,
    receiver: players[(line[9] || '').trim()] || (line[9] || '').trim() || undefined,
    isKeyShot,
  };
}

function parsePointLine(
  line: string[],
  players: Record<string, string>,
  shots: PTFShot[],
  pointCounter: number,
): PTFPoint {
  const score: Record<string, string> = {};
  score[players['T']] = line[2] === '' ? '0' : (line[2] || '0');
  score[players['O']] = line[3] === '' ? '0' : (line[3] || '0');

  const server = shots[0]?.player || '';
  const receiver = shots[0]?.receiver || '';
  const winner = players[(line[1] || '').trim()] || '';
  const rallyLength = parseInt(line[5] || '0', 10);

  // Determine breakpoint
  const serverScore = score[server] || '0';
  const receiverScore = score[receiver] || '0';
  const bpScores = ['0-40', '15-40', '30-40', 'D-A'];
  const isBreakpoint = bpScores.includes(`${serverScore}-${receiverScore}`);

  return {
    pointNumber: pointCounter,
    winner,
    server,
    receiver,
    score,
    shots: [...shots],
    rallyLength,
    finishTime: (line[4] || '').trim() || undefined,
    breakpoint: isBreakpoint,
  };
}

function parseGameLine(
  line: string[],
  players: Record<string, string>,
  points: PTFPoint[],
  gameNumber: number,
): PTFGame {
  const score: Record<string, string> = {};
  score[players['T']] = line[2] || '0';
  score[players['O']] = line[3] || '0';

  const winner = players[(line[1] || '').trim()] || 'Unknown';

  return {
    gameNumber,
    server: points[0]?.server || '',
    receiver: points[0]?.receiver || '',
    winner,
    score,
    points: [...points],
    finishTime: (line[4] || '').trim() || undefined,
  };
}

function parseSetFormatString(formatString: string, gamesForSet: number): string {
  if (!formatString) return `${gamesForSet}/TB7`;

  // "10-point Tie-Break Only" → TB10
  if (formatString.includes('Tie-Break Only') || formatString.includes('Tiebreak Only')) {
    const points = parseInt(formatString.split('-point')[0] || '10', 10);
    return `TB${points}`;
  }

  // "7-point Tiebreak at 6-6" → 6/TB7
  const tiebreakMatch = formatString.match(/(\d+)-point Tiebreak at (\d+)/);
  if (tiebreakMatch) {
    const tiebreakTo = parseInt(tiebreakMatch[1], 10);
    const tiebreakAt = parseInt(tiebreakMatch[2], 10);
    if (tiebreakAt === gamesForSet) {
      return `${gamesForSet}/TB${tiebreakTo}`;
    }
    return `${tiebreakAt}/TB${tiebreakTo}`;
  }

  return `${gamesForSet}/TB7`;
}

function mapPTFStroke(stroke: string, strokeType: string): StrokeType | undefined {
  // Map PTF stroke names to factory StrokeType
  const mapping: Record<string, StrokeType> = {
    'Forehand:Drive': 'Forehand',
    'Forehand:Slice': 'Forehand Slice',
    'Forehand:Volley': 'Forehand Volley',
    'Forehand:Drop Shot': 'Forehand Drop Shot',
    'Forehand:Lob': 'Forehand Lob',
    'Forehand:Half Volley': 'Forehand Half-volley',
    'Forehand:Drive Volley': 'Forehand Drive Volley',
    'Backhand:Drive': 'Backhand',
    'Backhand:Slice': 'Backhand Slice',
    'Backhand:Volley': 'Backhand Volley',
    'Backhand:Drop Shot': 'Backhand Drop Shot',
    'Backhand:Lob': 'Backhand Lob',
    'Backhand:Half Volley': 'Backhand Half-volley',
    'Backhand:Drive Volley': 'Backhand Drive Volley',
    'Overhead:Smash': 'Overhead Smash',
  };

  const key = `${stroke}:${strokeType}`;
  if (mapping[key]) return mapping[key];

  // Fallback: check stroke name
  if (stroke === 'Forehand') return 'Forehand';
  if (stroke === 'Backhand') return 'Backhand';
  if (stroke === 'Serve') return undefined; // Serve isn't a StrokeType
  if (stroke === 'Return') return undefined;

  return undefined;
}

function isForhandStroke(stroke: StrokeType): boolean {
  return stroke.startsWith('Forehand') || stroke === 'Overhead Smash';
}

function isBackhandStroke(stroke: StrokeType): boolean {
  return stroke.startsWith('Backhand') || stroke === 'Backhand Overhead Smash';
}

function buildPTFRallySequence(
  shots: PTFShot[],
  players: [string, string],
  _serverIndex: 0 | 1,
): RallyShot[] {
  const sequence: RallyShot[] = [];
  let shotNumber = 1;

  for (const shot of shots) {
    // Skip first serve faults (they're retried)
    if (shot.strokeType === FIRST_SERVE && shot.result !== 'In' && shot.result !== 'Ace' && shot.result !== SERVE_WINNER) {
      continue;
    }

    const playerIndex = shot.player === players[0] ? 0 : 1;
    const stroke = mapPTFStroke(shot.stroke, shot.strokeType);

    const rallyShot: RallyShot = {
      shotNumber: shotNumber++,
      player: playerIndex as 0 | 1,
      stroke: stroke || 'Unknown Shot',
    };

    // Preserve original code
    rallyShot.code = `${shot.stroke}:${shot.strokeType}:${shot.result}`;

    sequence.push(rallyShot);
  }

  return sequence;
}

/**
 * Decode a UTF-16 LE ArrayBuffer to string (browser-compatible)
 */
export function decodeUTF16LE(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  // Remove BOM if present
  let start = 0;
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    start = 2;
  }
  const decoder = new TextDecoder('utf-16le');
  return decoder.decode(bytes.subarray(start));
}

/**
 * Split decoded PTF content into CSV rows
 */
export function splitPTFRows(content: string): string[][] {
  const lines = content.split(/\r?\n/);
  return lines
    .filter((line) => line.trim())
    .map((line) => line.split(',').map((cell) => cell.trim()));
}
