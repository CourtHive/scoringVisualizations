/* eslint-disable */
// @ts-nocheck
import { select, scaleLinear, scaleBand, range } from 'd3';
import { extractGamePoints } from '../engine/feedMatchUp';

export function gameFish() {
  let data: any;
  let fish_width;
  let fish_height;
  let coords = [0, 0];
  let last_coords: any;
  let update: any;
  const images: any = { left: undefined, right: undefined };

  const options: any = {
    id: 'gf1',
    score: [0, 0],
    width: 600,
    height: 600,
    margins: {
      top: 10,
      bottom: 10,
      left: 10,
      right: 10,
    },
    fish: {
      school: false,
      gridcells: ['0', '15', '30', '40', 'G'],
      max_rally: undefined,
      cell_size: undefined,
      min_cell_size: 5,
      max_cell_size: 20,
    },
    set: {
      tiebreak_to: 7,
    },
    display: {
      orientation: 'vertical',
      transition_time: 0,
      sizeToFit: false,
      leftImg: false,
      rightImg: false,
      show_images: undefined,
      reverse: false,
      point_score: true,
      service: true,
      player: true,
      rally: true,
      score: true,
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

  const default_colors = { default: '#235dba' };
  let colors = JSON.parse(JSON.stringify(default_colors));

  const events: any = {
    leftImage: { click: null },
    rightImage: { click: null },
    update: { begin: null, end: null },
    point: { mouseover: null, mouseout: null, click: null },
  };

  let fishFrame: any;
  let root: any;
  let bars: any;
  let fish: any;
  let game: any;

  function chart(selection: any) {
    const parent_type = selection._groups[0][0].tagName.toLowerCase();

    if (parent_type != 'svg') {
      root = selection.append('div').attr('class', 'fishRoot');

      fishFrame = root
        .append('svg')
        .attr('id', 'gameFish' + options.id)
        .attr('class', 'fishFrame');

      bars = fishFrame.append('g');
      fish = fishFrame.append('g');
      game = fishFrame.append('g');
    }

    update = function (opts: any) {
      if (bars == undefined || fish == undefined || game == undefined) return;

      if (options.display.sizeToFit || opts?.sizeToFit) {
        const dims = selection.node().getBoundingClientRect();
        options.width = Math.max(dims.width, 100);
        options.height = Math.max(dims.height, 100);
      }

      if (options.fish.cell_size && !options.fish.school) {
        const multiplier = Math.max(10, data.length + 2);
        options.height = options.fish.cell_size * multiplier * 0.9;
      }

      let tiebreak = false;
      let max_rally = 0;
      data.forEach((e: any) => {
        const rlen = e.rallyLength;
        if (rlen > max_rally) max_rally = rlen;
        if (e.score && e.score.indexOf('T') > 0) tiebreak = true;
      });

      if (options.fish.max_rally && options.fish.max_rally > max_rally) max_rally = options.fish.max_rally;

      fish_width = options.width - (options.margins.left + options.margins.right);
      fish_height = options.height - (options.margins.top + options.margins.bottom);

      // Ensure dimensions are valid
      if (Number.isNaN(fish_width) || fish_width <= 0) fish_width = 100;
      if (Number.isNaN(fish_height) || fish_height <= 0) fish_height = 100;

      const vert = options.display.orientation == 'vertical' ? 1 : 0;
      const fish_offset = vert ? fish_width : fish_height;
      const fish_length = vert ? fish_height : fish_width;
      const midpoint = (vert ? options.margins.left : options.margins.top) + fish_offset / 2;
      const sw = 1; // service box % offset
      const rw = 0.9; // rally_width % offset

      bars.attr('transform', 'translate(' + (vert ? 0 : coords[0]) + ',' + (vert ? coords[1] : 0) + ')');
      fish.attr('transform', 'translate(' + coords[0] + ',' + coords[1] + ')');
      game.attr('transform', 'translate(' + coords[0] + ',' + coords[1] + ')');

      let cell_size;
      if (options.fish.cell_size) {
        cell_size = options.fish.cell_size;
      } else {
        const offset_divisor = tiebreak ? options.set.tiebreak_to + 4 : options.fish.gridcells.length + 2;
        const cell_offset =
          fish_offset / (options.fish.gridcells.length + (options.display.service ? offset_divisor : 0));
        const cell_length = fish_length / (data.length + 2);
        cell_size = Math.min(cell_offset, cell_length);
        cell_size = Math.max(options.fish.min_cell_size, cell_size);
        cell_size = Math.min(options.fish.max_cell_size, cell_size);
      }

      // Ensure cell_size is valid
      if (!cell_size || Number.isNaN(cell_size) || cell_size <= 0) {
        cell_size = options.fish.min_cell_size || 5;
      }

      const diag = Math.sqrt(2 * Math.pow(cell_size, 2));
      const radius = diag / 2;

      // In school mode (momentum chart), compute the lateral offset for the grid
      // so it aligns with the fish body's starting position.
      // gridBaseOffset = cumulative set differential BEFORE the first point of this game.
      let gridBaseOffset = 0;
      if (data.length > 0 && options.fish.school) {
        const firstPt = data[0];
        const cumPts = firstPt.setCumulativePoints;
        const gamePts = firstPt.points;
        if (cumPts && gamePts) {
          const rev = options.display.reverse;
          const cumDiff = cumPts[rev ? 0 : 1] - cumPts[rev ? 1 : 0];
          const gameDiff = gamePts[rev ? 0 : 1] - gamePts[rev ? 1 : 0];
          gridBaseOffset = cumDiff - gameDiff;
        }
      }

      const grid_data = [];
      const grid_labels = [];
      const grid_side = tiebreak ? options.set.tiebreak_to : options.fish.gridcells.length - 1;
      for (let g = 0; g < grid_side; g++) {
        const label = tiebreak ? g : options.fish.gridcells[g];
        // l = length, o = offset
        grid_labels.push({
          label: label,
          l: (g + (vert ? 1.25 : 0.75)) * radius,
          o: (g + (vert ? 0.75 : 1.25)) * radius,
          rotate: 45,
        });
        grid_labels.push({ label: label, l: (g + 1.25) * radius, o: -1 * (g + 0.75) * radius, rotate: -45 });
        for (let c = 0; c < grid_side; c++) {
          grid_data.push([g, c]);
        }
      }

      // check if this is a standalone SVG or part of larger SVG
      if (root) {
        root.attr('width', options.width + 'px').attr('height', options.height + 'px');

        fishFrame.attr('width', options.width + 'px').attr('height', options.height + 'px');
      }

      if (options.display.point_score) {
        const game_score = fish.selectAll('.game_score' + options.id).data(grid_labels);

        game_score.exit().remove();

        game_score
          .enter()
          .append('text')
          .attr('font-size', radius * 0.8 + 'px')
          .attr('transform', gscoreT)
          .attr('text-anchor', 'middle')
          .merge(game_score)
          .attr('class', 'game_score' + options.id)
          .attr('font-size', radius * 0.8 + 'px')
          .attr('transform', gscoreT)
          .attr('text-anchor', 'middle')
          .text(function (d: any) {
            return d.label;
          });
      } else {
        fish.selectAll('.game_score' + options.id).remove();
      }

      if (options.display.grid) {
        const gridcells = fish.selectAll('.gridcell' + options.id).data(grid_data);

        gridcells.exit().remove();

        gridcells
          .enter()
          .append('rect')
          .attr('stroke', '#ccccdd')
          .attr('stroke-width', lineWidth)
          .attr('transform', gridCT)
          .attr('width', cell_size)
          .attr('height', cell_size)
          .merge(gridcells)
          .attr('class', 'gridcell' + options.id)
          .attr('stroke-width', lineWidth)
          .attr('width', cell_size)
          .attr('height', cell_size)
          .attr('transform', gridCT)
          .attr('fill-opacity', 0);
      } else {
        fish.selectAll('.gridcell' + options.id).remove();
      }

      const gamecells = game.selectAll('.gamecell' + options.id).data(data);

      gamecells.exit().remove();

      gamecells
        .enter()
        .append('rect')
        .attr('opacity', 0)
        .attr('width', cell_size)
        .attr('height', cell_size)
        .attr('transform', gameCT)
        .attr('stroke', '#ccccdd')
        .attr('stroke-width', lineWidth)
        .merge(gamecells)
        .attr('id', (d: any, i: number) => {
          return options.id + 'Gs' + d.set + 'g' + d.game + 'p' + i;
        })
        .attr('class', 'gamecell' + options.id)
        .attr('width', cell_size)
        .attr('height', cell_size)
        .attr('transform', gameCT)
        .attr('stroke', '#ccccdd')
        .attr('stroke-width', lineWidth)
        .attr('opacity', options.display.player ? 1 : 0)
        .style('fill', function (d: any) {
          return options.colors.players[d.winner];
        });

      const results = game.selectAll('.result' + options.id).data(data);

      results.exit().remove();

      results
        .enter()
        .append('circle')
        .attr('stroke', 'black')
        .attr('id', function (d: any, i: number) {
          return options.id + 'Rs' + d.set + 'g' + d.game + 'p' + i;
        })
        .attr('class', 'result' + options.id)
        .attr('opacity', 1)
        .attr('stroke-width', lineWidth)
        .attr('cx', zX)
        .attr('cy', zY)
        .attr('r', circleRadius)
        .style('fill', function (d: any) {
          return options.colors.results[d.result];
        })
        .merge(results)
        .attr('id', function (d: any, i: number) {
          return options.id + 'Rs' + d.set + 'g' + d.game + 'p' + i;
        })
        .attr('class', 'result' + options.id)
        .attr('stroke-width', lineWidth)
        .attr('cx', zX)
        .attr('cy', zY)
        .attr('r', circleRadius)
        .style('fill', function (d: any) {
          return options.colors.results[d.result];
        });

      // offset Scale
      const oScale = scaleLinear()
        .range([0, fish_offset * rw])
        .domain([0, max_rally]);

      // lengthScale
      const lScale = scaleBand()
        .domain(range(data.length))
        .range([0, data.length * radius])
        .round(true);

      if (options.display.rally) {
        const rally_bars = bars.selectAll('.rally_bar' + options.id).data(data);

        rally_bars.exit().remove();

        // D3 v7: Simplified without transitions for debugging
        rally_bars
          .enter()
          .append('rect')
          .merge(rally_bars)
          .attr('class', 'rally_bar' + options.id)
          .attr('id', function (d: any, i: number) {
            return options.id + 'Bs' + d.set + 'g' + d.game + 'p' + i;
          })
          .attr('opacity', 1)
          .attr('stroke', 'white')
          .attr('stroke-width', lineWidth)
          .attr('fill', '#eeeeff')
          .attr('transform', rallyT)
          .attr('height', vert ? lScale.bandwidth() : rallyCalc)
          .attr('width', vert ? rallyCalc : lScale.bandwidth())
          .on('mouseover', function () {
            select(this).attr('fill', 'yellow');
          })
          .on('mouseout', function () {
            select(this).attr('fill', '#eeeeff');
          });
      } else {
        bars.selectAll('.rally_bar' + options.id).remove();
      }

      if (options.display.score) {
        const score = options.score.slice();
        if (options.display.reverse) score.reverse();
        const set_score = bars.selectAll('.set_score' + options.id).data(score);

        set_score.exit().remove();

        set_score
          .enter()
          .append('text')
          .attr('class', 'set_score' + options.id)
          .attr('transform', sscoreT)
          .attr('font-size', radius * 0.8 + 'px')
          .attr('text-anchor', 'middle')
          .text(function (d: any) {
            return d;
          })
          .merge(set_score)
          .attr('class', 'set_score' + options.id)
          .attr('transform', sscoreT)
          .attr('font-size', radius * 0.8 + 'px')
          .attr('text-anchor', 'middle')
          .text(function (d: any) {
            return d;
          });

        const ssb = bars.selectAll('.ssb' + options.id).data(options.score);

        ssb.exit().remove();

        ssb
          .enter()
          .append('rect')
          .merge(ssb)
          .attr('class', 'ssb' + options.id)
          .attr('transform', ssbT)
          .attr('stroke', 'black')
          .attr('stroke-width', lineWidth)
          .attr('fill-opacity', 0)
          .attr('height', radius + 'px')
          .attr('width', radius + 'px');
      } else {
        bars.selectAll('.set_score' + options.id).remove();
        bars.selectAll('.ssb' + options.id).remove();
      }

      if (options.display.service) {
        const serves: any = [];
        data.forEach(function (s: any, i: number) {
          let first_serve = false;
          const serve_outcomes = ['Ace', 'Serve Winner', 'Double Fault'];
          if (s.first_serve) {
            first_serve = true;
            serves.push({ point: i, serve: 'first', server: s.server, result: s.first_serve.error });
          }

          serves.push({
            point: i,
            serve: first_serve ? 'second' : 'first',
            server: s.server,
            result: serve_outcomes.indexOf(s.result) >= 0 ? s.result : 'In',
          });
        });

        const service = bars.selectAll('.serve' + options.id).data(serves);

        service.exit().remove();

        service
          .enter()
          .append('circle')
          .attr('class', 'serve' + options.id)
          .attr('cx', sX)
          .attr('cy', sY)
          .attr('r', circleRadius)
          .attr('stroke', colorShot)
          .attr('stroke-width', lineWidth)
          .attr('fill', colorShot)
          .merge(service)
          .attr('class', 'serve' + options.id)
          .attr('cx', sX)
          .attr('cy', sY)
          .attr('r', circleRadius)
          .attr('stroke', colorShot)
          .attr('stroke-width', lineWidth)
          .attr('fill', colorShot);

        const service_box = bars.selectAll('.sbox' + options.id).data(data);

        service_box.exit().remove();

        service_box
          .enter()
          .append('rect')
          .attr('stroke', '#ccccdd')
          .attr('fill-opacity', 0)
          .attr('transform', sBoxT)
          .attr('class', 'sbox' + options.id)
          .attr('stroke-width', lineWidth)
          .attr('height', vert ? lScale.bandwidth() : 1.5 * radius)
          .attr('width', vert ? 1.5 * radius : lScale.bandwidth())
          .merge(service_box)
          .attr('transform', sBoxT)
          .attr('class', 'sbox' + options.id)
          .attr('stroke-width', lineWidth)
          .attr('height', vert ? lScale.bandwidth() : 1.5 * radius)
          .attr('width', vert ? 1.5 * radius : lScale.bandwidth());

        const returns = bars.selectAll('.return' + options.id).data(data);

        returns.exit().remove();

        returns
          .enter()
          .append('circle')
          .attr('class', 'return' + options.id)
          .attr('cx', rX)
          .attr('cy', rY)
          .attr('r', circleRadius)
          .attr('stroke', colorReturn)
          .attr('stroke-width', lineWidth)
          .attr('fill', colorReturn)
          .merge(returns)
          .attr('class', 'return' + options.id)
          .attr('cx', rX)
          .attr('cy', rY)
          .attr('r', circleRadius)
          .attr('stroke', colorReturn)
          .attr('stroke-width', lineWidth)
          .attr('fill', colorReturn);
      } else {
        bars.selectAll('.sbox' + options.id).remove();
        bars.selectAll('.return' + options.id).remove();
        bars.selectAll('.serve' + options.id).remove();
      }

      if (options.display.rightImg) {
        images.right = fishFrame.selectAll('image.rightImage').data([0]);

        images.right.exit().remove();

        images.right
          .enter()
          .append('image')
          .attr('class', 'rightImage')
          .attr('xlink:href', options.display.rightImg)
          .attr('x', options.width - 30)
          .attr('y', 5)
          .attr('height', '20px')
          .attr('width', '20px')
          .attr('opacity', options.display.show_images ? 1 : 0)
          .on('click', function () {
            if (events.rightImage.click) events.rightImage.click(options.id);
          })
          .merge(images.right)
          .attr('x', options.width - 30)
          .attr('xlink:href', options.display.rightImg)
          .on('click', function () {
            if (events.rightImage.click) events.rightImage.click(options.id);
          });
      } else {
        if (fishFrame) fishFrame.selectAll('image.rightImage').remove();
      }

      if (options.display.leftImg) {
        images.left = fishFrame.selectAll('image.leftImage').data([0]);

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
        if (fishFrame) fishFrame.selectAll('image.leftImage').remove();
      }

      // ancillary functions for update()
      function circleRadius() {
        return options.display.player || options.display.service ? radius / 3 : radius / 2;
      }
      function lineWidth() {
        return radius > 20 ? 1.5 : 0.75;
      }
      function colorShot(d: any) {
        return options.colors.results[d.result];
      }
      function colorReturn(d: any) {
        const rlen = d.rallyLength;
        if (!rlen) return 'white';
        if (rlen > 1) return 'yellow';
        if (rlen == 1) return options.colors.results[d.result];
        return 'white';
      }

      function rallyCalc(d: any) {
        const rlen = d.rallyLength;
        return rlen ? oScale(rlen) : 0;
      }

      function sscoreT(_: any, i: number) {
        let o = i ? midpoint + radius * 0.5 : midpoint - radius * 0.5;
        o = vert ? o : o + radius * 0.3;
        const l = radius * (vert ? 0.8 : 0.5);
        return translate(o, l, 0);
      }

      function ssbT(_: any, i: number) {
        const o = i ? midpoint : midpoint - radius;
        const l = 0;
        return translate(o, l, 0);
      }

      function gscoreT(d: any) {
        const o = +midpoint + d.o + gridBaseOffset * radius;
        const l = radius + d.l;
        return translate(o, l, d.rotate);
      }

      // for the momentum chart the midpoint needs to be adjusted
      function gridCT(d: any) {
        const o = midpoint + (d[1] - d[0] + vert - 1 + gridBaseOffset) * radius;
        const l = (d[0] + d[1] + 3 - vert) * radius;
        return translate(o, l, 45);
      }

      function gameCT(d: any, i: number) {
        const o = midpoint + (findOffset(d) + vert - 1) * radius;
        const l = (i + 4 - vert) * radius;
        last_coords = [o - midpoint, l - diag, diag];
        return translate(o, l, 45);
      }

      function sBoxT(d: any, i: number) {
        const o = d.server == 0 ? midpoint - (fish_offset / 2) * sw : midpoint + (fish_offset / 2) * sw - 1.5 * radius;
        const l = radius + cL(d, i);
        return translate(o, l, 0);
      }

      function _rallyTstart(d: any, i: number) {
        const o = midpoint;
        const l = radius + cL(d, i);
        return translate(o, l, 0);
      }

      function rallyT(d: any, i: number) {
        const o = d.rallyLength ? midpoint - oScale(d.rallyLength) / 2 : 0;
        const l = radius + cL(d, i);
        return translate(o, l, 0);
      }

      function translate(o: any, l: any, rotate: any) {
        const x = vert ? o : l;
        const y = vert ? l : o;
        return 'translate(' + x + ',' + y + ') rotate(' + rotate + ')';
      }

      function cL(_: any, i: number) {
        return (i + 2.5) * radius;
      }

      function rX(d: any, i: number) {
        return vert ? rO(d) : rL(d, i);
      }
      function rY(d: any, i: number) {
        return vert ? rL(d, i) : rO(d);
      }
      function rL(_: any, i: number) {
        return radius + (i + 3) * radius;
      }
      function rO(d: any) {
        return d.server == 0
          ? midpoint + (fish_offset / 2) * sw - 0.75 * radius
          : midpoint - (fish_offset / 2) * sw + 0.75 * radius;
      }

      function sX(d: any) {
        return vert ? sO(d) : sL(d);
      }
      function sY(d: any) {
        return vert ? sL(d) : sO(d);
      }
      function sL(d: any) {
        return radius + (d.point + 3) * radius;
      }
      function sO(d: any) {
        const offset = (d.serve == 'first' && d.server == 0) || (d.serve == 'second' && d.server == 1) ? 0.4 : 1.1;
        return d.server == 0
          ? midpoint - (fish_offset / 2) * sw + offset * radius
          : midpoint + (fish_offset / 2) * sw - offset * radius;
      }

      function zX(d: any, i: number) {
        return vert ? zO(d) : zL(d, i);
      }
      function zY(d, i: number) {
        return vert ? zL(d, i) : zO(d);
      }
      function zL(_, i: number) {
        return radius + (i + 3) * radius;
      }
      function zO(d: any) {
        return +midpoint + findOffset(d) * radius;
      }
    };

    function findOffset(point: any) {
      // In school mode (momentum chart), use cumulative set points for nose-to-tail alignment.
      // In standalone mode, use game-level points so the grid stays centered.
      const pts = (options.fish.school && point.setCumulativePoints) || point.points;
      if (!pts || pts.length < 2) return 0;
      return pts[options.display.reverse ? 0 : 1] - pts[options.display.reverse ? 1 : 0];
    }
  }

  // ACCESSORS

  chart.g = function (values: any) {
    if (!arguments.length) return chart;
    if (typeof values != 'object' || values.constructor == Array) return;
    if (values.bars) bars = values.bars;
    if (values.fish) fish = values.fish;
    if (values.game) game = values.game;
  };

  // allows updating individual options and suboptions
  // while preserving state of other options
  chart.options = function (values: any) {
    if (!arguments.length) return options;
    keyWalk(values, options);
    return chart;
  };

  function keyWalk(valuesObject: any, optionsObject: any) {
    if (!valuesObject || !optionsObject) return;
    const vKeys = Object.keys(valuesObject);
    const oKeys = Object.keys(optionsObject);
    for (let k = 0; k < vKeys.length; k++) {
      if (oKeys.indexOf(vKeys[k]) >= 0) {
        const oo = optionsObject[vKeys[k]];
        const vo = valuesObject[vKeys[k]];
        if (typeof oo == 'object' && typeof vo !== 'function' && oo && oo.constructor !== Array) {
          keyWalk(valuesObject[vKeys[k]], optionsObject[vKeys[k]]);
        } else {
          optionsObject[vKeys[k]] = valuesObject[vKeys[k]];
        }
      }
    }
  }

  chart.events = function (functions: any[]) {
    if (!arguments.length) return events;
    keyWalk(functions, events);
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

  chart.coords = function (value: any) {
    if (!arguments.length) return last_coords;
    coords = value;
    return chart;
  };

  chart.data = function (value: any) {
    if (!arguments.length) return data;
    // gameFish receives GameGroup which contains points array
    // If value contains episodes that need normalization, handle it
    if (value && value.points && Array.isArray(value.points) && value.points.length > 0) {
      // This is a GameGroup - points might be UMO v4 Episodes
      // For gameFish, we just need the point data which is already extracted in groupGames
      data = JSON.parse(JSON.stringify(value));
    } else {
      data = value;
    }
    return chart;
  };

  chart.matchUp = function (matchUpState: any, setIdx?: number, gameIdx?: number) {
    const points = extractGamePoints(matchUpState, setIdx ?? 0, gameIdx ?? 0);
    chart.data(points);
    return chart;
  };

  chart.update = function (opts: any) {
    if (events.update.begin) events.update.begin();
    if (typeof update === 'function' && data) update(opts);
    setTimeout(function () {
      if (events.update.end) events.update.end();
    }, options.display.transition_time);
  };

  chart.colors = function (color3s: any) {
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

  // ancillary functions
}
