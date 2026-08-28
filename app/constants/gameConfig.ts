import type { Difficulty } from "./words";

export type DifficultyConfig = {
  id: Difficulty;
  label: string;
  clueLimit: number;
  timeLimit: number; // seconds
  hints: number;
  color: string;
  description: string;
  poolHint: string;
};

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: {
    id: "easy",
    label: "EASY",
    clueLimit: 8,
    timeLimit: 90,
    hints: 3,
    color: "#FF69B4",
    description: "Common words · Simple objects, animals, food",
    poolHint: "50+ words",
  },
  medium: {
    id: "medium",
    label: "MEDIUM",
    clueLimit: 6,
    timeLimit: 75,
    hints: 2,
    color: "#FF1493",
    description: "Moderate words · Places, professions, actions",
    poolHint: "100+ words",
  },
  hard: {
    id: "hard",
    label: "HARD",
    clueLimit: 5,
    timeLimit: 60,
    hints: 1,
    color: "#C71585",
    description: "Complex words · Abstract, technical, science",
    poolHint: "150+ words",
  },
  extremely_hard: {
    id: "extremely_hard",
    label: "EXTREMELY HARD",
    clueLimit: 4,
    timeLimit: 45,
    hints: 0,
    color: "#8B0046",
    description: "Expert words · Niche, obscure, idioms",
    poolHint: "200+ words",
  },
};

export const PINK_PALETTE = {
  primary: "#FF69B4",
  secondary: "#FFB6C1",
  accent: "#FF1493",
  background: "#1A0A0F",
  backgroundSoft: "#2D0F1F",
  backgroundCard: "#2A1020",
  text: "#FFE4E1",
  textMuted: "#FFB6C1",
  highlight: "#FF6EB4",
  success: "#FF69B4",
  danger: "#FF1493",
  border: "#FF69B422",
} as const;

export const GAME_LIMITS = {
  minPlayers: 4,
  maxPlayers: 10,
  minClueLength: 2,
  maxClueLength: 20,
  maxEmergencyMeetings: 3,
} as const;
