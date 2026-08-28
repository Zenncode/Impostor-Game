import type { ClueValidationResult, Player } from "../types/game";
import type { WordEntry } from "../constants/words";
import { DIFFICULTY_CONFIG } from "../constants/gameConfig";
import { WORD_CATEGORY_MAP, getWordsForDifficulty } from "../constants/words";
import type { Difficulty } from "../constants/words";

const PINK_ADJECTIVES = [
  "Sakura", "Rose", "Berry", "Blush", "Pink", "Mochi", "Peach", "Candy",
  "Lotus", "Flamingo", "Velvet", "Ruby", "Petal", "Glitter", "Sparkle", "Sweet",
  "Cherry", "Cotton", "Bubble", "Pastel", "Sunny", "Fluffy", "Kawaii", "Dainty",
  "Chai", "Honey", "Luna", "Starry", "Cupcake", "Cosmic", "Silky", "Sugar"
];

const PINK_NOUNS = [
  "Bunny", "Fox", "Kitty", "Queen", "Angel", "Fairy", "Panda", "Puppy",
  "Princess", "Star", "Detective", "Sprite", "Butterfly", "Diva", "Ninja",
  "Bear", "Blossom", "Dolphin", "Otter", "Koala", "Pixie", "Charm", "Gem"
];

const PINK_AVATARS = [
  "🌸", "🎀", "💗", "🦩", "🌺", "💖", "✨", "🎭", "🌷", "👑", "🦄", "🍧", "🧁", "🍥", "🐰", "🦊", "🐱", "🐼", "🍓", "🍰"
];

export function generateUniquePinkProfile(): { name: string; avatar: string } {
  const adj = PINK_ADJECTIVES[Math.floor(Math.random() * PINK_ADJECTIVES.length)];
  const noun = PINK_NOUNS[Math.floor(Math.random() * PINK_NOUNS.length)];
  const num = Math.floor(10 + Math.random() * 90);
  const avatar = PINK_AVATARS[Math.floor(Math.random() * PINK_AVATARS.length)];
  return {
    name: adj + noun + "_" + num,
    avatar,
  };
}

export function generateGuestName(): string {
  return generateUniquePinkProfile().name;
}

export function generatePlayers(count: number, guestName: string): Player[] {
  const avatars = ["🌸","🎀","💗","🦩","🌺","💖","✨","🎭","🍥","🌷","💅","👛"];
  const botNames = ["Mika","Saku","Yuki","Hana","Rin","Aoi","Nana","Kiko","Momo","Chai","Lulu","Bibi"];
  const players: Player[] = [];
  players.push({
    id: "human",
    name: guestName,
    isHuman: true,
    role: null,
    isAlive: true,
    suspicion: 15,
    hasGivenClue: false,
    isOnline: true,
    avatar: "🎀",
  });
  for(let i=1; i<count; i++){
    players.push({
      id: "bot-" + i,
      name: botNames[(i-1) % botNames.length] + "_" + i,
      isHuman: false,
      role: null,
      isAlive: true,
      suspicion: 10 + Math.floor(Math.random()*20),
      hasGivenClue: false,
      isOnline: true,
      avatar: avatars[(i-1) % avatars.length],
    });
  }
  // shuffle
  for(let i=players.length-1; i>0; i--){
    const j = Math.floor(Math.random()*(i+1));
    [players[i], players[j]] = [players[j], players[i]];
  }
  return players;
}

export function assignRoles(players: Player[]): { players: Player[], impostorId: string } {
  const idx = Math.floor(Math.random()*players.length);
  const impostorId = players[idx].id;
  const updated = players.map(p => ({
    ...p,
    role: (p.id === impostorId ? "impostor" : "crewmate") as Player["role"]
  }));
  return { players: updated, impostorId };
}

export function pickSecretWord(diff: Difficulty, previousWord?: string): WordEntry {
  const pool: WordEntry[] = getWordsForDifficulty(diff);
  let filtered = pool;
  if(previousWord){
    filtered = pool.filter(w => w.word !== previousWord);
  }
  if(filtered.length === 0) filtered = pool;
  return filtered[Math.floor(Math.random()*filtered.length)];
}

export function validateClue(rawClue: string, secretWord: string): ClueValidationResult {
  const clue = rawClue.trim().toLowerCase();
  const target = secretWord.trim().toLowerCase();

  if(!clue) return { valid: false, reason: "Clue cannot be empty" };
  if(clue.includes(" ")) return { valid: false, reason: "Clue must be ONE word only" };
  if(!/^[a-z\u00C0-\u024F\-]+$/i.test(clue)) return { valid: false, reason: "Clue must contain only letters" };

  if(clue === target) return { valid: false, reason: "Cannot use the secret word" };
  if(clue.includes(target) && target.length > 2) return { valid: false, reason: "Cannot contain the secret word" };
  if(target.includes(clue) && clue.length > 2) return { valid: false, reason: "Cannot be a substring of the secret word" };

  // check rhyming: ending 3 letters match
  if(target.length >= 4 && clue.length >= 4){
    const targetEnd = target.slice(-3);
    const clueEnd = clue.slice(-3);
    if(targetEnd === clueEnd) return { valid: false, reason: "Rhyming clues are not allowed" };
  }

  return { valid: true };
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m + ":" + (s < 10 ? "0" : "") + s;
}
