import { describe, it, expect } from 'vitest';
import {
  mapIONSportFormat,
  isTimedFormat,
  parseIONSportPoint,
  parseIONSportMatch,
  extractPlayersFromSide,
  buildSubstitutionEvents,
  type IONSportPoint,
} from '../parsers/ionSportParser';

describe('mapIONSportFormat', () => {
  it('adds T prefix for timed format', () => {
    expect(mapIONSportFormat('SET3-S:10P')).toBe('SET3-S:T10P');
  });

  it('passes through already-correct factory format', () => {
    expect(mapIONSportFormat('SET3-S:T10P')).toBe('SET3-S:T10P');
  });

  it('returns default for empty string', () => {
    expect(mapIONSportFormat('')).toBe('SET3-S:6/TB7');
  });

  it('passes through standard (non-timed) format', () => {
    expect(mapIONSportFormat('SET3-S:6/TB7')).toBe('SET3-S:6/TB7');
  });
});

describe('isTimedFormat', () => {
  it('detects timed format with T prefix', () => {
    expect(isTimedFormat('SET3-S:T10P')).toBe(true);
  });

  it('detects IONSport timed format without T prefix', () => {
    expect(isTimedFormat('SET3-S:10P')).toBe(true);
  });

  it('returns false for standard format', () => {
    expect(isTimedFormat('SET3-S:6/TB7')).toBe(false);
  });
});

describe('parseIONSportPoint', () => {
  it('maps winningSide and serverSideNumber', () => {
    const point: IONSportPoint = {
      pointNumber: 1,
      winningSide: 2,
      winReason: 'NONE',
      server: { sideNumber: 1, playerNumber: 1, player: 'p1-id', returningSide: 'DEUCE' },
      shots: [],
      side1Score: 0,
      side2Score: 1,
      timestamp: '2024-01-01T10:00:00Z',
      substitutions: [],
      onCourtPlayers: { side1: [], side2: [] },
    };

    const parsed = parseIONSportPoint(point);
    expect(parsed.winningSide).toBe(2);
    expect(parsed.serverSideNumber).toBe(1);
    expect(parsed.serverParticipantId).toBe('p1-id');
    expect(parsed.serveSide).toBe('DEUCE');
    expect(parsed.timestamp).toBe('2024-01-01T10:00:00Z');
  });

  it('maps Double Fault from winReason DF', () => {
    const point: IONSportPoint = {
      pointNumber: 1,
      winningSide: 2,
      winReason: 'DF',
      server: { sideNumber: 1, playerNumber: 1, player: null, returningSide: 'AD' },
      shots: [],
      side1Score: 0,
      side2Score: 1,
      timestamp: '2024-01-01T10:00:00Z',
      substitutions: [],
      onCourtPlayers: { side1: [], side2: [] },
    };

    const parsed = parseIONSportPoint(point);
    expect(parsed.result).toBe('Double Fault');
  });

  it('preserves startPointTimeStamp when present', () => {
    const point: IONSportPoint = {
      pointNumber: 1,
      winningSide: 1,
      winReason: 'NONE',
      server: { sideNumber: 1, playerNumber: 1, player: null, returningSide: 'DEUCE' },
      shots: [],
      side1Score: 1,
      side2Score: 0,
      timestamp: '2024-01-01T10:00:00Z',
      startPointTimeStamp: '2024-01-01T09:59:50Z',
      substitutions: [],
      onCourtPlayers: { side1: [], side2: [] },
    };

    const parsed = parseIONSportPoint(point);
    expect(parsed.startPointTimeStamp).toBe('2024-01-01T09:59:50Z');
  });
});

describe('extractPlayersFromSide', () => {
  it('extracts player info from a side', () => {
    const side = {
      sideNumber: 1,
      players: [
        {
          playerNumber: 1,
          participant: { _id: 'abc', first_name: 'John', last_name: 'Doe' },
        },
      ],
    };
    const players = extractPlayersFromSide(side);
    expect(players).toHaveLength(1);
    expect(players[0].participantId).toBe('abc');
    expect(players[0].firstName).toBe('John');
    expect(players[0].lastName).toBe('Doe');
  });

  it('returns empty array for undefined side', () => {
    expect(extractPlayersFromSide(undefined)).toEqual([]);
  });
});

describe('buildSubstitutionEvents', () => {
  it('returns empty for no substitutions', () => {
    const events = buildSubstitutionEvents({ side1: [], side2: [] });
    expect(events).toHaveLength(0);
  });

  it('skips reverted substitutions', () => {
    const events = buildSubstitutionEvents({
      side1: [
        {
          player: { _id: 'p1', first_name: 'A', last_name: 'B' },
          playerNumber: 1,
          inTime: '10:00',
          outTime: '11:00',
          substitutedBy: 'p3',
          substitutedAt: '10:30',
          performedBy: 'ref',
          isReverted: true,
          setNumber: 1,
        },
      ],
      side2: [],
    });
    expect(events).toHaveLength(0);
  });

  it('sorts by set then point number', () => {
    const events = buildSubstitutionEvents({
      side1: [
        {
          player: { _id: 'p1', first_name: 'A', last_name: 'B' },
          playerNumber: 1,
          inTime: '10:00',
          outTime: '11:00',
          substitutedBy: 'p3',
          substitutedAt: '10:30',
          performedBy: 'ref',
          isReverted: false,
          setNumber: 2,
          pointNumber: 5,
        },
      ],
      side2: [
        {
          player: { _id: 'p2', first_name: 'C', last_name: 'D' },
          playerNumber: 1,
          inTime: '10:00',
          outTime: '11:00',
          substitutedBy: 'p4',
          substitutedAt: '10:15',
          performedBy: 'ref',
          isReverted: false,
          setNumber: 1,
          pointNumber: 3,
        },
      ],
    });
    expect(events).toHaveLength(2);
    expect(events[0].setNumber).toBe(1);
    expect(events[1].setNumber).toBe(2);
  });
});

describe('parseIONSportMatch', () => {
  function buildMinimalMatchData() {
    return {
      matchId: 'test-match',
      matchFormat: 'SET3-S:10P',
      matchType: 'S' as const,
      matchStatus: 'COMPLETED',
      sides: [
        {
          sideNumber: 1,
          players: [{ playerNumber: 1, participant: { _id: 'p1', first_name: 'Alice', last_name: 'Smith' } }],
        },
        {
          sideNumber: 2,
          players: [{ playerNumber: 1, participant: { _id: 'p2', first_name: 'Bob', last_name: 'Jones' } }],
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
              ],
            },
          ],
          winningSide: 1,
          side1Score: 1,
          side2Score: 0,
        },
      ],
      playerCourtTimeLog: { side1: [], side2: [] },
    };
  }

  it('parses match format and detects timed', () => {
    const parsed = parseIONSportMatch(buildMinimalMatchData());
    expect(parsed.factoryFormat).toBe('SET3-S:T10P');
    expect(parsed.isTimed).toBe(true);
  });

  it('extracts player info', () => {
    const parsed = parseIONSportMatch(buildMinimalMatchData());
    expect(parsed.side1Players).toHaveLength(1);
    expect(parsed.side1Players[0].firstName).toBe('Alice');
    expect(parsed.side2Players[0].lastName).toBe('Jones');
  });

  it('parses set points', () => {
    const parsed = parseIONSportMatch(buildMinimalMatchData());
    expect(parsed.sets).toHaveLength(1);
    expect(parsed.sets[0].points).toHaveLength(1);
    expect(parsed.sets[0].points[0].winningSide).toBe(1);
  });
});
