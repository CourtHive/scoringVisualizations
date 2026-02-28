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
  let aces = 0;
  let doubleFaults = 0;
  let winners = 0;
  let unforcedErrors = 0;
  let forcedErrors = 0;
  let serveWinners = 0;
  let pointsProcessed = 0;

  // Split content into CSV rows
  const csvRows = splitPTFRows(content);
  if (csvRows.length === 0) {
    return emptyResult('No content to parse', errors);
  }

  // Parse PTF content
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

  // Map format
  const matchUpFormat = providedFormat || mapPTFFormat(ptfMatch.format);
  if (debug) {
    console.log(`Factory format: ${matchUpFormat}`);
  }

  // Create ScoringEngine
  const engine = new ScoringEngine({
    matchUpFormat,
    matchUpId: `ptf-${ptfMatch.players[0]}-${ptfMatch.players[1]}`.replace(/\s+/g, '_'),
  });

  // Set player names
  const state = engine.getState();
  if (state.sides[0]) {
    state.sides[0].participant = {
      participantId: 'player1',
      participantName: ptfMatch.players[0],
      participantType: 'INDIVIDUAL',
      participantRole: 'COMPETITOR',
    };
  }
  if (state.sides[1]) {
    state.sides[1].participant = {
      participantId: 'player2',
      participantName: ptfMatch.players[1],
      participantType: 'INDIVIDUAL',
      participantRole: 'COMPETITOR',
    };
  }

  // Process points from each set → game → point
  for (const set of ptfMatch.sets) {
    for (const game of set.games) {
      for (const point of game.points) {
        try {
          // Parse point
          const parsed = parsePTFPoint(point, ptfMatch.players);

          // Build addPoint options (0-indexed convention for ScoringEngine)
          const pointOptions = {
            winner: (parsed.winningSide - 1) as 0 | 1,
            server: (parsed.serverSideNumber - 1) as 0 | 1,
          };

          // Add point
          engine.addPoint(pointOptions);

          // Decorate last history point with parsed metadata
          const currentState = engine.getState();
          if (currentState.history?.points && currentState.history.points.length > 0) {
            const lastPoint = currentState.history.points[currentState.history.points.length - 1];
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

          pointsProcessed++;

          // Update stats
          switch (parsed.result) {
            case 'Ace':
              aces++;
              break;
            case 'Double Fault':
              doubleFaults++;
              break;
            case 'Winner':
              winners++;
              break;
            case 'Serve Winner':
              serveWinners++;
              break;
            case 'Unforced Error':
              unforcedErrors++;
              break;
            case 'Forced Error':
              forcedErrors++;
              break;
          }

          if (debug && pointsProcessed <= 5) {
            console.log(
              `Point ${pointsProcessed}: ${parsed.result || 'Unknown'} → ${engine.getScoreboard()}`,
            );
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          errors.push(`Set ${set.setNumber} Game ${game.gameNumber} Point ${point.pointNumber}: ${msg}`);
        }
      }
    }
  }

  const matchUp = engine.getState();
  const actualScore = engine.getScoreboard();

  if (debug) {
    console.log(`\nFinal score: ${actualScore}`);
    console.log(`Match status: ${matchUp.matchUpStatus}`);
    console.log(`Points: ${pointsProcessed}`);
    console.log(`Stats: ${aces}A ${doubleFaults}DF ${winners}W ${serveWinners}SW ${unforcedErrors}UE ${forcedErrors}FE`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    matchUp,
    pointsProcessed,
    ptfMatch,
    actualScore,
    aces,
    doubleFaults,
    winners,
    unforcedErrors,
    forcedErrors,
    serveWinners,
  };
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
