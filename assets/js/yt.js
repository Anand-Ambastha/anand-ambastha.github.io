/* YouTube links stay as ordinary links. Clicking one opens a pop-up player on the same page. Nothing is requested from YouTube until the click. */
(function () {
  'use strict';
  var d = document;
  var RE = /^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i;
  function idOf(a) { var m = RE.exec(a.href || ''); return m ? m[1] : null; }
  function start(href) {
    var m = /[?&](?:t|start)=(\d+)/.exec(href); return m ? m[1] : '';
  }
  function src(id, t) {
    return 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1&cc_load_policy=0&iv_load_policy=3&enablejsapi=1' + (t ? '&start=' + t : '');
  }

  var css = '' +
    '.yt{position:relative;width:100%;max-width:760px;aspect-ratio:16/9;margin:18px 0;border-radius:16px;overflow:hidden;border:1px solid var(--line,rgba(255,255,255,.12));background:#07090d}' +
    '.yt button.yt-play{all:unset;box-sizing:border-box;cursor:pointer;position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;' +
    'background:radial-gradient(60% 80% at 50% 40%,rgba(127,178,255,.14),transparent 70%),#0a0d12;color:var(--muted,#aab)}' +
    '.yt button.yt-play:focus-visible{outline:2px solid rgba(127,178,255,.7);outline-offset:-4px}' +
    '.yt-btn{width:64px;height:64px;border-radius:50%;border:1px solid rgba(255,255,255,.35);display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.06);transition:transform .2s,background .2s}' +
    '.yt-btn:after{content:"";margin-left:5px;border-style:solid;border-width:11px 0 11px 18px;border-color:transparent transparent transparent #fff}' +
    '.yt button.yt-play:hover .yt-btn{transform:scale(1.07);background:rgba(255,255,255,.12)}' +
    '.yt-cap{font:500 12.5px/1.4 var(--font-mono,ui-monospace,monospace);letter-spacing:.04em}' +
    '.yt iframe{position:absolute;inset:0;width:100%;height:100%;border:0}' +
    '#yt-modal{position:fixed;inset:0;z-index:50;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.82);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}' +
    '#yt-modal.on{display:flex}' +
    '#yt-modal .yt{margin:0;max-width:min(960px,100%)}' +
    '#yt-modal .yt-wrap{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;width:100%;max-width:min(960px,100%);max-height:100%}' +
    '#yt-modal.has-tr .yt-wrap{grid-template-columns:minmax(0,1fr) 320px;max-width:min(1240px,100%)}' +
    '#yt-modal .yt-cell{position:relative;min-width:0}' +
    '#yt-modal .yt-tr{display:none;border-radius:16px;border:1px solid var(--line,rgba(255,255,255,.12));background:rgba(12,14,18,.96);overflow:auto;color:var(--fg,#fff);-webkit-overflow-scrolling:touch}' +
    '#yt-modal.has-tr .yt-tr{display:block;position:absolute;inset:0}' +
    '.yt-tr h3{margin:0;padding:14px 16px 10px;font:500 12.5px var(--font-mono,monospace);letter-spacing:.05em;color:var(--muted,#a1a1aa);position:sticky;top:0;background:rgba(12,14,18,.98);border-bottom:1px solid var(--line,rgba(255,255,255,.12))}' +
    '.yt-tr ol{list-style:none;margin:0;padding:6px 8px 14px}' +
    '.yt-tr li{display:flex;gap:10px;padding:7px 8px;border-radius:9px;cursor:pointer;font-size:14px;line-height:1.5;color:var(--muted,#a1a1aa)}' +
    '.yt-tr li:hover{background:rgba(255,255,255,.06)}' +
    '.yt-tr li.on{background:rgba(127,178,255,.16);color:var(--fg,#fff)}' +
    '.yt-tr li time{flex:none;font:12px/1.9 var(--font-mono,monospace);color:var(--accent,#7fb2ff)}' +
    '@media(max-width:860px){#yt-modal{align-items:flex-start;overflow:auto}#yt-modal.has-tr .yt-wrap{grid-template-columns:minmax(0,1fr);margin-top:44px}#yt-modal.has-tr .yt-tr{position:static;max-height:34vh}}' +
    '#yt-close{position:absolute;top:16px;right:18px;font:500 14px var(--font-mono,monospace);color:#fff;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.3);border-radius:999px;padding:7px 14px;cursor:pointer}';

  function player(id, t, autoplay) {
    var box = d.createElement('div'); box.className = 'yt';
    function load() {
      box.innerHTML = '';
      var f = d.createElement('iframe');
      f.src = src(id, t); f.title = 'Video player';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
      f.setAttribute('allowfullscreen', ''); f.referrerPolicy = 'strict-origin-when-cross-origin';
      box.appendChild(f);
    }
    var b = d.createElement('button'); b.type = 'button'; b.className = 'yt-play'; b.setAttribute('aria-label', 'Play video');
    b.innerHTML = '<span class="yt-btn"></span><span class="yt-cap">Play video here</span>';
    b.addEventListener('click', load);
    box.appendChild(b);
    if (autoplay) load();
    return box;
  }

  var modal, cell, tr, listBox, cues = [], curIdx = -1, frame = null, base = (document.currentScript && document.currentScript.src || '').replace(/yt\.js(\?.*)?$/, '');
  function secs(t) {
    var m = /^(?:(\d+):)?(\d+):(\d+)[.,](\d+)$/.exec(t.trim()); if (!m) return null;
    return (+(m[1] || 0)) * 3600 + (+m[2]) * 60 + (+m[3]) + (+('0.' + m[4]));
  }
  function parseCaptions(txt) {
    var out = [], blocks = txt.replace(/\r/g, '').split(/\n\s*\n/);
    blocks.forEach(function (b) {
      var lines = b.split('\n'), k = -1;
      for (var i = 0; i < lines.length; i++) if (lines[i].indexOf('-->') > -1) { k = i; break; }
      if (k < 0) return;
      var ts = lines[k].split('-->'), st = secs(ts[0]); if (st === null) return;
      var text = lines.slice(k + 1).join(' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); if (!text) return;
      if (out.length && out[out.length - 1].text === text) return;
      out.push({ t: st, text: text });
    });
    return out;
  }
  function mmss(x) { var m = Math.floor(x / 60), s = Math.floor(x % 60); return m + ':' + (s < 10 ? '0' : '') + s; }
  function highlight(now) {
    if (!cues.length) return;
    var i = -1; for (var k = 0; k < cues.length; k++) { if (cues[k].t <= now + 0.15) i = k; else break; }
    if (i === curIdx) return;
    var items = listBox.children;
    if (curIdx > -1 && items[curIdx]) items[curIdx].classList.remove('on');
    curIdx = i;
    if (i > -1 && items[i]) { items[i].classList.add('on'); var r = items[i].offsetTop - tr.clientHeight / 2 + 40; tr.scrollTo ? tr.scrollTo({ top: Math.max(0, r), behavior: 'smooth' }) : (tr.scrollTop = Math.max(0, r)); }
  }
  function showCaptions(id) {
    fetch(base + '../captions/' + id + '.vtt').then(function (r) { if (!r.ok) throw 0; return r.text(); }).then(function (txt) {
      cues = parseCaptions(txt); if (!cues.length || modal.className.indexOf('on') < 0) return;
      listBox.innerHTML = '';
      cues.forEach(function (c, i) {
        var li = d.createElement('li'), tm = d.createElement('time'), sp = d.createElement('span');
        tm.textContent = mmss(c.t); sp.textContent = c.text; li.appendChild(tm); li.appendChild(sp);
        li.addEventListener('click', function () { seek(c.t); });
        listBox.appendChild(li);
      });
      modal.className = 'on has-tr';
    }).catch(function () {});
  }
  function post(o) { if (frame && frame.contentWindow) try { frame.contentWindow.postMessage(JSON.stringify(o), '*'); } catch (e) {} }
  function seek(t) { post({ event: 'command', func: 'seekTo', args: [t, true] }); post({ event: 'command', func: 'playVideo', args: [] }); }
  function onMsg(e) {
    if (!frame || e.source !== frame.contentWindow || typeof e.data !== 'string') return;
    var m; try { m = JSON.parse(e.data); } catch (x) { return; }
    if (m.event === 'onReady' || m.event === 'initialDelivery') post({ event: 'listening', id: 1, channel: 'widget' });
    if (m.event === 'infoDelivery' && m.info && typeof m.info.currentTime === 'number') highlight(m.info.currentTime);
  }
  function closeModal() {
    modal.className = ''; frame = null; cues = []; curIdx = -1; listBox.innerHTML = '';
    var p = cell.querySelector('.yt'); if (p) p.parentNode.removeChild(p);
  }
  function openModal(id, t) {
    if (!modal) {
      modal = d.createElement('div'); modal.id = 'yt-modal'; modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true');
      var x = d.createElement('button'); x.id = 'yt-close'; x.type = 'button'; x.textContent = 'Close'; modal.appendChild(x);
      var wrap = d.createElement('div'); wrap.className = 'yt-wrap';
      cell = d.createElement('div'); cell.className = 'yt-cell';
      tr = d.createElement('aside'); tr.className = 'yt-tr'; tr.setAttribute('aria-label', 'Captions');
      var h = d.createElement('h3'); h.textContent = 'CAPTIONS'; listBox = d.createElement('ol');
      tr.appendChild(h); tr.appendChild(listBox);
      var vcell = d.createElement('div'); vcell.className = 'yt-vcell'; vcell.appendChild(cell);
      wrap.appendChild(vcell); var pc = d.createElement('div'); pc.className = 'yt-cell'; pc.appendChild(tr); wrap.appendChild(pc);
      modal.appendChild(wrap);
      x.addEventListener('click', closeModal);
      modal.addEventListener('click', function (e) { if (e.target === modal || e.target === wrap) closeModal(); });
      d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.className) closeModal(); });
      window.addEventListener('message', onMsg);
      d.body.appendChild(modal);
    }
    var old = cell.querySelector('.yt'); if (old) old.parentNode.removeChild(old);
    cues = []; curIdx = -1; listBox.innerHTML = '';
    var pl = player(id, t, true); cell.appendChild(pl); frame = pl.querySelector('iframe');
    if (frame) frame.addEventListener('load', function () { post({ event: 'listening', id: 1, channel: 'widget' }); });
    modal.className = 'on';
    showCaptions(id);
    modal.querySelector('#yt-close').focus();
  }

  function process(root) {
    var links = root.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      if (a.getAttribute('data-yt')) continue;
      if (a.closest('nav, header, footer, #yt-modal')) continue;
      var id = idOf(a); if (!id) continue;
      a.setAttribute('data-yt', '1');
      var t = start(a.href);
      a.addEventListener('click', (function (id, t) {
        return function (e) {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button > 0) return;
          e.preventDefault(); openModal(id, t);
        };
      })(id, t));
    }
  }

  function init() {
    var st = d.createElement('style'); st.textContent = css; d.head.appendChild(st);
    var main = d.querySelector('main') || d.body;
    process(main);
    if (window.MutationObserver) {
      var busy = false;
      new MutationObserver(function () {
        if (busy) return; busy = true;
        setTimeout(function () { busy = false; process(main); }, 80);
      }).observe(main, { childList: true, subtree: true });
    }
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init); else init();
})();
