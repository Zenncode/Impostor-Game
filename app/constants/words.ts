export type Difficulty = "easy" | "medium" | "hard" | "extremely_hard";

export type WordEntry = {
  word: string;
  category: string;
  difficulty: Difficulty;
};

// ──────────────────────────────────────────────────────────────
// EASY — Simple objects, animals, food, colors, actions
// ──────────────────────────────────────────────────────────────
export const EASY_WORDS: WordEntry[] = [
  // Animals
  ...["dog","cat","fish","bird","rabbit","horse","cow","pig","sheep","lion","tiger","bear","panda","fox","wolf","deer","mouse","duck","chicken","frog"].map(w => ({ word: w, category: "Animals", difficulty: "easy" as const })),
  // Food
  ...["pizza","burger","sushi","pasta","bread","cake","icecream","cookie","donut","apple","banana","mango","grape","lemon","cherry","chocolate","candy","rice","soup","salad"].map(w => ({ word: w, category: "Food", difficulty: "easy" as const })),
  // Objects
  ...["book","pen","chair","table","door","window","phone","clock","mirror","bag","hat","shoe","shirt","pants","ring","necklace","guitar","piano","camera","lamp"].map(w => ({ word: w, category: "Objects", difficulty: "easy" as const })),
  // Colors & Shapes
  ...["red","blue","green","yellow","pink","purple","orange","black","white","brown","circle","square","triangle","star","heart","diamond","moon","sun","cloud","rainbow"].map(w => ({ word: w, category: "Colors & Shapes", difficulty: "easy" as const })),
  // Actions
  ...["run","jump","swim","fly","dance","sing","draw","cook","read","write","sleep","eat","drink","laugh","cry","hug","kiss","play","work","walk"].map(w => ({ word: w, category: "Actions", difficulty: "easy" as const })),
];

// ──────────────────────────────────────────────────────────────
// MEDIUM — Places, professions, nature, emotions, vehicles, entertainment
// ──────────────────────────────────────────────────────────────
export const MEDIUM_WORDS: WordEntry[] = [
  ...["school","hospital","church","bank","mall","park","beach","forest","mountain","desert","island","village","city","castle","temple","mosque","museum","theater","stadium","airport","harbor","lighthouse","waterfall","volcano","cave","bridge","tunnel","farm","garden","zoo"].map(w=>({word:w, category:"Places", difficulty:"medium" as const})),
  ...["doctor","nurse","teacher","pilot","chef","artist","musician","dancer","athlete","writer","photographer","engineer","architect","scientist","detective","lawyer","judge","soldier","fireman","policeman","mechanic","farmer","sailor","tailor","baker","barber","florist","surgeon","pharmacist","veterinarian"].map(w=>({word:w, category:"Professions", difficulty:"medium" as const})),
  ...["flower","tree","grass","river","ocean","wind","rain","snow","thunder","lightning","sunrise","sunset","eclipse","rainbow","earthquake","tornado","hurricane","blizzard","drought","flood","glacier","jungle","swamp","reef","canyon","plateau","peninsula","valley","meadow","orchard"].map(w=>({word:w, category:"Nature", difficulty:"medium" as const})),
  ...["happy","sad","angry","scared","excited","tired","hungry","thirsty","sleepy","bored","lonely","jealous","proud","grateful","hopeful","peaceful","anxious","confused","curious","shocked","amused","annoyed","relaxed","stressed","inspired","motivated","confident","patient","brave","kind"].map(w=>({word:w, category:"Emotions", difficulty:"medium" as const})),
  ...["car","bus","train","boat","plane","bike","truck","taxi","subway","scooter","helicopter","rocket","ship","canoe","sled","skateboard","rollerblade","tractor","bulldozer","crane","forklift","carriage","rickshaw","cablecar"].map(w=>({word:w, category:"Vehicles", difficulty:"medium" as const})),
  ...["movie","music","dance","theater","circus","magic","comedy","drama","horror","action","adventure","fantasy","sci-fi","romance","cartoon","puppet","mime","opera","ballet","jazz","rock","pop","classical","blues","reggae","hiphop","folk","country","gospel"].map(w=>({word:w, category:"Entertainment", difficulty:"medium" as const})),
];

