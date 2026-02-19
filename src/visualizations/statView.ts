/**
 * StatView — Match statistics bar chart (D3 v7)
 *
 * Renders an SVG "table" — one row per stat: name centered, player values
 * on left/right, horizontal bars showing relative proportions.
 *
 * Ported from legacy statView.js to D3 v7 TypeScript.
 */

import { select, scaleLinear } from 'd3';
import { buildEpisodes } from '../episodes/buildEpisodes';
import { computeMatchStats, type StatObject } from '../statistics/matchStatistics';
import { keyWalk } from './utils/keyWalk';

interface StatViewOptions {
  id: string;
  width: number;
  height: number;
  rowHeight: number;
  margins: { top: number; bottom: number; left: number; right: number };
  display: {
    sizeToFit: { width: boolean; height: boolean };
    transition_time: number;
  };
  colors: { players: { 0: string; 1: string } };
}

function chart_width(opts: StatViewOptions): number {
  return opts.width - opts.margins.left - opts.margins.right;
}

function chart_rowHeight(opts: StatViewOptions): number {
  return opts.rowHeight - opts.margins.top - opts.margins.bottom;
}

export function statView() {
  let data: StatObject[] = [];
  let updateFn: ((opts?: any) => void) | undefined;

  const options: StatViewOptions = {
    id: 'sv',
    width: 400,
    height: 300,
    rowHeight: 30,
    margins: { top: 2, bottom: 2, left: 10, right: 10 },
    display: {
      sizeToFit: { width: true, height: false },
      transition_time: 300,
    },
    colors: {
      players: { 0: '#a55194', 1: '#6b6ecf' },
    },
  };

  const events = {
    update: { begin: null as (() => void) | null, end: null as (() => void) | null },
  };

  function chart(selection: any) {
    selection.each(function (_: any, i: number, n: any) {
      const domParent = select(n[i]);
      const root = domParent.append('div').attr('id', options.id);

      updateFn = function (opts?: any) {
        const fData = data.filter((d) => d.numerator && (d.numerator[0] || d.numerator[1]));

        if (options.display.sizeToFit.width || (opts && opts.sizeToFit && opts.sizeToFit.width)) {
          const dims = domParent.node()?.getBoundingClientRect();
          if (dims) options.width = Math.max(dims.width, 100);
        }

        const w = chart_width(options);
        const rh = chart_rowHeight(options);
        const fontSize = rh * 0.5;

        // Row containers — one <svg> per stat
        const itemContainer = root.selectAll<SVGSVGElement, StatObject>('svg')
          .data(fData, (d: StatObject) => d.name);

        itemContainer.exit().remove();

        const itemEnter = itemContainer.enter().append('svg');

        const items = itemEnter.merge(itemContainer)
          .attr('width', options.width)
          .attr('height', options.rowHeight);

        // Group per row
        const item = items.selectAll<SVGGElement, StatObject>('g.stat-row')
          .data((d) => [d]);

        const itemGEnter = item.enter().append('g').attr('class', 'stat-row');
        const itemG = itemGEnter.merge(item)
          .attr('width', options.width)
          .attr('height', rh)
          .attr('transform', `translate(${options.margins.left},${options.margins.top})`);

        // ── Text elements ──────────────────────────────────────

        function formatValue(d: StatObject, playerIdx: 0 | 1): string {
          const num = d.numerator?.[playerIdx] ?? '';
          const den = d.denominator?.[playerIdx];
          const pctVal = d.pct?.[playerIdx];

          let text = den !== undefined ? `${num}/${den}` : `${num}`;

          if (pctVal !== undefined) {
            text = w > 400 ? `${Math.round(pctVal)}% (${text})` : `${Math.round(pctVal)}%`;
          }

          return text;
        }

        function buildTextData(d: StatObject): Array<{ text: string; anchor: string; x: number }> {
          return [
            { text: d.name, anchor: 'middle', x: options.width / 2 },
            { text: formatValue(d, 0), anchor: 'start', x: 0 },
            { text: formatValue(d, 1), anchor: 'end', x: w },
          ];
        }

        const textSel = itemG.selectAll<SVGTextElement, { text: string; anchor: string; x: number }>('text')
          .data(buildTextData);

        textSel.exit().remove();

        textSel.enter().append('text')
          .merge(textSel)
          .text((d) => d.text)
          .style('text-anchor', (d) => d.anchor)
          .style('dominant-baseline', 'middle')
          .style('font-size', `${fontSize}px`)
          .style('fill', 'black')
          .attr('transform', (d) => `translate(${d.x},${options.rowHeight / 4})`);

        // ── Bars ───────────────────────────────────────────────

        const barScale = scaleLinear().domain([0, 100]).range([0, w]);

        function calcBarData(d: StatObject): number[] {
          if (d.numerator !== undefined) {
            const total = d.numerator[0] + d.numerator[1];
            if (total !== 0) {
              let pct1 = parseFloat((d.numerator[0] / total).toFixed(1)) * 100;
              pct1 = pct1 > 100 ? 100 : pct1;
              const pct2 = 100 - (!isNaN(pct1) ? pct1 : 0);
              if (d.numerator[0] < 0 && d.numerator[1] < 0) {
                return [pct2, pct1];
              }
              return [pct1, pct2];
            } else if (d.numerator[0] > d.numerator[1]) {
              return [100, 0];
            } else if (d.numerator[1] > d.numerator[0]) {
              return [0, 100];
            }
          }
          return [];
        }

        const barSel = itemG.selectAll<SVGRectElement, number>('rect')
          .data(calcBarData);

        barSel.exit().remove();

        barSel.enter().append('rect')
          .merge(barSel)
          .transition()
          .duration(options.display.transition_time)
          .attr('width', (d) => {
            const s = !isNaN(d) ? barScale(d) : 0;
            return s < 0 || isNaN(s) ? 0 : s;
          })
          .attr('height', rh / 2)
          .attr('fill', (_d, idx) => options.colors.players[idx as 0 | 1])
          .attr('transform', (d, idx) => {
            const xoff = idx ? w - barScale(d) : 0;
            return `translate(${!isNaN(xoff) ? xoff : 0},${options.rowHeight / 2})`;
          });
      };
    });
  }

  // ── Accessors ──────────────────────────────────────────────────

  chart.options = function (values?: Record<string, any>) {
    if (!arguments.length) return options;
    keyWalk(values, options);
    return chart;
  };

  chart.events = function (functions?: any) {
    if (!arguments.length) return events;
    keyWalk(functions, events);
    return chart;
  };

  chart.data = function (value?: StatObject[]) {
    if (!arguments.length) return data;
    data = value || [];
    return chart;
  };

  chart.matchUp = function (matchUpState: any) {
    const episodes = buildEpisodes(matchUpState);
    data = computeMatchStats(episodes);
    return chart;
  };

  chart.update = function (opts?: any) {
    if (events.update.begin) events.update.begin();
    if (typeof updateFn === 'function') updateFn(opts);
    setTimeout(() => {
      if (events.update.end) events.update.end();
    }, options.display.transition_time);
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

  chart.colors = function (playerColors?: [string, string]) {
    if (!arguments.length) return [options.colors.players[0], options.colors.players[1]];
    options.colors.players = { 0: playerColors![0], 1: playerColors![1] };
    return chart;
  };

  return chart;
}

