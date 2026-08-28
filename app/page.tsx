"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import Navbar from "./components/Navbar";
import PetalBackground from "./components/PetalBackground";
import SoundSettingsModal from "./components/SoundSettingsModal";
import RulesModal from "./components/RulesModal";
import StatsModal from "./components/StatsModal";
import EmergencyModal from "./components/EmergencyModal";
import sound from "./lib/soundSystem";
import { loadStats, recordGameResult, PlayerStats } from "./lib/stats";
import { DIFFICULTY_CONFIG } from "./constants/gameConfig";
import type { Difficulty, WordEntry } from "./constants/words";
import {
  pickSecretWord,
  validateClue,
  shuffleArray,
  formatTime,
  generatePlayers,
} from "./lib/gameHelpers";
import { getCluesForWord, getImpostorFakeClue } from "./lib/clueBank";
import type { Player, Clue } from "./types/game";

const DIFF_ORDER: Difficulty[] = ["easy", "medium", "hard", "extremely_hard"];

type GameMode = "impostor" | "crewmate" | "blitz";
type GamePhase = "lobby" | "role_reveal" | "clue_feed" | "guess" | "reveal";

export default function Home() {
  // Navigation & Modals state
  const [isSoundOpen, setIsSoundOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [stats, setStats] = useState<PlayerStats | null>(null);

  // Player & Game Configuration
  const [playerName, setPlayerName] = useState("Guest_Pink");
  const [playerAvatar, setPlayerAvatar] = useState("🌸");
  const [playerCount, setPlayerCount] = useState<number>(4); // Minimum 3 players
  const [gameMode, setGameMode] = useState<GameMode>("impostor");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [phase, setPhase] = useState<GamePhase>("lobby");

  // Game Match State
  const [secretWord, setSecretWord] = useState<WordEntry | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [impostorId, setImpostorId] = useState<string>("human");
  const [clues, setClues] = useState<Clue[]>([]);
  const [currentClueIdx, setCurrentClueIdx] = useState(0);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [botTypingName, setBotTypingName] = useState("");
  const [timeLeft, setTimeLeft] = useState(75);
  const [round, setRound] = useState(1);
  const [prevWord, setPrevWord] = useState<string | null>(null);
  const [emergencyMeetingsLeft, setEmergencyMeetingsLeft] = useState(3);
  const [hideSecretWord, setHideSecretWord] = useState(false);

  // Hints State
  const [hintsAvailable, setHintsAvailable] = useState(2);
  const [unlockedHints, setUnlockedHints] = useState<{ type: string; label: string; value: string }[]>([]);

  // Inputs & Errors
  const [clueInput, setClueInput] = useState("");
  const [guessInput, setGuessInput] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Results & Celebrations
  const [winner, setWinner] = useState<"impostor" | "crewmates" | null>(null);
  const [impostorGuess, setImpostorGuess] = useState<string | null>(null);
  const [isGuessCorrect, setIsGuessCorrect] = useState<boolean | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastPointsEarned, setLastPointsEarned] = useState(0);
  const [newBadgesAlert, setNewBadgesAlert] = useState<string[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const botClueTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cfg = DIFFICULTY_CONFIG[difficulty];

  // Load player stats on mount
  useEffect(() => {
    setStats(loadStats());
    const savedName = localStorage.getItem("impostor_player_name");
    const savedAvatar = localStorage.getItem("impostor_player_avatar");
    if (savedName) setPlayerName(savedName);
    if (savedAvatar) setPlayerAvatar(savedAvatar);
  }, []);

  const handleUpdateProfile = (name: string, avatar: string) => {
    setPlayerName(name);
    setPlayerAvatar(avatar);
    localStorage.setItem("impostor_player_name", name);
    localStorage.setItem("impostor_player_avatar", avatar);
  };

  // Start a new game
  const startGame = useCallback(() => {
    sound.playClick();
    sound.playRoleReveal();

    const word = pickSecretWord(difficulty, prevWord || undefined);
    const count = Math.max(3, Math.min(10, playerCount));
    const generatedPlayers = generatePlayers(count, playerName);
    generatedPlayers.find((p) => p.isHuman)!.avatar = playerAvatar;

    let targetImpostorId = "human";
    if (gameMode === "crewmate") {
      // Pick one of the bots as impostor
      const bots = generatedPlayers.filter((p) => !p.isHuman);
      const randomBot = bots[Math.floor(Math.random() * bots.length)];
      targetImpostorId = randomBot.id;
    }

    const updatedPlayers = generatedPlayers.map((p) => ({
      ...p,
      role: (p.id === targetImpostorId ? "impostor" : "crewmate") as Player["role"],
      suspicion: p.id === targetImpostorId ? 45 : 15,
    }));

    setSecretWord(word);
    setPlayers(updatedPlayers);
    setImpostorId(targetImpostorId);
    setClues([]);
    setCurrentClueIdx(0);
    setTimeLeft(gameMode === "blitz" ? 45 : cfg.timeLimit);
    setEmergencyMeetingsLeft(3);
    setHintsAvailable(gameMode === "blitz" ? 1 : cfg.hints);
    setUnlockedHints([]);
    setWinner(null);
    setImpostorGuess(null);
    setIsGuessCorrect(null);
    setClueInput("");
    setGuessInput("");
    setValidationError(null);
    setNewBadgesAlert([]);
    setHideSecretWord(false);

    // Enter role reveal animation
    setPhase("role_reveal");
    setTimeout(() => {
      setPhase("clue_feed");
    }, 2400);
  }, [difficulty, prevWord, playerName, playerAvatar, gameMode, playerCount, cfg.hints, cfg.timeLimit]);

  // Turn-based Clue feeding mechanism
  useEffect(() => {
    if (phase !== "clue_feed" || !secretWord) return;

    // Check if clue limit reached
    if (clues.length >= cfg.clueLimit) {
      if (gameMode === "impostor" || gameMode === "blitz") {
        setPhase("guess");
      } else {
        // AI Impostor makes a guess in crewmate mode
        handleAiImpostorGuess();
      }
      return;
    }

    // Identify current player turn
    const currentPlayer = players[currentClueIdx % players.length];
    if (!currentPlayer) return;

    if (currentPlayer.isHuman && gameMode === "crewmate") {
      // Human must submit a clue, wait for human input
      return;
    }

    // Bot generates clue
    setIsBotTyping(true);
    setBotTypingName(currentPlayer.name);

    botClueTimeoutRef.current = setTimeout(() => {
      let clueText = "";
      const isImpostor = currentPlayer.id === impostorId;

      if (isImpostor) {
        // AI impostor fake clue
        const prevClueTexts = clues.map((c) => c.text);
        clueText = getImpostorFakeClue(prevClueTexts, secretWord.category);
      } else {
        // Crewmate legitimate clue
        const bank = getCluesForWord(secretWord.word, secretWord.category);
        const unused = bank.filter(
          (c) => !clues.some((given) => given.text.toLowerCase() === c.toLowerCase())
        );
        clueText = unused.length > 0
          ? unused[Math.floor(Math.random() * unused.length)]
          : bank[Math.floor(Math.random() * bank.length)];
      }

      const newClue: Clue = {
        id: `clue-${Date.now()}-${clues.length}`,
        playerId: currentPlayer.id,
        playerName: currentPlayer.name,
        text: clueText,
        isImpostorClue: isImpostor,
        timestamp: Date.now(),
        valid: true,
      };

      // Suspicion updates
      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id === currentPlayer.id) {
            const delta = isImpostor ? Math.floor(Math.random() * 15 + 10) : -Math.floor(Math.random() * 5);
            return { ...p, suspicion: Math.min(100, Math.max(0, p.suspicion + delta)), hasGivenClue: true };
          }
          return p;
        })
      );

      sound.playCluePop();
      setClues((prev) => [...prev, newClue]);
      setIsBotTyping(false);
      setCurrentClueIdx((prev) => prev + 1);
    }, 1200 + Math.random() * 800);

    return () => {
      if (botClueTimeoutRef.current) clearTimeout(botClueTimeoutRef.current);
    };
  }, [phase, clues.length, currentClueIdx, players, secretWord, impostorId, gameMode, cfg.clueLimit]);

  // AI Impostor final guess logic (when playing in Crewmate mode)
  const handleAiImpostorGuess = useCallback(() => {
    if (!secretWord) return;
    setIsBotTyping(true);
    setBotTypingName("Impostor");

    setTimeout(() => {
      setIsBotTyping(false);
      // Determine accuracy based on difficulty
      const successRates: Record<Difficulty, number> = {
        easy: 0.65,
        medium: 0.45,
        hard: 0.3,
        extremely_hard: 0.15,
      };
      const willGuessCorrect = Math.random() < successRates[difficulty];
      const botGuess = willGuessCorrect ? secretWord.word : "mystery";

      setImpostorGuess(botGuess);
      setIsGuessCorrect(willGuessCorrect);
      finishMatch(willGuessCorrect ? "impostor" : "crewmates", botGuess, willGuessCorrect);
    }, 1800);
  }, [secretWord, difficulty]);

  // Countdown Timer
  useEffect(() => {
    if (phase !== "clue_feed" && phase !== "guess") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (phase === "clue_feed") {
            setPhase("guess");
            return 30;
          } else {
            // Time out: Impostor loses
            sound.playDefeat();
            finishMatch("crewmates", null, false);
            return 0;
          }
        }
        if (prev <= 10) {
          sound.playHeartbeat();
        } else if (prev % 5 === 0) {
          sound.playTick();
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // Finish match handler with stats & achievements record
  const finishMatch = (
    roleWon: "impostor" | "crewmates",
    finalGuess: string | null,
    correct: boolean,
    isEmergencyEject: boolean = false
  ) => {
    setWinner(roleWon);
    setImpostorGuess(finalGuess);
    setIsGuessCorrect(correct);
    setPhase("reveal");

    const userRole = gameMode === "impostor" ? "impostor" : "crewmate";
    const userWon =
      (userRole === "impostor" && roleWon === "impostor") ||
      (userRole === "crewmate" && roleWon === "crewmates");

    if (userWon) {
      sound.playVictory();
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3500);
    } else {
      sound.playDefeat();
    }

    const timeSpent = cfg.timeLimit - timeLeft;
    const { updatedStats, newlyUnlockedBadges, pointsEarned } = recordGameResult(
      roleWon,
      userRole,
      timeSpent,
      isEmergencyEject
    );

    setStats(updatedStats);
    setLastPointsEarned(pointsEarned);
    if (newlyUnlockedBadges.length > 0) {
      setNewBadgesAlert(newlyUnlockedBadges.map((b) => `${b.icon} ${b.name}`));
    }
  };

  // Submit human clue (in Crewmate mode)
  const handleHumanSubmitClue = () => {
    if (!secretWord) return;
    const res = validateClue(clueInput, secretWord.word);
    if (!res.valid) {
      setValidationError(res.reason || "Invalid clue");
      return;
    }
    if (clues.some((c) => c.text.toLowerCase() === clueInput.trim().toLowerCase())) {
      setValidationError("Clue already given this match!");
      return;
    }

    sound.playCluePop();
    setValidationError(null);
    const humanPlayer = players.find((p) => p.isHuman) || {
      id: "human",
      name: playerName,
      avatar: playerAvatar,
    };

    const newClue: Clue = {
      id: `clue-human-${Date.now()}`,
      playerId: humanPlayer.id,
      playerName: humanPlayer.name,
      text: clueInput.trim(),
      isImpostorClue: false,
      timestamp: Date.now(),
      valid: true,
    };

    setClues((prev) => [...prev, newClue]);
    setClueInput("");
    setCurrentClueIdx((prev) => prev + 1);
  };

  // Submit human guess (in Impostor mode)
  const handleHumanGuess = () => {
    if (!secretWord) return;
    const guess = guessInput.trim();
    if (!guess) {
      setValidationError("Enter a single word guess!");
      return;
    }
    if (guess.includes(" ")) {
      setValidationError("Guess must be exactly ONE WORD");
      return;
    }

    setValidationError(null);
    const correct = guess.toLowerCase() === secretWord.word.toLowerCase();
    finishMatch(correct ? "impostor" : "crewmates", guess, correct);
  };

  // Unlock hint token
  const handleUseHint = () => {
    if (!secretWord || hintsAvailable <= 0) return;
    sound.playHint();
    setHintsAvailable((prev) => prev - 1);

    const hintList = [
      { type: "category", label: "Category", value: secretWord.category },
      { type: "first_letter", label: "First Letter", value: `"${secretWord.word[0].toUpperCase()}"` },
      { type: "length", label: "Word Length", value: `${secretWord.word.length} letters` },
      {
        type: "vowel_count",
        label: "Vowels",
        value: `${(secretWord.word.match(/[aeiou]/gi) || []).length} vowels`,
      },
    ];

    const availableToUnlock = hintList.filter(
      (h) => !unlockedHints.some((u) => u.type === h.type)
    );

    if (availableToUnlock.length > 0) {
      setUnlockedHints((prev) => [...prev, availableToUnlock[0]]);
    }
  };

  // Emergency meeting callback
  const handleEmergencyVoteComplete = (
    eliminatedPlayer: Player | null,
    isImpostorEliminated: boolean
  ) => {
    setIsEmergencyOpen(false);
    if (eliminatedPlayer) {
      setPlayers((prev) =>
        prev.map((p) => (p.id === eliminatedPlayer.id ? { ...p, isAlive: false } : p))
      );

      if (isImpostorEliminated) {
        // Crewmates caught the impostor!
        finishMatch("crewmates", null, false, true);
      }
    }
  };

  const handleNextRound = () => {
    sound.playClick();
    if (secretWord) setPrevWord(secretWord.word);
    setRound((r) => r + 1);
    startGame();
  };

  const handleNewGame = () => {
    sound.playClick();
    setPrevWord(null);
    setRound(1);
    setPhase("lobby");
    setSecretWord(null);
    setClues([]);
  };

  // Timer rendering math
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const timerProgress = Math.max(0, Math.min(1, timeLeft / (gameMode === "blitz" ? 45 : cfg.timeLimit)));
  const offset = circumference * (1 - timerProgress);
  const isWarn = timeLeft <= 10;

  // -------------------------------------------------------------
  // UI RENDERERS
  // -------------------------------------------------------------

  const renderLobby = () => (
    <div className="w-full max-w-xl mx-auto py-8 sm:py-12 space-y-7 animate-fadeIn">
      {/* Title & Badge */}
      <div className="text-center space-y-2.5">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-300 text-xs font-black tracking-widest uppercase shadow-sm">
          <span>🌸</span> SOCIAL DEDUCTION WORD GAME <span>🎭</span>
        </div>
        <h1 className="font-black text-4xl sm:text-6xl tracking-tight text-white leading-none drop-shadow-md">
          IMPOSTOR <br />
          <span className="bg-gradient-to-r from-pink-400 via-pink-500 to-pink-300 bg-clip-text text-transparent">
            PINK EDITION
          </span>
        </h1>
        <p className="text-sm sm:text-base text-pink-200/80 font-medium">
          Everyone knows the secret word except the Impostor. Trust no one!
        </p>
      </div>

      {/* Profile Bar */}
      <div className="p-4 rounded-3xl bg-pink-950/40 border border-pink-500/25 flex items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="text-3xl p-2 rounded-2xl bg-pink-500/20 border border-pink-500/30">
            {playerAvatar}
          </div>
          <div>
            <div className="text-[10px] uppercase font-black tracking-wider text-pink-400">
              Player Identity
            </div>
            <div className="font-black text-white text-base">{playerName}</div>
          </div>
        </div>
        <div className="flex gap-1.5">
          {["🌸", "🎀", "💗", "🦩", "💖", "🎭"].map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                sound.playClick();
                handleUpdateProfile(playerName, emoji);
              }}
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition cursor-pointer ${
                playerAvatar === emoji
                  ? "bg-pink-500 text-white ring-2 ring-pink-300 scale-110"
                  : "bg-pink-950/40 hover:bg-pink-900/30 border border-pink-500/20"
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Game Mode Selector */}
      <div className="space-y-2">
        <label className="text-xs font-black tracking-widest text-pink-300 uppercase block px-1">
          SELECT GAME MODE
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => {
              sound.playClick();
              setGameMode("impostor");
            }}
            className={`p-4 rounded-2xl text-left border cursor-pointer transition relative ${
              gameMode === "impostor"
                ? "bg-gradient-to-br from-pink-600/30 to-pink-950 border-pink-400 shadow-lg shadow-pink-500/20 ring-2 ring-pink-500"
                : "bg-pink-950/20 border-pink-500/20 hover:bg-pink-900/20"
            }`}
          >
            <div className="text-2xl mb-1">🎭</div>
            <div className="font-black text-sm text-white">Play Impostor</div>
            <div className="text-[11px] text-pink-300/70 mt-0.5">
              Deduce the word from bot clues & hint tokens
            </div>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setGameMode("crewmate");
            }}
            className={`p-4 rounded-2xl text-left border cursor-pointer transition relative ${
              gameMode === "crewmate"
                ? "bg-gradient-to-br from-pink-600/30 to-pink-950 border-pink-400 shadow-lg shadow-pink-500/20 ring-2 ring-pink-500"
                : "bg-pink-950/20 border-pink-500/20 hover:bg-pink-900/20"
            }`}
          >
            <div className="text-2xl mb-1">🛡️</div>
            <div className="font-black text-sm text-white">Play Crewmate</div>
            <div className="text-[11px] text-pink-300/70 mt-0.5">
              Give subtle clues & call Emergency Meetings
            </div>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setGameMode("blitz");
            }}
            className={`p-4 rounded-2xl text-left border cursor-pointer transition relative ${
              gameMode === "blitz"
                ? "bg-gradient-to-br from-pink-600/30 to-pink-950 border-pink-400 shadow-lg shadow-pink-500/20 ring-2 ring-pink-500"
                : "bg-pink-950/20 border-pink-500/20 hover:bg-pink-900/20"
            }`}
          >
            <div className="text-2xl mb-1">⚡</div>
            <div className="font-black text-sm text-white">Speed Blitz</div>
            <div className="text-[11px] text-pink-300/70 mt-0.5">
              Rapid 45s clock for max score multiplier
            </div>
          </button>
        </div>
      </div>

      {/* Player Count Selector (Minimum 3) */}
      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <label className="text-xs font-black tracking-widest text-pink-300 uppercase">
            PLAYERS IN ROOM (MINIMUM 3)
          </label>
          <span className="text-[11px] font-bold text-pink-400">
            1 Impostor + {playerCount - 1} Crewmates
          </span>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {[3, 4, 5, 6, 8, 10].map((num) => {
            const active = playerCount === num;
            return (
              <button
                key={num}
                onClick={() => {
                  sound.playClick();
                  setPlayerCount(num);
                }}
                className={`py-3 rounded-2xl font-black text-xs border cursor-pointer transition relative flex flex-col items-center justify-center ${
                  active
                    ? "bg-gradient-to-br from-pink-500 to-pink-600 border-pink-300 text-white shadow-lg shadow-pink-500/30 ring-2 ring-pink-400 scale-105"
                    : "bg-pink-950/30 border-pink-500/20 text-pink-200 hover:bg-pink-900/25"
                }`}
              >
                <span className="text-sm">{num}</span>
                <span className="text-[9px] opacity-75 font-semibold">players</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Difficulty Selector */}
      <div className="space-y-2">
        <label className="text-xs font-black tracking-widest text-pink-300 uppercase block px-1">
          DIFFICULTY LEVEL
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {DIFF_ORDER.map((d) => {
            const c = DIFFICULTY_CONFIG[d];
            const active = d === difficulty;
            return (
              <button
                key={d}
                onClick={() => {
                  sound.playClick();
                  setDifficulty(d);
                }}
                className={`p-3.5 rounded-2xl text-left border cursor-pointer transition relative ${
                  active
                    ? "bg-gradient-to-br from-pink-500 to-pink-600 border-pink-300 text-white shadow-lg shadow-pink-500/30 ring-2 ring-pink-400"
                    : "bg-pink-950/30 border-pink-500/20 text-pink-200 hover:bg-pink-900/25"
                }`}
              >
                {active && (
                  <span className="absolute top-2.5 right-2.5 text-xs bg-white text-pink-600 rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    ✓
                  </span>
                )}
                <div className="font-black text-xs">{c.label}</div>
                <div className="text-[10px] opacity-80 mt-1">
                  {c.clueLimit} clues · {c.timeLimit}s
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={startGame}
        className="w-full py-5 rounded-3xl font-black text-lg tracking-widest flex items-center justify-center gap-3 bg-gradient-to-r from-pink-500 via-pink-600 to-pink-500 text-white shadow-xl shadow-pink-500/35 hover:brightness-110 cursor-pointer transition transform active:scale-95"
      >
        <span className="w-9 h-9 rounded-full bg-white text-pink-600 flex items-center justify-center text-sm shadow-md">
          ▶
        </span>
        START GAME ({playerCount} PLAYERS)
      </button>
    </div>
  );

  const renderRoleReveal = () => {
    const isHumanImpostor = impostorId === "human";
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-6 animate-popIn">
        <div className="text-7xl animate-bounce">
          {isHumanImpostor ? "🎭" : "🛡️"}
        </div>
        <div className="space-y-2">
          <div className="text-xs font-black tracking-widest text-pink-300 uppercase">
            YOUR ASSIGNED ROLE
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight">
            {isHumanImpostor ? "YOU ARE THE IMPOSTOR" : "YOU ARE A CREWMATE"}
          </h2>
          <p className="text-sm text-pink-200/80">
            {isHumanImpostor
              ? "You do NOT know the secret word! Deduce it from the crewmates' clues."
              : `The secret word is "${secretWord?.word.toUpperCase()}" in [${secretWord?.category}]. Give subtle clues!`}
          </p>
        </div>
      </div>
    );
  };

  const renderTimerRing = () => (
    <div className="relative w-36 h-36 sm:w-40 sm:h-40 mx-auto my-2">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
        <circle
          className="text-pink-500/20"
          cx="60"
          cy="60"
          r={radius}
          strokeWidth="8"
          fill="none"
          stroke="currentColor"
        />
        <circle
          className={`text-pink-500 transition-all duration-1000 ${
            isWarn ? "timer-ring-warn" : ""
          }`}
          cx="60"
          cy="60"
          r={radius}
          strokeWidth="8"
          fill="none"
          stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ strokeLinecap: "round" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className={`text-3xl sm:text-4xl font-black tracking-tight ${
            isWarn ? "text-rose-400 heartbeat" : "text-white"
          }`}
        >
          {formatTime(timeLeft)}
        </div>
        <div className="text-[10px] font-bold text-pink-300/70 uppercase">
          {phase === "guess" ? "Final Guess" : "Clue Phase"}
        </div>
      </div>
    </div>
  );

  const renderClueFeed = () => {
    const isHumanImpostor = impostorId === "human";
    return (
      <div className="max-w-xl mx-auto w-full space-y-5 animate-fadeIn">
        {/* Role & Secret Word Card */}
        <div className="p-4 rounded-3xl bg-pink-950/40 border border-pink-500/20 shadow-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-2xl">
              {isHumanImpostor ? "🎭" : "🛡️"}
            </div>
            <div>
              <div className="text-[10px] font-black uppercase text-pink-400 tracking-wider">
                {isHumanImpostor ? "Role: Impostor" : "Role: Crewmate"}
              </div>
              <div className="font-black text-white text-base">
                {isHumanImpostor ? (
                  <span className="text-pink-300">Secret: [ ? ? ? ? ]</span>
                ) : (
                  <span>
                    Word:{" "}
                    <b className={hideSecretWord ? "blur-sm transition" : "text-pink-400 transition"}>
                      {secretWord?.word.toUpperCase()}
                    </b>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isHumanImpostor && (
              <button
                onClick={() => setHideSecretWord((prev) => !prev)}
                className="px-2.5 py-1.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs font-bold hover:bg-pink-500/20 cursor-pointer"
              >
                {hideSecretWord ? "👁️ Show" : "🙈 Hide"}
              </button>
            )}
            {gameMode === "crewmate" && (
              <button
                onClick={() => {
                  if (emergencyMeetingsLeft > 0) {
                    setEmergencyMeetingsLeft((prev) => prev - 1);
                    setIsEmergencyOpen(true);
                  }
                }}
                disabled={emergencyMeetingsLeft <= 0}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md transition ${
                  emergencyMeetingsLeft > 0
                    ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-rose-500/30 active:scale-95 animate-pulse"
                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                }`}
              >
                <span>🚨</span> Meeting ({emergencyMeetingsLeft})
              </button>
            )}
          </div>
        </div>

        {/* Timer */}
        {renderTimerRing()}

        {/* Unlocked Hints Bar (in Impostor mode) */}
        {isHumanImpostor && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-black uppercase text-pink-300 tracking-wider">
                Hint Powerups ({hintsAvailable} Left)
              </span>
              {hintsAvailable > 0 && (
                <button
                  onClick={handleUseHint}
                  className="px-3 py-1 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 text-pink-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition active:scale-95"
                >
                  <span>✨</span> Reveal Hint
                </button>
              )}
            </div>
            {unlockedHints.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {unlockedHints.map((h, i) => (
                  <div
                    key={i}
                    className="px-3 py-1.5 rounded-xl bg-pink-500/15 border border-pink-500/30 text-xs text-pink-200 flex items-center gap-1.5 animate-fadeIn"
                  >
                    <span className="text-pink-400 font-bold">{h.label}:</span>
                    <span className="font-black text-white">{h.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Clue Speech Bubbles Feed */}
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          <div className="text-[11px] font-black uppercase text-pink-300/80 px-1">
            Clue Feed ({clues.length}/{cfg.clueLimit})
          </div>

          {clues.map((c, i) => (
            <div
              key={c.id}
              className="p-3.5 rounded-2xl bg-pink-950/40 border border-pink-500/20 flex items-center justify-between gap-3 shadow-md animate-fadeIn"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-pink-500/20 flex items-center justify-center font-bold text-xs text-pink-300">
                  #{i + 1}
                </div>
                <div>
                  <div className="text-[10px] text-pink-300/70 font-bold">{c.playerName}</div>
                  <div className="text-base font-black text-white tracking-wide">
                    "{c.text}"
                  </div>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300">
                Clue
              </span>
            </div>
          ))}

          {/* Bot Typing Indicator */}
          {isBotTyping && (
            <div className="p-3 rounded-2xl bg-pink-950/20 border border-pink-500/15 text-pink-300 text-xs flex items-center gap-2 animate-pulse">
              <span className="text-lg">💭</span>
              <span>{botTypingName} is thinking of a one-word clue...</span>
            </div>
          )}
        </div>

        {/* Input Bar for Human Clue (when playing as Crewmate) */}
        {gameMode === "crewmate" && (
          <div className="space-y-2 pt-2">
            <div className="flex gap-2">
              <input
                value={clueInput}
                onChange={(e) => {
                  setClueInput(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleHumanSubmitClue();
                }}
                placeholder="Type your one-word clue here..."
                className="flex-1 px-4 py-3 rounded-2xl bg-black/40 border border-pink-500/30 text-sm text-white placeholder-pink-300/40 outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400"
              />
              <button
                onClick={handleHumanSubmitClue}
                className="px-5 py-3 rounded-2xl font-black text-xs bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/25 hover:brightness-110 cursor-pointer active:scale-95"
              >
                SUBMIT CLUE
              </button>
            </div>
            {validationError && (
              <div className="text-xs text-rose-400 font-bold text-center">
                ⚠️ {validationError}
              </div>
            )}
          </div>
        )}

        {/* Quick Guess Button for Impostor (if ready early) */}
        {isHumanImpostor && (
          <div className="pt-2">
            <button
              onClick={() => {
                sound.playClick();
                setPhase("guess");
              }}
              className="w-full py-3.5 rounded-2xl font-black text-xs tracking-wider bg-white/10 hover:bg-white/15 border border-pink-400/40 text-pink-200 cursor-pointer transition active:scale-95"
            >
              READY TO GUESS EARLY? CLICK HERE
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderGuessPhase = () => (
    <div className="max-w-md mx-auto w-full text-center space-y-6 animate-fadeIn py-6">
      {renderTimerRing()}

      <div className="space-y-1">
        <h2 className="text-2xl font-black text-white">Make Your Deduction!</h2>
        <p className="text-xs text-pink-200/80">
          Analyze the clues given by the crewmates and type the secret word.
        </p>
      </div>

      {/* Clues Summary */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        {clues.map((c, i) => (
          <span
            key={i}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-pink-500/15 border border-pink-500/30 text-pink-200"
          >
            "{c.text}"
          </span>
        ))}
      </div>

      {/* Guess Input Form */}
      <div className="space-y-3 pt-2">
        <input
          value={guessInput}
          onChange={(e) => {
            setGuessInput(e.target.value);
            if (validationError) setValidationError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleHumanGuess();
          }}
          autoFocus
          placeholder="Type your final guess (one word)..."
          className="w-full px-5 py-4 rounded-2xl bg-white text-zinc-950 font-black text-base outline-none shadow-xl focus:ring-4 focus:ring-pink-500 text-center"
        />
        {validationError && (
          <div className="text-xs text-rose-400 font-bold">⚠️ {validationError}</div>
        )}
        <button
          onClick={handleHumanGuess}
          className="w-full py-4 rounded-2xl font-black text-base bg-gradient-to-r from-pink-500 via-pink-600 to-pink-500 text-white shadow-xl shadow-pink-500/35 hover:brightness-110 cursor-pointer transition active:scale-95"
        >
          CONFIRM GUESS
        </button>
      </div>
    </div>
  );

  const renderReveal = () => {
    const isHumanImpostor = impostorId === "human";
    const userWon =
      (isHumanImpostor && winner === "impostor") ||
      (!isHumanImpostor && winner === "crewmates");

    return (
      <div className="max-w-lg mx-auto w-full text-center space-y-6 animate-popIn py-6">
        <div className="text-7xl animate-bounce">{userWon ? "🎉" : "💀"}</div>

        <div className="space-y-1">
          <div className="text-xs font-black tracking-widest uppercase text-pink-300">
            MATCH RESULT
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            {winner === "impostor" ? "🎭 IMPOSTOR WINS!" : "🛡️ CREWMATES WIN!"}
          </h2>
          <p className="text-sm text-pink-200/80 font-medium">
            {userWon ? "Fantastic deduction! Victory is yours!" : "Defeat this round. Better luck next match!"}
          </p>
        </div>

        {/* Word Card */}
        <div className="p-5 rounded-3xl bg-pink-950/50 border border-pink-500/30 shadow-2xl space-y-2">
          <div className="text-[10px] font-black uppercase text-pink-400 tracking-widest">
            SECRET WORD WAS
          </div>
          <div className="text-4xl font-black text-white tracking-wider">
            {secretWord?.word.toUpperCase()}
          </div>
          <div className="text-xs text-pink-300/80 font-semibold">
            Category: {secretWord?.category}
          </div>

          <div className="pt-3 border-t border-pink-500/20 text-xs text-pink-200 flex justify-around">
            <div>
              <span className="text-pink-400 font-bold">Points Earned:</span> +{lastPointsEarned} 🌸
            </div>
            <div>
              <span className="text-amber-400 font-bold">Streak:</span> {stats?.currentStreak || 0} 🔥
            </div>
          </div>
        </div>

        {/* New Badges Alert */}
        {newBadgesAlert.length > 0 && (
          <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-bold animate-pulse">
            🌟 NEW BADGE UNLOCKED: {newBadgesAlert.join(", ")}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleNextRound}
            className="flex-1 py-4 rounded-2xl font-black text-sm bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-400 hover:to-pink-500 text-white shadow-xl shadow-pink-500/30 cursor-pointer active:scale-95"
          >
            NEXT ROUND ({round + 1})
          </button>
          <button
            onClick={handleNewGame}
            className="px-6 py-4 rounded-2xl font-black text-sm bg-pink-950/40 hover:bg-pink-900/30 border border-pink-500/30 text-pink-200 cursor-pointer active:scale-95"
          >
            LOBBY
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative bg-[#1A0A0F] text-[#FFE4E1] overflow-x-hidden">
      <PetalBackground />

      {/* Navigation Header */}
      <Navbar
        streak={stats?.currentStreak || 0}
        points={stats?.pinkPoints || 0}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenSound={() => setIsSoundOpen(true)}
        onHomeClick={handleNewGame}
      />

      {/* Main Game Screen */}
      <main className="w-full max-w-4xl mx-auto px-4 py-6 flex-1 flex flex-col justify-center relative z-10">
        {phase === "lobby" && renderLobby()}
        {phase === "role_reveal" && renderRoleReveal()}
        {phase === "clue_feed" && renderClueFeed()}
        {phase === "guess" && renderGuessPhase()}
        {phase === "reveal" && renderReveal()}
      </main>

      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 60 }).map((_, i) => {
            const tx = `${(Math.random() - 0.5) * 500}px`;
            const ty = `${250 + Math.random() * 350}px`;
            const tr = `${(Math.random() - 0.5) * 720}deg`;
            const dur = `${0.9 + Math.random() * 0.7}s`;
            const colors = ["#FF69B4", "#FF1493", "#FFB6C1", "#FFE4E1", "#FFFFFF", "#FF6EB4"];
            return (
              <div
                key={i}
                className="confetti-burst absolute"
                style={
                  {
                    left: `${50 + (Math.random() - 0.5) * 80}%`,
                    top: `${30 + Math.random() * 30}%`,
                    width: `${8 + Math.random() * 8}px`,
                    height: `${8 + Math.random() * 8}px`,
                    background: colors[Math.floor(Math.random() * colors.length)],
                    borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                    opacity: 1,
                    "--tx": tx,
                    "--ty": ty,
                    "--tr": tr,
                    animationDuration: dur,
                  } as React.CSSProperties
                }
              />
            );
          })}
        </div>
      )}

      {/* Modals */}
      <SoundSettingsModal isOpen={isSoundOpen} onClose={() => setIsSoundOpen(false)} />
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
      <StatsModal isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} />
      <EmergencyModal
        isOpen={isEmergencyOpen}
        players={players}
        clues={clues}
        impostorId={impostorId}
        onVoteComplete={handleEmergencyVoteComplete}
        onClose={() => setIsEmergencyOpen(false)}
      />

      {/* Footer */}
      <footer className="w-full border-t border-pink-500/10 py-4 text-center text-xs text-pink-300/40 relative z-10">
        Impostor Word Guesser · Pink Edition · Made with 🌸 & 💗
      </footer>
    </div>
  );
}