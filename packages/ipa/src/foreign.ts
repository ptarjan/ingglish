import { applyCasePattern, detectCasePattern, stripDiacritics } from '@ingglish/normalize';
import {
  arpabetToFormat,
  arpabetToIngglish,
  getFormatPreservesCase,
  getStress,
  isVowel,
} from '@ingglish/phonemes';
import type { OutputFormat } from '@ingglish/phonemes';
import { ipaToArpabet } from './from-ipa';
import { IPA_LANGUAGE_OVERRIDES } from './ipa-maps';

// Pre-compiled regexes (avoid per-call RegExp object creation)
const IPA_SLASH_RE = /^\/|\/$/g;
const WHITESPACE_SPLIT_RE = /(\s+)/;
const WHITESPACE_RE = /^\s+$/;
const LEADING_NON_LETTER_RE = /^\P{L}/u;
const TRAILING_NON_LETTER_RE = /\P{L}$/u;
const CONTRACTION_SPLIT_RE = /(?<=['-])|(?=['-])/;

export type IpaDict = Record<string, string>;

export interface Language {
  code: string;
  label: string;
}

export const LANGUAGES: Language[] = [
  { code: 'ar', label: 'Arabic' },
  { code: 'de', label: 'German' },
  { code: 'es', label: 'Spanish' },
  { code: 'fi', label: 'Finnish' },
  { code: 'fr', label: 'French' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'nl', label: 'Dutch' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'zh', label: 'Mandarin' },
];

/**
 * Word-level IPA overrides per language.
 *
 * Some IPA dictionary entries are incorrect or represent a different
 * word form. These overrides take priority over the dictionary.
 */
