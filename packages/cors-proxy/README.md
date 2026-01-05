# Ingglish CORS Proxy

A Cloudflare Worker that proxies requests for the Ingglish URL translator.

## Security Features

- **Origin validation**: Only allows requests from paultarjan.com and localhost
- **Rate limiting**: Uses Cloudflare's built-in DDoS protection

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
