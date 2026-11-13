/* YouTube links play inside the site. Nothing is requested from YouTube until the visitor presses play. */
(function () {
  'use strict';
  var d = document;
  var RE = /^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i;
  function idOf(a) { var m = RE.exec(a.href || ''); return m ? m[1] : null; }
  function start(href) {
    var m = /[?&](?:t|start)=(\d+)/.exec(href); return m ? m[1] : '';
  }
  function src(id, t) {
    return 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1&playsinline=1' + (t ? '&start=' + t : '');
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

  var modal;
  function openModal(id, t) {
    if (!modal) {
      modal = d.createElement('div'); modal.id = 'yt-modal'; modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true');
      var x = d.createElement('button'); x.id = 'yt-close'; x.type = 'button'; x.textContent = 'Close'; modal.appendChild(x);
      var close = function () { modal.className = ''; var p = modal.querySelector('.yt'); if (p) p.parentNode.removeChild(p); };
      x.addEventListener('click', close);
      modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
      d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.className) close(); });
      d.body.appendChild(modal);
    }
    var old = modal.querySelector('.yt'); if (old) old.parentNode.removeChild(old);
    modal.appendChild(player(id, t, true)); modal.className = 'on';
    modal.querySelector('#yt-close').focus();
  }

  var BLOCK = /^(P|DIV|LI|BLOCKQUOTE|FIGURE|TD)$/;
  function process(root) {
    var links = root.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      if (a.getAttribute('data-yt')) continue;
      if (a.closest('nav, header, footer, #yt-modal')) continue;
      var id = idOf(a); if (!id) continue;
      a.setAttribute('data-yt', '1');
      var t = start(a.href), par = a.parentNode;
      var sole = BLOCK.test(par.nodeName) && par.textContent.trim() === a.textContent.trim() && par.querySelectorAll('a').length === 1;
      if (sole) {
        var p = player(id, t, false);
        par.parentNode.replaceChild(p, par);
      } else {
        a.addEventListener('click', (function (id, t) { return function (e) { e.preventDefault(); openModal(id, t); }; })(id, t));
        a.setAttribute('role', 'button');
      }
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
