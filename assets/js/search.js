/* Site search: a button in the top bar opens a search box over a prebuilt index (assets/search-index.json).
   Everything runs in the browser; nothing is sent anywhere. Shortcuts: "/" or Ctrl/Cmd+K to open, Esc to close. */
(function () {
  'use strict';
  var d = document, cs = d.currentScript, src = cs && cs.src;
  if (!src) return;
  var root = src.replace(/assets\/js\/search\.js(\?.*)?$/, '');
  var data = null, loading = false, ov, input, list, btn, sel = 0, hits = [], lastFocus = null;

  var css = '' +
    '.sx-btn{all:unset;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 14px;border-radius:999px;border:1px solid var(--glass-border,rgba(255,255,255,.2));color:var(--muted,#a1a1aa);font:500 13px var(--font-mono,monospace);transition:color .15s,background .15s}' +
    '.sx-btn:hover,.sx-btn:focus-visible{color:var(--fg,#fff);background:rgba(255,255,255,.08)}' +
    '.sx-btn:focus-visible{outline:2px solid rgba(127,178,255,.8);outline-offset:2px}' +
    '.sx-btn svg{width:16px;height:16px;flex:none}' +
    '.sx-btn kbd{font:inherit;font-size:11.5px;padding:1px 6px;border-radius:6px;border:1px solid var(--line,rgba(255,255,255,.15))}' +
    '@media(max-width:720px){.sx-btn{height:36px;padding:0 11px}.sx-btn .sx-l,.sx-btn kbd{display:none}}' +
    '#sx{position:fixed;inset:0;z-index:70;display:none;background:rgba(0,0,0,.72);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);padding:max(8vh,24px) 16px 16px}' +
    '#sx.on{display:block}' +
    '#sx .sx-box{max-width:680px;margin:0 auto;border-radius:20px;background:rgba(14,14,16,.97);border:1px solid var(--glass-border,rgba(255,255,255,.2));box-shadow:0 24px 80px rgba(0,0,0,.7);overflow:hidden}' +
    '#sx .sx-in{display:flex;align-items:center;gap:12px;padding:0 18px;border-bottom:1px solid var(--line,rgba(255,255,255,.12))}' +
    '#sx .sx-in svg{width:18px;height:18px;flex:none;color:var(--muted,#a1a1aa)}' +
    '#sx input{all:unset;box-sizing:border-box;flex:1;height:58px;font:400 17px var(--font-sans,system-ui,sans-serif);color:var(--fg,#fff)}' +
    '#sx input::placeholder{color:var(--muted,#a1a1aa)}' +
    '#sx .sx-x{all:unset;cursor:pointer;font:500 12px var(--font-mono,monospace);color:var(--muted,#a1a1aa);padding:4px 9px;border:1px solid var(--line,rgba(255,255,255,.15));border-radius:8px}' +
    '#sx .sx-x:hover{color:var(--fg,#fff)}' +
    '#sx ul{list-style:none;margin:0;padding:8px;max-height:min(60vh,520px);overflow:auto}' +
    '#sx li a{display:block;padding:12px 14px;border-radius:12px;color:inherit;text-decoration:none}' +
    '#sx li.on a,#sx li a:hover{background:rgba(255,255,255,.09)}' +
    '#sx .sx-s{display:block;font:12px var(--font-mono,monospace);color:var(--muted,#a1a1aa);letter-spacing:.03em;margin-bottom:3px}' +
    '#sx .sx-t{display:block;font-size:16px;line-height:1.35}' +
    '#sx .sx-p{display:block;font-size:13.5px;line-height:1.5;color:var(--muted,#a1a1aa);margin-top:4px}' +
    '#sx mark{background:rgba(127,178,255,.28);color:inherit;border-radius:3px;padding:0 1px}' +
    '#sx .sx-e{padding:26px 18px;text-align:center;color:var(--muted,#a1a1aa);font-size:14.5px}' +
    '#sx .sx-f{padding:10px 18px;border-top:1px solid var(--line,rgba(255,255,255,.12));font:12px var(--font-mono,monospace);color:var(--muted,#a1a1aa)}';

  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';

  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function words(q) { return q.toLowerCase().split(/[^a-z0-9À-ɏ.+-]+/).filter(function (w) { return w.length > 0; }); }

  function load(cb) {
    if (data) return cb();
    if (loading) return;
    loading = true;
    fetch(root + 'assets/search-index.json').then(function (r) { return r.json(); }).then(function (j) {
      data = j.map(function (e) { e.lt = e.t.toLowerCase(); e.ls = e.s.toLowerCase(); e.lx = e.x.toLowerCase(); return e; });
      cb();
    }).catch(function () { loading = false; list.innerHTML = '<li class="sx-e">Search could not load. Try again in a moment.</li>'; });
  }

  function score(e, ws) {
    var sc = 0;
    for (var i = 0; i < ws.length; i++) {
      var w = ws[i], s = 0;
      if (e.lt.indexOf(w) > -1) s += e.lt.indexOf(w) === 0 ? 9 : 6;
      if (e.ls.indexOf(w) > -1) s += 2;
      var n = 0, p = -1; while ((p = e.lx.indexOf(w, p + 1)) > -1 && n < 4) n++;
      s += n;
      if (!s) return 0;
      sc += s;
    }
    return sc;
  }

  function snippet(e, ws) {
    var i = -1;
    for (var k = 0; k < ws.length && i < 0; k++) i = e.lx.indexOf(ws[k]);
    var from = Math.max(0, (i < 0 ? 0 : i) - 60), txt = e.x.slice(from, from + 170);
    if (from > 0) txt = '… ' + txt;
    if (from + 170 < e.x.length) txt += ' …';
    return mark(esc(txt), ws);
  }
  function mark(html, ws) {
    ws.forEach(function (w) {
      if (w.length < 2) return;
      html = html.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>');
    });
    return html;
  }

  function render() {
    var q = input.value.trim(), ws = words(q);
    sel = 0;
    if (!ws.length) { hits = []; list.innerHTML = '<li class="sx-e">Type to search projects, research, publications and blog posts.</li>'; return; }
    hits = data.map(function (e) { return { e: e, s: score(e, ws) }; }).filter(function (h) { return h.s > 0; })
      .sort(function (a, b) { return b.s - a.s; }).slice(0, 12);
    if (!hits.length) { list.innerHTML = '<li class="sx-e">Nothing found for &ldquo;' + esc(q) + '&rdquo;. Try a shorter word.</li>'; return; }
    list.innerHTML = hits.map(function (h, i) {
      return '<li role="option"' + (i === 0 ? ' class="on"' : '') + '><a href="' + root + h.e.u + '"><span class="sx-s">' + esc(h.e.s) + '</span><span class="sx-t">' + mark(esc(h.e.t), ws) + '</span><span class="sx-p">' + snippet(h.e, ws) + '</span></a></li>';
    }).join('');
  }

  function mv(n) {
    var items = list.querySelectorAll('li[role=option]'); if (!items.length) return;
    items[sel].classList.remove('on'); sel = (sel + n + items.length) % items.length;
    items[sel].classList.add('on'); items[sel].scrollIntoView({ block: 'nearest' });
  }

  function open() {
    lastFocus = d.activeElement; ov.className = 'on'; d.documentElement.style.overflow = 'hidden';
    input.value = ''; list.innerHTML = '<li class="sx-e">Loading…</li>';
    load(function () { render(); }); input.focus();
  }
  function close() { ov.className = ''; d.documentElement.style.overflow = ''; if (lastFocus && lastFocus.focus) lastFocus.focus(); }

  function build() {
    var st = d.createElement('style'); st.textContent = css; d.head.appendChild(st);
    var bar = d.querySelector('.nav .wrap'); if (!bar) return;
    btn = d.createElement('button'); btn.type = 'button'; btn.className = 'sx-btn'; btn.setAttribute('aria-label', 'Search the site');
    btn.innerHTML = ICON + '<span class="sx-l">Search</span><kbd>/</kbd>';
    var pill = bar.querySelector('.pill');
    var wrap = d.createElement('div'); wrap.style.cssText = 'display:flex;align-items:center;gap:10px;order:2';
    if (pill) { pill.parentNode.insertBefore(wrap, pill); wrap.appendChild(btn); wrap.appendChild(pill); } else bar.appendChild(btn);
    ov = d.createElement('div'); ov.id = 'sx'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Search');
    ov.innerHTML = '<div class="sx-box"><div class="sx-in">' + ICON + '<input type="search" placeholder="Search the site" autocomplete="off" spellcheck="false" aria-label="Search the site"><button type="button" class="sx-x">Esc</button></div><ul role="listbox"></ul><div class="sx-f">Up and down to move, Enter to open</div></div>';
    d.body.appendChild(ov);
    input = ov.querySelector('input'); list = ov.querySelector('ul');
    btn.addEventListener('click', open);
    ov.querySelector('.sx-x').addEventListener('click', close);
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(); });
    input.addEventListener('input', function () { if (data) render(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); mv(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); mv(-1); }
      else if (e.key === 'Enter') { var a = list.querySelector('li.on a'); if (a) { e.preventDefault(); location.href = a.href; } }
    });
    d.addEventListener('keydown', function (e) {
      var t = e.target, typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
      if (e.key === 'Escape' && ov.className) { close(); }
      else if ((e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
        if (!ov.className) { e.preventDefault(); open(); } else if (e.key !== '/') e.preventDefault();
      }
    });
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', build); else build();
})();