// TODO: split into per-language override files (e.g. overrides/ar.ts, overrides/de.ts, etc.)
const IPA_WORD_OVERRIDES: Record<string, Record<string, string>> = {
  ar: {
    أحرارا: '/ʔaħˈraːran/',
    أسخيليوس: '/ʔasxiːˈliːjuːs/', // Aeschylus
    أمهات: '/umːaˈhaːt/',
    أنسيت: '/ʔunˈsiːt/',
    أنعمت: '/ʔanˈʕamta/',
    أورفليس: '/ʔurˈfaliːs/', // Orphalese (Gibran)
    أيديهم: '/ʔajˈdiːhim/',
    استيقظت: '/istajˈqaðˤtu/',
    الأليفة: '/alʔaˈliːfah/',
    الحياة: '/alħaˈjaːh/',
    الخليفة: '/alxaˈliːfah/',
    الذكريات: '/aðːikraˈjaːt/',
    السماوات: '/asːamaːˈwaːt/',
    الضالين: '/adˤːaːˈliːn/',
    العالمين: '/alʕaːlaˈmiːn/',
    الغربة: '/alˈɣurbah/',
    الغزاة: '/alɣuˈzaːh/',
    الكرامة: '/alkaˈraːmah/',
    اللوى: '/alˈliwaː/',
    المصطفى: '/almusˈtˤafaː/',
    امرأة: '/imˈraʔah/',
    اهدنا: '/ihˈdinaː/',
    بإذنه: '/biʔiðˈnihi/',
    بداية: '/biˈdaːjah/',
    بشيء: '/biˈʃajʔ/',
    بعضا: '/ˈbaʕdˤan/',
    بعضهم: '/baʕˈdˤuhum/',
    بعينه: '/biˈʕajnihi/',
    بعينيها: '/biʕajˈnajhaː/',
    بيدبا: '/bajdaˈbaː/', // Bidpai
    تأخذه: '/taʔˈxuðuhu/',
    تسقني: '/tasˈqiniː/',
    تعلمت: '/taʕalːˈamtu/',
    تقفن: '/taqifˈna/',
    جلست: '/dʒaˈlasat/',
    حارتنا: '/ħaːˈratnaː/',
    حفظهما: '/ħifˈðˤahumaː/',
    حكاية: '/ħiˈkaːjah/',
    حياته: '/ħaˈjaːtahu/',
    خفيفا: '/xaˈfiːfan/',
    خلالها: '/xiˈlaːlahaː/',
    خلفهم: '/xalˈfahum/',
    خمرا: '/ˈxamran/',
    دبشليم: '/dabʃaˈliːm/', // King Dabshelim
    رائحة: '/ˈraːʔiħah/',
    رافعا: '/ˈraːfiʕan/',
    رسمها: '/rasˈmuhaː/',
    رياحك: '/riˈjaːħaka/',
    زعموا: '/zaˈʕamuː/',
    زمانه: '/zaˈmaːnihi/',
    سادتي: '/saːˈdatiː/',
    سبعة: '/ˈsabʕah/',
    ستحمله: '/sataħˈmiluhu/',
    سفينته: '/saˈfiːnatuhu/',
    سكرة: '/ˈsakrah/',
    سنة: '/ˈsanah/',
    سنين: '/siˈniːn/',
    شيئا: '/ˈʃajʔan/',
    صغارها: '/sˤiˈɣaːruhaː/',
    طالعا: '/ˈtˤaːliʕan/',
    طويلة: '/tˤaˈwiːlah/',
    عاما: '/ˈʕaːman/',
    عجيبة: '/ʕaˈdʒiːbah/',
    عدت: '/ˈʕudtu/',
    عصره: '/ˈʕasˤrihi/',
    علمه: '/ˈʕilmihi/',
    عليك: '/ʕaˈlajka/',
    عليهم: '/ʕaˈlajhim/',
    عنده: '/ˈʕindahu/',
    غيبة: '/ˈɣajbah/',
    فإن: '/faˈʔin/',
    فاسقني: '/fasˈqiniː/',
    فاغتنمها: '/faɣˈtanimhaː/',
    فالمقراة: '/falˈmiqraːh/',
    فجرا: '/ˈfadʒran/',
    فحومل: '/faˈħawmal/',
    فما: '/faˈmaː/',
    فيه: '/fiːhi/',
    فيها: '/ˈfiːhaː/',
    قالت: '/ˈqaːlat/',
    قصة: '/ˈqisˤːah/',
    كتابات: '/kitaːˈbaːt/',
    كرسيه: '/kurˈsijːuhu/',
    لوهلة: '/liˈwahlah/',
    مبنية: '/mabˈnijːah/',
    متقطعا: '/mutaqatˤˈtˤiʕan/',
    مدينة: '/maˈdiːnah/',
    مهيار: '/mahˈjaːr/', // Mahyar (Adonis)
    ميلاده: '/miːˈlaːdihi/',
    نسجتها: '/nasaˈdʒathaː/',
    نوما: '/ˈnawman/',
    هادما: '/ˈhaːdiman/',
    هوذا: '/haːˈðaː/',
    وإنما: '/waʔinːaˈmaː/',
    وإياك: '/waʔijˈjaːka/',
    والسنة: '/wasːˈanah/',
    والمحبة: '/walmaˈħabːah/',
    وحكايات: '/waħikaːˈjaːt/',
    وشمأل: '/waʃaˈmaʔl/',
    وضعه: '/ˈwadˤʕihi/',
    وعليهم: '/waʕaˈlajhim/',
    وغاب: '/waˈɣaːb/',
    وفطنة: '/waˈfitˤnah/',
    وما: '/waˈmaː/',
    ومتساوين: '/wamutasaːˈwiːn/',
    ومنزل: '/waˈmanzil/',
    وهبوا: '/wuˈhibuː/',
    يؤوده: '/jaʔuːˈduhu/',
    يتخطى: '/jataˈxatˤːaː/',
    يحيطون: '/juħiːˈtˤuːn/',
    يضعه: '/jadˤaˈʕuhu/',
    يعاملوا: '/juˈʕaːmiluː/',
  },
  de: {
    abendsonnenschein: '/ˈaːbəntˌzɔnənʃaɪ̯n/',
    andrer: '/ˈandʁɐ/',
    balde: '/ˈbaldə/',
    bewußtsein: '/bəˈvʊstˌzaɪ̯n/',
    blütenschimmer: '/ˈblyːtənˌʃɪmɐ/',
    brahmanensohn: '/ˈbʁaːmaːnənˌzoːn/',
    'c\u2019est': '/sɛ/', // French in Mann's Buddenbrooks
    chère: '/ʃɛːʁ/', // French in Mann's Buddenbrooks
    daß: '/das/',
    'davos-platz': '/ˈdaːvɔsˌplats/', // Swiss resort area
    demoiselle: '/dəmwaˈzɛl/', // French in Mann's Buddenbrooks
    dreissig: '/ˈdʁaɪ̯sɪç/',
    düwel: '/ˈdyːvəl/', // Low German: devil
    faßt: '/fast/',
    feuertrunken: '/ˈfɔɪ̯ɐˌtʁʊŋkən/',
    flußufers: '/ˈflʊsˌʔuːfɐs/',
    frühlingsnachmittag: '/ˈfʁyːlɪŋsˌnaːxmɪtaːk/',
    gefahrdrohende: '/ɡəˈfaːɐ̯ˌdʁoːəndə/',
    geküßt: '/ɡəˈkʏst/',
    götterfunken: '/ˈɡœtɐˌfʊŋkən/',
    govinda: '/ɡoˈvɪnda/', // Sanskrit name
    graubündischen: '/ɡʁaʊ̯ˈbʏndɪʃən/',
    guizot: '/ɡiˈzoː/', // French name
    hätt: '/hɛt/', // contraction of hätte
    'ich\u2019s': '/ɪçs/',
    küßnacht: '/ˈkʏsnaxt/',
    macheath: '/məˈkiːθ/', // English name
    metternich: '/ˈmɛtɐnɪç/',
    muß: '/mʊs/',
    müßt: '/mʏst/',
    mußte: '/ˈmʊstə/',
    ook: '/oːk/', // Low German: also
    'prinz-regentenstraße': '/ˈpʁɪntsʁeˌɡɛntənˌʃtʁaːsə/',
    question: '/kɛsˈtjɔ̃/', // French in Mann's Buddenbrooks
    salwaldes: '/ˈzalˌvaldəs/', // Sal forest
    samsa: '/ˈzamza/', // Kafka character
    schriee: '/ˈʃʁiːə/',
    siddhartha: '/zɪˈdaːʁta/',
    sternklar: '/ˈʃtɛʁnklaːɐ̯/',
    très: '/tʁɛ/', // French in Mann's Buddenbrooks
    verliess: '/fɛɐ̯ˈliːs/',
    zarathustra: '/tsaʁaˈtʊstʁa/',
  },
  es: {
    arts: '/aʁ/', // French "Arts" in Cortázar (Pont des Arts)
    aureliano: '/awɾeˈljano/',
    beatriz: '/beaˈtɾis/',
    buendía: '/bwenˈdia/',
    cañabrava: '/kaɲaˈβɾaβa/',
    conti: '/ˈkonti/', // Italian name in Cortázar
    fierro: '/ˈfjeɾo/',
    macondo: '/maˈkondo/',
    pont: '/pɔ̃/', // French in Cortázar
    porfirio: '/poɾˈfiɾjo/',
    pretil: '/pɾeˈtil/',
    quai: '/ke/', // French in Cortázar
    quedóse: '/keˈðose/',
    rue: '/ʁy/', // French in Cortázar
    seine: '/sɛn/', // French river in Cortázar
    sépase: '/ˈsepase/',
    urbino: '/uɾˈβino/',
    vacilante: '/basiˈlante/',
    viterbo: '/biˈteɾβo/',
  },
  fi: {
    aliide: '/ˈɑliːde/', // Estonian name (Oksanen)
    en: '/en/',
    esko: '/ˈesko/',
    haluaa: '/ˈhɑluɑː/',
    hänen: '/ˈhænen/',
    heitä: '/ˈheitæ/',
    impivaara: '/ˈimpiʋɑːrɑ/', // fictional place (Kivi)
    itsensä: '/ˈitsensæ/',
    jossa: '/ˈjosːɑ/',
    jukolan: '/ˈjukolɑn/', // Jukola farm (Kivi)
    kaskisavu: '/ˈkɑskisɑʋu/',
    kuussa: '/ˈkuːsːɑ/',
    lajivirsi: '/ˈlɑjiʋirsi/',
    maamme: '/ˈmɑːmːe/',
    meidän: '/ˈmeidæn/',
    merelle: '/ˈmerelːe/',
    muumipappa: '/ˈmuːmipɑpːɑ/', // Moominpappa
    muumipeikko: '/ˈmuːmipeikːo/', // Moomintroll
    rakkaampi: '/ˈrɑkːɑːmpi/',
    sinuhe: '/ˈsinuhe/', // Sinuhe (Waltari)
    soi: '/soi/',
    sukuvirsi: '/ˈsukuʋirsi/',
    suurin: '/ˈsuːrin/',
    taikuuri: '/ˈtɑikuːri/',
    teräinen: '/ˈteræinen/',
    toisensa: '/ˈtoisensɑ/',
    toukola: '/ˈtoukolɑ/', // place name (Kivi)
    truu: '/truː/', // Estonian name (Oksanen)
    tummuus: '/ˈtumːuːs/',
    turms: '/turms/', // character name (Waltari)
    väinämöinen: '/ˈʋæinæmøinen/', // Kalevala hero
    zara: '/ˈtsɑrɑ/', // character name (Oksanen)
  },
  fr: {
    blême: '/blɛm/',
    conflans: '/kɔ̃flɑ̃/', // place name
    est: '/ɛ/', // verb "is" — st is silent (dict has /ɛst/)
    jolies: '/ʒɔli/',
    luit: '/lɥi/',
    marchiennes: '/maʁʃjɛn/', // place name (Zola)
    'métaphysico-théologo-cosmolonigologie': '/metafizikoteolɔɡɔkɔsmɔlɔniɡɔlɔʒi/', // Voltaire
    montsou: '/mɔ̃su/', // fictional town (Zola)
    morgion: '/mɔʁʒjɔ̃/', // place name (Dumas)
    myriel: '/miʁjɛl/', // character name (Hugo)
    naissent: '/nɛs/',
    naît: '/nɛ/',
    'neuve-sainte-geneviève': '/nœvsɛ̃tʒənvjɛv/', // Paris street (Balzac)
    nicole: '/nikɔl/',
    nue: '/ny/',
    pangloss: '/pɑ̃ɡlɔs/', // Voltaire character
    parce: '/paʁs/',
    rainurée: '/ʁɛnyʁe/',
    rion: '/ʁjɔ̃/', // place name (Dumas)
    'saint-marcel': '/sɛ̃maʁsɛl/', // Paris quarter (Dumas)
    'thunder-ten-tronckh': '/tɔnɛʁtɛntʁɔnk/', // Voltaire
    trieste: '/tʁijɛst/', // city name (Dumas)
    vauquer: '/voke/', // character name (Balzac)
  },
  ja: {
    あけぼの: '/akebono/',
    あった: '/atːa/',
    あと: '/ato/',
    あまた: '/amata/',
    あらぬ: '/aɾanɯ/',
    あり: '/aɾi/',
    ある: '/aɾɯ/',
    あるく: '/aɾɯkɯ/',
    いう: '/iɯ/',
    イギリス: '/iɡiɾisɯ/', // England
    いた: '/ita/',
    いたう: '/itaɯ/', // archaic: greatly
    いづれ: '/idɯɾe/', // archaic: which
    いる: '/iɾɯ/',
    うみ: '/ɯmi/',
    うら: '/ɯɾa/',
    おる: '/oɾɯ/',
    かた: '/kata/',
    かたち: '/katatɕi/',
    かつぐ: '/katsɯɡɯ/',
    く: '/kɯ/', // archaic verb stem
    ご: '/ɡo/',
    ここ: '/koko/',
    ございます: '/ɡozaimasɯ/',
    この: '/kono/',
    さびしい: '/sabiɕiː/',
    さら: '/saɾa/', // archaic: furthermore
    すぐれる: '/sɯɡɯɾeɾɯ/',
    すこし: '/sɯkoɕi/',
    する: '/sɯɾɯ/',
    そこ: '/soko/',
    その: '/sono/',
    だいぶ: '/daibɯ/',
    だけ: '/dake/',
    ただ: '/tada/',
    だつ: '/datsɯ/', // archaic suffix: -ish
    たなびく: '/tanabikɯ/',
    つく: '/tsɯkɯ/',
    つれる: '/tsɯɾeɾɯ/',
    どこ: '/doko/',
    ところ: '/tokoɾo/',
    とらえる: '/toɾaeɾɯ/',
    なお: '/nao/',
    なか: '/naka/',
    なった: '/natːa/',
    なびく: '/nabikɯ/',
    のけ: '/noke/',
    ばかり: '/bakaɾi/',
    はた: '/hata/',
    ふう: '/ɸɯː/',
    ふち: '/ɸɯtɕi/',
    ほか: '/hoka/',
    ほど: '/hodo/',
    ほんとう: '/hontoː/',
    また: '/mata/',
    まだ: '/mada/',
    みなさん: '/minasaɴ/',
    みんな: '/minːa/',
    やうやう: '/jaɯjaɯ/', // archaic: gradually
    やみ: '/jami/',
    やむ: '/jamɯ/',
    やんごとなし: '/jaŋɡotonaɕi/', // archaic: noble
    よく: '/jokɯ/',
    よほど: '/johodo/',
    る: '/ɾɯ/', // classical auxiliary
    一茶: '/itːɕa/', // Issa (poet)
    候う: '/soːɾoː/', // archaic polite auxiliary
    呼んで: '/joɴde/',
    止まった: '/tomatːa/',
    痩: '/jase/', // thin
    白く: '/ɕiɾokɯ/',
    知って: '/ɕitːe/',
    積み: '/tsɯmi/',
    羅生門: '/ɾaɕoːmoɴ/', // Rashomon
    舞鶴: '/maizɯɾɯ/', // Maizuru (place)
    金閣: '/kiɴkakɯ/', // Golden Pavilion
    静かさ: '/ɕizɯkasa/',
  },
  ko: {
    감나무: '/kam.na.mu/',
    개천: '/kɛ.tɕʰʌn/',
    경성: '/kjʌŋ.sʌŋ/', // old name for Seoul
    고이: '/ko.i/',
    광음: '/kwaŋ.ɯm/',
    금빛: '/kɯm.pit̚/',
    기나기다: '/ki.na.ɡi.da/', // very long
    끊임: '/k͈ɯn.im/',
    나타샤: '/na.tʰa.ɕa/', // Natasha
    논가: '/non.ɡa/',
    니까: '/ni.k͈a/', // because (suffix)
    동짓달: '/toŋ.dʑit̚.t͈al/',
    물들다: '/mul.dɯl.da/',
    백두산: '/pɛk̚.t͈u.san/', // Mt. Baekdu
    범하다: '/pʌm.ha.da/',
    산모퉁이: '/san.mo.tʰuŋ.i/',
    아라리요: '/a.ɾa.ɾi.jo/', // arirang refrain
    약산: '/jak̚.s͈an/', // Yaksan (place)
    어두: '/ʌ.du/',
    어론: '/ʌ.ɾon/', // archaic: elder
    역겹다: '/jʌk̚.kjʌp̚.t͈a/',
    영변: '/jʌŋ.bjʌn/', // Yeongbyeon (place)
    오동잎: '/o.doŋ.ip̚/',
    오시다: '/o.ɕi.da/', // honorific: to come
    왔다: '/wat̚.t͈a/',
    우러르다: '/u.ɾʌ.ɾɯ.da/',
    이어든: '/i.ʌ.dɯn/', // archaic conditional
    이에: '/i.e/',
    잊히다: '/i.tʰi.da/',
    잎새: '/ip̚.s͈ɛ/',
    장날: '/tɕaŋ.nal/',
    장터: '/tɕaŋ.tʰʌ/',
    지리다: '/tɕi.ɾi.da/',
    지줄대다: '/tɕi.dʑul.dɛ.da/',
    채식: '/tɕʰɛ.ɕik̚/',
    청천: '/tɕʰʌŋ.tɕʰʌn/',
    춘풍: '/tɕʰun.pʰuŋ/',
    티끌: '/tʰi.k͈ɯl/',
    피어오르다: '/pʰi.ʌ.o.ɾɯ.da/',
    한테: '/han.tʰe/',
    해설피: '/hɛ.sʌl.pʰi/', // poetic: at sunset
    헤다: '/he.da/', // archaic: to count
    휘달리다: '/hwi.dal.li.da/',
    휘돌다: '/hwi.dol.da/',
  },
  nl: {
    aandelen: '/ˈaːndələn/',
    achterhaalt: '/ˈɑxtərhaːlt/',
    allen: '/ˈɑlən/',
    alsoo: '/ɑlˈsoː/', // archaic: thus
    balkons: '/bɑlˈkɔns/',
    bange: '/ˈbɑŋə/',
    benaeuwde: '/bəˈnaːudə/', // archaic: oppressed
    bevonden: '/bəˈvɔndən/',
    bloedroze: '/ˈbludˌroːzə/',
    burgery: '/bʏrɣəˈrɛi/', // archaic: burgerij
    dagelix: '/ˈdaːɣəlɪks/', // archaic: dagelijks
    dagschemer: '/ˈdɑɣˌsxeːmər/',
    deed: '/deːt/',
    dengenen: '/dɛnˈɣeːnən/', // archaic: those
    dese: '/ˈdeːzə/', // archaic: deze
    deselve: '/dəˈzɛlvə/', // archaic: dezelfde
    dien: '/diːn/', // archaic dative: that
    draaide: '/ˈdraːidə/',
    duitsen: '/ˈdœytsən/', // archaic: German
    eert: '/eːrt/',
    egters: '/ˈɛɣtərs/', // proper name
    engelen: '/ˈɛŋələn/',
    erbarremt: '/ɛrˈbɑrəmt/', // archaic: have mercy
    erkers: '/ˈɛrkərs/',
    flauwe: '/ˈflɑuə/',
    frits: '/frɪts/',
    gekomen: '/ɣəˈkoːmən/',
    gekund: '/ɣəˈkʏnt/',
    gemeenschappelijks: '/ɣəˈmeːnsxɑpələks/', // archaic genitive
    geschrey: '/ɣəˈsxrɛi/', // archaic: outcry
    gestelt: '/ɣəˈstɛlt/', // archaic: placed
    gewone: '/ɣəˈwoːnə/',
    ghewelt: '/ɣəˈwɛlt/', // archaic: violence
    godt: '/ɣɔt/', // archaic: God
    graaft: '/ɣraːft/',
    groeiden: '/ˈɣruːidən/',
    had: '/hɑt/',
    hadden: '/ˈhɑdən/',
    hare: '/ˈhaːrə/', // archaic: her
    hele: '/ˈheːlə/',
    hemelsche: '/ˈheːməlsxə/', // archaic: heavenly
    henri: '/ɑ̃ˈri/', // French name
    herinner: '/hɛˈrɪnər/',
    hispanje: '/hɪsˈpɑɲə/', // archaic: Spain
    hooft: '/hoːft/', // archaic: hoofd
    hooren: '/ˈhoːrən/', // archaic: horen
    immense: '/ɪˈmɛnsə/',
    inni: '/ˈɪni/', // proper name (Mulisch)
    is: '/ɪs/',
    keek: '/keːk/',
    kennelick: '/ˈkɛnələk/', // archaic: evident
    kon: '/kɔn/',
    kraanwagentje: '/ˈkraːnˌwaːɣəntjə/',
    laatsten: '/ˈlaːtstən/',
    lande: '/ˈlɑndə/', // archaic dative: land
    lange: '/ˈlɑŋə/',
    lauriergracht: '/lɑuˈriːrɣrɑxt/',
    lesen: '/ˈleːzən/', // archaic: lezen
    lesten: '/ˈlɛstən/', // archaic: last
    liep: '/lip/',
    louterende: '/ˈlɑutərɛndə/',
    mag: '/mɑx/',
    mensen: '/ˈmɛnsən/',
    my: '/mɛi/', // archaic: mij
    nassouwe: '/nɑˈsɑuə/', // archaic: Nassau
    oeroeg: '/ˈuruɣ/', // proper name (Haasse)
    ondersaten: '/ˈɔndərˌzaːtən/', // archaic: subjects
    ontwaakte: '/ɔntˈwaːktə/',
    onverveerd: '/ˌɔnvərˈveːrt/',
    onze: '/ˈɔnzə/',
    opgerezen: '/ˈɔpɣəˌreːzən/',
    osewoudt: '/ˈoːzəˌwɑut/', // proper name (Hermans)
    philips: '/ˈfilɪps/',
    pleegde: '/ˈpleːɣdə/',
    prince: '/ˈprɪnsə/', // archaic: prins
    prinse: '/ˈprɪnsə/', // archaic variant
    reed: '/reːt/',
    romans: '/roˈmɑns/',
    saluyt: '/saːˈlœyt/', // archaic: greeting
    scherpste: '/ˈsxɛrpstə/',
    schilderskade: '/ˈsxɪldərsˌkaːdə/', // street name
    sien: '/siːn/', // archaic: zien
    stonden: '/ˈstɔndən/',
    stopte: '/ˈstɔptə/',
    tamarindeboomen: '/taːmaːˈrɪndəˌboːmən/', // archaic: tamarind trees
    tegenwoordighe: '/ˈteːɣənˌwoːrdəɣə/', // archaic
    torentjes: '/ˈtoːrəntjəs/',
    tragische: '/ˈtraːɣɪsxə/',
    valt: '/vɑlt/',
    velden: '/ˈvɛldən/',
    vermoordde: '/vərˈmoːrdə/',
    vlamde: '/ˈvlɑmdə/',
    volcx: '/vɔlks/', // archaic: volks
    volle: '/ˈvɔlə/',
    voorschoten: '/ˈvoːrsxoːtən/', // place name
    vroege: '/ˈvruɣə/',
    weerd: '/weːrt/', // archaic: waard
    werd: '/wɛrt/',
    'west-java': '/ˌwɛstˈjaːva/',
    wintrop: '/ˈvɪntrɔp/', // proper name (Mulisch)
    woonde: '/ˈwoːndə/',
    yegelick: '/ˈjeːɣəlɪk/', // archaic: iedereen
    zal: '/zɑl/',
    zijne: '/ˈzɛinə/', // archaic: zijn
    zocht: '/zɔxt/',
    zulke: '/ˈzʏlkə/',
  },
  pt: {
    a: '/a/',
    à: '/a/',
    agora: '/aˈɡoɾa/',
    ainda: '/aˈĩda/',
    alto: '/ˈawtu/',
    alvejei: '/awveˈʒej/',
    antes: '/ˈãtʃis/',
    ao: '/aw/',
    aparecesse: '/apaɾeˈsesi/',
    assembleia: '/asẽˈbleja/',
    assim: '/aˈsĩ/',
    automóveis: '/awtoˈmɔvejs/',
    autor: '/awˈtoɾ/',
    aventura: '/avẽˈtuɾa/',
    beija: '/ˈbejʒa/',
    bem: '/bẽj/',
    calmo: '/ˈkawmu/',
    cama: '/ˈkãma/',
    central: '/sẽˈtɾaw/',
    certa: '/ˈsɛɾta/',
    chamam: '/ˈʃãmãw/',
    chapéu: '/ʃaˈpɛw/',
    com: '/kõ/',
    como: '/ˈkomu/',
    contraparente: '/kõtɾapaˈɾẽtʃi/',
    costume: '/kosˈtũmi/',
    cruzarmos: '/kɾuzˈaɾmus/',
    d: '/de/', // abbreviation for Dom
    da: '/da/',
    de: '/dʒi/',
    dei: '/dej/',
    dele: '/ˈdeli/',
    dentro: '/ˈdẽtɾu/',
    deu: '/dew/',
    deus: '/ˈdews/',
    dia: '/ˈdʒia/',
    direita: '/dʒiˈɾejta/',
    disco: '/ˈdʒisku/',
    disse: '/ˈdʒisi/',
    do: '/du/',
    dois: '/dojs/',
    e: '/i/',
    é: '/ɛ/',
    emprenhou: '/ẽpɾeˈɲow/',
    encante: '/ẽˈkãtʃi/',
    entre: '/ˈẽtɾi/',
    escolherei: '/iskoʎeˈɾej/',
    eterna: '/eˈtɛɾna/',
    eu: '/ew/',
    face: '/ˈfasi/',
    faixas: '/ˈfajʃas/',
    falsa: '/ˈfawsa/',
    faz: '/fas/',
    fim: '/fĩ/',
    flameja: '/flaˈmeʒa/',
    focinhando: '/fosiˈɲãdu/',
    foi: '/foj/',
    fossem: '/ˈfosẽj/',
    fosses: '/ˈfosis/',
    francisco: '/fɾãˈsisku/',
    frente: '/ˈfɾẽtʃi/',
    gente: '/ˈʒẽtʃi/',
    girassol: '/ʒiɾaˈsɔw/',
    gosto: '/ˈɡostu/',
    havia: '/aˈvia/',
    hei: '/ej/',
    hesitei: '/eziˈtej/',
    homens: '/ˈõmẽjs/',
    houve: '/ˈovi/',
    individuais: '/ĩdʒividuˈajs/',
    instituir: '/ĩstʃituˈiɾ/',
    isso: '/ˈisu/',
    jamais: '/ʒaˈmajs/',
    josé: '/ʒoˈzɛ/',
    lhe: '/ʎi/',
    liberdade: '/libeɾˈdadʒi/',
    lisboa: '/lizˈboa/',
    louca: '/ˈloka/',
    louvor: '/loˈvoɾ/',
    lua: '/ˈlua/',
    maior: '/maˈjoɾ/',
    mais: '/majs/',
    mal: '/maw/',
    maus: '/maws/',
    me: '/mi/',
    mestiçara: '/mestiˈsaɾa/',
    método: '/ˈmɛtudu/',
    meu: '/mew/',
    mil: '/miw/',
    mim: '/mĩ/',
    morder: '/moɾˈdex/',
    morte: '/ˈmɔɾtʃi/',
    morto: '/ˈmoɾtu/',
    mostra: '/ˈmɔstɾa/',
    mulher: '/muˈʎɛx/',
    na: '/na/',
    nacional: '/nasioˈnaw/',
    nascimento: '/nasiˈmẽtu/',
    nele: '/ˈneli/',
    nem: '/nẽj/',
    no: '/nu/',
    noite: '/ˈnojtʃi/',
    nonada: '/noˈnada/', // nothing (Guimarães Rosa)
    nosso: '/ˈnosu/',
    novo: '/ˈnovu/',
    o: '/u/',
    ó: '/ɔ/',
    os: '/us/',
    ou: '/ow/',
    ousadia: '/ozaˈdʒia/',
    outono: '/owˈtonu/',
    outra: '/ˈowtɾa/',
    outro: '/ˈowtɾu/',
    para: '/ˈpaɾa/',
    parte: '/ˈpaɾtʃi/',
    passadeira: '/pasaˈdejɾa/',
    pode: '/ˈpɔdʒi/',
    portugal: '/poɾtuˈɡaw/',
    posso: '/ˈposu/',
    povo: '/ˈpovu/',
    praia: '/ˈpɾaja/',
    prometia: '/pɾomeˈtʃia/',
    quanto: '/ˈkwãtu/',
    quarto: '/ˈkwaɾtu/',
    que: '/ki/',
    quer: '/kɛɾ/',
    querer: '/keˈɾex/',
    ramalhete: '/xamaˈʎetʃi/', // mansion name (Eça de Queirós)
    real: '/xeˈaw/',
    rei: '/xej/',
    reino: '/ˈxejnu/',
    remota: '/xeˈmɔta/',
    rir: '/xiɾ/',
    riso: '/ˈxizu/',
    rosto: '/ˈxostu/',
    rua: '/ˈxua/',
    s: '/sãw/', // abbreviation for São
    saber: '/saˈbex/',
    sal: '/saw/',
    se: '/si/',
    sei: '/sej/',
    sem: '/sẽj/',
    sempre: '/ˈsẽpɾi/',
    senhor: '/seˈɲoɾ/',
    sequer: '/seˈkɛɾ/',
    ser: '/ˈsex/',
    serei: '/seˈɾej/',
    seu: '/sew/',
    sim: '/sĩ/',
    simples: '/ˈsĩplis/',
    sociais: '/sosiˈajs/',
    sua: '/ˈsua/',
    sublimaram: '/subliˈmaɾãw/',
    tanto: '/ˈtãtu/',
    taprobana: '/tapɾoˈbãna/', // ancient Sri Lanka
    te: '/tʃi/',
    tempo: '/ˈtẽpu/',
    ter: '/tex/',
    teu: '/tew/',
    tive: '/ˈtʃivi/',
    triste: '/ˈtɾistʃi/',
    um: '/ũ/',
    uma: '/ˈũma/',
    universo: '/uniˈvɛɾsu/',
    uso: '/ˈuzu/',
    vale: '/ˈvali/',
    valeu: '/vaˈlew/',
    verde: '/ˈveɾdʒi/',
    verdes: '/ˈveɾdʒis/',
    vez: '/ves/',
    viagem: '/viˈaʒẽj/',
    'vivê-lo': '/viˈvelu/',
    'vou-me': '/ˈvomi/',
    zelo: '/ˈzelu/',
    zomba: '/ˈzõba/',
  },
};

