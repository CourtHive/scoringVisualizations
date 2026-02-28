import { describe, it, expect } from 'vitest';
import {
  splitPTFRows,
  parsePTFContent,
  mapPTFFormat,
  classifyResult,
  decodeUTF16LE,
  parsePTFPoint,
  type PTFShot,
  type PTFFormat,
} from '../parsers/proTrackerParser';

describe('splitPTFRows', () => {
  it('splits content into trimmed CSV rows', () => {
    const content = 'Header, , , , , , Statistician\nMatch Details, Player A , Player B , 2024-01-01';
    const rows = splitPTFRows(content);
    expect(rows).toHaveLength(2);
    expect(rows[0][0]).toBe('Header');
    expect(rows[0][6]).toBe('Statistician');
    expect(rows[1][1]).toBe('Player A');
  });

  it('filters empty lines', () => {
    const content = 'Header, a\n\n  \nMatch Details, b';
    const rows = splitPTFRows(content);
    expect(rows).toHaveLength(2);
  });

  it('handles Windows line endings', () => {
    const content = 'Header, a\r\nMatch Details, b\r\n';
    const rows = splitPTFRows(content);
    expect(rows).toHaveLength(2);
  });
});

describe('decodeUTF16LE', () => {
  it('decodes a simple UTF-16 LE buffer', () => {
    // "Hi" in UTF-16 LE
    const bytes = new Uint8Array([0x48, 0x00, 0x69, 0x00]);
    const result = decodeUTF16LE(bytes.buffer);
    expect(result).toBe('Hi');
  });

  it('strips BOM when present', () => {
    // BOM + "A" in UTF-16 LE
    const bytes = new Uint8Array([0xff, 0xfe, 0x41, 0x00]);
    const result = decodeUTF16LE(bytes.buffer);
    expect(result).toBe('A');
  });

  it('handles empty buffer after BOM', () => {
    const bytes = new Uint8Array([0xff, 0xfe]);
    const result = decodeUTF16LE(bytes.buffer);
    expect(result).toBe('');
  });
});

describe('parsePTFContent', () => {
  function buildMinimalPTF(): string[][] {
    return [
      ['Match Details', 'Alice', 'Bob', '2024-06-15', 'Test Tournament', 'Hard', 'Outdoor', 'Final'],
      ['Format', '3', '6', '7-point Tiebreak at 6-6', '7-point Tiebreak at 6-6', 'Ad', 'Let'],
      ['Start Time', '10:00'],
      // A single shot + point + game + set sequence
      ['Shot', 'T', 'Serve', 'First Serve', '130', '200', 'Ace', '0', '0', 'O', '10:01'],
      ['Point', 'T', '15', '0', '10:01', '1'],
      ['Shot', 'T', 'Serve', 'First Serve', '130', '200', 'Ace', '0', '0', 'O', '10:02'],
      ['Point', 'T', '30', '0', '10:02', '1'],
      ['Shot', 'T', 'Serve', 'First Serve', '130', '200', 'Ace', '0', '0', 'O', '10:03'],
      ['Point', 'T', '40', '0', '10:03', '1'],
      ['Shot', 'T', 'Serve', 'First Serve', '130', '200', 'Ace', '0', '0', 'O', '10:04'],
      ['Point', 'T', '', '0', '10:04', '1'],
      ['Game', 'T', '1', '0', '10:04'],
      ['Set', 'T', '1', '0', '10:04'],
    ];
  }

  it('parses player names', () => {
    const match = parsePTFContent(buildMinimalPTF());
    expect(match.players).toEqual(['Alice', 'Bob']);
  });

  it('parses format', () => {
    const match = parsePTFContent(buildMinimalPTF());
    expect(match.format.numberOfSets).toBe(3);
    expect(match.format.gamesForSet).toBe(6);
    expect(match.format.advantages).toBe(true);
  });

  it('parses sets and games', () => {
    const match = parsePTFContent(buildMinimalPTF());
    expect(match.sets).toHaveLength(1);
    expect(match.sets[0].games).toHaveLength(1);
    expect(match.sets[0].games[0].points).toHaveLength(4);
  });

  it('assigns correct first server', () => {
    const match = parsePTFContent(buildMinimalPTF());
    expect(match.firstServer).toBe(0); // 'Alice' is T (first player)
  });
});

