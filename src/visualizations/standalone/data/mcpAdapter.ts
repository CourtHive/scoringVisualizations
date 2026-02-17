/**
 * Adapter to transform MCP fixture data into UMOv4 Episode format
 * for use in Storybook stories.
 *
 * Uses real match data from the Match Charting Project (MCP)
 * parsed by mcp-charting-points-parser and stored as static JSON fixtures.
 */

import type { UMOv4Episode, UMOv4MatchUp, Participant, PointResult } from '../types/UMOv4';
import type { Point, Episode } from '../types';
import mcpFixtures from './mcpFixtures.json';

// Re-export the raw fixtures for direct access
export { mcpFixtures };

interface McpPoint {
  index: number;
  set: number;
  game: number;
  score: string;
  server: number;
  winner: number;
  result: string;
  error: string | null;
  serves: string[];
  rally: string[];
  rallyLength: number;
  totalShots: number;
  breakpoint: number | null;
  gamepoint: number | null;
  tiebreak: boolean;
  code: string;
}

interface McpGame {
  range: [number, number];
  winner: string;
  score: [number, number];
  tiebreak: boolean;
}

interface McpSet {
  games: McpGame[];
  winner?: number;
}

interface McpFixture {
  matchId: number;
  players: [string, string];
  tournament: {
    name: string;
    division: string;
    date: string | null;
    tour: string;
  };
  score: {
    sets?: Array<{ games: [number, number]; complete: boolean }>;
    match_score?: string;
    winner?: string;
    loser?: string;
  };
  sets: McpSet[];
  points: McpPoint[];
  totalPoints: number;
}

const fixtures = mcpFixtures as McpFixture[];

/**
 * Map MCP result strings to PointResult type
 */
function mapResult(result: string): PointResult {
  const mapping: Record<string, PointResult> = {
    'Ace': 'Ace',
    'Winner': 'Winner',
    'Serve Winner': 'Serve Winner',
    'Unforced Error': 'Unforced Error',
    'Forced Error': 'Forced Error',
    'Double Fault': 'Double Fault',
    'Net': 'Unforced Error', // Net errors are unforced
    'Out': 'Unforced Error', // Out errors are unforced
    'Return Winner': 'Return Winner',
  };
  return mapping[result] || 'Winner';
}

/**
 * Tennis score string from point counts
 */
function tennisScore(p0: number, p1: number, isTiebreak: boolean): string {
  if (isTiebreak) return `${p0}-${p1} T`;
  const scores = ['0', '15', '30', '40'];
  if (p0 >= 3 && p1 >= 3) {
    if (p0 === p1) return '40-40';
    return p0 > p1 ? 'A-40' : '40-A';
  }
  return `${scores[Math.min(p0, 3)]}-${scores[Math.min(p1, 3)]}`;
}

/**
 * Get a specific match fixture by index
 */
export function getMcpMatch(matchIndex: number): McpFixture {
  return fixtures[matchIndex % fixtures.length];
}

/**
 * Get all available match fixtures
 */
export function getAllMcpMatches(): McpFixture[] {
  return fixtures;
}

/**
 * Convert MCP fixture match to UMOv4 MatchUp format
 */