// ──────────────────────────────────────────────────────────────
// HARD — Abstract, technical, science, geography, music, history
// ──────────────────────────────────────────────────────────────
export const HARD_WORDS: WordEntry[] = [
  ...["freedom","justice","peace","love","hope","faith","trust","truth","honor","pride","courage","wisdom","beauty","grace","mercy","patience","kindness","loyalty","honesty","humility","generosity","gratitude","forgiveness","dignity","integrity","empathy","compassion","resilience","ambition","destiny","eternity","mystery","miracle","balance","harmony","passion","purpose","vision","legacy","virtue"].map(w=>({word:w, category:"Abstract Concepts", difficulty:"hard" as const})),
  ...["algorithm","database","software","hardware","network","server","cloud","firewall","encryption","coding","programming","artificial","intelligence","robotics","automation","cyber","digital","quantum","analytics","metadata","bandwidth","latency","protocol","debug","deploy","compile","execute","render","cache","query","thread","kernel","framework","library","pipeline","cluster","container","virtual","reality","augmented","blockchain","cryptocurrency","token","wallet","mining","node"].map(w=>({word:w, category:"Technical Terms", difficulty:"hard" as const})),
  ...["gravity","energy","matter","molecule","atom","proton","neutron","electron","photon","quantum","relativity","evolution","genetics","DNA","RNA","protein","enzyme","hormone","neuron","synapse","cortex","organ","tissue","cell","bacteria","virus","immune","vaccine","antibiotic","plasma","fusion","fission","isotope","catalyst","solvent","solute","pH","acid","base","oxide","hydrate","polymer","alloy","semiconductor"].map(w=>({word:w, category:"Science", difficulty:"hard" as const})),
  ...["archipelago","peninsula","continent","ocean","desert","tundra","savanna","rainforest","grassland","mountain","valley","volcano","glacier","oasis","delta","fjord","coral","reef","canyon","plateau","strait","channel","bay","gulf","cape","island","atoll","marsh","swamp","prairie","steppe"].map(w=>({word:w, category:"Geography", difficulty:"hard" as const})),
  ...["symphony","concerto","sonata","melody","harmony","rhythm","tempo","beat","tone","scale","chord","arpeggio","ballad","opera","overture","nocturne","serenade","canvas","easel","palette","brush","acrylic","watercolor","oilpastel","charcoal","sketch","portrait","landscape","stilllife","abstract","surrealism","cubism","impressionism","renaissance","baroque","neoclassical","contemporary"].map(w=>({word:w, category:"Music & Arts", difficulty:"hard" as const})),
  ...["pharaoh","pyramid","colosseum","temple","castle","palace","cathedral","mosque","pagoda","stupa","monument","statue","artifact","scripture","manuscript","medieval","renaissance","industrial","revolution","dynasty","empire","colony","monarchy","republic","democracy","socialism","capitalism","communism","conservatism","liberalism","secularism","pluralism"].map(w=>({word:w, category:"History & Culture", difficulty:"hard" as const})),
];

