# Deployment Guide

This guide covers deploying the Ingglish website and Chrome extension.

## Website Deployment

### Option 1: Vercel (Recommended)

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Select the `packages/website` directory as the root

2. **Configure Build Settings**
   - Framework Preset: Vite
   - Build Command: `cd ../.. && npm run build -w @ingglish/core && npm run build -w @ingglish/website`
   - Output Directory: `dist`
   - Install Command: `cd ../.. && npm ci`

3. **Deploy**
   - Vercel will automatically deploy on every push to main

4. **For GitHub Actions (CI/CD)**
   Add these secrets to your repository:
   - `VERCEL_TOKEN` - Get from Vercel account settings
   - `VERCEL_ORG_ID` - Get from Vercel project settings
   - `VERCEL_PROJECT_ID` - Get from Vercel project settings

### Option 2: Netlify

1. **Connect Repository**
   - Go to [netlify.com](https://netlify.com)
   - Import your GitHub repository

2. **Configure Build Settings**
   - Base directory: `packages/website`
   - Build command: `cd ../.. && npm run build -w @ingglish/core && npm run build -w @ingglish/website`
   - Publish directory: `packages/website/dist`

3. **Deploy**
   - Netlify will auto-deploy on push

### Option 3: GitHub Pages

1. **Enable GitHub Pages**
   - Go to repository Settings > Pages
   - Select "GitHub Actions" as the source

2. **Workflow**
   See [.github/workflows/pages.yml](https://github.com/ptarjan/ingglish/blob/main/.github/workflows/pages.yml) for the full workflow.

3. **Environment Variables**
   - `BASE_URL` - Set to `/<repo-name>/` for GitHub Pages subpath
   - `VITE_CORS_PROXY_URL` - URL to your CORS proxy for the URL translator feature

## Chrome Extension Deployment

### Development Testing

1. Build the extension:
   ```bash
   npm run build -w @ingglish/extension
   ```

2. Load in Chrome:
   - Go to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `packages/extension/dist`

### Chrome Web Store Publishing

1. **Prepare Assets**
   - Create icon images (16x16, 48x48, 128x128 PNG)
   - Take screenshots (1280x800 or 640x400)
   - Write store description

2. **Create ZIP**
   ```bash
   cd packages/extension/dist
   zip -r ../ingglish-extension.zip .
   ```

3. **Submit to Chrome Web Store**
   - Go to [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Pay one-time $5 developer fee
   - Upload ZIP file
   - Fill in store listing details
   - Submit for review

### Extension CI/CD

The extension is automatically built and packaged in [.github/workflows/pages.yml](https://github.com/ptarjan/ingglish/blob/main/.github/workflows/pages.yml).

## CORS Proxy Deployment

The URL translator feature requires a CORS proxy to fetch external websites. You can use the included Cloudflare Worker.

### Automatic Deployment

The CORS proxy is automatically deployed via [.github/workflows/deploy-cors-proxy.yml](https://github.com/ptarjan/ingglish/blob/main/.github/workflows/deploy-cors-proxy.yml) when changes are pushed to `packages/cors-proxy/`.

Requires `CLOUDFLARE_API_TOKEN` secret in repository settings.

### Manual Deployment

1. **Install Wrangler CLI**
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. **Configure your worker**
   Edit [packages/cors-proxy/wrangler.toml](https://github.com/ptarjan/ingglish/blob/main/packages/cors-proxy/wrangler.toml) to set `ALLOWED_ORIGINS`.

3. **Deploy**
   ```bash
   cd packages/cors-proxy
   wrangler deploy
   ```

4. **Update website environment**
   Set `VITE_CORS_PROXY_URL` to your worker URL.

### Using Custom Proxy

Alternatively, use any CORS proxy that supports the `?url=` parameter format.

## Environment Variables

### Website
No environment variables required for basic deployment.

### For URL Translation Feature
If you want to use your own CORS proxy instead of allorigins.win:
- `VITE_CORS_PROXY_URL` - Your CORS proxy URL (e.g., `https://your-proxy.workers.dev/?url=`)

## Monitoring & Analytics

### Add Vercel Analytics (Optional)
```bash
npm install @vercel/analytics -w @ingglish/website
```

Update `main.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react';

// Add <Analytics /> to your app
```

## Troubleshooting

### Build Fails
- Ensure Node.js 20+ is installed
- Run `npm ci` to get exact dependency versions
- Check that core library builds before website

### Website Shows Blank Page
- Check browser console for errors
- Verify the base path matches your deployment URL
- Ensure dictionary JSON is loading correctly

### Extension Not Working
- Check that manifest.json is valid
- Verify content scripts have correct permissions
- Check service worker console for errors
