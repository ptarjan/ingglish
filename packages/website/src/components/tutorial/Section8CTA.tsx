import { useCallback } from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';

export function Section8CTA({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { ref, visible } = useScrollReveal<HTMLElement>();

  const handleNavigate = useCallback(
    (tab: string) => (e: React.MouseEvent) => {
      e.preventDefault();
      window.scrollTo(0, 0);
      onNavigate(tab);
    },
    [onNavigate]
  );

  return (
    <section className={`tutorial-section tutorial-cta ${visible ? 'revealed' : ''}`} ref={ref}>
      <h2 className="tutorial-heading">Try Ingglish</h2>
      <div className="cta-buttons">
        <a className="cta-primary" href="/text" onClick={handleNavigate('text')}>
          Translate Text
        </a>
        <a className="cta-secondary" href="/url" onClick={handleNavigate('url')}>
          Translate a Website
        </a>
        <a className="cta-secondary" href="/guide" onClick={handleNavigate('guide')}>
          Spelling Guide
        </a>
      </div>
    </section>
  );
}