/**
 * Converts an IPA transcription to Ingglish spelling.
 * Strips slashes and syllable dots before conversion.
 */
export function ipaToIngglish(ipa: string): string {
  const clean = ipa.replaceAll(IPA_SLASH_RE, '').replaceAll('.', '');
  const arpabet = ipaToArpabet(clean);
  return arpabetToIngglish(arpabet);
}

export function lookupIpa(dict: IpaDict, word: string, lang?: string): string | undefined {
  if (lang) {
    const override = getIpaOverride(lang, word) ?? getIpaOverride(lang, word.toLowerCase());
    if (override) {
      return override;
    }
  }
  // Try exact, lowercase, title case, then accent-stripped
  const lower = word.toLowerCase();
  const title = lower.charAt(0).toUpperCase() + lower.slice(1);
  const stripped = stripAccents(lower);
  return dict[word] ?? dict[lower] ?? dict[title] ?? dict[stripped];
}

/**
 * If no vowel in the ARPAbet array carries a stress digit, apply stress 1
 * to the last vowel. This gives useful Guide-mode output for languages
 * whose IPA dictionaries omit stress (e.g. French, where stress is always
 * on the final syllable).
 */
function applyDefaultStress(arpabet: string[]): string[] {
  const hasStress = arpabet.some((p) => isVowel(p) && getStress(p) !== null);
  if (hasStress) {
    return arpabet;
  }
  // Find the last vowel and give it primary stress
  const result = [...arpabet];
  for (let i = result.length - 1; i >= 0; i--) {
    if (isVowel(result[i]!)) {
      result[i] = result[i]! + '1';
      break;
    }
  }
  return result;
}

