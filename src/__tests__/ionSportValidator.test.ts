import { describe, it, expect } from 'vitest';
import { validateIONSportMatch } from '../parsers/ionSportValidator';

/**
 * Build a minimal IONSport JSON fixture: 1 set of timed format with 3 points.
 */
function buildMinimalIONSportData() {
  return {
    matchId: 'test-ion-match',
    matchFormat: 'SET3-S:10P',
    matchType: 'S',
    matchStatus: 'COMPLETED',
    sides: [
      {
        sideNumber: 1,
        players: [
          {
            playerNumber: 1,
            participant: { _id: 'p1', first_name: 'Anna', last_name: 'Garcia' },
          },
        ],
      },
      {
        sideNumber: 2,
        players: [
          {
            playerNumber: 1,
            participant: { _id: 'p2', first_name: 'Maria', last_name: 'Lopez' },
          },
        ],
      },
    ],
    sets: [
      {
        games: [
          {
            gameFormat: 'TIMED',
            gameNumber: 1,
            points: [
              {
                pointNumber: 1,
                winningSide: 1,
                winReason: 'NONE',
                server: { sideNumber: 1, playerNumber: 1, player: 'p1', returningSide: 'DEUCE' },
                shots: [],
                side1Score: 1,
                side2Score: 0,
                timestamp: '2024-01-01T10:00:00Z',
                substitutions: [],
                onCourtPlayers: { side1: [], side2: [] },
              },
              {
                pointNumber: 2,
                winningSide: 2,
                winReason: 'DF',
                server: { sideNumber: 1, playerNumber: 1, player: 'p1', returningSide: 'AD' },
                shots: [],
                side1Score: 1,
                side2Score: 1,
                timestamp: '2024-01-01T10:01:00Z',
                substitutions: [],
                onCourtPlayers: { side1: [], side2: [] },
              },
              {
                pointNumber: 3,
                winningSide: 1,
                winReason: 'NONE',
                server: { sideNumber: 2, playerNumber: 1, player: 'p2', returningSide: 'DEUCE' },
                shots: [],
                side1Score: 2,
                side2Score: 1,
                timestamp: '2024-01-01T10:02:00Z',
                substitutions: [],
                onCourtPlayers: { side1: [], side2: [] },
              },
            ],
          },
        ],
        winningSide: 1,
        side1Score: 2,
        side2Score: 1,
      },
    ],
    playerCourtTimeLog: { side1: [], side2: [] },
  };
}

