/* Owner-only post editor. Talks straight to the GitHub API from the browser:
   list, read, create, edit and delete posts in posts/, upload images to posts/img/.
   Every save is one atomic commit on the main branch. The token lives only in this
   browser (session storage, or local storage if "Remember me" is ticked). */
(function () {
  'use strict';

  var root = document.getElementById('admin');
  var OWNER = root.dataset.owner, REPO = root.dataset.repo, BRANCH = root.dataset.branch;
  var API = 'https://api.github.com/repos/' + OWNER + '/' + REPO;
  var TOKEN_KEY = 'ak-admin-token';
  var SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

  var $ = function (s) { return document.querySelector(s); };
  var token = null;
  var posts = [];            // [{file, slug, meta, body}]
  var indexNames = [];       // posts/index.json as loaded, in its own order
  var current = null;        // {file, slug, isNew, extra}
  var dirty = false;
  var pending = {};          // repo path -> {base64, url} for images added in this edit
  var slugTouched = false;

  /* ---------- storage ---------- */
  function readToken() {
    try { return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY); } catch (e) { return null; }
  }
  function saveToken(t, remember) {
    try {
      sessionStorage.setItem(TOKEN_KEY, t);
      if (remember) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY);
    } catch (e) { /* storage blocked: stay signed in for this page only */ }
  }
  function clearToken() {
    try { sessionStorage.removeItem(TOKEN_KEY); localStorage.removeItem(TOKEN_KEY); } catch (e) { /* ignore */ }
  }

  /* ---------- small helpers ---------- */
  function show(id) {
    ['view-login', 'view-list', 'view-edit'].forEach(function (v) { $('#' + v).hidden = v !== id; });
  }
  var toastTimer;
  function toast(msg, kind, keep) {
    var t = $('#toast');
    t.textContent = msg; t.className = 'ad-toast ' + (kind || ''); t.hidden = false;
    clearTimeout(toastTimer);
    if (!keep) toastTimer = setTimeout(function () { t.hidden = true; }, 7000);
  }
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function slugify(s) {
    return s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80).replace(/-+$/g, '');
  }
  function fmtDate(d) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || '');
    if (!m) return d || '';
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return parseInt(m[3], 10) + ' ' + months[parseInt(m[2], 10) - 1] + ' ' + m[1];
  }
  function toBase64(buf) {
    var bytes = new Uint8Array(buf), s = '', i, chunk = 0x8000;
    for (i = 0; i < bytes.length; i += chunk) s += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    return btoa(s);
  }

  /* ---------- GitHub API ---------- */
  function gh(path, opts) {
    opts = opts || {};
    var headers = {
      'Authorization': 'Bearer ' + token,
      'Accept': opts.accept || 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
    var init = { method: opts.method || 'GET', headers: headers, cache: 'no-store' };
    if (opts.body) { init.body = JSON.stringify(opts.body); headers['Content-Type'] = 'application/json'; }
    return fetch(path.indexOf('http') === 0 ? path : API + path, init).then(function (r) {
      if (r.ok) return r;
      return r.json().catch(function () { return {}; }).then(function (j) {
        var err = new Error(j.message || ('GitHub returned ' + r.status));
        err.status = r.status;
        throw err;
      });
    });
  }
  function friendly(e) {
    if (e.status === 401) return 'GitHub did not accept the token. It may be wrong or expired.';
    if (e.status === 403) return 'The token is not allowed to do this. Check that Contents is set to Read and write.';
    if (e.status === 404) return 'Not found. Check that the token covers the anand-ambastha.github.io repository.';
    if (e.status === 422) return 'GitHub rejected the change (the site was probably updated at the same moment). Reload and try again.';
    if (e instanceof TypeError) return 'Could not reach GitHub. Check your connection.';
    return e.message || 'Something went wrong.';
  }
  function readText(path) {
    return gh('/contents/' + path.split('/').map(encodeURIComponent).join('/') + '?ref=' + BRANCH,
      { accept: 'application/vnd.github.raw+json' }).then(function (r) { return r.text(); });
  }

  /* One atomic commit. changes: [{path, content?, base64?, remove?}] */
  function commit(changes, message) {
    var parent, baseTree;
    return gh('/git/ref/heads/' + BRANCH).then(function (r) { return r.json(); }).then(function (ref) {
      parent = ref.object.sha;
      return gh('/git/commits/' + parent).then(function (r) { return r.json(); });
    }).then(function (c) {
      baseTree = c.tree.sha;
      return Promise.all(changes.map(function (ch) {
        if (ch.remove) return { path: ch.path, mode: '100644', type: 'blob', sha: null };
        var body = ch.base64 != null ? { content: ch.base64, encoding: 'base64' } : { content: ch.content, encoding: 'utf-8' };
        return gh('/git/blobs', { method: 'POST', body: body }).then(function (r) { return r.json(); }).then(function (b) {
          return { path: ch.path, mode: '100644', type: 'blob', sha: b.sha };
        });
      }));
    }).then(function (entries) {
      return gh('/git/trees', { method: 'POST', body: { base_tree: baseTree, tree: entries } }).then(function (r) { return r.json(); });
    }).then(function (t) {
      return gh('/git/commits', { method: 'POST', body: { message: message, tree: t.sha, parents: [parent] } }).then(function (r) { return r.json(); });
    }).then(function (c) {
      return gh('/git/refs/heads/' + BRANCH, { method: 'PATCH', body: { sha: c.sha } }).then(function () { return c; });
    });
  }

  /* ---------- front matter ---------- */
  function parse(raw) {
    var meta = {}, body = raw, extra = {}, order = [];
    var m = /^---\s*\n([\s\S]*?)\n---\s*\n?/.exec(raw);
    if (m) {
      body = raw.slice(m[0].length);
      m[1].split('\n').forEach(function (line) {
        var i = line.indexOf(':');
        if (i < 1) return;
        var k = line.slice(0, i).trim(), v = line.slice(i + 1).trim();
        meta[k] = v; order.push(k);
      });
    }
    var known = { title: 1, date: 1, tags: 1, summary: 1, category: 1, draft: 1 };
    Object.keys(meta).forEach(function (k) { if (!known[k]) extra[k] = meta[k]; });
    var tags = [];
    if (meta.tags) {
      var t = meta.tags.replace(/^\[/, '').replace(/\]$/, '');
      tags = t.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
    }
    return {
      meta: { title: meta.title || '', date: meta.date || '', tags: tags, summary: meta.summary || '',
        category: meta.category || '', draft: String(meta.draft || '').toLowerCase() === 'true' },
      extra: extra, order: order, body: body.replace(/^\n+/, '')
    };
  }
  function oneLine(s) { return String(s).replace(/\s*\n\s*/g, ' ').trim(); }
  function serialize(f, extra, order, body) {
    var lines = {
      title: 'title: ' + oneLine(f.title),
      date: 'date: ' + f.date,
      tags: f.tags.length ? 'tags: [' + f.tags.join(', ') + ']' : '',
      summary: f.summary ? 'summary: ' + oneLine(f.summary) : '',
      category: f.category ? 'category: ' + f.category : '',
      draft: f.draft ? 'draft: true' : ''
    };
    var out = ['---'], done = {};
    (order || []).concat(['title', 'date', 'tags', 'summary', 'category', 'draft']).forEach(function (k) {
      if (done[k]) return; done[k] = 1;
      if (lines[k] !== undefined) { if (lines[k]) out.push(lines[k]); }
      else if (extra && extra[k] !== undefined) out.push(k + ': ' + extra[k]);
    });
    out.push('---', '');
    return out.join('\n') + '\n' + body.replace(/\s+$/, '') + '\n';
  }

  /* ---------- sign in ---------- */
  function signIn(t, remember) {
    token = t.trim();
    $('#login-error').hidden = true;
    return gh('').then(function (r) { return r.json(); }).then(function (repo) {
      if (!repo.permissions || !repo.permissions.push) {
        throw Object.assign(new Error('This token can read the repository but not change it. Set Contents to Read and write.'), { status: 0 });
      }
      saveToken(token, remember);
      var who = $('#who'); who.textContent = 'Signed in · editing ' + OWNER + '/' + REPO + ' (' + BRANCH + ')'; who.hidden = false;
      return loadPosts();
    });
  }
  function signOut() {
    if (dirty && !confirm('You have unsaved changes. Sign out anyway?')) return;
    dirty = false; token = null; clearToken(); posts = [];
    $('#who').hidden = true; $('#token').value = '';
    show('view-login');
  }

  /* ---------- list ---------- */
  function loadPosts() {
    show('view-list');
    var list = $('#post-list'); list.textContent = 'Loading posts…';
    return readText('posts/index.json').then(function (txt) {
      var names = JSON.parse(txt);
      indexNames = names.slice();
      return Promise.all(names.map(function (n) {
        return readText('posts/' + n).then(function (raw) {
          var p = parse(raw);
          return { file: n, slug: n.replace(/\.md$/, ''), meta: p.meta, body: p.body, extra: p.extra, order: p.order };
        }).catch(function () {
          return { file: n, slug: n.replace(/\.md$/, ''), meta: { title: n, date: '', tags: [], summary: '', category: '', draft: false }, body: '', extra: {}, broken: true };
        });
      }));
    }).then(function (arr) {
      posts = arr.sort(function (a, b) { return (b.meta.date || '').localeCompare(a.meta.date || ''); });
      renderList();
    }).catch(function (e) {
      list.textContent = '';
      toast(friendly(e), 'bad', true);
    });
  }
  function renderList() {
    var q = $('#filter').value.trim().toLowerCase();
    var list = $('#post-list'); list.textContent = '';
    var shown = posts.filter(function (p) {
      return !q || (p.meta.title + ' ' + p.slug + ' ' + p.meta.tags.join(' ')).toLowerCase().indexOf(q) !== -1;
    });
    if (!shown.length) { list.textContent = posts.length ? 'No posts match.' : 'No posts yet. Click New post.'; return; }
    shown.forEach(function (p) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'ad-row';
      var t = document.createElement('span'); t.className = 'ad-row-title'; t.textContent = p.meta.title || p.slug;
      var m = document.createElement('span'); m.className = 'ad-row-meta';
      m.textContent = [fmtDate(p.meta.date), p.meta.category === 'project' ? 'Project blog' : 'My thoughts', p.slug + '.md'].filter(Boolean).join(' · ');
      b.appendChild(t); b.appendChild(m);
      if (p.meta.draft) { var d = document.createElement('span'); d.className = 'ad-badge'; d.textContent = 'Draft'; b.appendChild(d); }
      b.addEventListener('click', function () { openPost(p); });
      list.appendChild(b);
    });
  }

  /* ---------- editor ---------- */
  function setDirty(v) { dirty = v; $('#state').textContent = v ? 'Unsaved changes' : (current && !current.isNew ? 'Saved' : ''); }
  function fill(f, body) {
    $('#f-title').value = f.title; $('#f-date').value = f.date; $('#f-category').value = f.category;
    $('#f-tags').value = f.tags.join(', '); $('#f-summary').value = f.summary; $('#f-draft').checked = f.draft;
    $('#f-body').value = body;
  }
  function openPost(p) {
    current = { file: p.file, slug: p.slug, isNew: false, extra: p.extra || {}, order: p.order || [] };
    pending = {}; slugTouched = true;
    fill(p.meta, p.body);
    var s = $('#f-slug'); s.value = p.slug; s.disabled = true; $('#slug-hint').hidden = true;
    $('#delete').hidden = false;
    setDirty(false); show('view-edit'); setTab('write'); renderPreview();
    window.scrollTo(0, 0);
  }
  function newPost() {
    current = { file: '', slug: '', isNew: true, extra: {}, order: [] };
    pending = {}; slugTouched = false;
    fill({ title: '', date: todayISO(), tags: [], summary: '', category: '', draft: true }, '');
    var s = $('#f-slug'); s.value = ''; s.disabled = false; $('#slug-hint').hidden = false;
    $('#delete').hidden = true;
    setDirty(false); show('view-edit'); setTab('write'); renderPreview();
    $('#f-title').focus();
  }
  function collect() {
    return {
      title: $('#f-title').value.trim(), date: $('#f-date').value, category: $('#f-category').value,
      tags: $('#f-tags').value.split(',').map(function (t) { return t.trim(); }).filter(Boolean),
      summary: $('#f-summary').value.trim(), draft: $('#f-draft').checked
    };
  }
  function validate(f, slug) {
    if (!f.title) return 'Add a title.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date)) return 'Choose a date.';
    if (current.isNew) {
      if (!SLUG_RE.test(slug)) return 'The file name can use lowercase letters, numbers and hyphens only.';
      if (posts.some(function (p) { return p.slug === slug; })) return 'A post with this file name already exists.';
    }
    return '';
  }
  function save() {
    if (!current) return;
    var f = collect(), slug = current.isNew ? $('#f-slug').value.trim() : current.slug;
    var bad = validate(f, slug);
    if (bad) { toast(bad, 'bad'); return; }
    var body = $('#f-body').value;
    var file = slug + '.md';
    var changes = [{ path: 'posts/' + file, content: serialize(f, current.extra, current.order, body) }];
    var names = indexNames.slice();
    if (current.isNew) {
      names.push(file);
      changes.push({ path: 'posts/index.json', content: JSON.stringify(names, null, 2) + '\n' });
    }
    Object.keys(pending).forEach(function (path) { changes.push({ path: path, base64: pending[path].base64 }); });
    var btn = $('#save'); btn.disabled = true; btn.textContent = 'Saving…';
    commit(changes, (current.isNew ? 'Add post: ' : 'Edit post: ') + f.title + ' (via editor)').then(function (c) {
      var entry = { file: file, slug: slug, meta: f, body: body, extra: current.extra, order: current.order };
      var i = posts.findIndex(function (p) { return p.file === file; });
      if (i === -1) posts.push(entry); else posts[i] = entry;
      if (indexNames.indexOf(file) === -1) indexNames.push(file);
      current.isNew = false; current.file = file; current.slug = slug; pending = {};
      $('#f-slug').disabled = true; $('#slug-hint').hidden = true; $('#delete').hidden = false;
      setDirty(false);
      toast(f.draft
        ? 'Saved as a draft. It stays hidden until you untick Draft.'
        : 'Saved. The live page, feed and sitemap update in about a minute or two.', 'good');
      return c;
    }).catch(function (e) { toast(friendly(e), 'bad', true); })
      .then(function () { btn.disabled = false; btn.textContent = 'Save to GitHub'; });
  }
  function remove() {
    if (!current || current.isNew) return;
    var title = $('#f-title').value || current.slug;
    if (!confirm('Delete "' + title + '"? This removes the post from the site. It stays in GitHub history.')) return;
    var names = indexNames.filter(function (n) { return n !== current.file; });
    commit([
      { path: 'posts/' + current.file, remove: true },
      { path: 'posts/index.json', content: JSON.stringify(names, null, 2) + '\n' }
    ], 'Delete post: ' + title + ' (via editor)').then(function () {
      posts = posts.filter(function (p) { return p.file !== current.file; });
      indexNames = names;
      dirty = false; current = null; show('view-list'); renderList();
      toast('Deleted. The site updates in about a minute or two.', 'good');
    }).catch(function (e) { toast(friendly(e), 'bad', true); });
  }

  /* ---------- preview ---------- */
  var previewTimer;
  function renderPreview() {
    var md = $('#f-body').value;
    var html = DOMPurify.sanitize(marked.parse(md, { mangle: false, headerIds: false }));
    var box = $('#preview'); box.innerHTML = html;
    box.querySelectorAll('a').forEach(function (a) { a.target = '_blank'; a.rel = 'noopener noreferrer'; });
    box.querySelectorAll('img').forEach(function (img) {
      var src = img.getAttribute('src') || '';
      if (/^(https?:|data:|blob:)/i.test(src)) return;
      var repoPath = 'posts/' + src.replace(/^\.?\//, '');
      if (pending[repoPath]) img.src = pending[repoPath].url;
      else img.src = '../' + repoPath;
    });
    if (!md.trim()) box.innerHTML = '<p class="ad-empty">Nothing to preview yet.</p>';
  }
  function schedulePreview() { clearTimeout(previewTimer); previewTimer = setTimeout(renderPreview, 180); }
  function setTab(which) {
    var write = which === 'write';
    $('#tab-write').setAttribute('aria-selected', write);
    $('#tab-preview').setAttribute('aria-selected', !write);
    document.querySelector('.ad-split').dataset.show = which;
    if (!write) renderPreview();
  }

  /* ---------- toolbar ---------- */
  function wrap(before, after, placeholder) {
    var ta = $('#f-body'), s = ta.selectionStart, e = ta.selectionEnd;
    var sel = ta.value.slice(s, e) || placeholder;
    ta.setRangeText(before + sel + after, s, e, 'end');
    ta.setSelectionRange(s + before.length, s + before.length + sel.length);
    ta.focus(); setDirty(true); schedulePreview();
  }
  function linePrefix(prefix) {
    var ta = $('#f-body'), s = ta.selectionStart, e = ta.selectionEnd, v = ta.value;
    var a = v.lastIndexOf('\n', s - 1) + 1, b = v.indexOf('\n', e); if (b === -1) b = v.length;
    var block = v.slice(a, b).split('\n').map(function (l) { return prefix + l; }).join('\n');
    ta.setRangeText(block, a, b, 'end'); ta.focus(); setDirty(true); schedulePreview();
  }
  function tool(name) {
    if (name === 'bold') wrap('**', '**', 'bold text');
    else if (name === 'italic') wrap('*', '*', 'italic text');
    else if (name === 'code') wrap('`', '`', 'code');
    else if (name === 'link') {
      var u = prompt('Link address (https://…)');
      if (u) wrap('[', '](' + u + ')', 'link text');
    }
    else if (name === 'h2') linePrefix('## ');
    else if (name === 'quote') linePrefix('> ');
    else if (name === 'list') linePrefix('- ');
  }
  function addImage(file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast('That image is over 5 MB. Please shrink it first.', 'bad'); return; }
    var base = file.name.replace(/\.[^.]+$/, ''), ext = (file.name.match(/\.([a-z0-9]+)$/i) || [, 'png'])[1].toLowerCase();
    var suffix = Math.random().toString(36).slice(2, 6);
    var path = 'posts/img/' + (slugify(base) || 'image') + '-' + suffix + '.' + ext;
    var reader = new FileReader();
    reader.onload = function () {
      pending[path] = { base64: toBase64(reader.result), url: URL.createObjectURL(file) };
      var alt = (prompt('Describe the image for people who cannot see it', '') || '').replace(/[\[\]]/g, '');
      var ta = $('#f-body'); ta.setSelectionRange(ta.selectionStart, ta.selectionStart);
      var v = ta.value, at = ta.selectionStart;
      var lead = at === 0 || v.slice(Math.max(0, at - 2), at) === '\n\n' ? '' : (v.slice(at - 1, at) === '\n' ? '\n' : '\n\n');
      var trail = v.slice(at, at + 2) === '\n\n' || at >= v.length ? '\n\n' : (v.slice(at, at + 1) === '\n' ? '\n' : '\n\n');
      wrap(lead + '![' + alt + '](' + path.replace(/^posts\//, ''), ')' + trail, '');
      toast('Image added. It is uploaded when you save.', 'good');
    };
    reader.readAsArrayBuffer(file);
  }

  /* ---------- wire up ---------- */
  $('#login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = e.target.querySelector('button'); btn.disabled = true;
    signIn($('#token').value, $('#remember').checked).catch(function (err) {
      token = null;
      var box = $('#login-error'); box.textContent = friendly(err); box.hidden = false;
    }).then(function () { btn.disabled = false; });
  });
  $('#sign-out').addEventListener('click', signOut);
  $('#new-post').addEventListener('click', newPost);
  $('#filter').addEventListener('input', renderList);
  $('#back').addEventListener('click', function () {
    if (dirty && !confirm('You have unsaved changes. Leave without saving?')) return;
    dirty = false; current = null; show('view-list'); renderList();
  });
  $('#save').addEventListener('click', save);
  $('#delete').addEventListener('click', remove);
  $('#tab-write').addEventListener('click', function () { setTab('write'); });
  $('#tab-preview').addEventListener('click', function () { setTab('preview'); });
  $('#tools').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.id === 'add-image') { $('#image-input').click(); return; }
    if (b.dataset.md) tool(b.dataset.md);
  });
  $('#image-input').addEventListener('change', function (e) { addImage(e.target.files[0]); e.target.value = ''; });
  ['#f-title', '#f-date', '#f-category', '#f-tags', '#f-summary', '#f-draft', '#f-body'].forEach(function (id) {
    $(id).addEventListener('input', function () { setDirty(true); if (id === '#f-body') schedulePreview(); });
    $(id).addEventListener('change', function () { setDirty(true); });
  });
  $('#f-title').addEventListener('input', function () {
    if (current && current.isNew && !slugTouched) $('#f-slug').value = slugify($('#f-title').value);
  });
  $('#f-slug').addEventListener('input', function () { slugTouched = true; });
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && !$('#view-edit').hidden) { e.preventDefault(); save(); }
  });
  window.addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------- start ---------- */
  var saved = readToken();
  if (saved) {
    signIn(saved, !!(function () { try { return localStorage.getItem(TOKEN_KEY); } catch (e) { return null; } })()).catch(function (err) {
      token = null; clearToken(); show('view-login');
      var box = $('#login-error'); box.textContent = friendly(err); box.hidden = false;
    });
  } else {
    show('view-login');
  }
})();
