/* eslint-disable */
// @ts-nocheck
import { groupGames } from './groupGames';
import { gameFish } from './gameFish';

import { select, selectAll } from 'd3';
import { rallyCount } from './legacyRally';
import { buildEpisodes } from '../episodes/buildEpisodes';

export function momentumChart() {
  let data: any;
  let update: any;
  let fish_school: any[] = [];
  const images = { left: undefined, right: undefined };

  const options: any = {
    id: 'm1',
    fullWidth: window.innerWidth,
    fullHeight: window.innerHeight,
    margins: {
      top: 1,
      bottom: 1, // Chrome bug can't be 0
      left: 3,
      right: 3, // Chrome bug can't be 0
    },
    fish: {
      gridcells: ['0', '15', '30', '40', 'G'],
      cell_size: undefined,
      min_cell_size: 5,
      max_cell_size: 10,
    },
    display: {
      continuous: false,
      reverse: false,
      orientation: 'vertical',
      leftImg: false,
      rightImg: false,
      show_images: undefined,
      transition_time: 0,
      sizeToFit: true,
      service: true,
      player: true,
      rally: true,
      score: false,
      momentum_score: true,
      grid: true,
    },
    colors: {
      players: { 0: 'red', 1: 'black' },
      results: {
        Out: 'red',
        Net: 'coral',
        'Unforced Error': 'red',
        Forced: 'orange',
        Ace: 'lightgreen',
        'Serve Winner': 'lightgreen',
        Winner: 'lightgreen',
        'Forced Volley Error': 'orange',
        'Forced Error': 'orange',
        In: 'yellow',
        'Passing Shot': 'lightgreen',
        'Out Passing Shot': 'red',
        'Net Cord': 'yellow',
        'Out Wide': 'red',
        'Out Long': 'red',
        'Double Fault': 'red',
        Unknown: 'blue',
        Error: 'red',
      },
    },
  };

  function width() {
    return options.fullWidth - options.margins.left - options.margins.right;
  }
  function height() {
    return options.fullHeight - options.margins.top - options.margins.bottom;
  }

  options.height = height();
  options.width = width();

  const default_colors = { default: '#235dba' };
  let colors = JSON.parse(JSON.stringify(default_colors));

  const events: any = {
    score: { click: null },
    leftImage: { click: null },
    rightImage: { click: null },
    update: { begin: null, end: null },
    point: { mouseover: null, mouseout: null, click: null },
  };

  function chart(selection: any) {
    selection.each(function (_, i: number, n: any) {
      const dom_parent = select(n[i]);

      const root = dom_parent.append('div').attr('class', 'momentumRoot').attr('transform', 'translate(0, 0)');

      const momentumFrame = root.append('svg').attr('class', 'momentumFrame');

      momentumFrame.node().setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns', 'http://www.w3.org/2000/svg');
      momentumFrame
        .node()
        .setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:xlink', 'http://www.w3.org/1999/xlink');

      const bars = momentumFrame.append('g').attr('id', 'momentumBars');
      const fish = momentumFrame.append('g').attr('id', 'momentumFish');
      const game = momentumFrame.append('g').attr('id', 'momentumGame');

      update = function (opts: any) {
        if (options.display.sizeToFit || (opts && opts.sizeToFit)) {
          const dims = selection.node().getBoundingClientRect();
          if (options.display.orientation == 'vertical') {
            options.fullWidth = Math.max(dims.width, 100);
            options.fullHeight = Math.max(dims.height, 100);
          } else {
            options.fullHeight = Math.max(dims.height, 100);
            /**
            options.fullWidth = Math.max(dims.width, 100);
            options.fullHeight = cellSize() * maxDiff() * 2;
            */
          }
        }

        options.height = height();
        options.width = width();

        const vert = options.display.orientation == 'vertical' ? 1 : 0;
        const fish_offset = vert ? options.width : options.height;
        /** const fish_length = vert ? options.height : options.width; */
        const midpoint = fish_offset / 2;

        const all_games = groupGames(data);
        let max_rally = 0;
        data.forEach(function (point) {
          if (point.rally != undefined && rallyCount(point.rally) > max_rally) max_rally = rallyCount(point.rally);
        });

        const cell_size = cellSize();

        // remove extraneous fish instances
        const old_fish = fish_school.slice(all_games.length);
        old_fish.forEach(function (f) {
          selectAll('.c' + f.options().id).remove();
        });
        // trim school based on length of data
        fish_school = fish_school.slice(0, all_games.length);

        let radius: number;
        const coords = [0, 0];
        const score_lines: any[] = [];
        all_games.forEach(function (g, i) {
          // add fish where necessary
          if (!fish_school[i]) {
            fish_school.push(gameFish());
            momentumFrame.call(fish_school[i]);
            fish_school[i].g({
              bars: bars.append('g').attr('class', 'cGF' + i),
              fish: fish.append('g').attr('class', 'cGF' + i),
              game: game.append('g').attr('class', 'cGF' + i),
            });
            fish_school[i].options({
              id: 'GF' + i,
              display: { score: false, point_score: false },
              fish: { school: true },
            });
          }
          fish_school[i].width(fish_offset).height(fish_offset);
          fish_school[i].options({
            score: g.score,
            fish: { cell_size: cell_size, max_rally: max_rally },
            display: {
              orientation: options.display.orientation,
              service: options.display.service,
              rally: options.display.rally,
              player: options.display.player,
              grid: options.display.grid,
            },
            colors: { players: { 0: options.colors.players[0], 1: options.colors.players[1] } },
          });
          fish_school[i].data(g.points);
          fish_school[i].coords(coords).update();
          const new_coords = fish_school[i].coords();
          // Mouth-to-tail alignment:
          // Horizontal: advance right (coords[0]), keep vertical position constant (coords[1])
          // Vertical: advance down (coords[1]), keep horizontal position constant (coords[0])
          if (vert) {
            // Vertical mode: keep horizontal position aligned
            // coords[0] stays the same - mouth-to-tail alignment!
            coords[1] += new_coords?.[1];
          } else {
            // Horizontal mode: keep vertical position aligned
            coords[0] += new_coords?.[1] - new_coords?.[2] / 2;
            // coords[1] stays the same - mouth-to-tail alignment!
          }
          score_lines.push({
            score: g.score,
            index: g.index,
            l: coords[1] + new_coords?.[2] * 1.75,
            o: coords[0] + new_coords?.[2] * 1.75,
            set_end: g.last_game,
          });
          if (g.last_game && !options.display.continuous) {
            coords[vert ? 0 : 1] = 0;
          }
          radius = new_coords?.[2] / 2;
        });

        // This resize *must* take place after the fishshcool has been generated!
        // ---------------------------------------------------------------------
        root
          .attr('width', options.width + 'px')
          .attr('height', (vert ? 100 + coords[1] : options.height) + 'px')
          .on('mouseover', showImages)
          .on('mouseout', hideImages);

        momentumFrame
          .attr('width', options.width + 'px')
          .attr('height', (vert ? 100 + coords[1] : options.height) + 'px');
        // ---------------------------------------------------------------------

        const midline = fish.selectAll('.midline' + options.id).data([0]);

        midline
          .enter()
          .append('line')
          .attr('class', 'midline' + options.id)
          .attr('x1', vert ? midpoint : radius)
          .attr('x2', vert ? midpoint : coords[0] + 5 * (radius || 0))
          .attr('y1', vert ? radius : midpoint)
          .attr('y2', vert ? coords[1] + 5 * radius : midpoint)
          .attr('stroke-width', lineWidth)
          .attr('stroke', '#ccccdd');

        midline.exit().remove();

        midline
          .transition()
          .duration(options.display.transition_time)
          .attr('x1', vert ? midpoint : radius)
          .attr('x2', vert ? midpoint : coords[0] + 5 * (radius || 0))
          .attr('y1', vert ? radius : midpoint)
          .attr('y2', vert ? coords[1] + 5 * radius : midpoint)
          .attr('stroke-width', lineWidth)
          .attr('stroke', '#ccccdd');

        const scoreLines = fish.selectAll('.score_line' + options.id).data(score_lines);

        scoreLines
          .enter()
          .append('line')
          .attr('class', 'score_line' + options.id)
          .attr('x1', function (d) {
            return vert ? cell_size * 2 : d.o;
          })
          .attr('x2', function (d) {
            return vert ? fish_offset - cell_size * 2 : d.o;
          })
          .attr('y1', function (d) {
            return vert ? d.l : cell_size * 3;
          })
          .attr('y2', function (d) {
            return vert ? d.l : fish_offset - cell_size * 3;
          })
          .attr('stroke-width', lineWidth)
          .attr('stroke-dasharray', function (d) {
            return d.set_end ? '0' : '5,5';
          })
          .attr('stroke', function (d) {
            return d.set_end ? '#000000' : '#ccccdd';
          });

        scoreLines.exit().remove();

        scoreLines
          .transition()
          .duration(options.display.transition_time)
          .attr('x1', function (d) {
            return vert ? cell_size * 2 : d.o;
          })
          .attr('x2', function (d) {
            return vert ? fish_offset - cell_size * 2 : d.o;
          })
          .attr('y1', function (d) {
            return vert ? d.l : cell_size * 3;
          })
          .attr('y2', function (d) {
            return vert ? d.l : fish_offset - cell_size * 3;
          })
          .attr('stroke-width', lineWidth)
          .attr('stroke-dasharray', function (d) {
            return d.set_end ? '0' : '5,5';
          })
          .attr('stroke', function (d) {
            return d.set_end ? '#000000' : '#ccccdd';
          });

        if (options.display.momentum_score) {
          const score_text = fish.selectAll('.score_text' + options.id).data(score_lines);

          score_text.exit().remove();

          score_text
            .enter()
            .append('g')
            .attr('class', 'score_text' + options.id)
            .attr('transform', scoreText)
            .on('click', function (d) {
              if (events.score.click) events.score.click(d);
            })
            .merge(score_text)
            .attr('class', 'score_text' + options.id)
            .attr('transform', scoreText)
            .on('click', function (d) {
              if (events.score.click) events.score.click(d);
            });

          const scores = score_text.selectAll('.score' + options.id).data(function (d) {
            return d.score;
          });

          scores.exit().remove();

          scores
            .enter()
            .append('text')
            .attr('class', 'score' + options.id)
            .attr('transform', scoreT)
            .attr('font-size', radius * 4.0 + 'px')
            .attr('opacity', 0.1)
            .attr('text-anchor', 'middle')
            .text(function (d) {
              return d;
            })
            .merge(scores)
            .attr('class', 'score' + options.id)
            .transition()
            .duration(options.display.transition_time)
            .attr('transform', scoreT)
            .attr('font-size', radius * 4.0 + 'px')
            .attr('opacity', 0.1)
            .attr('text-anchor', 'middle')
            .text(function (d) {
              return d;
            });
        } else {
          fish.selectAll('.score_text' + options.id).remove();
        }

        function scoreText(d: any) {
          return translate(0, vert ? d.l : d.o - radius, 0);
        }
        function scoreT(_, i: number) {
          const offset = vert ? fish_offset / 3 : options.height / 3;
          const o = i ? midpoint + offset : midpoint - offset + radius * 3;
          const l = -1 * radius * (vert ? 0.25 : 0.5);
          return translate(o, l, 0);
        }

        function translate(o, l, rotate) {
          const x = vert ? o : l;
          const y = vert ? l : o;
          return 'translate(' + x + ',' + y + ') rotate(' + rotate + ')';
        }

        function lineWidth() {
          return radius > 20 ? 2 : 1;
        }

        function cellSize() {
          let cell_size;

          if (options.display.orientation == 'vertical') {
            // if the display is vertical use the width divided by maxDiff
            cell_size = options.width / 2 / (maxDiff() + 1);
          } else {
            // if the display is horizontal use the width divided by # points
            // var radius = options.width / (data.points().length + 4);
            const radius = options.width / (data.length + 4);
            cell_size = Math.sqrt(2 * radius * radius);
          }
          return Math.min(options.fish.max_cell_size, cell_size);
        }

        function maxDiff() {
          let max_diff = 0;
          const cumulative = [0, 0];

          data.forEach(function (episode) {
            cumulative[episode.point.winner] += 1;
            const diff = Math.abs(cumulative[0] - cumulative[1]);
            if (diff > max_diff) max_diff = diff;
          });

          return max_diff;
        }

        if (options.display.rightImg) {
          images.right = momentumFrame.selectAll('image.rightImage').data([0]);

          images.right.exit().remove();

          images.right
            .enter()
            .append('image')
            .attr('class', 'rightImage')
            .attr('xlink:href', options.display.rightImg)
            .attr('x', options.width - 20)
            .attr('y', 5)
            .attr('height', '20px')
            .attr('width', '20px')
            .attr('opacity', options.display.show_images ? 1 : 0)
            .on('click', function () {
              if (events.rightImage.click) events.rightImage.click(options.id);
            })
            .merge(images.right)
            .attr('x', options.width - 20)
            .attr('xlink:href', options.display.rightImg)
            .on('click', function () {
              if (events.rightImage.click) events.rightImage.click(options.id);
            });
        } else {
          momentumFrame.selectAll('image.rightImage').remove();
        }

        if (options.display.leftImg) {
          images.left = momentumFrame.selectAll('image.leftImage').data([0]);

          images.left
            .enter()
            .append('image')
            .attr('class', 'leftImage')
            .attr('xlink:href', options.display.leftImg)
            .attr('x', 10)
            .attr('y', 5)
            .attr('height', '20px')
            .attr('width', '20px')
            .attr('opacity', options.display.show_images ? 1 : 0)
            .on('click', function () {
              if (events.leftImage.click) events.leftImage.click();
            })
            .merge(images.left)
            .attr('xlink:href', options.display.leftImg)
            .on('click', function () {
              if (events.leftImage.click) events.leftImage.click(options.id);
            });

          images.left.exit().remove();
        } else {
          momentumFrame.selectAll('image.leftImage').remove();
        }

        function showImages() {
          if (options.display.show_images == false) return;
          if (options.display.leftImg) images.left.attr('opacity', 1);
          if (options.display.rightImg) images.right.attr('opacity', 1);
        }

        function hideImages() {
          if (options.display.show_images) return;
          if (options.display.leftImg) images.left.attr('opacity', 0);
          if (options.display.rightImg) images.right.attr('opacity', 0);
        }
      };
    });
  }

  // ACCESSORS

  // allows updating individual options and suboptions
  // while preserving state of other options
  chart.options = function (values) {
    if (!arguments.length) return options;
    keyWalk(values, options);
    return chart;
  };

  function keyWalk(valuesObject, optionsObject) {
    if (!valuesObject || !optionsObject) return;
    const vKeys = Object.keys(valuesObject);
    const oKeys = Object.keys(optionsObject);
    for (let k = 0; k < vKeys.length; k++) {
      if (oKeys.indexOf(vKeys[k]) >= 0) {
        const oo = optionsObject[vKeys[k]];
        const vo = valuesObject[vKeys[k]];
        if (typeof oo == 'object' && typeof vo !== 'function' && oo.constructor !== Array) {
          keyWalk(valuesObject[vKeys[k]], optionsObject[vKeys[k]]);
        } else {
          optionsObject[vKeys[k]] = valuesObject[vKeys[k]];
        }
      }
    }
  }

  chart.events = function (functions) {
    if (!arguments.length) return events;
    keyWalk(functions, events);
    return chart;
  };

  chart.width = function (value) {
    if (!arguments.length) return options.fullWidth;
    options.fullWidth = value;
    return chart;
  };

  chart.height = function (value) {
    if (!arguments.length) return options.fullHeight;
    options.fullHeight = value;
    return chart;
  };

  chart.data = function (value) {
    if (!arguments.length) return data;
    data = value || null;
    return chart;
  };

  chart.matchUp = function (matchUpState: any) {
    const episodes = buildEpisodes(matchUpState);
    chart.data(episodes);
    return chart;
  };

  chart.update = function (opts) {
    if (events.update.begin) events.update.begin();
    if (typeof update === 'function' && data) update(opts);
    setTimeout(function () {
      if (events.update.end) events.update.end();
    }, options.display.transition_time);
  };

  chart.colors = function (color3s) {
    if (!arguments.length) return colors;
    if (typeof color3s !== 'object') return false;
    const keys = Object.keys(color3s);
    if (!keys.length) return false;
    // remove all properties that are not colors
    keys.forEach(function (f) {
      if (!/(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(color3s[f])) delete color3s[f];
    });
    if (Object.keys(color3s).length) {
      colors = color3s;
    } else {
      colors = JSON.parse(JSON.stringify(default_colors));
    }
    return chart;
  };

  return chart;
}
