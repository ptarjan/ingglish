import { useState } from 'react';
import { trackBookmarkletCopy } from '../analytics';

const BOOKMARKLET_CODE = `javascript:void(function(){var s=document.createElement('script');s.src='https://ingglish.com/bookmarklet.js';document.head.appendChild(s)})()`;

function Extension(): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  function handleCopy(): void {
    void navigator.clipboard.writeText(BOOKMARKLET_CODE).then(() => {
      setCopied(true);
      trackBookmarkletCopy();
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    });
  }

  return (
    <div className="extension-page">
      <div className="guide-intro">
        <h2>Translate Any Webpage</h2>
        <p>
          Read any webpage in Ingglish with one click. Choose a bookmarklet for any browser, or a
          Chrome extension for automatic translation.
        </p>
      </div>

      <div className="guide-section">
        <h3>Bookmarklet (Any Browser)</h3>
        <p>
          Works in Chrome, Firefox, Safari, Edge, and any other browser. Drag the button below to
          your bookmarks bar:
        </p>
        <div className="bookmarklet-container">
          <a className="bookmarklet-button" href={BOOKMARKLET_CODE}>
            Ingglish
          </a>
          <span className="bookmarklet-hint">Drag this to your bookmarks bar</span>
        </div>
        <p className="note">
          Or{' '}
          <button className="link-button" onClick={handleCopy}>
            {copied ? 'Copied!' : 'copy the bookmarklet code'}
          </button>{' '}
          and create a bookmark manually.
        </p>
        <h4>How it works</h4>
        <ol className="install-steps">
          <li>Navigate to any webpage you want to translate</li>
          <li>Click the "Ingglish" bookmark in your bookmarks bar</li>
          <li>
            The page text will be converted to Ingglish spelling. A small badge appears in the
            corner — click it to toggle back.
          </li>
        </ol>
      </div>

      <div className="guide-section">
        <h3>Chrome Extension</h3>
        <p>
          The extension translates pages with one click and automatically translates new content as
          it loads (useful for infinite-scroll pages).
        </p>
      </div>

      <div className="guide-section">
        <h4>Features</h4>
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
        <h4>Installation</h4>
        <ol className="install-steps">
          <li>
            <strong>Download the extension</strong>
            <p>
              <a href="ingglish-extension.zip" download>
                Download ingglish-extension.zip
              </a>
            </p>
          </li>
          <li>
            <strong>Unzip the file</strong>
            <p>Extract the zip to a folder you'll keep (e.g., "ingglish-extension")</p>
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
            <p>Click "Load unpacked" and select the folder you extracted</p>
          </li>
        </ol>
      </div>
    </div>
  );
}

export default Extension;
