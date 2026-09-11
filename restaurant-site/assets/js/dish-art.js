/*
 * Dish illustrations for Char Kuey Teow Abang Chor.
 *
 * Every dish on the menu gets a drawing rather than a photograph: an SVG built
 * from the `art` spec in menu-data.js — a vessel (plate, bowl, dessert bowl or
 * glass), a base colour for the noodles, rice, broth or drink, and a list of
 * toppings. Placement is random but seeded off the dish id, so a dish looks the
 * same on every visit while no two plates look alike.
 *
 * Colours that need to follow the light/dark theme (the plate, the background,
 * the steam) are CSS custom properties; the food itself keeps its own colours.
 */
var DishArt = (function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var W = 160;
  var H = 120;

  function el(tag, attrs, parent) {
    var node = document.createElementNS(NS, tag);
    for (var key in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, key)) {
        node.setAttribute(key, attrs[key]);
      }
    }
    if (parent) parent.appendChild(node);
    return node;
  }

  /* Deterministic per dish: same id, same plate, every time. */
  function seeded(id) {
    var h = 2166136261;
    for (var i = 0; i < id.length; i++) {
      h = Math.imul(h ^ id.charCodeAt(i), 16777619);
    }
    var s = h >>> 0;
    return function () {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function shade(hex, amount) {
    var n = parseInt(hex.slice(1), 16);
    var parts = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (c) {
      var v = amount >= 0 ? c + (255 - c) * amount : c * (1 + amount);
      return Math.max(0, Math.min(255, Math.round(v)));
    });
    return 'rgb(' + parts.join(',') + ')';
  }

  function rot(x, y, deg) {
    return 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + deg.toFixed(1) + ')';
  }

  /* Points scattered inside an ellipse, denser towards the middle. */
  function scatter(rng, cx, cy, rx, ry) {
    var a = rng() * Math.PI * 2;
    var r = Math.sqrt(rng()) * 0.86;
    return { x: cx + Math.cos(a) * rx * r, y: cy + Math.sin(a) * ry * r };
  }

  /* ------------------------------------------------------- vessels ---- */

  function plate(svg) {
    el('ellipse', { cx: 80, cy: 70, rx: 51, ry: 43, fill: 'var(--art-shadow)' }, svg);
    el('ellipse', { cx: 80, cy: 64, rx: 50, ry: 42, fill: 'var(--art-plate)', stroke: 'var(--art-rim)', 'stroke-width': 1.2 }, svg);
    el('ellipse', { cx: 80, cy: 63, rx: 41, ry: 33, fill: 'var(--art-well)' }, svg);
    return { cx: 80, cy: 62, rx: 36, ry: 27, clip: { cx: 80, cy: 63, rx: 41, ry: 33 } };
  }

  function bowl(svg) {
    el('ellipse', { cx: 80, cy: 68, rx: 49, ry: 40, fill: 'var(--art-shadow)' }, svg);
    el('ellipse', { cx: 80, cy: 64, rx: 48, ry: 39, fill: 'var(--art-plate)', stroke: 'var(--art-rim)', 'stroke-width': 1.2 }, svg);
    el('ellipse', { cx: 80, cy: 63, rx: 40, ry: 31, fill: 'var(--art-well)' }, svg);
    return { cx: 80, cy: 62, rx: 33, ry: 24, clip: { cx: 80, cy: 63, rx: 40, ry: 31 } };
  }

  function dessert(svg) {
    el('ellipse', { cx: 80, cy: 92, rx: 28, ry: 5, fill: 'var(--art-shadow)' }, svg);
    el('path', { d: 'M32 58 Q80 108 128 58 Z', fill: 'var(--art-plate)', stroke: 'var(--art-rim)', 'stroke-width': 1.2 }, svg);
    el('path', { d: 'M44 66 Q80 96 116 66 Q80 84 44 66 Z', fill: 'var(--art-well)', opacity: 0.7 }, svg);
    el('ellipse', { cx: 80, cy: 58, rx: 48, ry: 9, fill: 'var(--art-well)', stroke: 'var(--art-rim)', 'stroke-width': 1 }, svg);
    return { cx: 80, cy: 42, rx: 26, ry: 11, clip: null };
  }

  function glass(svg, base) {
    var d = 'M52 18 L58 98 Q59 106 67 106 L93 106 Q101 106 102 98 L108 18 Z';
    el('path', { d: d, fill: 'var(--art-glass)', stroke: 'var(--art-rim)', 'stroke-width': 1.2 }, svg);
    if (base) {
      var clip = el('clipPath', { id: 'glassclip-' + Math.random().toString(36).slice(2, 8) }, svg);
      el('path', { d: d }, clip);
      var liquid = el('g', { 'clip-path': 'url(#' + clip.getAttribute('id') + ')' }, svg);
      el('rect', { x: 46, y: 32, width: 68, height: 78, fill: base }, liquid);
      el('ellipse', { cx: 80, cy: 32, rx: 26, ry: 5, fill: shade(base, 0.18) }, liquid);
      el('rect', { x: 60, y: 36, width: 5, height: 58, rx: 2.5, fill: '#ffffff', opacity: 0.16 }, liquid);
      return { cx: 80, cy: 62, rx: 20, ry: 26, clip: null, liquidTop: 32, group: liquid };
    }
    return { cx: 80, cy: 62, rx: 20, ry: 26, clip: null, liquidTop: 32, group: svg };
  }

  /* --------------------------------------------------------- bases ---- */

  function noodleStyle(item) {
    if (item.cat === 'ckt') return 'flat';
    if (item.id.indexOf('nasi') === 0) return 'rice';
    if (item.id.indexOf('bihun') === 0) return 'thin';
    if (item.cat === 'kuah') return 'soup';
    if (item.cat === 'goreng') return 'round';
    return null;
  }

  function noodles(g, style, color, rng, area) {
    var i;
    if (style === 'rice') {
      for (i = 0; i < 95; i++) {
        var p = scatter(rng, area.cx, area.cy, area.rx, area.ry);
        el('ellipse', {
          rx: 2.1, ry: 1.2, fill: rng() > 0.75 ? shade(color, 0.18) : color,
          transform: rot(p.x, p.y, rng() * 180)
        }, g);
      }
      return;
    }

    var counts = { flat: 26, thin: 34, round: 26, soup: 9 };
    var widths = { flat: 4.4, thin: 1.9, round: 3.2, soup: 3.2 };

    /* A mound of the same colour underneath, so gaps between strands read as
       noodles in shadow rather than as bare plate. */
    if (style !== 'soup') {
      el('ellipse', { cx: area.cx, cy: area.cy, rx: area.rx + 4, ry: area.ry + 3, fill: shade(color, -0.22) }, g);
    }
    var n = counts[style];
    var width = widths[style];

    for (i = 0; i < n; i++) {
      var y = area.cy - area.ry + (i / (n - 1)) * area.ry * 2 + (rng() - 0.5) * 7;
      var x1 = area.cx - area.rx - 6 + rng() * 8;
      var x2 = area.cx + area.rx + 6 - rng() * 8;
      var lift = (rng() - 0.5) * 26;
      var d = style === 'round' || style === 'soup'
        ? 'M' + x1 + ' ' + y + ' C' + (x1 + 18) + ' ' + (y + lift) + ' ' +
          (x2 - 18) + ' ' + (y - lift) + ' ' + x2 + ' ' + y
        : 'M' + x1 + ' ' + y + ' Q' + area.cx + ' ' + (y + lift) + ' ' + x2 + ' ' + y;
      el('path', {
        d: d, fill: 'none', 'stroke-linecap': 'round', 'stroke-width': width,
        stroke: style === 'soup' ? '#f2e5c8' : shade(color, (rng() - 0.4) * 0.3)
      }, g);
    }
  }

  /* ------------------------------------------------------ toppings ---- */

  var TOPPINGS = {
    prawn: function (g, x, y, rng) {
      var t = el('g', { transform: rot(x, y, rng() * 360) }, g);
      el('path', { d: 'M-6 4 q-1 -9 6 -9 q6 0 6 5 q0 5 -5 5', fill: 'none', stroke: '#ef8a58', 'stroke-width': 3.6, 'stroke-linecap': 'round' }, t);
      el('path', { d: 'M-7 4 l-4 3 l1 -5 z', fill: '#e2683c' }, t);
    },
    prawnbig: function (g, x, y, rng) {
      var t = el('g', { transform: rot(x, y, rng() * 360) }, g);
      el('path', { d: 'M-9 6 q-2 -14 9 -14 q9 0 9 8 q0 7 -7 8', fill: 'none', stroke: '#f0784a', 'stroke-width': 5.6, 'stroke-linecap': 'round' }, t);
      el('path', { d: 'M-10 6 l-6 4 l1 -7 z', fill: '#d95c31' }, t);
      el('path', { d: 'M-3 -7 l2 4 M3 -8 l1 5 M8 -5 l0 5', stroke: '#fbd3bb', 'stroke-width': 1.3, 'stroke-linecap': 'round' }, t);
    },
    cockle: function (g, x, y, rng) {
      var t = el('g', { transform: rot(x, y, rng() * 360) }, g);
      el('path', { d: 'M-5 3 a5 5 0 0 1 10 0 z', fill: '#94382c' }, t);
      el('path', { d: 'M0 3 v-4 M-2.6 3 l-.6 -3.4 M2.6 3 l.6 -3.4', stroke: '#c25f45', 'stroke-width': 0.9 }, t);
    },
    egg: function (g, x, y, rng) {
      el('ellipse', { rx: 5.2, ry: 3, fill: '#f5d489', transform: rot(x, y, rng() * 180) }, g);
    },
    eggyolk: function (g, x, y, rng) {
      var t = el('g', { transform: rot(x, y, rng() * 40 - 20) }, g);
      el('ellipse', { rx: 11, ry: 8.5, fill: '#f0bb47' }, t);
      el('ellipse', { cx: -2.5, cy: -2, rx: 4.4, ry: 3.2, fill: '#f8da8c' }, t);
    },
    friedegg: function (g, x, y) {
      var t = el('g', { transform: rot(x, y, 0) }, g);
      el('path', { d: 'M-17 2 q-5 -12 6 -14 q4 -9 14 -5 q11 -3 13 7 q4 10 -6 13 q-13 7 -27 -1 z', fill: '#fbf3e2' }, t);
      el('circle', { cx: 1, cy: -1, r: 6.6, fill: '#f0ad2b' }, t);
      el('circle', { cx: -1, cy: -3, r: 2.2, fill: '#f7ca67' }, t);
    },
    chive: function (g, x, y, rng) {
      var t = el('g', { transform: rot(x, y, rng() * 360) }, g);
      el('path', { d: 'M-6 2 q5 -4 11 -1', fill: 'none', stroke: '#5f9c4e', 'stroke-width': 2.2, 'stroke-linecap': 'round' }, t);
    },
    taugeh: function (g, x, y, rng) {
      var t = el('g', { transform: rot(x, y, rng() * 360) }, g);
      el('path', { d: 'M-5 0 q5 -4 9 0', fill: 'none', stroke: '#ede0c2', 'stroke-width': 2, 'stroke-linecap': 'round' }, t);
      el('circle', { cx: 5, cy: 0, r: 1.8, fill: '#dccfa8' }, t);
    },
    chilli: function (g, x, y, rng) {
      var t = el('g', { transform: rot(x, y, rng() * 360) }, g);
      el('path', { d: 'M-4 2 q4 -5 8 -1', fill: 'none', stroke: '#d13c26', 'stroke-width': 2.6, 'stroke-linecap': 'round' }, t);
    },
    tofu: function (g, x, y, rng) {
      var t = el('g', { transform: rot(x, y, rng() * 60 - 30) }, g);
      el('rect', { x: -5, y: -4.5, width: 10, height: 9, rx: 2, fill: '#e9c684', stroke: '#cda45f', 'stroke-width': 1 }, t);
    },
    greens: function (g, x, y, rng) {
      var t = el('g', { transform: rot(x, y, rng() * 360) }, g);
      el('path', { d: 'M-6 0 q6 -7 12 0 q-6 6 -12 0 z', fill: '#4f8b43' }, t);
    },
    squidring: function (g, x, y, rng) {
      el('circle', { cx: x, cy: y, r: 4.8, fill: 'none', stroke: '#f0e0c6', 'stroke-width': 3, opacity: 0.95 }, g);
      if (rng() > 0.5) el('circle', { cx: x + 9, cy: y + 4, r: 3.6, fill: 'none', stroke: '#e6d2b2', 'stroke-width': 2.6 }, g);
    },
    chicken: function (g, x, y, rng) {
      el('rect', { x: -6, y: -3.5, width: 12, height: 7, rx: 3, fill: '#e6c692', transform: rot(x, y, rng() * 90 - 45) }, g);
    },
    anchovy: function (g, x, y, rng) {
      var t = el('g', { transform: rot(x, y, rng() * 360) }, g);
      el('path', { d: 'M-6 0 q6 -3 11 0', fill: 'none', stroke: '#d6cdb6', 'stroke-width': 1.8, 'stroke-linecap': 'round' }, t);
    },
    oyster: function (g, x, y, rng) {
      el('ellipse', { rx: 6, ry: 4.2, fill: '#d9cdb1', stroke: '#bcae8e', 'stroke-width': 0.8, transform: rot(x, y, rng() * 180) }, g);
    },
    lekor: function (g, x, y, rng) {
      var t = el('g', { transform: rot(x, y, rng() * 360) }, g);
      el('ellipse', { rx: 9, ry: 5.4, fill: '#d89b4c' }, t);
      el('ellipse', { rx: 5, ry: 2.6, fill: '#e8bf83' }, t);
    },
    omelette: function (g, x, y) {
      el('path', { d: 'M-26 6 q-8 -16 6 -20 q8 -12 20 -6 q16 -5 20 9 q6 14 -8 18 q-20 9 -38 -1 z', fill: '#f4d79b', stroke: '#dcb96f', 'stroke-width': 1, transform: rot(x, y, 0) }, g);
    },
    banana: function (g, x, y, rng) {
      var t = el('g', { transform: rot(x, y, rng() * 360) }, g);
      el('ellipse', { rx: 12, ry: 7, fill: '#dda64f' }, t);
      el('ellipse', { rx: 7.5, ry: 3.6, fill: '#f2cf82' }, t);
    },
    cheese: function (g, x, y, rng) {
      for (var i = 0; i < 5; i++) {
        el('rect', { x: -7, y: -1, width: 14, height: 2, rx: 1, fill: '#f0a63c', transform: rot(x + (rng() - 0.5) * 14, y + (rng() - 0.5) * 10, rng() * 60 - 30) }, g);
      }
    },
    lime: function (g, x, y, rng) {
      var t = el('g', { transform: rot(x, y, rng() * 360) }, g);
      el('path', { d: 'M0 0 A7 7 0 0 1 7 7 L0 0 Z', fill: '#8fb94a' }, t);
      el('circle', { cx: 3, cy: 3, r: 6.6, fill: '#a8cc5c', opacity: 0.55 }, t);
    },
    gravy: function (g, x, y, rng, area) {
      el('ellipse', { cx: area.cx, cy: area.cy, rx: area.rx + 3, ry: area.ry + 2, fill: '#f2d49a', opacity: 0.45 }, g);
      el('path', { d: 'M' + (area.cx - 20) + ' ' + (area.cy - 6) + ' q12 8 26 2', fill: 'none', stroke: '#fbe9c4', 'stroke-width': 2.4, opacity: 0.7 }, g);
    },
    steam: function (g) {
      for (var i = 0; i < 3; i++) {
        var x = 58 + i * 22;
        el('path', {
          d: 'M' + x + ' 26 q6 -6 0 -12 q-6 -6 0 -12',
          fill: 'none', stroke: 'var(--art-steam)', 'stroke-width': 2.4,
          'stroke-linecap': 'round', opacity: 0.55
        }, g);
      }
    },
    icemound: function (g) {
      el('path', { d: 'M38 58 q10 -32 42 -36 q32 4 42 36 z', fill: '#f7f3ea' }, g);
      el('path', { d: 'M54 56 q8 -22 26 -26 q-6 13 -8 26 z', fill: '#ffffff', opacity: 0.7 }, g);
    },
    cendolworm: function (g, x, y, rng) {
      for (var i = 0; i < 9; i++) {
        var t = el('g', { transform: rot(52 + rng() * 56, 28 + rng() * 26, rng() * 360) }, g);
        el('path', { d: 'M-4 0 q4 -3 8 0', fill: 'none', stroke: '#3f8f52', 'stroke-width': 3.2, 'stroke-linecap': 'round' }, t);
      }
    },
    redbean: function (g, x, y, rng) {
      for (var i = 0; i < 12; i++) {
        el('ellipse', { rx: 3, ry: 2.2, fill: '#8b3a3f', transform: rot(52 + rng() * 56, 30 + rng() * 26, rng() * 180) }, g);
      }
    },
    corn: function (g, x, y, rng) {
      for (var i = 0; i < 10; i++) {
        el('circle', { cx: 52 + rng() * 56, cy: 30 + rng() * 26, r: 2.4, fill: '#f0c44a' }, g);
      }
    },
    sago: function (g, x, y, rng) {
      for (var i = 0; i < 26; i++) {
        el('circle', { cx: 52 + rng() * 56, cy: 30 + rng() * 26, r: 2.3, fill: '#ece4d2', stroke: '#d6cab2', 'stroke-width': 0.6 }, g);
      }
    },
    syrup: function (g) {
      el('path', { d: 'M50 32 q16 12 32 5 q13 -5 24 7', fill: 'none', stroke: '#8a4a1f', 'stroke-width': 4.2, 'stroke-linecap': 'round', opacity: 0.85 }, g);
    },
    cream: function (g) {
      el('path', { d: 'M48 46 q17 11 34 3 q13 -6 26 5', fill: 'none', stroke: '#fdfaf3', 'stroke-width': 4.4, 'stroke-linecap': 'round', opacity: 0.9 }, g);
    },
    ice: function (g, x, y, rng) {
      for (var i = 0; i < 4; i++) {
        el('rect', {
          x: -6, y: -6, width: 12, height: 12, rx: 2.5, fill: '#ffffff', opacity: 0.28,
          transform: rot(66 + rng() * 28, 44 + rng() * 44, rng() * 90)
        }, g);
      }
    },
    straw: function (g) {
      el('path', { d: 'M97 10 L74 62', stroke: '#e2523c', 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
    },
    foam: function (g) {
      el('ellipse', { cx: 80, cy: 32, rx: 26, ry: 6.5, fill: '#f7ead3' }, g);
      el('ellipse', { cx: 72, cy: 30, rx: 8, ry: 3, fill: '#fffaf0', opacity: 0.8 }, g);
    },
    powder: function (g, x, y, rng) {
      el('ellipse', { cx: 80, cy: 30, rx: 22, ry: 7, fill: '#6b4423' }, g);
      for (var i = 0; i < 14; i++) {
        el('circle', { cx: 62 + rng() * 36, cy: 26 + rng() * 8, r: 1.6, fill: '#8a5a30' }, g);
      }
    },
    longan: function (g, x, y, rng) {
      for (var i = 0; i < 7; i++) {
        el('circle', { cx: 64 + rng() * 32, cy: 46 + rng() * 42, r: 3.4, fill: '#a8703c' }, g);
      }
    },
    barley: function (g, x, y, rng) {
      for (var i = 0; i < 18; i++) {
        el('ellipse', { rx: 2.2, ry: 1.4, fill: '#efe6cd', transform: rot(64 + rng() * 32, 60 + rng() * 34, rng() * 180) }, g);
      }
    }
  };

  /* Drawn over the vessel rather than inside it — a straw leaves the glass,
     and the Milo powder sits proud of the rim. */
  var OVERLAY = { straw: true, powder: true, steam: true };

  /* How many of each garnish one mention in the data is worth. */
  var REPEAT = {
    chive: 3, taugeh: 3, cockle: 2, egg: 3, prawn: 2, chilli: 2, greens: 2,
    tofu: 2, anchovy: 3, oyster: 2, lekor: 2
  };

  /* ---------------------------------------------------------- build --- */

  function create(item) {
    var art = item.art || {};
    var rng = seeded(item.id);
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      class: 'dish-art',
      role: 'img',
      'aria-label': 'Illustration of ' + item.name,
      preserveAspectRatio: 'xMidYMid meet'
    });

    el('rect', { x: 0, y: 0, width: W, height: H, fill: 'var(--art-bg)' }, svg);

    var area;
    var target = svg;
    if (art.vessel === 'glass') {
      area = glass(svg, art.base);
      target = area.group;
    } else if (art.vessel === 'bowl') {
      area = bowl(svg);
    } else if (art.vessel === 'dessert') {
      area = dessert(svg);
    } else {
      area = plate(svg);
    }

    /* Noodles, rice and broth sit inside the vessel; everything else on top. */
    if (art.vessel !== 'glass' && art.base) {
      var content = target;
      if (area.clip) {
        var id = 'clip-' + item.id;
        var clip = el('clipPath', { id: id }, svg);
        el('ellipse', area.clip, clip);
        content = el('g', { 'clip-path': 'url(#' + id + ')' }, svg);
      }
      if (art.vessel === 'bowl') {
        el('ellipse', { cx: area.clip.cx, cy: area.clip.cy, rx: area.clip.rx, ry: area.clip.ry, fill: art.base }, content);
      }
      var style = noodleStyle(item);
      if (style) noodles(content, style, art.base, rng, area);
    }

    (art.toppings || []).forEach(function (name) {
      var draw = TOPPINGS[name];
      if (!draw) return;
      var times = REPEAT[name] || 1;
      var into = OVERLAY[name] ? svg : target;
      for (var i = 0; i < times; i++) {
        var p = scatter(rng, area.cx, area.cy, area.rx, area.ry);
        draw(into, p.x, p.y, rng, area);
      }
    });

    return svg;
  }

  return { create: create };
})();
