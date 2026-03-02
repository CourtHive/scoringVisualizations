import { describe, it, expect } from 'vitest';
import { validateProTrackerMatch, validateProTrackerBuffer } from '../parsers/proTrackerValidator';
import { decodeUTF16LE, splitPTFRows } from '../parsers/proTrackerParser';

/**
 * Build synthetic PTF content for a short match (4 points = 1 game).
 * Player 'Alice' serves and wins all 4 points with aces.
 */
function buildSyntheticPTFContent(): string {
  const lines = [
    'Match Details, Alice, Bob, 2024-06-15, Test, Hard, Outdoor, R1',
    'Format, 3, 6, 7-point Tiebreak at 6-6, 7-point Tiebreak at 6-6, Ad, Let',
    'Start Time, 10:00',
    // Game 1: Alice serves, 4 aces
    'Shot, T, Serve, First Serve, 130, 200, Ace, 0, 0, O, 10:01',
    'Point, T, 15, 0, 10:01, 1',
    'Shot, T, Serve, First Serve, 130, 200, Ace, 0, 0, O, 10:02',
    'Point, T, 30, 0, 10:02, 1',
    'Shot, T, Serve, First Serve, 130, 200, Ace, 0, 0, O, 10:03',
    'Point, T, 40, 0, 10:03, 1',
    'Shot, T, Serve, First Serve, 130, 200, Ace, 0, 0, O, 10:04',
    'Point, T, , 0, 10:04, 1',
    'Game, T, 1, 0, 10:04',
    'Set, T, 1, 0, 10:04',
  ];
  return lines.join('\n');
}

describe('validateProTrackerMatch', () => {
  it('validates synthetic PTF data with no errors', () => {
    const content = buildSyntheticPTFContent();
    const result = validateProTrackerMatch({ content });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.pointsProcessed).toBe(4);
  });

  it('populates player names from PTF data', () => {
    const content = buildSyntheticPTFContent();
    const result = validateProTrackerMatch({ content });

    expect(result.ptfMatch.players).toEqual(['Alice', 'Bob']);
  });

  it('counts aces from shot data', () => {
    const content = buildSyntheticPTFContent();
    const result = validateProTrackerMatch({ content });

    expect(result.aces).toBe(4);
    expect(result.doubleFaults).toBe(0);
    expect(result.winners).toBe(0);
  });

  it('produces a matchUp with history points', () => {
    const content = buildSyntheticPTFContent();
    const result = validateProTrackerMatch({ content });

    expect(result.matchUp).toBeDefined();
    expect(result.matchUp.history?.points).toHaveLength(4);
  });

  it('generates a score string', () => {
    const content = buildSyntheticPTFContent();
    const result = validateProTrackerMatch({ content });

    // After 1 game (4 aces), score should show 1-0
    expect(result.actualScore).toBeTruthy();
  });

  it('returns error for empty content', () => {
    const result = validateProTrackerMatch({ content: '' });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('accepts format override', () => {
    const content = buildSyntheticPTFContent();
    const result = validateProTrackerMatch({ content, matchUpFormat: 'SET3-S:6/TB7' });
    expect(result.valid).toBe(true);
  });
});

describe('validateProTrackerBuffer', () => {
  it('decodes UTF-16 LE buffer and validates', () => {
    const content = buildSyntheticPTFContent();
    // Encode as UTF-16 LE with BOM
    const encoder = new TextEncoder();
    const utf8 = encoder.encode(content);
    // Manual UTF-16 LE encoding
    const bom = new Uint8Array([0xff, 0xfe]);
    const utf16 = new Uint8Array(content.length * 2);
    for (let i = 0; i < content.length; i++) {
      const code = content.charCodeAt(i);
      utf16[i * 2] = code & 0xff;
      utf16[i * 2 + 1] = (code >> 8) & 0xff;
    }
    const buffer = new Uint8Array(bom.length + utf16.length);
    buffer.set(bom, 0);
    buffer.set(utf16, bom.length);

    const result = validateProTrackerBuffer(buffer.buffer);
    expect(result.valid).toBe(true);
    expect(result.pointsProcessed).toBe(4);
  });
});
