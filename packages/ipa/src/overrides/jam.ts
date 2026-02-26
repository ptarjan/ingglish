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
  ago: '/aɡoʊ/', // future marker
  all: '/ɔːl/',
  an: '/an/',
  and: '/an/',
  back: '/bak/',
  basket: '/baskɪt/',
  basketful: '/baskɪtfʊl/',
  Be: '/biː/',
  be: '/biː/',
  belly: '/bɛlɪ/',
  better: '/bɛta/',
  bickle: '/bɪkl/', // victuals/food
  bifuo: '/bɪfoː/', // before
  boun: '/baʊn/', // bound (cluster reduction)
  bout: '/baʊt/',
  bright: '/braɪt/',
  burs: '/bʌɹs/', // burst (reduced)
  bush: '/bʊʃ/',
  but: '/bʌt/',
  bwile: '/bwaɪl/', // boil
  bwoy: '/bwaɪ/', // boy
  by: '/baɪ/',
  cause: '/kɔːz/',
  Chicken: '/tʃɪkɪn/',
  chicken: '/tʃɪkɪn/',
  coco: '/koʊkoʊ/', // cocoyam
  colonizin: '/kalɑnaɪzɪn/', // colonizing
  come: '/kʌm/',
  country: '/kʌntɹɪ/',
  cut: '/kʌt/',
  dah: '/da/', // that (demonstrative)
  dan: '/dan/', // than (TH-stopping)
  deh: '/de/', // there
  di: '/dɪ/',

  Di: '/dɪ/',
  did: '/dɪd/',
  doah: '/doʊ/', // though (TH-stopping)
  drop: '/dɹɑp/',
  dung: '/dʌŋ/', // down
  Duppy: '/dʌpɪ/', // ghost/spirit
  duppy: '/dʌpɪ/',
  dutty: '/dʌtɪ/', // dirty
  Englan: '/ɪŋlan/', // England (cluster reduction)
  Every: '/ɛvɹɪ/',
  every: '/ɛvɹɪ/',
  evriting: '/ɛvɹɪtɪŋ/', // everything
  fall: '/fɔːl/',
  fe: '/fɪ/', // for (variant spelling)
  feel: '/fiːl/',
  fi: '/fɪ/', // for/to (JC function word)
  flood: '/flʌd/',
  fram: '/fɹam/', // from (JC standard spelling)
  frighten: '/fraɪtn/',
  fro: '/fɹa/', // from (reduced)
  from: '/fɹɑm/',
  full: '/fʊl/',
  Gad: '/ɡad/', // God
  glad: '/ɡlad/',
  go: '/ɡoʊ/',
  goat: '/ɡoʊt/',
  grung: '/ɡɹʌŋ/', // ground
  gwine: '/ɡwaɪn/', // going to
  ha: '/ha/', // have
  hard: '/hɑːd/', // JC: sometimes h-dropped, keeping h for readability
  hawk: '/hɔːk/',
  heart: '/hɑːt/', // JC: sometimes h-dropped, keeping h for readability
  him: '/ɪm/', // h-dropping
  hoe: '/hoʊ/',
  how: '/haʊ/',
  hundred: '/ʌndɹɛd/',
  I: '/aɪ/',
  in: '/ɪn/',

  is: '/ɪz/',
  it: '/ɪt/',
  Jamaica: '/dʒəmeɪka/',
  joyful: '/dʒɔɪfʊl/',
  kaaz: '/kɔːz/', // cause
  know: '/noʊ/',
  kom: '/kʌm/',
  lawd: '/lɔːd/', // lord
  let: '/lɛt/',
  like: '/laɪk/',
  load: '/loʊd/',
  Matarafak: '/mataɹafak/', // matter of fact
  Mattie: '/matɪ/',
  me: '/miː/',
  // ===== Louise Bennett - No Lickle Twang =====
  Me: '/miː/',
  mean: '/miːn/',
  mek: '/mɛk/',
  Merica: '/mɛɹɪka/', // America
  merry: '/mɛɹɪ/',

  mikkle: '/mɪkl/', // little bit (mickle)
  Miss: '/mɪs/',
  mont: '/mɑnt/', // month (cluster reduction)
  mukkle: '/mʌkl/', // big amount (muckle)
  nanny: '/nanɪ/', // nanny goat
  near: '/nɪə/',
  news: '/njuːz/',
  no: '/noʊ/',
  not: '/nɑt/',
  nuff: '/nʌf/', // enough
  nuh: '/nʌ/', // not/don't
  // ===== Jamaican Proverbs =====
  One: '/wan/',
  one: '/wan/',
  people: '/piːpl/',
  petater: '/pɪteɪta/', // potato
  piece: '/piːs/',
  plane: '/pleɪn/',
  pot: '/pat/', // JC open vowel
  proudness: '/praʊdnɛs/',

  quattiewut: '/kwatɪwʌt/', // four-pence worth
  rain: '/reɪn/',
  Reverse: '/ɹɪvɜːs/',
  river: '/ɹɪva/',
  run: '/ɹʌn/',
  say: '/seɪ/',
  scarce: '/skɛːs/',
  see: '/siː/',
  set: '/sɛt/',
  shame: '/ʃeɪm/',
  shine: '/ʃaɪn/',
  'ship-load': '/ʃɪploʊd/',
  six: '/sɪks/',
  so: '/soʊ/',
  spen: '/spɛn/', // spend (cluster reduction)
  stick: '/stɪk/',
  // ===== Louise Bennett - Dutty Tough =====
  Sun: '/sʌn/',
  sweet: '/swiːt/',
  taim: '/taɪm/',

  "tas'e": '/teɪs/', // taste (cluster reduction)
  the: '/dɪ/', // TH-stopping
  them: '/dɛm/', // TH-stopping
  tiff: '/tɪf/', // stiff (cluster reduction)
  till: '/tɪl/',
  tings: '/tɪŋz/', // things (TH-stopping)
  tough: '/tʌf/',
  tousan: '/taʊzn/', // thousand (TH-stop, cluster reduction)
  town: '/taʊn/',
  Trouble: '/tɹʌbl/',
  trouble: '/tɹʌbl/',
  Wah: '/wa/', // what
  wah: '/wa/',
  wan: '/wan/',
  want: '/want/',
  // ===== Louise Bennett - Colonization in Reverse =====
  Wat: '/wat/',
  wat: '/wat/',
  water: '/wɔːta/', // JC open vowel
  we: '/wiː/',
  weh: '/we/', // where (cluster reduction)
  // ===== Di Jamiekan Nyuu Testiment - Jan 1:1-5 =====
  Wen: '/wɛn/',
  wen: '/wɛn/',
  who: '/huː/',
  whole: '/hoʊl/',
  wid: '/wɪd/',
  Wod: '/wɑd/',
  wod: '/wɑd/',
  worl: '/wɜːl/', // world (cluster reduction)
  wuk: '/wʌk/', // work
  yawl: '/jɔːl/', // you all
  // ===== Claude McKay - Quashie to Buccra =====
  You: '/juː/',
  you: '/juː/',
  yuh: '/jʌ/', // you
  Yuh: '/jʌ/',
};
