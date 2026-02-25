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
      // https://www.gutenberg.org/ebooks/22367
      label: 'Kafka — Die Verwandlung',
      text: 'Als Gregor Samsa eines Morgens aus unruhigen Träumen erwachte, fand er sich in seinem Bett zu einem ungeheuren Ungeziefer verwandelt. Er lag auf seinem panzerartig harten Rücken und sah, wenn er den Kopf ein wenig hob, seinen gewölbten, braunen, von bogenförmigen Versteifungen geteilten Bauch, auf dessen Höhe sich die Bettdecke, zum gänzlichen Niedergleiten bereit, kaum noch erhalten konnte.',
    },
    {
      // https://www.gutenberg.org/files/2229/2229-h/2229-h.htm
      label: 'Goethe — Faust',
      text: 'Da steh ich nun, ich armer Tor, und bin so klug als wie zuvor. Heiße Magister, heiße Doktor gar, und ziehe schon an die zehen Jahr herauf, herab und quer und krumm meine Schüler an der Nase herum — und sehe, dass wir nichts wissen können. Das will mir schier das Herz verbrennen.',
    },
    {
      // https://de.wikisource.org/wiki/Herbsttag
      label: 'Rilke — Herbsttag',
      text: 'Herr: es ist Zeit. Der Sommer war sehr groß. Leg deinen Schatten auf die Sonnenuhren, und auf den Fluren lass die Winde los. Befiehl den letzten Früchten voll zu sein; gib ihnen noch zwei südlichere Tage, dränge sie zur Vollendung hin und jage die letzte Süße in den schweren Wein. Wer jetzt kein Haus hat, baut sich keines mehr. Wer jetzt allein ist, wird es lange bleiben, wird wachen, lesen, lange Briefe schreiben und wird in den Alleen hin und her unruhig wandern, wenn die Blätter treiben.',
    },
    {
      // https://www.grimmstories.com/de/grimm_maerchen/schneewittchen
      label: 'Grimm — Schneewittchen',
      text: 'Es war einmal mitten im Winter, und die Schneeflocken fielen wie Federn vom Himmel herab. Da saß eine Königin an einem Fenster, das einen Rahmen von schwarzem Ebenholz hatte, und nähte. Und wie sie so nähte und nach dem Schnee aufblickte, stach sie sich mit der Nadel in den Finger, und es fielen drei Tropfen Blut in den Schnee.',
    },
    {
      // https://de.wikisource.org/wiki/Wilhelm_Tell/Vierter_Aufzug
      label: 'Schiller — Wilhelm Tell',
      text: 'Durch diese hohle Gasse muß er kommen, es führt kein andrer Weg nach Küßnacht. Hier vollend ich\u2019s. Die Gelegenheit ist günstig.',
    },
    {
      // https://www.gutenberg.org/files/7205/7205-h/7205-h.htm
      label: 'Nietzsche — Also sprach Zarathustra',
      text: 'Als Zarathustra dreissig Jahr alt war, verliess er seine Heimat und den See seiner Heimat und ging in das Gebirge. Hier genoss er seines Geistes und seiner Einsamkeit und wurde dessen zehn Jahr nicht müde.',
    },
    {
      // https://www.gutenberg.org/ebooks/34811
      label: 'Mann — Buddenbrooks',
      text: '\u201EWas ist das. \u2014 Was \u2014 ist das \u2026\u201C \u201EJe, den Düwel ook, c\u2019est la question, ma très chère demoiselle!\u201C',
    },
    {
      // https://kalliope.org/en/text/heine200202032
      label: 'Heine — Die Loreley',
      text: 'Ich weiß nicht, was soll es bedeuten, daß ich so traurig bin; ein Märchen aus alten Zeiten, das kommt mir nicht aus dem Sinn. Die Luft ist kühl und es dunkelt, und ruhig fließt der Rhein; der Gipfel des Berges funkelt im Abendsonnenschein.',
    },
    {
      // https://en.wikipedia.org/wiki/Erlk%C3%B6nig
      label: 'Goethe — Erlkönig',
      text: 'Wer reitet so spät durch Nacht und Wind? Es ist der Vater mit seinem Kind; er hat den Knaben wohl in dem Arm, er faßt ihn sicher, er hält ihn warm.',
    },
    {
      // https://www.gutenberg.org/cache/epub/2407/pg2407-images.html
      label: 'Goethe — Die Leiden des jungen Werther',
      text: 'Wie froh bin ich, daß ich weg bin! Bester Freund, was ist das Herz des Menschen! Dich zu verlassen, den ich so liebe, von dem ich unzertrennlich war, und froh zu sein!',
    },
    {
      // https://en.wikipedia.org/wiki/Wanderer's_Nightsong
      label: 'Goethe — Wandrers Nachtlied',
      text: 'Über allen Gipfeln ist Ruh, in allen Wipfeln spürest du kaum einen Hauch; die Vöglein schweigen im Walde. Warte nur, balde ruhest du auch.',
    },
    {
      // https://www.gutenberg.org/cache/epub/2499/pg2499.html
      label: 'Hesse — Siddhartha',
      text: 'Im Schatten des Hauses, in der Sonne des Flußufers bei den Booten, im Schatten des Salwaldes, im Schatten des Feigenbaumes wuchs Siddhartha auf, der schöne Sohn des Brahmanen, der junge Falke, zusammen mit Govinda, seinem Freunde, dem Brahmanensohn.',
    },
    {
      // https://www.gutenberg.org/files/65661/65661-h/65661-h.htm
      label: 'Mann — Der Zauberberg',
      text: 'Ein einfacher junger Mensch reiste im Hochsommer von Hamburg, seiner Vaterstadt, nach Davos-Platz im Graubündischen. Er fuhr auf Besuch für drei Wochen.',
    },
    {
      // https://www.gutenberg.org/ebooks/12108
      label: 'Mann — Der Tod in Venedig',
      text: 'Gustav Aschenbach oder von Aschenbach, wie seit seinem fünfzigsten Geburtstag amtlich sein Name lautete, hatte an einem Frühlingsnachmittag des Jahres 19.., das unserem Kontinent monatelang eine so gefahrdrohende Miene zeigte, von seiner Wohnung in der Prinz-Regentenstraße zu München aus, allein einen weiteren Spaziergang unternommen.',
    },
    {
      // https://www.lyrikline.org/de/gedichte/die-moritat-von-mackie-messer
      label: 'Brecht — Die Dreigroschenoper',
      text: 'Und der Haifisch, der hat Zähne, und die trägt er im Gesicht. Und Macheath, der hat ein Messer, doch das Messer sieht man nicht.',
    },
    {
      // https://de.wikisource.org/wiki/An_die_Freude_(Schiller)
      label: 'Schiller — An die Freude',
      text: 'Freude, schöner Götterfunken, Tochter aus Elysium, wir betreten feuertrunken, Himmlische, dein Heiligtum! Deine Zauber binden wieder, was die Mode streng geteilt; alle Menschen werden Brüder, wo dein sanfter Flügel weilt.',
    },
    {
      // https://www.rilke.de/gedichte/die_erste_duineser_elegie.htm
      label: 'Rilke — Duineser Elegien',
      text: 'Wer, wenn ich schriee, hörte mich denn aus der Engel Ordnungen? und gesetzt selbst, es nähme einer mich plötzlich ans Herz: ich verginge von seinem stärkeren Dasein. Denn das Schöne ist nichts als des Schrecklichen Anfang, den wir noch grade ertragen, und wir bewundern es so, weil es gelassen verschmäht, uns zu zerstören. Ein jeder Engel ist schrecklich.',
    },
    {
      // https://de.wikisource.org/wiki/Mondnacht
      label: 'Eichendorff — Mondnacht',
      text: 'Es war, als hätt\u2019 der Himmel die Erde still geküßt, daß sie im Blütenschimmer von ihm nun träumen müßt\u2019. Die Luft ging durch die Felder, die Ähren wogten sacht, es rauschten leis die Wälder, so sternklar war die Nacht. Und meine Seele spannte weit ihre Flügel aus, flog durch die stillen Lande, als flöge sie nach Haus.',
    },
    {
      // https://www.gesetze-im-internet.de/gg/pr_ambel.html
      label: 'Grundgesetz — Präambel',
      text: 'Im Bewußtsein seiner Verantwortung vor Gott und den Menschen, von dem Willen beseelt, als gleichberechtigtes Glied in einem vereinten Europa dem Frieden der Welt zu dienen, hat sich das Deutsche Volk kraft seiner verfassungsgebenden Gewalt dieses Grundgesetz gegeben.',
    },
    {
      // https://www.bibleserver.com/LUT/1.Mose1
      label: 'Luther — Bibel, Genesis 1',
      text: 'Am Anfang schuf Gott Himmel und Erde. Und die Erde war wüst und leer, und Finsternis lag auf der Tiefe; und der Geist Gottes schwebte über dem Wasser. Und Gott sprach: Es werde Licht! Und es ward Licht.',
    },
    {
      // https://www.textlog.de/kafka/erzaehlungen/vor-dem-gesetz
      label: 'Kafka — Vor dem Gesetz',
      text: 'Vor dem Gesetz steht ein Türhüter. Zu diesem Türhüter kommt ein Mann vom Lande und bittet um Eintritt in das Gesetz. Aber der Türhüter sagt, daß er ihm jetzt den Eintritt nicht gewähren könne.',
    },
    {
      // https://www.grimmstories.com/de/grimm_maerchen/hansel_und_gretel
      label: 'Grimm — Hänsel und Gretel',
      text: 'Vor einem großen Walde wohnte ein armer Holzhacker mit seiner Frau und seinen zwei Kindern; das Bübchen hieß Hänsel und das Mädchen Gretel. Er hatte wenig zu beißen und zu brechen, und einmal, als große Teuerung ins Land kam, konnte er das tägliche Brot nicht mehr schaffen.',
    },
    {
      // https://www.marxists.org/deutsch/archiv/marx-engels/1848/manifest/0-einleit.htm
      label: 'Marx & Engels — Kommunistisches Manifest',
      text: 'Ein Gespenst geht um in Europa \u2014 das Gespenst des Kommunismus. Alle Mächte des alten Europa haben sich zu einer heiligen Hetzjagd gegen dies Gespenst verbündet, der Papst und der Zar, Metternich und Guizot, französische Radikale und deutsche Polizisten.',
    },
    {
      // https://www.gutenberg.org/ebooks/69327
      label: 'Kafka — Der Prozess',
      text: 'Jemand mußte Josef K. verleumdet haben, denn ohne daß er etwas Böses getan hätte, wurde er eines Morgens verhaftet.',
    },
  ],
  es: [
    {
      // https://cvc.cervantes.es/literatura/clasicos/quijote/edicion/parte1/cap01/default.htm
      label: 'Cervantes — Don Quijote',
      text: 'En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía un hidalgo de los de lanza en astillero, adarga antigua, rocín flaco y galgo corredor. Una olla de algo más vaca que carnero, salpicón las más noches, duelos y quebrantos los sábados, lentejas los viernes, algún palomino de añadidura los domingos, consumían las tres partes de su hacienda.',
    },
    {
      label: 'García Márquez — Cien años de soledad',
      text: 'Muchos años después, frente al pelotón de fusilamiento, el coronel Aureliano Buendía había de recordar aquella tarde remota en que su padre lo llevó a conocer el hielo. Macondo era entonces una aldea de veinte casas de barro y cañabrava construidas a la orilla de un río de aguas diáfanas que se precipitaban por un lecho de piedras pulidas, blancas y enormes como huevos prehistóricos.',
    },
    {
      // http://www.neruda.uchile.cl/obra/obra20poemas5.html
      label: 'Neruda — Poema 20',
      text: 'Puedo escribir los versos más tristes esta noche. Escribir, por ejemplo: la noche está estrellada, y tiritan, azules, los astros, a lo lejos. El viento de la noche gira en el cielo y canta. Puedo escribir los versos más tristes esta noche. Yo la quise, y a veces ella también me quiso.',
    },
    {
      // https://www.apocatastasis.com/aleph-borges.php
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
      // https://www.poesie-francaise.fr/victor-hugo/poeme-demain-des-l-aube.php
      label: "Hugo — Demain, dès l'aube",
      text: "Demain, dès l'aube, à l'heure où blanchit la campagne, je partirai. Vois-tu, je sais que tu m'attends. J'irai par la forêt, j'irai par la montagne. Je ne puis demeurer loin de toi plus longtemps. Je marcherai les yeux fixés sur mes pensées, sans rien voir au dehors, sans entendre aucun bruit, seul, inconnu, le dos courbé, les mains croisées, triste, et le jour pour moi sera comme la nuit.",
    },
    {
      // https://fleursdumal.org/poem/148
      label: "Baudelaire — L'invitation au voyage",
      text: "Mon enfant, ma sœur, songe à la douceur d'aller là-bas vivre ensemble! Aimer à loisir, aimer et mourir au pays qui te ressemble! Les soleils mouillés de ces ciels brouillés pour mon esprit ont les charmes si mystérieux de tes traîtres yeux, brillant à travers leurs larmes. Là, tout n'est qu'ordre et beauté, luxe, calme et volupté.",
    },
    {
      // https://www.la-fontaine-ch-thierry.net/corbrena.htm
      label: 'La Fontaine — Le Corbeau et le Renard',
      text: "Maître Corbeau, sur un arbre perché, tenait en son bec un fromage. Maître Renard, par l'odeur alléché, lui tint à peu près ce langage: Hé! bonjour, Monsieur du Corbeau, que vous êtes joli! que vous me semblez beau! Sans mentir, si votre ramage se rapporte à votre plumage, vous êtes le Phénix des hôtes de ces bois.",
    },
    {
      // https://fr.wikisource.org/wiki/L%E2%80%99Affiche_de_Londres
      label: 'De Gaulle — À tous les Français',
      text: "La France a perdu une bataille! Mais la France n'a pas perdu la guerre! Des gouvernants de rencontre ont pu capituler, cédant à la panique, oubliant l'honneur, livrant le pays à la servitude. Cependant, rien n'est perdu! Rien n'est perdu, parce que cette guerre est une guerre mondiale. Dans l'univers libre, des forces immenses n'ont pas encore donné. Un jour ces forces écraseront l'ennemi. Il faut que la France, ce jour-là, soit présente à la victoire. Alors, elle retrouvera sa liberté et sa grandeur.",
    },
  ],
  is: [
    {
      // https://sagadb.org/brennu-njals_saga.is (ch. 75)
      label: 'Njáls saga — Gunnar at Hlíðarendi',
      text: 'Fögur er hlíðin, svo að mér hefir hún aldrei sýnst, bleikir akrar en slegin tún, og mun eg ríða heim aftur og fara hvergi.',
    },
    {
      // https://www.voluspa.org/havamal76-80.htm (modern Icelandic spelling)
      label: 'Hávamál — Stanzas 76–77',
      text: 'Deyr fé, deyja frændur, deyr sjálfur hinn sami. En orðstír deyr aldrei, sér góðan getur. Deyr fé, deyja frændur, deyr sjálfur hinn sami. Ég veit eitt að aldrei deyr, dómur um dauðan hvern.',
    },
    {
      // https://en.wikiquote.org/wiki/Halld%C3%B3r_Laxness
      label: 'Halldór Laxness — On becoming a writer',
      text: 'Ég hef aldrei tekið mark á neinum öðrum en sjálfum mér og hefur mér aldrei dottið í hug að verða annað en skáld og rithöfundur frá fyrsta degi.',
    },
    {
      // https://sagadb.org/brennu-njals_saga.is (ch. 1)
      label: 'Njáls saga — Opening',
      text: 'Mörður hét maður er kallaður var gígja. Hann var sonur Sighvats hins rauða. Hann bjó á Völlum í Rangárvallasýslu. Hann var ríkur höfðingi en mikill lögmaður.',
    },
  ],
  ja: [
    {
      label: 'Kawabata — Snow Country',
      text: '国境 の 長い トンネル を 抜ける と 雪国 で あった 夜 の 底 が 白く なった 信号 所 汽車 座席 娘 窓 寒い 白い 暗い 遠い',
    },
    {
      // https://www.aozora.gr.jp/
      label: 'Bashō — Haiku collection',
      text: '古池 蛙 飛び込む 水 音 夏 草 兵 夢 跡 岩 染み入る 蝉 声 旅 病 枯野 秋 深い 寂しい 古い 美しい',
    },
    {
      label: 'Japanese daily life and culture',
      text: '東京 日本 電車 駅 学校 先生 友達 家族 仕事 食べる 飲む 音楽 映画 本 猫 桜 富士山 着物 寿司 抹茶 温泉 神社 侍 忍者 歌舞伎 相撲 祭り 庭園 茶道 書道',
    },
    {
      // https://www.aozora.gr.jp/cards/000081/files/456_15050.html
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
      // https://www.annefrank.org/nl/anne-frank/dagboek/
      label: 'Anne Frank — Het Achterhuis',
      text: 'Ik zal hoop ik aan jou alles kunnen toevertrouwen, zoals ik het nog aan niemand gekund heb, en ik hoop dat je een grote steun voor me zult zijn.',
    },
    {
      // https://www.dbnl.org/tekst/mult001maxh01_01/
      label: 'Multatuli — Max Havelaar',
      text: 'Ik ben makelaar in koffie, en woon op de Lauriergracht. Het is mijn gewoonte niet, romans te schrijven, of zulke dingen.',
    },
    {
      // https://lesned.net/wp-content/uploads/2020/01/harry-mulisch-de-aanslag.pdf
      label: 'Harry Mulisch — De Aanslag',
      text: 'Aan een kade, die over een lengte van honderd meter langs het water liep en dan met een flauwe bocht weer een gewone straat werd, stonden vier huizen niet ver van elkaar. Elk omgeven door een tuin hadden zij met hun kleine balkons, erkers en torentjes iets gemeenschappelijks.',
    },
    {
      // https://www.dbnl.org/tekst/coup002stil01_01/coup002stil01_01_0001.php
      label: 'Louis Couperus — De Stille Kracht',
      text: 'De volle maan, tragisch dien avond, was reeds vroeg, nog in den laatsten dagschemer opgerezen als een immense, bloedroze bol, vlamde als een zonsondergang laag achter de tamarindeboomen der Lange Laan en steeg, langzaam zich louterende van hare tragische tint, in een vagen hemel op.',
    },
    {
      // https://adoc.pub/gerard-van-het-reve-de-avonden.html
      label: 'Gerard Reve — De Avonden',
      text: 'Het was nog donker, toen in de vroege morgen van de tweeëntwintigste december 1946 in onze stad, op de eerste verdieping van het huis Schilderskade 66, de held van deze geschiedenis, Frits van Egters, ontwaakte.',
    },
    {
      // https://www.let.leidenuniv.nl/Dutch/Ceneton/VondelGysbreght1637.html
      label: 'Joost van den Vondel — Gysbreght van Aemstel',
      text: 'Het hemelsche gerecht heeft zich ten lange lesten erbarremt over my, en mijn benaeuwde vesten, en arme burgery; en op mijn volcx gebed, en dagelix geschrey, de bange stad ontzet.',
    },
    {
      // https://www.royal-house.nl/topics/national-anthem/music-lyrics-and-customs
      label: 'Wilhelmus — Nederlands volkslied',
      text: 'Wilhelmus van Nassouwe ben ik van Duitsen bloed, den vaderland getrouwe blijf ik tot in den dood. Een Prinse van Oranje ben ik vrij onverveerd, den Koning van Hispanje heb ik altijd geëerd.',
    },
    {
      // https://www.let.rug.nl/usa/documents/before-1600/plakkaat-van-verlatinghe-1581-july-26.php
      label: 'Plakkaat van Verlatinghe (1581)',
      text: 'Allen dengenen die dese tegenwoordighe sullen sien ofte hooren lesen, saluyt. Alsoo een yegelick kennelick is, dat een Prince van den lande van Godt gestelt is hooft over zijne ondersaten, om deselve te bewaren ende beschermen van alle onrecht, overlast ende ghewelt.',
    },
    {
      // https://en.wikipedia.org/wiki/Oeroeg
      label: 'Hella Haasse — Oeroeg',
      text: 'Oeroeg was mijn vriend. Ik herinner mij hem als een kleine bruine jongen met de scherpste zwarte ogen die ik ooit bij een kind gezien heb. Wij groeiden samen op in het bergland van West-Java.',
    },
    {
      // https://www.dbnl.org/titels/titel.php?id=schm001pluk01
      label: 'Annie M.G. Schmidt — Pluk van de Petteflet',
      text: 'Pluk had een klein rood kraanwagentje. Hij reed ermee door de hele stad en zocht naar een huis om in te wonen. Af en toe stopte hij en keek omhoog naar de hoge huizen.',
    },
    {
      // https://www.ganzenweide.nl/Home/Lijmen_het_Been_files/Lijmen%20Het%20Been.pdf
      label: 'Willem Elsschot — Lijmen',
      text: 'Nu ja, lijmen. De mensen bepraten en dan doen tekenen. Hij was knap in zijn vak, dat moet ik hem nageven, en hij kon een steen een hart onder de riem praten.',
    },
    {
      // https://www.dbnl.org/tekst/anbe001lexi01_01/lvlw00431.php
      label: 'Harry Mulisch — De Ontdekking van de Hemel',
      text: 'Er waren twee engelen in gesprek. Zij bevonden zich niet in de hemel maar ook niet op aarde; zij waren nergens. Het was volkomen donker, zo donker dat er zelfs geen duisternis was.',
    },
    {
      // https://www.dbnl.org/tekst/anbe001lexi01_01/lvlw00513.php
      label: 'Cees Nooteboom — Rituelen',
      text: 'Op de dag dat Inni Wintrop zelfmoord pleegde stonden de aandelen Philips op 149,60. Heeft dat iets met elkaar te maken? Misschien wel. De koers mag dan later gezakt zijn, hijzelf is nooit meer zo hoog gekomen.',
    },
    {
      // https://tatoeba.org/en/sentences/show/381332
      label: 'Nederlandse spreekwoorden',
      text: 'Al is de leugen nog zo snel, de waarheid achterhaalt haar wel. Wie het kleine niet eert, is het grote niet weerd. De morgenstond heeft goud in de mond. Wie een kuil graaft voor een ander, valt er zelf in.',
    },
    {
      // https://nl.wikipedia.org/wiki/De_donkere_kamer_van_Damokles
      label: 'W.F. Hermans — De Donkere Kamer van Damocles',
      text: 'Henri Osewoudt woonde in Voorschoten en was twaalf jaar toen zijn moeder zijn vader vermoordde. Het scheermes waarmee zij het deed was heel scherp, want zijn vader was kapper van beroep.',
    },
    {
      label: 'De reiziger — A journey through the Netherlands',
      text: 'De reiziger zat alleen in de trein naar het noorden van het land. Buiten het raam bewogen de velden langzaam voorbij, groen en vlak tot aan de horizon, met hier en daar een molen die draaide in de wind.',
    },
  ],
  pt: [
    {
      // http://arquivopessoa.net/textos/163
      label: 'Pessoa — Tabacaria',
      text: 'Não sou nada. Nunca serei nada. Não posso querer ser nada. À parte isso, tenho em mim todos os sonhos do mundo.',
    },
    {
      // https://www.escritas.org/pt/t/1552/x-mar-portugues
      label: 'Pessoa — Mar Português',
      text: 'Ó mar salgado, quanto do teu sal são lágrimas de Portugal! Por te cruzarmos, quantas mães choraram, quantos filhos em vão rezaram! Quantas noivas ficaram por casar para que fosses nosso, ó mar! Valeu a pena? Tudo vale a pena se a alma não é pequena. Quem quer passar além do Bojador tem que passar além da dor. Deus ao mar o perigo e o abismo deu, mas nele é que espelhou o céu.',
    },
    {
      // http://arquivopessoa.net/textos/1463
      label: 'Pessoa (Alberto Caeiro) — O Guardador de Rebanhos, II',
      text: 'O meu olhar é nítido como um girassol. Tenho o costume de andar pelas estradas olhando para a direita e para a esquerda, e de vez em quando olhando para trás… E o que vejo a cada momento é aquilo que nunca antes eu tinha visto, e eu sei dar por isso muito bem… Sinto-me nascido a cada momento para a eterna novidade do Mundo…',
    },
    {
      // https://oslusiadas.org/i/
      label: 'Camões — Os Lusíadas, Canto I',
      text: 'As armas e os barões assinalados, que da ocidental praia Lusitana, por mares nunca de antes navegados, passaram ainda além da Taprobana, em perigos e guerras esforçados, mais do que prometia a força humana, e entre gente remota edificaram novo Reino, que tanto sublimaram.',
    },
    {
      // https://machadodeassis.net/texto/memorias-postumas-de-bras-cubas/5985
      label: 'Machado de Assis — Memórias Póstumas de Brás Cubas',
      text: 'Algum tempo hesitei se devia abrir estas memórias pelo princípio ou pelo fim, isto é, se poria em primeiro lugar o meu nascimento ou a minha morte. Suposto o uso vulgar seja começar pelo nascimento, duas considerações me levaram a adotar diferente método: a primeira é que eu não sou propriamente um autor defunto, mas um defunto autor, para quem a campa foi outro berço.',
    },
    {
      // https://machadodeassis.net/texto/dom-casmurro/11503
      label: 'Machado de Assis — Dom Casmurro',
      text: 'Uma noite destas, vindo da cidade para o Engenho Novo, encontrei no trem da Central um rapaz aqui do bairro, que eu conheço de vista e de chapéu. Cumprimentou-me, sentou-se ao pé de mim, falou da Lua e dos ministros, e acabou recitando-me versos. A viagem era curta, e os versos pode ser que não fossem inteiramente maus.',
    },
    {
      // https://professordiegodelpasso.wordpress.com/wp-content/uploads/2016/05/ensaio-sobre-a-cegueira1.pdf
      label: 'Saramago — Ensaio sobre a Cegueira',
      text: 'O disco amarelo iluminou-se. Dois dos automóveis da frente aceleraram antes que o sinal vermelho aparecesse. Na passadeira de peões surgiu o desenho do homem verde. A gente que esperava começou a atravessar a rua pisando as faixas brancas pintadas na capa negra do asfalto, não há nada que menos se pareça com uma zebra, porém assim lhe chamam.',
    },
    {
      // https://armazemdetexto.blogspot.com/2025/02/romance-memorial-do-convento-capi.html
      label: 'Saramago — Memorial do Convento',
      text: 'D. João, quinto do nome na tabela real, irá esta noite ao quarto de sua mulher, D. Maria Ana Josefa, que chegou há mais de dois anos da Áustria para dar infantes à coroa portuguesa e até hoje ainda não emprenhou.',
    },
    {
      // https://www.curso-objetivo.br/vestibular/assets/download/obras-literarias/eca-de-queiros/os-maias.pdf
      label: 'Eça de Queirós — Os Maias',
      text: 'A casa que os Maias vieram habitar em Lisboa, no outono de 1875, era conhecida na vizinhança da rua de S. Francisco de Paula, e em todo o bairro das Janelas Verdes, pela casa do Ramalhete ou simplesmente o Ramalhete.',
    },
    {
      // https://www.citador.pt/poemas/ser-poeta-florbela-de-alma-conceicao-espanca
      label: 'Florbela Espanca — Ser Poeta',
      text: 'Ser Poeta é ser mais alto, é ser maior do que os homens! Morder como quem beija! É ser mendigo e dar como quem seja Rei do Reino de Aquém e de Além Dor! É ter de mil desejos o esplendor e não saber sequer que se deseja! É ter cá dentro um astro que flameja, é ter garras e asas de condor!',
    },
    {
      // https://www.culturagenial.com/poema-e-agora-jose-carlos-drummond-de-andrade/
      label: 'Carlos Drummond de Andrade — José',
      text: 'E agora, José? A festa acabou, a luz apagou, o povo sumiu, a noite esfriou, e agora, José? e agora, você? você que é sem nome, que zomba dos outros, você que faz versos, que ama, protesta? e agora, José?',
    },
    {
      // https://www.viniciusdemoraes.com.br/br/poesia/texto/106/soneto-de-fidelidade
      label: 'Vinícius de Moraes — Soneto de Fidelidade',
      text: 'De tudo, ao meu amor serei atento antes, e com tal zelo, e sempre, e tanto que mesmo em face do maior encanto dele se encante mais meu pensamento. Quero vivê-lo em cada vão momento e em louvor hei de espalhar meu canto e rir meu riso e derramar meu pranto ao seu pesar ou seu contentamento.',
    },
    {
      // https://www.culturagenial.com/analise-poema-vou-me-embora-pra-pasargada-manuel-bandeira/
      label: 'Manuel Bandeira — Vou-me Embora pra Pasárgada',
      text: 'Vou-me embora pra Pasárgada, lá sou amigo do rei. Lá tenho a mulher que eu quero na cama que escolherei. Vou-me embora pra Pasárgada, aqui eu não sou feliz. Lá a existência é uma aventura de tal modo inconsequente que Joana a Louca de Espanha, rainha e falsa demente, vem a ser contraparente da nora que nunca tive.',
    },
    {
      // https://www.ileel.ufu.br/lexicoSertanista/arquivos/43b0ce78-34a9-461d-b8c5-55ee0b0e5528_Grande%20Sert%C3%A3o%20Veredas.pdf
      label: 'Guimarães Rosa — Grande Sertão: Veredas',
      text: 'Nonada. Tiros que o senhor ouviu foram de briga de homem não, Deus esteja. Alvejei mira em árvore, no quintal, no baixo do córrego. Por meu acerto. Todo dia isso faço, gosto; desde mal em minha mocidade.',
    },
    {
      // https://www.escritas.org/pt/t/1505/retrato
      label: 'Cecília Meireles — Retrato',
      text: 'Eu não tinha este rosto de hoje, assim calmo, assim triste, assim magro, nem estes olhos tão vazios, nem o lábio amargo. Eu não tinha estas mãos sem força, tão paradas e frias e mortas; eu não tinha este coração que nem se mostra. Eu não dei por esta mudança, tão simples, tão certa, tão fácil: em que espelho ficou perdida a minha face?',
    },
    {
      // http://claricelispector.blogspot.com/2008/04/hora-da-estrela-1-parte.html
      label: 'Clarice Lispector — A Hora da Estrela',
      text: 'Tudo no mundo começou com um sim. Uma molécula disse sim a outra molécula e nasceu a vida. Mas antes da pré-história havia a pré-história da pré-história e havia o nunca e havia o sim. Sempre houve. Não sei o quê, mas sei que o universo jamais começou.',
    },
    {
      // https://jornal.usp.br/cultura/em-terra-sonambula-poesia-se-eleva-de-ruinas-materiais-e-espirituais/
      label: 'Mia Couto — Terra Sonâmbula',
      text: 'Naquele lugar, a guerra tinha morto a estrada. Pelos caminhos só as hienas se arrastavam, focinhando entre cinzas e poeiras. A paisagem se mestiçara de tristezas nunca vistas, em cores que se pegavam à boca. Eram cores sujas, tão sujas que tinham perdido toda a leveza, esquecidas da ousadia de levantar asas pelo azul.',
    },
    {
      // https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm
      label: 'Constituição da República Federativa do Brasil — Preâmbulo',
      text: 'Nós, representantes do povo brasileiro, reunidos em Assembleia Nacional Constituinte para instituir um Estado Democrático, destinado a assegurar o exercício dos direitos sociais e individuais, a liberdade, a segurança, o bem-estar, o desenvolvimento, a igualdade e a justiça como valores supremos de uma sociedade fraterna, pluralista e sem preconceitos, fundada na harmonia social e comprometida, na ordem interna e internacional, com a solução pacífica das controvérsias.',
    },
  ],
  ro: [
    {
      label: 'Romanian folklore',
      text: 'A fost un om care a mers prin lume si a aflat acolo lucruri minunate pe care nimeni nu le vedea',
    },
    {
      label: 'History and honor',
      text: 'Regele a condus poporul prin vremuri grele cu onoare si devotament pentru poporul sau',
    },
    {
      label: 'Poetry — Longing and starlight',
      text: 'Trecut au ani de dor ce aveau viitor si noaptea lor a fost un vis frumos sub lumina cerului',
    },
    {
      label: 'Nature — Romanian landscape',
      text: 'Dealuri verzi si pădure verde unde soarele apare frumos si norii se duc pe cerul albastru',
    },
  ],
  sv: [
    {
      // https://archive.org/details/nilsholgerssons00lybegoog
      label: 'Lagerlöf — Nils Holgerssons underbara resa',
      text: 'Det var en gång en pojke. Han var så där en fjorton år gammal, lång och ranglig. Han hade mest av allt lust att sova och äta.',
    },
    {
      // https://www.gutenberg.org/files/57052/57052-h/57052-h.htm
      label: 'Strindberg — Röda rummet',
      text: 'Det var en afton i början av maj. Över tak och torn i den lilla stad sken en röd sol. Folk gick hem genom gata och gränd.',
    },
    {
      // https://www.astridlindgren.com/
      label: 'Lindgren — Pippi Långstrump',
      text: 'I en liten stad låg en gammal trädgård. Där stod ett hus och i det var en flicka som hette Pippi. Hon var nio år och så stark att hon kunde lyfta en häst med en hand.',
    },
    {
      // https://runeberg.org/berling/i01.html
      label: 'Lagerlöf — Gösta Berlings saga',
      text: 'Till slut stod han framför folk i kyrka. Han var ung och hög och vacker. Han hade djup blick och fast haka. Allt hos honom var fint och full av eld.',
    },
    {
      // https://hejsweden.com/en/swedish-national-anthem-lyrics-swedish-english/
      label: 'Du gamla, du fria — Sveriges nationalsång',
      text: 'Du gamla, du fria, du fjällhöga nord, du tysta, du glädjerika sköna! Jag hälsar dig, vänaste land uppå jord, din sol, din himmel, dina ängder gröna. Du tronar på minnen från fornstora dar, då ärat ditt namn flög över jorden.',
    },
    {
      // https://www.textalk.se/klassisk-svensk-litteratur/Hjalmar-Soderberg-Doktor-Glas.html
      label: 'Hjalmar Söderberg — Doktor Glas',
      text: 'Jag har aldrig sett en sådan sommar. Rötmånadshetta sedan i mitten av maj. Hela dagen står ett tjockt töcken av damm alldeles stilla över gatorna och torgen.',
    },
    {
      // https://www.lyrikline.org/en/poems/romanska-bagar-7605
      label: 'Tomas Tranströmer — Romanska bågar',
      text: 'Inne i den väldiga romanska kyrkan trängdes turisterna i halvmörkret. Valv gapande bakom valv och ingen överblick. Några ljuslågor fladdrade. En ängel utan ansikte omfamnade mig och viskade genom hela kroppen: Skäms inte för att du är människa, var stolt!',
    },
    {
      // https://www.karinboye.se/verk/dikter/dikter/i-rorelse.shtml
      label: 'Karin Boye — I rörelse',
      text: 'Den mätta dagen, den är aldrig störst. Den bästa dagen är en dag av törst. Nog finns det mål och mening i vår färd, men det är vägen, som är mödan värd. Bryt upp, bryt upp! Den nya dagen gryr. Oändligt är vårt stora äventyr.',
    },
    {
      // https://www.lyrikline.org/en/poems/schubertiana-7604
      label: 'Tomas Tranströmer — Schubertiana',
      text: 'I kvällsmörkret på en plats utanför New York, en utsiktspunkt där man med en enda blick kan omfatta åtta miljoner människors hem. Jättestaden där borta är en lång flimrande driva, en spiralgalax från sidan.',
    },
    {
      // https://sv.wikipedia.org/wiki/Dvärgen
      label: 'Pär Lagerkvist — Dvärgen',
      text: 'Jag är tjugosex tum lång, välvuxen och väl proportionerad, min stora hjässa har det ädlaste omfång. Mitt ansikte är ädelt och värdigt, fast de flesta tycker det är fult.',
    },
    {
      // https://litteraturbanken.se/txt/lb999200147/lb999200147.pdf
      label: 'August Strindberg — Fadren',
      text: 'Kort och gott: är du far till barnet eller inte? Hur ska en kunna veta det? Vad för slag? Kan du inte veta det? Nej, si det kan en då aldrig veta.',
    },
    {
      // https://en.wikipedia.org/wiki/Carl_Michael_Bellman
      label: 'Carl Michael Bellman — Fjäriln vingad syns på Haga',
      text: 'Fjäriln vingad syns på Haga, mellan dimmors frost och dun, sig sitt gröna skjul tillaga, och i blomman, sin paulun. Minsta kräk i kärr och syra, nyss av solens värma väckt, till en ny högtidlig yra eldas vid Zephyrens fläkt.',
    },
    {
      // https://en.wikipedia.org/wiki/Faceless_Killers
      label: 'Henning Mankell — Mördare utan ansikte',
      text: 'Han vaknade av att telefonen ringde. Han tittade på klockan på nattduksbordet innan han svarade. Kvart över fem. Ett samtal vid den här tiden betyder alltid att det har hänt något.',
    },
    {
      // https://en.wikipedia.org/wiki/The_Girl_with_the_Dragon_Tattoo
      label: 'Stieg Larsson — Män som hatar kvinnor',
      text: 'Det var en kall fredagskväll i november. Henrik Vanger hade just fyllt åttiotvå år. Han satt i sin arbetsrum i det stora huset på Hedeby-ön och väntade som varje år på ett telefonsamtal som han visste aldrig skulle komma.',
    },
    {
      // https://www.gutenberg.org/ebooks/11940 (Moberg)
      label: 'Vilhelm Moberg — Utvandrarna',
      text: 'Det var tunga tider i Ljuder socken. Nöden var stor bland de små bönderna och torpen gick inte att bruka. Karl Oskar Nilsson hade fyra små barn och en hustru som hette Kristina, och alla gick hungriga.',
    },
    {
      // https://svenskadikter.com/Gustaf_Fröding
      label: 'Gustaf Fröding — En morgondröm',
      text: 'Jag drömde en morgon en underbar dröm, om sommar och sol, om en blommande ström, om ängar och lundar och fågelsång, och sällsam musik med förunderlig klang.',
    },
    {
      // https://en.wikipedia.org/wiki/Erik_Axel_Karlfeldt
      label: 'Erik Axel Karlfeldt — Fridolins lustgård',
      text: 'Längtan heter min arvedel, gåvan av min faders ätt, bittert löje och sorgsen fest, sorgsen fest och bittert löje, eld som tär sitt eget bränsle, fåfäng väntan, fåfäng färd.',
    },
    {
      // https://www.skaparportalen.se/post/300-svenska-ordspråk-och-talesätt
      label: 'Svenska ordspråk',
      text: 'Den som väntar på något gott väntar aldrig för länge. Bättre sent än aldrig. Övning ger färdighet. Den som gapar efter mycket mister ofta hela stycket. Borta bra men hemma bäst.',
    },
  ],
  sw: [
    {
      // https://en.wikipedia.org/wiki/Ee_Mungu_Nguvu_Yetu
      label: 'Wimbo wa Taifa — Kenya National Anthem',
      text: 'Ee Mungu nguvu yetu baraka kwetu. Haki iwe ngao na mlinzi na undugu amani na uhuru raha na ustawi.',
    },
    {
      // https://swahiliproverbs.afrst.illinois.edu/
      label: 'Methali za Kiswahili — Swahili Proverbs',
      text: 'Haraka haraka haina baraka. Akili ni mali. Umoja ni nguvu na utengano ni udhaifu. Dawa ya moto ni moto. Penye nia pana njia. Haba na haba hujaza kibaba. Pole pole ndio mwendo.',
    },
    {
      // Inspired by Nyerere's Azimio la Arusha (1967)
      label: 'Azimio la Arusha — Ujamaa na Kujitegemea',
      text: 'Watu wote ni sawa. Kila mtu ana haki ya kuishi kwa amani na uhuru. Elimu ni muhimu kwa maendeleo ya nchi yetu. Kazi ni kitu bora zaidi kuliko fedha. Umoja ni nguvu na utengano ni udhaifu.',
    },
    {
      // https://swahiliproverbs.afrst.illinois.edu/
      label: 'Methali za Kiswahili — More Proverbs',
      text: 'Asante ya punda ni mateke. Mwenye kiu husafiri. Usipoziba ufa utajenga ukuta. Haba na haba hujaza kibaba. Yaliyopita si ndwele.',
    },
  ],
  vi: [
    {
      // https://vietnamesetypography.com/samples/truyen-kieu/
      label: 'Nguyễn Du — Truyện Kiều',
      text: 'Trăm năm trong cõi người ta, chữ tài chữ mệnh khéo là ghét nhau. Trải qua một cuộc bể dâu, những điều trông thấy mà đau đớn lòng. Lạ gì bỉ sắc tư phong, trời xanh quen thói má hồng đánh ghen. Cảo thơm lần giở trước đèn, phong tình cổ lục còn truyền sử xanh.',
    },
    {
      // https://www.thivien.net/Hồ-Xuân-Hương/Bánh-trôi-nước/poem-uWq3KGCd3SUUse06kE6PYA
      label: 'Hồ Xuân Hương — Bánh trôi nước',
      text: 'Thân em vừa trắng lại vừa tròn, bảy nổi ba chìm với nước non. Rắn nát mặc dầu tay kẻ nặn, mà em vẫn giữ tấm lòng son.',
    },
    {
      // https://www.thivien.net/Bà-huyện-Thanh-Quan/Qua-Đèo-Ngang/poem-9f1Hth0gmM_PXzGNXg5Fog
      label: 'Bà Huyện Thanh Quan — Qua đèo Ngang',
      text: 'Bước tới Đèo Ngang bóng xế tà, cỏ cây chen đá lá chen hoa. Nhớ nước đau lòng con quốc quốc, thương nhà mỏi miệng cái gia gia. Dừng chân đứng lại trời non nước, một mảnh tình riêng ta với ta.',
    },
    {
      // https://www.thivien.net/Hồ-Xuân-Hương/Thơ-tự-tình/poem-ZG1snfgbwBOBCSAnwp2z4w
      label: 'Hồ Xuân Hương — Tự tình II',
      text: 'Đêm khuya văng vẳng trống canh dồn. Chén rượu hương đưa say lại tỉnh, vầng trăng bóng xế khuyết chưa tròn. Đâm toạc chân mây đá mấy hòn. Ngán nỗi xuân đi xuân lại lại, mảnh tình san sẻ tí con con.',
    },
  ],
  yue: [
    {
      // https://eastasiastudent.net/china/classical/li-bai-jiang-jin-jiu/
      label: '李白 — 將進酒',
      text: '君 不 見 黃 河 之 水 天 上 來 奔 流 到 海 不 復 回 君 不 見 高 堂 明 鏡 悲 白 髮 朝 如 青 絲 暮 成 雪 人 生 得 意 須 盡 歡 莫 使 金 樽 空 對 月 天 生 我 材 必 有 用 千 金 散 盡 還 復 來',
    },
    {
      // https://eastasiastudent.net/china/classical/su-shi-water-song/
      label: '蘇軾 — 水調歌頭',
      text: '明 月 幾 時 有 把 酒 問 青 天 不 知 天 上 宮 闕 今 夕 是 何 年 我 欲 乘 風 歸 去 惟 恐 瓊 樓 玉 宇 高 處 不 勝 寒 起 舞 弄 清 影 何 似 在 人 間',
    },
    {
      // https://chinesepoemsinenglish.blogspot.com/2013/11/wang-wei-farewell.html
      label: '王維 — 送別',
      text: '山 中 相 送 罷 日 暮 掩 柴 扉 春 草 明 年 綠 王 孫 歸 不 歸',
    },
    {
      // https://ctext.org/analects (traditional characters for Cantonese)
      label: '論語 — 學而篇',
      text: '學 而 時 習 之 不 亦 說 乎 有 朋 自 遠 方 來 不 亦 樂 乎 人 不 知 而 不 慍 不 亦 君 子 乎 三 人 行 必 有 我 師 焉 擇 其 善 者 而 從 之 其 不 善 者 而 改 之',
    },
  ],
  zh: [
    {
      label: 'Li Bai — Quiet Night Thought & Drinking Alone',
      text: '床 前 明 月 光 疑 是 地 上 霜 举 头 望 明 月 低 头 思 故 乡 花 间 一 壶 酒 独 酌 无 相 亲 举 杯 邀 明 月 对 影 成 三 人',
    },
    {
      // https://ctext.org/analects
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
