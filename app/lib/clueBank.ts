// Handcrafted rich clue bank for realistic bot clues
export const CLUE_BANK: Record<string, string[]> = {
  // Animals
  dog: ["bark", "puppy", "canine", "loyal", "leash", "bone", "fetch", "furry"],
  cat: ["meow", "purr", "kitten", "whiskers", "feline", "paws", "claws", "scratch"],
  fish: ["swim", "gills", "fins", "scales", "water", "ocean", "aquarium", "tank"],
  bird: ["wings", "feathers", "beak", "fly", "nest", "sing", "sky", "tweet"],
  rabbit: ["hop", "ears", "carrot", "burrow", "fur", "fluffy", "bunny"],
  horse: ["gallop", "mane", "saddle", "hoof", "neigh", "stable", "ride"],
  cow: ["milk", "moo", "pasture", "spotted", "beef", "grass", "farm"],
  pig: ["oink", "snout", "mud", "pink", "bacon", "pork", "swine"],
  sheep: ["wool", "baa", "flock", "meadow", "lamb", "white", "fleece"],
  lion: ["roar", "mane", "pride", "savanna", "predator", "king", "claws"],
  tiger: ["stripes", "feline", "jungle", "claws", "predator", "orange", "stalk"],
  bear: ["growl", "fur", "claws", "hibernate", "woods", "honey", "paws"],
  panda: ["bamboo", "china", "black-white", "bear", "gentle", "rare"],
  fox: ["cunning", "tail", "orange", "clever", "den", "wild", "sly"],
  wolf: ["pack", "howl", "moon", "wild", "canine", "alpha", "fangs"],
  deer: ["antlers", "forest", "fawn", "swift", "grazing", "gentle"],
  mouse: ["squeak", "cheese", "tiny", "whiskers", "trap", "rodent"],
  duck: ["quack", "bill", "feathers", "pond", "webbed", "waddle"],
  chicken: ["cluck", "rooster", "eggs", "feathers", "coop", "farm"],
  frog: ["croak", "hop", "pond", "green", "lilypad", "amphibian", "tongue"],

  // Food
  pizza: ["cheese", "pepperoni", "slice", "crust", "oven", "delivery", "italian"],
  burger: ["bun", "patty", "beef", "grill", "fastfood", "fries", "lettuce"],
  sushi: ["rice", "raw", "fish", "seaweed", "japan", "wasabi", "chopsticks"],
  pasta: ["noodles", "sauce", "italian", "wheat", "boil", "spaghetti", "parmesan"],
  bread: ["toast", "bakery", "wheat", "loaf", "flour", "yeast", "butter"],
  cake: ["birthday", "frosting", "sweet", "bake", "candles", "slice", "dessert"],
  icecream: ["frozen", "scoop", "cone", "vanilla", "sweet", "melt", "cold"],
  cookie: ["chocolate", "bake", "sweet", "dough", "crunchy", "crispy", "snack"],
  donut: ["hole", "glaze", "sprinkles", "pastry", "fried", "sweet", "circle"],
  apple: ["red", "fruit", "orchard", "crisp", "tree", "cider", "sweet"],
  banana: ["yellow", "peel", "potassium", "fruit", "monkey", "sweet", "curved"],
  mango: ["tropical", "sweet", "juicy", "fruit", "orange", "smooth", "pit"],
  grape: ["vine", "cluster", "wine", "purple", "sweet", "raisin", "fruit"],
  lemon: ["sour", "citrus", "yellow", "juice", "tart", "zest", "acidic"],
  cherry: ["red", "stem", "fruit", "sweet", "pie", "topper", "pair"],
  chocolate: ["cocoa", "sweet", "bar", "dark", "tasty", "candy", "brown"],
  candy: ["sweet", "sugar", "wrapper", "treat", "chewy", "colorful"],
  rice: ["grain", "bowl", "white", "asia", "steamed", "crop", "paddy"],
  soup: ["bowl", "broth", "spoon", "warm", "liquid", "hot", "vegetables"],
  salad: ["lettuce", "dressing", "fresh", "greens", "bowl", "healthy", "crisp"],

  // Objects
  book: ["read", "pages", "author", "library", "cover", "novel", "story"],
  pen: ["ink", "write", "paper", "draw", "ballpoint", "signature"],
  chair: ["sit", "legs", "cushion", "furniture", "wood", "rest", "seat"],
  table: ["surface", "legs", "furniture", "wood", "dining", "desk"],
  door: ["handle", "enter", "open", "exit", "hinge", "lock", "knock"],
  window: ["glass", "view", "curtain", "frame", "transparent", "sunlight"],
  phone: ["call", "screen", "mobile", "text", "ring", "apps", "device"],
  clock: ["time", "hands", "tick", "watch", "minutes", "hours", "alarm"],
  mirror: ["reflection", "glass", "look", "silver", "image", "vanity"],
  bag: ["carry", "strap", "backpack", "zipper", "pocket", "tote", "hold"],
  guitar: ["strings", "strum", "music", "fret", "acoustic", "rock", "chords"],
  piano: ["keys", "ivory", "chords", "music", "grand", "pedal", "composer"],
  camera: ["photo", "lens", "shutter", "flash", "capture", "digital", "picture"],
  lamp: ["light", "shade", "bulb", "bright", "glow", "switch", "desk"],

  // Places
  school: ["students", "teachers", "class", "learn", "desk", "blackboard", "books"],
  hospital: ["doctor", "nurse", "patients", "medicine", "heal", "beds", "clinic"],
  church: ["prayer", "altar", "cross", "holy", "service", "choir", "faith"],
  bank: ["money", "vault", "teller", "cash", "loans", "account", "finance"],
  mall: ["shops", "stores", "shopping", "foodcourt", "escalator", "retail"],
  park: ["trees", "grass", "benches", "playground", "nature", "walk", "green"],
  beach: ["sand", "ocean", "waves", "sun", "seashells", "shore", "vacation"],
  forest: ["trees", "woods", "wild", "nature", "leaves", "pine", "hiking"],
  mountain: ["peak", "climb", "high", "snow", "rock", "elevation", "slope"],
  desert: ["sand", "cactus", "dune", "dry", "sun", "hot", "oasis"],
  island: ["ocean", "isolated", "tropical", "coast", "shore", "palm", "sea"],
  castle: ["monarch", "fortress", "towers", "stone", "knights", "medieval", "kingdom"],
  airport: ["planes", "runway", "travel", "terminal", "flights", "passengers", "luggage"],
  waterfall: ["cascade", "stream", "plunge", "rapid", "mist", "river", "gorge"],
  volcano: ["lava", "magma", "eruption", "crater", "ash", "mountain", "fiery"],
  cave: ["dark", "underground", "stalactite", "rock", "echo", "bats", "cavern"],

  // Professions
  doctor: ["hospital", "stethoscope", "medicine", "patient", "heal", "clinic", "surgeon"],
  nurse: ["caring", "hospital", "patient", "vital", "scrubs", "bandage", "medical"],
  teacher: ["classroom", "students", "lessons", "chalk", "educate", "grade", "school"],
  pilot: ["cockpit", "airplane", "fly", "aviation", "altitude", "wings", "sky"],
  chef: ["kitchen", "cooking", "knife", "recipe", "delicious", "culinary", "restaurant"],
  artist: ["paint", "canvas", "creative", "brush", "gallery", "palette", "drawing"],
  musician: ["melody", "instrument", "concert", "notes", "harmony", "band", "sound"],
  athlete: ["sports", "train", "running", "trophy", "fitness", "stadium", "medal"],
  writer: ["author", "words", "novel", "stories", "pen", "publish", "chapters"],
  photographer: ["camera", "lens", "photos", "focus", "shutter", "gallery", "lighting"],
  scientist: ["lab", "research", "experiment", "discovery", "beaker", "hypothesis"],
  detective: ["magnify", "mystery", "clues", "investigate", "crime", "solve", "suspect"],
  lawyer: ["court", "defense", "justice", "legal", "client", "argue", "verdict"],
  fireman: ["hose", "extinguish", "smoke", "brave", "rescue", "ladder", "flames"],
  policeman: ["badge", "law", "siren", "patrol", "handcuffs", "protect", "uniform"],

  // Science & Technical
  gravity: ["newton", "downward", "pull", "earth", "mass", "attraction", "fall"],
  energy: ["power", "force", "joules", "kinetic", "potential", "charge", "dynamism"],
  molecule: ["atoms", "compound", "bonding", "chemistry", "structure", "matter"],
  algorithm: ["step", "sequence", "code", "logic", "computer", "compute", "solve"],
  database: ["storage", "query", "records", "sql", "tables", "server", "data"],
  software: ["programs", "apps", "code", "virtual", "coding", "digital", "developer"],
  encryption: ["cipher", "security", "keys", "secret", "decode", "safe", "crypto"],
  blockchain: ["ledger", "decentralized", "crypto", "nodes", "bitcoin", "hash"],
  quantum: ["particles", "physics", "superposition", "subatomic", "uncertainty", "qubit"],

  // Abstract & Psychology
  freedom: ["liberty", "autonomy", "release", "emancipation", "choice", "unshackled"],
  justice: ["fairness", "court", "scale", "law", "equality", "truth", "righteous"],
  courage: ["bravery", "fearless", "valor", "bold", "heart", "grit", "strength"],
  wisdom: ["knowledge", "experience", "sage", "insight", "judgment", "elder"],
  cognition: ["thought", "perception", "mind", "brain", "mental", "processing"],
  existentialism: ["meaning", "philosophy", "absurd", "free-will", "purpose", "existence"],
  photosynthesis: ["sunlight", "chlorophyll", "plants", "oxygen", "leaves", "green"],
  chimera: ["mythological", "hybrid", "beast", "monster", "fusion", "creature"],
};

