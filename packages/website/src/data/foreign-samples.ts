interface ForeignSample {
  label: string;
  text: string;
}

const FOREIGN_SAMPLES: Record<string, ForeignSample[]> = {
  ar: [
    { label: 'Greeting', text: 'مرحبا كيف حالك اليوم' },
    { label: 'Common phrases', text: 'شكرا جزيلا على مساعدتك' },
    { label: 'Food', text: 'أريد أن آكل الفلافل والحمص' },
  ],
  de: [
    { label: 'Greeting', text: 'Guten Tag, wie geht es Ihnen heute?' },
    { label: 'Beer garden', text: 'Ich hätte gerne ein Bier und eine Brezel bitte' },
    { label: 'Butterfly', text: 'Der Schmetterling fliegt über die Blumenwiese' },
  ],
  es: [
    { label: 'Greeting', text: '¡Hola! ¿Cómo estás? Me llamo Pedro.' },
    { label: 'Don Quixote', text: 'En un lugar de la Mancha, de cuyo nombre no quiero acordarme' },
    { label: 'At the restaurant', text: 'Quisiera una mesa para dos personas, por favor' },
  ],
  fi: [
    { label: 'Greeting', text: 'Hyvää päivää, mitä kuuluu?' },
    { label: 'Sauna', text: 'Sauna on valmis ja järvi on lämmin' },
    { label: 'Nature', text: 'Suomen luonto on kaunis kesällä' },
  ],
  fr: [
    { label: 'Greeting', text: "Bonjour, comment allez-vous aujourd'hui?" },
    {
      label: 'Le Petit Prince',
      text: "On ne voit bien qu'avec le cœur. L'essentiel est invisible pour les yeux.",
    },
    {
      label: 'At the bakery',
      text: "Je voudrais une baguette et deux croissants, s'il vous plaît",
    },
  ],
  ja: [
    { label: 'Greeting', text: 'こんにちは、お元気ですか' },
    { label: 'Cherry blossoms', text: '桜の花が咲いています' },
    { label: 'At the restaurant', text: 'すみません、メニューをお願いします' },
  ],
  ko: [
    { label: 'Greeting', text: '안녕하세요 만나서 반갑습니다' },
    { label: 'Food', text: '김치찌개 하나 주세요' },
    { label: 'Weather', text: '오늘 날씨가 좋습니다' },
  ],
  nl: [
    { label: 'Greeting', text: 'Goedemorgen, hoe gaat het met u?' },
    { label: 'Cycling', text: 'Ik ga graag fietsen langs de grachten in Amsterdam' },
    { label: 'Weather', text: 'Het regent vandaag, vergeet je paraplu niet' },
  ],
  pt: [
    { label: 'Greeting', text: 'Bom dia, como vai você?' },
    { label: 'At the beach', text: 'A praia é bonita e o mar está calmo hoje' },
    { label: 'Saudade', text: 'Saudade é um sentimento difícil de explicar' },
  ],
  zh: [
    { label: 'Greeting', text: '你好，今天天气怎么样？' },
    { label: 'Food', text: '我想吃饺子和炒饭' },
    { label: 'Travel', text: '我想去北京看长城' },
  ],
};

export function pickForeignSample(langCode: string, currentText: string): string | undefined {
  const samples = FOREIGN_SAMPLES[langCode];
  if (!samples || samples.length === 0) {
    return undefined;
  }
  let pick = samples[0]!;
  if (samples.length > 1) {
    do {
      pick = samples[Math.floor(Math.random() * samples.length)]!;
    } while (pick.text === currentText);
  }
  return pick.text;
}
