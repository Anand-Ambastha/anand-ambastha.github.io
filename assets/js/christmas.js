/* Christmas theme for the home page and the blog index only.
   Active 24 Dec 2026 18:00 IST to 26 Dec 2026 03:00 IST, then does nothing. */
(function () {
  'use strict';
  var START = Date.UTC(2026, 11, 24, 12, 30, 0); // 24 Dec 18:00 IST
  var END = Date.UTC(2026, 11, 25, 21, 30, 0);   // 26 Dec 03:00 IST
  var p = location.pathname.replace(/index\.html$/, '');
  if (!(p === '/' || p === '/blog/' || p === '/blog')) return;
  if (Date.now() >= END) return;
  var d = document;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var IDS = ['xm-css', 'xm-glow', 'xm-snow', 'xm-garland', 'xm-chip'];

  var css = '' +
    ':root{--accent:#ff8d85}' +
    '#xm-glow{position:fixed;left:0;right:0;bottom:0;height:42vh;pointer-events:none;z-index:0;mix-blend-mode:screen;' +
    'background:radial-gradient(55% 100% at 25% 100%,rgba(40,200,110,.14),transparent 70%),radial-gradient(55% 100% at 75% 100%,rgba(255,70,70,.16),transparent 70%);animation:xmPulse 6s ease-in-out infinite}' +
    '#xm-snow{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0}' +
    '#xm-garland{position:fixed;top:0;left:0;right:0;height:30px;pointer-events:none;z-index:50;overflow:hidden}' +
    '#xm-garland svg{width:100%;height:100%;display:block}' +
    '#xm-garland .w{fill:none;stroke:rgba(120,200,140,.55);stroke-width:1.6}' +
    '#xm-garland circle{animation:xmTw 2.4s ease-in-out infinite}' +
    '#xm-chip{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:11;pointer-events:none;font:500 13px/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.02em;' +
    'color:#ffe3e0;background:rgba(40,8,10,.74);border:1px solid rgba(255,120,120,.4);border-radius:999px;padding:9px 16px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);opacity:0;transition:opacity .8s ease}' +
    '#xm-chip.on{opacity:1}' +
    '@keyframes xmTw{0%,100%{opacity:.45}50%{opacity:1}}' +
    '@keyframes xmPulse{0%,100%{opacity:.7}50%{opacity:1}}' +
    '@media (prefers-reduced-motion:reduce){#xm-garland circle,#xm-glow{animation:none}}';

  function garland() {
    var W = 1200, H = 30, n = 26, COLS = ['#ff5a5a', '#3ddc84', '#ffd36b', '#6ec1ff'];
    var path = 'M0 3 Q' + (W / 4) + ' 24 ' + (W / 2) + ' 6 T' + W + ' 3';
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true"><path class="w" d="' + path + '"/>';
    // two sagging arcs; bulbs placed along the quadratic curves
    function pt(t, x0, x1, cy) { var x = x0 + (x1 - x0) * t, y = (1 - t) * (1 - t) * 3 + 2 * t * (1 - t) * cy + t * t * 3; return [x, y]; }
    var per = n / 2;
    for (var a = 0; a < 2; a++) {
      var x0 = a * W / 2, x1 = x0 + W / 2;
      for (var i = 0; i < per; i++) {
        var t = (i + .5) / per, q = pt(t, x0, x1, 24);
        var k = a * per + i;
        s += '<circle cx="' + q[0].toFixed(1) + '" cy="' + (q[1] + 2).toFixed(1) + '" r="3.2" fill="' + COLS[k % 4] + '" style="animation-delay:' + (-(k * .31) % 2.4).toFixed(2) + 's;filter:drop-shadow(0 0 5px ' + COLS[k % 4] + ')"/>';
      }
    }
    return s + '</svg>';
  }

  function snow(cv) {
    var ctx = cv.getContext('2d'); if (!ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2), w = 0, h = 0, fl = [];
    function size() { w = innerWidth; h = innerHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); addEventListener('resize', size);
    var N = Math.round(Math.min(90, Math.max(35, w / 16)));
    for (var i = 0; i < N; i++) fl.push({ x: Math.random() * w, y: Math.random() * h, r: .8 + Math.random() * 2.2, v: .25 + Math.random() * .7, ph: Math.random() * 6.28 });
    function draw() {
      if (!cv.parentNode) return;
      ctx.clearRect(0, 0, w, h); ctx.fillStyle = 'rgba(255,255,255,.8)';
      for (var i = 0; i < fl.length; i++) {
        var f = fl[i]; if (!reduce) { f.y += f.v; f.ph += .01; f.x += Math.sin(f.ph) * .35; }
        if (f.y > h + 5) { f.y = -5; f.x = Math.random() * w; }
        ctx.globalAlpha = .35 + f.r / 4; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.fill();
      }
      if (!reduce) requestAnimationFrame(draw);
    }
    draw();
  }

  function stop() { IDS.forEach(function (id) { var n = d.getElementById(id); if (n && n.parentNode) n.parentNode.removeChild(n); }); }

  function go() {
    if (d.getElementById('xm-css')) return;
    var st = d.createElement('style'); st.id = 'xm-css'; st.textContent = css; d.head.appendChild(st);
    var g = d.createElement('div'); g.id = 'xm-glow'; g.setAttribute('aria-hidden', 'true'); d.body.appendChild(g);
    var cv = d.createElement('canvas'); cv.id = 'xm-snow'; cv.setAttribute('aria-hidden', 'true'); d.body.appendChild(cv); snow(cv);
    var gl = d.createElement('div'); gl.id = 'xm-garland'; gl.innerHTML = garland(); d.body.appendChild(gl);
    var seen = false; try { seen = sessionStorage.getItem('xmChip') === '1'; } catch (e) {}
    if (!seen) {
      var c = d.createElement('div'); c.id = 'xm-chip'; c.textContent = '🎄 Merry Christmas'; d.body.appendChild(c);
      setTimeout(function () { c.className = 'on'; }, 600);
      setTimeout(function () { c.className = ''; }, 7000);
      setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 8000);
      try { sessionStorage.setItem('xmChip', '1'); } catch (e) {}
    }
    var left = END - Date.now();
    if (left < 2147000000) setTimeout(stop, left);
  }

  function begin() {
    var wait = START - Date.now();
    if (wait <= 0) go(); else if (wait < 2147000000) setTimeout(go, wait);
  }
  if (d.body) begin(); else d.addEventListener('DOMContentLoaded', begin);
})();
