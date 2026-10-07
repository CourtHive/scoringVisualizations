/**
 * Generate the bundled demo matches: `src/visualizations/data/syntheticMatches.json`.
 *
 * Every point is played through the factory's ScoringEngine from a fixed seed, so server, set,
 * game, score and tiebreak are the engine's own and the file is identical on every run. The
 * players and the tournament are fictional.
 *
 * Why this exists: the package used to bundle real matches from the Tennis Abstract Match Charting
 * Project, which is CC BY-NC-SA 4.0. Non-commercial + share-alike cannot ride inside an MIT package
 * whose consumers include a commercial client, and renaming or reshuffling that data would still
 * be an adaptation of it. These matches are ours, so the package carries no third-party terms.
 *
 * Usage: node scripts/generateSyntheticMatches.mjs
 */
import { scoreGovernor } from 'tods-competition-factory';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const { ScoringEngine } = scoreGovernor;
const FORMAT = 'SET3-S:6/TB7';

const MATCHES = [
  { seed: 11, players: ['Avery Lindqvist', 'Mateo Okafor'], edge: 0.53 },
  { seed: 29, players: ['Ines Varga', 'Tomas Rehnquist'], edge: 0.5 },
  { seed: 47, players: ['Kenji Arbuckle', 'Lucien Mbeki'], edge: 0.55 },
  { seed: 83, players: ['Sofia Tremblay', 'Noor Castellanos'], edge: 0.48 },
];

/** mulberry32: small, fast, deterministic. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(random, weighted) {
  let roll = random() * weighted.reduce((sum, [, w]) => sum + w, 0);
  for (const [value, weight] of weighted) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return weighted.at(-1)[0];
}

const SERVER_WINS = [['Ace', 10], ['Serve Winner', 12], ['Winner', 30], ['Forced Error', 24], ['Unforced Error', 24]];
const RETURNER_WINS = [['Double Fault', 9], ['Winner', 33], ['Forced Error', 24], ['Unforced Error', 34]];

function rallyLengthFor(result, random) {
  if (result === 'Ace' || result === 'Serve Winner') return 1;
  if (result === 'Double Fault') return 0;
  // most rallies are short; a few run long
  return 2 + Math.floor(random() ** 2 * 14);
}

function playMatch({ seed, players, edge }, matchId) {
  const random = rng(seed);
  const engine = new ScoringEngine({ matchUpFormat: FORMAT });
  const decided = [];

  for (let n = 0; n < 800 && !engine.isComplete(); n++) {
    const server = engine.getNextServer();
    // the server holds about 63% of points; `edge` tilts the match toward player 0
    const holdBias = server === 0 ? edge - 0.5 : 0.5 - edge;
    const serverWins = random() < 0.63 + holdBias;
    const winner = serverWins ? server : 1 - server;
    const result = pick(random, serverWins ? SERVER_WINS : RETURNER_WINS);
    const rallyLength = rallyLengthFor(result, random);
    engine.addPoint({ winner, server, result, rallyLength });
    decided.push({ result, rallyLength });
  }
  if (!engine.isComplete()) throw new Error(`match ${matchId} did not complete`);

  const state = engine.getState();
  const points = state.history.points.map((pt, index) => ({
    index,
    set: pt.set,
    game: pt.game,
    score: pt.score,
    server: pt.server,
    winner: pt.winner,
    result: decided[index].result,
    error: null,
    serves: [],
    rally: [],
    rallyLength: decided[index].rallyLength,
    totalShots: decided[index].rallyLength,
    breakpoint: pt.isBreakpoint ? 1 : null,
    gamepoint: null,
    // 6-6 in a set means its 13th game (index 12) is the tiebreak
    tiebreak: pt.tiebreak ?? pt.game === 12,
    code: '',
  }));

  // per-set game ranges, in the shape the stories read (`sets[n].games[m].range`)
  const sets = [];
  for (const pt of points) {
    const set = (sets[pt.set] ??= { games: [] });
    const game = set.games.at(-1);
    if (!game || game.index !== pt.game) set.games.push({ index: pt.game, range: [pt.index, pt.index], tiebreak: pt.tiebreak });
    else game.range[1] = pt.index;
  }
  const scoreSets = state.score.sets.map((s) => ({ games: [s.side1Score ?? 0, s.side2Score ?? 0], complete: true }));
  let running = [0, 0];
  sets.forEach((set, setIndex) => {
    running = [0, 0];
    set.games = set.games.map((game) => {
      const last = points[game.range[1]];
      running = [...running];
      running[last.winner] += 1;
      return { range: game.range, winner: String(last.winner), score: running, tiebreak: game.tiebreak };
    });
    const games = scoreSets[setIndex]?.games ?? running;
    set.winner = games[0] > games[1] ? 0 : 1;
  });

  const matchWinner = engine.getWinner?.() ?? sets.at(-1).winner;
  return {
    matchId,
    players,
    tournament: { name: 'CourtHive Demo Classic', division: 'M', date: null, tour: '' },
    score: {
      sets: scoreSets,
      match_score: scoreSets.map((s) => s.games.join('-')).join(', '),
      winner: players[matchWinner === 1 || matchWinner === 2 ? matchWinner - 1 : matchWinner] ?? players[0],
    },
    sets,
    points,
    totalPoints: points.length,
  };
}

const out = MATCHES.map((match, i) => playMatch(match, i + 1));
const target = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/visualizations/data/syntheticMatches.json');
fs.writeFileSync(target, JSON.stringify(out, null, 1) + '\n');
for (const m of out) console.log(m.players.join(' v '), m.score.match_score, `${m.totalPoints} points`);
