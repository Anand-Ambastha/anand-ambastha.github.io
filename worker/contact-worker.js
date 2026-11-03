// Cloudflare Worker: relays the portfolio contact form to Web3Forms.
// The Web3Forms access key lives only in the Worker secret WEB3FORMS_KEY.
const ALLOWED_ORIGIN = 'https://anand-ambastha.github.io';

const cors = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Vary': 'Origin'
};
const reply = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return reply({ success: false }, 405);
    if (request.headers.get('Origin') !== ALLOWED_ORIGIN) return reply({ success: false }, 403);

    let d;
    try { d = await request.json(); } catch (e) { return reply({ success: false }, 400); }
    const name = String(d.name || '').trim().slice(0, 100);
    const email = String(d.email || '').trim().slice(0, 150);
    const message = String(d.message || '').trim().slice(0, 4000);
    if (d.botcheck) return reply({ success: true }); // bots get a fake success
    if (!name || !message || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return reply({ success: false }, 400);

    const r = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        access_key: env.WEB3FORMS_KEY,
        name, email, message,
        subject: 'Website message from ' + name,
        from_name: 'Portfolio contact form'
      })
    });
    const j = await r.json().catch(() => ({}));
    return reply({ success: !!j.success }, j.success ? 200 : 502);
  }
};
