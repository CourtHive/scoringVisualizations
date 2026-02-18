import type { Meta, StoryObj } from '@storybook/html';
import { ptsHorizon } from './ptsHorizon';
import { feedMatchUp } from '../engine/feedMatchUp';
import { buildSetMap } from '../engine/buildSetMap';
import { createPlaybackEngine } from '../engine/createPlaybackEngine';
import { createPlaybackControlsUI } from './helpers/PlaybackControls';
import { select } from 'd3';

interface PtsHorizonArgs {
  bands: number;
  mode: 'mirror' | 'offset';
  showBrush: boolean;
  matchIndex: number;
  delayMs: number;
}

/**
 * PtsHorizon Visualization
 *
 * A point-level "horizon chart" showing cumulative score differentials
 * across sets, with optional draggable brush handles for range selection.
 */
const meta: Meta<PtsHorizonArgs> = {
  title: 'Visualizations/PtsHorizon',
  tags: ['autodocs'],
  render: (args) => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.padding = '20px';

    const chartDiv = document.createElement('div');
    chartDiv.style.width = '100%';
    chartDiv.style.height = '100px';

    const chart = ptsHorizon();
    chart.options({
      display: {
        sizeToFit: true,
        bands: args.bands,
        mode: args.mode,
        transition_time: 0,
      },
      elements: { brush: args.showBrush },
    });
    chart.colors(['#a55194', '#6b6ecf']);

    const matchUp = feedMatchUp(args.matchIndex ?? 0);
    chart.matchUp(matchUp);

    container.appendChild(chartDiv);

    setTimeout(() => {
      select(chartDiv).call(chart as any);
      chart.update();
    }, 0);

    return container;
  },
  argTypes: {
    bands: { control: { type: 'range', min: 1, max: 5, step: 1 } },
    mode: { control: 'select', options: ['mirror', 'offset'] },
    showBrush: { control: 'boolean' },
    matchIndex: {
      control: 'select',
      options: {
        'Federer vs Djokovic': 0,
        'Federer vs Wawrinka': 1,
        'Djokovic vs Nadal': 2,
        'Schwartzman vs Cervantes': 3,
      },
    },
    delayMs: { control: { type: 'range', min: 50, max: 2000, step: 50 } },
  },
};

export default meta;
type Story = StoryObj<PtsHorizonArgs>;

/**
 * Default — Full match, static render, no brush.
 */
export const Default: Story = {
  args: {
    bands: 3,
    mode: 'mirror',
    showBrush: false,
    matchIndex: 0,
    delayMs: 200,
  },
};

/**
 * WithBrush — Brush enabled. Shows selected range [start, end] below the chart.
 */
export const WithBrush: Story = {
  args: {
    bands: 3,
    mode: 'mirror',
    showBrush: true,
    matchIndex: 0,
    delayMs: 200,
  },
  render: (args) => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.padding = '20px';

    const chartDiv = document.createElement('div');
    chartDiv.style.width = '100%';
    chartDiv.style.height = '100px';

    const rangeDisplay = document.createElement('div');
    rangeDisplay.style.cssText = 'padding:10px; font-family:monospace; font-size:14px; color:#555;';
    rangeDisplay.textContent = 'Drag on the chart to select a range';

    const matchUp = feedMatchUp(args.matchIndex ?? 0);
    const setMap = buildSetMap(matchUp);
    const totalPoints = setMap.reduce((sum, sm) => sum + sm.p2sdiff.length, 0);

    const chart = ptsHorizon();
    chart.options({
      display: {
        sizeToFit: true,
        bands: args.bands,
        mode: args.mode,
        transition_time: 0,
      },
      elements: { brush: true },
    });
    chart.colors(['#a55194', '#6b6ecf']);
    chart.matchUp(matchUp);

    chart.events({
      brush: {
        start: (extent: [number, number]) => {
          rangeDisplay.textContent = `Brush start: [${Math.floor(extent[0])}, ${Math.ceil(extent[1])}]`;
        },
        brushing: (extent: [number, number]) => {
          rangeDisplay.textContent = `Range: [${Math.floor(extent[0])}, ${Math.ceil(extent[1])}] of ${totalPoints} points`;
        },
        end: (extent: [number, number]) => {
          rangeDisplay.textContent = `Selected: [${Math.floor(extent[0])}, ${Math.ceil(extent[1])}] of ${totalPoints} points`;
        },
      },
    });

    container.appendChild(chartDiv);
    container.appendChild(rangeDisplay);

    setTimeout(() => {
      select(chartDiv).call(chart as any);
      chart.update();
    }, 0);

    return container;
  },
};

/**
 * LivePlayback — Points appear incrementally via the reactive LiveEngine.
 */
export const LivePlayback: Story = {
  args: {
    bands: 3,
    mode: 'mirror',
    showBrush: false,
    matchIndex: 0,
    delayMs: 200,
  },
  render: (args) => {
    const container = document.createElement('div');

    const chart = ptsHorizon();
    chart.options({
      display: {
        sizeToFit: true,
        bands: args.bands,
        mode: args.mode,
        transition_time: 0,
      },
      elements: { brush: args.showBrush },
    });
    chart.colors(['#a55194', '#6b6ecf']);

    const chartDiv = document.createElement('div');
    chartDiv.style.cssText = 'width:100%; height:100px;';

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
      select(chartDiv).call(chart as any);
      mounted = true;
      playback.start();
    }, 0);

    return container;
  },
};

/**
 * UndoRedo — Pre-feeds 20 points, provides undo/redo controls.
 */
export const UndoRedo: Story = {
  args: {
    bands: 3,
    mode: 'mirror',
    showBrush: false,
    matchIndex: 0,
    delayMs: 200,
  },
  render: (args) => {
    const container = document.createElement('div');

    const chart = ptsHorizon();
    chart.options({
      display: {
        sizeToFit: true,
        bands: args.bands,
        mode: args.mode,
        transition_time: 0,
      },
      elements: { brush: args.showBrush },
    });
    chart.colors(['#a55194', '#6b6ecf']);

    const chartDiv = document.createElement('div');
    chartDiv.style.cssText = 'width:100%; height:100px;';

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
      select(chartDiv).call(chart as any);
      mounted = true;
      chart.matchUp(playback.liveEngine.getState());
      chart.update();
    }, 0);

    return container;
  },
};
