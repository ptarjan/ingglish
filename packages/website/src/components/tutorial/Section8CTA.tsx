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
    <section ref={ref} className={`tutorial-section tutorial-cta ${visible ? 'revealed' : ''}`}>
      <h2 className="tutorial-heading">Try Ingglish</h2>
      <div className="cta-buttons">
        <a href="/text" className="cta-primary" onClick={handleNavigate('text')}>
          Translate Text
        </a>
        <a href="/url" className="cta-secondary" onClick={handleNavigate('url')}>
          Translate a Website
        </a>
        <a href="/guide" className="cta-secondary" onClick={handleNavigate('guide')}>
          Spelling Guide
        </a>
      </div>
    </section>
  );
}
