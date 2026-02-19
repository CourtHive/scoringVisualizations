/**
 * PtsHorizon — Multi-set horizon chart wrapper with D3 brush (D3 v7)
 *
 * Creates up to 5 horizonChart instances (one per set), manages end-to-end
 * layout, transforms buildSetMap() output into per-chart sdata, and overlays
 * a D3 brushX() for range selection.
 */

import { select, scaleLinear, brushX } from 'd3';
import { horizonChart } from './horizonChart';
import { buildSetMap, type SetMap } from '../engine/buildSetMap';
import { keyWalk } from './utils/keyWalk';

interface PtsHorizonOptions {
  id: string | number;
  width: number;
  height: number;
  margins: { spacing: number };
  position: { x: number; y: number };
  elements: { brush: boolean };
  display: {
    ppp: number | undefined;
    bands: number;
    mode: 'mirror' | 'offset';
    orientation: 'horizontal' | 'vertical';
    transition_time: number;
    interpolate: 'basis' | 'linear';
    sizeToFit: boolean;
  };
  bounds: { vRangeMax: number };
  color: {
    range: [string, string, string, string];
  };
}

interface PtsHorizonEvents {
  update: { begin: (() => void) | null; end: (() => void) | null };
  brush: { brushing: ((extent: [number, number]) => void) | null; start: ((extent: [number, number]) => void) | null; end: ((extent: [number, number]) => void) | null };
  chart: { click: ((d: any) => void) | null };
  mouseover: ((data: any) => void) | undefined;
  mouseout: ((data: any) => void) | undefined;
}

const MAX_SETS = 5;

