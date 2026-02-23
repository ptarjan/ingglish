interface ForeignSample {
  label: string;
  text: string;
}

/**
 * Famous literature, speeches, and poetry for each supported language.
 * Used as example text on the /text page when a foreign language is selected.
 *
 * For CJK languages, text must be space-separated since the translator
 * splits on whitespace for dictionary lookup.
 */
const FOREIGN_SAMPLES: Record<string, ForeignSample[]> = {
  ar: [
    {
      label: 'One Thousand and One Nights (opening)',
      text: 'حكي أيها الملك السعيد أنه كان في قديم الزمان وسالف العصر والأوان ملك من ملوك صاحب جنود وحشم وخدم عظيم',
    },
    {
      label: 'Proverb: Knowledge is light',
      text: 'العلم نور والجهل ظلام',
    },
    {
      label: 'Nature and poetry',
      text: 'قمر نجم شمس بحر نهر جبل صحراء',
    },
  ],
  de: [
    {
      label: 'Kafka — Die Verwandlung',
      text: 'Als Gregor Samsa eines Morgens aus unruhigen Träumen erwachte, fand er sich in seinem Bett zu einem ungeheuren Ungeziefer verwandelt. Er lag auf seinem panzerartig harten Rücken und sah, wenn er den Kopf ein wenig hob, seinen gewölbten braunen Bauch.',
    },
    {
      label: 'Goethe — Faust',
      text: 'Da steh ich nun, ich armer Tor, und bin so klug als wie zuvor. Heiße Magister, heiße Doktor gar, und ziehe schon an die zehen Jahr herauf, herab und quer und krumm meine Schüler an der Nase herum.',
    },
    {
      label: 'Thomas Mann — Der Zauberberg',
      text: 'Ein einfacher junger Mensch reiste im Hochsommer von Hamburg, seiner Vaterstadt, nach Davos im Graubündner Hochgebirge. Er fuhr auf Besuch für drei Wochen.',
    },
    {
      label: 'Rilke — Briefe an einen jungen Dichter',
      text: 'Wer jetzt kein Haus hat, baut sich keines mehr. Wer jetzt allein ist, wird es lange bleiben, wird wachen, lesen, lange Briefe schreiben und wird in den Alleen hin und her unruhig wandern, wenn die Blätter treiben.',
    },
    {
      label: 'Grimm — Schneewittchen',
      text: 'Es war einmal mitten im Winter, und die Schneeflocken fielen wie Federn vom Himmel herab. Da saß eine Königin an einem Fenster, das einen Rahmen von schwarzem Ebenholz hatte, und nähte.',
    },
  ],
  es: [
    {
      label: 'Cervantes — Don Quijote',
      text: 'En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía un hidalgo de los de lanza en astillero, adarga antigua, rocín flaco y galgo corredor.',
    },
    {
      label: 'García Márquez — Cien años de soledad',
      text: 'Muchos años después, frente al pelotón de fusilamiento, el coronel Aureliano Buendía había de recordar aquella tarde remota en que su padre lo llevó a conocer el hielo.',
    },
    {
      label: 'Neruda — Poema 20',
      text: 'Puedo escribir los versos más tristes esta noche. Escribir, por ejemplo, que la noche es estrellada, y tiritan, azules, los astros, a lo lejos.',
    },
    {
      label: 'Borges — El Aleph',
      text: 'La candente mañana de febrero en que Beatriz Viterbo murió, después de una imperiosa agonía que no se rebajó un solo instante ni al sentimentalismo ni al miedo.',
    },
    {
      label: 'Isabel Allende — La casa de los espíritus',
      text: 'Barrabás llegó a la familia por vía marítima, anotó la niña Clara con su delicada caligrafía.',
    },
  ],
  fi: [
    {
      label: 'Suomi — Land of a thousand lakes',
      text: 'suuri metsä kirkas järvi kaunis luonto talvi lumi kylmä revontulet taivas kuutamo hiljainen yö rauha ja hiljaisuus',
    },
    {
      label: 'Seasons and weather',
      text: 'kevät kukka aurinko kesä lämmin valo syksy tuuli lehti talvi lumi kylmä',
    },
    {
      label: 'Kalevala themes — Poetry and wisdom',
      text: 'vanha viisas mies laulaa runo suuri metsä kuunnella hiljainen tuuli',
    },
    {
      label: 'Animals of Finland',
      text: 'karhu ja susi metsä kettu ja jänis orava ja pöllö kotka taivas',
    },
  ],
  fr: [
    {
      label: "Camus — L'Étranger",
      text: "Aujourd'hui, maman est morte. Ou peut-être hier, je ne sais pas. J'ai reçu un télégramme de l'asile: Mère décédée. Enterrement demain. Sentiments distingués. Cela ne veut rien dire.",
    },
    {
      label: 'Saint-Exupéry — Le Petit Prince',
      text: "Lorsque j'avais six ans j'ai vu, une fois, une magnifique image, dans un livre sur la Forêt Vierge qui s'appelait Histoires Vécues. On ne voit bien qu'avec le cœur. L'essentiel est invisible pour les yeux.",
    },
    {
      label: 'Proust — Du côté de chez Swann',
      text: "Longtemps, je me suis couché de bonne heure. Parfois, à peine ma bougie éteinte, mes yeux se fermaient si vite que je n'avais pas le temps de me dire: je m'endors.",
    },
    {
      label: 'Hugo — Les Misérables',
      text: "En mille huit cent quinze, Monsieur Charles-François-Bienvenu Myriel était évêque de Digne. C'était un vieillard d'environ soixante-quinze ans; il occupait le siège de Digne depuis mille huit cent six.",
    },
    {
      label: 'Flaubert — Madame Bovary',
      text: "Nous étions à l'étude, quand le proviseur entra, suivi d'un nouveau habillé en bourgeois et d'un garçon de classe qui portait un grand pupitre.",
    },
    {
      label: 'Voltaire — Candide',
      text: 'Il y avait en Westphalie, dans le château de monsieur le baron de Thunder-ten-tronckh, un jeune garçon à qui la nature avait donné les mœurs les plus douces.',
    },
  ],
  ja: [
    {
      label: 'Kawabata — Snow Country',
      text: '国境 の 長い トンネル を 抜ける と 雪国 で あった 夜 の 底 が 白く なった',
    },
    {
      label: 'Natsume Sōseki — Kokoro',
      text: '私 は その 人 を 常に 先生 と 呼んで いた 世間 は 普通 名 知って いる',
    },
    {
      label: 'Bashō — Haiku collection',
      text: '古池 蛙 飛び込む 水 音 夏 草 兵 夢 跡 静かさ 岩 染み入る 蝉 声',
    },
    {
      label: 'Murakami-style daily life',
      text: '東京 日本 電車 駅 学校 先生 友達 家族 仕事 食べる 飲む 音楽 映画 本 猫',
    },
    {
      label: 'Miyazawa Kenji — Night on the Galactic Railroad',
      text: '銀河 鉄道 夜 星 空 風 草 花 光 水 森 丘 町 窓 時計',
    },
  ],
  ko: [
    {
      label: 'Poetry — Love and nature',
      text: '사랑 하늘 별 꽃 바람 물 산 나무 달 밤 길 집 꿈 노래 빛',
    },
    {
      label: 'Nature and seasons',
      text: '봄 여름 가을 겨울 바다 강 산 꽃 나무 비 눈 바람 구름 하늘',
    },
    {
      label: 'Korean culture',
      text: '한국 음악 노래 춤 그림 시 소설 영화 드라마 역사',
    },
    {
      label: 'Emotions and feelings',
      text: '사랑 행복 슬픔 기쁨 희망 평화 자유 꿈 마음 생각',
    },
  ],
  nl: [
    {
      label: 'Anne Frank — Het Achterhuis',
      text: 'Ik hoop dat ik aan jou alles kan toevertrouwen, zoals ik het nog aan niemand heb gekund, en ik hoop dat je een grote steun voor me zult zijn.',
    },
    {
      label: 'Multatuli — Max Havelaar',
      text: 'Ik ben makelaar in koffie, en woon op de Lauriergracht.',
    },
    {
      label: 'De reiziger — A journey',
      text: 'De reiziger zat alleen in de trein naar het noorden van het land.',
    },
    {
      label: 'Proverb: East west, home best',
      text: 'Oost west thuis best',
    },
  ],
  pt: [
    {
      label: 'Pessoa — Tabacaria',
      text: 'Não sou nada. Nunca serei nada. Não posso querer ser nada.',
    },
    {
      label: 'Saudade — The untranslatable emotion',
      text: 'saudade coração amor alma esperança tristeza alegria solidão silêncio suspiro lágrima abraço',
    },
    {
      label: 'Camões — Os Lusíadas themes',
      text: 'armas barões assinalados lusitana ocidental mares navegados passaram além',
    },
    {
      label: 'Fado — Portuguese soul music',
      text: 'fado guitarra canção poesia poeta escritor artista verdade beleza coragem mistério',
    },
    {
      label: 'Age of Discovery',
      text: 'oceano horizonte tempestade estrela marinheiro capitão bandeira explorador descoberta conquista',
    },
  ],
  zh: [
    {
      label: 'Li Bai — Quiet Night Thought',
      text: '床 前 明 月 光 疑 是 地 上 霜 举 头 望 明 月 低 头 思 故 乡',
    },
    {
      label: 'Confucius — Analects',
      text: '学 而 时 习 之 不 亦 说 乎 有 朋 自 远方 来 不 亦 乐 乎 人 不 知 而 不 愠 不 亦 君子 乎',
    },
    {
      label: "Lu Xun — A Madman's Diary",
      text: '今天 晚上 很 好 的 月光 我 不 见 他 已 是 三十 多 年 今天 见 了 精神 分外 爽快',
    },
    {
      label: 'Du Fu — Spring View',
      text: '国 破 山 河 在 城 春 草 木 深 感 时 花 溅 泪 恨 别 鸟 惊 心',
    },
    {
      label: 'Proverb collection',
      text: '千 里 之 行 始 于 足 下 知 己 知 彼 百 战 百 胜 书 山 有 路',
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
