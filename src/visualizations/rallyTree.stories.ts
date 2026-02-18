import type { Meta, StoryObj } from '@storybook/html';
import { rallyTree } from './rallyTree';
import { feedMatchUp } from '../engine/feedMatchUp';
import { buildEpisodes } from '../episodes/buildEpisodes';
import { createPlaybackEngine } from '../engine/createPlaybackEngine';
import { createPlaybackControlsUI } from './helpers/PlaybackControls';
import { select } from 'd3';

interface RallyTreeArgs {
  width: number;
  height: number;
  orientation: 'horizontal' | 'vertical';
  matchIndex?: number;
  delayMs?: number;
}

/**
 * Rally Tree Visualization
 *
 * Displays rally length distribution in a tree-like format.
 * Shows how rally lengths are distributed by player and outcome.
 * Each bar represents a point, positioned by rally length and player.
 */
const meta: Meta<RallyTreeArgs> = {
  title: 'Visualizations/RallyTree',
  tags: ['autodocs'],
  render: (args) => {
    // Create container
    const container = document.createElement('div');
    container.id = 'rally-tree-container';
    container.style.width = '100%';
    container.style.height = `${args.height}px`;
    container.style.padding = '20px';
    container.style.backgroundColor = '#ffffff';

    // Real MCP match data: Federer vs Djokovic
    const matchUp = feedMatchUp(0);
    const episodes = buildEpisodes(matchUp);
    const points = episodes.map((ep) => ({
      winner: ep.point.winner,
      result: ep.point.result,
      rallyLength: ep.point.rallyLength ?? 2,
    }));

    // Create chart
    const chart = rallyTree();
    chart.options({
      width: args.width,
      height: args.height,
      orientation: args.orientation,
      display: {
        sizeToFit: false,
      },
      areas: {
        colors: { 0: '#a55194', 1: '#6b6ecf' },
        interpolation: 'linear',
      },
      points: {
        colors: {
          Winner: '#2ecc71',
          Ace: '#27ae60',
          'Serve Winner': '#27ae60',
          'Unforced Error': '#e74c3c',
          Net: '#e67e22',
          Out: '#c0392b',
          'Passing Shot': '#2ecc71',
          'Forced Error': '#f39c12',
        },
      },
    });

    chart.data(points);

    setTimeout(() => {
      select(container).call(chart);
      if (chart.update) chart.update();
    }, 0);

    return container;
  },
  argTypes: {
    width: { control: { type: 'range', min: 400, max: 1200, step: 100 } },
    height: { control: { type: 'range', min: 300, max: 800, step: 50 } },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
    matchIndex: {
      control: 'select',
      options: { 'Federer vs Djokovic': 0, 'Federer vs Wawrinka': 1, 'Djokovic vs Nadal': 2, 'Schwartzman vs Cervantes': 3 },
    },
    delayMs: { control: { type: 'range', min: 50, max: 2000, step: 50 } },
  },
};

export default meta;
type Story = StoryObj<RallyTreeArgs>;

/**
 * Default rally tree view - horizontal layout
 */
export const Default: Story = {
  args: {
    width: 800,
    height: 600,
    orientation: 'horizontal',
  },
};

/**
 * Vertical orientation
 */
export const VerticalOrientation: Story = {
  args: {
    width: 600,
    height: 700,
    orientation: 'vertical',
  },
};

/**
 * Wide horizontal layout
 */
export const WideLayout: Story = {
  args: {
    width: 1000,
    height: 500,
    orientation: 'horizontal',
  },
};

/**
 * Tall vertical layout
 */
export const TallLayout: Story = {
  args: {
    width: 600,
    height: 800,
    orientation: 'vertical',
  },
};

/**
 * Live Playback — Rally tree updates as points are added via the reactive LiveEngine.
 */
export const LivePlayback: Story = {
  args: {
    width: 800,
    height: 600,
    orientation: 'horizontal',
    matchIndex: 0,
    delayMs: 1000,
  },
  render: (args) => {
    const container = document.createElement('div');

    const chart = rallyTree();
    chart.options({
      width: args.width,
      height: args.height,
      orientation: args.orientation,
      display: { sizeToFit: false },
      areas: {
        colors: { 0: '#a55194', 1: '#6b6ecf' },
        interpolation: 'linear',
      },
      points: {
        colors: {
          Winner: '#2ecc71',
          Ace: '#27ae60',
          'Serve Winner': '#27ae60',
          'Unforced Error': '#e74c3c',
          'Forced Error': '#f39c12',
        },
      },
    });

    const chartDiv = document.createElement('div');
    chartDiv.style.width = '100%';
    chartDiv.style.height = `${args.height}px`;
    chartDiv.style.backgroundColor = '#ffffff';

    const playback = createPlaybackEngine({
      matchIndex: args.matchIndex,
      delayMs: args.delayMs,
    });

    let mounted = false;
    playback.liveEngine.subscribe((matchUp) => {
      chart.matchUp(matchUp);
      if (mounted) chart.update();
    });

    const controls = createPlaybackControlsUI(playback, { showScoreboard: true });
    container.appendChild(controls);
    container.appendChild(chartDiv);

    setTimeout(() => {
      select(chartDiv).call(chart);
      mounted = true;
      playback.start();
    }, 0);

    return container;
  },
};

/**
 * Undo/Redo — Feed 20 points then interact.
 */
export const UndoRedo: Story = {
  args: { width: 800, height: 600, orientation: 'horizontal', matchIndex: 0 },
  render: (args) => {
    const container = document.createElement('div');

    const chart = rallyTree();
    chart.options({
      width: args.width, height: args.height, orientation: args.orientation,
      display: { sizeToFit: false },
      areas: { colors: { 0: '#a55194', 1: '#6b6ecf' }, interpolation: 'linear' },
      points: {
        colors: {
          Winner: '#2ecc71', Ace: '#27ae60', 'Serve Winner': '#27ae60',
          'Unforced Error': '#e74c3c', 'Forced Error': '#f39c12',
        },
      },
    });

    const chartDiv = document.createElement('div');
    chartDiv.style.cssText = `width:100%; height:${args.height}px; background:#fff;`;

    const playback = createPlaybackEngine({ matchIndex: args.matchIndex });
    for (let i = 0; i < 20; i++) playback.stepForward();

    let mounted = false;
    playback.liveEngine.subscribe((matchUp) => {
      chart.matchUp(matchUp);
      if (mounted) chart.update();
    });

    const controls = createPlaybackControlsUI(playback, { showScoreboard: true });
    container.appendChild(controls);
    container.appendChild(chartDiv);

    setTimeout(() => {
      select(chartDiv).call(chart);
      mounted = true;
      chart.matchUp(playback.liveEngine.getState());
      chart.update();
    }, 0);

    return container;
  },
};