describe('mapPTFFormat', () => {
  it('maps standard best-of-3 format', () => {
    const format: PTFFormat = {
      numberOfSets: 3,
      gamesForSet: 6,
      setFormat: '7-point Tiebreak at 6-6',
      finalSetFormat: '7-point Tiebreak at 6-6',
      advantages: true,
      lets: true,
    };
    expect(mapPTFFormat(format)).toBe('SET3-S:6/TB7');
  });

  it('maps best-of-5 with match tiebreak final set', () => {
    const format: PTFFormat = {
      numberOfSets: 5,
      gamesForSet: 6,
      setFormat: '7-point Tiebreak at 6-6',
      finalSetFormat: '10-point Tie-Break Only',
      advantages: true,
      lets: true,
    };
    expect(mapPTFFormat(format)).toBe('SET5-S:6/TB7-F:TB10');
  });

  it('adds NoAD suffix when no advantages', () => {
    const format: PTFFormat = {
      numberOfSets: 3,
      gamesForSet: 6,
      setFormat: '7-point Tiebreak at 6-6',
      finalSetFormat: '7-point Tiebreak at 6-6',
      advantages: false,
      lets: true,
    };
    expect(mapPTFFormat(format)).toContain('NoAD');
  });
});

describe('classifyResult', () => {
  it('returns Ace for ace shots', () => {
    const shots: PTFShot[] = [
      { player: 'A', stroke: 'Serve', strokeType: 'First Serve', result: 'Ace', x1: 0, y1: 0, x2: 0, y2: 0 },
    ];
    expect(classifyResult(shots)).toBe('Ace');
  });

  it('returns Winner for winner shots', () => {
    const shots: PTFShot[] = [
      { player: 'A', stroke: 'Serve', strokeType: 'First Serve', result: 'In', x1: 0, y1: 0, x2: 0, y2: 0 },
      { player: 'A', stroke: 'Forehand', strokeType: 'Drive', result: 'Winner', x1: 0, y1: 0, x2: 0, y2: 0 },
    ];
    expect(classifyResult(shots)).toBe('Winner');
  });

  it('returns Double Fault for two serve faults', () => {
    const shots: PTFShot[] = [
      { player: 'A', stroke: 'Serve', strokeType: 'First Serve', result: 'Out', x1: 0, y1: 0, x2: 0, y2: 0 },
      { player: 'A', stroke: 'Serve', strokeType: 'Second Serve', result: 'Netted', x1: 0, y1: 0, x2: 0, y2: 0 },
    ];
    expect(classifyResult(shots)).toBe('Double Fault');
  });

  it('returns Unforced Error for netted rally shot', () => {
    const shots: PTFShot[] = [
      { player: 'A', stroke: 'Serve', strokeType: 'First Serve', result: 'In', x1: 0, y1: 0, x2: 0, y2: 0 },
      { player: 'B', stroke: 'Backhand', strokeType: 'Drive', result: 'Netted', x1: 0, y1: 0, x2: 0, y2: 0 },
    ];
    expect(classifyResult(shots)).toBe('Unforced Error');
  });

  it('returns Forced Error for passing shot error', () => {
    const shots: PTFShot[] = [
      { player: 'A', stroke: 'Forehand', strokeType: 'Drive', result: 'Out Passing Shot', x1: 0, y1: 0, x2: 0, y2: 0 },
    ];
    expect(classifyResult(shots)).toBe('Forced Error');
  });

  it('returns Unknown for empty shots', () => {
    expect(classifyResult([])).toBe('Unknown');
  });
});

describe('parsePTFPoint', () => {
  it('correctly assigns winningSide and serverSideNumber', () => {
    const point = {
      pointNumber: 1,
      winner: 'Alice',
      server: 'Bob',
      receiver: 'Alice',
      score: { Alice: '0', Bob: '0' },
      shots: [],
      rallyLength: 0,
      breakpoint: false,
    };
    const parsed = parsePTFPoint(point, ['Alice', 'Bob']);
    expect(parsed.winningSide).toBe(1); // Alice is player[0] → side 1
    expect(parsed.serverSideNumber).toBe(2); // Bob is player[1] → side 2
  });
});
