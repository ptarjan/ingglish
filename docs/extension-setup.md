# Chrome Extension Setup

## Prerequisites

See the [Contributing Guide](contributing.md) for initial project setup (clone, install, build).

## Building the Extension

```bash
npm run build -w @ingglish/extension
```

The built extension will be in `packages/extension/dist/`.

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
- Use the Ingglish purple gradient (#6366f1 to #a855f7)
- Be simple and recognizable at small sizes

## Usage

1. Click the Ingglish extension icon in the Chrome toolbar
2. Click "Translate Page" to translate the current page
3. Click "Turn Off" to restore the original text
4. Use the format toggle to switch between Ingglish and IPA output

### Keyboard Shortcut

- **Windows/Linux**: `Alt+Shift+I`
- **Mac**: `Ctrl+Shift+I`

This toggles translation on/off for the current page.

## Features

- **Format switching**: Toggle between Ingglish and IPA output formats
- **In-place updates**: Format switching updates existing translations without re-rendering
- **Dynamic content**: Automatically translates content added via JavaScript (SPAs, infinite scroll)
- **Debounced updates**: Batches rapid DOM changes to prevent freezing

For technical details on the extension architecture and message-passing flow, see [Architecture Overview](architecture.md#chrome-extension-ingglishextension).

## Notes

- The translation script is loaded on-demand (not on every page)
- Translation state persists within a tab across page refreshes
- Some pages may block content scripts (e.g., Chrome Web Store)
- Code blocks, form inputs, and scripts are not translated
- Hover over translated words to see the original English