export const IMPOSTOR_VAGUE_CLUES = [
  "thing", "stuff", "nice", "cool", "interesting", "useful", "common", "special",
  "great", "important", "everyday", "familiar", "popular", "classic", "modern",
  "simple", "complex", "beautiful", "amazing", "essential", "typical", "standard"
];

export const CATEGORY_FALLBACK: Record<string, string[]> = {
  Animals: ["wild", "pet", "cute", "nature", "alive", "creature", "furry", "tail"],
  Food: ["tasty", "delicious", "eat", "meal", "sweet", "fresh", "yummy", "cook"],
  Objects: ["item", "hold", "use", "daily", "hand", "house", "material", "tool"],
  "Colors & Shapes": ["visual", "bright", "color", "shape", "see", "design", "look", "pattern"],
  Actions: ["move", "do", "everyday", "body", "activity", "motion", "energy", "active"],
  Places: ["location", "visit", "building", "outside", "travel", "area", "spot", "destination"],
  Professions: ["work", "job", "people", "skill", "career", "service", "expert", "salary"],
  Nature: ["earth", "natural", "outside", "world", "environment", "sky", "life", "green"],
  Emotions: ["feeling", "mood", "heart", "inside", "human", "mind", "soul", "reaction"],
  Vehicles: ["move", "travel", "fast", "engine", "ride", "transport", "journey", "wheels"],
  Entertainment: ["fun", "show", "enjoy", "art", "performance", "audience", "stage", "play"],
  "Abstract Concepts": ["idea", "thought", "meaning", "value", "deep", "concept", "belief", "mind"],
  "Technical Terms": ["tech", "computer", "digital", "system", "code", "modern", "data", "binary"],
  Science: ["science", "study", "nature", "experiment", "lab", "research", "knowledge", "theory"],
  Geography: ["earth", "land", "map", "world", "place", "nature", "terrain", "globe"],
  "Music & Arts": ["art", "creative", "sound", "beauty", "culture", "expression", "craft", "melody"],
  "History & Culture": ["old", "past", "culture", "people", "story", "time", "heritage", "legacy"],
  Philosophy: ["think", "deep", "meaning", "life", "question", "mind", "existence", "wisdom"],
  Psychology: ["mind", "brain", "behavior", "thought", "human", "mental", "feeling", "psyche"],
  "Advanced Science": ["science", "lab", "study", "complex", "research", "theory", "experiment", "formula"],
  "Literary Terms": ["book", "write", "story", "words", "language", "meaning", "text", "author"],
  Mythology: ["legend", "story", "ancient", "magic", "creature", "myth", "tale", "gods"],
  "Business & Finance": ["money", "business", "market", "trade", "company", "value", "economy", "profit"],
  "Culinary Arts": ["food", "cook", "taste", "chef", "kitchen", "flavor", "dish", "recipe"],
};

