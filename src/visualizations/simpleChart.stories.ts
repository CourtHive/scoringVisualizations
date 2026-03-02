import type { Meta, StoryObj } from '@storybook/html';
import { simpleChart, simpleChartFromMatchUp } from './simpleChart';
import { feedMatchUp, extractRallyLengths, getMcpFixture } from '../engine/feedMatchUp';
import { createPlaybackEngine } from '../engine/createPlaybackEngine';
import { createPlaybackControlsUI } from './helpers/PlaybackControls';

interface SimpleChartArgs {
  width: number;
  height: number;
  minPoints: number;
  matchIndex?: number;
  delayMs?: number;
}

/**
 * Simple Chart Visualization
 *
 * Displays rally lengths as a line chart comparing two players.
 * Each line represents rally lengths over the course of points.
 */
const meta: Meta<SimpleChartArgs> = {
  title: 'Visualizations/SimpleChart',
  tags: ['autodocs'],
  render: (_args) => {
    // Create container
    const container = document.createElement('div');
    container.id = 'simple-chart-container';
    container.style.width = '100%';
    container.style.height = '500px';
    container.style.padding = '20px';

    // Real MCP match data: Federer vs Djokovic
    const fixture = getMcpFixture(0);
    const matchUp = feedMatchUp(0);
    const data = extractRallyLengths(matchUp);

    // Render chart
    setTimeout(() => {
      simpleChart('simple-chart-container', data, fixture.players as [string, string]);
    }, 0);

    return container;
  },
  argTypes: {
    width: { control: { type: 'range', min: 300, max: 1200, step: 50 } },
    height: { control: { type: 'range', min: 200, max: 800, step: 50 } },
    minPoints: { control: { type: 'range', min: 10, max: 100, step: 10 } },
    matchIndex: {
      control: 'select',
      options: { 'Federer vs Djokovic': 0, 'Federer vs Wawrinka': 1, 'Djokovic vs Nadal': 2, 'Schwartzman vs Cervantes': 3 },
    },
    delayMs: { control: { type: 'range', min: 50, max: 2000, step: 50 } },
  },
};

export default meta;
type Story = StoryObj<SimpleChartArgs>;

/**
 * Default view with standard rally data
 */
export const Default: Story = {
  args: {
    width: 800,
    height: 400,
    minPoints: 50,
  },
};

/**
 * Short match with fewer points
 */
export const ShortMatch: Story = {
  args: {
    width: 800,
    height: 400,
    minPoints: 20,
  },
  render: () => {
    const container = document.createElement('div');
    container.id = 'simple-chart-short';
    container.style.width = '100%';
    container.style.height = '400px';
    container.style.padding = '20px';

    // Real MCP match data: Djokovic vs Nadal (shorter match, 99 points)
    const fixture = getMcpFixture(2);
    const matchUp = feedMatchUp(2);
    const data = extractRallyLengths(matchUp);

    setTimeout(() => {
      simpleChart('simple-chart-short', data, fixture.players as [string, string]);
    }, 0);

    return container;
  },
};

/**
 * Long rallies comparison
 */
export const LongRallies: Story = {
  args: {
    width: 800,
    height: 400,
    minPoints: 50,
  },
  render: () => {
    const container = document.createElement('div');
    container.id = 'simple-chart-long';
    container.style.width = '100%';
    container.style.height = '400px';
    container.style.padding = '20px';

    // Real MCP match data: Federer vs Wawrinka (127 points)
    const fixture = getMcpFixture(1);
    const matchUp = feedMatchUp(1);
    const data = extractRallyLengths(matchUp);

    setTimeout(() => {
      simpleChart('simple-chart-long', data, fixture.players as [string, string]);
    }, 0);

    return container;
  },
};

/**
 * Contrasting styles: One player with short rallies, one with long
 */
export const ContrastingStyles: Story = {
  render: () => {
    const container = document.createElement('div');
    container.id = 'simple-chart-contrast';
    container.style.width = '100%';
    container.style.height = '400px';
    container.style.padding = '20px';

    // Real MCP match data: Schwartzman vs Cervantes Huegun (135 points)
    const fixture = getMcpFixture(3);
    const matchUp = feedMatchUp(3);
    const data = extractRallyLengths(matchUp);

    setTimeout(() => {
      simpleChart('simple-chart-contrast', data, fixture.players as [string, string]);
    }, 0);

    return container;
  },
};

/**
 * Live Playback — Rally lengths update as points are added via the reactive LiveEngine.
 * simpleChart is a direct render function, so we clear and re-render on each update.
 */
export const LivePlayback: Story = {
  args: {
    width: 800,
    height: 400,
    minPoints: 50,
    matchIndex: 0,
    delayMs: 200,
  },
  render: (args: any) => {
    const container = document.createElement('div');

    const chartDiv = document.createElement('div');
    chartDiv.id = 'simple-chart-live';
    chartDiv.style.width = '100%';
    chartDiv.style.height = '500px';
    chartDiv.style.padding = '20px';

    const playback = createPlaybackEngine({
      matchIndex: args.matchIndex,
      delayMs: args.delayMs,
    });

    const names = playback.getFixture().players as [string, string];

    playback.liveEngine.subscribe((matchUp) => {
      simpleChartFromMatchUp('simple-chart-live', matchUp, names);
    });

    const controls = createPlaybackControlsUI(playback, { showScoreboard: true });
    container.appendChild(controls);
    container.appendChild(chartDiv);

    setTimeout(() => {
      playback.start();
    }, 0);

    return container;
  },
};

/**
 * Undo/Redo — Feed 20 points then interact.
 */
export const UndoRedo: Story = {
  args: { width: 800, height: 400, minPoints: 50, matchIndex: 0 },
  render: (args: any) => {
    const container = document.createElement('div');
    const chartId = 'simple-chart-undo';

    const chartDiv = document.createElement('div');
    chartDiv.id = chartId;
    chartDiv.style.cssText = 'width:100%; height:500px; padding:20px;';

    const playback = createPlaybackEngine({ matchIndex: args.matchIndex });
    for (let i = 0; i < 20; i++) playback.stepForward();

    const names = playback.getFixture().players as [string, string];

    playback.liveEngine.subscribe((matchUp) => {
      simpleChartFromMatchUp(chartId, matchUp, names);
    });

    const controls = createPlaybackControlsUI(playback, { showScoreboard: true });
    container.appendChild(controls);
    container.appendChild(chartDiv);

    setTimeout(() => {
      simpleChartFromMatchUp(chartId, playback.liveEngine.getState(), names);
    }, 0);

    return container;
  },
};
