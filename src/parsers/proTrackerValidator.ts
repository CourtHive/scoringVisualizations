/**
 * ProTracker Validator — ScoringEngine integration for ProTracker .ptf data
 *
 * Uses scoreGovernor.ScoringEngine (matching existing project pattern).
 */

import { scoreGovernor } from 'tods-competition-factory';
import {
  parsePTFContent,
  parsePTFPoint,
  mapPTFFormat,
  splitPTFRows,
  decodeUTF16LE,
  type PTFMatch,
} from './proTrackerParser';

const { ScoringEngine } = scoreGovernor;

// ============================================================================
// Types
// ============================================================================

export interface ProTrackerValidationOptions {
  /** Raw file content (already decoded from UTF-16 LE to string) */
  content: string;
  /** Override format (otherwise derived from PTF data) */
  matchUpFormat?: string;
  /** Debug mode */
  debug?: boolean;
}

export interface ProTrackerValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];

  matchUp: any;
  pointsProcessed: number;

  /** Parsed PTF match metadata */
  ptfMatch: PTFMatch;

  /** Score string */
  actualScore: string;

  /** Stats */
  aces: number;
  doubleFaults: number;
  winners: number;
  unforcedErrors: number;
  forcedErrors: number;
  serveWinners: number;
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate ProTracker .ptf data
 *
 * Main entry point for ProTracker validation.
 */
