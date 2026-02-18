import { describe, it, expect } from 'vitest';
import { extractRallyLengths, extractGamePoints, feedMatchUp } from '../engine/feedMatchUp';

describe('extractRallyLengths', () => {
  it('rally lengths are all non-negative numbers', () => {
    const matchUp = feedMatchUp(0);
    const [p0, p1] = extractRallyLengths(matchUp);

    for (const r of [...p0, ...p1]) {
      expect(typeof r).toBe('number');
      expect(r).toBeGreaterThanOrEqual(0);
    }
  });

  it('total rally count equals point count', () => {
    for (let i = 0; i < 4; i++) {
      const matchUp = feedMatchUp(i);
      const [p0, p1] = extractRallyLengths(matchUp);
      expect(p0.length + p1.length).toBe(matchUp.history.points.length);
    }
  });
});

describe('extractGamePoints', () => {
  it('cumulative points track correctly', () => {
    const matchUp = feedMatchUp(0);
    const gamePoints = extractGamePoints(matchUp, 0, 0);

    let p0 = 0;
    let p1 = 0;
    for (const pt of gamePoints) {
      if (pt.winner === 0) p0++;
      else p1++;
      expect(pt.points).toEqual([p0, p1]);
    }
  });

  it('works for different sets and games', () => {
    const matchUp = feedMatchUp(0);

    // Try second game of first set
    const g1Points = extractGamePoints(matchUp, 0, 1);
    expect(g1Points.length).toBeGreaterThan(0);
    for (const pt of g1Points) {
      expect(pt.set).toBe(0);
      expect(pt.game).toBe(1);
    }
  });

  it('handles missing matchUp gracefully', () => {
    expect(extractGamePoints(null, 0, 0)).toEqual([]);
    expect(extractGamePoints(undefined, 0, 0)).toEqual([]);
    expect(extractGamePoints({}, 0, 0)).toEqual([]);
  });
});
