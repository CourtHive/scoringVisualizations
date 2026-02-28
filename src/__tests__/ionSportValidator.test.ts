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
