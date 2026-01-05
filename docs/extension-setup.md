# Chrome Extension Setup

## Building the Extension

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the extension:
   ```bash
   npm run build -w @inglish/extension
   ```

3. The built extension will be in `packages/extension/dist/`

## Loading in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `packages/extension/dist/` directory

## Icons

You need to create icons for the extension:
- `icon16.png` - 16x16 pixels
- `icon48.png` - 48x48 pixels
- `icon128.png` - 128x128 pixels

Place these in `packages/extension/src/icons/` before building.

### Generating Icons

You can use any image editor or an online tool. The icons should:
- Have a transparent background
- Use the Inglish purple gradient (#6366f1 to #a855f7)
- Be simple and recognizable at small sizes

## Usage

1. Click the Inglish extension icon in the Chrome toolbar
2. Click "Translate Page" to translate the current page
3. Click "Turn Off" to reload the page with original text

## Notes

- The extension uses a content script that runs on all pages
- Translation state is lost when navigating to a new page
- Some pages may block content scripts (e.g., Chrome Web Store)
- Code blocks, form inputs, and scripts are not translated
