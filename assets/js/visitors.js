/* Visitor counter shown in the footer. Counts each browser once (a flag in localStorage); other visits only read the number.
   Uses the free abacus counter service. If it cannot be reached, nothing is shown. */
(function () {
  'use strict';
  var API = 'https://abacus.jasoncameron.dev/', KEY = 'anand-ambastha-github-io/visitors';
  var base = document.querySelector('footer.site .foot-base');
  if (!base || !window.fetch) return;
  var counted = false;
  try { counted = localStorage.getItem('vc-counted') === '1'; } catch (e) {}
  var ctl = window.AbortController ? new AbortController() : null;
  var t = setTimeout(function () { if (ctl) ctl.abort(); }, 5000);
  fetch(API + (counted ? 'get/' : 'hit/') + KEY, ctl ? { signal: ctl.signal } : {})
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (j) {
      clearTimeout(t);
      var n = Number(j && j.value); if (!isFinite(n) || n < 1) return;
      if (!counted) { try { localStorage.setItem('vc-counted', '1'); } catch (e) {} }
      var s = document.createElement('span'); s.className = 'visitors';
      s.textContent = 'Visitors: ' + n.toLocaleString('en-IN'); s.title = 'Each browser is counted once';
      base.appendChild(s);
    })
    .catch(function () {});
})();
