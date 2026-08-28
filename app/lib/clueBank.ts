// Handcrafted clue banks for realistic bot crewmate clues
// Each word maps to plausible one-word clues (synonyms, related, descriptive)
export const CLUE_BANK: Record<string, string[]> = {
  dog: ["bark","pet","loyal","puppy","canine","leash","bone"],
  cat: ["meow","purr","kitten","whiskers","feline","paws","tail"],
  pizza: ["cheese","pepperoni","slice","italian","oven","delivery","crust"],
  sushi: ["japan","rice","fish","seaweed","wasabi","roll","raw"],
  book: ["read","pages","library","author","story","novel","cover"],
  coffee: ["morning","bitter","cup","bean","cafe","black","espresso"],
  beach: ["sand","ocean","waves","sun","vacation","coast","shore"],
  forest: ["trees","woods","wild","green","nature","hiking","animals"],
  doctor: ["hospital","medicine","stethoscope","patient","heal","clinic","health"],
  teacher: ["school","class","students","lesson","chalk","education","explain"],
  flower: ["bloom","petal","fragrant","garden","rose","colorful","spring"],
  river: ["water","flow","stream","banks","current","fresh","bridge"],
  happy: ["joy","smile","cheerful","glad","content","excited","positive"],
  car: ["drive","wheels","engine","road","vehicle","speed","transport"],
  movie: ["cinema","film","screen","actor","popcorn","director","theater"],
  freedom: ["liberty","choice","rights","independence","free","autonomy","release"],
  justice: ["fair","court","law","judge","equality","truth","balance"],
  algorithm: ["code","logic","steps","compute","program","solve","process"],
  database: ["storage","data","server","query","table","records","system"],
  gravity: ["fall","force","earth","pull","weight","attraction","newton"],
  archipelago: ["islands","chain","sea","tropical","cluster","scattered","ocean"],
  symphony: ["orchestra","music","concert","composer","instrumental","harmony","performance"],
  pharaoh: ["egypt","king","pyramid","ancient","ruler","tomb","gold"],
  existentialism: ["meaning","existence","freedom","philosophy","choice","absurd","being"],
  cognition: ["thinking","mind","brain","process","understand","perceive","mental"],
  photosynthesis: ["sunlight","plant","chlorophyll","oxygen","green","energy","leaves"],
  allegory: ["symbol","story","hidden","meaning","moral","narrative","figure"],
  chimera: ["myth","hybrid","monster","lion","goat","serpent","creature"],
  acquisition: ["purchase","buy","merger","company","takeover","deal","assets"],
  "sous-vide": ["cooking","water","temperature","sealed","precise","technique","chef"],
  pizza_alike: ["cheese","italian"],
};

// Generic vague impostor clues
export const IMPOSTOR_VAGUE_CLUES = [
  "thing","stuff","nice","cool","interesting","useful","common","special","great","important","everyday","familiar","popular","classic","modern","simple","complex","beautiful","amazing","essential"
];

// Category-based fallback clues when word not in bank
export const CATEGORY_FALLBACK: Record<string, string[]> = {
  Animals: ["wild","pet","cute","nature","alive","creature","furry"],
  Food: ["tasty","delicious","eat","meal","sweet","fresh","yummy"],
  Objects: ["item","hold","use","daily","hand","house","thing"],
  "Colors & Shapes": ["visual","bright","color","shape","see","design","look"],
  Actions: ["move","do","everyday","body","activity","motion","energy"],
  Places: ["location","visit","building","outside","travel","area","spot"],
  Professions: ["work","job","people","skill","career","service","expert"],
  Nature: ["earth","natural","outside","world","environment","sky","life"],
  Emotions: ["feeling","mood","heart","inside","human","mind","soul"],
  Vehicles: ["move","travel","fast","engine","ride","transport","journey"],
  Entertainment: ["fun","show","enjoy","art","performance","audience","stage"],
  "Abstract Concepts": ["idea","thought","meaning","value","deep","concept","belief"],
  "Technical Terms": ["tech","computer","digital","system","code","modern","data"],
  Science: ["science","study","nature","experiment","lab","research","knowledge"],
  Geography: ["earth","land","map","world","place","nature","terrain"],
  "Music & Arts": ["art","creative","sound","beauty","culture","expression","craft"],
  "History & Culture": ["old","past","culture","people","story","time","heritage"],
  Philosophy: ["think","deep","meaning","life","question","mind","existence"],
  Psychology: ["mind","brain","behavior","thought","human","mental","feeling"],
  "Advanced Science": ["science","lab","study","complex","research","theory","experiment"],
  "Literary Terms": ["book","write","story","words","language","meaning","text"],
  Mythology: ["legend","story","ancient","magic","creature","myth","tale"],
  "Business & Finance": ["money","business","market","trade","company","value","economy"],
  "Culinary Arts": ["food","cook","taste","chef","kitchen","flavor","dish"],
};

export function getCluesForWord(word: string, category: string): string[] {
  const lower = word.toLowerCase();
  if (CLUE_BANK[lower]) return CLUE_BANK[lower];
  if (CATEGORY_FALLBACK[category]) return CATEGORY_FALLBACK[category];
  return IMPOSTOR_VAGUE_CLUES.slice(0, 5);
}

export function getImpostorFakeClue(previousClues: string[]): string {
  // Impostor tries to be vague or mimic previous clues
  if (previousClues.length > 0 && Math.random() < 0.5) {
    // Copy a synonym-ish vague variation
    const base = previousClues[Math.floor(Math.random() * previousClues.length)];
    const variations: Record<string, string> = {
      water: "liquid", morning: "early", bitter: "strong", cup: "mug", bean: "seed",
      sand: "beach", ocean: "sea", hospital: "clinic", school: "class", tree: "plant",
      happy: "joy", car: "vehicle", music: "song", freedom: "free", algorithm: "code"
    };
    if (variations[base.toLowerCase()]) return variations[base.toLowerCase()];
  }
  return IMPOSTOR_VAGUE_CLUES[Math.floor(Math.random() * IMPOSTOR_VAGUE_CLUES.length)];
}
