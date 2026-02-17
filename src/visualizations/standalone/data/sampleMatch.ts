/**
 * Sample matchUp data for visualization testing
 * Represents a full matchUp with multiple games and sets
 *
 * UMO v4 Data Model - Uses plain data structures with clear separation
 * of point data and derived context
 */

import type { UMOv4Episode, UMOv4MatchUp, Participant } from '../types/UMOv4';

/**
 * @deprecated Use generateSampleMatchUpV4() instead - returns UMO v4 format
 * This legacy function redirects to the V4 generator for backward compatibility.
 */
export function generateSampleMatch(): UMOv4Episode[] {
  // Redirect to V4 generator - returns episodes array
  return generateSampleMatchUpV4().episodes;
}

// Legacy implementation removed - all code now uses UMO v4 generators

/**
  let pointIndex = 0;
  let gameIndex = 0;

  // Set 1: 6-4
  const set1Games = [
    { server: 0, winner: 0, pointCount: 4 }, // 1-0
    { server: 1, winner: 1, pointCount: 5 }, // 1-1
    { server: 0, winner: 0, pointCount: 4 }, // 2-1
    { server: 1, winner: 0, pointCount: 6 }, // 3-1 (break)
    { server: 0, winner: 0, pointCount: 4 }, // 4-1
    { server: 1, winner: 1, pointCount: 4 }, // 4-2
    { server: 0, winner: 0, pointCount: 5 }, // 5-2
    { server: 1, winner: 1, pointCount: 4 }, // 5-3
    { server: 0, winner: 0, pointCount: 4 }, // 6-3
    { server: 1, winner: 1, pointCount: 4 }, // 6-4
  ];

  let p0Games = 0, p1Games = 0;
  let p0Points = 0, p1Points = 0; // Track points in set
  
  set1Games.forEach((game, idx) => {
    const gameComplete = true;
    const setComplete = idx === set1Games.length - 1;

    for (let i = 0; i < game.pointCount; i++) {
      const isLastPoint = i === game.pointCount - 1;
      const winner = isLastPoint ? game.winner : Math.random() > 0.5 ? 0 : 1;
      
      // Update point counts
      if (winner === 0) p0Points++;
      else p1Points++;
      
      // Calculate points needed to win set (approximate)
      const totalPointsInSet = p0Points + p1Points;
      const pointsToSetP0 = Math.max(24 - p0Points, 0); // ~24 points to win a set
      const pointsToSetP1 = Math.max(24 - p1Points, 0);
      
      const point: Point = {
        index: pointIndex,
        game: gameIndex,
        set: 0,
        server: game.server as 0 | 1,
        winner: winner as 0 | 1,
        rally: generateRally(),
        result: generateResult(winner),
        points: [p0Points, p1Points],
      };

      episodes.push({
        point,
        game: {
          index: gameIndex,
          complete: isLastPoint && gameComplete,
          games: isLastPoint ? [game.winner === 0 ? p0Games + 1 : p0Games, game.winner === 1 ? p1Games + 1 : p1Games] : [p0Games, p1Games],
        },
        set: {
          index: 0,
          complete: isLastPoint && setComplete,
        },
        needed: {
          points_to_game: [4, 4], // Simplified - always need 4 points
          points_to_set: [pointsToSetP0, pointsToSetP1],
          games_to_set: [6, 6], // Standard set format
          is_breakpoint: game.server !== game.winner && isLastPoint,
        },
      });

      pointIndex++;
    }
    
    if (game.winner === 0) p0Games++;
    else p1Games++;
    
    gameIndex++;
  });

  // Set 2: 4-6
  const set2Games = [
    { server: 0, winner: 0, pointCount: 4 }, // 1-0
    { server: 1, winner: 1, pointCount: 4 }, // 1-1
    { server: 0, winner: 1, pointCount: 5 }, // 1-2 (break)
    { server: 1, winner: 1, pointCount: 4 }, // 1-3
    { server: 0, winner: 0, pointCount: 6 }, // 2-3
    { server: 1, winner: 1, pointCount: 4 }, // 2-4
    { server: 0, winner: 0, pointCount: 4 }, // 3-4
    { server: 1, winner: 1, pointCount: 5 }, // 3-5
    { server: 0, winner: 0, pointCount: 4 }, // 4-5
    { server: 1, winner: 1, pointCount: 4 }, // 4-6
  ];

  p0Games = 0; p1Games = 0;
  p0Points = 0; p1Points = 0; // Reset for set 2
  
  set2Games.forEach((game, idx) => {
    const gameComplete = true;
    const setComplete = idx === set2Games.length - 1;

    for (let i = 0; i < game.pointCount; i++) {
      const isLastPoint = i === game.pointCount - 1;
      const winner = isLastPoint ? game.winner : Math.random() > 0.5 ? 0 : 1;
      
      // Update point counts
      if (winner === 0) p0Points++;
      else p1Points++;
      
      // Calculate points needed to win set
      const pointsToSetP0 = Math.max(24 - p0Points, 0);
      const pointsToSetP1 = Math.max(24 - p1Points, 0);
      
      const point: Point = {
        index: pointIndex,
        game: gameIndex,
        set: 1,
        server: game.server as 0 | 1,
        winner: winner as 0 | 1,
        rally: generateRally(),
        result: generateResult(winner),
        points: [p0Points, p1Points],
      };

      episodes.push({
        point,
        game: {
          index: gameIndex,
          complete: isLastPoint && gameComplete,
          games: isLastPoint ? [game.winner === 0 ? p0Games + 1 : p0Games, game.winner === 1 ? p1Games + 1 : p1Games] : [p0Games, p1Games],
        },
        set: {
          index: 1,
          complete: isLastPoint && setComplete,
        },
        needed: {
          points_to_game: [4, 4],
          points_to_set: [pointsToSetP0, pointsToSetP1],
          games_to_set: [6, 6],
          is_breakpoint: game.server !== game.winner && isLastPoint,
        },
      });

      pointIndex++;
    }
    
    if (game.winner === 0) p0Games++;
    else p1Games++;
    
    gameIndex++;
  });

  // Set 3: 7-6 with tiebreak
  const set3Games = [
    { server: 0, winner: 1, pointCount: 5 }, // 0-1
    { server: 1, winner: 1, pointCount: 4 }, // 0-2
    { server: 0, winner: 0, pointCount: 6 }, // 1-2
    { server: 1, winner: 0, pointCount: 5 }, // 2-2
    { server: 0, winner: 0, pointCount: 4 }, // 3-2
    { server: 1, winner: 1, pointCount: 4 }, // 3-3
    { server: 0, winner: 0, pointCount: 4 }, // 4-3
    { server: 1, winner: 1, pointCount: 4 }, // 4-4
    { server: 0, winner: 0, pointCount: 5 }, // 5-4
    { server: 1, winner: 1, pointCount: 4 }, // 5-5
    { server: 0, winner: 0, pointCount: 4 }, // 6-5
    { server: 1, winner: 1, pointCount: 4 }, // 6-6
  ];

  p0Games = 0; p1Games = 0;
  p0Points = 0; p1Points = 0; // Reset for set 3
  
  set3Games.forEach((game, idx) => {
    const gameComplete = true;
    const setComplete = false;

    for (let i = 0; i < game.pointCount; i++) {
      const isLastPoint = i === game.pointCount - 1;
      const winner = isLastPoint ? game.winner : Math.random() > 0.5 ? 0 : 1;
      
      // Update point counts
      if (winner === 0) p0Points++;
      else p1Points++;
      
      // Calculate points needed to win set
      const pointsToSetP0 = Math.max(28 - p0Points, 0); // ~28 points for 7-6 set
      const pointsToSetP1 = Math.max(28 - p1Points, 0);
      
      const point: Point = {
        index: pointIndex,
        game: gameIndex,
        set: 2,
        server: game.server as 0 | 1,
        winner: winner as 0 | 1,
        rally: generateRally(),
        result: generateResult(winner),
        points: [p0Points, p1Points],
      };

      episodes.push({
        point,
        game: {
          index: gameIndex,
          complete: isLastPoint && gameComplete,
          games: isLastPoint ? [game.winner === 0 ? p0Games + 1 : p0Games, game.winner === 1 ? p1Games + 1 : p1Games] : [p0Games, p1Games],
        },
        set: {
          index: 2,
          complete: isLastPoint && setComplete,
        },
        needed: {
          points_to_game: [4, 4],
          points_to_set: [pointsToSetP0, pointsToSetP1],
          games_to_set: [7, 7], // Need 7 to win in deciding set
          is_breakpoint: game.server !== game.winner && isLastPoint,
        },
      });

      pointIndex++;
    }
    
    if (game.winner === 0) p0Games++;
    else p1Games++;
    
    gameIndex++;
  });

  // Tiebreak: 7-5 Player 0 wins
  p0Games = 6; p1Games = 6;
  let tbP0 = 0, tbP1 = 0; // Tiebreak points
  
  for (let i = 0; i < 12; i++) {
    const isLastPoint = i === 11;
    const winner = i < 6 ? (i % 2 === 0 ? 0 : 1) : 0;
    const server = Math.floor(i / 2) % 2 as 0 | 1;
    
    if (winner === 0) {
      tbP0++;
      p0Points++;
    } else {
      tbP1++;
      p1Points++;
    }
    
    // In tiebreak, points_to_set counts down remaining tiebreak points
    const pointsToSetP0 = Math.max(7 - tbP0, 0);
    const pointsToSetP1 = Math.max(7 - tbP1, 0);
    
    const point: Point = {
      index: pointIndex,
      game: gameIndex,
      set: 2,
      server,
      winner: winner as 0 | 1,
      rally: generateRally(),
      result: generateResult(winner),
      points: [p0Points, p1Points],
      tiebreak: true,
      score: `${tbP0}-${tbP1} T`,
    };

    episodes.push({
      point,
      game: {
        index: gameIndex,
        complete: isLastPoint,
        games: [7, 6],
      },
      set: {
        index: 2,
        complete: isLastPoint,
      },
      needed: {
        points_to_game: [7 - tbP0, 7 - tbP1], // Tiebreak needs 7 points
        points_to_set: [pointsToSetP0, pointsToSetP1],
        games_to_set: [0, 0], // Already at 6-6, just need tiebreak
        is_breakpoint: false, // No breakpoints in tiebreak
      },
    });

    pointIndex++;
  }

  return episodes;
}

/**
 * Generate realistic rally notation
 * Rally lengths follow a realistic distribution:
 * - Short rallies (2-5 shots): 60%
 * - Medium rallies (6-10 shots): 30%
 * - Long rallies (11+ shots): 10%
 */
