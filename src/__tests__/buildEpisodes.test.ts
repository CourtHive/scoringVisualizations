import { describe, it, expect } from 'vitest';
import { buildEpisodes } from '../episodes/buildEpisodes';

/**
 * Helper to create a ScoringEngine-style MatchUp from simple point data.
 * Simulates what ScoringEngine.getState() returns.
 */
function makeMatchUp(
  points: Array<{
    winner: number;
    server: number;
    set: number;
    game: number;
    score?: string;
    pointNumber?: number;
    isBreakpoint?: boolean;
    pointsToGame?: number[];
    pointsToSet?: number[];
    gamesToSet?: number[];
    result?: string;
    rallyLength?: number;
  }>,
  options?: {
    winningSide?: number;
    sets?: Array<{ side1Score: number; side2Score: number; winningSide?: number }>;
  },
) {
  return {
    history: {
      points: points.map((p, i) => ({
        ...p,
        pointNumber: p.pointNumber ?? i + 1,
        index: i,
      })),
    },
    score: {
      sets: options?.sets ?? [{ side1Score: 0, side2Score: 0 }],
    },
    winningSide: options?.winningSide,
  };
}

describe('buildEpisodes', () => {
  it('returns empty array for null/undefined input', () => {
    expect(buildEpisodes(null)).toEqual([]);
    expect(buildEpisodes(undefined)).toEqual([]);
    expect(buildEpisodes({})).toEqual([]);
  });

  it('returns empty array for matchUp with no points', () => {
    expect(buildEpisodes({ history: { points: [] } })).toEqual([]);
  });

  it('produces one episode per point', () => {
    const matchUp = makeMatchUp([
      { winner: 0, server: 0, set: 0, game: 0, score: '15-0', pointsToGame: [3, 4], pointsToSet: [23, 24], gamesToSet: [6, 6] },
      { winner: 1, server: 0, set: 0, game: 0, score: '15-15', pointsToGame: [2, 4], pointsToSet: [22, 24], gamesToSet: [6, 6] },
    ]);

    const episodes = buildEpisodes(matchUp);
    expect(episodes).toHaveLength(2);
    expect(episodes[0].action).toBe('addPoint');
    expect(episodes[0].point.winner).toBe(0);
    expect(episodes[0].point.server).toBe(0);
    expect(episodes[1].point.winner).toBe(1);
  });

  it('detects game completion when game index changes', () => {
    const matchUp = makeMatchUp(
      [
        { winner: 0, server: 0, set: 0, game: 0, score: '40-0', pointsToGame: [1, 4], gamesToSet: [6, 6] },
        { winner: 0, server: 1, set: 0, game: 1, score: '0-15', pointsToGame: [4, 4], gamesToSet: [5, 6] },
      ],
      { sets: [{ side1Score: 1, side2Score: 0 }] },
    );

    const episodes = buildEpisodes(matchUp);
    expect(episodes[0].game.complete).toBe(true);
    expect(episodes[0].game.winner).toBe(0);
    expect(episodes[1].game.complete).toBe(false);
  });

  it('populates needed fields from point data', () => {
    const matchUp = makeMatchUp([
      { winner: 0, server: 0, set: 0, game: 0, score: '15-0', pointsToGame: [3, 4], pointsToSet: [23, 24], gamesToSet: [6, 6] },
    ]);

    const episodes = buildEpisodes(matchUp);
    expect(episodes[0].needed.points_to_game).toEqual([3, 4]);
    expect(episodes[0].needed.points_to_set).toEqual([23, 24]);
    expect(episodes[0].needed.games_to_set).toEqual([6, 6]);
  });

  it('sets next_service from the next point server', () => {
    const matchUp = makeMatchUp(
      [
        { winner: 0, server: 0, set: 0, game: 0, score: '40-0' },
        { winner: 1, server: 1, set: 0, game: 1, score: '0-15' },
      ],
      { sets: [{ side1Score: 1, side2Score: 0 }] },
    );

    const episodes = buildEpisodes(matchUp);
    expect(episodes[0].next_service).toBe(1);
    // Last point uses own server as fallback
    expect(episodes[1].next_service).toBe(1);
  });

  it('tracks cumulative set points', () => {
    const matchUp = makeMatchUp([
      { winner: 0, server: 0, set: 0, game: 0, score: '15-0' },
      { winner: 1, server: 0, set: 0, game: 0, score: '15-15' },
      { winner: 0, server: 0, set: 0, game: 0, score: '30-15' },
    ]);

    const episodes = buildEpisodes(matchUp);
    expect(episodes[0].point.points).toEqual([1, 0]);
    expect(episodes[1].point.points).toEqual([1, 1]);
    expect(episodes[2].point.points).toEqual([2, 1]);
  });

  it('shows G for game-completing points', () => {
    const matchUp = makeMatchUp(
      [
        { winner: 0, server: 0, set: 0, game: 0, score: '40-0' },
        { winner: 0, server: 1, set: 0, game: 1, score: '0-0' },
      ],
      { sets: [{ side1Score: 1, side2Score: 0 }] },
    );

    const episodes = buildEpisodes(matchUp);
    expect(episodes[0].point.score).toBe('G');
    expect(episodes[1].point.score).toBe('0-0');
  });

  it('preserves optional fields (result, rallyLength, notation, tiebreak)', () => {
    const matchUp = makeMatchUp([
      {
        winner: 0, server: 0, set: 0, game: 0, score: '15-0',
        result: 'Ace', rallyLength: 1, isBreakpoint: false,
      },
    ]);
    // Add MCP-specific fields
    (matchUp.history.points[0] as any).mcpCode = '4fsb1';
    (matchUp.history.points[0] as any).tiebreak = false;

    const episodes = buildEpisodes(matchUp);
    expect(episodes[0].point.result).toBe('Ace');
    expect(episodes[0].point.rallyLength).toBe(1);
    expect(episodes[0].point.notation).toBe('4fsb1');
    expect(episodes[0].point.tiebreak).toBe(false);
  });

  it('updates games score when games complete', () => {
    const matchUp = makeMatchUp(
      [
        { winner: 0, server: 0, set: 0, game: 0, score: '40-0' },
        { winner: 1, server: 1, set: 0, game: 1, score: '0-15' },
        { winner: 1, server: 1, set: 0, game: 1, score: '0-30' },
        { winner: 1, server: 1, set: 0, game: 1, score: '0-40' },
        { winner: 1, server: 1, set: 0, game: 1, score: '0-0' },
        { winner: 0, server: 0, set: 0, game: 2, score: '15-0' },
      ],
      { sets: [{ side1Score: 1, side2Score: 1 }] },
    );

    const episodes = buildEpisodes(matchUp);
    // Game 0 completes: side 0 wins, games go to [1, 0]
    expect(episodes[0].game.games).toEqual([1, 0]);
    // During game 1: games stay at [1, 0]
    expect(episodes[1].game.games).toEqual([1, 0]);
    // Game 1 completes: side 1 wins, games go to [1, 1]
    expect(episodes[4].game.games).toEqual([1, 1]);
    // Game 2 starts: games are [1, 1]
    expect(episodes[5].game.games).toEqual([1, 1]);
  });
});
