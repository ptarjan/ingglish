# Ingglish CORS Proxy

A Cloudflare Worker that proxies requests for the Ingglish URL translator.

## Security Features

- **Origin validation**: Only allows requests from configured allowed origins
- **SSRF prevention**: Blocks requests to private IP ranges (127.*, 10.*, 172.16-31.*, 192.168.*, 169.254.*, ::1, fc00::/fd00::)
- **Protocol restriction**: Only allows HTTP/HTTPS URLs
- **Content-Type validation**: Only proxies HTML responses
- **Rate limiting**: Uses Cloudflare's built-in DDoS protection
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