export function mcpToMatchUpV4(matchIndex = 0): UMOv4MatchUp {
  const fixture = getMcpMatch(matchIndex);
  const episodes = mcpToEpisodesV4(matchIndex);
  const lastEpisode = episodes[episodes.length - 1];

  const participants: [Participant, Participant] = [
    {
      participantId: 'p1',
      participantName: fixture.players[0],
      participantType: 'INDIVIDUAL',
      person: {
        personId: 'person1',
        standardFamilyName: fixture.players[0].split(' ').pop() || '',
        standardGivenName: fixture.players[0].split(' ').slice(0, -1).join(' '),
      },
    },
    {
      participantId: 'p2',
      participantName: fixture.players[1],
      participantType: 'INDIVIDUAL',
      person: {
        personId: 'person2',
        standardFamilyName: fixture.players[1].split(' ').pop() || '',
        standardGivenName: fixture.players[1].split(' ').slice(0, -1).join(' '),
      },
    },
  ];

  return {
    matchUpId: `mcp-match-${matchIndex}`,
    timestamp: fixture.tournament.date || new Date().toISOString(),
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
 * Convert MCP fixture match to UMOv4 Episode array
 */
export function mcpToEpisodesV4(matchIndex = 0): UMOv4Episode[] {
  const fixture = getMcpMatch(matchIndex);
  const episodes: UMOv4Episode[] = [];

  // Build a lookup of which game each point belongs to and game metadata
  const gameInfo = buildGameInfo(fixture);

  let setsScore: [number, number] = [0, 0];
  let gamesScore: [number, number] = [0, 0];
  let gameScore: [number, number] = [0, 0];
  let setCumulativePoints: [number, number] = [0, 0];
  let matchGameIndex = 0;
  let currentSet = 0;
  let currentGameInSet = 0;

  fixture.points.forEach((pt, ptIdx) => {
    // Detect set change
    if (pt.set !== currentSet) {
      // Previous set completed — update setsScore
      const prevSetGames = fixture.sets[currentSet]?.games;
      if (prevSetGames && prevSetGames.length > 0) {
        const lastGame = prevSetGames[prevSetGames.length - 1];
        if (lastGame.score[0] > lastGame.score[1]) setsScore[0]++;
        else setsScore[1]++;
      }
      gamesScore = [0, 0];
      setCumulativePoints = [0, 0];
      currentSet = pt.set;
      currentGameInSet = 0;
    }

    // Detect game change
    const gi = gameInfo[ptIdx];
    if (gi && gi.gameInSet !== currentGameInSet) {
      gameScore = [0, 0];
      currentGameInSet = gi.gameInSet;
      matchGameIndex = gi.matchGame;
    }

    // Update scores
    if (pt.winner === 0) {
      gameScore[0]++;
      setCumulativePoints[0]++;
    } else {
      gameScore[1]++;
      setCumulativePoints[1]++;
    }

    const isGameComplete = gi?.isLastPointInGame || false;
    const isSetComplete = gi?.isLastPointInSet || false;
    const isMatchComplete = ptIdx === fixture.points.length - 1;

    // Update gamesScore when game completes
    const nextGamesScore: [number, number] = isGameComplete
      ? [
          gi.gameWinner === 0 ? gamesScore[0] + 1 : gamesScore[0],
          gi.gameWinner === 1 ? gamesScore[1] + 1 : gamesScore[1],
        ]
      : [...gamesScore];

    const nextSetsScore: [number, number] = isSetComplete
      ? [
          gi.setWinner === 0 ? setsScore[0] + 1 : setsScore[0],
          gi.setWinner === 1 ? setsScore[1] + 1 : setsScore[1],
        ]
      : [...setsScore];

    const isBreakpoint = pt.server !== pt.winner &&
      gameScore[1 - pt.server] >= 3 &&
      gameScore[pt.server] < gameScore[1 - pt.server];

    episodes.push({
      point: {
        id: `set${pt.set}-game${currentGameInSet}-point${gi?.pointInGame || 0}`,
        index: ptIdx,
        timestamp: fixture.tournament.date || new Date().toISOString(),
        set: pt.set,
        game: matchGameIndex,
        gameInSet: currentGameInSet,
        pointInGame: gi?.pointInGame || 0,
        server: pt.server as 0 | 1,
        winner: pt.winner as 0 | 1,
        gameScore: [...gameScore],
        gamesScore: isGameComplete ? nextGamesScore : [...gamesScore],
        setsScore: isSetComplete ? nextSetsScore : [...setsScore],
        setCumulativePoints: [...setCumulativePoints],
        tennisScore: isGameComplete && gi.isLastPointInGame ? 'G' : pt.score || tennisScore(gameScore[0], gameScore[1], pt.tiebreak),
        rally: {
          notation: pt.code,
          length: pt.rallyLength,
        },
        rallyLength: pt.rallyLength,
        result: mapResult(pt.result),
        tiebreak: pt.tiebreak,
        breakpoint: isBreakpoint,
        setpoint: isSetComplete,
        matchUpPoint: isMatchComplete,
      },
      context: {
        pointsNeededToWinGame: [
          Math.max((pt.tiebreak ? 7 : 4) - gameScore[0], 0),
          Math.max((pt.tiebreak ? 7 : 4) - gameScore[1], 0),
        ],
        pointsNeededToWinSet: [
          Math.max(24 - setCumulativePoints[0], 0),
          Math.max(24 - setCumulativePoints[1], 0),
        ],
        gamesNeededToWinSet: [
          Math.max(6 - nextGamesScore[0], 0),
          Math.max(6 - nextGamesScore[1], 0),
        ],
        gameComplete: isGameComplete,
        gameWinner: isGameComplete ? (gi.gameWinner as 0 | 1) : undefined,
        setComplete: isSetComplete,
        setWinner: isSetComplete ? (gi.setWinner as 0 | 1 | undefined) : undefined,
        matchUpComplete: isMatchComplete,
        matchUpWinner: isMatchComplete ? (fixture.score.winner === fixture.players[0] ? 0 : 1) : undefined,
      },
    });

    if (isGameComplete) {
      gamesScore = nextGamesScore;
      gameScore = [0, 0];
    }
    if (isSetComplete) {
      setsScore = nextSetsScore;
    }
  });

  return episodes;
}

interface GameInfoEntry {
  matchGame: number;
  gameInSet: number;
  pointInGame: number;
  isLastPointInGame: boolean;
  isLastPointInSet: boolean;
  gameWinner: number;
  setWinner?: number;
}

/**
 * Build per-point game metadata from the fixture's set/game structure
 */
function buildGameInfo(fixture: McpFixture): Record<number, GameInfoEntry> {
  const info: Record<number, GameInfoEntry> = {};
  let matchGame = 0;

  fixture.sets.forEach((set, setIdx) => {
    const isLastSet = setIdx === fixture.sets.length - 1;

    set.games.forEach((game, gameInSet) => {
      const isLastGameInSet = gameInSet === set.games.length - 1;
      const [startPt, endPt] = game.range;
      const gameWinner = parseInt(game.winner, 10);

      // Determine set winner
      let setWinner: number | undefined;
      if (isLastGameInSet) {
        const lastScore = game.score;
        setWinner = lastScore[0] > lastScore[1] ? 0 : 1;
      }

      for (let ptIdx = startPt; ptIdx <= endPt; ptIdx++) {
        const pointInGame = ptIdx - startPt;
        info[ptIdx] = {
          matchGame,
          gameInSet,
          pointInGame,
          isLastPointInGame: ptIdx === endPt,
          isLastPointInSet: ptIdx === endPt && isLastGameInSet,
          gameWinner,
          setWinner: ptIdx === endPt && isLastGameInSet ? setWinner : undefined,
        };
      }
      matchGame++;
    });
  });

  return info;
}

/**
 * Convert MCP fixture match to legacy Episode array (for visualizations that use it)
 */
export function mcpToLegacyEpisodes(matchIndex = 0): Episode[] {
  const v4Episodes = mcpToEpisodesV4(matchIndex);
  return v4Episodes.map(ep => ({
    point: {
      index: ep.point.index,
      game: ep.point.game,
      set: ep.point.set,
      server: ep.point.server,
      winner: ep.point.winner,
      points: ep.point.setCumulativePoints,
      score: ep.point.tennisScore,
      notation: ep.point.rally?.notation,
      rallyLength: ep.point.rallyLength,
      result: ep.point.result,
      tiebreak: ep.point.tiebreak,
      breakpoint: ep.point.breakpoint,
    },
    game: {
      index: ep.point.gameInSet,
      complete: ep.context.gameComplete,
      games: ep.point.gamesScore,
    },
    set: {
      index: ep.point.set,
      complete: ep.context.setComplete,
    },
    needed: {
      points_to_game: ep.context.pointsNeededToWinGame,
      points_to_set: ep.context.pointsNeededToWinSet,
      games_to_set: ep.context.gamesNeededToWinSet,
      is_breakpoint: ep.point.breakpoint,
    },
  }));
}

/**
 * Extract rally lengths from a match for simpleChart
 */
export function mcpRallyLengths(matchIndex = 0): number[][] {
  const fixture = getMcpMatch(matchIndex);
  const player0Rallies: number[] = [];
  const player1Rallies: number[] = [];

  fixture.points.forEach(pt => {
    if (pt.winner === 0) {
      player0Rallies.push(pt.rallyLength);
    } else {
      player1Rallies.push(pt.rallyLength);
    }
  });

  return [player0Rallies, player1Rallies];
}

/**
 * Extract legacy Point array for a single game from a match
 */
export function mcpGamePoints(matchIndex = 0, setIdx = 0, gameIdx = 0): Point[] {
  const fixture = getMcpMatch(matchIndex);
  if (!fixture.sets[setIdx] || !fixture.sets[setIdx].games[gameIdx]) return [];

  const game = fixture.sets[setIdx].games[gameIdx];
  const [startPt, endPt] = game.range;

  return fixture.points.slice(startPt, endPt + 1).map((pt, i) => ({
    index: i,
    game: gameIdx,
    set: setIdx,
    server: pt.server as 0 | 1,
    winner: pt.winner as 0 | 1,
    notation: pt.code,
    rallyLength: pt.rallyLength,
    result: pt.result,
    score: pt.score,
    points: computeGameScore(fixture.points, startPt, startPt + i),
  }));
}

function computeGameScore(points: McpPoint[], gameStart: number, currentIdx: number): [number, number] {
  let p0 = 0, p1 = 0;
  for (let i = gameStart; i <= currentIdx; i++) {
    if (points[i].winner === 0) p0++;
    else p1++;
  }
  return [p0, p1];
}
