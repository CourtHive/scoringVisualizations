# scoringVisualizations Migration Guide

**Migration version:** 0.2.0 (from 0.1.x)

This document covers all breaking changes, naming modernization, D3 v7 migration,
and the unified data strategy for brush-driven visualizations.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Option Name Renames (snake_case to camelCase)](#2-option-name-renames)
3. [Event Type Renames](#3-event-type-renames)
4. [Unified Data Strategy](#4-unified-data-strategy)
5. [API Pattern Changes](#5-api-pattern-changes)
6. [Statistics Migration](#6-statistics-migration)
7. [D3 v7 Migration (Internal)](#7-d3-v7-migration)
8. [Per-Chart Migration](#8-per-chart-migration)
9. [hive-eye-tracker Code Changes](#9-hive-eye-tracker-code-changes)
10. [Removed / Relocated Utilities](#10-removed--relocated-utilities)

---

## 1. Overview

### What changed and why

- **All option/attribute names** are now camelCase (was mixed snake_case)
- **Statistics** are now computed by `tods-competition-factory` (single source of truth)
- **Data strategy** is unified: all visualizations accept `Episode[]` and can participate
  in brush-based filtering via a shared extent
- **Direct-function charts** (`coronaChart`, `simpleChart`) are wrapped in the factory
  pattern so they can participate in brush filtering and dashboard orchestration
- **D3 v7 `.join()` pattern** used consistently (replaces `.enter().merge()`)
- **Pure utility functions** extracted to shared modules
- **`@ts-nocheck` files** removed; proper types added

### Versioning approach

The 0.2.0 release is a breaking change. All renames happen in a single release.
There is no deprecation period for 0.1.x option names since hive-eye-tracker is
the only consumer and is co-located.

---

## 2. Option Name Renames

### Global renames (used across multiple charts)

| Old (snake_case)  | New (camelCase)  | Charts affected                                                                            |
| ----------------- | ---------------- | ------------------------------------------------------------------------------------------ |
| `transition_time` | `transitionTime` | statView, ptsHorizon, horizonChart, momentumChart, ptsChart, gameFish, gameTree, rallyTree |
| `sizeToFit`       | `sizeToFit`      | _(no change — already camelCase)_                                                          |
| `show_images`     | `showImages`     | gameTree, momentumChart, gameFish                                                          |
| `cell_size`       | `cellSize`       | momentumChart, gameFish                                                                    |
| `min_cell_size`   | `minCellSize`    | momentumChart, gameFish                                                                    |
| `max_cell_size`   | `maxCellSize`    | momentumChart, gameFish                                                                    |
| `max_rally`       | `maxRally`       | gameFish                                                                                   |
| `point_score`     | `pointScore`     | gameFish                                                                                   |

### ptsChart / ptsMatch renames

| Old                  | New                 |
| -------------------- | ------------------- |
| `max_height`         | `maxHeight`         |
| `max_width_points`   | `maxWidthPoints`    |
| `point_highlighting` | `pointHighlighting` |
| `point_opacity`      | `pointOpacity`      |
| `win_err_highlight`  | `winErrHighlight`   |
| `game_highlighting`  | `gameHighlighting`  |
| `game_opacity`       | `gameOpacity`       |
| `game_boundaries`    | `gameBoundaries`    |
| `font_size`          | `fontSize`          |
| `font_weight`        | `fontWeight`        |
| `average_points`     | `averagePoints`     |

### gameTree renames

| Old       | New      |
| --------- | -------- |
| `min_max` | `minMax` |

### coronaChart renames

| Old           | New          |
| ------------- | ------------ |
| `click_name`  | `clickName`  |
| `click_score` | `clickScore` |
| `games_score` | `gamesScore` |
| `p2sdiff`     | `p2sDiff`    |

### momentumChart renames

| Old              | New             |
| ---------------- | --------------- | ------------- |
| `momentum_score` | `momentumScore` |
| `fullWidth`      | `fullWidth`     | _(no change)_ |
| `fullHeight`     | `fullHeight`    | _(no change)_ |

### groupGames (internal utility) renames

| Old            | New           |
| -------------- | ------------- |
| `last_game`    | `lastGame`    |
| `game_counter` | `gameCounter` |
| `current_game` | `currentGame` |

---

## 3. Event Type Renames

### PtsChartEvents

```typescript
// Old
interface PtsChartEvents {
  update: { begin; end };
  set_box: { mouseover; mouseout };
  point_bars: { mouseover; mouseout; click };
}

// New
interface PtsChartEvents {
  update: { begin; end };
  setBox: { mouseover; mouseout };
  pointBars: { mouseover; mouseout; click };
}
```

### Other event interfaces

`GameFishEvents`, `GameTreeEvents`, `MomentumChartEvents` — no snake_case keys
(already use camelCase like `leftImage`, `rightImage`). No changes needed.

---

## 4. Unified Data Strategy

### Problem

Currently each visualization has its own data expectations:

- `ptsMatch`, `gameTree`, `momentumChart`, `rallyTree` accept `Episode[]`
- `gameFish` accepts `game.points` (a subset)
- `coronaChart` accepts a `set_map` structure
- `simpleChart` accepts raw point arrays
- `statView` accepts `StatObject[]` or computes internally via `.matchUp()`

This means brush filtering in `matchDashboard` can only filter charts that accept
`Episode[]`. Charts using other data shapes are excluded.

### Solution: Episode[] as universal currency

All visualizations accept `Episode[]` via `.data(episodes)`. Each chart internally
extracts what it needs:

| Chart               | Receives    | Internally extracts                                                                         |
| ------------------- | ----------- | ------------------------------------------------------------------------------------------- |
| ptsMatch / ptsChart | `Episode[]` | Point timeline per set _(unchanged)_                                                        |
| gameTree            | `Episode[]` | Point tree structure _(unchanged)_                                                          |
| momentumChart       | `Episode[]` | Delegates to gameFish sub-instances _(unchanged)_                                           |
| rallyTree           | `Episode[]` | Rally length distribution _(unchanged)_                                                     |
| gameFish            | `Episode[]` | **Changed:** was `game.points`, now filters episodes to single game internally              |
| coronaChart         | `Episode[]` | **Changed:** builds set_map from episodes internally                                        |
| simpleChart         | `Episode[]` | **Changed:** was raw arrays, now extracts point diffs internally                            |
| statView            | `Episode[]` | **Changed:** was `StatObject[]` via `.data()`, now computes stats from episodes via factory |

### Brush filtering protocol

When a brush extent is active (from `ptsHorizon` or any brush-enabled chart), the
`matchDashboard` orchestrator filters the master `Episode[]` to the brush range and
calls `.data(filteredEpisodes).update()` on every child chart.

```typescript
// matchDashboard brush callback
function onBrush(extent: [number, number]) {
  const filtered = allEpisodes.filter(
    (ep) => ep.point.index >= extent[0] && ep.point.index <= extent[1],
  );
  for (const chart of childCharts) {
    chart.data(filtered).update();
  }
}
```

### gameFish single-game view

For the game detail view (clicking a game in momentumChart), use the new
`.gameFilter(gameIndex)` accessor instead of passing pre-filtered data:

```typescript
// Old
charts.gamefish.data(game.points).update();

// New
charts.gamefish.data(episodes).gameFilter(gameIndex).update();
```

Or, since momentumChart internally manages gameFish sub-instances, the game
filtering happens automatically.

### coronaChart migration

`coronaChart` is wrapped in the factory pattern. The `set_map` is now built
internally from episodes:

```typescript
// Old — direct function call
coronaChart(svgSelection, setMapData, prefs);

// New — factory pattern
const corona = coronaChart();
corona.options({ colors: ["#a55194", "#6b6ecf"] });
d3.select("#corona").call(corona);
corona.data(episodes).update();
```

The companion function `coronaChartFromMatchUp(matchUp)` continues to work
as a convenience for standalone usage.

---

## 5. API Pattern Changes

### All charts use the factory pattern

Every visualization now follows the same closure-based factory pattern:

```typescript
const chart = chartFactory();
chart.options({ ... });
chart.events({ ... });
d3.select('#container').call(chart);
chart.data(episodes).update();
```

### Accessor consistency

Every chart now supports these standard accessors:

| Accessor           | Behavior                     | Notes                                                     |
| ------------------ | ---------------------------- | --------------------------------------------------------- |
| `.data(episodes?)` | Get/set episode data         | Universal; returns chart for chaining                     |
| `.options(opts?)`  | Get/set options (deep merge) | Uses `keyWalk`                                            |
| `.events(fns?)`    | Get/set event callbacks      |                                                           |
| `.update(opts?)`   | Re-render with current data  | Optional inline options                                   |
| `.width(w?)`       | Get/set width                |                                                           |
| `.height(h?)`      | Get/set height               |                                                           |
| `.colors(c?)`      | Get/set player colors        |                                                           |
| `.matchUp(state?)` | Set data from matchUp state  | Convenience; calls `buildEpisodes` + `.data()` internally |

### Typed options

Each chart now exports an options interface:

```typescript
import {
  gameTree,
  type GameTreeOptions,
} from "@tennisvisuals/scoring-visualizations";

const tree = gameTree();
const opts: Partial<GameTreeOptions> = {
  display: { sizeToFit: true, showImages: false },
  nodes: { colors: { 0: "#a55194", 1: "#6b6ecf", neutral: "#ecf0f1" } },
};
tree.options(opts);
```

---

## 6. Statistics Migration

Statistics are now computed by `tods-competition-factory`'s scoring engine.

### What changed

- `computeMatchStats(episodes)` and `computeMatchStatsFromMatchUp(matchUp)` still
  work with the same signatures and return the same `StatObject[]` shape
- The implementation delegates to factory's `calculateMatchStatistics()` + `toStatObjects()`
- The `StatObject` type is now defined in and re-exported from `tods-competition-factory`

### hive-eye-tracker impact

The `updateStats.ts` file calls `computeMatchStatsFromMatchUp()` — this continues
to work with no code changes. The return shape is identical.

If you want to access factory's richer statistics (set filtering, stroke breakdown):

```typescript
import { scoreGovernor } from "tods-competition-factory";
const { calculateMatchStatistics, toStatObjects } = scoreGovernor;

// Full statistics with set filter
const stats = calculateMatchStatistics(matchUp, points, { setFilter: 0 });
const statObjects = toStatObjects(stats);

// Or via ScoringEngine directly
const stats = engine.getStatObjects({ setFilter: 0 });
```

---

## 7. D3 v7 Migration

This is an internal change within scoringVisualizations. No consumer API impact.

### What has changed

All `.enter().append().merge()` patterns replaced with `.join()`:

```typescript
// Old
const sel = g.selectAll("rect").data(data);
sel.exit().remove();
sel
  .enter()
  .append("rect")
  .merge(sel)
  .attr("width", (d) => d.value);

// New
g.selectAll("rect")
  .data(data)
  .join("rect")
  .attr("width", (d) => d.value);
```

### Charts migrated

| Chart        | Was                | Now                        |
| ------------ | ------------------ | -------------------------- |
| statView     | `.enter().merge()` | `.join()`                  |
| gameFish     | `.enter().merge()` | `.join()`                  |
| gameTree     | Mixed              | `.join()`                  |
| ptsChart     | Mixed              | `.join()`                  |
| horizonChart | Mixed              | `.join()`                  |
| rallyTree    | `.join()`          | `.join()` _(already done)_ |

---

## 8. Per-Chart Migration

### statView

```typescript
// Old options
{ display: { transition_time: 300, sizeToFit: { width: true, height: false } } }

// New options
{ display: { transitionTime: 300, sizeToFit: { width: true, height: false } } }
```

Data: now accepts `Episode[]` via `.data()` (computes stats internally).
The `.matchUp()` accessor still works as a convenience.

### gameTree

```typescript
// Old options
{
  min_max: 20,
  display: { show_images: false, leftImg: false, rightImg: false }
}

// New options
{
  minMax: 20,
  display: { showImages: false, leftImg: false, rightImg: false }
}
```

### momentumChart

```typescript
// Old options
{
  fish: { cell_size: undefined, min_cell_size: 5, max_cell_size: 10 },
  display: { show_images: undefined, transition_time: 0, momentum_score: true }
}

// New options
{
  fish: { cellSize: undefined, minCellSize: 5, maxCellSize: 10 },
  display: { showImages: undefined, transitionTime: 0, momentumScore: true }
}
```

### gameFish

```typescript
// Old options
{
  fish: { cell_size: 20, min_cell_size: 5, max_cell_size: 20, max_rally: undefined },
  display: { transition_time: 0, show_images: undefined, point_score: true }
}

// New options
{
  fish: { cellSize: 20, minCellSize: 5, maxCellSize: 20, maxRally: undefined },
  display: { transitionTime: 0, showImages: undefined, pointScore: true }
}
```

Data: now accepts `Episode[]` instead of `game.points`. Use `.gameFilter(index)`
for single-game views.

### ptsMatch / ptsChart

```typescript
// Old options
{
  max_height: 100,
  points: { max_width_points: 100 },
  score: { font_size: '12px', font_weight: 'bold' },
  header: { font_size: '14px', font_weight: 'bold' },
  display: {
    transition_time: 0,
    point_highlighting: true,
    point_opacity: 0.4,
    win_err_highlight: true,
    game_highlighting: true,
    game_opacity: 0.2,
    game_boundaries: true
  }
}

// New options
{
  maxHeight: 100,
  points: { maxWidthPoints: 100 },
  score: { fontSize: '12px', fontWeight: 'bold' },
  header: { fontSize: '14px', fontWeight: 'bold' },
  display: {
    transitionTime: 0,
    pointHighlighting: true,
    pointOpacity: 0.4,
    winErrHighlight: true,
    gameHighlighting: true,
    gameOpacity: 0.2,
    gameBoundaries: true
  }
}
```

### ptsHorizon / horizonChart

```typescript
// Old options
{ display: { transition_time: 0 }, bounds: { vRangeMax: 24 } }

// New options
{ display: { transitionTime: 0 }, bounds: { vRangeMax: 24 } }
```

### coronaChart

Now a factory chart (was direct function). See [Section 4](#coronachart-migration)
for the new API.

### simpleChart

Now a factory chart (was direct function):

```typescript
// Old — direct function call
simpleChart("#target", pointData, playerNames);

// New — factory pattern
const chart = simpleChart();
chart.options({ players: playerNames });
d3.select("#target").call(chart);
chart.data(episodes).update();
```

The companion `simpleChartFromMatchUp()` continues to work for one-off renders.

### rallyTree

```typescript
// Old options (no snake_case issues)
{ display: { sizeToFit: false }, orientation: 'horizontal' }

// New options (unchanged)
{ display: { sizeToFit: false }, orientation: 'horizontal' }
```

### matchDashboard

No option renames. Sub-chart options flow through to children.

---

## 9. hive-eye-tracker Code Changes

### `src/display/configureViz.ts`

**momentumChart configuration:**

```typescript
// Old
charts.mc.options({
  display: {
    transition_time: 0,
    // ...
  },
});

// New
charts.mc.options({
  display: {
    transitionTime: 0,
    // ...
  },
});
```

**gameFish showGame:**

```typescript
// Old
charts.gamefish.options({
  fish: { gridcells, cell_size: 20 },
  display: { reverse: env.swap_sides },
});
charts.gamefish.data(game.points).update();

// New
charts.gamefish.options({
  fish: { gridcells, cellSize: 20 },
  display: { reverse: env.swap_sides },
});
charts.gamefish.data(getEpisodes()).gameFilter(game.index).update();
```

**ptsMatch:** No option changes needed (only uses `sizeToFit` which is already camelCase).

**gameTree:** No option changes needed for hive-eye-tracker's current usage
(only uses `sizeToFit`, `noAd`, node/line colors — all already camelCase).

### `src/match/updateStats.ts`

**simpleChart:**

```typescript
// Old — direct function
simpleChart(chart.target, player_points);

// New — factory pattern (if migrated), OR keep using companion function
simpleChartFromMatchUp(chart.target, matchUpState);
```

No changes needed for `computeMatchStatsFromMatchUp` — API is unchanged.

### `src/state/env.ts`

No changes needed. `buildEpisodes()` API is unchanged.

### `src/visualizations/index.ts`

No changes needed. Re-exports are the same.

---

## 10. Removed / Relocated Utilities

### Extracted to shared modules

| Function                                        | Old location                 | New location          |
| ----------------------------------------------- | ---------------------------- | --------------------- |
| `shadeColor2`                                   | gameTree.ts (line 15)        | `utils/colorUtils.ts` |
| `shadeRGBColor`                                 | gameTree.ts (line 58)        | `utils/colorUtils.ts` |
| `blendColors`                                   | gameTree.ts (line 36)        | `utils/colorUtils.ts` |
| `blendRGBColors`                                | gameTree.ts (line 77)        | `utils/colorUtils.ts` |
| `colorShade`                                    | gameTree.ts (line 94)        | `utils/colorUtils.ts` |
| `getHexColor`                                   | gameTree.ts (line 106)       | `utils/colorUtils.ts` |
| `applyMax`, `applyMin`                          | gameTree.ts (lines 121-127)  | `utils/math.ts`       |
| `sum`, `createRanges`, `sliceData`, `indicesOf` | coronaChart.ts (lines 13-49) | `utils/arrays.ts`     |

### Removed

| File        | Reason                                                  |
| ----------- | ------------------------------------------------------- |
| `typeOf.ts` | Replaced with native checks (`typeof`, `Array.isArray`) |
| `setDev.ts` | Development-only; moved to storybook helpers            |

### `@ts-nocheck` removed

| File            | Change                                             |
| --------------- | -------------------------------------------------- |
| `groupGames.ts` | Properly typed; internal variable names camelCased |
| `typeOf.ts`     | Removed (see above)                                |
| `setDev.ts`     | Relocated (see above)                              |

---

## Quick Reference: Complete Rename Map

For search-and-replace across hive-eye-tracker:

```text
transition_time  →  transitionTime
show_images      →  showImages
cell_size        →  cellSize
min_cell_size    →  minCellSize
max_cell_size    →  maxCellSize
max_rally        →  maxRally
point_score      →  pointScore
max_height       →  maxHeight
max_width_points →  maxWidthPoints
point_highlighting → pointHighlighting
point_opacity    →  pointOpacity
win_err_highlight → winErrHighlight
game_highlighting → gameHighlighting
game_opacity     →  gameOpacity
game_boundaries  →  gameBoundaries
font_size        →  fontSize
font_weight      →  fontWeight
average_points   →  averagePoints
min_max          →  minMax
click_name       →  clickName
click_score      →  clickScore
games_score      →  gamesScore
p2sdiff          →  p2sDiff
momentum_score   →  momentumScore
set_box          →  setBox
point_bars       →  pointBars
```
