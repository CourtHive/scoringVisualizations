import type { Meta, StoryObj } from '@storybook/html';
import { ptsMatch } from './ptsChart';
import { feedMatchUp, getMcpFixture } from '../engine/feedMatchUp';
import { buildEpisodes } from '../episodes/buildEpisodes';
import { createPlaybackEngine } from '../engine/createPlaybackEngine';
import { createPlaybackControlsUI } from './helpers/PlaybackControls';
import { createJsonViewer } from './helpers/JsonViewer';
import { select } from 'd3';

interface PtsChartArgs {
  sizeToFit: boolean;
  topMargin: number;
  bottomMargin: number;
  showRallyBars: boolean;
  matchIndex?: number;
  delayMs?: number;
}

/**
 * Points to Set (PTS) — Visual Match Summary
 *
 * "Points-to-Set" presents a visual summary of a tennis match and captures
 * the dynamics of Point Progression during play. The Y-axis ranges from 24
 * (the minimum points needed to win a standard set) down to 0 (set won).
 * The X-axis displays total points played within the set.
 *
 * Every point won advances a player closer to set victory, but losing games
 * can paradoxically increase the "Points-to-Set" number. For instance, when
 * leading 5-4 and losing the game (making it 5-5), both players shift from
 * needing 4 and 12 points respectively to each needing 8 points.
 *
 * PTS charts make it easy to see that two 6-3 sets can be very different,
 * or that a 6-3 set can contain as many points as a 7-5 set. They provide
 * a clearer indication of where two players stand than traditional "Total
 * Points Won".
 *
 * Interactive features include: orientation highlighting to emphasize player
 * perspective, game highlighting to isolate individual games, deuce
 * visualization showing jagged lines during extended rallies, and breakpoint
 * indicators. Hovering on the first point of each set displays winners
 * (green) and errors (red) as well as rally lengths. Hovering over the last
 * point highlights which games were won by each player.
 *
 * PTS concept credit: Francis Diebold.
 *
 * @see https://tennisviz.blogspot.com/2015/08/points-to-set.html
 */
const meta: Meta<PtsChartArgs> = {
  title: 'Visualizations/PtsChart',
  tags: ['autodocs'],
  render: (args: any) => {
    // Main wrapper
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.gap = '20px';
    wrapper.style.padding = '20px';

    // Chart container
    const chartContainer = document.createElement('div');
    chartContainer.style.flex = '1';
    chartContainer.style.minWidth = '600px';
    chartContainer.style.height = '800px';
    chartContainer.style.backgroundColor = '#ffffff';

    // Create chart
    const chart = ptsMatch();
    chart.options({
      margins: {
        top: args.topMargin,
        bottom: args.bottomMargin,
      },
      display: {
        sizeToFit: args.sizeToFit,
        win_err_highlight: args.showRallyBars,
      },
    });

    // Real MCP match data: Federer vs Djokovic
    const fixture = getMcpFixture(0);
    const matchUp = feedMatchUp(0);
    const episodes = buildEpisodes(matchUp);
    chart.players(fixture.players as [string, string]);
    chart.data(episodes);

    setTimeout(() => {
      select(chartContainer).call(chart);
      if (chart.update) chart.update();
    }, 0);

    // Data viewer
    const dataContainer = document.createElement('div');
    dataContainer.style.flex = '0 0 400px';

    const dataTitle = document.createElement('h3');
    dataTitle.textContent = 'MatchUp Data';
    dataTitle.style.marginTop = '0';
    dataTitle.style.marginBottom = '10px';
    dataContainer.appendChild(dataTitle);

    const jsonContainer = document.createElement('div');
    createJsonViewer(jsonContainer, episodes.slice(0, 20), { expanded: 1 });
    dataContainer.appendChild(jsonContainer);

    const note = document.createElement('p');
    note.style.fontSize = '12px';
    note.style.color = '#666';
    note.textContent = 'Showing first 20 episodes of matchUp data';
    dataContainer.appendChild(note);

    wrapper.appendChild(chartContainer);
    wrapper.appendChild(dataContainer);

    return wrapper;
  },
  argTypes: {
    sizeToFit: { control: 'boolean' },
    showRallyBars: {
      description: 'Show rally length bars (yellow) with winner/error indicators (green/red)',
      control: 'boolean',
    },
    bottomMargin: { control: { type: 'range', min: 10, max: 60, step: 10 } },
    topMargin: { control: { type: 'range', min: 10, max: 80, step: 10 } },
    matchIndex: {
      control: 'select',
      options: { 'Federer vs Djokovic': 0, 'Federer vs Wawrinka': 1, 'Djokovic vs Nadal': 2, 'Schwartzman vs Cervantes': 3 },
    },
    delayMs: { control: { type: 'range', min: 50, max: 2000, step: 50 } },
  },
};

