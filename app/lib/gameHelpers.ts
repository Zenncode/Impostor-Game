import type { ClueValidationResult, Player } from "../types/game";
import type { WordEntry } from "../constants/words";
import { DIFFICULTY_CONFIG } from "../constants/gameConfig";
import { WORD_CATEGORY_MAP, getWordsForDifficulty } from "../constants/words";
import type { Difficulty } from "../constants/words";

export function generateGuestName(): string {
  return `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
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
      id: `bot-${i}`,
      name: botNames[(i-1) % botNames.length] + `_${i}`,
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
    filtered = pool.filter(w=>w.word.toLowerCase() !== previousWord.toLowerCase());
  }
  return filtered[Math.floor(Math.random()*filtered.length)];
}

export function validateClue(clue: string, secretWord: string): ClueValidationResult {
  const trimmed = clue.trim();
  if(!trimmed) return { valid: false, reason: "Clue cannot be empty" };
  if(trimmed.includes(" ")) return { valid: false, reason: "Only ONE WORD allowed" };
  if(trimmed.length < 2) return { valid: false, reason: "Clue too short (min 2 letters)" };
  if(trimmed.length > 20) return { valid: false, reason: "Clue too long (max 20 letters)" };
  if(!/^[a-zA-Z\u00C0-\u024F\-]+$/.test(trimmed)) return { valid: false, reason: "Only letters and hyphen allowed" };
  const lowerClue = trimmed.toLowerCase();
  const lowerSecret = secretWord.toLowerCase();
  if(lowerClue === lowerSecret) return { valid: false, reason: "Cannot use the secret word itself!" };
  if(lowerSecret.includes(lowerClue) && lowerClue.length >= 3) return { valid: false, reason: "Cannot use part of the secret word" };
  if(lowerClue.includes(lowerSecret) && lowerSecret.length >= 3) return { valid: false, reason: "Cannot contain the secret word" };
  // rhyming heuristic: same last 3 letters and length similar
  if(lowerClue.length >= 3 && lowerSecret.length >=3){
    const clueEnd = lowerClue.slice(-3);
    const secretEnd = lowerSecret.slice(-3);
    if(clueEnd === secretEnd && lowerClue !== lowerSecret) {
      // only block if not already caught; give warning but allow? spec says cannot use rhyming. We'll block if 4+ letters.
      if(lowerClue.length >3) return { valid: false, reason: "Rhyming words are not allowed" };
    }
  }
  return { valid: true };
}

export function buildHints(wordEntry: WordEntry, diff: Difficulty){
  const cfg = DIFFICULTY_CONFIG[diff];
  const hints: {type: "first_letter"|"category"|"length", value:string, used:boolean}[] = [];
  if(cfg.hints >=1){
    hints.push({ type: "category", value: `Category: ${wordEntry.category}`, used: false });
  }
  if(cfg.hints >=2){
    hints.unshift({ type: "first_letter", value: `First letter: "${wordEntry.word[0].toUpperCase()}"`, used: false });
  }
  if(cfg.hints >=3){
    hints.push({ type: "length", value: `Length: ${wordEntry.word.length} letters`, used: false });
  }
  // Order: first_letter, category, length for easy
  if(diff === "easy"){
    // ensure order first, category, length
    hints.sort((a,b)=>{
      const order: Record<string,number> = { first_letter:0, category:1, length:2 };
      return order[a.type]-order[b.type];
    });
  }
  return hints;
}

export function calcSuspicionDelta(clue: string, secretWord: WordEntry, isImpostor: boolean, previousClues: string[]): number {
  if(isImpostor){
    // impostor clue vagueness check
    const vague = ["thing","stuff","nice","cool","interesting","useful","common","special","great","important"];
    if(vague.includes(clue.toLowerCase())) return 25;
    if(previousClues.includes(clue.toLowerCase())) return 30;
    return 15;
  } else {
    // crewmate suspicion low if clue is related
    // check if clue is in clue bank for that word -> reduce suspicion
    return -5;
  }
}

export function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for(let i=copy.length-1; i>0; i--){
    const j = Math.floor(Math.random()*(i+1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function getCategoryForWord(word: string): string {
  return WORD_CATEGORY_MAP[word.toLowerCase()] || "Unknown";
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds/60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2,"0")}`;
}