describe('validateIONSportMatch', () => {
  it('validates minimal IONSport fixture with no errors', () => {
    const result = validateIONSportMatch({ jsonData: buildMinimalIONSportData() });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('processes all points', () => {
    const result = validateIONSportMatch({ jsonData: buildMinimalIONSportData() });
    expect(result.pointsProcessed).toBe(3);
    expect(result.setsProcessed).toBe(1);
  });

  it('counts double faults from DF winReason', () => {
    const result = validateIONSportMatch({ jsonData: buildMinimalIONSportData() });
    expect(result.doubleFaults).toBe(1);
  });

  it('extracts player info in parsedMatch', () => {
    const result = validateIONSportMatch({ jsonData: buildMinimalIONSportData() });
    expect(result.parsedMatch.side1Players).toHaveLength(1);
    expect(result.parsedMatch.side1Players[0].firstName).toBe('Anna');
    expect(result.parsedMatch.side2Players[0].lastName).toBe('Lopez');
  });

  it('produces a matchUp with history', () => {
    const result = validateIONSportMatch({ jsonData: buildMinimalIONSportData() });
    expect(result.matchUp).toBeDefined();
    expect(result.matchUp.history?.points).toHaveLength(3);
  });

  it('records set scores', () => {
    const result = validateIONSportMatch({ jsonData: buildMinimalIONSportData() });
    expect(result.setScores).toHaveLength(1);
    expect(result.setScores[0].side1).toBe(2);
    expect(result.setScores[0].side2).toBe(1);
  });

  it('filters phantom points (no winningSide)', () => {
    const data = buildMinimalIONSportData();
    // Add a phantom point
    data.sets[0].games[0].points.push({
      pointNumber: 4,
      winningSide: undefined as any,
      winReason: 'NONE',
      server: { sideNumber: 1, playerNumber: 1, player: 'p1', returningSide: 'DEUCE' },
      shots: [],
      side1Score: 2,
      side2Score: 1,
      timestamp: '2024-01-01T10:03:00Z',
      substitutions: [],
      onCourtPlayers: { side1: [], side2: [] },
    });

    const result = validateIONSportMatch({ jsonData: data });
    // Phantom point should be filtered in parser, so still 3 processed
    expect(result.pointsProcessed).toBe(3);
  });
});

describe('validateIONSportMatch — what IONSport observed reaches the engine', () => {
  it('records the observed court half, the server participant and the point start time', () => {
    const data = buildMinimalIONSportData();
    (data.sets[0].games[0].points[0] as any).startPointTimeStamp = '2024-01-01T09:59:50Z';
    const result = validateIONSportMatch({ jsonData: data });
    const points: any[] = result.matchUp.history!.points;
    expect(points.map((p) => p.observedServeSide)).toEqual(['deuce', 'ad', 'deuce']);
    expect(points.map((p) => p.serverParticipantId)).toEqual(['p1', 'p1', 'p2']);
    expect(points[0].startPointTimeStamp).toBe('2024-01-01T09:59:50Z');
  });
});

/**
 * An IONSport set built from its point winners (1 | 2). A `null` winner is a phantom point, which the
 * parser drops: a set of phantoms only is a set with no points.
 */
function ionSet(setNumber: number, winners: Array<1 | 2 | null>) {
  let side1Score = 0;
  let side2Score = 0;
  const points = winners.map((winningSide, index) => {
    if (winningSide === 1) side1Score++;
    if (winningSide === 2) side2Score++;
    return {
      pointNumber: index + 1,
      winningSide: winningSide ?? (undefined as any),
      winReason: 'NONE',
      server: { sideNumber: (index % 2) + 1, playerNumber: 1, player: index % 2 ? 'p2' : 'p1' },
      shots: [],
      side1Score,
      side2Score,
      timestamp: `2024-01-01T1${setNumber}:${String(index).padStart(2, '0')}:00Z`,
      substitutions: [],
      onCourtPlayers: { side1: [], side2: [] }
    };
  });
  let winningSide: number | undefined;
  if (side1Score > side2Score) winningSide = 1;
  if (side2Score > side1Score) winningSide = 2;
  return { games: [{ gameFormat: 'TIMED', gameNumber: 1, points }], winningSide, side1Score, side2Score };
}

function ionMatch(matchFormat: string, sets: Array<Array<1 | 2 | null>>) {
  const data: any = buildMinimalIONSportData();
  data.matchFormat = matchFormat;
  data.sets = sets.map((winners, index) => ionSet(index + 1, winners));
  return data;
}

// Factory 7.16 (#5614): endSegment ends timed segments only, and throws for a set with no segment in play,
// one already closed, or a segment that is not timed. The validator ends a segment only where there is one.
describe('validateIONSportMatch: the timed segment end is guarded', () => {
  it('a set with no points ends nothing, and the next set still gets its segment end', () => {
    const data = ionMatch('SET3-S:10P', [[1, 1, 2], [null, null], [1, 2, 1]]);
    const result = validateIONSportMatch({ jsonData: data });

    expect(result.errors).toEqual([]);
    expect(result.warnings).toContain('Set 2: no points, so no timed segment to end');
    // the third IONSport set's points are the engine's second segment, and that segment is ended
    const sets = result.matchUp.score.sets;
    expect(sets).toHaveLength(2);
    expect(sets.map((set: any) => set.winningSide)).toEqual([1, 1]);
    expect(result.matchUp.matchUpStatus).toBe('COMPLETED');
    expect(result.actualScore).toBe('2-1, 2-1');
  });

  it('a set after the match is decided: its points are ignored and not counted, and no segment end is tried', () => {
    const data = ionMatch('SET3-S:10P', [[1, 1, 2], [1, 2, 1], [2, 2]]);
    const result = validateIONSportMatch({ jsonData: data });

    expect(result.errors).toEqual([]);
    expect(result.pointsProcessed).toBe(6);
    expect(result.warnings).toEqual([
      'Set 3 Point 1: ignored by the engine (MATCH_COMPLETED)',
      'Set 3 Point 2: ignored by the engine (MATCH_COMPLETED)'
    ]);
    expect(result.matchUp.history.points).toHaveLength(6);
    expect(result.actualScore).toBe('2-1, 2-1');
  });

  it('an unfinished tiebreak-only final set is not a timed segment: the refusal is a warning, not a throw', () => {
    const data = ionMatch('SET3-S:10P-F:TB10', [[1, 1, 2], [2, 1, 2], [1, 1, 2]]);
    const result = validateIONSportMatch({ jsonData: data });

    expect(result.errors).toEqual([]);
    expect(result.warnings).toContain('Set 3: endSegment refused: endSegment ends timed segments only');
    expect(result.matchUp.matchUpStatus).toBe('IN_PROGRESS');
    // factory 7.16 (#5618): a tiebreak-only set in play shows numeric points
    expect(result.actualScore).toBe('2-1, 1-2, 0-0 (2-1)');
  });
});
