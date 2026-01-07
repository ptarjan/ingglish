function Extension() {
  return (
    <div className="extension-page">
      <div className="guide-intro">
        <h2>Chrome Extension</h2>
        <p>
          Translate any webpage to Ingglish with one click. The extension works on any site and
          automatically translates new content as it loads.
        </p>
      </div>

      <div className="guide-section">
        <h3>Features</h3>
        <ul className="principles-list">
          <li>
            <strong>One-click translation</strong> - translate any webpage instantly
          </li>
          <li>
            <strong>Dynamic content</strong> - automatically translates new content as it appears
          </li>
          <li>
            <strong>Smart skipping</strong> - preserves code blocks, scripts, and form inputs
          </li>
          <li>
            <strong>Visual indicator</strong> - shows when a page has been translated
          </li>
        </ul>
      </div>

      <div className="guide-section">
        <h3>Installation</h3>
        <p>The extension is not yet on the Chrome Web Store. To install manually:</p>
        <ol className="install-steps">
          <li>
            <strong>Download the extension</strong>
            <p>
              Clone or download the{' '}
              <a
                href="https://github.com/ptarjan/ingglish"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub repository
              </a>
            </p>
          </li>
          <li>
            <strong>Build the extension</strong>
            <p>
              Run <code>cd packages/extension && npm run build</code>
            </p>
          </li>
          <li>
            <strong>Open Chrome Extensions</strong>
            <p>
              Go to <code>chrome://extensions/</code> in your browser
            </p>
          </li>
          <li>
            <strong>Enable Developer Mode</strong>
            <p>Toggle the switch in the top right corner</p>
          </li>
          <li>
            <strong>Load the extension</strong>
            <p>
              Click "Load unpacked" and select the <code>packages/extension/dist</code> folder
            </p>
          </li>
        </ol>
      </div>

      <div className="guide-section">
        <h3>Usage</h3>
        <ol className="install-steps">
          <li>Navigate to any webpage you want to translate</li>
          <li>Click the Ingglish extension icon in your browser toolbar</li>
          <li>Click "Translate Page"</li>
          <li>The page text will be converted to phonetic Ingglish spelling</li>
        </ol>
        <p className="note">
          A small "Ingglish" badge appears in the corner of translated pages. Click it to dismiss.
        </p>
      </div>
    </div>
  );
}

export default Extension;
