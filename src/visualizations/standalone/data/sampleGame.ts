/**
 * Sample game data for visualization testing
 * Represents a single game with various point scenarios
 *
 * UMO v4 Data Model - Uses plain data structures
 */

import type { Point, GameGroup, Episode } from '../types';
import type { UMOv4Episode, GameGroup as UMOv4GameGroup } from '../types/UMOv4';

/**
 * Standard game: Player 0 wins 40-15
 */
export const sampleGamePoints: Point[] = [
  {
    index: 0,
    game: 0,
    set: 0,
    server: 0,
    winner: 0,
    notation: '4fsb1',
    rallyLength: 3,
    result: 'Ace',
    score: '15-0',
    points: [1, 0],
  },
  {
    index: 1,
    game: 0,
    set: 0,
    server: 0,
    winner: 1,
    notation: '4fsb1b2f3b4',
    rallyLength: 5,
    result: 'Winner',
    score: '15-15',
    points: [1, 1],
  },
  {
    index: 2,
    game: 0,
    set: 0,
    server: 0,
    winner: 0,
    notation: '4fsb1b2',
    rallyLength: 3,
    result: 'Unforced Error',
    score: '30-15',
    points: [2, 1],
  },
  {
    index: 3,
    game: 0,
    set: 0,
    server: 0,
    winner: 0,
    notation: '4fsb1b2f3',
    rallyLength: 5,
    result: 'Net',
    score: '40-15',
    points: [3, 1],
  },
  {
    index: 4,
    game: 0,
    set: 0,
    server: 0,
    winner: 0,
    notation: '4fsb1b2f3b4',
    result: 'Out',
    score: 'G',
    points: [4, 1],
  },
];

/**
 * Deuce game: Multiple deuces before Player 1 wins
 * Point counts track actual game score (0-4+)
 */
export const deuceGamePoints: Point[] = [
  {
    index: 0,
    game: 1,
    set: 0,
    server: 1,
    winner: 1,
    notation: '6bsf1',
    result: 'Serve Winner',
    score: '0-15',
    points: [0, 1], // 0-15
  },
  {
    index: 1,
    game: 1,
    set: 0,
    server: 1,
    winner: 0,
    notation: '6bsf1f2b3',
    result: 'Winner',
    score: '15-15',
    points: [1, 1], // 15-15
  },
  {
    index: 2,
    game: 1,
    set: 0,
    server: 1,
    winner: 1,
    notation: '6bsf1f2',
    result: 'Unforced Error',
    score: '15-30',
    points: [1, 2], // 15-30
  },
  {
    index: 3,
    game: 1,
    set: 0,
    server: 1,
    winner: 0,
    notation: '6bsf1f2b3f4',
    rallyLength: 7,
    result: 'Out',
    score: '30-30',
    points: [2, 2], // 30-30
  },
  {
    index: 4,
    game: 1,
    set: 0,
    server: 1,
    winner: 1,
    notation: '6bsf1f2b',
    rallyLength: 5,
    result: 'Net',
    score: '30-40',
    points: [2, 3], // 30-40
    breakpoint: true,
  },
  {
    index: 5,
    game: 1,
    set: 0,
    server: 1,
    winner: 0,
    notation: '6bsf1f2b3',
    rallyLength: 6,
    result: 'Passing Shot',
    score: '40-40',
    points: [3, 3], // Deuce
  },
  {
    index: 6,
    game: 1,
    set: 0,
    server: 1,
    winner: 0,
    notation: '6bsf1f2b3f4b5',
    rallyLength: 8,
    result: 'Unforced Error',
    score: 'A-40',
    points: [4, 3], // Advantage server (Player 0)
  },
  {
    index: 7,
    game: 1,
    set: 0,
    server: 1,
    winner: 1,
    notation: '6bsf1f2',
    rallyLength: 6,
    result: 'Forced Error',
    score: '40-40',
    points: [4, 4], // Back to deuce
  },
  {
    index: 8,
    game: 1,
    set: 0,
    server: 1,
    winner: 1,
    notation: '6bsf1',
    rallyLength: 3,
    result: 'Winner',
    score: '40-A',
    points: [4, 5], // Advantage receiver (Player 1)
    breakpoint: true,
  },
  {
    index: 9,
    game: 1,
    set: 0,
    server: 1,
    winner: 1,
    notation: '6bsf1f2b3',
    rallyLength: 6,
    result: 'Unforced Error',
    score: 'G',
    points: [4, 6], // Game to Player 1 (break)
  },
];

/**
 * No-Ad game: Goes to 40-40 then directly to game
 * In No-Ad scoring, when score reaches 40-40, the next point wins the game
 */
