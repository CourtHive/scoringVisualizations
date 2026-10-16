// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { select } from 'd3';

import { matchUpDashboard } from '../visualizations/matchUpDashboard';
import { rallyTree } from '../visualizations/rallyTree';

// Enough long rallies for rallyTree to draw its stat bar (it skips below 3).
const points = Array.from({ length: 12 }, (_, i) => ({ winner: (i % 2) as 0 | 1, rallyLength: 3 + (i % 5) }));

/**
 * Net `mousemove` listeners added to the elements matching `selector`: adds
 * minus removes, as seen by the DOM. A handler that replaces itself nets zero.
 */
function trackMousemove() {
  let net = 0;
  const add = vi.spyOn(Element.prototype, 'addEventListener').mockImplementation(function (this: Element, ...args) {
    if (args[0] === 'mousemove' && this.matches('rect.stat-bar')) net += 1;
    return EventTarget.prototype.addEventListener.apply(this, args as any);
  });
  const remove = vi
    .spyOn(Element.prototype, 'removeEventListener')
    .mockImplementation(function (this: Element, ...args) {
      if (args[0] === 'mousemove' && this.matches('rect.stat-bar')) net -= 1;
      return EventTarget.prototype.removeEventListener.apply(this, args as any);
    });
  return {
    net: () => net,
    restore: () => {
      add.mockRestore();
      remove.mockRestore();
    },
  };
}

function mountRallyTree() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const chart: any = rallyTree();
  chart.data(points);
  select(container).call(chart);
  return { chart, container };
}

describe('rallyTree resource lifetime', () => {
  let listeners: ReturnType<typeof trackMousemove>;
  beforeEach(() => {
    listeners = trackMousemove();
  });
  afterEach(() => {
    listeners.restore();
    document.body.innerHTML = '';
  });

  it('keeps one stat-bar mousemove listener however many times it updates', () => {
    const { chart } = mountRallyTree();
    for (let i = 0; i < 5; i++) chart.update();
    expect(listeners.net()).toBe(1);
  });

  it('destroy removes the listener and its tooltip, and is idempotent', () => {
    const { chart } = mountRallyTree();
    chart.update();
    const tooltipsBefore = document.querySelectorAll('[data-tippy-root]').length;

    chart.destroy();
    chart.destroy();

    expect(listeners.net()).toBe(0);
    expect(document.querySelectorAll('[data-tippy-root]').length).toBeLessThanOrEqual(tooltipsBefore);
  });
});

describe('matchUpDashboard deferred work', () => {
  let frames: Map<number, FrameRequestCallback>;
  let nextFrame: number;
  beforeEach(() => {
    frames = new Map();
    nextFrame = 1;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.set(nextFrame, callback);
      return nextFrame++;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  function mountDashboard() {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const dashboard: any = matchUpDashboard();
    dashboard(container);
    return dashboard;
  }

  it('destroy before the frame cancels the pending render', () => {
    const dashboard = mountDashboard();
    dashboard.update();
    expect(frames.size).toBe(1);
    dashboard.destroy();
    expect(frames.size).toBe(0);
  });

  it('an update after destroy schedules nothing', () => {
    const dashboard = mountDashboard();
    dashboard.destroy();
    dashboard.update();
    expect(frames.size).toBe(0);
  });

  it('repeated updates before a frame leave one pending render', () => {
    const dashboard = mountDashboard();
    dashboard.update();
    dashboard.update();
    dashboard.update();
    expect(frames.size).toBe(1);
  });
});
