interface ForeignSample {
  label: string;
  text: string;
}

const FOREIGN_SAMPLES: Record<string, ForeignSample[]> = {
  ar: [
    { label: 'Proverb: Knowledge is light', text: 'العلم نور والجهل ظلام' },
    { label: 'Proverb: You reap what you sow', text: 'من زرع حصد' },
    { label: 'Greeting', text: 'صباح خير كيف حالك اليوم' },
    { label: 'Food', text: 'أريد أن آكل الفلافل والحمص' },
  ],
  de: [
    {
      label: 'Kafka — Die Verwandlung',
      text: 'Als Gregor eines Morgens aus unruhigen Träumen erwachte, fand er sich in seinem Bett zu einem ungeheuren Ungeziefer verwandelt.',
    },
    {
      label: 'Goethe — Faust',
      text: 'Da steh ich nun, ich armer Tor, und bin so klug als wie zuvor.',
    },
    {
      label: 'Grimm — Schneewittchen',
      text: 'Es war einmal mitten im Winter, und die Schneeflocken fielen wie Federn vom Himmel herab.',
    },
    {
      label: 'Einstein',
      text: 'Phantasie ist wichtiger als Wissen, denn Wissen ist begrenzt.',
    },
    {
      label: 'Recipe',
      text: 'Zuerst die Butter und den Zucker schaumig rühren. Dann die Eier einzeln dazugeben und gut verrühren.',
    },
    {
      label: 'Weather forecast',
      text: 'Heute wird es sonnig mit Temperaturen um die zwanzig Grad. Am Abend ziehen Wolken auf und es kann regnen.',
    },
    {
      label: 'Butterfly',
      text: 'Der Schmetterling fliegt über die Blumenwiese',
    },
    {
      label: 'Beer garden',
      text: 'Ich hätte gerne ein Bier und eine Brezel bitte',
    },
  ],
  es: [
    {
      label: 'Don Quijote',
      text: 'En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía un hidalgo de los de lanza en astillero, adarga antigua, rocín flaco y galgo corredor.',
    },
    {
      label: 'Neruda — Poema 20',
      text: 'Puedo escribir los versos más tristes esta noche. Escribir, por ejemplo, que la noche es estrellada, y tiritan, azules, los astros, a lo lejos.',
    },
    {
      label: 'Paella recipe',
      text: 'Calentar el aceite en una paella grande y freír el pollo hasta que esté dorado. Añadir las judías verdes y el tomate rallado.',
    },
    {
      label: 'Greeting',
      text: '¡Hola! ¿Cómo estás? Me llamo Pedro.',
    },
    {
      label: 'At the restaurant',
      text: 'Quisiera una mesa para dos personas, por favor',
    },
  ],
  fi: [
    {
      label: 'Nature',
      text: 'sauna järvi metsä luonto kaunis talvi kesä vesi tuuli lumi tuli maa taivas tähti',
    },
    { label: 'Wisdom', text: 'vanha viisas metsä järvi sauna terve kiitos' },
    {
      label: 'Everyday',
      text: 'koira kissa talo auto kaupunki koulu kirja ruoka juoma',
    },
    {
      label: 'People',
      text: 'minä sinä hän se tämä ei ja mitä päivä',
    },
  ],
  fr: [
    {
      label: "Camus — L'Étranger",
      text: "Aujourd'hui, maman est morte. Ou peut-être hier, je ne sais pas.",
    },
    {
      label: 'Proust — Du côté de chez Swann',
      text: 'Longtemps, je me suis couché de bonne heure. Parfois, à peine ma bougie éteinte, mes yeux se fermaient si vite que je ne pouvais pas le temps de me dire.',
    },
    {
      label: 'Le Petit Prince',
      text: "On ne voit bien qu'avec le cœur. L'essentiel est invisible pour les yeux.",
    },
    {
      label: 'Crêpes recipe',
      text: 'Mélanger la farine et les œufs dans un grand saladier. Ajouter le lait petit à petit en remuant pour éviter les grumeaux.',
    },
    {
      label: 'At the bakery',
      text: "Je voudrais une baguette et deux croissants, s'il vous plaît",
    },
    {
      label: 'Les enfants',
      text: 'Les enfants jouent dans le jardin',
    },
  ],
  ja: [
    { label: 'Bashō — 古池', text: '古池 蛙 飛び込む 水 音' },
    {
      label: 'Seasons',
      text: '春 夏 秋 冬 花 桜 紅葉 山 川 海 空 風 雨 雪 月 星',
    },
    {
      label: 'Culture',
      text: '東京 日本 富士山 桜 着物 歌舞伎 相撲 侍 忍者',
    },
    {
      label: 'Daily life',
      text: '学校 先生 友達 家族 仕事 電車 駅 病院 銀行',
    },
    {
      label: 'Food',
      text: '寿司 ラーメン 抹茶 メニュー 弁当 味噌 醤油 豆腐',
    },
    { label: 'Feelings', text: '元気 猫 音楽 夢 記憶 孤独 沈黙' },
  ],
  ko: [
    {
      label: 'Greetings',
      text: '안녕하세요 감사합니다 사랑 한국 서울',
    },
    {
      label: 'Food',
      text: '김치찌개 비빔밥 불고기 된장찌개 삼겹살',
    },
    {
      label: 'Daily life',
      text: '학생 선생님 친구 음식 날씨 가족 학교 도서관 병원 시장',
    },
    {
      label: 'Culture',
      text: '한국 서울 사랑 음악 영화 드라마 노래',
    },
  ],
  nl: [
    {
      label: 'Anne Frank — Het Achterhuis',
      text: 'Ik hoop dat ik aan jou alles kan toevertrouwen, zoals ik het nog aan niemand heb kunnen, en ik hoop dat je een grote steun voor me zult zijn.',
    },
    {
      label: 'Culture',
      text: 'Ik graag fietsen langs windmolen kaas stroopwafel gezellig lekker mooi',
    },
    {
      label: 'Greeting',
      text: 'Goedemorgen, hoe het met je?',
    },
    {
      label: 'Nature',
      text: 'zon maan nacht dag jaar groot klein goed slecht',
    },
    {
      label: 'Weather',
      text: 'Het regent vandaag, je paraplu niet',
    },
  ],
  pt: [
    {
      label: 'Culture',
      text: 'música comida bonita oceano saudade português',
    },
    {
      label: 'Saudade',
      text: 'saudade sentimento difícil explicar coração amor vida paz',
    },
    {
      label: 'Places',
      text: 'olá obrigado amigo cidade casa escola',
    },
    { label: 'Nature', text: 'rio mar terra manhã' },
  ],
  zh: [
    {
      label: 'Confucius — 论语',
      text: '学 而 时 习 之 不 亦 说 乎',
    },
    {
      label: 'Nature',
      text: '山 水 风 雨 天 地 日 月 星 大 小 人 家',
    },
    {
      label: 'Daily life',
      text: '今天 天气 怎么样 我 想 吃 饺子 和 喝 茶 水',
    },
    {
      label: 'Greetings',
      text: '谢谢 再见 朋友 好 学生 长城 早上 晚上',
    },
    {
      label: 'Food',
      text: '吃 饺子 茶 水 米饭 面条 豆腐 火锅',
    },
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
