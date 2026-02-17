import { describe, it, expect } from 'vitest';
import { buildEpisodes } from '../episodes/buildEpisodes';

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
    const matchUp = {
      history: {
        points: [
          { winner: 1, server: 1, pointNumber: 1, set: 0, game: 0, score: '0-0', isBreakpoint: false, pointsToGame: [3, 4], pointsToSet: [23, 24], gamesToSet: [6, 6] },
          { winner: 2, server: 1, pointNumber: 2, set: 0, game: 0, score: '0-0', isBreakpoint: false, pointsToGame: [2, 4], pointsToSet: [22, 24], gamesToSet: [6, 6] },
        ],
      },
      score: { sets: [{ side1Score: 0, side2Score: 0 }] },
    };

    const episodes = buildEpisodes(matchUp);
    expect(episodes).toHaveLength(2);
    expect(episodes[0].action).toBe('addPoint');
    expect(episodes[0].point.winner).toBe(1);
    expect(episodes[0].point.server).toBe(1);
    expect(episodes[1].point.winner).toBe(2);
  });

  it('detects game completion when game index changes', () => {
    const matchUp = {
      history: {
        points: [
          { winner: 1, server: 1, pointNumber: 1, set: 0, game: 0, score: '0-0', pointsToGame: [1, 4], gamesToSet: [5, 6] },
          { winner: 1, server: 2, pointNumber: 2, set: 0, game: 1, score: '1-0', pointsToGame: [4, 4], gamesToSet: [5, 6] },
        ],
      },
      score: { sets: [{ side1Score: 1, side2Score: 0 }] },
    };

    const episodes = buildEpisodes(matchUp);
    expect(episodes[0].game.complete).toBe(true);
    expect(episodes[1].game.complete).toBe(false);
  });

  it('populates needed fields from point data', () => {
    const matchUp = {
      history: {
        points: [
          { winner: 1, server: 1, pointNumber: 1, set: 0, game: 0, score: '0-0', pointsToGame: [3, 4], pointsToSet: [23, 24], gamesToSet: [6, 6] },
        ],
      },
      score: { sets: [{ side1Score: 0, side2Score: 0 }] },
    };

    const episodes = buildEpisodes(matchUp);
    expect(episodes[0].needed.points_to_game).toEqual([3, 4]);
    expect(episodes[0].needed.points_to_set).toEqual([23, 24]);
    expect(episodes[0].needed.games_to_set).toEqual([6, 6]);
  });

  it('sets next_service from the next point server', () => {
    const matchUp = {
      history: {
        points: [
          { winner: 1, server: 1, pointNumber: 1, set: 0, game: 0, score: '0-0' },
          { winner: 2, server: 2, pointNumber: 2, set: 0, game: 1, score: '1-0' },
        ],
      },
      score: { sets: [{ side1Score: 1, side2Score: 0 }] },
    };

    const episodes = buildEpisodes(matchUp);
    expect(episodes[0].next_service).toBe(2);
    // Last point uses own server as fallback
    expect(episodes[1].next_service).toBe(2);
  });
});
