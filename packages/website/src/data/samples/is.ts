import type { Sample } from './types';

export const is: Sample[] = [
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
    label: 'Halldór Laxness — Íslandsklukkan',
    source:
      'https://gljufrasteinn.is/is/halldor_laxness/vi_og_verk_halldors_kiljans_laxness/ritverk/slandsklukkan/',
    text: 'Hef ég drepið mann eða hef ég ekki drepið mann? Hver hefur drepið mann og hver hefur ekki drepið mann? Hvenær drepur maður mann og hvenær drepur maður ekki mann? Fari í helvíti sem ég drap mann. Og þó.',
  },
  {
    // https://sagadb.org/brennu-njals_saga.is (ch. 1)
    label: 'Njáls saga — Opening',
    text: 'Mörður hét maður er kallaður var gígja. Hann var sonur Sighvats hins rauða. Hann bjó á Völlum í Rangárvallasýslu. Hann var ríkur höfðingi en mikill lögmaður.',
  },
  {
    label: 'Egils saga — Opening',
    source: 'https://sagadb.org/egils_saga.is',
    text: 'Úlfur hét maður, sonur Bjálfa og Hallberu, dóttur Úlfs hins óarga. Hún var systir Hallbjarnar hálftrölls í Hrafnistu, föður Ketils hængs.',
  },
  {
    label: 'Laxdæla saga — Opening',
    source: 'https://sagadb.org/laxdaela_saga.is',
    text: 'Ketill flatnefur hét maður son Bjarnar bunu. Hann var hersir ríkur í Noregi og kynstór. Hann bjó í Raumsdal í Raumsdælafylki.',
  },
  {
    label: 'Völuspá — Poetic Edda',
    source: 'https://www.voluspa.org/literal/voluspa.htm',
    text: 'Hljóðs bið ek allar helgar kindir, meiri ok minni mögu Heimdallar. Viltu at ek, Valföðr, vel fyr telja forn spjöll fira, þau er fremst of man.',
  },
  {
    label: 'Grettis saga — Opening',
    source: 'https://sagadb.org/grettis_saga.is',
    text: 'Önundur hét maður. Hann var Ófeigsson burlufóts Ívarssonar beytils. Önundur var bróðir Guðbjargar, móður Guðbrands kúlu, föður Ástu, móður Ólafs konungs hins helga.',
  },
  {
    label: 'Eyrbyggja saga — Opening',
    source: 'https://sagadb.org/eyrbyggja_saga.is',
    text: 'Ketill flatnefur hét einn ágætur hersir í Noregi. Hann var sonur Bjarnar bunu Grímssonar hersis úr Sogni. Ketill var kvongaður. Hann átti Yngveldi, dóttur Ketils veðurs hersis af Raumaríki.',
  },
  {
    label: 'Halldór Laxness — Sjálfstætt fólk',
    source: 'https://en.wikipedia.org/wiki/Independent_People',
    text: 'En þá er norrænir menn settust hér að, flýðu hinir vestrænu galdursmenn landið, og telja fornrit að Kólumkilli hafi í hefndarskyni lagt á þjóð þá hina nýu að hún skyldi í þessu landi aldrei þrífast.',
  },
  {
    label: 'Jónas Hallgrímsson — Ísland',
    source: 'https://digicoll.library.wisc.edu/Jonas/Island/Island.html',
    text: 'Ísland, farsælda frón og hagsælda hrímhvíta móðir! Hvar er þín fornaldar frægð, frelsið og manndáðin best? Landið var fagurt og frítt og fannhvítir jöklanna tindar, himinninn heiður og blár, hafið var skínandi bjart.',
  },
  {
    label: 'Snorri Sturluson — Gylfaginning',
    source: 'https://heimskringla.no/wiki/Gylfaginning',
    text: 'Gylfi konungr réð þar löndum er nú heitir Svíþjóð. Frá honum er þat sagt at hann gaf einni farandi konu at launum skemmtunar sinnar eitt plógsland í ríki sínu þat er fjórir öxn drægi upp dag ok nótt.',
  },
  {
    label: 'Baldrs draumar — Poetic Edda',
    source: 'https://www.voluspa.org/literal/baldrsdraumar.htm',
    text: 'Senn vöru ásir allir í þingi ok ásynjur allar í máli, ok um þat ráðu rækir tívar, hví væri Baldri ballir draumar. Upp reis Óðinn, alda gautr, ok hann á Sleipni söðul of lagði.',
  },
  {
    label: 'Lofsöngur — Íslands þjóðsöngur',
    source: 'https://nationalanthems.info/is.htm',
    text: 'Ó, guð vors lands! Ó, lands vors guð! Vér lofum þitt heilaga, heilaga nafn! Úr sólkerfum himnanna hnýta þér krans þínir herskarar, tímanna safn.',
  },
  {
    label: 'Hrafnkels saga Freysgoða — Opening',
    source: 'https://sagadb.org/hrafnkels_saga_freysgoða.is',
    text: 'Það var á dögum Haralds konungs hins hárfagra að maður bjó í Fljótsdal sem Hallfreður hét. Hann nam Hrafnkelsdal allan upp frá Lagarfljóti. Hrafnkell var sonur Hallfreðs. Hrafnkell reisti hof mikið og eflaði blót stór.',
  },
  {
    label: 'Vatnsdæla saga — Opening',
    source: 'https://sagadb.org/vatnsdaela_saga.is',
    text: 'Maður er nefndur Ketill og var kallaður raumur. Hann var ríkur maður. Hann bjó á þeim bæ er í Raumsdal heitir.',
  },
  {
    label: 'Snorri Sturluson — Heimskringla',
    source: 'https://heimskringla.no/wiki/Ynglinga_saga',
    text: 'Kringla heimsins, sú er mannfólkit byggir, er mjök vágskorin; ganga höf stór or útsjánum inn í jörðina. Er þat kunnigt, at haf gengr frá Nörvasundum ok alt út til Jórsalalands.',
  },
  {
    label: 'Víga-Glúms saga — Opening',
    source: 'https://sagadb.org/viga-glums_saga.is',
    text: 'Ingjaldur hét maður, sonur Helga hins magra. Hann bjó að Þverá í Eyjafirði. Hann var forn goðorðsmaður og höfðingi mikill og þá aldraður mjög er sagan gerðist.',
  },
  {
    label: 'Bandamanna saga — Opening',
    source: 'https://sagadb.org/bandamanna_saga.is',
    text: 'Ófeigur hét maður er bjó vestur í Miðfirði á þeim bæ er að Reykjum heitir. Hann var Skíðason en móðir hans hét Gunnlaug.',
  },
  {
    label: 'Kormáks saga — Opening',
    source: 'https://sagadb.org/kormaks_saga.is',
    text: 'Haraldur konungur hinn hárfagri réð fyrir Noregi þá er saga sjá gerðist. Í þann tíma var sá höfðingi í ríkinu er Kormákur hét, víkverskur að ætt, ríkur og kynstór.',
  },
  {
    label: 'Ari Þorgilsson — Íslendingabók',
    source: 'https://heimskringla.no/wiki/Íslendingabók',
    text: 'Ísland byggðist fyrst ór Norvegi á dögum Haralds ins hárfagra, Hálfdanarsonar ins svarta. Ingólfr hét maðr nórrænn, er sannliga er sagt, at færi fyrst þaðan til Íslands.',
  },
  {
    label: 'Fóstbræðra saga — Opening',
    source: 'https://sagadb.org/fostbraedra_saga.is',
    text: 'Á dögum hins helga Ólafs konungs voru margir höfðingjar undir hans konungdæmi, eigi aðeins í Noregi heldur í öllum löndum, þeim er hans konungdómur stóð yfir.',
  },
];
