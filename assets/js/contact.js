(function () {
  var f = document.getElementById('cform');
  if (!f) return;
  var st = document.getElementById('cstatus');
  var btn = f.querySelector('button[type=submit]');
  f.addEventListener('submit', function (e) {
    e.preventDefault();
        st.className = 'cstatus'; st.textContent = 'Sending...'; btn.disabled = true;
    var body = {
      name: f.elements.name.value,
      email: f.elements.email.value,
      message: f.elements.message.value,
      botcheck: f.elements.botcheck ? f.elements.botcheck.value : ''
    };
    var endpoint = f.getAttribute('data-endpoint');
    var go = endpoint ? fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }) : Promise.reject(new Error('no key'));
    go.then(function (r) { return r.json(); }).then(function (j) {
      if (window.console) console.log('contact form response', j);
      if (j && (j.success === 'true' || j.success === true)) {
        f.reset(); st.className = 'cstatus ok';
        st.textContent = 'Sent. Thank you, I will reply by email.';
      } else { throw new Error('fail'); }
    }).catch(function (err) {
      st.className = 'cstatus err';
      var m = 'mailto:anandambastha72@gmail.com?subject=' + encodeURIComponent('Website message from ' + body.name) +
        '&body=' + encodeURIComponent(body.message + '\n\n' + body.name + '\n' + body.email);
      st.innerHTML = (err && err.message === 'no key' ? 'Sending from the page is not switched on yet. ' : 'That did not go through. ') + '<a href="' + m + '">Open it in your mail app</a> with your message filled in, or write to anandambastha72@gmail.com.';
    }).then(function () { btn.disabled = false; });
  });
})();