function getIpaOverride(lang: string, word: string): string | undefined {
  return IPA_WORD_OVERRIDES[lang]?.[word];
}

/**
 * Converts an IPA transcription to the specified output format.
 * Accepts optional language code for language-specific IPA overrides.
 * Disables English R-coloring rules since foreign languages treat R as
 * a regular consonant (e.g. Korean 사랑 → "sarang" not "sarrang").
 */
function ipaToFormat(ipa: string, format: OutputFormat, lang?: string): string {
  const clean = ipa.replaceAll(IPA_SLASH_RE, '').replaceAll('.', '');
  const overrides = lang ? IPA_LANGUAGE_OVERRIDES[lang] : undefined;
  const arpabet = applyDefaultStress(ipaToArpabet(clean, overrides));
  return arpabetToFormat(arpabet, format, { disableRColoring: true });
}

/** Strip combining diacritics (accents, tildes, etc.) from a string. */
const stripAccents = stripDiacritics;

/** Marker for words not found in the dictionary */
export const NOT_FOUND_MARKER = '\u{FFFD}'; // Unicode replacement character

/**
 * Translates foreign text to the specified output format.
 * Words not found in the dictionary are returned with a marker prefix.
 *
 * @param lang Optional language code for language-specific IPA overrides
 */
export function translateForeign(
  text: string,
  dict: IpaDict,
  format: OutputFormat = 'ingglish',
  lang?: string
): string {
  return text
    .split(WHITESPACE_SPLIT_RE)
    .map((segment) => {
      // Preserve whitespace segments as-is
      if (WHITESPACE_RE.test(segment)) {
        return segment;
      }
      if (!segment) {
        return segment;
      }

      // Strip leading/trailing punctuation for lookup
      const leading: string[] = [];
      const trailing: string[] = [];
      let core = segment;

      // Peel off leading non-letter characters (Unicode-aware so Arabic/CJK aren't stripped)
      while (core.length > 0 && LEADING_NON_LETTER_RE.test(core)) {
        leading.push(core[0]!);
        core = core.slice(1);
      }
      // Peel off trailing non-letter characters
      while (core.length > 0 && TRAILING_NON_LETTER_RE.test(core)) {
        trailing.unshift(core.at(-1)!);
        core = core.slice(0, -1);
      }

      if (!core) {
        return segment;
      }

      const casePattern = detectCasePattern(core);
      const preservesCase = getFormatPreservesCase(format);
      const ipa = lookupIpa(dict, core, lang);
      if (ipa) {
        const translated = ipaToFormat(ipa, format, lang);
        const cased = preservesCase ? applyCasePattern(translated, casePattern) : translated;
        return leading.join('') + cased + trailing.join('');
      }

      // Try splitting on apostrophes/hyphens (French contractions: l'essentiel, s'il, allez-vous)
      const parts = core.split(CONTRACTION_SPLIT_RE);
      if (parts.length > 1) {
        const translated = parts.map((part, i) => {
          if (part === "'" || part === '-') {
            return part;
          }
          const partCase = detectCasePattern(part);
          // Try bare lookup first, then with adjacent apostrophe attached
          // (French ipa-dict stores clitics as "s'" → /s/, "l'" → /l/, etc.)
          let partIpa = lookupIpa(dict, part, lang);
          if (!partIpa && parts[i + 1] === "'") {
            partIpa = lookupIpa(dict, part + "'", lang);
          }
          if (partIpa) {
            const partTranslated = ipaToFormat(partIpa, format, lang);
            return preservesCase ? applyCasePattern(partTranslated, partCase) : partTranslated;
          }
          return NOT_FOUND_MARKER + part;
        });
        // If any part was found, return the combined result
        if (
          translated.some(
            (t, i) => parts[i] !== "'" && parts[i] !== '-' && !t.startsWith(NOT_FOUND_MARKER)
          )
        ) {
          return leading.join('') + translated.join('') + trailing.join('');
        }
      }

      // Not found — return original with marker
      return NOT_FOUND_MARKER + segment;
    })
    .join('');
}
