interface ForeignSample {
  label: string;
  text: string;
}

/**
 * Famous literature, speeches, and poetry for each supported language.
 * Used as example text on the /text page when a foreign language is selected.
 *
 * Each sample should be substantial (2-4 sentences or a full stanza).
 *
 * For CJK and agglutinative languages (ja, zh, ko, fi), text uses
 * space-separated base forms since the translator splits on whitespace
 * and the dictionaries only contain base/lemma forms.
 */
export const FOREIGN_SAMPLES: Record<string, ForeignSample[]> = {
  ar: [
    {
      label: 'One Thousand and One Nights (opening)',
      text: 'حكي أيها الملك السعيد أنه كان في قديم الزمان وسالف العصر والأوان ملك من ملوك صاحب جنود وحشم وخدم عظيم وكان له ابن شاب شجاع لا يقهر أسد من الأسود',
    },
    {
      label: 'Proverbs and wisdom',
      text: 'العلم نور والجهل ظلام من جد وجد ومن زرع حصد الصبر مفتاح الفرج كل إناء بما فيه ينضح',
    },
    {
      label: 'Nature and the heavens',
      text: 'قمر نجم شمس بحر نهر جبل صحراء سماء أرض ماء هواء نار ريح سحاب مطر ثلج رمل ليل نهار فجر غروب',
    },
  ],
  de: [
    {
      label: 'Kafka — Die Verwandlung',
      text: 'Als Gregor Samsa eines Morgens aus unruhigen Träumen erwachte, fand er sich in seinem Bett zu einem ungeheuren Ungeziefer verwandelt. Er lag auf seinem panzerartig harten Rücken und sah, wenn er den Kopf ein wenig hob, seinen gewölbten, braunen, von bogenförmigen Versteifungen geteilten Bauch, auf dessen Höhe sich die Bettdecke, zum gänzlichen Niedergleiten bereit, kaum noch erhalten konnte.',
    },
    {
      label: 'Goethe — Faust',
      text: 'Da steh ich nun, ich armer Tor, und bin so klug als wie zuvor. Heiße Magister, heiße Doktor gar, und ziehe schon an die zehen Jahr herauf, herab und quer und krumm meine Schüler an der Nase herum — und sehe, dass wir nichts wissen können. Das will mir schier das Herz verbrennen.',
    },
    {
      label: 'Rilke — Herbsttag',
      text: 'Herr: es ist Zeit. Der Sommer war sehr groß. Leg deinen Schatten auf die Sonnenuhren, und auf den Fluren lass die Winde los. Befiehl den letzten Früchten voll zu sein; gib ihnen noch zwei südlichere Tage, dränge sie zur Vollendung hin und jage die letzte Süße in den schweren Wein. Wer jetzt kein Haus hat, baut sich keines mehr. Wer jetzt allein ist, wird es lange bleiben, wird wachen, lesen, lange Briefe schreiben und wird in den Alleen hin und her unruhig wandern, wenn die Blätter treiben.',
    },
    {
      label: 'Grimm — Schneewittchen',
      text: 'Es war einmal mitten im Winter, und die Schneeflocken fielen wie Federn vom Himmel herab. Da saß eine Königin an einem Fenster, das einen Rahmen von schwarzem Ebenholz hatte, und nähte. Und wie sie so nähte und nach dem Schnee aufblickte, stach sie sich mit der Nadel in den Finger, und es fielen drei Tropfen Blut in den Schnee.',
    },
  ],
  es: [
    {
      label: 'Cervantes — Don Quijote',
      text: 'En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía un hidalgo de los de lanza en astillero, adarga antigua, rocín flaco y galgo corredor. Una olla de algo más vaca que carnero, salpicón las más noches, duelos y quebrantos los sábados, lentejas los viernes, algún palomino de añadidura los domingos, consumían las tres partes de su hacienda.',
    },
    {
      label: 'García Márquez — Cien años de soledad',
      text: 'Muchos años después, frente al pelotón de fusilamiento, el coronel Aureliano Buendía había de recordar aquella tarde remota en que su padre lo llevó a conocer el hielo. Macondo era entonces una aldea de veinte casas de barro y cañabrava construidas a la orilla de un río de aguas diáfanas que se precipitaban por un lecho de piedras pulidas, blancas y enormes como huevos prehistóricos.',
    },
    {
      label: 'Neruda — Poema 20',
      text: 'Puedo escribir los versos más tristes esta noche. Escribir, por ejemplo: la noche está estrellada, y tiritan, azules, los astros, a lo lejos. El viento de la noche gira en el cielo y canta. Puedo escribir los versos más tristes esta noche. Yo la quise, y a veces ella también me quiso.',
    },
    {
      label: 'Borges — El Aleph',
      text: 'La candente mañana de febrero en que Beatriz Viterbo murió, después de una imperiosa agonía que no se rebajó un solo instante ni al sentimentalismo ni al miedo, noté que las carteleras de fierro de la Plaza Constitución habían renovado no sé qué aviso de cigarrillos rubios; el hecho me dolió, pues comprendí que el incesante y vasto universo ya se apartaba de ella y que ese cambio era el primero de una serie infinita.',
    },
  ],
  fi: [
    {
      label: 'Suomi — Land of a thousand lakes',
      text: 'Suuri metsä kirkas järvi kaunis luonto talvi lumi kylmä revontulet taivas kuutamo hiljainen yö rauha ja hiljaisuus auringonlasku järvenranta tuuli vesi valo lämmin syvä puhdas rauhallinen maisema tunturimaisema',
    },
    {
      label: 'Seasons and weather',
      text: 'Kevät kukka aurinko kesä lämmin valo syksy tuuli lehti talvi lumi kylmä auringonnousu auringonlasku sateenkaari lumimyrsky ukkonen sade jää kuura pakkanen halla pilvi sumu usva kirkas poutainen',
    },
    {
      label: 'Kalevala themes — Poetry and wisdom',
      text: 'Vanha viisas mies laulaa runo suuri metsä kuunnella hiljainen tuuli rakkaus ja vapaus elämä toivo usko voima kauneus totuus ja oikeus laulu ja sana sydän ja sielu runous ja musiikki sinfonia harmonia melodia',
    },
    {
      label: 'Finnish nature and wildlife',
      text: 'Karhu ja susi metsä kettu ja jänis orava ja pöllö kotka taivas hirvi ja ilves ahma ja saukko lintu ja kala lohi ja hauki järvi ja joki meri ja saari niemi ja lahti kallio ja suo sammal ja jäkälä',
    },
  ],
  fr: [
    {
      label: "Camus — L'Étranger",
      text: "Aujourd'hui, maman est morte. Ou peut-être hier, je ne sais pas. J'ai reçu un télégramme de l'asile: Mère décédée. Enterrement demain. Sentiments distingués. Cela ne veut rien dire. C'était peut-être hier. L'asile de vieillards est à Marengo, à quatre-vingts kilomètres d'Alger. Je prendrai l'autobus à deux heures et j'arriverai dans l'après-midi.",
    },
    {
      label: 'Saint-Exupéry — Le Petit Prince',
      text: "Lorsque j'avais six ans j'ai vu, une fois, une magnifique image, dans un livre sur la Forêt Vierge qui s'appelait Histoires Vécues. Ça représentait un serpent boa qui avalait un fauve. J'ai alors beaucoup réfléchi sur les aventures de la jungle et, à mon tour, j'ai réussi, avec un crayon de couleur, à tracer mon premier dessin.",
    },
    {
      label: "Hugo — Demain, dès l'aube",
      text: "Demain, dès l'aube, à l'heure où blanchit la campagne, je partirai. Vois-tu, je sais que tu m'attends. J'irai par la forêt, j'irai par la montagne. Je ne puis demeurer loin de toi plus longtemps. Je marcherai les yeux fixés sur mes pensées, sans rien voir au dehors, sans entendre aucun bruit, seul, inconnu, le dos courbé, les mains croisées, triste, et le jour pour moi sera comme la nuit.",
    },
    {
      label: "Baudelaire — L'invitation au voyage",
      text: "Mon enfant, ma sœur, songe à la douceur d'aller là-bas vivre ensemble, aimer à loisir, aimer et mourir au pays qui te ressemble. Les soleils mouillés de ces ciels brouillés pour mon esprit ont les charmes si mystérieux de tes traîtres yeux, brillant à travers leurs larmes. Là, tout n'est qu'ordre et beauté, luxe, calme et volupté.",
    },
    {
      label: 'La Fontaine — Le Corbeau et le Renard',
      text: "Maître Corbeau, sur un arbre perché, tenait en son bec un fromage. Maître Renard, par l'odeur alléché, lui tint à peu près ce langage: Hé bonjour, Monsieur du Corbeau, que vous êtes joli, que vous me semblez beau. Sans mentir, si votre ramage se rapporte à votre plumage, vous êtes le Phénix des hôtes de ces bois.",
    },
    {
      label: 'De Gaulle — À tous les Français',
      text: "La France a perdu une bataille! Mais la France n'a pas perdu la guerre! Des gouvernants de rencontre ont pu capituler, cédant à la panique, oubliant l'honneur, livrant le pays à la servitude. Cependant, rien n'est perdu! Rien n'est perdu, parce que cette guerre est une guerre mondiale. Dans l'univers libre, des forces immenses n'ont pas encore donné. Un jour, ces forces écraseront l'ennemi. Il faut que la France, ce jour-là, soit présente à la victoire. Alors, elle retrouvera sa liberté et sa grandeur.",
    },
  ],
  ja: [
    {
      label: 'Kawabata — Snow Country',
      text: '国境 の 長い トンネル を 抜ける と 雪国 で あった 夜 の 底 が 白く なった 信号 所 汽車 座席 娘 窓 寒い 白い 暗い 遠い',
    },
    {
      label: 'Bashō — Haiku collection',
      text: '古池 蛙 飛び込む 水 音 夏 草 兵 夢 跡 岩 染み入る 蝉 声 旅 病 枯野 秋 深い 寂しい 古い 美しい',
    },
    {
      label: 'Japanese daily life and culture',
      text: '東京 日本 電車 駅 学校 先生 友達 家族 仕事 食べる 飲む 音楽 映画 本 猫 桜 富士山 着物 寿司 抹茶 温泉 神社 侍 忍者 歌舞伎 相撲 祭り 庭園 茶道 書道',
    },
    {
      label: 'Miyazawa Kenji — Night on the Galactic Railroad',
      text: '銀河 鉄道 夜 星 空 風 草 花 光 水 森 丘 町 窓 時計 少年 友 旅 夢 希望 永遠 宇宙 銀 河原 鳥 魚 十字 北 南 東 西',
    },
    {
      label: 'Nature and seasons',
      text: '春 夏 秋 冬 花 桜 紅葉 山 川 海 空 風 雨 雪 月 星 太陽 雲 虹 雷 霧 露 霜 氷 波 島 森 林 湖 滝',
    },
  ],
  ko: [
    {
      label: 'Poetry — Love, nature, and the cosmos',
      text: '사랑 하늘 별 꽃 바람 물 산 나무 달 밤 길 집 꿈 노래 빛 그림자 구름 강 바다 섬 새 나비 풀 이슬 안개 무지개 눈 비 천둥 번개',
    },
    {
      label: 'Nature — Four seasons of Korea',
      text: '봄 여름 가을 겨울 바다 강 산 꽃 나무 비 눈 바람 구름 하늘 태양 달 새벽 노을 안개 서리 이슬 무지개 천둥 번개 폭풍 햇살 달빛 불꽃',
    },
    {
      label: 'Korean culture and arts',
      text: '한국 음악 노래 춤 그림 시 소설 영화 드라마 역사 서울 전통 문화 예술 도자기 서예 판소리 사물놀이 한복 궁궐 사찰 절 고요 별자리',
    },
    {
      label: 'Emotions, philosophy, and life',
      text: '사랑 행복 슬픔 기쁨 희망 평화 자유 꿈 마음 생각 지혜 용기 인내 정의 진실 아름다움 영혼 운명 시간 기억 추억 그리움 외로움 고독 침묵 고요',
    },
  ],
  nl: [
    {
      label: 'Anne Frank — Het Achterhuis',
      text: 'Ik hoop dat ik aan jou alles kan toevertrouwen, zoals ik het nog aan niemand heb gekund, en ik hoop dat je een grote steun voor me zult zijn. Ik zal, hoop ik, aan jou alles kunnen toevertrouwen, zoals ik het nog aan niemand heb gekund, en ik hoop dat je een grote steun en troost voor mij zult zijn.',
    },
    {
      label: 'Multatuli — Max Havelaar',
      text: 'Ik ben makelaar in koffie, en woon op de Lauriergracht. Het is mijn gewoonte niet, romans te schrijven, of zulke dingen.',
    },
    {
      label: 'De reiziger — A journey through the Netherlands',
      text: 'De reiziger zat alleen in de trein naar het noorden van het land. Buiten het raam bewogen de velden langzaam voorbij, groen en vlak tot aan de horizon, met hier en daar een molen die draaide in de wind.',
    },
    {
      label: 'Proverb: East west, home best',
      text: 'Oost west thuis best',
    },
  ],
  pt: [
    {
      label: 'Pessoa — Tabacaria',
      text: 'Não sou nada. Nunca serei nada. Não posso querer ser nada. À parte isso, tenho em mim todos os sonhos do mundo.',
    },
    {
      label: 'Saudade — The untranslatable emotion',
      text: 'Saudade coração amor alma esperança tristeza alegria solidão silêncio suspiro lágrima abraço ternura paixão desejo devoção encanto lembrança harmonia sinfonia madrugada',
    },
    {
      label: 'Camões — Os Lusíadas themes',
      text: 'Armas barões assinalados lusitana ocidental mares navegados passaram além oceano horizonte tempestade estrela marinheiro capitão bandeira explorador descoberta conquista',
    },
    {
      label: 'Fado — Portuguese soul music',
      text: 'Fado guitarra canção poesia poeta escritor artista verdade beleza coragem mistério saudade coração aldeia praça catedral azulejo madrugada',
    },
    {
      label: 'Brazilian and Portuguese history',
      text: 'Guerra vitória batalha herói revolução nasceu morreu viveu cantou lutou sonhou começou azul negro dourado vermelho antigo profundo belo pequeno oceano horizonte',
    },
  ],
  zh: [
    {
      label: 'Li Bai — Quiet Night Thought & Drinking Alone',
      text: '床 前 明 月 光 疑 是 地 上 霜 举 头 望 明 月 低 头 思 故 乡 花 间 一 壶 酒 独 酌 无 相 亲 举 杯 邀 明 月 对 影 成 三 人',
    },
    {
      label: 'Confucius — Analects',
      text: '学 而 时 习 之 不 亦 说 乎 有 朋 自 远方 来 不 亦 乐 乎 人 不 知 而 不 愠 不 亦 君子 乎 三 人 行 必 有 我 师 焉 择 其 善 者 而 从 之 其 不 善 者 而 改 之',
    },
    {
      label: "Lu Xun — A Madman's Diary",
      text: '今天 晚上 很 好 的 月光 我 不 见 他 已 是 三 十 多 年 今天 见 了 精神 分 外 爽快 才 知道 以前 的 三 十 多 年 全 是 发昏',
    },
    {
      label: 'Du Fu — Spring View',
      text: '国 破 山 河 在 城 春 草 木 深 感 时 花 溅 泪 恨 别 鸟 惊 心 烽火 连 三 月 家 书 抵 万 金 白 头 搔 更 短 浑 欲 不 胜 簪',
    },
    {
      label: 'Proverb collection',
      text: '千 里 之 行 始 于 足 下 知 己 知 彼 百 战 百 胜 书 山 有 路 勤 为 径 学 海 无 涯 苦 作 舟 温 故 而 知 新 可 以 为 师 矣',
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
