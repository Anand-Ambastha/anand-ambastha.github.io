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
    '@keyframes dwPulse{0%,100%{opacity:.75}50%{opacity:1}}' +
    '@keyframes dwRise{0%{transform:translateY(0) translateX(0);opacity:0}12%{opacity:.9}100%{transform:translateY(-105vh) translateX(var(--dx,20px));opacity:0}}' +
    '@media (prefers-reduced-motion:reduce){#dw-glow{animation:none}#dw-sparks{display:none}}';

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
      ['dw-glow', 'dw-sparks', 'dw-chip', 'dw-css'].forEach(function (id) { var n = d.getElementById(id); if (n) n.parentNode.removeChild(n); });
    }, left);
  }
  if (d.body) start(); else d.addEventListener('DOMContentLoaded', start);
})();
