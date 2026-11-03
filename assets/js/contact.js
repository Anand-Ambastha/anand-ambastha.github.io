(function () {
  var f = document.getElementById('cform');
  if (!f) return;
  var st = document.getElementById('cstatus');
  var btn = f.querySelector('button[type=submit]');
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (f.elements._honey && f.elements._honey.value) return;
    st.className = 'cstatus'; st.textContent = 'Sending...'; btn.disabled = true;
    var body = {
      name: f.elements.name.value,
      email: f.elements.email.value,
      message: f.elements.message.value,
      _subject: 'Website message from ' + f.elements.name.value,
      _replyto: f.elements.email.value,
      _captcha: 'false',
      _template: 'table'
    };
    fetch(f.getAttribute('data-endpoint'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (j && (j.success === 'true' || j.success === true)) {
        f.reset(); st.className = 'cstatus ok';
        st.textContent = 'Sent. Thank you, I will reply by email.';
      } else { throw new Error('fail'); }
    }).catch(function () {
      st.className = 'cstatus err';
      st.innerHTML = 'That did not go through. Please email <a href="mailto:anandambastha72@gmail.com">anandambastha72@gmail.com</a> instead.';
    }).then(function () { btn.disabled = false; });
  });
})();
