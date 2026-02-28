import type { Meta, StoryObj } from '@storybook/html';
import { matchUpDashboard } from './matchUpDashboard';
import { feedMatchUp, getMcpFixture } from '../engine/feedMatchUp';
import { createPlaybackEngine } from '../engine/createPlaybackEngine';
import { createPlaybackControlsUI } from './helpers/PlaybackControls';
import { createFileDropzone } from './helpers/FileDropzone';
import { decodeUTF16LE } from '../parsers/proTrackerParser';
import { validateProTrackerMatch } from '../parsers/proTrackerValidator';
import { validateIONSportMatch } from '../parsers/ionSportValidator';

const FULL_WIDTH = 'width:100%;';

interface MatchUpDashboardArgs {
  matchIndex: number;
  delayMs: number;
}

/**
 * Match Dashboard
 *
 * Coordinated multi-visualization analysis view. PtsHorizon brush
 * filters gameTree, rallyTree, statView, and coronaChart simultaneously.
 */
const meta: Meta<MatchUpDashboardArgs> = {
  title: 'Visualizations/MatchUpDashboard',
  tags: ['autodocs'],
  argTypes: {
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
type Story = StoryObj<MatchUpDashboardArgs>;

/**
 * Default — Full match loaded. Brush ptsHorizon to filter all other charts.
 */
export const Default: Story = {
  args: {
    matchIndex: 0,
    delayMs: 200,
  },
  render: (args) => {
    const container = document.createElement('div');
    container.style.cssText = 'width:100%; min-height:600px; padding:12px;';

    const dashboardDiv = document.createElement('div');
    dashboardDiv.style.cssText = FULL_WIDTH;
    container.appendChild(dashboardDiv);

    const idx = args.matchIndex ?? 0;
    const matchUp = feedMatchUp(idx);
    const fixture = getMcpFixture(idx);
    const players = fixture.players as [string, string];

    setTimeout(() => {
      const dashboard = matchUpDashboard();
      dashboard(dashboardDiv);
      dashboard.matchUp(matchUp, players);
      dashboard.update();
    }, 0);

    return container;
  },
};

/**
 * LivePlayback — Points appear incrementally via the reactive LiveEngine.
 * All dashboard charts update live as each point is played.
 */
export const LivePlayback: Story = {
  args: {
    matchIndex: 0,
    delayMs: 200,
  },
  render: (args) => {
    const container = document.createElement('div');
    container.style.cssText = 'width:100%; min-height:650px; padding:12px;';

    const dashboardDiv = document.createElement('div');
    dashboardDiv.style.cssText = FULL_WIDTH;

    const playback = createPlaybackEngine({
      matchIndex: args.matchIndex,
      delayMs: args.delayMs,
    });

    const fixture = playback.getFixture();
    const players = fixture.players as [string, string];

    const controls = createPlaybackControlsUI(playback, { showScoreboard: true });
    container.appendChild(controls);
    container.appendChild(dashboardDiv);

    setTimeout(() => {
      const dashboard = matchUpDashboard();
      dashboard(dashboardDiv);

      playback.liveEngine.subscribe((matchUp: any) => {
        dashboard.matchUp(matchUp, players);
        dashboard.update();
      });

      playback.start();
    }, 0);

    return container;
  },
};

/**
 * UndoRedo — Pre-feeds 20 points, provides undo/redo controls.
 * Use Step Back/Fwd and Undo/Redo to see all charts respond.
 */
export const UndoRedo: Story = {
  args: {
    matchIndex: 0,
    delayMs: 200,
  },
  render: (args) => {
    const container = document.createElement('div');
    container.style.cssText = 'width:100%; min-height:650px; padding:12px;';

    const dashboardDiv = document.createElement('div');
    dashboardDiv.style.cssText = FULL_WIDTH;

    const playback = createPlaybackEngine({ matchIndex: args.matchIndex });
    const fixture = playback.getFixture();
    const players = fixture.players as [string, string];
    for (let i = 0; i < 20; i++) playback.stepForward();

    playback.liveEngine.subscribe((matchUp: any) => {
      dashboard.matchUp(matchUp, players);
      dashboard.update();
    });

    const controls = createPlaybackControlsUI(playback, { showScoreboard: true });
    container.appendChild(controls);
    container.appendChild(dashboardDiv);

    const dashboard = matchUpDashboard();

    setTimeout(() => {
      dashboard(dashboardDiv);
      dashboard.matchUp(playback.liveEngine.getState(), players);
      dashboard.update();
    }, 0);

    return container;
  },
};

/**
 * FileUpload — Drop a ProTracker .ptf or IONSport .json file to visualize.
 * The file is parsed, validated through ScoringEngine, and rendered in the dashboard.
 */
export const FileUpload: Story = {
  args: {
    matchIndex: 0,
    delayMs: 200,
  },
  render: () => {
    const container = document.createElement('div');
    container.style.cssText = 'width:100%; min-height:650px; padding:12px;';

    const statusBar = document.createElement('div');
    statusBar.style.cssText =
      'padding:8px 12px; margin-bottom:8px; background:#f0f0f0; border-radius:6px; font-family:system-ui,sans-serif; font-size:13px; color:#555; min-height:24px;';
    statusBar.textContent = 'No file loaded';

    const dashboardDiv = document.createElement('div');
    dashboardDiv.style.cssText = FULL_WIDTH;

    let dashboard: ReturnType<typeof matchUpDashboard> | null = null;

    function renderMatchUp(matchUp: any, players: [string, string]) {
      if (!dashboard) {
        dashboard = matchUpDashboard();
        dashboard(dashboardDiv);
      }
      dashboard.matchUp(matchUp, players);
      dashboard.update();
    }

    const dropzone = createFileDropzone({
      onPTFFile: (buffer, fileName) => {
        try {
          const content = decodeUTF16LE(buffer);
          const result = validateProTrackerMatch({ content });

          if (!result.valid) {
            statusBar.textContent = `Errors in ${fileName}: ${result.errors.join('; ')}`;
            statusBar.style.color = '#c00';
            return;
          }

          const players = result.ptfMatch.players;
          statusBar.textContent = `${players[0]} vs ${players[1]} | ${result.actualScore} | ${result.pointsProcessed} points`;
          statusBar.style.color = '#333';
          renderMatchUp(result.matchUp, players);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          statusBar.textContent = `Failed to process ${fileName}: ${msg}`;
          statusBar.style.color = '#c00';
        }
      },
      onJSONFile: (data, fileName) => {
        try {
          const result = validateIONSportMatch({ jsonData: data });

          if (!result.valid) {
            statusBar.textContent = `Errors in ${fileName}: ${result.errors.join('; ')}`;
            statusBar.style.color = '#c00';
            return;
          }

          const p1 = result.parsedMatch.side1Players.map((p) => `${p.firstName} ${p.lastName}`).join(' / ');
          const p2 = result.parsedMatch.side2Players.map((p) => `${p.firstName} ${p.lastName}`).join(' / ');
          statusBar.textContent = `${p1} vs ${p2} | ${result.actualScore} | ${result.pointsProcessed} points`;
          statusBar.style.color = '#333';
          renderMatchUp(result.matchUp, [p1, p2]);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          statusBar.textContent = `Failed to process ${fileName}: ${msg}`;
          statusBar.style.color = '#c00';
        }
      },
      onError: (msg) => {
        statusBar.textContent = msg;
        statusBar.style.color = '#c00';
      },
    });

    container.appendChild(dropzone);
    container.appendChild(statusBar);
    container.appendChild(dashboardDiv);

    return container;
  },
};