// ──────────────────────────────────────────────────────────────
// EXTREMELY HARD — Philosophy, psychology, advanced science, literary, mythology, business, culinary
// ──────────────────────────────────────────────────────────────
export const EXTREME_WORDS: WordEntry[] = [
  ...["existentialism","phenomenology","epistemology","ontology","metaphysics","empiricism","rationalism","stoicism","skepticism","idealism","materialism","nihilism","absurdism","humanism","pragmatism","constructivism","relativism","utilitarianism","deontology","virtue","ethical","dialectic","hermeneutics","axiology","semiotics","logic","aesthetics","theodicy","eschatology","cosmology","theosophy"].map(w=>({word:w, category:"Philosophy", difficulty:"extremely_hard" as const})),
  ...["cognition","perception","consciousness","subconscious","archetype","schema","behaviorism","cognitive","neuroscience","neuroplasticity","synaptic","plasticity","conditioning","reinforcement","punishment","memory","retention","recall","recognition","insight","intuition","empathy","social","attachment","trauma","resilience","mindfulness","flowstate","burnout","impostor","syndrome"].map(w=>({word:w, category:"Psychology", difficulty:"extremely_hard" as const})),
  ...["photosynthesis","respiration","fermentation","polymerization","crystallization","spectroscopy","chromatography","electrophoresis","centrifuge","titration","diffusion","osmosis","entropy","enthalpy","thermodynamics","kinetic","potential","genome","chromosome","mutation","hybrid","allele","phenotype","genotype","homeostasis","autotroph","heterotroph","eukaryote","prokaryote","biology"].map(w=>({word:w, category:"Advanced Science", difficulty:"extremely_hard" as const})),
  ...["allegory","allusion","ambiguity","analogy","anaphora","antithesis","apostrophe","assonance","chiasmus","consonance","enjambment","hyperbole","irony","litotes","metaphor","metonymy","onomatopoeia","oxymoron","paradox","personification","simile","synecdoche","syntax","ellipsis","foreshadowing","frame","narrative","stream","unreliable","narrator","epistolary","gothic","bildungsroman"].map(w=>({word:w, category:"Literary Terms", difficulty:"extremely_hard" as const})),
  ...["chimera","griffin","phoenix","dragon","unicorn","mermaid","centaur","minotaur","sphinx","cerberus","pegasus","basilisk","hydra","nymph","satyr","titan","giant","dwarf","elf","goblin","wizard","witch","spirit","demon","angel","fairy","pixie","leprechaun","banshee","kelpie","naga","valkyrie","oracle","prophecy","relic","amulet","talisman","enchantment","incantation","ritual"].map(w=>({word:w, category:"Mythology", difficulty:"extremely_hard" as const})),
  ...["acquisition","merger","equity","capital","asset","liability","revenue","profit","margin","leverage","hedge","derivative","bond","stock","portfolio","diversification","valuation","liquidation","depreciation","amortization","solvency","liquidity","insolvency","bankruptcy","fiduciary","arbitrage","call","short","selling","bull","bear","stagnation","recession","depression","inflation","deflation","tariff","quota","embargo","trade","monopoly","oligopoly","duopoly"].map(w=>({word:w, category:"Business & Finance", difficulty:"extremely_hard" as const})),
  ...["sous-vide","gastronomy","palate","umami","charcuterie","confit","glacé","flambé","julienne","chiffonade","macerate","infuse","reduction","emulsion","meringue","ganache","coulis","sabayon","pâte","choux","brioche","croissant","macaron","profiterole","crème","brûlée","caramel","temper","fermentation"].map(w=>({word:w, category:"Culinary Arts", difficulty:"extremely_hard" as const})),
];

export const ALL_WORDS: WordEntry[] = [...EASY_WORDS, ...MEDIUM_WORDS, ...HARD_WORDS, ...EXTREME_WORDS];

export function getWordsForDifficulty(diff: Difficulty): WordEntry[] {
  switch(diff){
    case "easy": return EASY_WORDS;
    case "medium": return MEDIUM_WORDS;
    case "hard": return HARD_WORDS;
    case "extremely_hard": return EXTREME_WORDS;
    default: return EASY_WORDS;
  }
}

// Quick lookup: word -> category
export const WORD_CATEGORY_MAP: Record<string, string> = {};
for(const w of ALL_WORDS){
  if(!WORD_CATEGORY_MAP[w.word.toLowerCase()]) WORD_CATEGORY_MAP[w.word.toLowerCase()] = w.category;
}