export const noAdGamePoints: Point[] = [
  {
    index: 0,
    game: 2,
    set: 0,
    server: 0,
    winner: 0,
    notation: '4fsb1',
    rallyLength: 3,
    result: 'Ace',
    score: '15-0',
    points: [1, 0],
  },
  {
    index: 1,
    game: 2,
    set: 0,
    server: 0,
    winner: 1,
    notation: '4fsb1b2f3b4',
    rallyLength: 9,
    result: 'Winner',
    score: '15-15',
    points: [1, 1],
  },
  {
    index: 2,
    game: 2,
    set: 0,
    server: 0,
    winner: 0,
    notation: '4fsb1b2',
    rallyLength: 5,
    result: 'Winner',
    score: '30-15',
    points: [2, 1],
  },
  {
    index: 3,
    game: 2,
    set: 0,
    server: 0,
    winner: 1,
    notation: '4fsb1b2f3',
    rallyLength: 7,
    result: 'Winner',
    score: '30-30',
    points: [2, 2],
  },
  {
    index: 4,
    game: 2,
    set: 0,
    server: 0,
    winner: 0,
    notation: '4fsb1b2f3b4',
    result: 'Winner',
    score: '40-30',
    points: [3, 2],
  },
  {
    index: 5,
    game: 2,
    set: 0,
    server: 0,
    winner: 1,
    notation: '4fsb1b2f3b4f5',
    rallyLength: 11,
    result: 'Passing Shot',
    score: '40-40',
    points: [3, 3],
  },
  {
    index: 6,
    game: 2,
    set: 0,
    server: 0,
    winner: 1,
    notation: '4fsb1b2f3',
    rallyLength: 7,
    result: 'Winner',
    score: 'G',
    points: [3, 4], // In No-Ad, 40-40 goes directly to game on next point
  },
];

/**
 * Tiebreak game: Player 0 wins 7-5
 */
export const tiebreakGamePoints: Point[] = [
  {
    index: 0,
    game: 6,
    set: 0,
    server: 0,
    winner: 0,
    notation: '4fsb1',
    rallyLength: 3,
    result: 'Ace',
    score: '1-0 T',
    points: [1, 0],
    tiebreak: true,
  },
  {
    index: 1,
    game: 6,
    set: 0,
    server: 1,
    winner: 1,
    notation: '6bsf1',
    rallyLength: 3,
    result: 'Serve Winner',
    score: '1-1 T',
    points: [1, 1],
    tiebreak: true,
  },
  {
    index: 2,
    game: 6,
    set: 0,
    server: 1,
    winner: 0,
    notation: '6bsf1f2b3',
    rallyLength: 5,
    result: 'Winner',
    score: '2-1 T',
    points: [2, 1],
    tiebreak: true,
  },
  {
    index: 3,
    game: 6,
    set: 0,
    server: 0,
    winner: 0,
    notation: '4fsb1b2',
    rallyLength: 5,
    result: 'Out',
    score: '3-1 T',
    points: [3, 1],
    tiebreak: true,
  },
  {
    index: 4,
    game: 6,
    set: 0,
    server: 0,
    winner: 1,
    notation: '4fsb1b2f3b4',
    rallyLength: 9,
    result: 'Winner',
    score: '3-2 T',
    points: [3, 2],
    tiebreak: true,
  },
  {
    index: 5,
    game: 6,
    set: 0,
    server: 1,
    winner: 1,
    notation: '6bsf1',
    rallyLength: 3,
    result: 'Ace',
    score: '3-3 T',
    points: [3, 3],
    tiebreak: true,
  },
  {
    index: 6,
    game: 6,
    set: 0,
    server: 1,
    winner: 0,
    notation: '6bsf1f2b',
    rallyLength: 5,
    result: 'Net',
    score: '4-3 T',
    points: [4, 3],
    tiebreak: true,
  },
  {
    index: 7,
    game: 6,
    set: 0,
    server: 0,
    winner: 1,
    notation: '4fsb1b2f3',
    rallyLength: 7,
    result: 'Passing Shot',
    score: '4-4 T',
    points: [4, 4],
    tiebreak: true,
  },
  {
    index: 8,
    game: 6,
    set: 0,
    server: 0,
    winner: 0,
    notation: '4fsb1b2',
    rallyLength: 5,
    result: 'Unforced Error',
    score: '5-4 T',
    points: [5, 4],
    tiebreak: true,
  },
  {
    index: 9,
    game: 6,
    set: 0,
    server: 1,
    winner: 1,
    notation: '6bsf1f2',
    rallyLength: 6,
    result: 'Net',
    score: '5-5 T',
    points: [5, 5],
    tiebreak: true,
  },
  {
    index: 10,
    game: 6,
    set: 0,
    server: 1,
    winner: 0,
    notation: '6bsf1f2b3f4',
    rallyLength: 9,
    result: 'Out',
    score: '6-5 T',
    points: [6, 5],
    tiebreak: true,
  },
  {
    index: 11,
    game: 6,
    set: 0,
    server: 0,
    winner: 0,
    notation: '4fsb1',
    rallyLength: 3,
    result: 'Ace',
    score: '7-5 T',
    points: [7, 5],
    tiebreak: true,
  },
];

/**
 * Game group format (used by gameFish and momentumChart)
 */
export const sampleGameGroup: GameGroup = {
  points: sampleGamePoints,
  index: 0,
  set: 0,
  score: [1, 0],
  complete: true,
  winner: 0,
};

