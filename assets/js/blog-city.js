/* Blog page city: each post lives in one building. Picking a post (card or building) flies the camera to
   that building and opens the post on its wall. Needs WebGL; without it the plain post list is all there is. */
(function () {
  'use strict';
  var stage = document.getElementById('city-stage'), sec = document.getElementById('city');
  if (!stage || !sec) return;

  function webgl() {
    try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); }
    catch (e) { return false; }
  }

  var city = null, posts = [], bySlug = {}, current = null, token = 0;
  var panel, body, tip, hint, bar, sw, intro;
  var enabled = true, root = document.documentElement;
  function store(k, v) { try { if (v === undefined) return window.localStorage.getItem(k); window.localStorage.setItem(k, v); } catch (e) {} return null; }
  function seen(v) { try { if (v === undefined) return window.sessionStorage.getItem('cityIntro'); window.sessionStorage.setItem('cityIntro', v); } catch (e) {} return null; }

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  function buildPanel() {
    panel = el('article', 'city-panel'); panel.hidden = true; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Blog post');
    body = el('div', 'city-panel-body');
    panel.appendChild(body); stage.appendChild(panel);
    tip = el('div', 'city-tip'); tip.hidden = true; stage.appendChild(tip);
    hint = el('p', 'city-hint', 'Every building holds one post. Pick a building or a post below.'); sec.appendChild(hint);
    stage.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect(); tip.style.left = (e.clientX - r.left + 14) + 'px'; tip.style.top = (e.clientY - r.top + 16) + 'px';
    });
  }

  function buildBar() {
    bar = el('div', 'city-bar');
    bar.innerHTML = '<span class="cb-label" id="cb-label">City background</span>' +
      '<button type="button" class="city-switch" role="switch" aria-labelledby="cb-label" aria-checked="true"><span class="cs-knob"></span></button>' +
      '<span class="cb-state" aria-live="polite"></span>';
    sec.insertBefore(bar, sec.firstChild); sw = bar.querySelector('button');
    sw.addEventListener('click', function () { setEnabled(!enabled, true); });
  }

  function setEnabled(on, remember) {
    enabled = on;
    sw.setAttribute('aria-checked', String(on));
    bar.querySelector('.cb-state').textContent = on ? 'City' : 'Moon';
    sec.classList.toggle('is-off', !on);
    root.classList.toggle('city-bg', on);
    if (remember) store('blogCity', on ? 'on' : 'off');
    if (!on) {
      if (intro) endIntro(true);
      if (current) { current = null; token++; panel.hidden = true; if (city) city.back(); }
      root.classList.remove('city-open');
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    }
  }

  function startIntro() {
    var moon = stage.getAttribute('data-moon'), crater = stage.getAttribute('data-crater');
    intro = el('div', 'city-intro');
    intro.innerHTML = '<div class="ci-moon"></div><div class="ci-crater"></div><div class="ci-shade"></div>' +
      '<div class="ci-copy"><p class="ci-eyebrow">Blog</p><h2>Want to know my thoughts?</h2>' +
      '<p class="ci-sub">Let\u2019s enter the city.</p>' +
      '<button type="button" class="pill ci-enter" disabled>Loading the city\u2026</button>' +
      '<button type="button" class="ci-skip">Just show me the posts</button></div>';
    intro.querySelector('.ci-moon').style.backgroundImage = 'url("' + moon + '")';
    intro.querySelector('.ci-crater').style.backgroundImage = 'url("' + crater + '")';
    document.body.appendChild(intro); stage.classList.add('has-intro'); root.classList.add('city-open');
    intro.querySelector('.ci-enter').addEventListener('click', function () { endIntro(false); });
    intro.querySelector('.ci-skip').addEventListener('click', function () { setEnabled(false, true); });
  }

  function endIntro(instant) {
    if (!intro) return;
    var node = intro; intro = null; seen('1');
    stage.classList.remove('has-intro'); root.classList.remove('city-open');
    if (instant) { node.remove(); return; }
    node.classList.add('leaving'); stage.classList.add('entering');
    setTimeout(function () { node.remove(); stage.classList.remove('entering'); }, 1400);
  }

  function slugOf(href) {
    var m = /blog\/([^\/#?]+)\/?(?:[?#].*)?$/.exec(href) || /#([^\/#?]+)$/.exec(href);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function content(p) {
    if (window.marked && window.DOMPurify && window.Blog) return Promise.resolve(Blog.render(p.body));
    return fetch(Blog.ROOT + 'blog/' + encodeURIComponent(p.slug) + '/', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('post'); return r.text(); })
      .then(function (t) { var d = new DOMParser().parseFromString(t, 'text/html'); var pr = d.getElementById('prose'); if (!pr) throw new Error('prose'); return pr.innerHTML; });
  }

  function ensureMath(node) {
    if (window.MathJax && window.MathJax.typesetPromise) return Blog.typeset(node);
    if (!/\\\(|\\\[/.test(node.innerHTML)) return;
    if (!document.getElementById('mj')) {
      window.MathJax = { svg: { fontCache: 'local' } };
      var s = document.createElement('script'); s.id = 'mj'; s.async = true;
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-svg.min.js'; document.head.appendChild(s);
    }
    Blog.typeset(node);
  }

  function layout(rect) {
    var W = rect.stageW, H = rect.stageH, narrow = W < 720, TOP = 96;
    var w, h, x, y;
    if (narrow) { x = 8; y = TOP; w = W - 16; h = H - y - 10; }
    else {
      w = Math.max(380, Math.min(rect.w, 760)); h = Math.max((H - TOP) * 0.8, Math.min(rect.h, H - TOP - 16));
      x = rect.x + (rect.w - w) / 2; y = rect.y + (rect.h - h) / 2;
      x = Math.max(12, Math.min(x, W - w - 12)); y = Math.max(TOP, Math.min(y, H - h - 14));
    }
    panel.style.left = x + 'px'; panel.style.top = y + 'px'; panel.style.width = w + 'px'; panel.style.height = h + 'px';
  }

  function show(slug, rect) {
    var p = bySlug[slug]; if (!p || current !== slug) return;
    var i = posts.indexOf(p), newer = posts[i - 1], older = posts[i + 1], my = ++token;
    var tags = p.tags.map(function (t) { return '<span class="tag">' + Blog.esc(t) + '</span>'; }).join('');
    body.innerHTML =
      '<div class="cp-top"><span class="cp-meta">' + Blog.esc(Blog.fmt(p.date)) + ' · ' + p.minutes + ' min read</span>' +
      '<span class="cp-actions"><a class="cp-link" href="' + Blog.ROOT + 'blog/' + encodeURIComponent(p.slug) + '/">Full page ↗</a>' +
      '<button type="button" class="cp-close" aria-label="Close and return to the city">✕</button></span></div>' +
      (tags ? '<div class="tags">' + tags + '</div>' : '') + '<h2 class="cp-title"></h2>' +
      '<div class="prose cp-prose"><p class="notice">Loading…</p></div>' +
      '<div class="cp-nav">' + (newer ? '<button type="button" data-s="' + Blog.esc(newer.slug) + '">← Newer</button>' : '<span></span>') +
      (older ? '<button type="button" data-s="' + Blog.esc(older.slug) + '">Older →</button>' : '<span></span>') + '</div>';
    body.querySelector('.cp-title').textContent = p.title;
    panel.scrollTop = 0; body.scrollTop = 0;
    layout(rect); panel.hidden = false; panel.classList.remove('in'); void panel.offsetWidth; panel.classList.add('in');
    var prose = body.querySelector('.cp-prose');
    content(p).then(function (html) {
      if (my !== token) return;
      prose.innerHTML = html; Blog.decorate(prose); ensureMath(prose);
    }).catch(function () { if (my === token) prose.innerHTML = '<p class="notice">This post could not be loaded. <a href="' + Blog.ROOT + 'blog/' + encodeURIComponent(p.slug) + '/">Open the full page</a>.</p>'; });
    var close = body.querySelector('.cp-close'); if (close) close.focus({ preventScroll: true });
  }

  function open(slug) {
    if (!city || !enabled || !city.has(slug)) return false;
    current = slug; panel.hidden = true; token++;
    root.classList.add('city-open');
    city.focus(slug);
    try { history.replaceState(null, '', '#' + encodeURIComponent(slug)); } catch (e) {}
    return true;
  }

  function close() {
    if (!current) return;
    current = null; token++; panel.hidden = true; root.classList.remove('city-open'); city.back();
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  }

  function init(list) {
    if (!webgl()) return;
    posts = list; bySlug = {}; list.forEach(function (p) { bySlug[p.slug] = p; });
    document.body.insertBefore(stage, document.body.firstChild);   // fixed backdrop, outside the page content
    buildPanel(); buildBar();
    sec.hidden = false;
    var wantOn = store('blogCity') !== 'off', deep = '';
    try { deep = decodeURIComponent(location.hash.slice(1)); } catch (e) {}
    setEnabled(wantOn, false);
    if (wantOn && !seen() && !(deep && bySlug[deep])) startIntro();
    function fail() { sec.hidden = true; root.classList.remove('city-bg', 'city-open'); if (intro) endIntro(true); }
    var s = document.createElement('script'); s.src = stage.getAttribute('data-bundle');
    s.onload = function () {
      if (!window.BlogCity) return;
      var c = window.BlogCity.create({ el: stage, model: stage.getAttribute('data-model') });
      c.ready.then(function () {
        city = c; c.assign(list.map(function (p) { return p.slug; }));
        c.onFocus = show;
        c.onPick = function (slug) { if (slug) open(slug); else close(); };
        c.onHover = function (slug) { var p = slug && bySlug[slug]; tip.hidden = !p; if (p) tip.textContent = p.title; };
        sec.classList.add('ready');
        if (intro) { var b = intro.querySelector('.ci-enter'); b.disabled = false; b.textContent = 'Enter the city'; }
        if (enabled && deep && bySlug[deep]) setTimeout(function () { open(deep); }, 400);
      }, function () { fail(); });
    };
    s.onerror = fail;
    document.head.appendChild(s);

    document.addEventListener('click', function (e) {
      if (!city || !enabled || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var t = e.target;
      var btn = t.closest && t.closest('.city-panel button');
      if (btn) {
        if (btn.classList.contains('cp-close')) return close();
        var n = btn.getAttribute('data-s'); if (n && city.has(n)) { current = n; panel.hidden = true; token++; city.focus(n); try { history.replaceState(null, '', '#' + encodeURIComponent(n)); } catch (x) {} }
        return;
      }
      var a = t.closest && t.closest('a.post-card'); if (!a) return;
      var slug = slugOf(a.getAttribute('href') || '');
      if (slug && open(slug)) e.preventDefault();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && current && enabled) close(); });
  }

  window.BlogCityUI = { init: init };
})();
