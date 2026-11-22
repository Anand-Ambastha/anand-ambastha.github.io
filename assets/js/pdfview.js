/* In-site PDF viewer. Links to PDF files on this site open in a full-screen viewer on the same page
   (pdf.js, served from this site; nothing is requested from other sites). Links with a download attribute still download. */
(function () {
  'use strict';
  var d = document, cs = d.currentScript, base = cs && cs.src ? cs.src.replace(/pdfview\.js(\?.*)?$/, '') : null;
  if (!base) return;
  var lib = null, modal, scroller, label, pager, doc, scale = 1, fitW = 0, token = 0, io;

  var css = '' +
    '#pv{position:fixed;inset:0;z-index:60;display:none;flex-direction:column;background:#05060a}' +
    '#pv.on{display:flex}' +
    '#pv .bar{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.12);font:500 13px var(--font-mono,ui-monospace,monospace);color:#cfd3dc}' +
    '#pv .ttl{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '#pv button{font:inherit;color:#fff;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.28);border-radius:999px;padding:6px 13px;cursor:pointer}' +
    '#pv button:hover{background:rgba(255,255,255,.17)}' +
    '#pv .sc{flex:1;overflow:auto;padding:18px 12px 40px;-webkit-overflow-scrolling:touch}' +
    '#pv .pg{display:block;margin:0 auto 14px;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,.5);max-width:none}' +
    '#pv .msg{text-align:center;color:#aab;font:14px var(--font-sans,system-ui);padding:40px 0}';

  function loadLib(cb, fail) {
    if (lib) return cb(lib);
    var s = d.createElement('script'); s.src = base + 'vendor/pdf.min.js';
    s.onload = function () {
      lib = window.pdfjsLib; if (!lib) return fail();
      lib.GlobalWorkerOptions.workerSrc = base + 'vendor/pdf.worker.min.js'; cb(lib);
    };
    s.onerror = fail; d.head.appendChild(s);
  }

  function build() {
    if (modal) return;
    var st = d.createElement('style'); st.textContent = css; d.head.appendChild(st);
    modal = d.createElement('div'); modal.id = 'pv'; modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-label', 'Document viewer');
    modal.innerHTML = '<div class="bar"><span class="ttl"></span><span class="pn"></span><button type="button" data-a="out" aria-label="Zoom out">−</button><button type="button" data-a="in" aria-label="Zoom in">+</button><button type="button" data-a="fit">Fit width</button><button type="button" data-a="x">Close</button></div><div class="sc"></div>';
    scroller = modal.querySelector('.sc'); label = modal.querySelector('.ttl'); pager = modal.querySelector('.pn');
    modal.addEventListener('click', function (e) {
      var a = e.target.getAttribute && e.target.getAttribute('data-a'); if (!a) return;
      if (a === 'x') close(); else if (a === 'in') zoom(1.25); else if (a === 'out') zoom(0.8); else if (a === 'fit') { scale = 1; render(); }
    });
    d.addEventListener('keydown', function (e) {
      if (!modal.classList.contains('on')) return;
      if (e.key === 'Escape') close();
      else if (e.key === '+' || e.key === '=') zoom(1.25); else if (e.key === '-') zoom(0.8);
    });
    d.body.appendChild(modal);
  }

  function close() {
    modal.classList.remove('on'); token++; scroller.innerHTML = ''; d.documentElement.style.overflow = '';
    if (doc) { try { doc.destroy(); } catch (e) {} doc = null; }
    if (io) { io.disconnect(); io = null; }
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function zoom(f) { scale = Math.max(0.4, Math.min(4, scale * f)); render(); }

  function render() {
    if (!doc) return;
    var my = ++token, y = scroller.scrollTop / Math.max(1, scroller.scrollHeight);
    scroller.innerHTML = ''; if (io) io.disconnect();
    fitW = Math.min(scroller.clientWidth - 24, 1000);
    var dpr = Math.min(window.devicePixelRatio || 1, 2), n = doc.numPages, holders = [];
    io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { io.unobserve(en.target); en.target._draw(); } });
    }, { root: scroller, rootMargin: '1200px 0px' }) : null;
    // append in order: pages resolve in order because getPage queues sequentially
    var chain = Promise.resolve();
    for (var i = 1; i <= n; i++) (function (i) { chain = chain.then(function () { return my === token ? new Promise(function (r) { doc.getPage(i).then(function (page) { r(page); }); }).then(function (page) {
      if (my !== token) return;
      var v1 = page.getViewport({ scale: 1 }), cssW = fitW * scale, k = cssW / v1.width, vp = page.getViewport({ scale: k * dpr });
      var c = d.createElement('canvas'); c.className = 'pg'; c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
      c.style.width = (vp.width / dpr) + 'px'; c.style.height = (vp.height / dpr) + 'px';
      c.setAttribute('role', 'img'); c.setAttribute('aria-label', 'Page ' + i + ' of ' + n);
      c._draw = function () { if (my === token) page.render({ canvasContext: c.getContext('2d'), viewport: vp, background: '#ffffff' }); };
      scroller.appendChild(c); if (io) io.observe(c); else c._draw();
      if (i === 1 && y > 0.01) scroller.scrollTop = y * scroller.scrollHeight;
    }) : null; }); })(i);
    pager.textContent = n + (n === 1 ? ' page' : ' pages');
  }

  var lastFocus = null;
  function open(url, title, fallback) {
    build(); lastFocus = d.activeElement;
    label.textContent = title || url.split('/').pop();
    scroller.innerHTML = '<p class="msg">Loading…</p>'; pager.textContent = '';
    modal.classList.add('on'); d.documentElement.style.overflow = 'hidden'; scale = 1;
    modal.querySelector('[data-a="x"]').focus();
    var bail = function () { close(); window.open(fallback || url, '_blank', 'noopener'); };
    loadLib(function (L) {
      L.getDocument({ url: url }).promise.then(function (p) { doc = p; scroller.innerHTML = ''; render(); }, bail);
    }, bail);
  }

  function isPdf(a) {
    if (a.hasAttribute('download') || a.closest('#pv')) return false;
    var u; try { u = new URL(a.href, location.href); } catch (e) { return false; }
    return u.origin === location.origin && /\.pdf$/i.test(u.pathname) ? u : false;
  }
  function nice(a, u) {
    var t = (a.getAttribute('data-title') || '').trim();
    if (t) return t;
    var h = a.closest('article, .row, .card, li'); var h3 = h && h.querySelector('h3, h2');
    return h3 ? h3.textContent.replace(/\s+/g, ' ').trim() : decodeURIComponent(u.pathname.split('/').pop()).replace(/[_]/g, ' ').replace(/\.pdf$/i, '');
  }
  d.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button > 0) return;
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    var u = isPdf(a); if (!u) return;
    e.preventDefault(); open(u.href, nice(a, u), u.href);
  });
})();
