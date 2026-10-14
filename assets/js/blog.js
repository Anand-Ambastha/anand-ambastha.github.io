/* Blog engine: loads posts/index.json (a list of .md file names), reads each post's front matter, renders Markdown. */
(function () {
  var SCRIPT = document.currentScript && document.currentScript.src;
  var ROOT = new URL('../../', SCRIPT || location.href).href;
  var BASE = ROOT + 'posts/';

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function parseFront(raw) {
    raw = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
    var meta = {}, body = raw;
    var m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
    if (m) {
      body = raw.slice(m[0].length);
      m[1].split('\n').forEach(function (line) {
        var i = line.indexOf(':');
        if (i < 1) return;
        var k = line.slice(0, i).trim().toLowerCase();
        var v = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
        meta[k] = v;
      });
    }
    var tags = [];
    if (meta.tags) {
      tags = meta.tags.replace(/^\[|\]$/g, '').split(',').map(function (t) {
        return t.trim().replace(/^["']|["']$/g, '');
      }).filter(Boolean);
    }
    meta.tagList = tags;
    return { meta: meta, body: body };
  }

  function excerpt(body) {
    var t = body.replace(/```[\s\S]*?```/g, ' ').replace(/^#+\s.*$/gm, ' ').replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`>#$]/g, '').replace(/\s+/g, ' ').trim();
    return t.length > 190 ? t.slice(0, 187).replace(/\s+\S*$/, '') + '…' : t;
  }

  function fmt(d) {
    if (!d) return '';
    try {
      var p = d.split('-');
      return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    } catch (e) { return d; }
  }

  function load() {
    return fetch(BASE + 'index.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('index'); return r.json(); })
      .then(function (files) {
        return Promise.all(files.map(function (f) {
          return fetch(BASE + f, { cache: 'no-cache' })
            .then(function (r) { if (!r.ok) throw new Error(f); return r.text(); })
            .then(function (text) {
              var p = parseFront(text);
              var slug = f.replace(/\.md$/i, '').toLowerCase().replace(/[^a-z0-9._~-]+/g, '-');
              var words = (p.body.match(/\S+/g) || []).length;
              return {
                slug: slug,
                title: p.meta.title || slug,
                date: p.meta.date || '',
                tags: p.meta.tagList,
                summary: p.meta.summary || excerpt(p.body),
                body: p.body,
                draft: p.meta.draft === 'true',
                minutes: Math.max(1, Math.round(words / 200))
              };
            })
            .catch(function () { return null; });
        }));
      })
      .then(function (all) {
        return all.filter(function (p) { return p && !p.draft; })
          .sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
      });
  }

  function render(md) {
    var codes = [], maths = [];
    md = md.replace(/```[\s\S]*?```|`[^`\n]+`/g, function (m) { codes.push(m); return '@@C' + (codes.length - 1) + '@@'; });
    md = md.replace(/\$\$([\s\S]+?)\$\$/g, function (_, t) { maths.push({ t: t, d: true }); return '@@M' + (maths.length - 1) + '@@'; });
    md = md.replace(/\$([^\s$](?:[^$\n]*?[^\s$])?)\$(?!\d)/g, function (_, t) { maths.push({ t: t, d: false }); return '@@M' + (maths.length - 1) + '@@'; });
    md = md.replace(/@@C(\d+)@@/g, function (_, i) { return codes[+i]; });
    var html = marked.parse(md, { mangle: false });
    html = DOMPurify.sanitize(html);
    html = html.replace(/@@M(\d+)@@/g, function (_, i) {
      var m = maths[+i];
      return m.d ? '<span class="math-display">\\[' + esc(m.t) + '\\]</span>' : '<span class="math-inline">\\(' + esc(m.t) + '\\)</span>';
    });
    return html;
  }

  function decorate(el) {
    el.querySelectorAll('a[href^="http"]').forEach(function (a) { a.target = '_blank'; a.rel = 'noopener'; });
    el.querySelectorAll('img').forEach(function (img) {
      var s = img.getAttribute('src') || '';
      if (s && !/^(https?:|data:|blob:|\/)/.test(s)) img.setAttribute('src', BASE + s.replace(/^\.\//, ''));
      img.loading = 'lazy';
    });
    el.querySelectorAll('table').forEach(function (t) {
      var w = document.createElement('div'); w.className = 'table-wrap';
      t.parentNode.insertBefore(w, t); w.appendChild(t);
    });
    el.querySelectorAll('pre').forEach(function (pre) {
      var code = pre.querySelector('code'), lang = '';
      if (code) { var m = (code.className || '').match(/language-([\w+-]+)/); if (m) lang = m[1]; }
      var wrap = document.createElement('div'); wrap.className = 'codeblock';
      var bar = document.createElement('div'); bar.className = 'codebar';
      var l = document.createElement('span'); l.textContent = lang || 'text';
      var b = document.createElement('button'); b.type = 'button'; b.textContent = 'Copy';
      b.addEventListener('click', function () {
        function sel() {
          try { var r = document.createRange(); r.selectNodeContents(pre); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) {}
        }
        try {
          navigator.clipboard.writeText(pre.innerText).then(function () {
            b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1600);
          }, sel);
        } catch (e) { sel(); }
      });
      bar.appendChild(l); bar.appendChild(b);
      pre.parentNode.insertBefore(wrap, pre); wrap.appendChild(bar); wrap.appendChild(pre);
    });
  }

  function typeset(el) {
    var tries = 0;
    (function go() {
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([el]).catch(function () {});
      } else if (tries++ < 50) {
        setTimeout(go, 200);
      }
    })();
  }

  function card(p) {
    var tags = p.tags.map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('');
    return '<a class="post-card" href="' + ROOT + 'post/#' + encodeURIComponent(p.slug) + '">' +
      '<span class="when">' + esc(fmt(p.date)) + ' · ' + p.minutes + ' min read</span>' +
      '<h2>' + esc(p.title) + '</h2><p>' + esc(p.summary) + '</p>' +
      (tags ? '<span class="tags">' + tags + '</span>' : '') + '</a>';
  }

  window.Blog = { ROOT: ROOT, load: load, render: render, decorate: decorate, typeset: typeset, card: card, fmt: fmt, esc: esc };
})();
