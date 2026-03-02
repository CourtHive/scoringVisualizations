import type { Meta, StoryObj } from '@storybook/html';
import { ptsMatch } from './ptsChart';
import { feedMatchUp, getMcpFixture } from '../engine/feedMatchUp';
import { buildEpisodes } from '../episodes/buildEpisodes';
import { createPlaybackEngine } from '../engine/createPlaybackEngine';
import { createPlaybackControlsUI } from './helpers/PlaybackControls';
import { createJsonViewer } from './helpers/JsonViewer';
import { supportsPointsToVisualization } from '../utils/supportsPointsToVisualization';
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
        winErrHighlight: args.showRallyBars,
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
        winErrHighlight: args.showRallyBars,
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
        winErrHighlight: args.showRallyBars,
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
        winErrHighlight: args.showRallyBars,
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
        winErrHighlight: args.showRallyBars,
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
      display: { sizeToFit: args.sizeToFit, winErrHighlight: args.showRallyBars },
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

/**
 * Format Awareness — Demonstrates supportsPointsToVisualization() utility.
 *
 * PTS requires a SET-based format with a discrete point endpoint.
 * Unlike Game Tree, PTS supports non-traditional game scoring (consecutive,
 * aggregate) — only timed sets and non-SET roots are rejected.
 *
 * Click [Yes] buttons to see different matches; click [No] to see
 * the unsupported-format response.
 */
