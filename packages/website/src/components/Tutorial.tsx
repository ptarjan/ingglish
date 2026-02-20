import { Section1Ough } from './tutorial/Section1Ough';
import { Section2WhatIf } from './tutorial/Section2WhatIf';
import { Section3TryIt } from './tutorial/Section3TryIt';
import { Section4ReadingTest } from './tutorial/Section4ReadingTest';
import { Section5Transform } from './tutorial/Section5Transform';
import { Section6Progressive } from './tutorial/Section6Progressive';
import { Section7Poem } from './tutorial/Section7Poem';
import { Section8CTA } from './tutorial/Section8CTA';

interface TutorialProps {
  onNavigate: (tab: string) => void;
}

export default function Tutorial({ onNavigate }: TutorialProps) {
  return (
    <div className="tutorial">
      <Section1Ough />
      <Section2WhatIf />
      <Section3TryIt onNavigate={onNavigate} />
      <Section4ReadingTest />
      <Section5Transform />
      <Section6Progressive />
      <Section7Poem />
      <Section8CTA onNavigate={onNavigate} />
    </div>
  );
}
