interface ForeignSample {
  label: string;
  text: string;
}

const FOREIGN_SAMPLES: Record<string, ForeignSample[]> = {
  ar: [
    { label: 'Proverb', text: 'العلم نور والجهل ظلام' },
    { label: 'Greeting', text: 'صباح خير كيف حالك اليوم' },
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
    { label: 'Greetings', text: 'terve kiitos ei minä sinä mitä päivä' },
    { label: 'Nature', text: 'sauna järvi metsä luonto kaunis talvi kesä' },
    { label: 'Wisdom', text: 'vanha viisas metsä järvi sauna' },
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
    { label: 'Bashō haiku', text: '古池 蛙 飛び込む 水 音' },
    { label: 'Culture', text: '東京 日本 富士山 桜 着物 歌舞伎 相撲 侍 忍者' },
    { label: 'Seasons', text: '春 夏 秋 冬 花 桜 紅葉 山 川 海 空' },
  ],
  ko: [
    { label: 'Greetings', text: '안녕하세요 감사합니다 사랑 한국 서울' },
    { label: 'Food', text: '김치찌개 비빔밥 불고기 된장찌개 삼겹살' },
    { label: 'Daily life', text: '학생 선생님 친구 음식 날씨 가족 학교' },
  ],
  nl: [
    { label: 'Greeting', text: 'Goedemorgen, hoe het met je?' },
    {
      label: 'Culture',
      text: 'Ik graag fietsen langs windmolen kaas stroopwafel gezellig lekker mooi',
    },
    { label: 'Weather', text: 'Het regent vandaag, je paraplu niet' },
  ],
  pt: [
    { label: 'Culture', text: 'música comida bonita oceano saudade português' },
    { label: 'Places', text: 'olá obrigado amigo cidade casa escola' },
    { label: 'Saudade', text: 'saudade sentimento difícil explicar' },
  ],
  zh: [
    { label: 'Confucius', text: '学 而 时 习 之 不 亦 说 乎' },
    { label: 'Nature', text: '山 水 风 雨 天 地 日 月' },
    { label: 'Daily life', text: '今天 天气 怎么样 我 想 吃 饺子 和 喝 茶' },
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
