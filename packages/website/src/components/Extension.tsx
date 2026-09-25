import { useEffect, useRef, useState } from 'react';
import { trackBookmarkletCopy } from '../analytics';

const BOOKMARKLET_CODE = `javascript:void(function(){var s=document.createElement('script');s.src='https://ingglish.com/bookmarklet.js';document.head.appendChild(s)})()`;

type Browser = 'chrome' | 'edge' | 'firefox' | 'other' | 'safari';

function detectBrowser(): Browser {
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent;
  if (ua.includes('Edg/')) {
    return 'edge';
  }
  if (ua.includes('Chrome/')) {
    return 'chrome';
  }
  if (ua.includes('Firefox/')) {
    return 'firefox';
  }
  if (ua.includes('Safari/')) {
    return 'safari';
  }
  return 'other';
}

const isMac = typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac');
const modKey = isMac ? '⌘' : 'Ctrl';

const bookmarksBarInstructions: Record<Browser, { description: string; title: string }> = {
  chrome: {
    description: `Press ${modKey}+Shift+B to toggle the bookmarks bar`,
    title: 'Show your bookmarks bar',
  },
  edge: {
    description: `Press ${modKey}+Shift+B to toggle the favorites bar`,
    title: 'Show your favorites bar',
  },
  firefox: {
    description: `Press ${modKey}+Shift+B to toggle the bookmarks toolbar`,
    title: 'Show your bookmarks toolbar',
  },
  other: {
    description: 'Open your browser settings and turn on the bookmarks or favorites bar',
    title: 'Show your bookmarks bar',
  },
  safari: {
    description: 'In the menu bar, choose View > Show Favorites Bar',
    title: 'Show your Favorites Bar',
  },
};

function Extension(): React.JSX.Element {
  const [copied, setCopied] = useState(false);
  const browser = detectBrowser();
  const bookmarkletRef = useRef<HTMLAnchorElement>(null);
  const { description: barDescription, title: barTitle } = bookmarksBarInstructions[browser];

  // Set href via DOM ref to bypass React's javascript: URL blocking
  useEffect(() => {
    if (bookmarkletRef.current) {
      bookmarkletRef.current.href = BOOKMARKLET_CODE;
    }
  }, []);

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
          Read any webpage in Ingglish with one click. Use the bookmarklet in any browser, or
          install the Chrome extension, which also translates new content automatically.
        </p>
      </div>

      <div className="guide-section">
        <h3>Bookmarklet (Any Browser)</h3>
        <p>
          A bookmarklet is a bookmark that translates the page you are on. It works in Chrome,
          Firefox, Safari, Edge and any other browser.
        </p>
        <div className="bookmarklet-container">
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid -- bookmarklet drag target */}
          <a
            className="bookmarklet-button"
            onClick={(event) => {
              event.preventDefault();
            }}
            ref={bookmarkletRef}
            role="presentation"
          >
            Ingglish
          </a>
        </div>
        <h4>How to install</h4>
        <ol className="install-steps">
          <li>
            <strong>{barTitle}</strong>
            <p>{barDescription}</p>
          </li>
          <li>
            <strong>Drag the &ldquo;Ingglish&rdquo; button</strong>
            <p>Drag the button above into your bookmarks bar</p>
          </li>
          <li>
            <strong>Translate any page</strong>
            <p>
              Open any webpage and click &ldquo;Ingglish&rdquo; in your bookmarks bar. A small badge
              appears in the corner; click it to switch back to the original.
            </p>
          </li>
        </ol>
        <p className="note">
          Or{' '}
          <button className="btn-reset link-button" onClick={handleCopy}>
            {copied ? 'Copied!' : 'copy the bookmarklet code'}
          </button>{' '}
          and paste it into a new bookmark by hand.
        </p>
      </div>

      <div className="guide-section">
        <h3>Chrome Extension</h3>
        <p>
          The extension translates a page with one click, then keeps translating new content as it
          loads, which helps on infinite-scroll pages.
        </p>
      </div>

      <div className="guide-section">
        <h4>Features</h4>
        <ul className="principles-list">
          <li>
            <strong>One-click translation:</strong> translates the page you are reading.
          </li>
          <li>
            <strong>Dynamic content:</strong> translates new content as it appears.
          </li>
          <li>
            <strong>Smart skipping:</strong> leaves code blocks, scripts and form inputs untouched.
          </li>
          <li>
            <strong>Visual indicator:</strong> shows when a page has been translated.
          </li>
        </ul>
      </div>

      <div className="guide-section">
        <h4>Installation</h4>
        <ol className="install-steps">
          <li>
            <strong>Download the extension</strong>
            <p>
              <a download href="ingglish-extension.zip">
                Download ingglish-extension.zip
              </a>
            </p>
          </li>
          <li>
            <strong>Unzip the file</strong>
            <p>Extract it to a folder you&apos;ll keep, such as &ldquo;ingglish-extension&rdquo;</p>
          </li>
          <li>
            <strong>Open Chrome Extensions</strong>
            <p>
              Go to <code>chrome://extensions/</code> in Chrome
            </p>
          </li>
          <li>
            <strong>Enable Developer Mode</strong>
            <p>Turn on the switch in the top right corner</p>
          </li>
          <li>
            <strong>Load the extension</strong>
            <p>Click &ldquo;Load unpacked&rdquo; and choose the folder you extracted</p>
          </li>
        </ol>
      </div>
    </div>
  );
}

export default Extension;
