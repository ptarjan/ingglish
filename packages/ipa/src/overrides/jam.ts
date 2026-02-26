/**
 * Word-level IPA overrides for Jamaican Creole (jam).
 *
 * The IPA dictionary uses Cassidy-JLU standard orthography (e.g. "bwai",
 * "piipl"), but the literary texts (Louise Bennett, Claude McKay, Jamaican
 * Bible) use traditional English-influenced spellings. These overrides map
 * the literary spellings to JC pronunciation.
 *
 * IPA values are chosen to produce natural-sounding Ingglish output via
 * the IPA -> ARPAbet -> Ingglish pipeline. JC phonological features:
 * - TH-stopping: /ð/ -> /d/, /θ/ -> /t/
 * - H-dropping in some positions
 * - Final consonant cluster reduction
 * - Distinctive vowel system (FACE = /ɪɛ/, GOAT = /uɔ/)
 */
export const jam: Record<string, string> = {
  a: '/a/', // JC preposition/copula
  // ===== LKJ - Di Great Insohreckshan =====
  about: '/əbaʊt/',
  // ===== Linstead Market =====
  ackee: '/akiː/',
  af: '/ɑːf/', // of
  // ===== Louise Bennett - Back to Africa =====
  Africa: '/afɾɪka/',
  African: '/afɾɪkan/',
  ago: '/aɡoʊ/', // future marker
  // ===== Louise Bennett - Bans a Killin =====
  Ah: '/ɑː/',
  all: '/ɔːl/',
  // ===== Mikey Smith - Mi Cyaan Believe It =====
  also: '/ɔːlsoʊ/',
  an: '/an/',
  and: '/an/',
  // ===== LKJ - Inglan Is a Bitch =====
  andahgroun: '/ʌndaɡɾaʊn/', // underground
  // ===== Annancy folk tale =====
  Annancy: '/anansiː/',
  apply: '/əplaɪ/',
  april: '/eɪpɾɪl/',
  are: '/ɑː/',
  around: '/əɾaʊnd/',
  as: '/az/',
  av: '/av/', // have
  // ===== LKJ - Sonny's Lettah =====
  Avenue: '/avɛnjuː/',
  babylan: '/babɪlan/', // Babylon
  back: '/bak/',
  // ===== Day-O =====
  banana: '/bənana/',
  basket: '/baskɪt/',
  basketful: '/baskɪtfʊl/',
  Be: '/biː/',
  be: '/biː/',
  // ===== Jean Binta Breeze - Riddym Ravings =====
  bed: '/bɛd/',
  before: '/bɪfɔː/',
  believe: '/bɪliːv/',
  Bellevue: '/bɛlvjuː/',
  belly: '/bɛlɪ/',
  bes: '/bɛs/', // best
  better: '/bɛta/',

  bickle: '/bɪkl/', // victuals/food
  bifuo: '/bɪfoː/', // before
  big: '/bɪɡ/',
  bitch: '/bɪtʃ/',
  bite: '/baɪt/',
  blue: '/bluː/',
  boun: '/baʊn/', // bound (cluster reduction)
  bout: '/baʊt/',
  bright: '/braɪt/',
  bring: '/bɾɪŋ/',
  Brixtan: '/bɾɪkstan/', // Brixton
  "Bro'er": '/bɾʌdɑː/', // brother
  burs: '/bʌɹs/', // burst (reduced)
  bush: '/bʊʃ/',
  but: '/bʌt/',
  bwile: '/bwaɪl/', // boil
  bwoy: '/bwaɪ/', // boy
  by: '/baɪ/',
  cancer: '/kansə/',
  care: '/kɛː/',
  Carry: '/kaɾɪ/',
  cause: '/kɔːz/',
  Charlie: '/tʃɑːlɪ/',
  Chicken: '/tʃɪkɪn/',
  chicken: '/tʃɪkɪn/',
  cockroach: '/kakɾoʊtʃ/',
  coco: '/koʊkoʊ/', // cocoyam
  colonizin: '/kalɑnaɪzɪn/', // colonizing
  come: '/kʌm/',
  country: '/kʌntɹɪ/',
  // ===== Mutabaruka - Dis Poem =====
  cryin: '/kɾaɪɪn/',
  cut: '/kʌt/',
  cyaan: '/kjɑːn/', // can't
  dactar: '/dakta/', // doctor
  dah: '/da/', // that (demonstrative)
  dan: '/dan/', // than (TH-stopping)
  Day: '/deɪ/',
  day: '/deɪ/',

  Dear: '/dɪə/',
  deh: '/de/', // there
  deh: '/de/',
  "dere's": '/dɛɾz/', // there's
  deze: '/diːz/', // these
  di: '/dɪ/',
  Di: '/dɪ/',
  dialec: '/daɪalɛk/', // dialect
  did: '/dɪd/',
  doah: '/doʊ/', // though (TH-stopping)
  doan: '/doʊn/', // don't
  "don't": '/doʊnt/',
  doun: '/daʊn/', // down
  drop: '/dɹɑp/',
  drownded: '/dɾaʊndɪd/',
  dung: '/dʌŋ/', // down
  Duppy: '/dʌpɪ/', // ghost/spirit
  duppy: '/dʌpɪ/',
  dutty: '/dʌtɪ/', // dirty

  eighty: '/eɪtɪ/',
  Englan: '/ɪŋlan/', // England (cluster reduction)
  English: '/ɪŋɡlɪʃ/',
  Englishman: '/ɪŋɡlɪʃman/',
  escapin: '/ɪskeɪpɪn/',
  Every: '/ɛvɹɪ/',
  every: '/ɛvɹɪ/',
  // ===== Di Jamiekan Bible - Matthew =====
  evn: '/ɛvn/', // heaven
  evriting: '/ɛvɹɪtɪŋ/', // everything
  fall: '/fɔːl/',
  fat: '/fat/',
  fe: '/fɪ/', // for (variant spelling)
  feel: '/fiːl/',
  few: '/fjuː/',
  fi: '/fɪ/', // for/to (JC function word)
  find: '/faɪnd/',
  flood: '/flʌd/',
  for: '/fɔː/',
  fram: '/fɹam/', // from (JC standard spelling)

  frickshan: '/fɾɪkʃan/',
  frighten: '/fraɪtn/',
  fro: '/fɹa/', // from (reduced)
  from: '/fɹɑm/',
  full: '/fʊl/',
  fus: '/fʌs/', // first
  Gad: '/ɡad/', // God
  get: '/ɡɛt/',
  ghetto: '/ɡɛtoʊ/',
  gi: '/ɡɪ/', // give
  glad: '/ɡlad/',
  go: '/ɡoʊ/',
  goat: '/ɡoʊt/',
  Good: '/ɡʊd/',
  Granma: '/ɡɾanma/',
  Granpa: '/ɡɾanpa/',
  great: '/ɡɾeɪt/',
  grung: '/ɡɹʌŋ/', // ground
  gwine: '/ɡwaɪn/', // going to

  ha: '/ha/', // have
  haf: '/haf/', // have
  halt: '/hɔːlt/',
  hard: '/hɑːd/', // JC: sometimes h-dropped, keeping h for readability
  hawk: '/hɔːk/',
  head: '/hɛd/',
  heap: '/hiːp/',
  hear: '/hɪə/',
  heart: '/hɑːt/', // JC: sometimes h-dropped, keeping h for readability
  helt: '/hɛlt/',
  here: '/hɪə/',
  him: '/ɪm/', // h-dropping
  histarical: '/ɪstaɾɪkal/',
  hoe: '/hoʊ/',
  hole: '/hoʊl/',
  home: '/hoʊm/',
  hope: '/hoʊp/',
  how: '/haʊ/',
  hundred: '/ʌndɹɛd/',
  I: '/aɪ/',
  if: '/ɪf/',
  iina: '/iːna/', // in
  in: '/ɪn/',
  Inglan: '/ɪŋlan/',
  inna: '/ɪna/', // in (JC)
  insohreckshan: '/ɪnsoɾɛkʃan/',
  is: '/ɪz/',
  it: '/ɪt/',
  Jamaica: '/dʒəmeɪka/',
  Jebb: '/dʒɛb/',
  Jiizas: '/dʒiːzas/', // Jesus
  Jim: '/dʒɪm/',
  jos: '/dʒɔs/', // just
  joyful: '/dʒɔɪfʊl/',
  jus: '/dʒʌs/', // just
  kaaz: '/kɔːz/', // cause
  kar: '/kɑː/', // carry
  kill: '/kɪl/',
  know: '/noʊ/',
  kom: '/kʌm/',
  kroud: '/kɾaʊd/', // crowd
  lawd: '/lɔːd/', // lord
  let: '/lɛt/',
  light: '/laɪt/',
  like: '/laɪk/',
  likkle: '/lɪkl/', // little
  lines: '/laɪnz/',
  Linstead: '/lɪnstɛd/',
  load: '/loʊd/',
  look: '/lʊk/',
  lord: '/lɔːd/',
  Mama: '/mama/',
  Market: '/mɑːkɪt/',
  Matarafak: '/mataɹafak/', // matter of fact
  Mattie: '/matɪ/',
  may: '/meɪ/',
  me: '/miː/',
  // ===== Louise Bennett - No Lickle Twang =====
  Me: '/miː/',
  mean: '/miːn/',
  Meck: '/mɛk/',
  mek: '/mɛk/',
  Merica: '/mɛɹɪka/', // America
  merry: '/mɛɹɪ/',
  mikkle: '/mɪkl/', // little bit (mickle)
  Miss: '/mɪs/',
  Missa: '/mɪsa/', // mister
  mont: '/mɑnt/', // month (cluster reduction)
  mothers: '/mʌdaz/',
  mukkle: '/mʌkl/', // big amount (muckle)
  naeshan: '/neɪʃan/', // nation
  nanny: '/nanɪ/', // nanny goat
  near: '/nɪə/',
  new: '/njuː/',
  news: '/njuːz/',
  night: '/naɪt/',
  niid: '/niːd/', // need
  nineteen: '/naɪntiːn/',
  no: '/noʊ/',
  nobady: '/noʊbadɪ/', // nobody
  not: '/nɑt/',
  nothin: '/nʌtɪn/',
  nuff: '/nʌf/', // enough
  nuh: '/nʌ/', // not/don't
  oat: '/oʊt/',
  occayshan: '/ɔkeɪʃan/',
  of: '/ɑːv/',
  oh: '/oʊ/',
  // ===== Jamaican Proverbs =====
  One: '/wan/',
  one: '/wan/',
  operate: '/ɑpəɾeɪt/',
  or: '/ɔː/',
  out: '/aʊt/',
  outa: '/aʊta/', // out of
  owevah: '/oʊvɑː/', // over
  pan: '/pan/', // upon
  people: '/piːpl/',
  petater: '/pɪteɪta/', // potato
  piece: '/piːs/',
  plane: '/pleɪn/',
  poem: '/poʊɛm/',
  pot: '/pat/', // JC open vowel
  Prison: '/pɾɪzn/',
  proudness: '/praʊdnɛs/',
  quattie: '/kwatɪ/', // quarter penny
  quattiewut: '/kwatɪwʌt/', // four-pence worth
  quite: '/kwaɪt/',
  radio: '/ɾeɪdɪoʊ/',
  rain: '/reɪn/',
  rat: '/ɾat/',
  reach: '/ɾiːtʃ/',
  really: '/ɾɪəlɪ/',
  rent: '/ɾɛnt/',
  Reverse: '/ɹɪvɜːs/',
  river: '/ɹɪva/',
  Room: '/ɾuːm/',
  run: '/ɹʌn/',
  runnin: '/ɾʌnɪn/',
  said: '/sɛd/',
  salim: '/salɪm/', // solemn
  Saturday: '/satədeɪ/',
  say: '/seɪ/',
  scarce: '/skɛːs/',
  scorpion: '/skɔːpɪən/',
  sea: '/siː/',
  see: '/siː/',
  seh: '/se/', // say
  seize: '/siːz/',
  sell: '/sɛl/',
  set: '/sɛt/',
  shall: '/ʃal/',
  shame: '/ʃeɪm/',
  shine: '/ʃaɪn/',
  'ship-load': '/ʃɪploʊd/',
  ships: '/ʃɪps/',
  shores: '/ʃɔːz/',
  six: '/sɪks/',
  so: '/soʊ/',
  somewhe: '/sʌmwe/', // somewhere
  'south-west': '/saʊtwɛst/',
  speak: '/spiːk/',
  spen: '/spɛn/', // spend (cluster reduction)
  spread: '/spɾɛd/',
  stick: '/stɪk/',
  straight: '/stɾeɪt/',
  such: '/sʌtʃ/',
  // ===== Louise Bennett - Dutty Tough =====
  Sun: '/sʌn/',
  swallowed: '/swɑloʊd/',
  sweet: '/swiːt/',
  taim: '/taɪm/',
  take: '/teɪk/',
  talk: '/tɔːk/',
  tally: '/talɪ/',
  "tas'e": '/teɪs/', // taste (cluster reduction)
  teck: '/tɛk/', // take
  tell: '/tɛl/',
  that: '/dat/', // TH-stopping
  the: '/dɪ/', // TH-stopping
  their: '/dɛː/', // TH-stopping
  them: '/dɛm/', // TH-stopping
  these: '/diːz/',
  they: '/deɪ/', // TH-stopping
  tiff: '/tɪf/', // stiff (cluster reduction)
  Tiger: '/taɪɡɑː/',
  till: '/tɪl/',
  time: '/taɪm/',
  tings: '/tɪŋz/', // things (TH-stopping)
  to: '/tuː/',
  tough: '/tʌf/',
  tousan: '/taʊzn/', // thousand (TH-stop, cluster reduction)
  town: '/taʊn/',
  troo: '/tɾuː/', // through
  Trouble: '/tɹʌbl/',
  trouble: '/tɹʌbl/',
  truly: '/tɾuːlɪ/',
  try: '/tɾaɪ/',
  two: '/tuː/',
  undefined: '/ʌndɪfaɪnd/',
  understan: '/ʌndəɾstan/', // understand
  unlimited: '/ʌnlɪmɪtɪd/',
  up: '/ʌp/',
  use: '/juːz/',
  "W'en": '/wɛn/',
  waahn: '/wɔːn/', // want
  Wah: '/wa/', // what
  wah: '/wa/',
  wan: '/wan/',
  want: '/want/',
  wash: '/wɑʃ/',
  washed: '/wɑʃt/',
  // ===== Louise Bennett - Colonization in Reverse =====
  Wat: '/wat/',
  wat: '/wat/',
  water: '/wɔːta/', // JC open vowel
  way: '/weɪ/',
  we: '/wiː/',
  weh: '/we/', // where (cluster reduction)
  // ===== Di Jamiekan Nyuu Testiment - Jan 1:1-5 =====
  Wen: '/wɛn/',
  wen: '/wɛn/',
  wha: '/wa/', // what
  what: '/wɑt/',
  whey: '/weɪ/',
  who: '/huː/',
  whole: '/hoʊl/',
  wid: '/wɪd/',
  widin: '/wɪdɪn/', // within
  with: '/wɪd/', // TH-stopping
  Wod: '/wɑd/',
  wod: '/wɑd/',
  work: '/wɜːk/',
  workin: '/wɜːkɪn/',
  worl: '/wɜːl/', // world (cluster reduction)
  worth: '/wɜːt/',
  woz: '/wɔz/', // was
  wretched: '/ɾɛtʃɪd/',
  wuk: '/wʌk/', // work
  "y'u": '/juː/',
  yawl: '/jɔːl/', // you all
  // ===== Claude McKay - Quashie to Buccra =====
  You: '/juː/',
  you: '/juː/',
  young: '/jʌŋ/',
  your: '/jɔː/',
  yuh: '/jʌ/', // you
  Yuh: '/jʌ/',
};
