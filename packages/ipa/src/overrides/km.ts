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
  ជាលំដាប់: '/cie lɔmɗaap/', // successively
  // --- Preah Chinawong ---
  ជិន: '/cɨn/', // Jin (proper name element)
  ជិនវង្ส: '/cɨn wɔŋ/', // Chinawong (proper name)
  ជូ: '/cuu/', // proper (literary)
  ញាក់: '/ɲeak/', // to startle, twitch
  ញាក់ចិញ្ចើម: '/ɲeak cəɲcaəm/', // to raise eyebrows
  ដែន: '/daen/', // territory
  ណាយ: '/naay/', // to yearn
  ណាយចិត្ត: '/naay cət/', // heart yearns
  តប: '/tɑp/', // to reply
  ថ្កាន: '/tkaan/', // magnificent (literary)
  ថ្កើង: '/tkəəŋ/', // to glorify
  ថ្កើងថ្កាន: '/tkəəŋ tkaan/', // glorious, magnificent
  ថ្នូរ: '/tnoo/', // dignity, nobility
  ថ្នែ: '/tnae/', // aspect (partial segmentation of ថ្នែក)
  ថ្នែក: '/tnaek/', // aspect, class
  ថ្វាត់: '/twat/', // harshly
  ទត: '/tɔt/', // to look, behold (royal)
  ទាវ: '/tiew/', // Teav (proper name)
  ទុក្ខ: '/tuk/', // suffering (dukkha)
  ទុក្ខវេទនា: '/tukweetɑɑnie/', // suffering
  ទូល: '/tuul/', // to inform (royal register)
  ទេព្តា: '/teepɗaa/', // devas, celestial beings
  នរបតី: '/nɔrɔpaɗəy/', // sovereign, king
  នាវ: '/niew/', // Nav (proper name)
  និម៌ល: '/nɨmmɔl/', // pure, immaculate
  បំផ្លាញ: '/bɑmpʰlieɲ/', // to destroy
  បំផ្លិច: '/bɑmpʰləc/', // to demolish
  បពិត្រ: '/bɑpɨt/', // lord, sir (polite address)
  បុត្រ: '/ɓot/', // son
  // --- Chbab Srey (Code for Women) ---
  ប្រដៅ: '/prɑɗaw/', // to advise, counsel
  ប្រណី: '/prɑnəy/', // loving, affectionate
  ប្រាជ្ញ: '/praac/', // wisdom
  ប្រាសាទ: '/praasaat/', // temple, palace
  ពិរោធ: '/piroot/', // anger
  ពុំ: '/pum/', // not (literary)
  ពុំជូ: '/pum cuu/', // not proper
  ព្យាបាទ: '/pjiebaat/', // malice
  ព្រះមហេសី: '/preah mɔheesəy/', // queen consort (with ព្រះ)
  ព្រះរាជបុត្រ: '/preah riec ɓot/', // prince (with ព្រះ)
  ព្រះរាជា: '/preah riecie/', // the king
  ភ័ក្រ្ត: '/pʰeak/', // face (royal register)
  ភាតរ: '/pʰietɑɑ/', // brother (standalone; final រ silent)
  ភាតរភាព: '/pʰietɑɑrɑpʰiep/', // brotherhood
  ភ្ញា: '/pɲie/', // to awaken
  មង្គល: '/mɔŋkɔl/', // auspicious
  មហា: '/mɔhaa/', // great (prefix)
  មហាក្សត្រ: '/mɔhaa ksaat/', // great king, maharaja
  មហាជាតិ: '/mɔhaa ciet/', // great nation
  មហេសី: '/mɔheesəy/', // queen consort
  រាជ: '/riec/', // royal
  រាជបុត្រ: '/riec ɓot/', // prince
  រាជា: '/riecie/', // king
  រុង: '/ruŋ/', // to shine
  រុងរឿង: '/ruŋ rɨəŋ/', // brilliant, prosperous
  លំដាប់: '/lɔmɗaap/', // successively, in order
  វង្ស: '/wɔŋ/', // dynasty, lineage
  វិចារណញ្ញាណ: '/wicaarɑɲɲaan/', // discernment
  វេទនា: '/weetɑɑnie/', // pain (vedana)
  សតិ: '/saʔteʔ/', // consciousness, mindfulness
  សតិសម្បជញ្ញៈ: '/saʔteʔ sampaʔcʊəɲɲeaʔ/', // conscience
  សម្បជញ្ញៈ: '/sampaʔcʊəɲɲeaʔ/', // awareness
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
  ស្នំ: '/snɑm/', // concubine
  ហត្ថា: '/hatɑɑtʰaa/', // hand (literary)
  // --- Constitution Preamble ---
  អង្គរ: '/ʔɑŋkɔɔ/', // Angkor
  អរ: '/ʔɑɑ/', // to rejoice
  អស្ចារ្យ: '/ʔɑscaa/', // wonderful, marvelous
  អាល: '/ʔaal/', // to rush, boast
  អួត: '/ʔuət/', // to boast
  ឱ្យ: '/ʔaoy/', // to give, let
};
