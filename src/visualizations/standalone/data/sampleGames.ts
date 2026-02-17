/**
 * Multiple games sample data for gameTree visualization
 * Shows various game progressions with different patterns
 *
 * UMO v4 Data Model - Uses plain data structures
 */

import type { UMOv4Episode } from '../types/UMOv4';

/**
 * @deprecated Use generateMultipleGamesV4() instead - returns UMO v4 format
 * This legacy function redirects to the V4 generator for backward compatibility.
 */
export function generateMultipleGames(): UMOv4Episode[] {
  return generateMultipleGamesV4();
}

// Legacy implementation removed - all code now uses UMO v4 generators

/**
 * UMO v4 Multiple Games Generator
 * Creates episodes in UMO v4 format
 */
export function generateMultipleGamesV4(): UMOv4Episode[] {
  const episodes: UMOv4Episode[] = [];
  let pointIndex = 0;
  let matchGameIndex = 0;

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

  // Define all games
  const allGames = [
    // Game 1: Server wins 40-15
    [
      { server: 0, winner: 0, result: 'Ace', rally: '4fsb1' },
      { server: 0, winner: 1, result: 'Winner', rally: '4fsb1b2f3' },
      { server: 0, winner: 0, result: 'Unforced Error', rally: '4fsb1b2' },
      { server: 0, winner: 0, result: 'Winner', rally: '4fsb1b2f3' },
      { server: 0, winner: 0, result: 'Ace', rally: '4fsb1' },
    ],
    // Game 2: Receiver breaks 0-40
    [
      { server: 1, winner: 0, result: 'Unforced Error', rally: '6bsf1f2' },
      { server: 1, winner: 0, result: 'Winner', rally: '6bsf1f2b3f4' },
      { server: 1, winner: 0, result: 'Unforced Error', rally: '6bsf1' },
      { server: 1, winner: 0, result: 'Winner', rally: '6bsf1f2b3' },
    ],
    // Game 3: Deuce game
    [
      { server: 0, winner: 0, result: 'Ace', rally: '4fsb1' },
      { server: 0, winner: 1, result: 'Winner', rally: '4fsb1b2f3b4' },
      { server: 0, winner: 1, result: 'Unforced Error', rally: '4fsb1b2' },
      { server: 0, winner: 0, result: 'Winner', rally: '4fsb1b2f3' },
      { server: 0, winner: 1, result: 'Winner', rally: '4fsb1b2f3b4' },
      { server: 0, winner: 0, result: 'Ace', rally: '4fsb1' },
      { server: 0, winner: 0, result: 'Winner', rally: '4fsb1b2' },
      { server: 0, winner: 1, result: 'Unforced Error', rally: '4fsb1b2f3' },
      { server: 0, winner: 1, result: 'Winner', rally: '4fsb1b2f3b4' },
      { server: 0, winner: 1, result: 'Winner', rally: '4fsb1b2f3b4' },
    ],
    // Game 4: Server wins 40-30
    [
      { server: 1, winner: 1, result: 'Ace', rally: '6bsf1' },
      { server: 1, winner: 1, result: 'Winner', rally: '6bsf1f2' },
      { server: 1, winner: 0, result: 'Unforced Error', rally: '6bsf1f2b3' },
      { server: 1, winner: 0, result: 'Winner', rally: '6bsf1f2b3f4' },
      { server: 1, winner: 1, result: 'Winner', rally: '6bsf1f2' },
      { server: 1, winner: 1, result: 'Ace', rally: '6bsf1' },
    ],
    // Game 5: Quick server win 40-0
    [
      { server: 0, winner: 0, result: 'Ace', rally: '4fsb1' },
      { server: 0, winner: 0, result: 'Serve Winner', rally: '4fsb1' },
      { server: 0, winner: 0, result: 'Ace', rally: '4fsb1' },
      { server: 0, winner: 0, result: 'Ace', rally: '4fsb1' },
    ],
  ];

  let gamesScore: [number, number] = [0, 0];

  allGames.forEach((gamePoints, gameIdx) => {
    let gameScore: [number, number] = [0, 0];

    gamePoints.forEach((pt, ptIdx) => {
      const isLastPoint = ptIdx === gamePoints.length - 1;

      if (pt.winner === 0) gameScore[0]++;
      else gameScore[1]++;

      const nextGamesScore: [number, number] = isLastPoint
        ? [pt.winner === 0 ? gamesScore[0] + 1 : gamesScore[0], pt.winner === 1 ? gamesScore[1] + 1 : gamesScore[1]]
        : [...gamesScore];

      const isBreakpoint =
        pt.server !== pt.winner &&
        ((gameScore[1 - pt.server] >= 3 && gameScore[pt.server] < gameScore[1 - pt.server]) ||
          (gameScore[1 - pt.server] > 3 && gameScore[1 - pt.server] > gameScore[pt.server]));

      episodes.push({
        point: {
          id: `set0-game${gameIdx}-point${ptIdx}`,
          index: pointIndex,
          timestamp: new Date(Date.now() + pointIndex * 1000).toISOString(),
          set: 0,
          game: matchGameIndex,
          gameInSet: gameIdx,
          pointInGame: ptIdx,
          server: pt.server as 0 | 1,
          winner: pt.winner as 0 | 1,
          gameScore: [...gameScore],
          gamesScore: [...nextGamesScore],
          setsScore: [0, 0],
          setCumulativePoints: [...gameScore], // For multiple games, approximate cumulative
          tennisScore: isLastPoint ? 'G' : tennisScore(gameScore[0], gameScore[1]),
          rallyLength: pt.notation ? pt.notation.split(/\d+/).length - 1 : 0, // Add numeric length
          rally: pt.notation
            ? {
                notation: pt.notation,
                length: pt.notation.split(/\d+/).length - 1,
              }
            : undefined,
          result: pt.result as any,
          tiebreak: false,
          breakpoint: isBreakpoint,
          setpoint: false,
          matchUpPoint: false,
        },
        context: {
          pointsNeededToWinGame: [Math.max(4 - gameScore[0], 0), Math.max(4 - gameScore[1], 0)],
          pointsNeededToWinSet: [24, 24],
          gamesNeededToWinSet: [6 - nextGamesScore[0], 6 - nextGamesScore[1]],
          gameComplete: isLastPoint,
          gameWinner: isLastPoint ? (pt.winner as 0 | 1) : undefined,
          setComplete: false,
          setWinner: undefined,
          matchUpComplete: false,
          matchUpWinner: undefined,
        },
      });

      pointIndex++;
    });

    if (gamePoints[gamePoints.length - 1].winner === 0) {
      gamesScore[0]++;
    } else {
      gamesScore[1]++;
    }
    matchGameIndex++;
  });

  return episodes;
}
