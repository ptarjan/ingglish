import { oughExamples } from '../../data/tutorial-data';
import { useScrollReveal, useStaggeredReveal } from '../../hooks/useScrollReveal';

export function Section1Ough() {
  const { ref, visible } = useScrollReveal<HTMLElement>();
  const revealedCount = useStaggeredReveal(oughExamples.length, visible, 700);

  return (
    <section className={`tutorial-section ${visible ? 'revealed' : ''}`} ref={ref}>
      <h2 className="tutorial-heading">One spelling. Six sounds.</h2>
      <div className="ough-grid">
        {oughExamples.map((ex, i) => (
          <OughCard key={i} {...ex} animate={i < revealedCount} />
        ))}
      </div>
      <p className="tutorial-punchline">
        Same four letters. Six different sounds. This is English.
      </p>
      <div aria-hidden="true" className="scroll-hint">
        &#8595;
      </div>
    </section>
  );
}

function OughCard({
  animate,
  prefix,
  sound,
  suffix,
}: {
  animate: boolean;
  prefix: string;
  sound: string;
  suffix: string;
}) {
  return (
    <div className={`ough-card ${animate ? 'revealed' : ''}`}>
      <div className="ough-english-word">
        <span>{prefix}</span>
        <span className="ough-highlight-old">ough</span>
        <span>{suffix}</span>
      </div>
      <div className={`ough-arrow ${animate ? 'shown' : ''}`}>&rarr;</div>
      <div className={`ough-ingglish-word ${animate ? 'shown' : ''}`}>
        <span className="ough-ingglish-text" data-orig={`${prefix}ough${suffix}`}>
          <span>{prefix}</span>
          <span className="ough-highlight-new">{sound}</span>
          <span>{suffix}</span>
        </span>
      </div>
    </div>
  );
}
