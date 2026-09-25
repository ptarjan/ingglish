/**
 * Khmer IPA overrides for words not in the dictionary.
 *
 * Browser Intl.Segmenter implementations split Khmer text at different
 * boundaries than Node.js, so compound words must also have their
 * individual components listed as separate entries.
 */
export const km: Record<string, string> = {
  // --- UDHR Article 1 ---
  កំណើត: '/kɑmnaət/', // birth
  កល្យាណី: '/kaʔlyeanəy/', // beautiful, virtuous woman (Pali kalyāṇī)
  // --- Reamker (Ramayana) ---
  ក្ដី: '/kdəy/', // matter, affair
  ក្រេវ: '/kreew/', // furious
  ក្រេវក្រោធ: '/kreew krout/', // furiously angry
  ក្រោធ: '/krout/', // anger
  ក្ស: '/ks/', // consonant cluster (browser splits ក្សត្រី)
  ក្សត្រ: '/ksaat/', // king
  // --- Nokor Reach (National Anthem) ---
  ក្សត្រា: '/ksaatraa/', // king (literary form)
  ក្សត្រី: '/ksaatrəy/', // queen
  ខ្មី: '/kməy/', // ogre (literary)
  ខ្វើក: '/kwaək/', // to stir, disturb
  គាប់: '/koap/', // beloved
  // --- Tum Teav ---
  គូ: '/kuu/', // partner
  គូគាប់: '/kuu koap/', // partner, beloved
  ឃ្លាត: '/kliet/', // separated
  ចរ: '/cɑɑ/', // to walk, go
  ច្នេះ: '/cneh/', // this (literary)
  ជ័យ: '/cey/', // victory
  ជ័យមង្គល: '/cey mɔŋkɔl/', // victory, auspicious
  // --- Proverbs ---
  ជាក់: '/ceak/', // certain, sure
  ជូ: '/cuu/', // proper (literary)
  ញាក់: '/ɲeak/', // to startle, twitch
  ញាក់ចិញ្ចើម: '/ɲeak cəɲcaəm/', // to raise eyebrows
  ដែន: '/daen/', // territory
  ដ្ឋ: '/ɑɑt/', // part of រដ្ឋ "state" (browser splits off រ)
  ណាយ: '/naay/', // to yearn
  ណាយចិត្ត: '/naay cət/', // heart yearns
  តប: '/tɑp/', // to reply
  តាមលទ្ធិ: '/taam lʊttʰeʔ/', // according to the doctrine of
  ថ្កាន: '/tkaan/', // magnificent (literary)
  ថ្កើង: '/tkəəŋ/', // to glorify
  ថ្កើងថ្កាន: '/tkəəŋ tkaan/', // glorious, magnificent
  ថ្នូរ: '/tnoo/', // dignity, nobility
  ថ្នែ: '/tnae/', // aspect (partial segmentation of ថ្នែក)
  ថ្នែក: '/tnaek/', // aspect, class
  ថ្វាត់: '/twat/', // harshly
  ទត: '/tɔt/', // to look, behold (royal)
  // --- Gatilok (moral fables) ---
  ទាំងពួង: '/teaŋ puəŋ/', // all, the whole
  ទាវ: '/tiew/', // Teav (proper name)
  ទូល: '/tuul/', // to inform (royal register)
  ទេព្តា: '/teepɗaa/', // devas, celestial beings
  // --- Constitution, Article 1 ---
  ទ្រង់: '/trɔɔŋ/', // royal verb marker
  នរបតី: '/nɔrɔpaɗəy/', // sovereign, king
  នាវ: '/niew/', // Nav (proper name)
  និម៌ល: '/nɨmmɔl/', // pure, immaculate
  បញ្ចពិធ: '/pɑɲcɑpĭt/', // fivefold (Pali pañcavidha)
  បពិត្រ: '/bɑpɨt/', // lord, sir (polite address)
  បុត្រ: '/ɓot/', // son
  // --- Collection of Khmer Legends ---
  ប្ដី: '/ɓɗəy/', // husband
  ប្រជាធិបតេយ្យ: '/prɑciə tʰippɑɗɛj/', // democracy
  ប្រណី: '/prɑnəy/', // loving, affectionate
  ប្រតិបត្តិ: '/prɑtĕɓat/', // to practice, comply with
  ប្រាជ្ញ: '/praac/', // wisdom
  ប្រាជ្ញា: '/praacɲaa/', // wisdom
  ប្រាសាទ: '/praasaat/', // temple, palace
  ពហុបក្ស: '/pɔhoʔɓɑk/', // multi-party
  ពិរោធ: '/piroot/', // anger
  ពុំ: '/pum/', // not (literary)
  ពុំជូ: '/pum cuu/', // not proper
  ព្រះរាជា: '/preah riecie/', // the king
  ភ័ក្រ្ត: '/pʰeak/', // face (royal register)
  ភាតរ: '/pʰietɑɑ/', // brother (standalone; final រ silent)
  ភាតរភាព: '/pʰietɑɑrɑpʰiep/', // brotherhood
  ភ្ញា: '/pɲie/', // to awaken
  មង្គល: '/mɔŋkɔl/', // auspicious
  មហា: '/mɔhaa/', // great (prefix)
  មហាក្សត្រ: '/mɔhaa ksaat/', // great king, maharaja
  // --- Also exercised by the Khmer compound-decomposition tests below ---
  មហេសី: '/mɔheesəy/', // queen consort
  មាយា: '/maajie/', // deceit, guile
  ម្ដេច: '/mɗəc/', // how (contraction)
  រដ្ឋធម្មនុញ្ញ: '/rɔət tʰɔmmɔnuɲ/', // constitution
  រាជ: '/riec/', // royal
  រាជបុត្រ: '/riec ɓot/', // prince
  រាជា: '/riecie/', // king
  រុង: '/ruŋ/', // to shine
  រុងរឿង: '/ruŋ rɨəŋ/', // brilliant, prosperous
  លំអ: '/lumʔɑɑ/', // adornment, beauty
  វង្ស: '/wɔŋ/', // dynasty, lineage
  វិចារណញ្ញាណ: '/wicaarɑɲɲaan/', // discernment
  វេទនា: '/weetɑɑnie/', // pain (vedana)
  សតិ: '/saʔteʔ/', // consciousness, mindfulness
  សតិសម្បជញ្ញៈ: '/saʔteʔ sampaʔcʊəɲɲeaʔ/', // conscience
  សន្តិភាព: '/sɑntĕpʰiep/', // peace
  សម្បជញ្ញៈ: '/sampaʔcʊəɲɲeaʔ/', // awareness
  សម្ព័ន្ធ: '/sɑmpŭən/', // alliance
  សហាយ: '/sɑhaay/', // lover, paramour
  សាទរ: '/saatɔɔ/', // to welcome
  សិរី: '/serəy/', // glory (from Pali)
  សួ: '/suə/', // (first syllable of សួស្តី)
  សួស្តី: '/suəsdəy/', // greeting, well-being
  សេចក្ដី: '/sac kdəy/', // matter, affair
  សេចក្ដីថ្លៃថ្នូរ: '/sac kdəy tlay tnoo/', // dignity
  ស្ដេច: '/sdac/', // king
  ស្តាប់: '/sdaap/', // to listen
  ស្តី: '/sdəy/', // (second syllable of សួស្តី)
  ស្ទុះ: '/stuh/', // to rush
  ហត្ថា: '/hatɑɑtʰaa/', // hand (literary)
  អចិន្ត្រៃយ៍: '/ʔɑcɑntrɑj/', // eternal, permanent
  អធិបតេយ្យ: '/ʔatʰippɑɗɛj/', // sovereignty
  អព្យាក្រឹត: '/ʔɑpjiekrɨt/', // neutral
  // --- Proverbs & Nokor Reach (misc) ---
  អរ: '/ʔɑɑ/', // to rejoice
  អាល: '/ʔaal/', // to rush, boast
  អួត: '/ʔuət/', // to boast
  ឯករាជ្យ: '/ʔaekkɔriec/', // independence
  ឱ្យ: '/ʔaoy/', // to give, let
};