export default meta;
type Story = StoryObj<PtsChartArgs>;

// Note: No longer need createMockMatch helper!
// The chart.data() method now accepts plain arrays of episodes

/**
 * Default PTS chart - Full match view
 */
export const Default: Story = {
  args: {
    sizeToFit: true,
    topMargin: 40,
    bottomMargin: 20,
    showRallyBars: false,
  },
};

/**
 * Compact margins
 */
export const CompactMargins: Story = {
  args: {
    sizeToFit: true,
    topMargin: 20,
    bottomMargin: 10,
    showRallyBars: false,
  },
};

/**
 * Large margins for detailed view
 */
export const LargeMargins: Story = {
  args: {
    sizeToFit: true,
    topMargin: 60,
    bottomMargin: 40,
    showRallyBars: false,
  },
};

/**
 * Single set view
 */
export const SingleSet: Story = {
  args: {
    sizeToFit: true,
    topMargin: 40,
    bottomMargin: 20,
    showRallyBars: false,
  },
  render: (args: any) => {
    const container = document.createElement('div');
    container.id = 'pts-chart-single-set';
    container.style.width = '100%';
    container.style.height = '400px';
    container.style.padding = '20px';
    container.style.backgroundColor = '#ffffff';

    const chart = ptsMatch();
    chart.options({
      margins: {
        top: args.topMargin,
        bottom: args.bottomMargin,
      },
      display: {
        sizeToFit: args.sizeToFit,
        win_err_highlight: args.showRallyBars,
      },
    });

    // Real MCP match data: Federer vs Djokovic — filter to first set only
    const matchUp = feedMatchUp(0);
    const episodes = buildEpisodes(matchUp);
    const set1Data = episodes.filter((ep) => ep.point.set === 0);
    chart.players(getMcpFixture(0).players as [string, string]);
    chart.data(set1Data);

    setTimeout(() => {
      select(container).call(chart);
      if (chart.update) chart.update();
    }, 0);

    return container;
  },
};

/**
 * Rally Bars Display (Single Set)
 *
 * Shows rally length as yellow bars from bottom, with winner/error indicators:
 * - Yellow bar height = rally length
 * - Green top section = point ended in winner
 * - Red top section = point ended in error
 *
 * Single set view to reduce log output during debugging
 */
export const WithRallyBars: Story = {
  args: {
    sizeToFit: true,
    topMargin: 40,
    bottomMargin: 20,
    showRallyBars: true,
  },
  render: (args: any) => {
    const container = document.createElement('div');
    container.id = 'pts-chart-rally-bars';
    container.style.width = '100%';
    container.style.height = '400px';
    container.style.padding = '20px';
    container.style.backgroundColor = '#ffffff';

    const chart = ptsMatch();
    chart.options({
      margins: {
        top: args.topMargin,
        bottom: args.bottomMargin,
      },
      display: {
        sizeToFit: args.sizeToFit,
        win_err_highlight: args.showRallyBars,
      },
    });

    // Real MCP match data: Federer vs Djokovic — filter to first set only
    const matchUp = feedMatchUp(0);
    const episodes = buildEpisodes(matchUp);
    const set1Data = episodes.filter((ep) => ep.point.set === 0);
    chart.players(getMcpFixture(0).players as [string, string]);
    chart.data(set1Data);

    setTimeout(() => {
      select(container).call(chart);
      if (chart.update) chart.update();
    }, 0);

    return container;
  },
};
/**
 * Wide layout for detailed analysis
 */
