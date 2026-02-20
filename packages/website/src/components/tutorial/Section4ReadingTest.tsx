import { readingTestWords, readingTestAttribution } from '../../data/tutorial-data';

export function Section4ReadingTest() {
  return (
    <section className="tutorial-section">
      <h2 className="tutorial-heading">Can you read this?</h2>
      <div className="reading-test">
        <p className="reading-ingglish">
          {readingTestWords.map(([ingglish, english], i) => (
            <span key={i}>
              <span data-orig={english ?? undefined}>{ingglish}</span>{' '}
            </span>
          ))}
        </p>
        <p className="reading-attribution">&mdash; {readingTestAttribution}</p>
      </div>
      <p className="tutorial-punchline">
        You just read Shakespeare. Without learning a single rule.
      </p>
    </section>
  );
}
