/**
 * PlaybackControls — DOM helper for Storybook playback UI
 *
 * Renders transport controls (Play/Pause, Step Forward/Back, Reset)
 * plus a progress indicator and optional scoreboard.
 * Returns an HTMLElement that stories append above their chart container.
 */

import type { PlaybackControls } from '../../engine/createPlaybackEngine';

export function createPlaybackControlsUI(
  playback: PlaybackControls,
  options?: { showScoreboard?: boolean },
): HTMLElement {
  const showScoreboard = options?.showScoreboard ?? true;

  const root = document.createElement('div');
  root.style.cssText =
    'display:flex; flex-wrap:wrap; align-items:center; gap:8px; padding:8px 12px; margin-bottom:12px; background:#f0f0f0; border-radius:6px; font-family:system-ui,sans-serif; font-size:13px;';

  // ── Buttons ────────────────────────────────────────────────────
  const btnStyle =
    'padding:4px 10px; border:1px solid #ccc; border-radius:4px; background:#fff; cursor:pointer; font-size:13px;';

  const playBtn = document.createElement('button');
  playBtn.textContent = 'Play';
  playBtn.style.cssText = btnStyle;

  const stepBackBtn = document.createElement('button');
  stepBackBtn.textContent = 'Step Back';
  stepBackBtn.style.cssText = btnStyle;

  const stepFwdBtn = document.createElement('button');
  stepFwdBtn.textContent = 'Step Fwd';
  stepFwdBtn.style.cssText = btnStyle;

  const undoBtn = document.createElement('button');
  undoBtn.textContent = 'Undo';
  undoBtn.style.cssText = btnStyle;

  const redoBtn = document.createElement('button');
  redoBtn.textContent = 'Redo';
  redoBtn.style.cssText = btnStyle;

  const resetBtn = document.createElement('button');
  resetBtn.textContent = 'Reset';
  resetBtn.style.cssText = btnStyle;

  // ── Progress ───────────────────────────────────────────────────
  const progressSpan = document.createElement('span');
  progressSpan.style.cssText = 'margin-left:8px; color:#555;';

  // ── Scoreboard ─────────────────────────────────────────────────
  const scoreSpan = document.createElement('span');
  scoreSpan.style.cssText = 'margin-left:auto; font-weight:600; color:#333;';

  // ── Fixture info ───────────────────────────────────────────────
  const fixture = playback.getFixture();
  const infoSpan = document.createElement('span');
  infoSpan.style.cssText = 'color:#888; font-size:12px;';
  infoSpan.textContent = `${fixture.players[0]} vs ${fixture.players[1]}`;

  // ── Append ─────────────────────────────────────────────────────
  root.appendChild(playBtn);
  root.appendChild(stepBackBtn);
  root.appendChild(stepFwdBtn);
  root.appendChild(undoBtn);
  root.appendChild(redoBtn);
  root.appendChild(resetBtn);
  root.appendChild(progressSpan);
  if (showScoreboard) root.appendChild(scoreSpan);
  root.appendChild(infoSpan);

  // ── Update UI state ────────────────────────────────────────────
  function refresh(): void {
    const { current, total } = playback.getProgress();
    progressSpan.textContent = `${current}/${total}`;
    playBtn.textContent = playback.isPlaying() ? 'Pause' : 'Play';
    undoBtn.disabled = !playback.liveEngine.canUndo();
    redoBtn.disabled = !playback.liveEngine.canRedo();
    if (showScoreboard) {
      scoreSpan.textContent = current > 0 ? playback.liveEngine.getScoreboard() : '0-0';
    }
  }

  // Subscribe to LiveEngine state changes for auto-refresh
  playback.liveEngine.subscribe(() => refresh());

  // ── Event handlers ─────────────────────────────────────────────
  playBtn.addEventListener('click', () => {
    if (playback.isPlaying()) {
      playback.pause();
    } else {
      playback.start();
    }
    refresh();
  });

  stepBackBtn.addEventListener('click', () => {
    playback.stepBack();
  });

  stepFwdBtn.addEventListener('click', () => {
    playback.stepForward();
  });

  undoBtn.addEventListener('click', () => {
    playback.liveEngine.undo();
  });

  redoBtn.addEventListener('click', () => {
    playback.liveEngine.redo();
  });

  resetBtn.addEventListener('click', () => {
    playback.reset();
    refresh();
  });

  // Initial state
  refresh();

  return root;
}
