import type { Difficulty, WordEntry } from "../constants/words";

export type GamePhase = "lobby" | "assign" | "clue" | "guess" | "reveal" | "vote";

export type PlayerRole = "crewmate" | "impostor";

export type Player = {
  id: string;
  name: string;
  isHuman: boolean;
  role: PlayerRole | null;
  isAlive: boolean;
  suspicion: number; // 0-100
  hasGivenClue: boolean;
  isOnline: boolean;
  avatar: string;
};

export type Clue = {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  isImpostorClue: boolean;
  timestamp: number;
  valid: boolean;
  reason?: string;
};

export type HintType = "first_letter" | "category" | "length";

export type Hint = {
  type: HintType;
  value: string;
  used: boolean;
};

export type GameState = {
  phase: GamePhase;
  difficulty: Difficulty;
  secretWord: WordEntry | null;
  players: Player[];
  clues: Clue[];
  currentClueIndex: number; // whose turn
  clueOrder: string[]; // player ids in order
  hints: Hint[];
  hintsRemaining: number;
  timeLeft: number;
  emergencyMeetingsLeft: number;
  votingTarget: string | null;
  votes: Record<string, string>; // voterId -> targetId
  winner: "impostor" | "crewmates" | null;
  impostorGuess: string | null;
  guessCorrect: boolean | null;
  round: number;
  guestId: string;
  suspicionLog: string[];
};

export type ClueValidationResult = {
  valid: boolean;
  reason?: string;
};

export type GameSettings = {
  showHints: boolean;
  timerEnabled: boolean;
  suspectMeterVisible: boolean;
  chatEnabled: boolean;
  soundEnabled: boolean;
};
