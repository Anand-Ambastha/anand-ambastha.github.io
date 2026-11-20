/* View-only image viewer: any element with data-viewer="<image url>" opens it full screen, with zoom and pan.
   There is no download link and the image is drawn as a background, not an <img>. */
(function () {
  'use strict';
  var d = document, ov, stage, img, S = 1, X = 0, Y = 0, ratio = 1, fitW = 0, fitH = 0, drag = null;
  var css = '' +
    '.poster-card{margin-top:22px;max-width:230px}' +
    '.poster-open{all:unset;box-sizing:border-box;display:block;cursor:zoom-in;position:relative;border-radius:14px;overflow:hidden;border:1px solid var(--line,rgba(255,255,255,.14));background:#0b0e13}' +
    '.poster-open img{display:block;width:100%;height:auto;-webkit-user-drag:none;user-select:none;pointer-events:none}' +
    '.poster-open span{position:absolute;left:0;right:0;bottom:0;padding:26px 12px 11px;text-align:center;font:500 12.5px var(--font-mono,monospace);letter-spacing:.04em;color:#fff;background:linear-gradient(transparent,rgba(0,0,0,.78))}' +
    '.poster-open:focus-visible{outline:2px solid rgba(127,178,255,.8);outline-offset:2px}' +
    '.poster-note{margin-top:8px;font-size:12.5px;color:var(--muted,#9aa)}' +
    'button.vbtn{all:unset;cursor:pointer;color:inherit;border-bottom:1px solid currentColor;padding-bottom:2px;font:inherit;font-size:15px}' +
    '#pv{position:fixed;inset:0;z-index:60;display:none;background:rgba(0,0,0,.97);touch-action:none;user-select:none;-webkit-user-select:none}' +
    '#pv.on{display:block}' +
    '#pv .pv-img{position:absolute;left:50%;top:50%;background-repeat:no-repeat;background-size:100% 100%;transform-origin:0 0;will-change:transform;cursor:grab;box-shadow:0 10px 60px rgba(0,0,0,.6)}' +
    '#pv .pv-img.grabbing{cursor:grabbing}' +
    '#pv .pv-bar{position:absolute;top:14px;right:14px;display:flex;gap:8px;z-index:2}' +
    '#pv .pv-bar button{font:500 13px var(--font-mono,monospace);color:#fff;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.3);border-radius:999px;padding:7px 14px;cursor:pointer}' +
    '#pv .pv-bar button:hover{background:rgba(255,255,255,.2)}' +
    '#pv .pv-hint{position:absolute;left:0;right:0;bottom:12px;text-align:center;font:12.5px var(--font-mono,monospace);color:rgba(255,255,255,.55);pointer-events:none}';

  function layout() {
    var vw = innerWidth, vh = innerHeight, maxW = vw * 0.96, maxH = vh * 0.94;
    fitW = Math.min(maxW, maxH * ratio); fitH = fitW / ratio;
    img.style.width = fitW + 'px'; img.style.height = fitH + 'px';
  }
  function apply() {
    var mx = Math.max(0, (fitW * S - innerWidth) / 2 + 80), my = Math.max(0, (fitH * S - innerHeight) / 2 + 80);
    X = Math.max(-mx, Math.min(mx, X)); Y = Math.max(-my, Math.min(my, Y));
    img.style.transform = 'translate(' + (X - fitW * S / 2) + 'px,' + (Y - fitH * S / 2) + 'px) scale(' + S + ')';
  }
  function zoom(f, cx, cy) {
    var n = Math.max(1, Math.min(8, S * f)); if (n === S) return;
    var k = n / S; cx = cx == null ? 0 : cx - innerWidth / 2; cy = cy == null ? 0 : cy - innerHeight / 2;
    X = cx - (cx - X) * k; Y = cy - (cy - Y) * k; S = n; if (S === 1) { X = 0; Y = 0; } apply();
  }
  function close() { ov.className = ''; img.style.backgroundImage = ''; d.documentElement.style.overflow = ''; if (d.__pvFocus) d.__pvFocus.focus(); }
  function build() {
    ov = d.createElement('div'); ov.id = 'pv'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Image viewer');
    ov.innerHTML = '<div class="pv-bar"><button type="button" data-a="out" aria-label="Zoom out">&minus;</button><button type="button" data-a="in" aria-label="Zoom in">+</button><button type="button" data-a="fit">Fit</button><button type="button" data-a="x">Close</button></div><div class="pv-img" role="img"></div><div class="pv-hint">View only. Scroll or use + and &minus; to zoom, drag to move, Esc to close.</div>';
    d.body.appendChild(ov); img = ov.querySelector('.pv-img'); stage = ov;
    ov.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    ov.addEventListener('dragstart', function (e) { e.preventDefault(); });
    ov.addEventListener('click', function (e) {
      var a = e.target.getAttribute && e.target.getAttribute('data-a');
      if (a === 'x') close(); else if (a === 'in') zoom(1.4); else if (a === 'out') zoom(1 / 1.4); else if (a === 'fit') { S = 1; X = 0; Y = 0; apply(); }
      else if (e.target === ov) close();
    });
    ov.addEventListener('wheel', function (e) { e.preventDefault(); zoom(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY); }, { passive: false });
    img.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY, X: X, Y: Y, m: false }; img.setPointerCapture(e.pointerId); img.className = 'pv-img grabbing'; });
    img.addEventListener('pointermove', function (e) { if (!drag) return; X = drag.X + e.clientX - drag.x; Y = drag.Y + e.clientY - drag.y; drag.m = true; apply(); });
    var up = function () { drag = null; img.className = 'pv-img'; };
    img.addEventListener('pointerup', up); img.addEventListener('pointercancel', up);
    img.addEventListener('dblclick', function (e) { if (S > 1) { S = 1; X = 0; Y = 0; apply(); } else zoom(2.5, e.clientX, e.clientY); });
    d.addEventListener('keydown', function (e) {
      if (!ov.className) return;
      if (e.key === 'Escape') close(); else if (e.key === '+' || e.key === '=') zoom(1.4); else if (e.key === '-') zoom(1 / 1.4);
    });
    addEventListener('resize', function () { if (ov.className) { layout(); apply(); } });
  }
  function open(url, from) {
    if (!ov) build();
    d.__pvFocus = from;
    var pre = new Image();
    pre.onload = function () {
      ratio = pre.naturalWidth / pre.naturalHeight; S = 1; X = 0; Y = 0;
      img.style.backgroundImage = 'url("' + url + '")'; layout(); apply();
      ov.className = 'on'; d.documentElement.style.overflow = 'hidden';
      ov.querySelector('[data-a="x"]').focus();
    };
    pre.src = url;
  }
  function init() {
    var st = d.createElement('style'); st.textContent = css; d.head.appendChild(st);
    d.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-viewer]');
      if (t) { e.preventDefault(); open(t.getAttribute('data-viewer'), t); }
    });
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init); else init();
})();
