import type { Meta, StoryObj } from '@storybook/html';
import { matchDashboard } from './matchDashboard';
import { feedMatchUp, getMcpFixture } from '../engine/feedMatchUp';
import { createPlaybackEngine } from '../engine/createPlaybackEngine';
import { createPlaybackControlsUI } from './helpers/PlaybackControls';

interface MatchDashboardArgs {
  matchIndex: number;
  delayMs: number;
}

/**
 * Match Dashboard
 *
 * Coordinated multi-visualization analysis view. PtsHorizon brush
 * filters gameTree, rallyTree, statView, and coronaChart simultaneously.
 */
const meta: Meta<MatchDashboardArgs> = {
  title: 'Visualizations/MatchDashboard',
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
type Story = StoryObj<MatchDashboardArgs>;

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
    dashboardDiv.style.cssText = 'width:100%;';
    container.appendChild(dashboardDiv);

    const idx = args.matchIndex ?? 0;
    const matchUp = feedMatchUp(idx);
    const fixture = getMcpFixture(idx);
    const players = fixture.players as [string, string];

    setTimeout(() => {
      const dashboard = matchDashboard();
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
    dashboardDiv.style.cssText = 'width:100%;';

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
      const dashboard = matchDashboard();
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
    dashboardDiv.style.cssText = 'width:100%;';

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

    const dashboard = matchDashboard();

    setTimeout(() => {
      dashboard(dashboardDiv);
      dashboard.matchUp(playback.liveEngine.getState(), players);
      dashboard.update();
    }, 0);

    return container;
  },
};
