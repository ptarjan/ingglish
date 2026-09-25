# Deployment Guide

How to deploy the three deployable parts of Ingglish: the website, the Chrome extension and the CORS proxy.

## Website Deployment

### GitHub Pages (Current)

GitHub Actions deploys the site automatically on every push to `main`.

1. **Enable GitHub Pages**
   - Go to repository Settings > Pages
   - Select "GitHub Actions" as the source

2. **Workflow**
   See [.github/workflows/pages.yml](https://github.com/ptarjan/ingglish/blob/main/.github/workflows/pages.yml) for the full workflow.

3. **Environment Variables**
   - `BASE_URL`: set to `/<repo-name>/` when the site is served from a GitHub Pages subpath
   - `VITE_CORS_PROXY_URL`: the URL of your CORS proxy, used by the URL translator (the site feature that translates a web page from its address)

## Chrome Extension Deployment

### Building

```bash
npm run build -w @ingglish/extension
```

The build goes to `packages/extension/dist/`.

### Loading in Chrome

1. Go to `chrome://extensions`
2. Turn on "Developer mode" (the toggle at the top right)
3. Click "Load unpacked"
4. Select `packages/extension/dist`

### Usage

1. Click the Ingglish icon in the Chrome toolbar
2. Click "Translate Page" to translate the page you're on
3. Click "Turn Off" to restore the original text
4. Use the format toggle to switch the output between Ingglish and IPA (the International Phonetic Alphabet)

**Keyboard Shortcuts:**
- **Windows/Linux**: `Alt+Shift+G`
- **Mac**: `Ctrl+Shift+G`

### Features

- **Format switching**: toggle the output between Ingglish and IPA
- **In-place updates**: switching format updates the words already translated, without re-rendering the page
- **Dynamic content**: content added later by JavaScript (single-page apps, infinite scroll) is translated too
- **Hover tooltips**: hover over a translated word to see the original English

### Notes

- Within a tab, translation stays on (or off) when you refresh the page
- Some pages block content scripts (e.g., Chrome Web Store)
- Code blocks, form inputs, and scripts are not translated

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
   - Pay the one-time $5 developer fee
   - Upload the ZIP file
   - Fill in the store listing
   - Submit for review

### Extension CI/CD

The extension is built and packaged automatically by [.github/workflows/pages.yml](https://github.com/ptarjan/ingglish/blob/main/.github/workflows/pages.yml).

## CORS Proxy Deployment

The URL translator needs a CORS proxy to fetch pages from other websites. The repo includes one as a Cloudflare Worker.

### Automatic Deployment

The CORS proxy is deployed automatically by [.github/workflows/deploy-cors-proxy.yml](https://github.com/ptarjan/ingglish/blob/main/.github/workflows/deploy-cors-proxy.yml) whenever a push changes `packages/cors-proxy/`.

This needs a `CLOUDFLARE_API_TOKEN` secret in the repository settings.

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

You can also use any CORS proxy that takes the target as a `?url=` parameter.

## Environment Variables

### Website
A basic deployment needs no environment variables.

### For URL Translation Feature
To use your own CORS proxy instead of the default public proxy, allorigins.win:
- `VITE_CORS_PROXY_URL` - Your CORS proxy URL (e.g., `https://your-proxy.workers.dev/?url=`)

## Troubleshooting

See [Troubleshooting Guide](troubleshooting.md) for common deployment issues.
