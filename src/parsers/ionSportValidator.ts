/**
 * IONSport Validator — ScoringEngine integration for IONSport data
 *
 * Uses scoreGovernor.ScoringEngine (matching existing project pattern).
 * Handles substitutions, doubles serving rotation, and timestamp preservation.
 */

import { scoreGovernor } from 'tods-competition-factory';
import {
  parseIONSportMatch,
  buildSubstitutionEvents,
  type ParsedIONSportMatch,
  type SubstitutionInfo,
  type PlayerInfo,
} from './ionSportParser';

const { ScoringEngine } = scoreGovernor;

// ============================================================================
// Types
// ============================================================================

export interface IONSportValidationOptions {
  /** Raw IONSport JSON data */
  jsonData: any;
  /** Debug mode — show detailed steps */
  debug?: boolean;
}

export interface IONSportValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];

  matchUp: any;
  pointsProcessed: number;
  setsProcessed: number;

  /** Parsed match metadata */
  parsedMatch: ParsedIONSportMatch;

  /** Score string */
  actualScore: string;

  /** Per-set scores from validation */
  setScores: Array<{ side1: number; side2: number }>;

  /** Stats */
  doubleFaults: number;
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate IONSport match data
 *
 * Main entry point for IONSport validation.
 */
export function validateIONSportMatch(options: IONSportValidationOptions): IONSportValidationResult {
  const { jsonData, debug = false } = options;

  const errors: string[] = [];
  const warnings: string[] = [];
  let doubleFaults = 0;
  let pointsProcessed = 0;

  const parsedMatch = parseIONSportMatch(jsonData);

  if (debug) {
    logMatchHeader(parsedMatch);
  }

  const engine = new ScoringEngine({
    matchUpFormat: parsedMatch.factoryFormat,
    isDoubles: parsedMatch.isDoubles,
  });

  setupLineUps(engine, parsedMatch.side1Players, parsedMatch.side2Players, parsedMatch.isDoubles);
  setPlayerNames(engine, parsedMatch.side1Players, parsedMatch.side2Players);

  const substitutionEvents = buildSubstitutionEvents(parsedMatch.courtTimeLog);

  if (debug && substitutionEvents.length > 0) {
    console.log(`Substitution events: ${substitutionEvents.length}`);
  }

  let subIndex = 0;
  const setScores: Array<{ side1: number; side2: number }> = [];

  for (let setIdx = 0; setIdx < parsedMatch.sets.length; setIdx++) {
    const set = parsedMatch.sets[setIdx];

    if (debug) {
      console.log(
        `\nSet ${set.setNumber}: ${set.points.length} points, expected ${set.side1Score}-${set.side2Score}`,
      );
    }

    subIndex = processSetBoundarySubstitutions(engine, substitutionEvents, subIndex, set.setNumber, debug);

    const setResult = processSetPoints(engine, set, substitutionEvents, subIndex, debug, errors);
    pointsProcessed += setResult.pointsProcessed;
    doubleFaults += setResult.doubleFaults;
    subIndex = setResult.subIndex;

    if (parsedMatch.isTimed) {
      const lastPoint = set.points.at(-1);
      engine.endSegment({
        setNumber: set.setNumber,
        timestamp: lastPoint?.timestamp,
      });

      if (debug) {
        console.log(`  endSegment → ${engine.getScoreboard()}`);
      }
    }

    recordSetScore(engine, setIdx, set, parsedMatch.isTimed, setScores, warnings);
  }

  while (subIndex < substitutionEvents.length) {
    applySubstitution(engine, substitutionEvents[subIndex]);
    subIndex++;
  }

  const matchUp = engine.getState();

  if (debug) {
    logMatchFooter(engine, matchUp, pointsProcessed, doubleFaults);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    matchUp,
    pointsProcessed,
    setsProcessed: parsedMatch.sets.length,
    parsedMatch,
    actualScore: engine.getScoreboard(),
    setScores,
    doubleFaults,
  };
}

function logMatchHeader(parsedMatch: ParsedIONSportMatch): void {
  const p1 = parsedMatch.side1Players.map((p) => `${p.firstName} ${p.lastName}`).join(' / ');
  const p2 = parsedMatch.side2Players.map((p) => `${p.firstName} ${p.lastName}`).join(' / ');
  console.log(`Validating: ${p1} vs ${p2}`);
  console.log(`Format: ${parsedMatch.matchFormat} → ${parsedMatch.factoryFormat}`);
  console.log(`Type: ${parsedMatch.matchType} (${parsedMatch.isDoubles ? 'doubles' : 'singles'})`);
  console.log(`Timed: ${parsedMatch.isTimed}`);
  console.log(`Sets: ${parsedMatch.sets.length}`);
}

function logMatchFooter(engine: any, matchUp: any, pointsProcessed: number, doubleFaults: number): void {
  console.log(`\nFinal score: ${engine.getScoreboard()}`);
  console.log(`Match status: ${matchUp.matchUpStatus}`);
  console.log(`Points processed: ${pointsProcessed}`);
  console.log(`Double faults: ${doubleFaults}`);
  console.log(`Substitutions: ${matchUp.history?.substitutions?.length || 0}`);
}

function processSetBoundarySubstitutions(
  engine: any,
  substitutionEvents: SubstitutionInfo[],
  startIndex: number,
  setNumber: number,
  debug: boolean,
): number {
  let subIndex = startIndex;
  while (subIndex < substitutionEvents.length) {
    const sub = substitutionEvents[subIndex];
    if (sub.setNumber > setNumber) break;
    if (sub.setNumber === setNumber && (sub.pointNumber === undefined || sub.pointNumber <= 1)) {
      applySubstitution(engine, sub);
      subIndex++;
      if (debug) {
        console.log(`  Sub at set ${sub.setNumber} start: ${sub.outParticipantId} → ${sub.inParticipantId}`);
      }
    } else {
      break;
    }
  }
  return subIndex;
}