function generateRally(): string {
  const rand = Math.random();
  let rallyLength: number;

  if (rand < 0.6) {
    // Short rallies (2-5 shots) - most common
    rallyLength = Math.floor(Math.random() * 4) + 2;
  } else if (rand < 0.9) {
    // Medium rallies (6-10 shots)
    rallyLength = Math.floor(Math.random() * 5) + 6;
  } else {
    // Long rallies (11-15 shots) - rare
    rallyLength = Math.floor(Math.random() * 5) + 11;
  }

  const shots = ['f', 'b'];
  const serve = Math.random() > 0.5 ? '4fsb1' : '6bsf1';
  let rally = serve;

  for (let i = 0; i < rallyLength - 1; i++) {
    rally += shots[Math.floor(Math.random() * shots.length)] + (i + 2);
  }

  return rally;
}

function generateResult(winner: number): string {
  const results = ['Winner', 'Unforced Error', 'Out', 'Net', 'Ace', 'Serve Winner', 'Passing Shot', 'Forced Error'];
  return results[Math.floor(Math.random() * results.length)];
}

/**
 * Simple data for simpleChart (rally lengths by player)
 */
export function generateSimpleChartData(): number[][] {
  const player0Rallies: number[] = [];
  const player1Rallies: number[] = [];

  for (let i = 0; i < 30; i++) {
    player0Rallies.push(Math.floor(Math.random() * 15) + 2);
    player1Rallies.push(Math.floor(Math.random() * 15) + 2);
  }

  return [player0Rallies, player1Rallies];
}

