import { describe, it, expect } from 'vitest';
import { feedMatchUp, feedAllMatchUps, getMcpFixture, extractRallyLengths, extractGamePoints } from '../engine/feedMatchUp';

describe('feedMatchUp', () => {
  it('produces a valid MatchUp for fixture 0 (Federer vs Djokovic)', () => {
    const matchUp = feedMatchUp(0);
    expect(matchUp).toBeDefined();
    expect(matchUp.history.points.length).toBeGreaterThan(0);
    expect(matchUp.score.sets.length).toBeGreaterThan(0);
  });

  it('produces valid MatchUps for all 4 primary fixtures', () => {
    for (let i = 0; i < 4; i++) {
      const matchUp = feedMatchUp(i);
      expect(matchUp).toBeDefined();
      expect(matchUp.history.points.length).toBeGreaterThan(0);
    }
  });

  it('point counts match fixture data', () => {
    for (let i = 0; i < 4; i++) {
      const fixture = getMcpFixture(i);
      const matchUp = feedMatchUp(i);
      expect(matchUp.history.points).toHaveLength(fixture.points.length);
    }
  });

  it('wraps around for out-of-range matchIndex', () => {
    const fixture0 = getMcpFixture(0);
    const fixtures = feedAllMatchUps();
    const wrapped = feedMatchUp(fixtures.length); // should wrap to index 0
    expect(wrapped.history.points).toHaveLength(fixture0.points.length);
  });

  it('enriches points with mcpCode and tiebreak fields', () => {
    const matchUp = feedMatchUp(0);
    const firstPoint = matchUp.history.points[0];
    expect(firstPoint).toHaveProperty('mcpCode');
    expect(firstPoint).toHaveProperty('tiebreak');
  });

  it('score progression is consistent', () => {
    const matchUp = feedMatchUp(0);
    const points = matchUp.history.points;

    // All points should have set and game indices
    for (const pt of points) {
      expect(pt.set).toBeGreaterThanOrEqual(0);
      expect(pt.game).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('feedAllMatchUps', () => {
  it('returns multiple matchUps', () => {
    const matchUps = feedAllMatchUps();
    expect(matchUps.length).toBeGreaterThan(0);
  });
});

describe('extractRallyLengths', () => {
  it('returns correct shape [p0[], p1[]]', () => {
    const matchUp = feedMatchUp(0);
    const rallies = extractRallyLengths(matchUp);
    expect(rallies).toHaveLength(2);
    expect(Array.isArray(rallies[0])).toBe(true);
    expect(Array.isArray(rallies[1])).toBe(true);
    expect(rallies[0].length + rallies[1].length).toBe(matchUp.history.points.length);
  });

  it('returns empty arrays for null input', () => {
    expect(extractRallyLengths(null)).toEqual([[], []]);
    expect(extractRallyLengths(undefined)).toEqual([[], []]);
  });
});

describe('extractGamePoints', () => {
  it('filters correctly for a specific game', () => {
    const matchUp = feedMatchUp(0);
    const gamePoints = extractGamePoints(matchUp, 0, 0);
    expect(gamePoints.length).toBeGreaterThan(0);

    // All should be set 0, game 0
    for (const pt of gamePoints) {
      expect(pt.set).toBe(0);
      expect(pt.game).toBe(0);
    }
  });

  it('returns points with expected shape', () => {
    const matchUp = feedMatchUp(0);
    const gamePoints = extractGamePoints(matchUp, 0, 0);
    const pt = gamePoints[0];

    expect(pt).toHaveProperty('index');
    expect(pt).toHaveProperty('game');
    expect(pt).toHaveProperty('set');
    expect(pt).toHaveProperty('server');
    expect(pt).toHaveProperty('winner');
    expect(pt).toHaveProperty('rallyLength');
    expect(pt).toHaveProperty('result');
    expect(pt).toHaveProperty('points');
  });

  it('returns empty array for invalid game', () => {
    const matchUp = feedMatchUp(0);
    const gamePoints = extractGamePoints(matchUp, 99, 99);
    expect(gamePoints).toEqual([]);
  });
});
