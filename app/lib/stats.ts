export type Badge = {
  id: string;
  name: string;
  desc: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
};

export type PlayerStats = {
  gamesPlayed: number;
  impostorWins: number;
  crewmateWins: number;
  currentStreak: number;
  bestStreak: number;
  pinkPoints: number;
  cluesGiven: number;
  emergencyWins: number;
  fastGuesses: number;
  badges: Badge[];
};

const DEFAULT_BADGES: Badge[] = [
  { id: "first_game", name: "First Bloom 🌸", desc: "Complete your first match", icon: "🌸", unlocked: false },
  { id: "impostor_win_3", name: "Master Mind 🎭", desc: "Win as Impostor 3 times", icon: "🎭", unlocked: false },
  { id: "crewmate_win_3", name: "Pink Guardian 🛡️", desc: "Win as Crewmate 3 times", icon: "🛡️", unlocked: false },
  { id: "streak_3", name: "On Fire 🔥", desc: "Reach a 3-game win streak", icon: "🔥", unlocked: false },
  { id: "streak_5", name: "Streak Royalty 👑", desc: "Reach a 5-game win streak", icon: "👑", unlocked: false },
  { id: "fast_guess", name: "Lightning Mind ⚡", desc: "Deduce the word in under 15s", icon: "⚡", unlocked: false },
  { id: "emergency_win", name: "Siren Slayer 🚨", desc: "Eliminate the Impostor in an Emergency Meeting", icon: "🚨", unlocked: false },
  { id: "points_1000", name: "Pink Tycoon 💎", desc: "Accumulate 1,000 Pink Points", icon: "💎", unlocked: false },
];

const DEFAULT_STATS: PlayerStats = {
  gamesPlayed: 0,
  impostorWins: 0,
  crewmateWins: 0,
  currentStreak: 0,
  bestStreak: 0,
  pinkPoints: 100, // starting bonus
  cluesGiven: 0,
  emergencyWins: 0,
  fastGuesses: 0,
  badges: DEFAULT_BADGES,
};

const STORAGE_KEY = "impostor_player_stats_v1";

export function loadStats(): PlayerStats {
  if (typeof window === "undefined") return DEFAULT_STATS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_STATS;
    const parsed = JSON.parse(saved);
    // Merge badges in case new badges are added
    const mergedBadges = DEFAULT_BADGES.map((b) => {
      const existing = parsed.badges?.find((eb: Badge) => eb.id === b.id);
      return existing || b;
    });
    return { ...DEFAULT_STATS, ...parsed, badges: mergedBadges };
  } catch {
    return DEFAULT_STATS;
  }
}

export function saveStats(stats: PlayerStats): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // ignore
  }
}

export function recordGameResult(
  roleWon: "impostor" | "crewmates",
  userRole: "impostor" | "crewmate",
  secondsTaken: number,
  isEmergencyEject: boolean = false
): { updatedStats: PlayerStats; newlyUnlockedBadges: Badge[]; pointsEarned: number } {
  const stats = loadStats();
  const userWon = (userRole === "impostor" && roleWon === "impostor") || (userRole === "crewmate" && roleWon === "crewmates");

  stats.gamesPlayed += 1;
  let pointsEarned = 25; // participation

  if (userWon) {
    stats.currentStreak += 1;
    if (stats.currentStreak > stats.bestStreak) {
      stats.bestStreak = stats.currentStreak;
    }
    pointsEarned += 100 + stats.currentStreak * 15;

    if (userRole === "impostor") {
      stats.impostorWins += 1;
    } else {
      stats.crewmateWins += 1;
    }

    if (secondsTaken <= 15) {
      stats.fastGuesses += 1;
    }
    if (isEmergencyEject) {
      stats.emergencyWins += 1;
      pointsEarned += 50;
    }
  } else {
    stats.currentStreak = 0;
  }

  stats.pinkPoints += pointsEarned;

  // Check badges
  const newlyUnlocked: Badge[] = [];
  stats.badges = stats.badges.map((b) => {
    if (b.unlocked) return b;
    let unlock = false;
    if (b.id === "first_game" && stats.gamesPlayed >= 1) unlock = true;
    if (b.id === "impostor_win_3" && stats.impostorWins >= 3) unlock = true;
    if (b.id === "crewmate_win_3" && stats.crewmateWins >= 3) unlock = true;
    if (b.id === "streak_3" && stats.bestStreak >= 3) unlock = true;
    if (b.id === "streak_5" && stats.bestStreak >= 5) unlock = true;
    if (b.id === "fast_guess" && stats.fastGuesses >= 1) unlock = true;
    if (b.id === "emergency_win" && stats.emergencyWins >= 1) unlock = true;
    if (b.id === "points_1000" && stats.pinkPoints >= 1000) unlock = true;

    if (unlock) {
      const unlockedBadge = { ...b, unlocked: true, unlockedAt: Date.now() };
      newlyUnlocked.push(unlockedBadge);
      return unlockedBadge;
    }
    return b;
  });

  saveStats(stats);
  return { updatedStats: stats, newlyUnlockedBadges: newlyUnlocked, pointsEarned };
}

