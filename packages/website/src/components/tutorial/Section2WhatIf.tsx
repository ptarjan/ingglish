import { useScrollReveal, useStaggeredReveal } from '../../hooks/useScrollReveal';

export function Section2WhatIf() {
  const { ref, visible } = useScrollReveal<HTMLElement>(0.05);
  const revealedCount = useStaggeredReveal(3, visible, 800);

  const lines = [
    'What if every spelling always made the same sound?',
    "What if you could read any word correctly\u2009\u2014\u2009even one you'd never seen before?",
    "That's Ingglish.",
  ];

  return (
    <section className="tutorial-section tutorial-whatif revealed" ref={ref}>
      {lines.map((line, i) => (
        <p
          className={`whatif-line ${i === 0 || i < revealedCount ? 'revealed' : ''} ${i === 2 ? 'whatif-punchline' : ''}`}
          key={i}
        >
          {line}
        </p>
      ))}
    </section>
  );
}