/**
 * UMO v4 Sample MatchUp Generator
 * Creates a complete matchUp with proper UMO v4 structure
 */
export function generateSampleMatchUpV4(): UMOv4MatchUp {
  const participants: [Participant, Participant] = [
    {
      participantId: 'p1',
      participantName: 'Player One',
      participantType: 'INDIVIDUAL',
      person: {
        personId: 'person1',
        standardFamilyName: 'One',
        standardGivenName: 'Player',
      },
    },
    {
      participantId: 'p2',
      participantName: 'Player Two',
      participantType: 'INDIVIDUAL',
      person: {
        personId: 'person2',
        standardFamilyName: 'Two',
        standardGivenName: 'Player',
      },
    },
  ];

  const episodes = generateSampleEpisodesV4();
  const lastEpisode = episodes[episodes.length - 1];

  return {
    matchUpId: 'sample-matchup-1',
    timestamp: new Date().toISOString(),
    matchUpFormat: {
      bestOf: 3,
      gamesPerSet: 6,
      finalSetFormat: 'tiebreak',
      tiebreakAt: 6,
      tiebreakGamesTo: 7,
    },
    participants,
    episodes,
    state: {
      score: {
        sets: lastEpisode.point.setsScore,
        games: lastEpisode.point.gamesScore,
        points: lastEpisode.point.gameScore,
      },
      currentSet: lastEpisode.point.set,
      currentGame: lastEpisode.point.game,
      servingSide: lastEpisode.point.server,
      serverParticipantId: lastEpisode.point.server === 0 ? 'p1' : 'p2',
      complete: lastEpisode.context.matchUpComplete,
      winningSide: lastEpisode.context.matchUpWinner,
    },
  };
}