function processSetPoints(
  engine: any,
  set: any,
  substitutionEvents: SubstitutionInfo[],
  startSubIndex: number,
  debug: boolean,
  errors: string[],
): { pointsProcessed: number; doubleFaults: number; subIndex: number } {
  let subIndex = startSubIndex;
  let pointsProcessed = 0;
  let doubleFaults = 0;

  for (let ptIdx = 0; ptIdx < set.points.length; ptIdx++) {
    const point = set.points[ptIdx];
    const globalPointNumber = ptIdx + 1;

    subIndex = processMidSetSubstitutions(engine, substitutionEvents, subIndex, set.setNumber, globalPointNumber, debug);

    try {
      addIONSportPoint(engine, point);
      pointsProcessed++;
      if (point.result === 'Double Fault') doubleFaults++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(`Set ${set.setNumber} Point ${ptIdx + 1}: ${msg}`);
    }
  }

  return { pointsProcessed, doubleFaults, subIndex };
}

function processMidSetSubstitutions(
  engine: any,
  substitutionEvents: SubstitutionInfo[],
  startIndex: number,
  setNumber: number,
  globalPointNumber: number,
  debug: boolean,
): number {
  let subIndex = startIndex;
  while (subIndex < substitutionEvents.length) {
    const sub = substitutionEvents[subIndex];
    if (sub.setNumber > setNumber) break;
    if (sub.setNumber === setNumber && sub.pointNumber !== undefined && sub.pointNumber <= globalPointNumber) {
      applySubstitution(engine, sub);
      subIndex++;
      if (debug) {
        console.log(
          `  Sub at set ${sub.setNumber} pt ${sub.pointNumber}: ${sub.outParticipantId} → ${sub.inParticipantId}`,
        );
      }
    } else {
      break;
    }
  }
  return subIndex;
}

function addIONSportPoint(engine: any, point: any): void {
  const pointOptions: Record<string, any> = {
    winner: (point.winningSide - 1) as 0 | 1,
    server: (point.serverSideNumber - 1) as 0 | 1,
  };

  if (point.timestamp) pointOptions.timestamp = point.timestamp;
  if (point.result) pointOptions.result = point.result;
  if (point.scoreValue && point.scoreValue > 1) pointOptions.scoreValue = point.scoreValue;

  engine.addPoint(pointOptions);

  const state = engine.getState();
  const lastPoint = state.history?.points?.at(-1);
  if (lastPoint) {
    if (point.startPointTimeStamp) {
      (lastPoint as any).startPointTimeStamp = point.startPointTimeStamp;
    }
    if (point.serveSide) {
      (lastPoint as any).ionSportServeSide = point.serveSide;
    }
  }
}

function recordSetScore(
  engine: any,
  setIdx: number,
  set: any,
  isTimed: boolean,
  setScores: Array<{ side1: number; side2: number }>,
  warnings: string[],
): void {
  const state = engine.getState();
  const engineSet = state.score.sets[setIdx];
  if (!engineSet) return;

  setScores.push({
    side1: engineSet.side1Score || 0,
    side2: engineSet.side2Score || 0,
  });

  if (isTimed) {
    const s1 = engineSet.side1Score || 0;
    const s2 = engineSet.side2Score || 0;
    if (s1 !== set.side1Score || s2 !== set.side2Score) {
      warnings.push(
        `Set ${set.setNumber} score mismatch: engine=${s1}-${s2}, IONSport=${set.side1Score}-${set.side2Score}`,
      );
    }
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Set up lineUps on engine sides for substitution tracking
 */
function setupLineUps(
  engine: any,
  side1Players: PlayerInfo[],
  side2Players: PlayerInfo[],
  isDoubles: boolean,
): void {
  if (side1Players.length > 0) {
    const lineUp = isDoubles
      ? side1Players.map((p) => ({ participantId: p.participantId }))
      : [{ participantId: side1Players[0].participantId }];
    engine.setLineUp(1, lineUp);
  }
  if (side2Players.length > 0) {
    const lineUp = isDoubles
      ? side2Players.map((p) => ({ participantId: p.participantId }))
      : [{ participantId: side2Players[0].participantId }];
    engine.setLineUp(2, lineUp);
  }
}

/**
 * Set player names on engine sides
 */
function setPlayerNames(
  engine: any,
  side1Players: PlayerInfo[],
  side2Players: PlayerInfo[],
): void {
  const state = engine.getState();
  const side1 = state.sides.find((s: any) => s.sideNumber === 1);
  const side2 = state.sides.find((s: any) => s.sideNumber === 2);

  if (side1 && side1Players.length > 0) {
    side1.participant = {
      participantId: side1Players[0].participantId,
      participantName: side1Players.map((p) => `${p.firstName} ${p.lastName}`).join(' / '),
      participantType: side1Players.length > 1 ? 'PAIR' : 'INDIVIDUAL',
      participantRole: 'COMPETITOR',
    };
  }
  if (side2 && side2Players.length > 0) {
    side2.participant = {
      participantId: side2Players[0].participantId,
      participantName: side2Players.map((p) => `${p.firstName} ${p.lastName}`).join(' / '),
      participantType: side2Players.length > 1 ? 'PAIR' : 'INDIVIDUAL',
      participantRole: 'COMPETITOR',
    };
  }
}

/**
 * Apply a substitution event to the engine
 */
function applySubstitution(engine: any, sub: SubstitutionInfo): void {
  engine.substitute({
    sideNumber: sub.sideNumber,
    outParticipantId: sub.outParticipantId,
    inParticipantId: sub.inParticipantId,
    timestamp: sub.timestamp,
  });
}