export const WideLayout: Story = {
  args: {
    sizeToFit: true,
    topMargin: 40,
    bottomMargin: 20,
    showRallyBars: false,
  },
  render: (args: any) => {
    const container = document.createElement('div');
    container.id = 'pts-chart-wide';
    container.style.width = '100%';
    container.style.height = '600px';
    container.style.padding = '20px';
    container.style.backgroundColor = '#f8f9fa';

    const chart = ptsMatch();
    chart.options({
      margins: {
        top: args.topMargin,
        bottom: args.bottomMargin,
      },
      display: {
        sizeToFit: args.sizeToFit,
        win_err_highlight: args.showRallyBars,
      },
    });

    const matchUp = feedMatchUp(0);
    const episodes = buildEpisodes(matchUp);
    chart.players(getMcpFixture(0).players as [string, string]);
    chart.data(episodes);

    setTimeout(() => {
      select(container).call(chart);
      if (chart.update) chart.update();
    }, 0);

    return container;
  },
};

/**
 * Live Playback — Points appear incrementally via the reactive LiveEngine.
 */
export const LivePlayback: Story = {
  args: {
    sizeToFit: true,
    topMargin: 40,
    bottomMargin: 20,
    showRallyBars: false,
    matchIndex: 0,
    delayMs: 200,
  },
  render: (args: any) => {
    const container = document.createElement('div');

    const chart = ptsMatch();
    chart.options({
      margins: { top: args.topMargin, bottom: args.bottomMargin },
      display: {
        sizeToFit: args.sizeToFit,
        win_err_highlight: args.showRallyBars,
      },
    });

    const chartDiv = document.createElement('div');
    chartDiv.style.width = '100%';
    chartDiv.style.height = '800px';
    chartDiv.style.backgroundColor = '#ffffff';

    const playback = createPlaybackEngine({
      matchIndex: args.matchIndex,
      delayMs: args.delayMs,
    });

    const fixture = playback.getFixture();
    const names = fixture.players as [string, string];

    let mounted = false;
    playback.liveEngine.subscribe((matchUp) => {
      chart.matchUp(matchUp, names);
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
  args: { sizeToFit: true, topMargin: 40, bottomMargin: 20, showRallyBars: false, matchIndex: 0 },
  render: (args: any) => {
    const container = document.createElement('div');

    const chart = ptsMatch();
    chart.options({
      margins: { top: args.topMargin, bottom: args.bottomMargin },
      display: { sizeToFit: args.sizeToFit, win_err_highlight: args.showRallyBars },
    });

    const chartDiv = document.createElement('div');
    chartDiv.style.cssText = 'width:100%; height:800px; background:#fff;';

    const playback = createPlaybackEngine({ matchIndex: args.matchIndex });
    for (let i = 0; i < 20; i++) playback.stepForward();

    const fixture = playback.getFixture();
    const names = fixture.players as [string, string];

    let mounted = false;
    playback.liveEngine.subscribe((matchUp) => {
      chart.matchUp(matchUp, names);
      if (mounted) chart.update();
    });

    const controls = createPlaybackControlsUI(playback, { showScoreboard: true });
    container.appendChild(controls);
    container.appendChild(chartDiv);

    setTimeout(() => {
      select(chartDiv).call(chart);
      mounted = true;
      chart.matchUp(playback.liveEngine.getState(), names);
    }, 0);

    return container;
  },
};
