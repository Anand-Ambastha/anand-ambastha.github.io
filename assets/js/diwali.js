/* Subtle Diwali greeting. Self-expiring: does nothing after 9 Nov 2026, 07:00 IST (01:30 UTC). */
(function () {
  'use strict';
  var END = Date.UTC(2026, 10, 9, 1, 30, 0); // 9 Nov 2026 07:00 IST
  if (Date.now() >= END) return;
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var css = '' +
    '#dw-glow{position:fixed;left:0;right:0;bottom:0;height:46vh;pointer-events:none;z-index:0;mix-blend-mode:screen;' +
    'background:radial-gradient(60% 100% at 50% 100%,rgba(255,150,40,.20),rgba(255,110,20,.07) 55%,transparent 80%);animation:dwPulse 5s ease-in-out infinite}' +
    '#dw-sparks{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}' +
    '#dw-sparks i{position:absolute;bottom:-12px;width:3px;height:3px;border-radius:50%;background:#ffc86b;box-shadow:0 0 8px 2px rgba(255,170,60,.6);opacity:0;animation:dwRise linear infinite}' +
    '#dw-chip{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:11;pointer-events:none;font:500 13px/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.02em;' +
    'color:#ffd9a0;background:rgba(40,22,6,.72);border:1px solid rgba(255,180,80,.35);border-radius:999px;padding:9px 16px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);' +
    'opacity:0;transition:opacity .8s ease}' +
    '#dw-chip.on{opacity:1}' +
    '#dw-lights{position:fixed;inset:0;pointer-events:none;z-index:0}' +
    '#dw-lights i{position:absolute;width:5px;height:5px;margin:-2.5px 0 0 -2.5px;border-radius:50%;background:var(--c);box-shadow:0 0 6px 2px var(--c);animation:dwTwinkle 2.6s ease-in-out infinite}' +
    '@keyframes dwTwinkle{0%,100%{opacity:.35;transform:scale(.8)}50%{opacity:1;transform:scale(1.15)}}' +
    '@keyframes dwPulse{0%,100%{opacity:.75}50%{opacity:1}}' +
    '@keyframes dwRise{0%{transform:translateY(0) translateX(0);opacity:0}12%{opacity:.9}100%{transform:translateY(-105vh) translateX(var(--dx,20px));opacity:0}}' +
    '@media (prefers-reduced-motion:reduce){#dw-lights i{animation:none;opacity:.85}#dw-glow{animation:none}#dw-sparks{display:none}}';

  function start() {
    if (d.getElementById('dw-glow')) return;
    var st = d.createElement('style'); st.id = 'dw-css'; st.textContent = css; d.head.appendChild(st);
    var glow = d.createElement('div'); glow.id = 'dw-glow'; glow.setAttribute('aria-hidden', 'true'); d.body.appendChild(glow);
    var sp = d.createElement('div'); sp.id = 'dw-sparks'; sp.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < 16; i++) {
      var s = d.createElement('i');
      s.style.left = (Math.random() * 100).toFixed(1) + '%';
      s.style.animationDuration = (11 + Math.random() * 12).toFixed(1) + 's';
      s.style.animationDelay = (-Math.random() * 20).toFixed(1) + 's';
      s.style.setProperty('--dx', ((Math.random() - .5) * 80).toFixed(0) + 'px');
      sp.appendChild(s);
    }
    d.body.appendChild(sp);

    var lights = d.createElement('div'); lights.id = 'dw-lights'; lights.setAttribute('aria-hidden', 'true'); d.body.appendChild(lights);
    var COLS = ['#ffc86b', '#ff9a3c', '#ffe6a8', '#ff7f50'];
    var bulbs = [], geo = null, rot = 0, target = 0, queued = false, SPEED = 0.0012; // same turn rate as the moon
    function layout() {
      var cur = rot;
      for (var k = 0; k < bulbs.length; k++) {
        var a = bulbs[k].a + cur;
        var x = geo.cx + geo.rad * Math.cos(a), y = geo.cy - geo.rad * Math.sin(a);
        var ok = x > -10 && y > -10 && x < innerWidth + 10 && y < innerHeight + 10;
        bulbs[k].el.style.left = x.toFixed(1) + 'px'; bulbs[k].el.style.top = y.toFixed(1) + 'px';
        bulbs[k].el.style.visibility = ok ? 'visible' : 'hidden';
      }
    }
    function tick() {
      queued = false;
      var diff = target - rot;
      if (Math.abs(diff) < 0.0004) rot = target; else { rot += diff * 0.08; queue(); }
      if (geo) layout();
    }
    function queue() { if (!queued) { queued = true; requestAnimationFrame(tick); } }
    function onScroll() {
      target = (window.pageYOffset || root.scrollTop || 0) * SPEED;
      if (reduce) rot = target;
      queue();
    }
    function place() {
      lights.innerHTML = ''; bulbs = []; geo = null;
      var m = d.getElementById('moon3d');
      if (!m || root.className.indexOf('city-bg') > -1) return;
      var r = m.getBoundingClientRect(); if (!r.width) return;
      geo = { cx: r.left + r.width / 2, cy: r.top + r.height / 2, rad: r.width / 2 * 1.06 };
      var n = 22;
      for (var k = 0; k < n; k++) {
        var b = d.createElement('i');
        b.style.setProperty('--c', COLS[k % COLS.length]);
        b.style.animationDelay = (-(k * 0.37) % 2.6).toFixed(2) + 's';
        lights.appendChild(b);
        bulbs.push({ el: b, a: k * 2 * Math.PI / n + 1.6 });
      }
      rot = target = (window.pageYOffset || root.scrollTop || 0) * SPEED;
      layout();
    }
    addEventListener('scroll', onScroll, { passive: true });
    place(); setTimeout(place, 600); setTimeout(place, 1800);
    var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(place, 200); });

    var seen = false;
    try { seen = sessionStorage.getItem('diwaliChip') === '1'; } catch (e) {}
    if (!seen) {
      var chip = d.createElement('div'); chip.id = 'dw-chip'; chip.textContent = '🪔 Happy Diwali';
      d.body.appendChild(chip);
      setTimeout(function () { chip.className = 'on'; }, 600);
      setTimeout(function () { chip.className = ''; }, 7000);
      setTimeout(function () { if (chip.parentNode) chip.parentNode.removeChild(chip); }, 8000);
      try { sessionStorage.setItem('diwaliChip', '1'); } catch (e) {}
    }
    // remove everything if the page is still open when the window ends
    var left = END - Date.now();
    if (left < 2147000000) setTimeout(function () {
      ['dw-glow', 'dw-sparks', 'dw-lights', 'dw-chip', 'dw-css'].forEach(function (id) { var n = d.getElementById(id); if (n) n.parentNode.removeChild(n); });
    }, left);
  }
  if (d.body) start(); else d.addEventListener('DOMContentLoaded', start);
})();