export const FormatAwareness: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.cssText = 'display: flex; gap: 24px; padding: 20px; align-items: flex-start;';

    const leftPanel = document.createElement('div');
    leftPanel.style.cssText = 'flex: 0 0 auto;';

    const rightPanel = document.createElement('div');
    rightPanel.style.cssText = 'flex: 1; min-width: 320px;';

    const formats = [
      { code: 'SET3-S:6/TB7', label: 'Tennis (standard)' },
      { code: 'SET3-S:6NOAD/TB7', label: 'Tennis (No-Ad)' },
      { code: 'SET3-S:6/TB7-G:TN', label: 'Tennis (explicit -G:TN)' },
      { code: 'SET3-S:6/TB7-G:TN3D', label: 'Padel (Star Point)' },
      { code: 'SET5-S:5-G:3C', label: 'TYPTI (consecutive)' },
      { code: 'SET3-S:T10-G:AGGR', label: 'Timed + aggregate' },
      { code: 'SET7XA-S:T10P', label: 'INTENNSE (timed)' },
      { code: 'T20', label: 'Standalone timed' },
      { code: 'HAL2A-S:T45', label: 'Soccer' },
      { code: 'SET3-S:TB11', label: 'Squash/Pickleball' },
      { code: 'SET3-S:4/TB5@3', label: 'Fast4 Tennis' },
    ];

    // Build a pool of different episode sets for variety on [Yes] clicks
    const matchPool: Array<{ episodes: any[]; players: [string, string]; label: string }> = [];
    for (let mi = 0; mi < 4; mi++) {
      const matchUp = feedMatchUp(mi);
      const fixture = getMcpFixture(mi);
      const episodes = buildEpisodes(matchUp);
      matchPool.push({
        episodes,
        players: fixture.players as [string, string],
        label: `${fixture.players[0]} v ${fixture.players[1]} — Full match`,
      });
    }

    let matchIndex = 0;
    let activeBtn: HTMLElement | null = null;

    function showChart() {
      const source = matchPool[matchIndex % matchPool.length];
      matchIndex++;
      rightPanel.innerHTML = '';

      const labelDiv = document.createElement('div');
      labelDiv.textContent = source.label;
      labelDiv.style.cssText = 'font-family: sans-serif; font-size: 13px; color: #555; margin-bottom: 8px;';
      rightPanel.appendChild(labelDiv);

      const chartDiv = document.createElement('div');
      chartDiv.style.cssText = 'width: 100%; height: 500px; background: #f5f5f5;';
      rightPanel.appendChild(chartDiv);

      const chart = ptsMatch();
      chart.options({
        margins: { top: 40, bottom: 20 },
        display: { sizeToFit: true },
      });
      chart.players(source.players);
      chart.data(source.episodes);

      setTimeout(() => {
        select(chartDiv).call(chart);
        chart.update();
      }, 0);
    }

    function showMessage(code: string, label: string) {
      rightPanel.innerHTML = '';

      const msgDiv = document.createElement('div');
      msgDiv.style.cssText =
        'display: flex; flex-direction: column; align-items: center; justify-content: center; ' +
        'height: 500px; background: #fdf2f2; border: 2px dashed #e6b0b0; border-radius: 8px; ' +
        'font-family: sans-serif; text-align: center; padding: 40px;';

      const icon = document.createElement('div');
      icon.style.cssText =
        'width: 56px; height: 56px; border-radius: 50%; background: #f5c6c6; ' +
        'display: flex; align-items: center; justify-content: center; margin-bottom: 16px;';
      icon.innerHTML =
        '<span style="font-size: 28px; color: #c0392b; font-weight: bold; line-height: 1;">&#10005;</span>';
      msgDiv.appendChild(icon);

      const title = document.createElement('div');
      title.textContent = 'Format Not Supported';
      title.style.cssText = 'font-size: 18px; font-weight: bold; color: #c0392b; margin-bottom: 12px;';
      msgDiv.appendChild(title);

      const codeEl = document.createElement('div');
      codeEl.textContent = code;
      codeEl.style.cssText =
        'font-family: monospace; font-size: 15px; background: #fff; padding: 8px 16px; ' +
        'border-radius: 4px; margin-bottom: 8px; border: 1px solid #e6b0b0;';
      msgDiv.appendChild(codeEl);

      const labelEl = document.createElement('div');
      labelEl.textContent = label;
      labelEl.style.cssText = 'font-size: 14px; color: #666; margin-bottom: 20px;';
      msgDiv.appendChild(labelEl);

      const desc = document.createElement('div');
      desc.style.cssText = 'font-size: 13px; color: #888; max-width: 320px; line-height: 1.5;';
      desc.textContent = 'Points to Set requires non-timed SET-based scoring';
      msgDiv.appendChild(desc);

      rightPanel.appendChild(msgDiv);
    }

    // Build table with interactive buttons
    const table = document.createElement('table');
    table.style.cssText = 'border-collapse: collapse; font-family: monospace;';

    const headerRow = table.insertRow();
    ['Format Code', 'Label', 'Supported?'].forEach((text) => {
      const th = document.createElement('th');
      th.textContent = text;
      th.style.cssText = 'padding: 8px 12px; border: 1px solid #ddd; text-align: left; white-space: nowrap;';
      headerRow.appendChild(th);
    });

    formats.forEach(({ code, label }) => {
      const supported = supportsPointsToVisualization(code);
      const row = table.insertRow();

      const codeCell = row.insertCell();
      codeCell.textContent = code;
      codeCell.style.cssText = 'padding: 8px 12px; border: 1px solid #ddd; white-space: nowrap;';

      const labelCell = row.insertCell();
      labelCell.textContent = label;
      labelCell.style.cssText = 'padding: 8px 12px; border: 1px solid #ddd; white-space: nowrap;';

      const btnCell = row.insertCell();
      btnCell.style.cssText = 'padding: 8px 12px; border: 1px solid #ddd; text-align: center;';

      const btn = document.createElement('button');
      btn.textContent = supported ? 'Yes' : 'No';
      btn.style.cssText =
        'padding: 4px 14px; border: 2px solid transparent; border-radius: 4px; ' +
        'cursor: pointer; font-weight: bold; font-size: 13px; font-family: sans-serif; ' +
        `color: white; background: ${supported ? '#27ae60' : '#c0392b'}; transition: border-color 0.15s;`;

      btn.addEventListener('mouseenter', () => {
        if (btn !== activeBtn) btn.style.borderColor = '#999';
      });
      btn.addEventListener('mouseleave', () => {
        if (btn !== activeBtn) btn.style.borderColor = 'transparent';
      });
      btn.addEventListener('click', () => {
        if (activeBtn) activeBtn.style.borderColor = 'transparent';
        activeBtn = btn;
        btn.style.borderColor = '#333';
        if (supported) showChart();
        else showMessage(code, label);
      });

      btnCell.appendChild(btn);
    });

    leftPanel.appendChild(table);
    container.appendChild(leftPanel);
    container.appendChild(rightPanel);

    setTimeout(() => showChart(), 0);

    return container;
  },
};
