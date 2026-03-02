import { describe, it, expect } from 'vitest';
import { supportsGameVisualizations } from '../utils/supportsGameVisualizations';
import { supportsPointsToVisualization } from '../utils/supportsPointsToVisualization';

describe('supportsGameVisualizations', () => {
  it('returns false for undefined', () => {
    expect(supportsGameVisualizations(undefined)).toBe(false);
  });

  it('returns true for standard tennis formats', () => {
    expect(supportsGameVisualizations('SET3-S:6/TB7')).toBe(true);
    expect(supportsGameVisualizations('SET3-S:6NOAD/TB7')).toBe(true);
  });

  it('returns true for explicit -G:TN (with or without deuceAfter)', () => {
    expect(supportsGameVisualizations('SET3-S:6/TB7-G:TN')).toBe(true);
    expect(supportsGameVisualizations('SET3-S:6/TB7-G:TN3D')).toBe(true);
  });

  it('returns false for non-traditional game scoring', () => {
    expect(supportsGameVisualizations('SET5-S:5-G:3C')).toBe(false);
    expect(supportsGameVisualizations('SET3-S:T10-G:AGGR')).toBe(false);
  });

  // Note: squash/pickleball (SET3-S:TB11) and Fast4 (SET3-S:4/TB5@3) have no -G:
  // section, so supportsGameVisualizations returns true (absence of -G: implies
  // standard tennis scoring). The game tree may not render ideally for these
  // formats, but the function does not reject them.
  it('returns true for squash/pickleball (no -G: section)', () => {
    expect(supportsGameVisualizations('SET3-S:TB11')).toBe(true);
  });

  it('returns true for Fast4 (no -G: section)', () => {
    expect(supportsGameVisualizations('SET3-S:4/TB5@3')).toBe(true);
  });

  it('returns false for standalone timed', () => {
    expect(supportsGameVisualizations('T20')).toBe(false);
  });

  it('returns false for non-SET roots', () => {
    expect(supportsGameVisualizations('HAL2A-S:T45')).toBe(false);
    expect(supportsGameVisualizations('QTR4-S:T12')).toBe(false);
    expect(supportsGameVisualizations('PER3-S:T20')).toBe(false);
  });

  it('returns false for timed sets', () => {
    expect(supportsGameVisualizations('SET7XA-S:T10P')).toBe(false);
  });
});

describe('supportsPointsToVisualization', () => {
  it('returns false for undefined', () => {
    expect(supportsPointsToVisualization(undefined)).toBe(false);
  });

  it('returns true for standard tennis formats', () => {
    expect(supportsPointsToVisualization('SET3-S:6/TB7')).toBe(true);
    expect(supportsPointsToVisualization('SET3-S:6NOAD/TB7')).toBe(true);
  });

  it('returns true for explicit -G:TN', () => {
    expect(supportsPointsToVisualization('SET3-S:6/TB7-G:TN')).toBe(true);
    expect(supportsPointsToVisualization('SET3-S:6/TB7-G:TN3D')).toBe(true);
  });

  // Key difference from supportsGameVisualizations: non-traditional games ARE supported
  it('returns true for consecutive game scoring (TYPTI)', () => {
    expect(supportsPointsToVisualization('SET5-S:5-G:3C')).toBe(true);
  });

  it('returns true for squash/pickleball (tiebreak-only sets)', () => {
    expect(supportsPointsToVisualization('SET3-S:TB11')).toBe(true);
  });

  it('returns true for Fast4', () => {
    expect(supportsPointsToVisualization('SET3-S:4/TB5@3')).toBe(true);
  });

  it('returns false for timed + aggregate (timed sets)', () => {
    expect(supportsPointsToVisualization('SET3-S:T10-G:AGGR')).toBe(false);
  });

  it('returns false for standalone timed', () => {
    expect(supportsPointsToVisualization('T20')).toBe(false);
  });

  it('returns false for non-SET roots', () => {
    expect(supportsPointsToVisualization('HAL2A-S:T45')).toBe(false);
    expect(supportsPointsToVisualization('QTR4-S:T12')).toBe(false);
    expect(supportsPointsToVisualization('PER3-S:T20')).toBe(false);
  });

  it('returns false for INTENNSE timed sets', () => {
    expect(supportsPointsToVisualization('SET7XA-S:T10P')).toBe(false);
  });
});

describe('supportsGameVisualizations vs supportsPointsToVisualization', () => {
  const cases: Array<{ code: string; game: boolean; pts: boolean }> = [
    { code: 'SET3-S:6/TB7', game: true, pts: true },
    { code: 'SET5-S:5-G:3C', game: false, pts: true },
    { code: 'SET3-S:TB11', game: true, pts: true },
    { code: 'SET3-S:4/TB5@3', game: true, pts: true },
    { code: 'SET3-S:T10-G:AGGR', game: false, pts: false },
    { code: 'T20', game: false, pts: false },
    { code: 'HAL2A-S:T45', game: false, pts: false },
  ];

  it.each(cases)('$code → game=$game, pts=$pts', ({ code, game, pts }) => {
    expect(supportsGameVisualizations(code)).toBe(game);
    expect(supportsPointsToVisualization(code)).toBe(pts);
  });
});
