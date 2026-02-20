/* eslint-disable */
// @ts-nocheck
import { select, scaleLinear, scaleBand, range, line } from 'd3';
import { rallyCount } from './legacyRally';
import { buildEpisodes } from '../episodes/buildEpisodes';
import { keyWalk } from './utils/keyWalk';
import { generateId } from './utils/generateId';

function groupGames(point_episodes: any[]) {
  const episodes = point_episodes;

  const games: any = [{ points: [], range: [0, 0] }];
  let gameCounter = 0;
  let currentGame = 0;
  episodes.forEach((episode) => {
    const point = episode.point;
    if (point.game != currentGame) {
      gameCounter += 1;
      currentGame = point.game;
      games[gameCounter] = { points: [], range: [point.index, point.index] };
    }
    games[gameCounter].points.push(point);
    games[gameCounter].index = gameCounter;
    games[gameCounter].set = episode.set.index;
    games[gameCounter].score = episode.game.games;
    games[gameCounter].complete = episode.game.complete;
    games[gameCounter].range[1] = point.index;
    if (episode.game.complete) {
      games[gameCounter].winner = point.winner;
    }
  });
  return games;
}

function add_index(d: any[], i: number) {
  for (const item of d) {
    item['_i'] = i;
  }
  return d;
}

export function ptsMatch() {
  let match_data: any;
  let participantNames: [string, string] = ['Player 1', 'Player 2'];

  const options: any = {
    id: generateId(),
    class: 'ptsMatch',

    resize: true,
    width: 600,
    height: 80,
    maxHeight: 100,

    margins: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },

    set: {
      averagePoints: 56,
    },

    lines: {
      width: 2,
      interpolation: 'linear',
    },

    points: {
      maxWidthPoints: 100,
    },

    score: {
      font: 'Arial',
      fontSize: '12px',
      fontWeight: 'bold',
      reverse: true,
    },

    header: {
      font: 'Arial',
      fontSize: '14px',
      fontWeight: 'bold',
    },

    display: {
      sizeToFit: true,
      transitionTime: 0,
      pointHighlighting: true,
      pointOpacity: 0.4,
      winErrHighlight: true,
      gameHighlighting: true,
      gameOpacity: 0.2,
      gameBoundaries: true,
      gamepoints: false,
      score: true,
      points: true,
      winner: true,
    },

    colors: {
      orientation: 'yellow',
      gamepoints: 'black',
      players: { 0: '#a55194', 1: '#6b6ecf' },
    },
  };

  // functions which should be accessible via ACCESSORS
  let update: any;

  // programmatic
  const pts_sets: any[] = [];
  let dom_parent: Selection<any, any, any, any>;

  // prepare charts
  const pts_charts: any[] = [];
  for (let s = 0; s < 5; s++) {
    pts_charts.push(ptsChart());
  }

  // DEFINABLE EVENTS
  // Define with ACCESSOR function chart.events()
  const events: any = {
    update: { begin: null, end: null },
    setBox: { mouseover: null, mouseout: null },
    pointBars: { mouseover: null, mouseout: null, click: null },
  };

  function chart(selection: any) {
    dom_parent = selection;

    if (options.display.sizeToFit) {
      const dims = selection.node().getBoundingClientRect();
      options.width = Math.max(dims.width, 400);
    }

    // append svg
    const root = dom_parent
      .append('div')
      .attr('class', options.class + 'root')
      .style('width', options.width + 'px')
      .style('height', options.height + 'px');

    for (let s = 0; s < 5; s++) {
      pts_sets[s] = root.append('div').attr('class', 'pts').style('display', 'none');
      pts_sets[s].call(pts_charts[s]);
    }

    update = function (opts?: any) {
      const sets = match_data.sets();

      if (options.display.sizeToFit || opts?.sizeToFit) {
        const dims = selection.node().getBoundingClientRect();
        options.width = Math.max(dims.width, 400);
        options.height = Math.max((dims.height - (+options.margins.top + +options.margins.bottom)) / sets.length, 20);
        if (options.height > options.maxHeight) options.height = options.maxHeight;
      }

      let true_height = 0;
      for (let s = 0; s < pts_charts.length; s++) {
        if (sets?.[s]?.history.points().length) {
          pts_sets[s].style('display', 'inline');
          pts_charts[s].width(options.width);
          pts_charts[s].height(options.height);
          pts_charts[s].update();
          true_height += +options.height + 5;
        } else {
          pts_sets[s].style('display', 'none');
        }
      }

      root.style('width', options.width + 'px').style('height', true_height + 'px');
    };
  }

  // ACCESSORS

  // allows updating individual options and suboptions
  // while preserving state of other options
  chart.options = function (values: any) {
    if (!arguments.length) return options;
    keyWalk(values, options);
    if (values.events) keyWalk(values.events, events);
    return chart;
  };

  chart.events = function (functions: any) {
    if (!arguments.length) return events;
    keyWalk(functions, events);
    return chart;
  };

  chart.colors = function (colores: any) {
    if (!arguments.length) return options.colors;
    options.colors.players = colores;
    return chart;
  };

  chart.width = function (value: any) {
    if (!arguments.length) return options.width;
    options.width = value;
    if (typeof update === 'function') update(true);
    pts_charts.forEach(function (e) {
      e.width(value);
    });
    return chart;
  };

  chart.height = function (value: any) {
    if (!arguments.length) return options.height;
    options.height = value;
    if (typeof update === 'function') update(true);
    pts_charts.forEach(function (e) {
      e.height(value);
    });
    return chart;
  };

  chart.duration = function (value: any) {
    if (!arguments.length) return options.display.transitionTime;
    options.display.transitionTime = value;
    return chart;
  };

  chart.update = function (opts?: any) {
    if (!match_data) {
      return false;
    }

    if (events.update.begin) events.update.begin();

    const sets = match_data.sets();

    if (!sets || sets.length === 0) {
      return false;
    }

    const maxWidthPoints = Math.max(
      ...sets.map((set: any, index: number) => {
        if (!set?.history?.points) {
          return 0;
        }

        const setPoints = set.history.points();
        const filtered = setPoints.filter((f: any) => f.set == index);
        return filtered.length;
      }),
    );

    if (sets.length > 1) chart.options({ points: { maxWidthPoints } });

    sets.forEach(function (set: any, i: number) {
      pts_charts[i].data(set);
      pts_charts[i].options({ id: `${options.id}_${i}`, setIndex: i });
      pts_charts[i].options({
        lines: options.lines,
        points: options.points,
        score: options.score,
        header: options.header,
      });
      pts_charts[i].options({ set: options.set, display: options.display, colors: options.colors });
      pts_charts[i].events(events);
      pts_charts[i].width(options.width).height(options.height).update(opts);
    });

    if (typeof update === 'function') update(opts);
    setTimeout(function () {
      if (events.update.end) events.update.end();
    }, options.display.transitionTime);
    return true;
  };

  chart.data = function (matchObjectOrEpisodes: any) {
    if (!arguments.length) {
      return match_data;
    }

    // Support both UMO objects (for main app) and episode arrays (for standalone)
    if (Array.isArray(matchObjectOrEpisodes)) {
      const episodes = matchObjectOrEpisodes;

      // Plain array of episodes - create simple accessor object
      match_data = {
        sets: () => {
          // Group episodes by set
          const setsMap = new Map();
          episodes.forEach((ep: any) => {
            const setIndex = ep.set?.index ?? 0;
            if (!setsMap.has(setIndex)) {
              setsMap.set(setIndex, []);
            }
            setsMap.get(setIndex).push(ep);
          });

          // Return array of set objects with all required accessors for ptsSet
          return Array.from(setsMap.values()).map((episodes: any[], _setIndex: number) => {
            const points = episodes.map((ep: any) => ep.point);
            const lastEpisode = episodes[episodes.length - 1];
            const isComplete = lastEpisode?.set?.complete ?? false;

            return {
              history: {
                points: () => points,
                action: (actionType: string) => (actionType === 'addPoint' ? episodes : []),
              },
              complete: () => isComplete,
              winner: () => {
                // Determine winner based on game score if set is complete
                if (isComplete) {
                  const games = lastEpisode?.game?.games || [0, 0];
                  if (games[0] > games[1]) return 0;
                  if (games[1] > games[0]) return 1;
                }
                return undefined;
              },
              metadata: {
                players: () => {
                  const name0 = participantNames[0];
                  const name1 = participantNames[1];
                  const parts0 = name0.split(' ');
                  const parts1 = name1.split(' ');
                  return [
                    {
                      index: 0,
                      firstName: parts0[0] || name0,
                      lastName: parts0.slice(1).join(' ') || '0',
                      participantName: name0,
                    },
                    {
                      index: 1,
                      firstName: parts1[0] || name1,
                      lastName: parts1.slice(1).join(' ') || '1',
                      participantName: name1,
                    },
                  ];
                },
              },
              scoreboard: (_perspective?: any) => {
                const games = lastEpisode?.game?.games || [0, 0];
                return `${games[0]}-${games[1]}`;
              },
            };
          });
        },
        history: {
          points: () => matchObjectOrEpisodes.map((ep: any) => ep.point),
          action: (actionType: string) => (actionType === 'addPoint' ? matchObjectOrEpisodes : []),
        },
      };
    } else {
      // UMO object - use as-is
      match_data = matchObjectOrEpisodes;
    }

    // Only call update if chart has been initialized (dom_parent exists)
    if (dom_parent) {
      chart.update();
    }

    return chart;
  };

  chart.players = function (names: [string, string]) {
    participantNames = names;
    return chart;
  };

  chart.matchUp = function (matchUpState: any, names?: [string, string]) {
    if (names) participantNames = names;
    const episodes = buildEpisodes(matchUpState);
    chart.data(episodes);
    return chart;
  };

  return chart;
}

