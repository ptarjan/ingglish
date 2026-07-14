# Ingglish CORS Proxy

A Cloudflare Worker that proxies requests for the Ingglish URL translator.

## Security Features

- **Origin validation**: Only allows requests from configured allowed origins.
  Note: the `Origin` header is only enforced by browsers — a non-browser
  client can spoof it, so this deters casual misuse rather than determined
  abuse. Real abuse control needs a Cloudflare rate-limiting rule or a signed
  token from the site.
- **SSRF prevention**: Blocks literal private/reserved IPs (loopback, RFC 1918,
  link-local, CGNAT 100.64/10, 192.0.0.0/24, 198.18/15, multicast/reserved,
  IPv6 loopback/ULA/link-local and IPv4-mapped forms), re-validated on every
  redirect hop. Known limitation: a hostname whose DNS record points at a
  private IP (DNS rebinding) passes the check — Workers can't resolve DNS
  before fetching.
- **Protocol restriction**: Only allows HTTP/HTTPS URLs
- **Content-Type validation**: Only proxies HTML responses
- **Cache control**: Enforces minimum 5-minute cache headers

## Deployment

1. Install dependencies:
   ```bash
   npm install
   ```

2. Login to Cloudflare:
   ```bash
   npx wrangler login
   ```

3. Deploy:
   ```bash
   npm run deploy
   ```

4. Update the website to use the new proxy URL:
   ```bash
   # In packages/website/.env.production
   VITE_CORS_PROXY_URL=https://ingglish-cors-proxy.<your-subdomain>.workers.dev/?url=
   ```

## Local Development

```bash
npm run dev
```

This starts a local server at http://localhost:8787

## Allowed Origins

Edit `ALLOWED_ORIGINS` in `wrangler.toml` to add more allowed request origins.
