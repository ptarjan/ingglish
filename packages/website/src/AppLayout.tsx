import { translate } from 'ingglish';
import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { DictContext } from './DictContext';
import { trackPageView } from './analytics';
import { useTheme } from './hooks/useTheme';
import { useUpdateCheck } from './hooks/useUpdateCheck';
import { HOME_META, ROUTE_META } from './route-meta';
import { sitePath, siteUrl } from './routes';

type Tab =
  'docs' | 'experiment' | 'explore' | 'extension' | 'games' | 'guide' | 'text' | 'tutorial' | 'url';

// Runtime titles. Descriptions come from route-meta.ts so the pre-rendered
// <head> and the app never disagree.
const TAB_META: Record<Tab, { path: string; title: string }> = {
  docs: {
    path: '/docs',
    title: 'Documentation | Ingglish',
  },
  experiment: {
    path: '/experiment',
    title: 'Experiment | Ingglish',
  },
  explore: {
    path: '/explore',
    title: 'Word Explorer | Ingglish',
  },
  extension: {
    path: '/extension',
    title: 'Browser Extension | Ingglish',
  },
  games: {
    path: '/games',
    title: 'Games | Ingglish',
  },
  guide: {
    path: '/guide',
    title: 'Spelling Guide | Ingglish',
  },
  text: {
    path: '/text',
    title: 'Text Translator | Ingglish',
  },
  tutorial: {
    path: '/',
    title: 'Ingglish — What if English Spelling Made Sense?',
  },
  url: {
    path: '/url',
    title: 'URL Translator | Ingglish',
  },
};

// Hrefs carry the trailing slash so crawlers following the nav land on the page
// instead of a GitHub Pages 301 (see sitePath in routes.ts).
const TAB_LINKS: (readonly [string, Tab, string])[] = (
  [
    ['/', 'tutorial', 'Tutorial'],
    ['/text', 'text', 'Translate Text'],
    ['/url', 'url', 'Translate URL'],
    ['/guide', 'guide', 'Spelling Guide'],
    ['/docs', 'docs', 'Docs'],
    ['/extension', 'extension', 'Extension'],
    ['/explore', 'explore', 'Word Explorer'],
    ['/experiment', 'experiment', 'Experiment'],
    ['/games', 'games', 'Games'],
  ] as const
).map(([href, tab, label]) => [sitePath(href), tab, label] as const);

export default function AppLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);
  const { cycleTheme, getThemeIcon } = useTheme();
  const updateAvailable = useUpdateCheck();
  const location = useLocation();

  const activeTab = useMemo(() => getTabFromPath(location.pathname), [location.pathname]);
  const meta = useMemo(
    () => ({
      ...TAB_META[activeTab],
      description: (activeTab === 'tutorial' ? HOME_META : ROUTE_META[activeTab]!).description,
    }),
    [activeTab]
  );

  // Hide tabs on tutorial only for the very first visit (no prior navigation)
  const [isFirstVisit] = useState(
    () =>
      activeTab === 'tutorial' &&
      (typeof sessionStorage === 'undefined' || !sessionStorage.getItem('visited'))
  );
  useEffect(() => {
    sessionStorage.setItem('visited', '1');
  }, []);

  // Track page views and update document title
  useEffect(() => {
    // Docs and Games manage their own titles via sub-routes
    if (activeTab !== 'docs' && activeTab !== 'games') {
      document.title = meta.title;
    }
    trackPageView(location.pathname);
    window.scrollTo(0, 0);
  }, [activeTab, meta.title, location.pathname]);

  useEffect(() => {
    // Preload dictionary by calling translate once
    translate('')
      .then(() => {
        setIsLoading(false);
      })
      .catch((error_: unknown) => {
        const message = error_ instanceof Error ? error_.message : 'Unknown error';
        setError(`Couldn't load the pronunciation dictionary: ${message}. Try reloading the page.`);
        setIsLoading(false);
      });
  }, []);

  // Flip tooltips below the word when near the top of the viewport
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = (e.target as Element).closest?.('[data-orig]');
      if (!target) {
        return;
      }
      const rect = target.getBoundingClientRect();
      target.classList.toggle('tooltip-below', rect.top < 35);
    };
    document.addEventListener('mouseover', handler, true);
    return () => {
      document.removeEventListener('mouseover', handler, true);
    };
  }, []);

  return (
    <DictContext.Provider value={{ error, isLoading }}>
      <div className="app">
        {updateAvailable && (
          <div className="update-banner">
            A new version is available.{' '}
            <button
              onClick={() => {
                globalThis.location.reload();
              }}
            >
              Reload
            </button>
          </div>
        )}
        <meta content={meta.description} name="description" />
        <link href={siteUrl(meta.path)} rel="canonical" />
        <header className="header">
          <div className="header-title">
            <Link className="logo-link" to="/">
              <img alt="Ingglish logo" className="logo" height={56} src="/logo.svg" width={56} />
              <h1>Ingglish</h1>
            </Link>
            <Link
              className="btn-reset subtitle-link"
              style={isLoading ? { visibility: 'hidden' } : undefined}
              to="/guide/"
            >
              What if English spelling made sense?
            </Link>
            <div className="header-right">
              <button aria-label="Toggle theme" className="theme-toggle" onClick={cycleTheme}>
                {getThemeIcon()}
              </button>
            </div>
          </div>
        </header>

        {!(activeTab === 'tutorial' && isFirstVisit) && (
          <nav
            className="tabs hide-scrollbar"
            style={isLoading ? { visibility: 'hidden' } : undefined}
          >
            {TAB_LINKS.map(([href, tab, label]) => (
              <NavLink
                className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}
                end={tab === 'tutorial'}
                key={tab}
                ref={
                  activeTab === tab
                    ? (node) => {
                        node?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'nearest',
                          inline: 'center',
                        });
                      }
                    : undefined
                }
                to={href}
              >
                {label}
              </NavLink>
            ))}
          </nav>
        )}

        <main className="main">
          <Outlet />
        </main>

        <footer className="footer">
          <p>
            {/* Plain anchor (not react-router Link): /words is a build-time
                static page, not an SPA route, and this link makes the per-word
                pages crawlable from every page rather than the sitemap alone. */}
            Browse the phonetic spelling of <a href="/words/">common English words</a>.
          </p>
          <p>
            Ingglish uses the{' '}
            <a
              href="https://github.com/cmusphinx/cmudict"
              rel="noopener noreferrer"
              target="_blank"
            >
              CMU Pronouncing Dictionary
            </a>{' '}
            (126,000+ words) to look up how each English word is pronounced, then spells it by
            sound.{' '}
            <a href="https://github.com/ptarjan/ingglish" rel="noopener noreferrer" target="_blank">
              View on GitHub
            </a>
          </p>
        </footer>
      </div>
    </DictContext.Provider>
  );
}

function getTabFromPath(pathname: string): Tab {
  const segment = pathname.replace(/\/$/, '').split('/')[1] ?? '';
  if (segment === 'docs') {
    return 'docs';
  }
  if (segment === 'games' || segment === 'challenge') {
    return 'games';
  }
  if (
    segment === 'tutorial' ||
    segment === 'text' ||
    segment === 'url' ||
    segment === 'guide' ||
    segment === 'extension' ||
    segment === 'experiment' ||
    segment === 'explore'
  ) {
    return segment;
  }
  return 'tutorial';
}