export function ptsHorizon() {
  let data: any;
  let setMapData: SetMap[] = [];
  let updateFn: ((opts?: any) => void) | undefined;
  const horizonSets: any[] = [];

  const options: PtsHorizonOptions = {
    id: 0,
    width: 900,
    height: 80,
    margins: { spacing: 10 },
    position: { x: 0, y: 0 },
    elements: { brush: true },
    display: {
      ppp: undefined,
      bands: 3,
      mode: 'mirror',
      orientation: 'horizontal',
      transition_time: 0,
      interpolate: 'basis',
      sizeToFit: true,
    },
    bounds: { vRangeMax: 24 },
    color: {
      range: ['#6b6ecf', '#f0f0fa', '#f6edf4', '#a55194'],
    },
  };

  const events: PtsHorizonEvents = {
    update: { begin: null, end: null },
    brush: { brushing: null, start: null, end: null },
    chart: { click: null },
    mouseover: undefined,
    mouseout: undefined,
  };

  // Pre-create horizon chart instances
  const horizonCharts: ReturnType<typeof horizonChart>[] = [];
  for (let s = 0; s < MAX_SETS; s++) {
    horizonCharts.push(horizonChart());
  }

  function chart(selection: any) {
    selection.each(function (_: any, i: number, n: any) {
      const domParent = select(n[i]);
      const root = domParent.append('svg').attr('id', `ptsHorizon${options.id}`);

      for (let s = 0; s < MAX_SETS; s++) {
        horizonSets[s] = root.append('g').attr('id', `horizon${options.id}${s}`).style('display', 'none');
        horizonSets[s].call(horizonCharts[s]);
      }

      updateFn = function (opts?: any) {
        if (options.elements.brush) options.margins.spacing = 0;

        const horizontal = options.display.orientation === 'horizontal';

        if (options.display.sizeToFit || (opts && opts.sizeToFit)) {
          const dims = domParent.node()?.getBoundingClientRect();
          if (dims) {
            if (horizontal) {
              options.width = Math.max(dims.width, 100);
            } else {
              options.height = Math.max(dims.height, 80);
            }
          }
        }

        if (setMapData.length === 0) return;

        // Calculate pixels per point
        const totalPoints = setMapData.reduce((sum, sm) => sum + sm.p2sdiff.length, 0);
        if (totalPoints === 0) return;

        const pppRange = horizontal ? options.width : options.height;
        const ppp = (pppRange - setMapData.length * options.margins.spacing) / totalPoints;

        root.attr('id', `ptsHorizon${options.id}`).attr('width', options.width).attr('height', options.height);

        let xadd = 0;
        let yadd = 0;

        for (let s = 0; s < horizonCharts.length; s++) {
          if (setMapData[s]) {
            const sdata: [number, number][] = setMapData[s].p2sdiff.map((d, idx) => [idx + 1, d]);
            if (!sdata.length) continue;

            const hc = horizonCharts[s];
            hc.height(options.height);
            hc.width(options.width);
            hc.options({
              id: `${options.id}c${s}`,
              display: {
                ppp,
                bands: options.display.bands,
                orientation: options.display.orientation,
                interpolate: options.display.interpolate,
              },
              position: {
                x: options.position.x + xadd,
                y: options.position.y + yadd,
              },
              bounds: { vRangeMax: options.bounds.vRangeMax },
            });
            hc.events({
              chart: { click: events.chart.click ? (d: any) => events.chart.click!(d) : null },
              path: {
                mouseover: options.elements.brush ? null : events.mouseover ?? null,
                mouseout: options.elements.brush ? null : (events.mouseout as any) ?? null,
              },
            });
            hc.duration(options.display.transition_time);
            hc.colors(options.color.range);
            hc.mode(options.display.mode);
            hc.data(data);
            hc.sdata(sdata);
            hc.update();

            if (horizontal) {
              xadd += ppp * setMapData[s].p2sdiff.length + options.margins.spacing;
            } else {
              yadd += ppp * setMapData[s].p2sdiff.length + options.margins.spacing;
            }

            horizonSets[s].style('display', 'inline');
          } else {
            horizonSets[s].style('display', 'none');
          }
        }

        // Brush overlay
        if (options.elements.brush) {
          const brushScale = scaleLinear().domain([0, totalPoints]).range([0, options.width]);

          const brush = brushX()
            .extent([
              [0, 0],
              [options.width, options.height],
            ])
            .on('start', (event) => {
              if (!event.selection) return;
              const extent = event.selection.map((d: number) => brushScale.invert(d)) as [number, number];
              if (events.brush.start) events.brush.start(extent);
            })
            .on('brush', (event) => {
              if (!event.selection) return;
              const extent = event.selection.map((d: number) => brushScale.invert(d)) as [number, number];
              if (events.brush.brushing) events.brush.brushing(extent);
            })
            .on('end', (event) => {
              if (!event.selection) {
                // Brush cleared — emit full range
                if (events.brush.end) events.brush.end([0, totalPoints]);
                return;
              }
              const extent = event.selection.map((d: number) => brushScale.invert(d)) as [number, number];
              if (events.brush.end) events.brush.end(extent);
            });

          // Remove old brush, add new
          root.selectAll(`.brush${options.id}`).remove();

          root
            .append('g')
            .attr('class', `brush${options.id}`)
            .style('stroke', '#fff')
            .style('fill-opacity', 0.125)
            .style('shape-rendering', 'crispEdges')
            .call(brush);
        } else {
          root.selectAll(`.brush${options.id}`).remove();
        }
      };
    });
  }

  // Accessors

  chart.options = function (values?: Record<string, any>) {
    if (!arguments.length) return options;
    keyWalk(values, options);
    return chart;
  };

  chart.events = function (functions?: Partial<PtsHorizonEvents>) {
    if (!arguments.length) return events;
    keyWalk(functions, events);
    return chart;
  };

  chart.width = function (value?: number) {
    if (!arguments.length) return options.width;
    options.width = value!;
    return chart;
  };

  chart.height = function (value?: number) {
    if (!arguments.length) return options.height;
    options.height = value!;
    return chart;
  };

  chart.data = function (value?: any) {
    if (!arguments.length) return data;
    data = value;
    return chart;
  };

  chart.matchUp = function (state: any, players?: [string, string]) {
    data = state;
    setMapData = buildSetMap(state, players);
    return chart;
  };

  chart.update = function (opts?: any) {
    if (events.update.begin) events.update.begin();
    if (typeof updateFn === 'function') updateFn(opts);
    setTimeout(function () {
      if (events.update.end) events.update.end();
    }, options.display.transition_time);
  };

  chart.bands = function (value?: number) {
    if (!arguments.length) return options.display.bands;
    options.display.bands = +value!;
    return chart;
  };

  chart.mode = function (value?: string) {
    if (!arguments.length) return options.display.mode;
    options.display.mode = (value + '') as 'mirror' | 'offset';
    return chart;
  };

  chart.duration = function (value?: number) {
    if (!arguments.length) return options.display.transition_time;
    options.display.transition_time = +value!;
    return chart;
  };

  chart.orientation = function (value?: string) {
    if (!arguments.length) return options.display.orientation;
    options.display.orientation = (value + '') as 'horizontal' | 'vertical';
    return chart;
  };

  chart.colors = function (playerColors?: [string, string]) {
    if (!arguments.length) return [options.color.range[0], options.color.range[3]];
    options.color.range = [playerColors![0], '#f0f0f0', '#f0f0f0', playerColors![1]];
    return chart;
  };

  return chart;
}

/**
 * Companion function: render ptsHorizon directly from a ScoringEngine MatchUp.
 * Clears target container, creates chart, renders.
 */
export function ptsHorizonFromMatchUp(
  container: HTMLElement,
  matchUp: any,
  options?: {
    width?: number;
    height?: number;
    bands?: number;
    mode?: 'mirror' | 'offset';
    colors?: [string, string];
    players?: [string, string];
    showBrush?: boolean;
  },
): void {
  const rect = container.getBoundingClientRect();
  const width = options?.width ?? Math.max(rect.width, 200);
  const height = options?.height ?? 80;
  const players: [string, string] = options?.players ?? ['Player 1', 'Player 2'];

  // Clear previous SVG
  select(container).selectAll('svg').remove();

  const chart = ptsHorizon();
  chart.options({
    display: {
      sizeToFit: true,
      bands: options?.bands ?? 3,
      mode: options?.mode ?? 'mirror',
      transition_time: 0,
    },
    elements: { brush: options?.showBrush ?? false },
  });
  chart.width(width);
  chart.height(height);

  if (options?.colors) {
    chart.colors(options.colors);
  }

  chart.matchUp(matchUp, players);

  select(container).call(chart as any);
  chart.update();
}

