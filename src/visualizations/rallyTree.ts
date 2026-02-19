/* eslint-disable */
// @ts-nocheck
/**
 * Rally Tree - Migrated to D3 v7
 * Displays rally length distribution in a tree-like format
 * Shows how rally lengths are distributed by player and outcome
 */

import { max, scaleLinear, area, curveLinear, curveBasis } from 'd3';
import tippy, { Instance as TippyInstance, followCursor as followCursorPlugin } from 'tippy.js';
import { buildEpisodes } from '../episodes/buildEpisodes';
import { generateId } from './utils/generateId';

interface Point {
  winner: 0 | 1;
  result?: string;
  rally?: string;
  rallyLength?: number;
  rl?: [number, number]; // Rally length count per player
  i?: number; // Index
  hide?: boolean;
}

interface RallyTreeOptions {
  id: string;
  width: number;
  height: number;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  display: {
    sizeToFit: boolean;
  };
  orientation: 'horizontal' | 'vertical';
  data: {
    sort: boolean;
  };
  areas: {
    colors: { 0: string; 1: string };
    interpolation: string;
  };
  points: {
    colors: { [key: string]: string };
  };
  players?: [string, string];
}

export function rallyTree() {
  let points: Point[] = [];
  let ryl: number[][];
  let max0: number, max1: number;
  let maxRally: number;
  let maxLimb: number, widthScale: number, barSpacing: number, barHeight: number;
  let displayPct = true;
  let barPadding = 1;
  let cellPadding = 1;
  const transitionTime = 1000;
  let tippyInstances: TippyInstance[] = [];

  function destroyTooltips() {
    tippyInstances.forEach((t) => t.destroy());
    tippyInstances = [];
  }

  const options: RallyTreeOptions = {
    id: generateId(),
    width: 100,
    height: 100,
    margins: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    display: {
      sizeToFit: false,
    },
    orientation: 'horizontal',
    data: {
      sort: false,
    },
    areas: {
      colors: { 0: 'blue', 1: 'purple' },
      interpolation: 'linear',
    },
    points: {
      colors: {},
    },
  };

  const events = {
    pointbar: { mouseover: null, mouseout: null, click: null },
    statbar: { click: null },
    pctarea: { mouseover: null, mouseout: null },
    update: { begin: null, end: null },
    rallies: { none: null, display: null },
  };

  let rtroot: Selection<SVGSVGElement, any, any, any>;
  let rttree: Selection<SVGGElement, any, any, any>;
  let rtarea: Selection<SVGGElement, any, any, any>;
  let parentNode: Element | null = null;

  function chart(selection: Selection<any, any, any, any>) {
    parentNode = selection.node();
    const root = selection.append('div').attr('class', 'rallyRoot');

    rtroot = root
      .append('svg')
      .attr('class', 'rallyTree')
      .attr('height', options.orientation === 'horizontal' ? options.height : options.width)
      .attr('width', options.orientation === 'horizontal' ? options.width : options.height);

    rttree = rtroot.append('g').attr('class', 'rttree');
    rtarea = rtroot.append('g').attr('class', 'rtarea');

    chart.update = update;
  }

  function update(opts?: { sizeToFit?: boolean }) {
    destroyTooltips();

    // Calculate max rally length using D3 v7 max
    maxRally = max(points, (point) => {
      if (point.rallyLength != null) return point.rallyLength;
      return 0;
    }) || 0;

    if (maxRally < 3) {
      rtroot.selectAll('rect').remove();
      rtarea.selectAll('path').remove();
      rtarea.selectAll('line').remove();
      return;
    }

    if (options.display.sizeToFit || (opts && opts.sizeToFit)) {
      if (parentNode) {
        const dims = parentNode.getBoundingClientRect();
        if (dims.width > 0) options.width = dims.width;
        if (dims.height > 0) options.height = dims.height;
      }
      options.width = Math.max(options.width, 100);
      options.height = Math.max(options.height, 100);
    }

    if (points.length > 500) {
      barPadding = 0;
      cellPadding = 0;
    } else {
      barPadding = 1;
      cellPadding = 1;
    }

    // Track rally length counts
    ryl = [[], []];
    points.forEach((e, i) => {
      e.i = i;
      const rallyLen = e.rallyLength ?? 0;
      if (ryl[e.winner][rallyLen]) {
        ryl[e.winner][rallyLen] += 1;
      } else {
        ryl[e.winner][rallyLen] = 1;
      }
      e.rl = [ryl[0][rallyLen] || 0, ryl[1][rallyLen] || 0];
    });

    rtroot
      .transition()
      .duration(transitionTime)
      .attr('width', options.width)
      .attr('height', options.height);

    max0 = points.length ? (points.length === 1 ? points[0].rl![0] : max(points, (p) => p.rl![0])!) : 0;
    max1 = points.length ? (points.length === 1 ? points[0].rl![1] : max(points, (p) => p.rl![1])!) : 0;
    max0 = max0 || 0;
    max1 = max1 || 0;
    maxLimb = max0 + max1 + 1;
    widthScale = (options.orientation === 'horizontal' ? options.width : options.height) / maxLimb;
    barSpacing = (options.orientation === 'horizontal' ? options.height : options.width) / (maxRally + 1);
    barHeight = barSpacing - barPadding;

    // D3 v7: Use .join() instead of .enter().append().merge()
    // Point bars
    rttree.selectAll('rect.point-bar')
      .data(points)
      .join(
        // Enter
        enter => enter
          .append('rect')
          .attr('id', (d, i) => `cell_${options.id}_${i}`)
          .attr('class', 'point-bar')
          .attr('x', () => Math.random() * options.width)
          .attr('y', () => Math.random() * options.height)
          .attr('fill', (d) => options.points.colors[d.result || ''] || '#ccc')
          .attr('width', () => (options.orientation === 'horizontal' ? widthScale - cellPadding : barHeight))
          .attr('height', () => (options.orientation === 'horizontal' ? barHeight : widthScale - cellPadding))
          .on('mouseover', events.pointbar.mouseover as any)
          .on('mouseout', events.pointbar.mouseout as any)
          .on('click', events.pointbar.click as any)
          .call(enter => enter.transition()
            .duration(transitionTime)
            .style('opacity', 1)
            .attr('x', (d) => calcX(d))
            .attr('y', (d) => calcY(d))
          ),
        // Update
        update => update
          .call(update => update.transition()
            .duration(transitionTime)
            .attr('fill', (d) => options.points.colors[d.result || ''] || '#ccc')
            .style('opacity', (d) => (d.hide ? 0 : 1))
            .attr('x', (d) => calcX(d))
            .attr('y', (d) => calcY(d))
            .attr('width', () => (options.orientation === 'horizontal' ? widthScale - cellPadding : barHeight))
            .attr('height', () => (options.orientation === 'horizontal' ? barHeight : widthScale - cellPadding))
          )
      );

    // Point bar tooltips
    rttree.selectAll('rect.point-bar').each(function (d: Point) {
      const el = this as SVGRectElement;
      const name = options.players?.[d.winner] ?? (d.winner === 0 ? 'Player 1' : 'Player 2');
      const result = d.result || '';
      const rally = d.rallyLength ?? 0;
      tippyInstances.push(
        tippy(el, {
          content: `${name}: ${result} (rally: ${rally})`,
          allowHTML: false,
          delay: [200, 0],
          placement: 'top',
          appendTo: document.body,
        }),
      );
    });

    // Win percentage areas
    rtarea.selectAll('.pct-area')
      .data([0, 1])
      .join(
        enter => enter
          .append('path')
          .attr('id', (d) => `player${d}pctarea_${options.id}`)
          .attr('class', 'pct-area')
          .attr('opacity', 0)
          .style('pointer-events', 'none'),
        update => update
      )
      .attr('fill', (d) => options.areas.colors[d as 0 | 1])
      .attr('display', displayPct ? 'inline' : 'none')
      .transition()
      .delay(transitionTime)
      .attr('opacity', displayPct ? 0.2 : 0)
      .attr('d', (d) => calcArea(d as 0 | 1));

    // Center stat bar
    rtarea.selectAll('rect.stat-bar')
      .data([0])
      .join(
        enter => enter
          .append('rect')
          .attr('class', 'stat-bar')
          .style('opacity', 0.2)
          .attr('fill', 'blue')
      )
      .on('click', events.statbar.click as any)
      .transition()
      .duration(transitionTime)
      .style('opacity', 0.2)
      .attr('x', statbarX())
      .attr('y', statbarY())
      .attr('width', statbarWidth())
      .attr('height', statbarHeight());

    // Stat bar tooltip — shows rally length based on mouse position
    const statBarEl = rtarea.select('rect.stat-bar').node() as SVGRectElement;
    if (statBarEl) {
      const statTip = tippy(statBarEl, {
        content: '',
        followCursor: true,
        plugins: [followCursorPlugin],
        allowHTML: false,
        placement: 'right',
        appendTo: document.body,
      });
      tippyInstances.push(statTip);
      statBarEl.addEventListener('mousemove', (event: MouseEvent) => {
        const rect = statBarEl.getBoundingClientRect();
        let rallyLen: number;
        if (options.orientation === 'horizontal') {
          const relY = event.clientY - rect.top;
          rallyLen = Math.floor((relY / rect.height) * (maxRally + 1));
        } else {
          const relX = event.clientX - rect.left;
          rallyLen = Math.floor((relX / rect.width) * (maxRally + 1));
        }
        rallyLen = Math.max(0, Math.min(rallyLen, maxRally));
        statTip.setContent(`Rally length: ${rallyLen}`);
      });
    }
  }

  function rallyWinPct(player: 0 | 1): number[] {
    // Cumulative win percentage: for each rally length, compute the odds
    // that the player wins a point of AT LEAST that length. This matches
    // the "Persistence of Server Advantage" methodology (Jeff Sackmann).
    // Summing from each rally length onwards smooths the yo-yo effect
    // inherent in per-length calculations.
    const pct: number[] = [];
    const maxLen = maxRally || 20;

    for (let i = 0; i <= maxLen; i++) {
      let cumPlayed = 0;
      let cumWon = 0;
      for (let j = i; j <= maxLen; j++) {
        const p0 = ryl[0][j] || 0;
        const p1 = ryl[1][j] || 0;
        cumPlayed += p0 + p1;
        cumWon += ryl[player][j] || 0;
      }
      pct.push(cumPlayed > 0 ? (cumWon / cumPlayed) * 100 : 0);
    }

    return pct;
  }

  function calcArea(player: 0 | 1) {
    // D3 v7: Use curveLinear/curveBasis directly
    const curveType = options.areas.interpolation === 'linear' ? curveLinear : curveBasis;
    const pct = rallyWinPct(player);

    if (options.orientation === 'horizontal') {
      const xScale = scaleLinear()
        .range(player === 0 ? [max0 * widthScale, 0] : [(max0 + 1) * widthScale, options.width])
        .domain([0, 100]);

      const yScale = scaleLinear()
        .range([0, options.height])
        .domain([0, pct.length - 1]);

      return area<number>()
        .curve(curveType)
        .x1((d) => xScale(d))
        .x0(player === 0 ? max0 * widthScale : (max0 + 1) * widthScale)
        .y((d, i) => yScale(i))(pct);
    } else {
      const yScale = scaleLinear()
        .range(player === 0 ? [max0 * widthScale, 0] : [max0 * widthScale, options.height])
        .domain([0, 100]);

      const xScale = scaleLinear()
        .range([0, options.width])
        .domain([0, pct.length - 1]);

      return area<number>()
        .curve(curveType)
        .y1((d) => yScale(d))
        .y0(player === 0 ? max0 * widthScale : max0 * widthScale)
        .x((d, i) => xScale(i))(pct);
    }
  }

  function calcX(d: Point): number {
    const rallyLen = d.rallyLength ?? 0;
    if (d.winner === 0) {
      return options.orientation === 'horizontal'
        ? max0 * widthScale - (d.rl![0] || 0) * widthScale
        : rallyLen * barSpacing;
    } else {
      return options.orientation === 'horizontal'
        ? max0 * widthScale + (d.rl![1] || 0) * widthScale
        : rallyLen * barSpacing;
    }
  }

  function calcY(d: Point): number {
    const rallyLen = d.rallyLength ?? 0;
    if (d.winner === 0) {
      return options.orientation === 'horizontal'
        ? rallyLen * barSpacing
        : max0 * widthScale - (d.rl![0] || 0) * widthScale;
    } else {
      return options.orientation === 'horizontal'
        ? rallyLen * barSpacing
        : max0 * widthScale + (d.rl![1] || 0) * widthScale;
    }
  }

  function statbarX(): number {
    return options.orientation === 'horizontal' ? max0 * widthScale : 0;
  }

  function statbarY(): number {
    return options.orientation === 'horizontal' ? 0 : max0 * widthScale;
  }

  function statbarWidth(): number {
    return options.orientation === 'horizontal' ? widthScale - cellPadding : options.width;
  }

  function statbarHeight(): number {
    return options.orientation === 'horizontal' ? options.height : widthScale - cellPadding;
  }

  // ACCESSORS
  chart.options = function (values?: any) {
    if (!arguments.length) return options;
    const vKeys = Object.keys(values);
    const oKeys = Object.keys(options);
    for (let k = 0; k < vKeys.length; k++) {
      if (oKeys.indexOf(vKeys[k]) >= 0) {
        if (typeof options[vKeys[k]] === 'object') {
          const sKeys = Object.keys(values[vKeys[k]]);
          const osKeys = Object.keys(options[vKeys[k]]);
          for (let sk = 0; sk < sKeys.length; sk++) {
            if (osKeys.indexOf(sKeys[sk]) >= 0) {
              options[vKeys[k]][sKeys[sk]] = values[vKeys[k]][sKeys[sk]];
            }
          }
        } else {
          options[vKeys[k]] = values[vKeys[k]];
        }
      }
    }
    return chart;
  };

  chart.data = function (value?: Point[]) {
    if (!arguments.length) return points;
    points = value || [];
    return chart;
  };

  chart.matchUp = function (matchUpState: any) {
    const episodes = buildEpisodes(matchUpState);
    const pts: Point[] = episodes.map((ep) => ({
      winner: ep.point.winner as 0 | 1,
      result: ep.point.result,
      rallyLength: ep.point.rallyLength ?? 2,
    }));
    // Extract player names if available
    const sides = matchUpState?.sides;
    if (Array.isArray(sides) && sides.length === 2) {
      const getName = (side: any) => {
        const participant = side?.participant;
        if (participant?.participantName) return participant.participantName;
        const person = participant?.person;
        if (person) return [person.standardGivenName, person.standardFamilyName].filter(Boolean).join(' ');
        return undefined;
      };
      const n0 = getName(sides[0]);
      const n1 = getName(sides[1]);
      if (n0 && n1) options.players = [n0, n1];
    }
    chart.data(pts);
    return chart;
  };

  chart.events = function (value?: any) {
    if (!arguments.length) return events;
    if (typeof value !== 'undefined') {
      const vKeys = Object.keys(value);
      const eKeys = Object.keys(events);
      for (let k = 0; k < vKeys.length; k++) {
        if (eKeys.indexOf(vKeys[k]) >= 0) {
          const sKeys = Object.keys(value[vKeys[k]]);
          const esKeys = Object.keys(events[vKeys[k]]);
          for (let sk = 0; sk < sKeys.length; sk++) {
            if (esKeys.indexOf(sKeys[sk]) >= 0) {
              events[vKeys[k]][sKeys[sk]] = value[vKeys[k]][sKeys[sk]];
            }
          }
        }
      }
    }
    return chart;
  };

  chart.update = update;

  return chart;
}