export function getCluesForWord(word: string, category: string): string[] {
  const lower = word.toLowerCase().trim();
  if (CLUE_BANK[lower]) return CLUE_BANK[lower];
  if (CATEGORY_FALLBACK[category]) return CATEGORY_FALLBACK[category];
  return IMPOSTOR_VAGUE_CLUES.slice(0, 6);
}

export function getImpostorFakeClue(previousClues: string[], category?: string): string {
  // Impostor tries to mimic or provide a plausible vague clue
  if (previousClues.length > 0 && Math.random() < 0.6) {
    const base = previousClues[Math.floor(Math.random() * previousClues.length)];
    const variations: Record<string, string> = {
      water: "liquid", morning: "early", bitter: "strong", cup: "mug", bean: "seed",
      sand: "beach", ocean: "sea", hospital: "clinic", school: "class", tree: "plant",
      happy: "joy", car: "vehicle", music: "song", freedom: "free", algorithm: "logic",
      bark: "sound", fur: "soft", fly: "soar", cheese: "dairy", slice: "piece",
      run: "fast", doctor: "care", book: "reading", code: "program", sweet: "sugar",
    };
    if (variations[base.toLowerCase()]) return variations[base.toLowerCase()];
  }
  if (category && CATEGORY_FALLBACK[category]) {
    const pool = CATEGORY_FALLBACK[category];
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return IMPOSTOR_VAGUE_CLUES[Math.floor(Math.random() * IMPOSTOR_VAGUE_CLUES.length)];
}
