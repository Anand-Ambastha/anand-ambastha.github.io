# Contact form relay (Cloudflare Worker)

The site is static, so a key placed in the page would be public. This Worker holds the Web3Forms key as a secret and forwards messages.

1. Regenerate the Web3Forms key at web3forms.com (the old one was in git history).
2. Cloudflare dashboard > Workers & Pages > Create > Worker. Name it `contact-relay`, deploy, then Edit code and paste `contact-worker.js`.
3. Worker > Settings > Variables and Secrets > Add secret `WEB3FORMS_KEY` = the new key (type: Secret).
4. Copy the Worker URL (`https://contact-relay.<you>.workers.dev`) and put it in `data-endpoint` on `contact/index.html`.
