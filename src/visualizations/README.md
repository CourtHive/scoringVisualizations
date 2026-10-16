# Visualizations

The D3 v7 charts this package publishes. Each chart is one flat file here, with a Storybook story beside it
(`<chart>.stories.ts`); there are no per-chart subdirectories. The barrel is `index.ts`.

## Charts

| Export | File | Shows |
|---|---|---|
| `ptsMatch` | `ptsChart.ts` | points-to-set across a match: sets, game boundaries, breakpoints |
| `ptsHorizon`, `ptsHorizonFromMatchUp` | `ptsHorizon.ts` | the same progression as a horizon band |
| `gameTree` | `gameTree.ts` | score paths through a game; line width is frequency |
| `gameFish` | `gameFish.ts` | one game point by point: server, rally length, result |
| `momentumChart` | `momentumChart.ts` | game fish laid out across a match |
| `coronaChart`, `coronaChartFromMatchUp` | `coronaChart.ts` | radial score differential per set |
| `rallyTree` | `rallyTree.ts` | rally length distribution by player and outcome |
| `statView` | `statView.ts` | match statistics (from the factory's computations) |
| `horizonChart`, `simpleChart` | `horizonChart.ts`, `simpleChart.ts` | generic building blocks |
| `matchUpDashboard` | `matchUpDashboard.ts` | ptsHorizon, corona, statView, gameTree and rallyTree in one grid |

## Feeding a chart

The charts follow the D3 reusable-chart pattern: build with the factory function, configure with `.options()`,
attach with `select(container).call(chart)`, then `.update()`.

Most charts take a CODES matchUp from the factory's `ScoringEngine` directly: `chart.matchUp(engine.getState())`.
Its `history.points` are turned into `Episode[]` by `buildEpisodes` (`../episodes/buildEpisodes.ts`). `.data()`
takes the already-built shape (`Episode[]`, `Point[]`) instead, which is what the stories and the dashboard's
brush filter use.

## Lifetime

A chart can own resources outside its container. Removing the container does not release them, so call
`destroy()` when the chart goes away:

- `rallyTree().destroy()` destroys its tooltips (appended to `document.body`), removes the stat bar's listener and
  interrupts running transitions.
- `matchUpDashboard().destroy()` cancels a pending render frame and destroys its rallyTree. An `update()` after
  `destroy()` does nothing.

Both are idempotent.

## Sample data

`data/sampleGame.ts` exports single games (`sampleGamePoints`, `deuceGamePoints`, `tiebreakGamePoints`), their
game groups, and `pointsToEpisodes`. Most stories instead replay a match through the playback engine
(`../engine/createPlaybackEngine.ts`, `../engine/feedMatchUp.ts`).

## Type checking

Several renderers (`gameTree`, `ptsChart`, `momentumChart`, `rallyTree`, `coronaChart`, `horizonChart` among them)
start with `/* eslint-disable */` and `// @ts-nocheck`. The package's strict compiler settings therefore do not
cover those files. Remove the suppressions one file at a time, with a browser assertion for each.
