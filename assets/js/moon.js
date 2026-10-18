/* Background moon: a lit sphere drawn from a lunar texture map; it turns as the page scrolls.
   Falls back to the static CSS moon when canvas or the texture is unavailable. */
(function () {
  'use strict';
  var root = document.documentElement;
  var c = document.createElement('canvas');
  var ctx = c.getContext && c.getContext('2d');
  if (!ctx || !window.requestAnimationFrame) return;
  c.id = 'moon3d'; c.setAttribute('aria-hidden', 'true');

  var S = 0, tex = null, TW = 1024, TH = 512, img, out;
  var u0, vv, shade, mask;                 // per-pixel precomputed data
  var rot = 0, target = 0, queued = false, ready = false;
  var TILT = 0.38, SPEED = 0.0032;         // axial tilt (rad), radians turned per scrolled pixel
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function size() {
    var css = Math.max(190, Math.min(360, window.innerWidth * 0.24));
    return Math.round(css * Math.min(window.devicePixelRatio || 1, 2));
  }

  function build() {
    S = size(); c.width = S; c.height = S;
    out = ctx.createImageData(S, S);
    var n = S * S; u0 = new Float32Array(n); vv = new Float32Array(n);
    shade = new Float32Array(n); mask = new Uint8Array(n);
    var ct = Math.cos(TILT), st = Math.sin(TILT);
    var L = [-0.55, 0.45, 0.70], ll = Math.sqrt(L[0]*L[0] + L[1]*L[1] + L[2]*L[2]);
    L = [L[0]/ll, L[1]/ll, L[2]/ll];
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var px = (x + 0.5) / S * 2 - 1, py = 1 - (y + 0.5) / S * 2, r2 = px*px + py*py, i = y*S + x;
      if (r2 >= 1) continue;
      var pz = Math.sqrt(1 - r2); mask[i] = 1;
      var d = px*L[0] + py*L[1] + pz*L[2];
      shade[i] = 0.06 + 0.94 * Math.pow(Math.max(0, d), 0.85);
      var ty = py*ct - pz*st, tz = py*st + pz*ct;      // tilt the pole toward the viewer
      u0[i] = Math.atan2(px, tz) / (2 * Math.PI) + 0.5;
      vv[i] = 0.5 - Math.asin(Math.max(-1, Math.min(1, ty))) / Math.PI;
    }
    draw();
  }

  function draw() {
    if (!ready) return;
    var o = out.data, shift = rot / (2 * Math.PI);
    for (var i = 0, n = S * S; i < n; i++) {
      var p = i * 4;
      if (!mask[i]) { o[p+3] = 0; continue; }
      var u = u0[i] + shift; u -= Math.floor(u);
      var t = (((vv[i] * (TH - 1)) | 0) * TW + ((u * TW) | 0)) * 4, s = shade[i];
      o[p] = tex[t] * s; o[p+1] = tex[t+1] * s; o[p+2] = tex[t+2] * s; o[p+3] = 255;
    }
    ctx.putImageData(out, 0, 0);
  }

  function frame() {
    queued = false;
    var diff = target - rot;
    if (Math.abs(diff) < 0.0004) rot = target; else { rot += diff * 0.14; queue(); }
    draw();
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(frame); } }
  function onScroll() {
    target = (window.pageYOffset || root.scrollTop || 0) * SPEED;
    if (reduce) { rot = target; }
    queue();
  }

  img = new Image();
  img.onload = function () {
    try {
      var t = document.createElement('canvas'); t.width = TW; t.height = TH;
      var tc = t.getContext('2d'); tc.drawImage(img, 0, 0, TW, TH);
      tex = tc.getImageData(0, 0, TW, TH).data;
    } catch (e) { return; }                    // tainted canvas, keep the CSS moon
    ready = true;
    document.body.appendChild(c); root.className += ' moon-3d';
    build(); onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { build(); }, 150); });
  };
  img.src = (document.currentScript && document.currentScript.src
    ? document.currentScript.src.replace(/[^\/]*(\?.*)?$/, '') : '') + '../img/moon-texture.jpg';
})();
