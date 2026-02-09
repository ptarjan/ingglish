import { THE_CHAOS_LINES } from './the-chaos-lines';

export interface Poem {
  title: string;
  author: string;
  year: string;
  lines: string[];
}

const theChaos: Poem = {
  title: 'The Chaos',
  author: 'Gerard Nolst Trenit\u00e9',
  year: '1922',
  lines: THE_CHAOS_LINES,
};

const ourStrangeLingo: Poem = {
  title: 'Our Strange Lingo',
  author: 'Lord Cromer',
  year: '1902',
  lines: [
    'When the English tongue we speak,',
    'Why is break not rhymed with freak?',
    "Will you tell me why it's true",
    'We say sew but likewise few?',
    'And the maker of the verse,',
    'Cannot rhyme his horse with worse?',
    'Beard is not the same as heard',
    'Cord is different from word.',
    'Cow is cow but low is low',
    'Shoe is never rhymed with foe.',
    'Think of hose, dose, and lose',
    'And think of goose and yet with choose',
    'Think of comb, tomb and bomb,',
    'Doll and roll or home and some.',
    'Since pay is rhymed with say',
    'Why not paid with said I pray?',
    'Think of blood, food and good.',
    'Mould is not pronounced like could.',
    'Wherefore done, but gone and lone',
    'Is there any reason known?',
    'To sum up all, it seems to me',
    "Sound and letters don't agree.",
  ],
};

const iTakeIt: Poem = {
  title: 'I Take It You Already Know',
  author: 'T.S. Watt',
  year: '1954',
  lines: [
    'I take it you already know',
    'Of tough and bough and cough and dough?',
    'Others may stumble but not you',
    'On hiccough, thorough, slough and through.',
    'Well done! And now you wish perhaps,',
    'To learn of less familiar traps?',
    '',
    'Beware of heard, a dreadful word',
    'That looks like beard and sounds like bird.',
    "And dead, it's said like bed, not bead-",
    "For goodness' sake don't call it 'deed'!",
    'Watch out for meat and great and threat',
    '(They rhyme with suite and straight and debt).',
    '',
    'A moth is not a moth in mother,',
    'Nor both in bother, broth, or brother,',
    'And here is not a match for there,',
    'Nor dear and fear for bear and pear,',
    "And then there's doze and rose and lose-",
    'Just look them up- and goose and choose,',
    'And cork and work and card and ward',
    'And font and front and word and sword,',
    'And do and go and thwart and cart-',
    "Come, I've hardly made a start!",
    'A dreadful language? Man alive!',
    "I'd learned to speak it when I was five!",
    'And yet to write it, the more I sigh,',
    "I'll not learn how 'til the day I die.",
  ],
};

const whyEnglishIsHard: Poem = {
  title: 'Why English Is So Hard',
  author: 'Anonymous',
  year: 'Traditional',
  lines: [
    "We'll begin with a box, and the plural is boxes,",
    'But the plural of ox becomes oxen, not oxes.',
    'One fowl is a goose, but two are called geese,',
    'Yet the plural of moose should never be meese.',
    'You may find a lone mouse or a nest full of mice,',
    'Yet the plural of house is houses, not hice.',
    '',
    'If the plural of man is always called men,',
    "Why shouldn't the plural of pan be called pen?",
    'If I speak of my foot and show you my feet,',
    'And I give you a boot, would a pair be called beet?',
    'If one is a tooth and a whole set are teeth,',
    "Why shouldn't the plural of booth be called beeth?",
    '',
    'Then one may be that, and three would be those,',
    'Yet hat in the plural would never be hose,',
    'And the plural of cat is cats, not cose.',
    'We speak of a brother and also of brethren,',
    'But though we say mother, we never say methren.',
    'Then the masculine pronouns are he, his and him,',
    'But imagine the feminine: she, shis and shim!',
  ],
};

export const poems: Poem[] = [theChaos, ourStrangeLingo, iTakeIt, whyEnglishIsHard];