export function validateProTrackerMatch(options: ProTrackerValidationOptions): ProTrackerValidationResult {
  const { content, matchUpFormat: providedFormat, debug = false } = options;

  const errors: string[] = [];
  const warnings: string[] = [];

  const csvRows = splitPTFRows(content);
  if (csvRows.length === 0) {
    return emptyResult('No content to parse', errors);
  }

  let ptfMatch: PTFMatch;
  try {
    ptfMatch = parsePTFContent(csvRows);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return emptyResult(`Failed to parse PTF: ${msg}`, errors);
  }

  if (debug) {
    console.log(`Players: ${ptfMatch.players[0]} vs ${ptfMatch.players[1]}`);
    console.log(`Format: ${JSON.stringify(ptfMatch.format)}`);
    console.log(`Sets: ${ptfMatch.sets.length}`);
  }

  const matchUpFormat = providedFormat || mapPTFFormat(ptfMatch.format);
  if (debug) {
    console.log(`Factory format: ${matchUpFormat}`);
  }

  const engine = new ScoringEngine({
    matchUpFormat,
    matchUpId: `ptf-${ptfMatch.players[0]}-${ptfMatch.players[1]}`.replace(/\s+/g, '_'),
  });

  setPTFPlayerNames(engine, ptfMatch.players);

  const stats = processPTFSets(engine, ptfMatch, debug, errors);

  const matchUp = engine.getState();
  const actualScore = engine.getScoreboard();

  if (debug) {
    console.log(`\nFinal score: ${actualScore}`);
    console.log(`Match status: ${matchUp.matchUpStatus}`);
    console.log(`Points: ${stats.pointsProcessed}`);
    console.log(`Stats: ${stats.aces}A ${stats.doubleFaults}DF ${stats.winners}W ${stats.serveWinners}SW ${stats.unforcedErrors}UE ${stats.forcedErrors}FE`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    matchUp,
    pointsProcessed: stats.pointsProcessed,
    ptfMatch,
    actualScore,
    aces: stats.aces,
    doubleFaults: stats.doubleFaults,
    winners: stats.winners,
    unforcedErrors: stats.unforcedErrors,
    forcedErrors: stats.forcedErrors,
    serveWinners: stats.serveWinners,
  };
}

interface PTFStats {
  pointsProcessed: number;
  aces: number;
  doubleFaults: number;
  winners: number;
  unforcedErrors: number;
  forcedErrors: number;
  serveWinners: number;
}

function setPTFPlayerNames(engine: any, players: [string, string]): void {
  const state = engine.getState();
  for (let i = 0; i < 2; i++) {
    if (state.sides[i]) {
      state.sides[i].participant = {
        participantId: `player${i + 1}`,
        participantName: players[i],
        participantType: 'INDIVIDUAL',
        participantRole: 'COMPETITOR',
      };
    }
  }
}

function processPTFSets(
  engine: any,
  ptfMatch: PTFMatch,
  debug: boolean,
  errors: string[],
): PTFStats {
  const stats: PTFStats = {
    pointsProcessed: 0,
    aces: 0,
    doubleFaults: 0,
    winners: 0,
    unforcedErrors: 0,
    forcedErrors: 0,
    serveWinners: 0,
  };

  for (const set of ptfMatch.sets) {
    for (const game of set.games) {
      for (const point of game.points) {
        try {
          const parsed = parsePTFPoint(point, ptfMatch.players);
          addPTFPoint(engine, parsed);
          stats.pointsProcessed++;
          updatePTFStats(stats, parsed.result);

          if (debug && stats.pointsProcessed <= 5) {
            console.log(
              `Point ${stats.pointsProcessed}: ${parsed.result || 'Unknown'} → ${engine.getScoreboard()}`,
            );
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          errors.push(`Set ${set.setNumber} Game ${game.gameNumber} Point ${point.pointNumber}: ${msg}`);
        }
      }
    }
  }

  return stats;
}

function addPTFPoint(engine: any, parsed: any): void {
  engine.addPoint({
    winner: (parsed.winningSide - 1) as 0 | 1,
    server: (parsed.serverSideNumber - 1) as 0 | 1,
  });

  const currentState = engine.getState();
  const lastPoint = currentState.history?.points?.at(-1);
  if (lastPoint) {
    if (parsed.result) lastPoint.result = parsed.result;
    if (parsed.stroke) lastPoint.stroke = parsed.stroke;
    if (parsed.hand) lastPoint.hand = parsed.hand;
    if (parsed.serveLocation) lastPoint.serveLocation = parsed.serveLocation;
    if (parsed.rally) lastPoint.rally = parsed.rally;
    if (parsed.rallyLength) lastPoint.rallyLength = parsed.rallyLength;
    if (parsed.metadata) {
      (lastPoint as any).metadata = parsed.metadata;
    }
  }
}

const ptfStatMap: Record<string, keyof PTFStats> = {
  'Ace': 'aces',
  'Double Fault': 'doubleFaults',
  'Winner': 'winners',
  'Serve Winner': 'serveWinners',
  'Unforced Error': 'unforcedErrors',
  'Forced Error': 'forcedErrors',
};

function updatePTFStats(stats: PTFStats, result: string | undefined): void {
  if (!result) return;
  const key = ptfStatMap[result];
  if (key) {
    (stats[key] as number)++;
  }
}

/**
 * Validate ProTracker match from a raw UTF-16 LE ArrayBuffer
 */
export function validateProTrackerBuffer(
  buffer: ArrayBuffer,
  options?: Omit<ProTrackerValidationOptions, 'content'>,
): ProTrackerValidationResult {
  const content = decodeUTF16LE(buffer);
  return validateProTrackerMatch({ ...options, content });
}

// ============================================================================
// Helpers
// ============================================================================

function emptyResult(errorMsg: string, errors: string[]): ProTrackerValidationResult {
  errors.push(errorMsg);

  const engine = new ScoringEngine({ matchUpFormat: 'SET3-S:6/TB7' });

  return {
    valid: false,
    errors,
    warnings: [],
    matchUp: engine.getState(),
    pointsProcessed: 0,
    ptfMatch: {
      players: ['', ''],
      format: {
        numberOfSets: 3,
        gamesForSet: 6,
        setFormat: '',
        finalSetFormat: '',
        advantages: true,
        lets: true,
      },
      sets: [],
    },
    actualScore: '',
    aces: 0,
    doubleFaults: 0,
    winners: 0,
    unforcedErrors: 0,
    forcedErrors: 0,
    serveWinners: 0,
  };
}
