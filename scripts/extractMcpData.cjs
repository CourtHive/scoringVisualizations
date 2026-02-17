/**
 * Extract real match data from MCP parser for Storybook fixtures.
 * Must be run from the mcp-charting-points-parser directory:
 *   cd ../../mcp-charting-points-parser && node ../scoringVisualizations/scripts/extractMcpData.cjs
 */
const path = require('path');
const fs = require('fs');

const parserDir = path.resolve(__dirname, '../../mcp-charting-points-parser');
process.chdir(parserDir);
const mcpParse = require(path.join(parserDir, 'mcpParse'));
const p = mcpParse();

p.parseArchive('example', function(result) {
  if (!result || !result.matches || result.matches.length === 0) {
    console.error('No matches parsed');
    process.exit(1);
  }

  console.log(`\nParsed ${result.matches.length} matches`);

  const fixtures = [];

  result.matches.forEach((m, idx) => {
    const match = m.match;
    const tournament = m.tournament;
    const players = match.players();
    const points = match.points();
    const sets = match.sets();
    const score = match.score();

    const playerNames = players.map((pl, i) => {
      if (typeof pl === 'string') return pl;
      if (pl && pl.name) return pl.name;
      return `Player ${i}`;
    });

    console.log(`Match ${idx + 1}: ${playerNames[0]} vs ${playerNames[1]} (${points.length} points)`);

    // Log first point structure
    if (idx === 0 && points.length > 0) {
      console.log('  Sample point:', JSON.stringify(points[0], null, 2));
    }

    // Extract point data
    const fixturePoints = points.map((pt, ptIdx) => ({
      index: ptIdx,
      set: pt.set,
      game: pt.game,
      score: pt.score,
      server: pt.server,
      winner: pt.winner,
      result: pt.result || 'Unknown',
      error: pt.error || null,
      serves: pt.serves || [],
      rally: pt.rally || [],
      rallyLength: pt.rally ? pt.rally.length : 0,
      totalShots: (pt.serves ? pt.serves.length : 0) + (pt.rally ? pt.rally.length : 0),
      breakpoint: pt.breakpoint !== undefined ? pt.breakpoint : null,
      gamepoint: pt.gamepoint !== undefined ? pt.gamepoint : null,
      tiebreak: pt.tiebreak || false,
      code: pt.code || '',
    }));

    // Extract set scores
    let setScores;
    try {
      setScores = sets.map(s => {
        const g = typeof s.games === 'function' ? s.games() : s.games;
        return {
          games: g,
          winner: s.winner !== undefined ? s.winner : undefined,
        };
      });
    } catch (e) {
      setScores = [];
    }

    // Extract score info
    let scoreInfo;
    try {
      scoreInfo = typeof score === 'object' ? score : { raw: String(score) };
    } catch (e) {
      scoreInfo = {};
    }

    fixtures.push({
      matchId: idx,
      players: playerNames,
      tournament: {
        name: tournament.name || '',
        division: tournament.division || '',
        date: tournament.date ? tournament.date.toISOString() : null,
        tour: tournament.tour || '',
      },
      score: scoreInfo,
      sets: setScores,
      points: fixturePoints,
      totalPoints: fixturePoints.length,
    });
  });

  // Write fixture file
  const outDir = path.resolve(__dirname, '../src/visualizations/standalone/data');
  const outPath = path.join(outDir, 'mcpFixtures.json');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(fixtures, null, 2));
  console.log(`\nWrote ${fixtures.length} matches to ${outPath}`);
  console.log(`File size: ${(fs.statSync(outPath).size / 1024).toFixed(1)} KB`);
});
