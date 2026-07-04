# @courthive/scoring-visualizations

Standalone scoring visualizations for tennis match data. Transforms [TODS](https://itftennis.atlassian.net/wiki/spaces/TODS/overview) match data (via the [Competition Factory](https://courthive.github.io/competition-factory/) `ScoringEngine`) into episode sequences and renders interactive D3 charts — GameTree, Momentum, PTS, GameFish, Corona, rally trees, stat panels, and dashboards — plus parsers/validators for third-party match feeds (ProTracker `.ptf` files and IONSport JSON) and a factory-backed statistics adapter.

Part of the [CourtHive](https://github.com/CourtHive) ecosystem. Consumed by `epixodic` (point-by-point match tracker) and `competition-factory-server`.

## Install

```bash
pnpm add @courthive/scoring-visualizations
```

`tods-competition-factory` (>=5.0.0) is a peer dependency and must be installed alongside. `d3` and `tippy.js` are bundled dependencies.

## Rendering patterns

Most charts follow the **D3 reusable-chart closure pattern**: call the factory (e.g. `gameTree()`) to get a configurable `chart` function, feed it data via chained accessors, then mount it into a container with a D3 selection:

```typescript
import { select } from 'd3';
import { gameTree, buildEpisodes } from '@courthive/scoring-visualizations';

const chart = gameTree();
chart.options({ display: { sizeToFit: true } });
chart.players(['Federer', 'Djokovic']);
chart.data(buildEpisodes(matchUp)); // or chart.matchUp(matchUp)

select(container).call(chart);
chart.update();
```

Charts that expose a `.matchUp(matchUpState)` accessor can be driven directly from live `ScoringEngine` state — pair them with `LiveEngine` for reactive updates.

Several charts also ship a `*FromMatchUp` convenience wrapper (and `coronaChart` / `donutChart` / `simpleChart` render directly) that take a DOM element and a MatchUp and render in one call, sizing to the container.

## API reference

### Episodes

The episode array is the common intermediate representation consumed by every chart and the statistics adapter.

#### `buildEpisodes(matchUp): Episode[]`

Transforms a `ScoringEngine` MatchUp (from `getState()`) into an ordered `Episode[]`, one entry per point played. Each `Episode` carries point, game, set, and "needed" (points/games remaining) sub-objects. Returns `[]` when the MatchUp has no point history.

Exported types: `Episode`, `EpisodePoint`, `EpisodeGame`, `EpisodeSet`, `EpisodeNeeded`.

```typescript
import { buildEpisodes } from '@courthive/scoring-visualizations';

const episodes = buildEpisodes(scoringEngine.getState());
```

### Charts

Reusable-chart closures (call, configure, mount). All accept episode data via `.data(episodes)` and most accept live state via `.matchUp(matchUpState)`:

#### `gameTree()`
Sankey-style point-progression tree for game scoring. Accessors: `.options()`, `.events()`, `.data()`, `.players()`, `.matchUp()`, `.width()`, `.height()`, `.reset()`, `.counters()`, `.exports()`, `.update()`.

#### `momentumChart()`
Vertical/horizontal momentum ribbon (game-fish "school") across the match.

#### `gameFish()`
Single-game "fish" cell grid visualizing point-by-point flow within a game.

#### `rallyTree()`
Rally-length tree. Accessors include `.data()` and `.matchUp()`.

#### `ptsHorizon()`
Compact horizon band of the point-score differential timeline; supports a brush for range selection (used to coordinate the dashboard).

#### `ptsMatch()`
Full point-timeline-series (PTS) match chart.

#### `horizonChart()`
Generic horizon-band chart primitive.

#### `statView()`
Statistics panel rendered from `StatObject[]` (or `.matchUp()` state).

#### `matchUpDashboard()`
Cross-visualization coordination layer — CSS-grid layout combining `ptsHorizon`, `coronaChart`, `statView`, `gameTree`, and `rallyTree`, with `ptsHorizon` brush events filtering all sub-charts simultaneously. Configurable via `.options({ colors, players, display })`.

Direct-render charts (call with a target element + data):

#### `coronaChart(target, setMap, prefs, x?, y?): void`
Radial/circular point-differential chart. `target` is a D3 selection, `setMap` is a `SetMap[]` (see `buildSetMap`), `prefs` configures dimensions/colors/display. `x` and `y` default to `0`.

#### `coronaChartFromMatchUp(container, matchUp, options?): void`
Convenience wrapper: takes an `HTMLElement` and a MatchUp, auto-sizes to the container. `options` supports `width`, `height`, `radius`, `colors`, `players`, `display`.

#### `ptsHorizonFromMatchUp(container, matchUp, options?): void`
Convenience wrapper for `ptsHorizon`. `options` supports `width`, `height`, `bands`, `mode` (`'mirror' | 'offset'`), `colors`, `players`, `showBrush`.

#### `simpleChart(target, data, playerNames?): void`
Minimal chart primitive. `simpleChartFromMatchUp(target, matchUp, playerNames?)` renders from a MatchUp.

#### `donutChart(target, data, options?): void`
Match-competitiveness donut from `DonutDatum[]`. `donutChartFromMatchUps(target, matchUps, options?)` aggregates first via `aggregateMatchUps(matchUps): DonutDatum[]`. Types: `DonutChartOptions`, `DonutDatum`, `CompetitivenessBucket` (`'COMPETITIVE' | 'ROUTINE' | 'DECISIVE' | 'WALKOVER'`).

Chart event types: `PtsChartEvents`, `GameFishEvents`, `GameTreeEvents`, `MomentumChartEvents`.

```typescript
import { select } from 'd3';
import { coronaChartFromMatchUp, momentumChart, buildEpisodes } from '@courthive/scoring-visualizations';

// Direct one-call render
coronaChartFromMatchUp(document.getElementById('corona'), matchUp, {
  players: ['Federer', 'Djokovic'],
});

// Reusable-chart pattern
const chart = momentumChart();
chart.data(buildEpisodes(matchUp));
select('#momentum').call(chart);
chart.update();
```

### Engines

#### `class LiveEngine`
Reactive pub/sub wrapper around the factory `ScoringEngine`. Every mutation notifies subscribers with fresh `getState()`.

- `new LiveEngine(engine?)` — wraps a provided engine or creates one (`SET3-S:6/TB7`).
- `subscribe(cb: (matchUp) => void): () => void` — returns an unsubscribe function.
- Mutations (notify): `addPoint({ winner, server?, result?, rallyLength? })`, `undo(count?)`, `redo(count?)`, `editPoint(pointIndex, newData, options?)`, `reset()`.
- Queries (no notify): `getState()`, `canUndo()`, `canRedo()`, `isComplete()`, `getPointCount()`, `getScoreboard()`.

#### `createPlaybackEngine(options): PlaybackControls`
Incrementally feeds MCP fixture points into a `LiveEngine` — auto-play with configurable delay, step forward/back, pause, reset. `options`: `matchIndex?` (default `0`), `delayMs?` (default `200`), `onComplete?`. Returns `PlaybackControls`: `{ liveEngine, start(), pause(), stepForward(), stepBack(), reset(), isPlaying(), getProgress(), getFixture(), destroy() }`.

```typescript
import { select } from 'd3';
import { createPlaybackEngine, gameTree } from '@courthive/scoring-visualizations';

const chart = gameTree();
const playback = createPlaybackEngine({ matchIndex: 0, delayMs: 200 });

playback.liveEngine.subscribe((matchUp) => {
  chart.matchUp(matchUp);
  chart.update();
});

select('#chart').call(chart);
playback.start();
```

#### ScoringEngine fixtures & extractors

- `feedMatchUp(matchIndex = 0): any` — builds a MatchUp by feeding a bundled MCP fixture through a `ScoringEngine`.
- `feedAllMatchUps(): any[]` — all bundled fixtures fed to completion.
- `getMcpFixture(matchIndex = 0): McpFixture` — raw fixture (players, points).
- `extractRallyLengths(matchUp): number[][]`
- `extractGamePoints(matchUp, setIdx = 0, gameIdx = 0): any[]`

#### `buildSetMap(matchUp, players?): SetMap[]`
Derives per-set point-differential data (`p2sdiff`, `gamesScore`, `players`, `winnerIndex`) used by `coronaChart`. `players` defaults to `['Player 1', 'Player 2']`. Type: `SetMap`.

### Parsers & Validators

Parse and validate third-party match feeds into factory-compatible structures.

ProTracker (`.ptf`, UTF-16LE):

- `validateProTrackerMatch(options): ProTrackerValidationResult` — `options`: `{ content, matchUpFormat?, debug? }`.
- `validateProTrackerBuffer(buffer, options?): ProTrackerValidationResult` — decodes an `ArrayBuffer`, then validates.
- `parsePTFContent(...)`, `parsePTFPoint(...)`, `mapPTFFormat(...)`, `classifyResult(...)`, `mapServeLocation(...)`, `decodeUTF16LE(...)`, `splitPTFRows(...)`.

IONSport (JSON):

- `parseIONSportMatch(jsonData): ParsedIONSportMatch` — parses a raw IONSport match object.
- `validateIONSportMatch(options): IONSportValidationResult` — `options`: `{ jsonData, debug? }`.
- `parseIONSportPoint(...)`, `mapIONSportFormat(ionFormat: string): string` (maps to a factory `matchUpFormat`, default `SET3-S:6/TB7`), `isTimedFormat(matchFormat: string): boolean`, `extractPlayersFromSide(...)`, `extractPlayers(...)`, `buildSubstitutionEvents(courtTimeLog): SubstitutionInfo[]`.

Exported types: `PointResult`, `StrokeType`, `ServeLocation`, `RallyShot`, `ProTrackerValidationResult`, `ProTrackerValidationOptions`, `IONSportValidationResult`, `IONSportValidationOptions`, `PTFMatch`, `ParsedPTFPoint`, `ParsedIONSportMatch`, `PlayerInfo`, `SubstitutionInfo`.

```typescript
import { validateProTrackerBuffer, parseIONSportMatch } from '@courthive/scoring-visualizations';

const result = validateProTrackerBuffer(arrayBuffer, { matchUpFormat: 'SET3-S:6/TB7' });
if (result.valid) {
  /* result.errors / result.warnings otherwise */
}

const parsed = parseIONSportMatch(ionSportJson);
```

### Statistics

#### `computeMatchStats(episodes, setFilter?): StatObject[]`
Computes display-ready match statistics from an `Episode[]`, delegating calculation to `tods-competition-factory`. `setFilter` (0-based) restricts stats to a single set; omit for the whole match.

#### `computeMatchStatsFromMatchUp(matchUp, setFilter?): StatObject[]`
Convenience wrapper — runs `buildEpisodes` then `computeMatchStats`.

Type: `StatObject` (re-exported from the factory).

```typescript
import { computeMatchStatsFromMatchUp, statView } from '@courthive/scoring-visualizations';
import { select } from 'd3';

const stats = computeMatchStatsFromMatchUp(matchUp);
const panel = statView();
panel.data(stats);
select('#stats').call(panel);
panel.update();
```

### Utilities & helpers

- `supportsGameVisualizations(matchUpFormat): boolean` — whether a format has traditional game scoring (required by GameTree/GameFish/etc.).
- `supportsPointsToVisualization(matchUpFormat): boolean` — whether a format exposes points-to-win data.
- `createFileDropzone(options): HTMLElement` — drag-and-drop widget for loading `.ptf`/JSON match files. `options`: `{ onPTFFile, onJSONFile, onError }`. Type: `FileDropzoneOptions`.

## Architecture

```
ScoringEngine MatchUp (TODS)          Third-party feeds (.ptf / IONSport JSON)
        │                                          │
        │  buildEpisodes()          parse* / validate* / map*Format()
        ▼                                          ▼
   Episode[]  ◄────────────────────────  factory-compatible match data
        │
        ├─► D3 charts (gameTree, momentum, gameFish, ptsHorizon, corona, rallyTree, statView, dashboard)
        └─► computeMatchStats() → StatObject[] → statView
```

The `Episode[]` array is the pivot between data and presentation: `buildEpisodes` turns engine state into episodes, charts render episodes, and `computeMatchStats` derives statistics from them. `LiveEngine` closes the loop for interactive/live scoring by pushing fresh state to subscribed charts on every mutation.

### Source layout

```
src/
  index.ts          Public API exports
  episodes/         Episode transform (buildEpisodes + types)
  engine/           LiveEngine, playback, feedMatchUp fixtures, buildSetMap
  parsers/          ProTracker + IONSport parsers and validators
  statistics/       Factory-backed match statistics adapter
  utils/            Format-support helpers
  visualizations/   D3 chart implementations + Storybook stories + helpers
```

Vite library mode outputs ES and UMD bundles to `dist/`; TypeScript declarations are emitted via `tsc --emitDeclarationOnly`.

## Development

```bash
pnpm install
pnpm build            # Vite library build → dist/
pnpm build:types      # Emit .d.ts declarations only
pnpm test             # Vitest single run
pnpm test:watch       # Vitest watch mode
pnpm lint             # ESLint on src/
pnpm storybook        # Storybook dev server on :6006
pnpm build-storybook  # Build static Storybook
```

Storybook (11 stories across the chart set, with live-playback and format-awareness demos) is the primary surface for visual development and testing — run `pnpm storybook` and open <http://localhost:6006>.

### Key dependencies

| Package | Purpose |
| --- | --- |
| `d3` | Charting / SVG rendering |
| `tippy.js` | Tooltips for interactive elements |
| `tods-competition-factory` | TODS types, `ScoringEngine`, and statistics (peer dependency) |

## License

MIT
