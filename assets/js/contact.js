(function () {
  var f = document.getElementById('cform');
  if (!f) return;
  var st = document.getElementById('cstatus');
  var btn = f.querySelector('button[type=submit]');
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (f.elements.botcheck && f.elements.botcheck.value) return;
    st.className = 'cstatus'; st.textContent = 'Sending...'; btn.disabled = true;
    var body = {
      access_key: '',
      name: f.elements.name.value,
      email: f.elements.email.value,
      message: f.elements.message.value,
      subject: 'Website message from ' + f.elements.name.value,
      from_name: 'Portfolio contact form'
    };
    var go = body.access_key ? fetch(f.getAttribute('data-endpoint'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
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
      st.innerHTML = (err && err.message === 'no key' ? 'One more step: ' : 'That did not go through. ') + '<a href="' + m + '">Open it in your mail app</a> with your message filled in, or write to anandambastha72@gmail.com.';
    }).then(function () { btn.disabled = false; });
  });
})();