export const deuceGameGroup: GameGroup = {
  points: deuceGamePoints,
  index: 1,
  set: 0,
  score: [1, 1],
  complete: true,
  winner: 1,
};

export const noAdGameGroup: GameGroup = {
  points: noAdGamePoints,
  index: 2,
  set: 0,
  score: [2, 1],
  complete: true,
  winner: 1,
};

export const tiebreakGameGroup: GameGroup = {
  points: tiebreakGamePoints,
  index: 6,
  set: 0,
  score: [6, 6],
  complete: true,
  winner: 0,
  last_game: true,
};

/**
 * Episode format (used by gameTree and ptsChart)
 */
export function pointsToEpisodes(points: Point[]): Episode[] {
  return points.map((point, idx) => {
    // Calculate points needed (simplified for single game scenarios)
    const p0Points = point.points?.[0] || 0;
    const p1Points = point.points?.[1] || 0;
    const pointsToSetP0 = Math.max(24 - p0Points, 0);
    const pointsToSetP1 = Math.max(24 - p1Points, 0);

    // Transform point to include rallyLength (migrate from rally string to proper format)
    const transformedPoint = {
      ...point,
      notation: point.rally, // Keep original as notation
      rallyLength: point.rally ? point.rally.split(/\d+/).length - 1 : 0, // Add numeric length
    };
    delete (transformedPoint as any).rally; // Remove old rally field

    return {
      point: transformedPoint,
      game: {
        index: point.game,
        complete: idx === points.length - 1,
        games: [0, 0], // Simplified
      },
      set: {
        index: point.set,
        complete: false,
      },
      needed: {
        points_to_game: [4, 4], // Simplified - standard game
        points_to_set: [pointsToSetP0, pointsToSetP1],
        games_to_set: [6, 6], // Standard set
        is_breakpoint: point.breakpoint === true,
      },
    };
  });
}

/**
 * UMO v4 Episode Generator
 * Converts Point arrays to UMO v4 Episode format
 */
export function pointsToEpisodesV4(points: Point[], gameIndex: number, setIndex: number): UMOv4Episode[] {
  const tennisScore = (p0: number, p1: number): string => {
    const scores = ['0', '15', '30', '40'];
    if (p0 >= 3 && p1 >= 3) {
      if (p0 === p1) return '40-40';
      return p0 > p1 ? 'A-40' : '40-A';
    }
    const s0 = scores[Math.min(p0, 3)];
    const s1 = scores[Math.min(p1, 3)];
    return `${s0}-${s1}`;
  };

  return points.map((point, idx) => {
    const isLastPoint = idx === points.length - 1;
    const gameScore = point.points || [0, 0];

    return {
      point: {
        id: `set${setIndex}-game${gameIndex}-point${idx}`,
        index: point.index,
        timestamp: new Date(Date.now() + point.index * 1000).toISOString(),
        set: setIndex,
        game: gameIndex,
        gameInSet: gameIndex,
        pointInGame: idx,
        server: point.server,
        winner: point.winner,
        gameScore: [...gameScore] as [number, number],
        gamesScore: [0, 0],
        setsScore: [0, 0],
        setCumulativePoints: [...gameScore] as [number, number], // For single game, cumulative = game score
        tennisScore: point.score || tennisScore(gameScore[0], gameScore[1]),
        rallyLength: point.notation ? point.notation.split(/\d+/).length - 1 : 0, // Add numeric length
        rally: point.notation
          ? {
              notation: point.notation,
              length: point.notation.split(/\d+/).length - 1,
              rallyLength: point.notation.split(/\d+/).length - 1,
            }
          : undefined,
        result: point.result as any,
        tiebreak: point.tiebreak || false,
        breakpoint: point.breakpoint || false,
        setpoint: false,
        matchUpPoint: false,
      },
      context: {
        pointsNeededToWinGame: [Math.max(4 - gameScore[0], 0), Math.max(4 - gameScore[1], 0)],
        pointsNeededToWinSet: [24, 24],
        gamesNeededToWinSet: [6, 6],
        gameComplete: isLastPoint,
        gameWinner: isLastPoint ? point.winner : undefined,
        setComplete: false,
        setWinner: undefined,
        matchUpComplete: false,
        matchUpWinner: undefined,
      },
    };
  });
}

/**
 * UMO v4 Game Groups
 */
export const sampleGameGroupV4: UMOv4GameGroup = {
  index: 0,
  set: 0,
  points: pointsToEpisodesV4(sampleGamePoints, 0, 0),
  score: [1, 0],
  complete: true,
  winner: 0,
};

export const deuceGameGroupV4: UMOv4GameGroup = {
  index: 1,
  set: 0,
  points: pointsToEpisodesV4(deuceGamePoints, 1, 0),
  score: [1, 1],
  complete: true,
  winner: 1,
};

export const tiebreakGameGroupV4: UMOv4GameGroup = {
  index: 6,
  set: 0,
  points: pointsToEpisodesV4(tiebreakGamePoints, 6, 0),
  score: [7, 6],
  complete: true,
  winner: 0,
  last_game: true,
};
