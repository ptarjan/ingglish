# Ingglish CORS Proxy

A Cloudflare Worker that fetches web pages for the Ingglish URL translator. Browsers block the site from fetching other sites' pages directly (CORS), so requests go through this proxy.

## Security Features

- **Origin validation**: Accepts requests only from the configured allowed
  origins. Only browsers enforce the `Origin` header; any other client can
  fake it. So this stops casual misuse, not determined abuse. Real abuse
  control needs a Cloudflare rate-limiting rule or a signed token from the
  site.
- **SSRF prevention**: Refuses to fetch private or reserved IP addresses given
  literally in the URL (loopback, RFC 1918, link-local, CGNAT 100.64/10,
  192.0.0.0/24, 198.18/15, multicast/reserved, IPv6 loopback/ULA/link-local and
  IPv4-mapped forms). The check runs again on every redirect hop. Known gap: a
  hostname whose DNS record points at a private IP (DNS rebinding) passes,
  because Workers can't resolve DNS before fetching.
- **Protocol restriction**: Accepts only HTTP and HTTPS URLs.
- **Content-Type validation**: Proxies only HTML responses.
- **Cache control**: Sets a cache lifetime of at least 5 minutes on responses.

## Deployment

1. Install dependencies:
   ```bash
   npm install
   ```

2. Log in to Cloudflare:
   ```bash
   npx wrangler login
   ```

3. Deploy:
   ```bash
   npm run deploy
   ```

4. Point the website at the new proxy URL, replacing `<your-subdomain>` with
   your Cloudflare account's workers.dev subdomain:
   ```bash
   # In packages/website/.env.production
   VITE_CORS_PROXY_URL=https://ingglish-cors-proxy.<your-subdomain>.workers.dev/?url=
   ```

## Local Development

```bash
npm run dev
```

This starts a local server at http://localhost:8787.

## Allowed Origins

To accept requests from another origin, add it to `ALLOWED_ORIGINS` in `wrangler.toml`.
