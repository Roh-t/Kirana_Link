/**
 * Hinglish / romanized-Hindi -> English synonym map for Indian grocery
 * search. Fuzzy (edit-distance) matching only helps with SPELLING
 * mistakes of the same word ("atta" vs "aata"); it can never connect
 * "chawal" to "rice" because they are two entirely different words.
 * This map bridges that gap: when a user types a Hinglish/Hindi term,
 * we also search for its English equivalent(s), and vice versa.
 *
 * Keys are lowercase. Add more entries any time - the search
 * automatically picks up new ones on the next server restart.
 */
const SYNONYMS = {
  // staples / grains
  chawal: ["rice"], chaval: ["rice"], chaawal: ["rice"],
  gehu: ["wheat"], gehun: ["wheat"],
  atta: ["flour", "wheat"],
  maida: ["refined flour", "maida"],
  besan: ["gram flour", "chickpea flour"],
  sooji: ["semolina", "rava"], rava: ["semolina", "sooji"],
  makka: ["corn", "maize"], makkai: ["corn", "maize"],
  dal: ["lentil", "lentils", "pulses"], daal: ["lentil", "lentils", "pulses"],
  jaggery: ["gud"], gud: ["jaggery"], gur: ["jaggery"],

  // fruits / vegetables (broad category words)
  fal: ["fruit", "fruits"], phal: ["fruit", "fruits"],
  sabzi: ["vegetable", "vegetables"], sabji: ["vegetable", "vegetables"],
  sabjee: ["vegetable", "vegetables"],

  // specific vegetables
  aloo: ["potato"], alu: ["potato"],
  pyaz: ["onion"], pyaaz: ["onion"],
  tamatar: ["tomato"],
  adrak: ["ginger"],
  lahsun: ["garlic"], lahsoon: ["garlic"],
  mirch: ["chilli", "chili", "pepper"],
  shimla: ["capsicum"],
  gobhi: ["cauliflower", "cabbage"], gobi: ["cauliflower", "cabbage"],
  bhindi: ["okra", "ladyfinger"],
  baingan: ["brinjal", "eggplant"],
  matar: ["peas"],
  gajar: ["carrot"],
  mooli: ["radish"],
  palak: ["spinach"],
  kaddu: ["pumpkin"],
  lauki: ["bottle gourd"],
  khira: ["cucumber"], kheera: ["cucumber"],

  // specific fruits
  seb: ["apple"],
  kela: ["banana"],
  santra: ["orange"], santara: ["orange"],
  angur: ["grape", "grapes"],
  tarbooz: ["watermelon"], tarbuj: ["watermelon"],
  kharbooja: ["melon", "muskmelon"],
  anaar: ["pomegranate"], anar: ["pomegranate"],
  neembu: ["lemon"], nimbu: ["lemon"],
  aam: ["mango"],
  papita: ["papaya"],

  // dairy
  doodh: ["milk"], dudh: ["milk"],
  dahi: ["curd", "yogurt"],
  makhan: ["butter"],
  paneer: ["paneer", "cottage cheese"],
  malai: ["cream"],
  khoya: ["milk solid", "mawa"],

  // oil / condiments / spices
  tel: ["oil"],
  namak: ["salt"],
  cheeni: ["sugar"], chini: ["sugar"], shakkar: ["sugar"],
  haldi: ["turmeric"],
  jeera: ["cumin"],
  dhaniya: ["coriander"],
  elaichi: ["cardamom"],
  laung: ["clove", "cloves"],
  dalchini: ["cinnamon"],
  saunf: ["fennel"],
  ajwain: ["carom"],
  til: ["sesame"],
  rai: ["mustard"], sarson: ["mustard"],
  imli: ["tamarind"],
  achar: ["pickle"],
  chatni: ["chutney"],
  shahad: ["honey"],
  sirka: ["vinegar"],
  masala: ["spice", "spices", "masala"],

  // proteins / other kitchen
  anda: ["egg", "eggs"], ande: ["egg", "eggs"],
  machli: ["fish"], machhli: ["fish"],
  murgi: ["chicken"], murga: ["chicken"],
  roti: ["bread", "roti"],

  // dry fruits / nuts
  kaju: ["cashew", "cashews"],
  badam: ["almond", "almonds"],
  kishmish: ["raisin", "raisins"],
  akhrot: ["walnut", "walnuts"],
  pista: ["pistachio", "pistachios"],

  // beverages / snacks / sweets
  chai: ["tea"], chaay: ["tea"],
  pani: ["water"],
  namkeen: ["snacks", "namkeen"],
  mithai: ["sweets", "mithai"],
  biskut: ["biscuit", "biscuits"],

  // household / personal care
  sabun: ["soap"],
  agarbatti: ["incense", "agarbatti"],
  phenyl: ["floor cleaner", "phenyl"],
  detergent: ["detergent", "washing powder"],
};

// Build a reverse map too (english word -> hinglish words) so an English
// query like "rice" also surfaces products whose only searchable text is
// the Hindi/Hinglish name (e.g. "Chawal" typed by the shop owner).
const REVERSE_SYNONYMS = {};
for (const [hinglish, englishList] of Object.entries(SYNONYMS)) {
  for (const eng of englishList) {
    if (!REVERSE_SYNONYMS[eng]) REVERSE_SYNONYMS[eng] = [];
    if (!REVERSE_SYNONYMS[eng].includes(hinglish)) REVERSE_SYNONYMS[eng].push(hinglish);
  }
}

function getSynonyms(token) {
  const t = token.toLowerCase();
  const forward = SYNONYMS[t] || [];
  const backward = REVERSE_SYNONYMS[t] || [];
  return [...new Set([...forward, ...backward])];
}

module.exports = { SYNONYMS, REVERSE_SYNONYMS, getSynonyms };
