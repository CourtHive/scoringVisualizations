import { describe, it, expect } from 'vitest';
import { buildSetMap } from '../engine/buildSetMap';
import { feedMatchUp } from '../engine/feedMatchUp';

describe('buildSetMap', () => {
  it('returns empty array for null/undefined input', () => {
    expect(buildSetMap(null)).toEqual([]);
    expect(buildSetMap(undefined)).toEqual([]);
  });

  it('returns empty array when no points', () => {
    expect(buildSetMap({ history: { points: [] }, score: { sets: [] } })).toEqual([]);
  });

  it('returns empty array when points is not an array', () => {
    expect(buildSetMap({ history: { points: 'bad' }, score: { sets: [] } })).toEqual([]);
  });

  it('produces one SetMap per set from a real match', () => {
    const matchUp = feedMatchUp(0);
    const result = buildSetMap(matchUp);
    expect(result.length).toBe(matchUp.score.sets.length);
  });

  it('each SetMap has correct shape', () => {
    const matchUp = feedMatchUp(0);
    const result = buildSetMap(matchUp, ['Federer', 'Djokovic']);
    for (const setMap of result) {
      expect(setMap).toHaveProperty('p2sdiff');
      expect(setMap).toHaveProperty('gamesScore');
      expect(setMap).toHaveProperty('players');
      expect(setMap).toHaveProperty('winnerIndex');
      expect(Array.isArray(setMap.p2sdiff)).toBe(true);
      expect(setMap.p2sdiff.length).toBeGreaterThan(0);
      expect(setMap.gamesScore).toHaveLength(2);
      expect(setMap.players).toEqual(['Federer', 'Djokovic']);
      expect([0, 1]).toContain(setMap.winnerIndex);
    }
  });

  it('p2sdiff tracks cumulative differential correctly', () => {
    // Manually construct a matchUp where player 0 wins first 3 points
    const matchUp = {
      history: {
        points: [
          { set: 0, winner: 0 },
          { set: 0, winner: 0 },
          { set: 0, winner: 0 },
        ],
      },
      score: { sets: [{ side1Score: 1, side2Score: 0 }] },
    };
    let result: any = buildSetMap(matchUp);
    expect(result).toHaveLength(1);
    expect(result[0].p2sdiff).toEqual([1, 2, 3]);

    // Player 1 wins all 3
    const matchUp2 = {
      history: {
        points: [
          { set: 0, winner: 1 },
          { set: 0, winner: 1 },
          { set: 0, winner: 1 },
        ],
      },
      score: { sets: [{ side1Score: 0, side2Score: 1 }] },
    };
    result = buildSetMap(matchUp2);
    expect(result[0].p2sdiff).toEqual([-1, -2, -3]);
  });

  it('uses default player names when not provided', () => {
    const matchUp = feedMatchUp(0);
    const result = buildSetMap(matchUp);
    expect(result[0].players).toEqual(['Player 1', 'Player 2']);
  });

  it('handles missing sets array gracefully', () => {
    const matchUp = {
      history: { points: [{ set: 0, winner: 0 }] },
      score: {},
    };
    let result: any = buildSetMap(matchUp);
    expect(result).toHaveLength(1);
    expect(result[0].gamesScore).toEqual([0, 0]);
    expect(result[0].winnerIndex).toBe(0);
  });

  it('maps winningSide 2 to winnerIndex 1', () => {
    const matchUp = {
      history: { points: [{ set: 0, winner: 1 }] },
      score: { sets: [{ side1Score: 0, side2Score: 6, winningSide: 2 }] },
    };
    let result: any = buildSetMap(matchUp);
    expect(result[0].winnerIndex).toBe(1);
  });

  it('groups points across multiple sets', () => {
    const matchUp = {
      history: {
        points: [
          { set: 0, winner: 0 },
          { set: 0, winner: 1 },
          { set: 1, winner: 0 },
          { set: 1, winner: 0 },
          { set: 1, winner: 1 },
        ],
      },
      score: {
        sets: [
          { side1Score: 6, side2Score: 4 },
          { side1Score: 7, side2Score: 5 },
        ],
      },
    };
    let result: any = buildSetMap(matchUp);
    expect(result).toHaveLength(2);
    expect(result[0].p2sdiff).toEqual([1, 0]);
    expect(result[1].p2sdiff).toEqual([1, 2, 1]);
    expect(result[0].gamesScore).toEqual([6, 4]);
    expect(result[1].gamesScore).toEqual([7, 5]);
  });
});