/**
 * Generate UMO v4 Episodes for sample matchUp
 * Set 1: 6-4 (Player 0 wins)
 * Set 2: 4-6 (Player 1 wins)
 * Set 3: 7-6(5) (Player 0 wins tiebreak)
 */
function generateSampleEpisodesV4(): UMOv4Episode[] {
  const episodes: UMOv4Episode[] = [];
  let pointIndex = 0;
  let matchGameIndex = 0;
  let setsScore: [number, number] = [0, 0];

  // Helper to create tennis score string
  const tennisScore = (p0: number, p1: number, isTiebreak: boolean): string => {
    if (isTiebreak) {
      return `${p0}-${p1} T`;
    }
    const scores = ['0', '15', '30', '40'];
    if (p0 >= 3 && p1 >= 3) {
      if (p0 === p1) return '40-40';
      return p0 > p1 ? 'A-40' : '40-A';
    }
    const s0 = scores[Math.min(p0, 3)];
    const s1 = scores[Math.min(p1, 3)];
    return `${s0}-${s1}`;
  };

  // Set 1: 6-4
  const set1Games = [
    { server: 0, winner: 0, pointCount: 4 },
    { server: 1, winner: 1, pointCount: 5 },
    { server: 0, winner: 0, pointCount: 4 },
    { server: 1, winner: 0, pointCount: 6 }, // break
    { server: 0, winner: 0, pointCount: 4 },
    { server: 1, winner: 1, pointCount: 4 },
    { server: 0, winner: 0, pointCount: 5 },
    { server: 1, winner: 1, pointCount: 4 },
    { server: 0, winner: 0, pointCount: 4 },
    { server: 1, winner: 1, pointCount: 4 },
  ];

  let gamesScore: [number, number] = [0, 0];
  let setCumulativePoints: [number, number] = [0, 0]; // Track total points won in set

  set1Games.forEach((game, gameInSet) => {
    let gameScore: [number, number] = [0, 0];

    for (let i = 0; i < game.pointCount; i++) {
      const isLastPoint = i === game.pointCount - 1;
      const winner = isLastPoint ? game.winner : Math.random() > 0.5 ? 0 : 1;

      if (winner === 0) {
        gameScore[0]++;
        setCumulativePoints[0]++; // Increment cumulative points
      } else {
        gameScore[1]++;
        setCumulativePoints[1]++; // Increment cumulative points
      }

      const nextGamesScore: [number, number] = [
        isLastPoint && game.winner === 0 ? gamesScore[0] + 1 : gamesScore[0],
        isLastPoint && game.winner === 1 ? gamesScore[1] + 1 : gamesScore[1],
      ];

      const isBreakpoint =
        game.server !== winner &&
        ((gameScore[1 - game.server] >= 3 && gameScore[game.server] < gameScore[1 - game.server]) ||
          (gameScore[1 - game.server] > 3 && gameScore[1 - game.server] > gameScore[game.server]));

      // CRITICAL: Calculate points_to_set correctly
      // Need 6 games to win, with approximately 4 points per game = 24 points baseline
      // But points won in LOST games don't count toward set
      // So: points_to_set = (games_needed * 4) - (points_in_current_game_if_winning)
      const gamesNeeded = [6 - nextGamesScore[0], 6 - nextGamesScore[1]];
      const pointsToSet: [number, number] = [
        gamesNeeded[0] * 4 - (isLastPoint && game.winner === 0 ? 0 : gameScore[0]),
        gamesNeeded[1] * 4 - (isLastPoint && game.winner === 1 ? 0 : gameScore[1]),
      ];

      episodes.push({
        point: {
          id: `set0-game${gameInSet}-point${i}`,
          index: pointIndex,
          timestamp: new Date(Date.now() + pointIndex * 1000).toISOString(),
          set: 0,
          game: matchGameIndex,
          gameInSet,
          pointInGame: i,
          server: game.server as 0 | 1,
          winner: winner as 0 | 1,
          gameScore: [...gameScore],
          gamesScore: isLastPoint ? nextGamesScore : [...gamesScore],
          setsScore: [...setsScore],
          setCumulativePoints: [...setCumulativePoints],
          tennisScore: isLastPoint && isLastPoint ? 'G' : tennisScore(gameScore[0], gameScore[1], false),
          rally: {
            notation: generateRally(),
            length: Math.floor(Math.random() * 8) + 2,
          },
          result: generateResult(winner) as any,
          tiebreak: false,
          breakpoint: isBreakpoint,
          setpoint: false,
          matchUpPoint: false,
        },
        context: {
          pointsNeededToWinGame: [Math.max(4 - gameScore[0], 0), Math.max(4 - gameScore[1], 0)],
          pointsNeededToWinSet: pointsToSet,
          gamesNeededToWinSet: gamesNeeded,
          gameComplete: isLastPoint,
          gameWinner: isLastPoint ? (game.winner as 0 | 1) : undefined,
          setComplete: isLastPoint && gameInSet === set1Games.length - 1,
          setWinner: isLastPoint && gameInSet === set1Games.length - 1 ? 0 : undefined,
          matchUpComplete: false,
          matchUpWinner: undefined,
        },
      });

      pointIndex++;
    }

    gamesScore = [
      game.winner === 0 ? gamesScore[0] + 1 : gamesScore[0],
      game.winner === 1 ? gamesScore[1] + 1 : gamesScore[1],
    ];
    matchGameIndex++;
  });

  setsScore = [1, 0];

  // Set 2: 4-6 (similar structure, player 1 wins)
  setCumulativePoints = [0, 0]; // Reset for set 2

  const set2Games = [
    { server: 0, winner: 0, pointCount: 4 },
    { server: 1, winner: 1, pointCount: 4 },
    { server: 0, winner: 1, pointCount: 5 }, // break
    { server: 1, winner: 1, pointCount: 4 },
    { server: 0, winner: 0, pointCount: 6 },
    { server: 1, winner: 1, pointCount: 4 },
    { server: 0, winner: 0, pointCount: 4 },
    { server: 1, winner: 1, pointCount: 5 },
    { server: 0, winner: 0, pointCount: 4 },
    { server: 1, winner: 1, pointCount: 4 },
  ];

  gamesScore = [0, 0];
  set2Games.forEach((game, gameInSet) => {
    let gameScore: [number, number] = [0, 0];

    for (let i = 0; i < game.pointCount; i++) {
      const isLastPoint = i === game.pointCount - 1;
      const winner = isLastPoint ? game.winner : Math.random() > 0.5 ? 0 : 1;

      if (winner === 0) {
        gameScore[0]++;
        setCumulativePoints[0]++;
      } else {
        gameScore[1]++;
        setCumulativePoints[1]++;
      }

      const nextGamesScore: [number, number] = [
        isLastPoint && game.winner === 0 ? gamesScore[0] + 1 : gamesScore[0],
        isLastPoint && game.winner === 1 ? gamesScore[1] + 1 : gamesScore[1],
      ];

      const isBreakpoint =
        game.server !== winner &&
        ((gameScore[1 - game.server] >= 3 && gameScore[game.server] < gameScore[1 - game.server]) ||
          (gameScore[1 - game.server] > 3 && gameScore[1 - game.server] > gameScore[game.server]));

      // Calculate points_to_set for Set 2
      const gamesNeeded = [6 - nextGamesScore[0], 6 - nextGamesScore[1]];
      const pointsToSet: [number, number] = [
        gamesNeeded[0] * 4 - (isLastPoint && game.winner === 0 ? 0 : gameScore[0]),
        gamesNeeded[1] * 4 - (isLastPoint && game.winner === 1 ? 0 : gameScore[1]),
      ];

      episodes.push({
        point: {
          id: `set1-game${gameInSet}-point${i}`,
          index: pointIndex,
          timestamp: new Date(Date.now() + pointIndex * 1000).toISOString(),
          set: 1,
          game: matchGameIndex,
          gameInSet,
          pointInGame: i,
          server: game.server as 0 | 1,
          winner: winner as 0 | 1,
          gameScore: [...gameScore],
          gamesScore: isLastPoint ? nextGamesScore : [...gamesScore],
          setsScore: [...setsScore],
          setCumulativePoints: [...setCumulativePoints],
          tennisScore: isLastPoint ? 'G' : tennisScore(gameScore[0], gameScore[1], false),
          rally: {
            notation: generateRally(),
            length: Math.floor(Math.random() * 8) + 2,
          },
          result: generateResult(winner) as any,
          tiebreak: false,
          breakpoint: isBreakpoint,
          setpoint: false,
          matchUpPoint: false,
        },
        context: {
          pointsNeededToWinGame: [Math.max(4 - gameScore[0], 0), Math.max(4 - gameScore[1], 0)],
          pointsNeededToWinSet: pointsToSet,
          gamesNeededToWinSet: gamesNeeded,
          gameComplete: isLastPoint,
          gameWinner: isLastPoint ? (game.winner as 0 | 1) : undefined,
          setComplete: isLastPoint && gameInSet === set2Games.length - 1,
          setWinner: isLastPoint && gameInSet === set2Games.length - 1 ? 1 : undefined,
          matchUpComplete: false,
          matchUpWinner: undefined,
        },
      });

      pointIndex++;
    }

    gamesScore = [
      game.winner === 0 ? gamesScore[0] + 1 : gamesScore[0],
      game.winner === 1 ? gamesScore[1] + 1 : gamesScore[1],
    ];
    matchGameIndex++;
  });

  setsScore = [1, 1];

  // Set 3: 7-6(5) with tiebreak - Player 0 wins matchUp
  setCumulativePoints = [0, 0]; // Reset for set 3

  const set3Games = [
    { server: 0, winner: 1, pointCount: 5 },
    { server: 1, winner: 1, pointCount: 4 },
    { server: 0, winner: 0, pointCount: 6 },
    { server: 1, winner: 0, pointCount: 5 },
    { server: 0, winner: 0, pointCount: 4 },
    { server: 1, winner: 1, pointCount: 4 },
    { server: 0, winner: 0, pointCount: 4 },
    { server: 1, winner: 1, pointCount: 4 },
    { server: 0, winner: 0, pointCount: 5 },
    { server: 1, winner: 1, pointCount: 4 },
    { server: 0, winner: 0, pointCount: 4 },
    { server: 1, winner: 1, pointCount: 4 },
  ];

  gamesScore = [0, 0];
  set3Games.forEach((game, gameInSet) => {
    let gameScore: [number, number] = [0, 0];

    for (let i = 0; i < game.pointCount; i++) {
      const isLastPoint = i === game.pointCount - 1;
      const winner = isLastPoint ? game.winner : Math.random() > 0.5 ? 0 : 1;

      if (winner === 0) {
        gameScore[0]++;
        setCumulativePoints[0]++;
      } else {
        gameScore[1]++;
        setCumulativePoints[1]++;
      }

      const nextGamesScore: [number, number] = [
        isLastPoint && game.winner === 0 ? gamesScore[0] + 1 : gamesScore[0],
        isLastPoint && game.winner === 1 ? gamesScore[1] + 1 : gamesScore[1],
      ];

      // Calculate points_to_set for Set 3 (need 7 games in deciding set)
      const gamesNeeded = [7 - nextGamesScore[0], 7 - nextGamesScore[1]];
      const pointsToSet: [number, number] = [
        gamesNeeded[0] * 4 - (isLastPoint && game.winner === 0 ? 0 : gameScore[0]),
        gamesNeeded[1] * 4 - (isLastPoint && game.winner === 1 ? 0 : gameScore[1]),
      ];

      episodes.push({
        point: {
          id: `set2-game${gameInSet}-point${i}`,
          index: pointIndex,
          timestamp: new Date(Date.now() + pointIndex * 1000).toISOString(),
          set: 2,
          game: matchGameIndex,
          gameInSet,
          pointInGame: i,
          server: game.server as 0 | 1,
          winner: winner as 0 | 1,
          gameScore: [...gameScore],
          gamesScore: isLastPoint ? nextGamesScore : [...gamesScore],
          setsScore: [...setsScore],
          setCumulativePoints: [...setCumulativePoints],
          tennisScore: isLastPoint ? 'G' : tennisScore(gameScore[0], gameScore[1], false),
          rally: {
            notation: generateRally(),
            length: Math.floor(Math.random() * 8) + 2,
          },
          result: generateResult(winner) as any,
          tiebreak: false,
          breakpoint: game.server !== winner && gameScore[1 - game.server] >= 3,
          setpoint: false,
          matchpoint: false,
        },
        context: {
          pointsNeededToWinGame: [Math.max(4 - gameScore[0], 0), Math.max(4 - gameScore[1], 0)],
          pointsNeededToWinSet: pointsToSet,
          gamesNeededToWinSet: gamesNeeded,
          gameComplete: isLastPoint,
          gameWinner: isLastPoint ? (game.winner as 0 | 1) : undefined,
          setComplete: false,
          setWinner: undefined,
          matchUpComplete: false,
          matchUpWinner: undefined,
        },
      });

      pointIndex++;
    }

    gamesScore = [
      game.winner === 0 ? gamesScore[0] + 1 : gamesScore[0],
      game.winner === 1 ? gamesScore[1] + 1 : gamesScore[1],
    ];
    matchGameIndex++;
  });

  // Tiebreak: 7-5 Player 0 wins
  gamesScore = [6, 6];
  let tbScore: [number, number] = [0, 0];
  const tiebreakPoints = [0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0]; // Results in 7-5

  tiebreakPoints.forEach((winner, i) => {
    tbScore[winner as 0 | 1]++;
    setCumulativePoints[winner as 0 | 1]++; // Increment cumulative points
    const isLastPoint = i === tiebreakPoints.length - 1;

    episodes.push({
      point: {
        id: `set2-game12-point${i}`,
        index: pointIndex,
        timestamp: new Date(Date.now() + pointIndex * 1000).toISOString(),
        set: 2,
        game: matchGameIndex,
        gameInSet: 12,
        pointInGame: i,
        server: (Math.floor(i / 2) % 2) as 0 | 1,
        winner: winner as 0 | 1,
        gameScore: [...tbScore],
        gamesScore: isLastPoint ? [7, 6] : [6, 6],
        setsScore: isLastPoint ? [2, 1] : [1, 1],
        setCumulativePoints: [...setCumulativePoints],
        tennisScore: tennisScore(tbScore[0], tbScore[1], true),
        rally: {
          notation: generateRally(),
          length: Math.floor(Math.random() * 8) + 2,
        },
        result: generateResult(winner) as any,
        tiebreak: true,
        breakpoint: false,
        setpoint: isLastPoint,
        matchUpPoint: isLastPoint,
      },
      context: {
        pointsNeededToWinGame: [Math.max(7 - tbScore[0], 0), Math.max(7 - tbScore[1], 0)],
        pointsNeededToWinSet: [Math.max(7 - tbScore[0], 0), Math.max(7 - tbScore[1], 0)],
        gamesNeededToWinSet: [0, 0],
        gameComplete: isLastPoint,
        gameWinner: isLastPoint ? 0 : undefined,
        setComplete: isLastPoint,
        setWinner: isLastPoint ? 0 : undefined,
        matchUpComplete: isLastPoint,
        matchUpWinner: isLastPoint ? 0 : undefined,
      },
    });

    pointIndex++;
  });

  return episodes;
}
