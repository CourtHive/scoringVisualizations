import type { Meta, StoryObj } from '@storybook/html';
import { gameTree } from './gameTree';
import { momentumChart } from './momentumChart';
import { ptsMatch } from './ptsChart';
import { createPlaybackEngine } from '../engine/createPlaybackEngine';
import { createPlaybackControlsUI } from './helpers/PlaybackControls';
import { select } from 'd3';

interface PlaygroundArgs {
  matchIndex: number;
  delayMs: number;
}

/**
 * Playground — Multi-visualization interactive demo
 *
 * Shows multiple visualizations side by side, all connected to the same
 * LiveEngine. Demonstrates that undo/redo/edit update all vizzes simultaneously.
 */
const meta: Meta<PlaygroundArgs> = {
  title: 'Playground',
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
type Story = StoryObj<PlaygroundArgs>;

/**
 * Multi-Viz Playback — GameTree + MomentumChart + PtsChart
 *
 * All three update simultaneously from the same LiveEngine.
 * Use Undo/Redo to see all vizzes respond in sync.
 */
export const MultiViz: Story = {
  args: { matchIndex: 0, delayMs: 150 },
  render: (args) => {
    const root = document.createElement('div');

    // ── Playback engine ────────────────────────────────────────
    const playback = createPlaybackEngine({
      matchIndex: args.matchIndex,
      delayMs: args.delayMs,
    });

    // ── Controls ───────────────────────────────────────────────
    const controls = createPlaybackControlsUI(playback, { showScoreboard: true });
    root.appendChild(controls);

    // ── Layout: 2-column top, full-width bottom ────────────────
    const topRow = document.createElement('div');
    topRow.style.cssText = 'display:flex; gap:12px; margin-bottom:12px;';

    const gameTreeDiv = document.createElement('div');
    gameTreeDiv.style.cssText = 'flex:1; height:400px; background:#f5f5f5;';

    const momentumDiv = document.createElement('div');
    momentumDiv.style.cssText = 'flex:1; height:400px;';

    topRow.appendChild(gameTreeDiv);
    topRow.appendChild(momentumDiv);
    root.appendChild(topRow);

    const ptsDiv = document.createElement('div');
    ptsDiv.style.cssText = 'width:50%; height:400px; background:#fff;';
    root.appendChild(ptsDiv);

    // ── Charts ─────────────────────────────────────────────────
    const gtChart = gameTree();
    gtChart.options({
      display: { sizeToFit: true, showEmpty: false, noAd: false, show_images: false },
      lines: {
        points: { winners: 'green', errors: '#BA1212', unknown: '#2ed2db' },
        colors: { underlines: 'black' },
      },
      nodes: { colors: { 0: '#a55194', 1: '#6b6ecf', neutral: '#ecf0f1' } },
    });

    const mcChart = momentumChart();
    mcChart.options({
      display: {
        sizeToFit: true, continuous: false, orientation: 'vertical',
        service: false, rally: true, grid: false, score: true,
        momentum_score: true, transition_time: 0,
      },
      colors: { players: { 0: '#a55194', 1: '#6b6ecf' } },
    });

    const ptChart = ptsMatch();
    ptChart.options({
      margins: { top: 40, bottom: 20 },
      display: { sizeToFit: true, win_err_highlight: false },
    });

    // ── Subscribe all to same engine ───────────────────────────
    let mounted = false;
    playback.liveEngine.subscribe((matchUp) => {
      gtChart.matchUp(matchUp);
      mcChart.matchUp(matchUp);
      ptChart.matchUp(matchUp);
      if (mounted) {
        gtChart.update();
        mcChart.update();
        // ptsMatch auto-updates in .data()
      }
    });

    // ── Mount charts ───────────────────────────────────────────
    setTimeout(() => {
      select(gameTreeDiv).call(gtChart);
      select(momentumDiv).call(mcChart);
      select(ptsDiv).call(ptChart);
      mounted = true;
      playback.start();
    }, 0);

    return root;
  },
};

/**
 * UndoRedo Demo — Feed 30 points then interact
 *
 * Points are fed instantly. Use Undo/Redo/Edit buttons to see
 * all three visualizations update in sync.
 */
export const UndoRedoDemo: Story = {
  args: { matchIndex: 0, delayMs: 200 },
  render: (args) => {
    const root = document.createElement('div');

    const playback = createPlaybackEngine({
      matchIndex: args.matchIndex,
      delayMs: args.delayMs,
    });

    // Feed 30 points instantly
    for (let i = 0; i < 30; i++) {
      playback.stepForward();
    }

    // ── Edit button ────────────────────────────────────────────
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Toggle Last Point Winner';
    editBtn.style.cssText =
      'padding:4px 10px; border:1px solid #c00; border-radius:4px; background:#fee; cursor:pointer; font-size:13px; margin-bottom:8px;';
    editBtn.addEventListener('click', () => {
      const count = playback.liveEngine.getPointCount();
      if (count === 0) return;
      const state = playback.liveEngine.getState();
      const lastPt = state.history.points[count - 1];
      const newWinner = lastPt.winner === 0 ? 1 : 0;
      playback.liveEngine.editPoint(count - 1, { winner: newWinner });
    });

    const controls = createPlaybackControlsUI(playback, { showScoreboard: true });
    root.appendChild(controls);
    root.appendChild(editBtn);

    // ── Layout ─────────────────────────────────────────────────
    const topRow = document.createElement('div');
    topRow.style.cssText = 'display:flex; gap:12px; margin-bottom:12px;';

    const gameTreeDiv = document.createElement('div');
    gameTreeDiv.style.cssText = 'flex:1; height:400px; background:#f5f5f5;';

    const momentumDiv = document.createElement('div');
    momentumDiv.style.cssText = 'flex:1; height:400px;';

    topRow.appendChild(gameTreeDiv);
    topRow.appendChild(momentumDiv);
    root.appendChild(topRow);

    const ptsDiv = document.createElement('div');
    ptsDiv.style.cssText = 'width:50%; height:400px; background:#fff;';
    root.appendChild(ptsDiv);

    // ── Charts ─────────────────────────────────────────────────
    const gtChart = gameTree();
    gtChart.options({
      display: { sizeToFit: true, showEmpty: false, noAd: false, show_images: false },
      lines: {
        points: { winners: 'green', errors: '#BA1212', unknown: '#2ed2db' },
        colors: { underlines: 'black' },
      },
      nodes: { colors: { 0: '#a55194', 1: '#6b6ecf', neutral: '#ecf0f1' } },
    });

    const mcChart = momentumChart();
    mcChart.options({
      display: {
        sizeToFit: true, continuous: false, orientation: 'vertical',
        service: false, rally: true, grid: false, score: true,
        momentum_score: true, transition_time: 0,
      },
      colors: { players: { 0: '#a55194', 1: '#6b6ecf' } },
    });

    const ptChart = ptsMatch();
    ptChart.options({
      margins: { top: 40, bottom: 20 },
      display: { sizeToFit: true, win_err_highlight: false },
    });

    let mounted = false;
    playback.liveEngine.subscribe((matchUp) => {
      gtChart.matchUp(matchUp);
      mcChart.matchUp(matchUp);
      ptChart.matchUp(matchUp);
      if (mounted) {
        gtChart.update();
        mcChart.update();
      }
    });

    setTimeout(() => {
      select(gameTreeDiv).call(gtChart);
      select(momentumDiv).call(mcChart);
      select(ptsDiv).call(ptChart);
      mounted = true;

      // Initial render with current state
      const state = playback.liveEngine.getState();
      gtChart.matchUp(state);
      mcChart.matchUp(state);
      ptChart.matchUp(state);
      gtChart.update();
      mcChart.update();
    }, 0);

    return root;
  },
};