function ptsChart() {
  let set_data: any;

  let game_data: any;
  let pointsToSet: any;

  const winners = new Set(['Ace', 'Winner', 'Serve Winner']);
  const errors = new Set(['Forced Error', 'Unforced Error', 'Double Fault', 'Penalty', 'Out', 'Net']);

  const options: {
    [key: string]: any;
    id: string;
    setIndex: number;
    class: string;
    resize: boolean;
    width: number;
    height: number;
    margins: { top: number; right: number; bottom: number; left: number };
    set: { averagePoints: number };
    lines: { width: number; interpolation: string };
    points: { maxWidthPoints: number };
    score: { font: string; fontSize: string; fontWeight: string; reverse: boolean };
    header: { font: string; fontSize: string; fontWeight: string };
    display: {
      transitionTime: number;
      pointHighlighting: boolean;
      pointOpacity: number;
      winErrHighlight: boolean;
      gameHighlighting: boolean;
      gameOpacity: number;
      gameBoundaries: boolean;
      gamepoints: boolean;
      score: boolean;
      points: boolean;
      winner: boolean;
    };
    colors: {
      orientation: string;
      gamepoints: string;
      players: { [key: number]: string };
    };
  } = {
    id: generateId(),
    setIndex: 0,
    class: 'ptsChart',

    resize: true,
    width: 600,
    height: 80,

    margins: {
      top: 5,
      right: 15,
      bottom: 5,
      left: 5,
    },

    set: {
      averagePoints: 56,
    },

    lines: {
      width: 2,
      interpolation: 'linear',
    },

    points: {
      maxWidthPoints: 100,
    },

    score: {
      font: 'Arial',
      fontSize: '12px',
      fontWeight: 'bold',
      reverse: true,
    },

    header: {
      font: 'Arial',
      fontSize: '14px',
      fontWeight: 'bold',
    },

    display: {
      transitionTime: 0,
      pointHighlighting: true,
      pointOpacity: 0.4,
      winErrHighlight: true,
      gameHighlighting: true,
      gameOpacity: 0.2,
      gameBoundaries: false,
      gamepoints: false,
      score: true,
      points: true,
      winner: true,
    },

    colors: {
      orientation: 'yellow',
      gamepoints: 'black',
      players: { 0: 'blue', 1: 'purple' },
    },
  };

  // functions which should be accessible via ACCESSORS
  let update: ((opts?: any, resize?: boolean) => void) | undefined;

  // programmatic
  let dom_parent;

  // DEFINABLE EVENTS
  // Define with ACCESSOR function chart.events()
  const events: {
    setBox: { mouseover: ((d: any, i: number) => void) | null; mouseout: ((d: any, i: number) => void) | null };
    update: { begin: (() => void) | null; end: (() => void) | null };
    pointBars: {
      mouseover: ((d: any, i: number) => void) | null;
      mouseout: ((d: any, i: number) => void) | null;
      click: ((d: any, i: number, n: Node) => void) | null;
    };
    [key: string]: any;
  } = {
    setBox: { mouseover: null, mouseout: null },
    update: { begin: null, end: null },
    pointBars: { mouseover: null, mouseout: null, click: null },
  };

  function chart(selection: any) {
    selection.each(function (_: any, i: number, n: any) {
      dom_parent = select(n[i]);

      // append svg
      const root = dom_parent
        .append('svg')
        .attr('class', options.class + 'root')
        .style('width', options.width + 'px')
        .style('height', options.height + 'px');

      // append children g
      const pts = root
        .append('g')
        .attr('class', options.class + 'pts')
        .attr('transform', 'translate(5, 5)');

      // For Point Bars which must always be on top
      const ptsHover = root
        .append('g')
        .attr('class', options.class + 'pts')
        .attr('transform', 'translate(5, 5)');

      // append labels
      const set_winner = pts
        .append('text')
        .attr('class', options.class + 'Header')
        .attr('opacity', 0)
        .attr('font-size', options.header.fontSize)
        .attr('font-weight', options.header.fontWeight)
        .attr('x', function () {
          return options.margins.left + 'px';
        })
        .attr('y', function () {
          return options.margins.top + 8 + 'px';
        });

      const set_score = pts
        .append('text')
        .attr('class', options.class + 'Score')
        .attr('opacity', 0)
        .attr('font-size', options.score.fontSize)
        .attr('font-weight', options.score.fontWeight)
        .attr('x', function () {
          return options.margins.left + 'px';
        })
        .attr('y', function () {
          return options.margins.top + 20 + 'px';
        });

      // resize used to disable transitions during resize operation
      update = function (_: any, resize?: boolean) {
        if (!set_data) {
          return false;
        }

        root
          .transition()
          .duration(options.display.transitionTime)
          .style('width', options.width + 'px')
          .style('height', options.height + 'px');

        const allActionPoints = set_data.history.action('addPoint');
        const points = allActionPoints.filter((f: any) => f.point.set == options.setIndex);

        if (!points || points.length === 0) {
          return false;
        }

        const range_start = points[0].point.index;

        game_data = groupGames(points);
        pointsToSet = points.map((p: any) => p.needed?.pointsToSet);
        const pts_max = Math.max(
          ...[].concat(
            pointsToSet.map((p: number[]) => p[0]),
            pointsToSet.map((p: number[]) => p[1]),
          ),
        );
        const pts_start = Math.max(...pointsToSet[0]);

        // add pts prior to first point
        pointsToSet.unshift([pts_start, pts_start]);

        const longest_rally =
          Math.max.apply(
            null,
            points.map((m: any) => {
              // Prefer rallyLength if available, fallback to rally
              const rallyValue = m.point.rallyLength || (m.point.rally ? rallyCount(m.point.rally) : 0);
              return rallyValue;
            }),
          ) + 2;

        displayScore(resize);

        const xScale = scaleLinear()
          .domain([0, calcWidth()])
          .range([0, options.width - (options.margins.left + options.margins.right)]);

        function pointScale(d: any, r: number, a: number) {
          if (d.range[r] < range_start) return xScale(d.range[r] + a);
          return xScale(d.range[r] + a - range_start);
        }

        const yScale = scaleLinear()
          .range([options.height - (options.margins.top + options.margins.bottom), options.margins.bottom])
          .domain([-2, pts_max - 1]);

        // Set Box
        pts.selectAll('.' + options.class + 'SetBox').data([options.id]) // # of list elements only used for index, data not important
          .join(
            enter => enter
              .append('rect')
              .attr('class', options.class + 'SetBox')
              .style('position', 'relative')
              .attr('stroke', 'black')
              .attr('stroke-width', 1)
              .attr('fill', 'none')
              .on('mouseover', (d: any, i: number) => {
                if (events.setBox.mouseover) events.setBox.mouseover(d, i);
              })
              .on('mouseout', (d: any, i: number) => {
                if (events.setBox.mouseout) events.setBox.mouseout(d, i);
              }),
            update => update,
            exit => exit
              .transition()
              .duration(resize ? 0 : options.display.transitionTime)
              .style('opacity', 0)
              .remove()
          )
          .transition()
          .duration(resize ? 0 : options.display.transitionTime)
          .attr('height', () => {
            return options.height - (options.margins.top + options.margins.bottom);
          })
          .attr('width', () => {
            return xScale(boxWidth() + 1);
          });

        // Game Boundaries
        pts.selectAll('.' + options.class + 'GameBoundary').data(game_data)
          .join(
            enter => enter.append('rect').attr('class', options.class + 'GameBoundary'),
          )
          .attr('id', function (_: any, i: number) {
            return options.class + options.id + 'boundary' + i;
          })
          .transition()
          .duration(resize ? 0 : options.display.transitionTime)
          .attr('opacity', function () {
            return options.display.gameBoundaries ? 0.02 : 0;
          })
          .attr('transform', function (d: any) {
            return 'translate(' + pointScale(d, 0, 0) + ', 0)';
          })
          .attr('height', yScale(-2))
          .attr('width', function (d: any) {
            return pointScale(d, 1, 1) - pointScale(d, 0, 0);
          })
          .attr('stroke', 'black')
          .attr('stroke-width', 1)
          .attr('fill', 'none');

        // Game Boxes
        pts.selectAll('.' + options.class + 'Game').data(game_data)
          .join(
            enter => enter.append('rect').attr('class', options.class + 'Game'),
          )
          .attr('id', (_: any, i: number) => {
            return options.class + options.id + 'game' + i;
          })
          .transition()
          .duration(resize ? 0 : options.display.transitionTime)
          .attr('opacity', () => {
            return options.display.gameBoundaries ? 0.02 : 0;
          })
          .attr('transform', (d: any) => {
            return 'translate(' + pointScale(d, 0, 0) + ', 0)';
          })
          .attr('height', yScale(-2))
          .attr('width', (d: any) => {
            return pointScale(d, 1, 1) - pointScale(d, 0, 0);
          })
          .attr('stroke', (d: any) => {
            return options.colors.players[d.winner];
          })
          .attr('stroke-width', 1)
          .attr('fill', (d: any) => {
            return d.winner === undefined ? 'none' : options.colors.players[d.winner];
          });

        // Player PTS Lines
        const lineGen = line()
          .x((_: any, i: number) => {
            return xScale(i);
          })
          .y((d: number) => {
            return yScale(pts_max - d);
          });

        pts.selectAll('.' + options.class + 'Line').data([0, 1])
          .join(
            enter => enter
              .append('path')
              .attr('class', options.class + 'Line')
              .attr('fill', 'none'),
          )
          .attr('id', (d: any) => {
            return options.class + options.id + 'player' + d + 'Line';
          })
          .transition()
          .duration(resize ? 0 : options.display.transitionTime / 2)
          .style('opacity', 0.1)
          .transition()
          .duration(resize ? 0 : options.display.transitionTime / 2)
          .style('opacity', 1)
          .attr('stroke', (d: any) => {
            return options.colors.players[d];
          })
          .attr('stroke-width', () => {
            return options.lines.width;
          })
          // .attr('d', function(d: any) { return lineGen(player_data[d]) })
          .attr('d', (d: any) => {
            return lineGen(pointsToSet.map((p: any) => p[d]));
          });

        const bp_data = [
          pointsToSet.map((p: any) => {
            return { pts: p[0] };
          }),
          pointsToSet.map((p: any) => {
            return { pts: p[1] };
          }),
        ];
        const bp_wrappers = pts.selectAll('.' + options.class + 'BPWrapper').data(bp_data)
          .join(
            enter => enter.append('g').attr('class', options.class + 'BPWrapper'),
          );

        bp_wrappers.selectAll('.' + options.class + 'Breakpoint').data((d: any, i: number) => {
          return add_index(d, i);
        })
          .join(
            enter => enter
              .append('circle')
              .attr('class', options.class + 'Breakpoint')
              .attr('opacity', '0'),
            update => update,
            exit => exit.attr('opacity', '0').remove()
          )
          .transition()
          .duration(resize ? 0 : options.display.transitionTime / 2)
          .style('opacity', 0)
          .transition()
          .duration(resize ? 0 : options.display.transitionTime / 2)
          .attr('fill', (d: any, i: any) => {
            if (points[i - 1] && points[i - 1].point.isBreakpoint != undefined) {
              return options.colors.players[d._i];
            }
          })
          .style('opacity', (d: any, i: any) => {
            if (points[i - 1] && points[i - 1].point.isBreakpoint != undefined) {
              // return points[i - 1].point.isBreakpoint == d._i ? 1 : 0
              return points[i - 1].point.server == 1 - d._i ? 1 : 0;
            }
          })
          .attr('cx', (_: any, i: number) => {
            return xScale(i);
          })
          .attr('cy', (d: any) => {
            return yScale(pts_max - d.pts);
          })
          .attr('r', 2);

        const points_index = range(points.length);
        const barsX = scaleBand()
          .domain(points_index)
          .range([0, xScale(points.length)])
          .round(true);

        const bX = scaleLinear()
          .domain([0, points.length])
          .range([0, xScale(points.length)]);

        // gradients cause hover errors when data is replaced
        pts.selectAll('.gradient' + options.id).remove();

        const gradients = pts.selectAll('.gradient' + options.id).data(range(points.length)) // data not important, only length of array
          .join(
            enter => enter
              .append('linearGradient')
              .attr('id', (_: any, i: number) => {
                return 'gradient' + options.id + i;
              })
              .attr('class', () => {
                return 'gradient' + options.id;
              })
              .attr('gradientUnits', 'userSpaceOnUse')
              .attr('x1', () => {
                return barsX.bandwidth() / 2;
              })
              .attr('y1', () => {
                return 0;
              })
              .attr('x2', () => {
                return barsX.bandwidth() / 2;
              })
              .attr('y2', () => {
                return yScale(-2);
              }),
          )
          .attr('transform', (_: any, i: number) => {
            return 'translate(' + bX(i) + ', 0)';
          });

        gradients.selectAll('.points_stop').data((d: any) => {
          return calcStops(points[d].point);
        })
          .join(
            enter => enter.append('stop').attr('class', 'points_stop'),
          )
          .attr('offset', (d: any) => {
            return d.offset;
          })
          .attr('stop-color', (d: any) => {
            return d.color;
          });

        // Pre-compute point-index → game-index lookup for O(1) hover
        const pointToGame: Record<number, number> = {};
        game_data.forEach((g: any, gi: number) => {
          g.points.forEach((p: any) => { pointToGame[p.index] = gi; });
        });

        ptsHover.selectAll('.' + options.class + 'Bar').data(range(points.length)) // data not important, only length of array
          .join(
            enter => enter
              .append('line')
              .attr('class', options.class + 'Bar')
              .attr('opacity', '0')
              .style('pointer-events', 'all')
              .on('mouseover', function(event: any, d: any) {
                const i = d; // In D3 v7, d is the datum (index in this case)
                if (options.display.pointHighlighting) {
                  select(this).attr('opacity', options.display.pointOpacity);
                }
                if (options.display.gameHighlighting && points[i]) {
                  const gameIndex = pointToGame[points[i].point.index];
                  if (gameIndex >= 0) {
                    pts.select('[id="' + options.class + options.id + 'game' + gameIndex + '"]').attr(
                      'opacity',
                      options.display.gameOpacity,
                    );
                  }
                }
                if (events.pointBars.mouseover) {
                  events.pointBars.mouseover(points[i], i);
                }
                if (i == 0) {
                  ptsHover.selectAll('.' + options.class + 'Bar').attr('opacity', options.display.pointOpacity);
                }
                highlightScore(i);
              })
              .on('mouseout', function(event: any, d: any) {
                const i = d;
                ptsHover.selectAll('.' + options.class + 'Bar').attr('opacity', 0);
                pts.selectAll('.' + options.class + 'Game').attr('opacity', '0');
                if (events.pointBars.mouseout) {
                  events.pointBars.mouseout(points[i], i);
                }
                displayScore();
              })
              .on('click', function(event: any, d: any) {
                const i = d;
                if (events.pointBars.click) {
                  events.pointBars.click(points[d], i, (n as any)[i]);
                }
              }),
            update => update,
            exit => exit
              .transition()
              .duration(resize ? 0 : options.display.transitionTime)
              .attr('opacity', '0')
              .remove()
          )
          .attr('opacity', () => {
            const opacity = options.display.winErrHighlight ? '.4' : '0';
            return opacity;
          })
          .attr('transform', (_: any, i: number) => {
            return 'translate(' + bX(i) + ', 0)';
          })
          .attr('x1', () => {
            return barsX.bandwidth() / 2;
          })
          .attr('y1', () => {
            const y1 = 0;
            return y1;
          })
          .attr('x2', () => {
            return barsX.bandwidth() / 2;
          })
          .attr('y2', () => {
            const y2 = yScale(-2);
            return y2;
          })
          .attr('stroke-width', () => {
            const width = barsX.bandwidth();
            return width;
          })
          .attr('stroke', (_: any, i: number) => {
            return 'url(#gradient' + options.id + i + ')';
          })
          .attr('uid', (_: any, i: number) => {
            return 'point' + i;
          });

        function displayScore(resize?: boolean) {
          const winner = set_data.winner();
          const players = set_data.metadata.players();
          function lastName(name: string) {
            const split = name.split(' ');
            return split[split.length - 1];
          }
          const legend =
            winner === undefined
              ? `${lastName(players[0].participantName)}/${lastName(players[1].participantName)}`
              : players[winner].participantName;

          set_winner
            .transition()
            .duration(resize ? 0 : options.display.transitionTime)
            .attr('opacity', 1)
            .attr('fill', winner === undefined ? 'black' : options.colors.players[winner])
            .text(legend);

          const game_score = set_data.scoreboard(winner);
          set_score
            .transition()
            .duration(resize ? 0 : options.display.transitionTime)
            .attr('opacity', 1)
            .attr('fill', winner === undefined ? 'black' : options.colors.players[winner])
            .text(game_score);
        }

        function highlightScore(i: number) {
          const point = points[i]?.point;
          if (!point) return;

          const result = point.result || '';
          const rallyLength = point.rallyLength || 0;
          const label = `${result}${rallyLength ? ' (Rally: ' + rallyLength + ')' : ''}`;

          set_winner
            .attr('opacity', 1)
            .attr('fill', options.colors.players[point.winner])
            .text(label);

          set_score
            .attr('opacity', 1)
            .attr('fill', options.colors.players[point.winner])
            .text(point.score || '');
        }

        function calcStops(point: any) {
          let win_pct = 0;
          let err_pct = 0;
          let u_pct = 0;

          if (options.display.winErrHighlight) {
            const result = point.result;
            const rallyLength = point.rallyLength || (point.rally ? rallyCount(point.rally) : 0);
            const rally_pct = rallyLength ? 100 - Math.floor((rallyLength / longest_rally) * 100) : 100;

            if (winners.has(result)) {
              win_pct = rally_pct;
            } else if (errors.has(result)) {
              err_pct = rally_pct;
            } else {
              u_pct = rally_pct;
            }
          }

          return [
            { offset: '0%', color: 'blue' },
            { offset: u_pct + '%', color: 'blue' },
            { offset: u_pct + '%', color: 'green' },
            { offset: u_pct + win_pct + '%', color: 'green' },
            { offset: u_pct + win_pct + '%', color: 'red' },
            { offset: u_pct + win_pct + err_pct + '%', color: 'red' },
            { offset: u_pct + win_pct + err_pct + '%', color: options.colors.orientation },
            { offset: '100%', color: options.colors.orientation },
          ];
        }
      };
    });
  }

  // REUSABLE functions
  // ------------------

  function boxWidth() {
    const dl = set_data.history.points().filter((f: any) => f.set == options.setIndex).length - 1;
    return set_data.complete() ? dl : Math.max(dl, options.set.averagePoints);
  }

  function calcWidth() {
    const dl = set_data.history.points().filter((f: any) => f.set == options.setIndex).length - 1;
    return Math.max(dl, options.points.maxWidthPoints, options.set.averagePoints);
  }

  // ACCESSORS

  // allows updating individual options and suboptions
  // while preserving state of other options
  chart.options = function (values: any) {
    if (!arguments.length) return options;
    const vKeys = Object.keys(values);
    const oKeys = Object.keys(options);
    for (const vKey of vKeys) {
      if (oKeys.includes(vKey)) {
        if (typeof (options as any)[vKey] == 'object') {
          const sKeys = Object.keys(values[vKey]);
          const osKeys = Object.keys((options as any)[vKey]);
          for (const sKey of sKeys) {
            if (osKeys.includes(sKey)) {
              (options as any)[vKey][sKey] = values[vKey][sKey];
            }
          }
        } else {
          (options as any)[vKey] = values[vKey];
        }
      }
    }
    return chart;
  };

  chart.data = function (set_object: any) {
    if (!arguments.length) return set_data;
    set_data = set_object;
  };

  chart.events = function (functions: any) {
    if (!arguments.length) return events;
    keyWalk(functions, events);
    return chart;
  };

  chart.colors = function (colores: any) {
    if (!arguments.length) return options.colors;
    options.colors.players = colores;
    return chart;
  };

  chart.width = function (value: any) {
    if (!arguments.length) return options.width;
    options.width = value;
    return chart;
  };

  chart.height = function (value: any) {
    if (!arguments.length) return options.height;
    options.height = value;
    return chart;
  };

  chart.update = function (opts: any) {
    if (events.update.begin) events.update.begin();
    if (typeof update === 'function') update(opts);
    setTimeout(function () {
      if (events.update.end) events.update.end();
    }, options.display.transitionTime);
    return true;
  };

  chart.duration = function (value: any) {
    if (!arguments.length) return options.display.transitionTime;
    options.display.transitionTime = value;
    return chart;
  };

  return chart;
}
