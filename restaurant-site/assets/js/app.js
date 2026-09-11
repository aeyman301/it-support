/*
 * Rasa Warisan — menu browser.
 *
 * Renders the menu from assets/js/menu-data.js, handles search and filters,
 * and keeps a "My picks" list in localStorage so a guest can build a shortlist
 * before ordering. No framework, no build step — drop the folder on Netlify.
 */
(function () {
  'use strict';

  var STORAGE_PICKS = 'rw:picks';
  var STORAGE_THEME = 'rw:theme';

  /* Tags worth surfacing on a card, in the order they should appear. */
  var TAG_LABELS = {
    vegetarian: { label: 'Vegetarian', kind: 'veg' },
    vegan: { label: 'Vegan', kind: 'veg' },
    nuts: { label: 'Contains nuts', kind: 'alert' },
    shellfish: { label: 'Shellfish', kind: 'alert' },
    seasonal: { label: 'Seasonal', kind: 'plain' }
  };
  var TAG_ORDER = ['vegetarian', 'vegan', 'nuts', 'shellfish', 'seasonal'];

  var state = {
    query: '',
    category: 'all',
    veg: false,
    noNuts: false,
    picksOnly: false,
    maxSpice: 3,
    picks: loadPicks()
  };

  var el = {
    search: document.getElementById('search'),
    clearSearch: document.getElementById('clearSearch'),
    chips: document.getElementById('categoryChips'),
    list: document.getElementById('menuList'),
    count: document.getElementById('resultCount'),
    empty: document.getElementById('emptyState'),
    reset: document.getElementById('resetFilters'),
    filterVeg: document.getElementById('filterVeg'),
    filterNoNuts: document.getElementById('filterNoNuts'),
    filterPicks: document.getElementById('filterPicks'),
    spice: document.querySelectorAll('.segmented [data-spice]'),
    picksButton: document.getElementById('picksButton'),
    picksCount: document.getElementById('picksCount'),
    picksPanel: document.getElementById('picksPanel'),
    picksBackdrop: document.getElementById('picksBackdrop'),
    picksBody: document.getElementById('picksBody'),
    picksTotal: document.getElementById('picksTotal'),
    picksClose: document.getElementById('picksClose'),
    picksClear: document.getElementById('picksClear'),
    picksWhatsapp: document.getElementById('picksWhatsapp'),
    disclosure: document.getElementById('filterDisclosure'),
    filterBadge: document.getElementById('filterBadge'),
    themeToggle: document.getElementById('themeToggle'),
    hours: document.getElementById('hoursList'),
    year: document.getElementById('year')
  };

  /* ------------------------------------------------------ storage ---- */

  function loadPicks() {
    try {
      var raw = window.localStorage.getItem(STORAGE_PICKS);
      var ids = raw ? JSON.parse(raw) : [];
      return Array.isArray(ids) ? ids.filter(isKnownItem) : [];
    } catch (err) {
      return [];
    }
  }

  function savePicks() {
    try {
      window.localStorage.setItem(STORAGE_PICKS, JSON.stringify(state.picks));
    } catch (err) {
      /* Private browsing or blocked storage — the list still works this visit. */
    }
  }

  function isKnownItem(id) {
    return ITEMS.some(function (item) { return item.id === id; });
  }

  /* -------------------------------------------------------- helpers -- */

  function money(value) {
    return 'RM ' + value.toFixed(2);
  }

  function categoryById(id) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].id === id) return CATEGORIES[i];
    }
    return null;
  }

  function itemById(id) {
    for (var i = 0; i < ITEMS.length; i++) {
      if (ITEMS[i].id === id) return ITEMS[i];
    }
    return null;
  }

  function icon(name, className) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', className || 'icon');
    svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#' + name);
    svg.appendChild(use);
    return svg;
  }

  function matches(item) {
    if (state.category !== 'all' && item.cat !== state.category) return false;
    if (state.veg && item.tags.indexOf('vegetarian') === -1) return false;
    if (state.noNuts && item.tags.indexOf('nuts') !== -1) return false;
    if (state.picksOnly && !item.pick) return false;
    if (item.spice > state.maxSpice) return false;

    if (state.query) {
      var haystack = [item.name, item.malay, item.desc, item.tags.join(' ')]
        .join(' ')
        .toLowerCase();
      var words = state.query.toLowerCase().split(/\s+/);
      for (var i = 0; i < words.length; i++) {
        if (words[i] && haystack.indexOf(words[i]) === -1) return false;
      }
    }
    return true;
  }

  /* ----------------------------------------------------- rendering --- */

  function buildChips() {
    var frag = document.createDocumentFragment();
    var all = chipButton('all', 'Everything', null);
    frag.appendChild(all);

    CATEGORIES.forEach(function (cat) {
      frag.appendChild(chipButton(cat.id, cat.name, cat.icon));
    });
    el.chips.appendChild(frag);
  }

  function chipButton(id, label, iconName) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip';
    button.dataset.category = id;
    button.setAttribute('aria-pressed', id === state.category ? 'true' : 'false');
    if (iconName) button.appendChild(icon(iconName));
    button.appendChild(document.createTextNode(label));
    button.addEventListener('click', function () {
      state.category = id;
      syncChips();
      render();
    });
    return button;
  }

  function syncChips() {
    var buttons = el.chips.querySelectorAll('.chip');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute(
        'aria-pressed',
        buttons[i].dataset.category === state.category ? 'true' : 'false'
      );
    }
  }

  function heatMeter(level) {
    var wrap = document.createElement('span');
    wrap.className = 'heat';
    wrap.title = ['Not spicy', 'Mild', 'Medium heat', 'Fiery'][level];
    for (var i = 0; i < level; i++) wrap.appendChild(icon('icon-chilli'));
    var label = document.createElement('span');
    label.className = 'sr-only';
    label.textContent = wrap.title;
    wrap.appendChild(label);
    return wrap;
  }

  function tagPill(text, kind) {
    var pill = document.createElement('span');
    pill.className = 'tag' + (kind === 'plain' ? '' : ' tag-' + kind);
    pill.textContent = text;
    return pill;
  }

  function itemCard(item) {
    var card = document.createElement('article');
    card.className = 'item' + (isPicked(item.id) ? ' is-picked' : '');
    card.id = 'dish-' + item.id;

    var top = document.createElement('div');
    top.className = 'item-top';

    var heading = document.createElement('h4');
    heading.className = 'item-name';
    heading.appendChild(document.createTextNode(item.name));
    var malay = document.createElement('span');
    malay.className = 'item-malay';
    malay.textContent = item.malay;
    heading.appendChild(malay);
    top.appendChild(heading);

    var price = document.createElement('p');
    price.className = 'item-price';
    if (item.priceNote) {
      var note = document.createElement('span');
      note.className = 'from';
      note.textContent = item.priceNote;
      price.appendChild(note);
    }
    price.appendChild(document.createTextNode(money(item.price)));
    top.appendChild(price);
    card.appendChild(top);

    var desc = document.createElement('p');
    desc.className = 'item-desc';
    desc.textContent = item.desc;
    card.appendChild(desc);

    var meta = document.createElement('div');
    meta.className = 'item-meta';
    if (item.pick) meta.appendChild(tagPill('Chef’s pick', 'pick'));
    if (item.spice > 0) meta.appendChild(heatMeter(item.spice));
    TAG_ORDER.forEach(function (tag) {
      if (item.tags.indexOf(tag) === -1) return;
      if (tag === 'vegetarian' && item.tags.indexOf('vegan') !== -1) return;
      var def = TAG_LABELS[tag];
      meta.appendChild(tagPill(def.label, def.kind));
    });
    card.appendChild(meta);

    card.appendChild(pickToggle(item));
    return card;
  }

  function pickToggle(item) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'pick-toggle';
    button.dataset.item = item.id;
    button.setAttribute('aria-pressed', isPicked(item.id) ? 'true' : 'false');
    button.setAttribute('aria-label', 'Add ' + item.name + ' to my picks');
    button.appendChild(icon('icon-note'));
    button.addEventListener('click', function () {
      togglePick(item.id);
    });
    return button;
  }

  function render() {
    var visible = ITEMS.filter(matches);
    el.list.textContent = '';

    CATEGORIES.forEach(function (cat) {
      var items = visible.filter(function (item) { return item.cat === cat.id; });
      if (!items.length) return;

      var group = document.createElement('section');
      group.className = 'menu-group';
      group.id = 'section-' + cat.id;
      group.setAttribute('aria-labelledby', 'heading-' + cat.id);

      var head = document.createElement('div');
      head.className = 'group-head';

      var badge = document.createElement('div');
      badge.className = 'group-icon';
      badge.appendChild(icon(cat.icon));
      head.appendChild(badge);

      var titles = document.createElement('div');
      titles.className = 'group-titles';
      var malay = document.createElement('p');
      malay.className = 'malay';
      malay.textContent = cat.malay;
      var h3 = document.createElement('h3');
      h3.id = 'heading-' + cat.id;
      h3.textContent = cat.name;
      var blurb = document.createElement('p');
      blurb.className = 'group-blurb';
      blurb.textContent = cat.blurb;
      titles.appendChild(malay);
      titles.appendChild(h3);
      titles.appendChild(blurb);
      head.appendChild(titles);
      group.appendChild(head);

      var grid = document.createElement('div');
      grid.className = 'items';
      items.forEach(function (item) { grid.appendChild(itemCard(item)); });
      group.appendChild(grid);

      el.list.appendChild(group);
    });

    el.empty.hidden = visible.length > 0;
    el.count.textContent = countLabel(visible.length);
    syncFilterBadge();
  }

  /* The dietary controls collapse behind a summary on small screens, so show
     a count there when any of them are on. */
  function syncFilterBadge() {
    var active = (state.veg ? 1 : 0) + (state.noNuts ? 1 : 0) +
      (state.picksOnly ? 1 : 0) + (state.maxSpice < 3 ? 1 : 0);
    el.filterBadge.textContent = String(active);
    el.filterBadge.hidden = active === 0;
  }

  function countLabel(n) {
    var dishes = n === 1 ? '1 dish' : n + ' dishes';
    var filtered = state.query || state.category !== 'all' || state.veg ||
      state.noNuts || state.picksOnly || state.maxSpice < 3;
    if (!filtered) return 'Showing all ' + dishes + '.';
    if (n === 0) return 'No dishes match.';
    return 'Showing ' + dishes + (state.query ? ' for “' + state.query + '”' : '') + '.';
  }

  /* --------------------------------------------------------- picks --- */

  function isPicked(id) {
    return state.picks.indexOf(id) !== -1;
  }

  function togglePick(id) {
    var at = state.picks.indexOf(id);
    if (at === -1) state.picks.push(id);
    else state.picks.splice(at, 1);
    savePicks();
    syncPickUI(id);
    renderPicks();
  }

  function syncPickUI(id) {
    var picked = isPicked(id);
    var card = document.getElementById('dish-' + id);
    if (card) card.classList.toggle('is-picked', picked);
    var toggle = el.list.querySelector('.pick-toggle[data-item="' + id + '"]');
    if (toggle) toggle.setAttribute('aria-pressed', picked ? 'true' : 'false');

    var n = state.picks.length;
    el.picksCount.textContent = String(n);
    el.picksCount.hidden = n === 0;
  }

  function renderPicks() {
    el.picksBody.textContent = '';
    var total = 0;
    var approximate = false;

    if (!state.picks.length) {
      var empty = document.createElement('p');
      empty.className = 'picks-empty';
      empty.textContent =
        'Nothing here yet. Tap the bookmark on any dish and it will be saved to this list.';
      el.picksBody.appendChild(empty);
    }

    state.picks.forEach(function (id) {
      var item = itemById(id);
      if (!item) return;
      total += item.price;
      if (item.priceNote) approximate = true;

      var row = document.createElement('div');
      row.className = 'pick-row';

      var main = document.createElement('div');
      main.className = 'pick-row-main';
      var name = document.createElement('div');
      name.className = 'pick-row-name';
      name.textContent = item.name;
      var cat = document.createElement('div');
      cat.className = 'pick-row-cat';
      var catDef = categoryById(item.cat);
      cat.textContent = catDef ? catDef.name : '';
      main.appendChild(name);
      main.appendChild(cat);

      var price = document.createElement('div');
      price.className = 'pick-row-price';
      price.textContent = (item.priceNote ? '~ ' : '') + money(item.price);

      var remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'pick-remove';
      remove.setAttribute('aria-label', 'Remove ' + item.name + ' from my picks');
      remove.appendChild(icon('icon-close'));
      remove.addEventListener('click', function () { togglePick(item.id); });

      row.appendChild(main);
      row.appendChild(price);
      row.appendChild(remove);
      el.picksBody.appendChild(row);
    });

    el.picksTotal.textContent = (approximate ? '~ ' : '') + money(total);
    el.picksWhatsapp.href = whatsappLink();
  }

  function whatsappLink() {
    var lines = ['Hi Rasa Warisan, I would like to order:'];
    state.picks.forEach(function (id) {
      var item = itemById(id);
      if (item) lines.push('• ' + item.name + ' — ' + money(item.price));
    });
    if (state.picks.length) lines.push('', 'Name: ');
    return 'https://wa.me/' + RESTAURANT.whatsapp + '?text=' +
      encodeURIComponent(lines.join('\n'));
  }

  function openPicks() {
    el.picksPanel.hidden = false;
    el.picksBackdrop.hidden = false;
    el.picksButton.setAttribute('aria-expanded', 'true');
    el.picksClose.focus();
    document.body.style.overflow = 'hidden';
  }

  function closePicks() {
    el.picksPanel.hidden = true;
    el.picksBackdrop.hidden = true;
    el.picksButton.setAttribute('aria-expanded', 'false');
    el.picksButton.focus();
    document.body.style.overflow = '';
  }

  /* --------------------------------------------------------- theme --- */

  function storedTheme() {
    try {
      return window.localStorage.getItem(STORAGE_THEME);
    } catch (err) {
      return null;
    }
  }

  function prefersDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function currentlyDark() {
    var attr = document.documentElement.getAttribute('data-theme');
    if (attr) return attr === 'dark';
    return prefersDark();
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    el.themeToggle.setAttribute(
      'aria-label',
      theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
    );
    try {
      window.localStorage.setItem(STORAGE_THEME, theme);
    } catch (err) {
      /* Nothing to do — the choice just will not persist. */
    }
  }

  /* ---------------------------------------------------------- wire --- */

  function wireFilters() {
    var debounce;
    el.search.addEventListener('input', function () {
      var value = el.search.value.trim();
      el.clearSearch.hidden = value === '';
      window.clearTimeout(debounce);
      debounce = window.setTimeout(function () {
        state.query = value;
        render();
      }, 120);
    });

    el.clearSearch.addEventListener('click', function () {
      el.search.value = '';
      el.clearSearch.hidden = true;
      state.query = '';
      render();
      el.search.focus();
    });

    el.filterVeg.addEventListener('change', function () {
      state.veg = el.filterVeg.checked;
      render();
    });
    el.filterNoNuts.addEventListener('change', function () {
      state.noNuts = el.filterNoNuts.checked;
      render();
    });
    el.filterPicks.addEventListener('change', function () {
      state.picksOnly = el.filterPicks.checked;
      render();
    });

    Array.prototype.forEach.call(el.spice, function (button) {
      button.addEventListener('click', function () {
        state.maxSpice = Number(button.dataset.spice);
        Array.prototype.forEach.call(el.spice, function (other) {
          var active = other === button;
          other.classList.toggle('is-active', active);
          other.setAttribute('aria-checked', active ? 'true' : 'false');
        });
        render();
      });
    });

    el.reset.addEventListener('click', function () {
      state.query = '';
      state.category = 'all';
      state.veg = false;
      state.noNuts = false;
      state.picksOnly = false;
      state.maxSpice = 3;
      el.search.value = '';
      el.clearSearch.hidden = true;
      el.filterVeg.checked = false;
      el.filterNoNuts.checked = false;
      el.filterPicks.checked = false;
      Array.prototype.forEach.call(el.spice, function (button) {
        var active = button.dataset.spice === '3';
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-checked', active ? 'true' : 'false');
      });
      syncChips();
      render();
    });
  }

  function wirePicks() {
    el.picksButton.addEventListener('click', openPicks);
    el.picksClose.addEventListener('click', closePicks);
    el.picksBackdrop.addEventListener('click', closePicks);
    el.picksClear.addEventListener('click', function () {
      var ids = state.picks.slice();
      state.picks = [];
      savePicks();
      ids.forEach(syncPickUI);
      syncPickUI('');
      renderPicks();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !el.picksPanel.hidden) closePicks();
    });
  }

  function renderStaticBits() {
    RESTAURANT.hours.forEach(function (row) {
      var pair = document.createElement('div');
      var dt = document.createElement('dt');
      dt.textContent = row.days;
      var dd = document.createElement('dd');
      dd.textContent = row.time;
      pair.appendChild(dt);
      pair.appendChild(dd);
      el.hours.appendChild(pair);
    });
    el.year.textContent = String(new Date().getFullYear());
  }

  function init() {
    var saved = storedTheme();
    if (saved === 'light' || saved === 'dark') applyTheme(saved);
    el.themeToggle.addEventListener('click', function () {
      applyTheme(currentlyDark() ? 'light' : 'dark');
    });

    var wide = window.matchMedia('(min-width: 760px)');
    el.disclosure.open = wide.matches;
    var onWidthChange = function (event) { el.disclosure.open = event.matches; };
    if (wide.addEventListener) wide.addEventListener('change', onWidthChange);
    else if (wide.addListener) wide.addListener(onWidthChange);

    buildChips();
    wireFilters();
    wirePicks();
    renderStaticBits();
    render();
    syncPickUI('');
    renderPicks();
  }

  init();
})();
