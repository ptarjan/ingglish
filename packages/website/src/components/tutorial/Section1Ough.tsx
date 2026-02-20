import { useScrollReveal, useStaggeredReveal } from '../../hooks/useScrollReveal';
import { oughExamples } from '../../data/tutorial-data';

function OughCard({
  prefix,
  suffix,
  sound,
  animate,
}: {
  prefix: string;
  suffix: string;
  sound: string;
  animate: boolean;
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

export function Section1Ough() {
  const { ref, visible } = useScrollReveal<HTMLElement>();
  const revealedCount = useStaggeredReveal(oughExamples.length, visible, 700);

  return (
    <section ref={ref} className={`tutorial-section ${visible ? 'revealed' : ''}`}>
      <h2 className="tutorial-heading">One spelling. Six sounds.</h2>
      <div className="ough-grid">
        {oughExamples.map((ex, i) => (
          <OughCard key={i} {...ex} animate={i < revealedCount} />
        ))}
      </div>
      <p className="tutorial-punchline">
        Same four letters. Six different sounds. This is English.
      </p>
      <div className="scroll-hint" aria-hidden="true">
        &#8595;
      </div>
    </section>
  );
}
