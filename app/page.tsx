"use client";
import { useEffect, useState, useRef } from "react";
import PetalBackground from "./components/PetalBackground";
import SoundSettingsModal from "./components/SoundSettingsModal";
import RulesModal from "./components/RulesModal";
import StatsModal from "./components/StatsModal";
import sound from "./lib/soundSystem";
import { loadStats, recordGameResult, PlayerStats } from "./lib/stats";
import { DIFFICULTY_CONFIG } from "./constants/gameConfig";
import type { Difficulty } from "./constants/words";
import { validateClue, generateUniquePinkProfile } from "./lib/gameHelpers";
import {
  multiplayerSync,
  GameRoom,
} from "./lib/multiplayerSync";

const DIFF_ORDER: Difficulty[] = ["easy", "medium", "hard", "extremely_hard"];

export default function Home() {
  // Navigation & Modals state
  const [isSoundOpen, setIsSoundOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [stats, setStats] = useState<PlayerStats | null>(null);

  // Local Player Identity (Always unique per browser/device)
  const [playerId, setPlayerId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [playerAvatar, setPlayerAvatar] = useState("🌸");

  // Create Lobby Form State
  const [createRoomName, setCreateRoomName] = useState("");
  const [createMaxPlayers, setCreateMaxPlayers] = useState<number>(4);
  const [createDifficulty, setCreateDifficulty] = useState<Difficulty>("medium");
  const [createGameMode, setCreateGameMode] = useState<"classic" | "blitz">("classic");
  const [joinRoomCodeInput, setJoinRoomCodeInput] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);

  // Online Multiplayer State
  const [activeRooms, setActiveRooms] = useState<GameRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // In-Game Inputs & Interaction
  const [clueInput, setClueInput] = useState("");
  const [guessInput, setGuessInput] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedVoteTarget, setSelectedVoteTarget] = useState<string | null>(null);
  const [hideSecretWord, setHideSecretWord] = useState(false);
  const [hintsAvailable, setHintsAvailable] = useState(2);
  const [unlockedHints, setUnlockedHints] = useState<{ type: string; label: string; value: string }[]>([]);
  const [timeLeft, setTimeLeft] = useState(75);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Unique Player ID & Profile per Browser
  useEffect(() => {
    setStats(loadStats());

    let savedId = localStorage.getItem("impostor_player_id");
    if (!savedId) {
      savedId = "player_" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem("impostor_player_id", savedId);
    }
    setPlayerId(savedId);

    let savedName = localStorage.getItem("impostor_player_name");
    let savedAvatar = localStorage.getItem("impostor_player_avatar");

    // Enforce unique cute pink name if empty or starts with Player or Guest
    const isGeneric = !savedName || savedName.toLowerCase().startsWith("player") || savedName.toLowerCase().startsWith("guest");
    if (isGeneric) {
      const generated = generateUniquePinkProfile();
      savedName = generated.name;
      savedAvatar = generated.avatar;
      localStorage.setItem("impostor_player_name", savedName);
      localStorage.setItem("impostor_player_avatar", savedAvatar);
    }

    setPlayerName(savedName || "PinkPlayer");
    setPlayerAvatar(savedAvatar || "🌸");
  }, []);

  const handleUpdateProfile = (name: string, avatar: string) => {
    setPlayerName(name);
    setPlayerAvatar(avatar);
    localStorage.setItem("impostor_player_name", name);
    localStorage.setItem("impostor_player_avatar", avatar);
  };

  const handleRollRandomProfile = () => {
    sound.playClick();
    const generated = generateUniquePinkProfile();
    handleUpdateProfile(generated.name, generated.avatar);
  };

  // Subscribe to Active Online Rooms
  useEffect(() => {
    const unsubscribe = multiplayerSync.subscribeToActiveRooms((rooms) => {
      setActiveRooms(rooms);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to Current Joined Room
  useEffect(() => {
    if (!currentRoom?.id) return;
    const unsubscribe = multiplayerSync.subscribeToRoom(currentRoom.id, (room) => {
      setCurrentRoom(room);
      if (room?.matchPhase === "role_reveal") {
        sound.playRoleReveal();
      } else if (room?.matchPhase === "voting") {
        sound.playEmergency();
      } else if (room?.matchPhase === "ejection_reveal") {
        sound.playRoleReveal();
      }
    });
    return () => unsubscribe();
  }, [currentRoom?.id]);

  // Turn timer
  useEffect(() => {
    if (!currentRoom || currentRoom.status !== "in_game") return;
    if (currentRoom.matchPhase !== "clue_feed" && currentRoom.matchPhase !== "voting" && currentRoom.matchPhase !== "guess") return;

    setTimeLeft(currentRoom.gameMode === "blitz" ? 45 : 60);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentRoom?.status, currentRoom?.matchPhase, currentRoom?.turnIndex]);

  // Handle Create Lobby
  const handleCreateLobby = () => {
    sound.playClick();
    const newRoom = multiplayerSync.createRoom(
      { id: playerId, name: playerName || "PinkPlayer", avatar: playerAvatar },
      {
        name: createRoomName || (playerName || "Pink") + "'s Room",
        maxPlayers: createMaxPlayers,
        difficulty: createDifficulty,
        gameMode: createGameMode,
      }
    );
    setCurrentRoom(newRoom);
  };

  // Handle Join Lobby
  const handleJoinLobby = (roomId: string) => {
    sound.playClick();
    setJoinError(null);
    const res = multiplayerSync.joinRoom(roomId, {
      id: playerId,
      name: playerName || "PinkPlayer",
      avatar: playerAvatar,
    });
    if (res.success && res.room) {
      setCurrentRoom(res.room);
    } else {
      setJoinError(res.error || "Failed to join room.");
    }
  };

  // Handle Leave Room
  const handleLeaveRoom = () => {
    sound.playClick();
    if (currentRoom) {
      multiplayerSync.leaveRoom(currentRoom.id, playerId);
    }
    setCurrentRoom(null);
    setClueInput("");
    setGuessInput("");
    setValidationError(null);
    setSelectedVoteTarget(null);
    setUnlockedHints([]);
  };

  // Handle Start Match (Host Only)
  const handleStartMatch = () => {
    if (!currentRoom || currentRoom.hostId !== playerId) return;
    if (currentRoom.players.length < 2) {
      setValidationError("Need at least 2 players to start!");
      return;
    }
    sound.playClick();
    setValidationError(null);
    setHintsAvailable(currentRoom.difficulty === "easy" ? 3 : currentRoom.difficulty === "medium" ? 2 : 1);
    setUnlockedHints([]);
    multiplayerSync.startMatch(currentRoom.id);
  };

  // Handle Submit Clue
  const handleSubmitClue = () => {
    if (!currentRoom) return;
    const trimmed = clueInput.trim();
    if (!trimmed) {
      setValidationError("Please enter a clue!");
      return;
    }
    if (trimmed.includes(" ")) {
      setValidationError("Clue must be ONE word only!");
      return;
    }

    const isImpostor = currentRoom.impostorId === playerId;
    if (!isImpostor && currentRoom.secretWord) {
      const res = validateClue(trimmed, currentRoom.secretWord.word);
      if (!res.valid) {
        setValidationError(res.reason || "Invalid clue");
        return;
      }
    }

    sound.playCluePop();
    setValidationError(null);
    multiplayerSync.submitClue(currentRoom.id, trimmed, playerId);
    setClueInput("");
  };

  // Handle Vote in Voting Phase
  const handleConfirmVote = () => {
    if (!currentRoom || !selectedVoteTarget) return;
    sound.playVoteCast();
    multiplayerSync.castVote(currentRoom.id, playerId, selectedVoteTarget);
    setSelectedVoteTarget(null);
  };

  // Handle Final Guess by Impostor
  const handleConfirmGuess = () => {
    if (!currentRoom) return;
    const trimmed = guessInput.trim();
    if (!trimmed) {
      setValidationError("Enter a single word guess!");
      return;
    }
    setValidationError(null);
    multiplayerSync.submitFinalGuess(currentRoom.id, trimmed);
  };

  // Handle Unlock Hint
  const handleUseHint = () => {
    if (!currentRoom || !currentRoom.secretWord || hintsAvailable <= 0) return;
    sound.playHint();
    setHintsAvailable((prev) => prev - 1);

    const word = currentRoom.secretWord;
    const hintList = [
      { type: "category", label: "Category", value: word.category },
      { type: "first_letter", label: "First Letter", value: `"${word.word[0].toUpperCase()}"` },
      { type: "length", label: "Word Length", value: `${word.word.length} letters` },
    ];

    const available = hintList.filter((h) => !unlockedHints.some((u) => u.type === h.type));
    if (available.length > 0) {
      setUnlockedHints((prev) => [...prev, available[0]]);
    }
  };

  // Copy Room Code
  const handleCopyCode = (code: string) => {
    sound.playClick();
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const isHost = currentRoom?.hostId === playerId;
  const isMyTurn = currentRoom?.currentTurnPlayerId === playerId;
  const isImpostor = currentRoom?.impostorId === playerId;

  // -------------------------------------------------------------
  // RENDER: MAIN HOME & ACTIVE LOBBIES (TWO COLUMNS)
  // -------------------------------------------------------------
  const renderHomeAndLobbies = () => (
    <div className="w-full max-w-6xl mx-auto py-6 sm:py-10 space-y-6 animate-fadeIn">
      {/* Top Bar: Streak, Points & Modals */}
      <div className="flex items-center justify-between gap-3 p-3.5 rounded-3xl bg-pink-950/40 border border-pink-500/25 shadow-lg">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-pink-900/50 border border-pink-500/30 text-xs font-black shadow-inner">
          <span className="text-amber-400">🔥 {stats?.currentStreak || 0}</span>
          <span className="text-pink-500/40">|</span>
          <span className="text-pink-300">🌸 {stats?.pinkPoints || 0}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playClick();
              setIsRulesOpen(true);
            }}
            className="px-3 py-1.5 rounded-2xl bg-pink-950/50 hover:bg-pink-900/40 border border-pink-500/25 text-pink-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition active:scale-95"
          >
            <span>📖</span>
            <span className="hidden sm:inline">Rules</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setIsStatsOpen(true);
            }}
            className="px-3 py-1.5 rounded-2xl bg-pink-950/50 hover:bg-pink-900/40 border border-pink-500/25 text-pink-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition active:scale-95"
          >
            <span>🏆</span>
            <span className="hidden sm:inline">Stats</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setIsSoundOpen(true);
            }}
            className="px-3 py-1.5 rounded-2xl bg-pink-950/50 hover:bg-pink-900/40 border border-pink-500/25 text-pink-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition active:scale-95"
          >
            <span>🔊</span>
            <span className="hidden sm:inline">Audio</span>
          </button>
        </div>
      </div>

      {/* Main Title Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-300 text-xs font-black tracking-widest uppercase shadow-sm">
          <span>🌸</span> REAL-TIME MULTIPLAYER WORD DEDUCTION <span>🎭</span>
        </div>
        <h1 className="font-black text-4xl sm:text-6xl tracking-tight text-white leading-none drop-shadow-md">
          IMPOSTOR <br />
          <span className="bg-gradient-to-r from-pink-400 via-pink-500 to-pink-300 bg-clip-text text-transparent">
            PINK MULTIPLAYER
          </span>
        </h1>
        <p className="text-sm text-pink-200/80 font-medium">
          Give clues, vote on the Impostor, and make your deduction!
        </p>
      </div>

      {/* Profile Bar with Unique Name & Randomizer */}
      <div className="p-4 rounded-3xl bg-pink-950/40 border border-pink-500/25 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="text-3xl p-2.5 rounded-2xl bg-pink-500/20 border border-pink-500/30 shadow-inner">
            {playerAvatar}
          </div>
          <div className="flex-1">
            <div className="text-[10px] uppercase font-black tracking-wider text-pink-400">
              Your Player Identity
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <input
                value={playerName}
                onChange={(e) => handleUpdateProfile(e.target.value, playerAvatar)}
                placeholder="Enter your name..."
                className="font-black text-white text-base bg-transparent outline-none border-b border-pink-500/30 focus:border-pink-400 px-1 py-0.5 w-full max-w-[180px]"
              />
              <button
                onClick={handleRollRandomProfile}
                title="Roll a new cute random name & avatar"
                className="px-2.5 py-1 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 text-pink-200 text-xs font-black cursor-pointer transition active:scale-95 flex items-center gap-1 shadow-sm"
              >
                <span>🎲</span> Random
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap justify-center">
          {["🌸", "🎀", "💗", "🦩", "💖", "🎭", "✨", "👑", "🦄", "🍧", "🧁", "🌷"].map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                sound.playClick();
                handleUpdateProfile(playerName, emoji);
              }}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-base transition cursor-pointer ${
                playerAvatar === emoji
                  ? "bg-pink-500 text-white ring-2 ring-pink-300 scale-110 shadow-md shadow-pink-500/40"
                  : "bg-pink-950/40 hover:bg-pink-900/30 border border-pink-500/20"
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* TWO COLUMNS: Left (Create Lobby & Join Code) / Right (Live Active Lobbies) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Create & Join Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Create Lobby Card */}
          <div className="p-6 rounded-3xl bg-pink-950/40 border border-pink-500/25 shadow-xl space-y-5">
            <div className="flex items-center gap-2 border-b border-pink-500/20 pb-3">
              <span className="text-2xl">➕</span>
              <div>
                <h3 className="font-black text-lg text-white">Create a New Lobby</h3>
                <p className="text-xs text-pink-300/70">Host a room and invite your friends or wait for players.</p>
              </div>
            </div>

            {/* Room Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-black tracking-wider text-pink-300 uppercase block">
                Lobby Name
              </label>
              <input
                value={createRoomName}
                onChange={(e) => setCreateRoomName(e.target.value)}
                placeholder={`${playerName}'s Room`}
                className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-pink-500/30 text-sm text-white placeholder-pink-300/40 outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400"
              />
            </div>

            {/* Max Players (3 to 10) */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black tracking-wider text-pink-300 uppercase">
                  Max Real Players
                </label>
                <span className="text-xs font-bold text-pink-400">{createMaxPlayers} Players</span>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {[3, 4, 5, 6, 8, 10].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      sound.playClick();
                      setCreateMaxPlayers(num);
                    }}
                    className={`py-2.5 rounded-xl font-black text-xs border cursor-pointer transition ${
                      createMaxPlayers === num
                        ? "bg-pink-500 border-pink-300 text-white ring-2 ring-pink-400 shadow-md shadow-pink-500/30 scale-105"
                        : "bg-pink-950/30 border-pink-500/20 text-pink-200 hover:bg-pink-900/25"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Level */}
            <div className="space-y-1.5">
              <label className="text-xs font-black tracking-wider text-pink-300 uppercase block">
                Difficulty Level
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DIFF_ORDER.map((d) => {
                  const c = DIFFICULTY_CONFIG[d];
                  const active = d === createDifficulty;
                  return (
                    <button
                      key={d}
                      onClick={() => {
                        sound.playClick();
                        setCreateDifficulty(d);
                      }}
                      className={`p-3 rounded-2xl text-left border cursor-pointer transition relative ${
                        active
                          ? "bg-gradient-to-br from-pink-500 to-pink-600 border-pink-300 text-white ring-2 ring-pink-400 shadow-md shadow-pink-500/30"
                          : "bg-pink-950/30 border-pink-500/20 text-pink-200 hover:bg-pink-900/25"
                      }`}
                    >
                      <div className="font-black text-xs">{c.label}</div>
                      <div className="text-[10px] opacity-75 mt-0.5">{c.timeLimit}s</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreateLobby}
              className="w-full py-4 rounded-2xl font-black text-sm tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 via-pink-600 to-pink-500 text-white shadow-xl shadow-pink-500/35 hover:brightness-110 cursor-pointer transition transform active:scale-95"
            >
              <span>🚀</span> CREATE MULTIPLAYER LOBBY
            </button>
          </div>

          {/* Join with Code Card */}
          <div className="p-5 rounded-3xl bg-pink-950/30 border border-pink-500/20 shadow-lg space-y-3">
            <div className="text-xs font-black tracking-wider text-pink-300 uppercase">
              Join with Room Code
            </div>
            <div className="flex gap-2">
              <input
                value={joinRoomCodeInput}
                onChange={(e) => {
                  setJoinRoomCodeInput(e.target.value);
                  if (joinError) setJoinError(null);
                }}
                placeholder="e.g. PINK-7429"
                className="flex-1 px-4 py-3 rounded-2xl bg-black/40 border border-pink-500/30 text-sm text-white placeholder-pink-300/40 uppercase tracking-widest font-black outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400"
              />
              <button
                onClick={() => handleJoinLobby(joinRoomCodeInput)}
                className="px-6 py-3 rounded-2xl font-black text-xs bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-500/25 cursor-pointer transition active:scale-95"
              >
                JOIN
              </button>
            </div>
            {joinError && (
              <div className="text-xs text-rose-400 font-bold">⚠️ {joinError}</div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Online Lobbies Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-pink-950/40 border border-pink-500/25 shadow-xl flex flex-col h-full min-h-[450px]">
            <div className="flex items-center justify-between border-b border-pink-500/20 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="font-black text-base text-white">Active Online Lobbies</h3>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                {activeRooms.length} Live
              </span>
            </div>

            {/* List of Live Rooms */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {activeRooms.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3 text-pink-300/60">
                  <div className="text-5xl animate-bounce">📡</div>
                  <div className="font-black text-sm text-pink-200">No Active Lobbies Yet</div>
                  <p className="text-xs text-pink-300/60 max-w-[220px]">
                    Create a lobby on the left to start hosting, and other players will see your room here!
                  </p>
                </div>
              ) : (
                activeRooms.map((room) => {
                  const isFull = room.players.length >= room.maxPlayers;
                  const isPlaying = room.status === "in_game";

                  return (
                    <div
                      key={room.id}
                      className="p-4 rounded-2xl bg-pink-950/50 hover:bg-pink-900/40 border border-pink-500/20 flex flex-col gap-3 transition shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-black text-sm text-white flex items-center gap-1.5">
                            <span>{room.name}</span>
                          </div>
                          <div className="text-[10px] text-pink-300/70 font-semibold flex items-center gap-2 mt-0.5">
                            <span>👑 Host: {room.hostName}</span>
                            <span>·</span>
                            <span className="uppercase font-bold text-pink-400">{room.difficulty}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-300">
                          {room.id}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-pink-500/10">
                        {/* Player Avatars */}
                        <div className="flex items-center gap-1">
                          <div className="flex -space-x-1.5">
                            {room.players.map((p) => (
                              <span
                                key={p.id}
                                title={p.name}
                                className="w-6 h-6 rounded-full bg-pink-900 border border-pink-400 flex items-center justify-center text-xs shadow-sm"
                              >
                                {p.avatar}
                              </span>
                            ))}
                          </div>
                          <span className="text-xs font-bold text-pink-300 ml-1.5">
                            {room.players.length}/{room.maxPlayers}
                          </span>
                        </div>

                        {/* Join Button */}
                        <button
                          disabled={isFull || isPlaying}
                          onClick={() => handleJoinLobby(room.id)}
                          className={`px-4 py-1.5 rounded-xl font-black text-xs transition cursor-pointer shadow-md ${
                            isPlaying
                              ? "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed"
                              : isFull
                              ? "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed"
                              : "bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-pink-500/30 hover:brightness-110 active:scale-95"
                          }`}
                        >
                          {isPlaying ? "IN GAME" : isFull ? "FULL" : "JOIN"}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // -------------------------------------------------------------
  // RENDER: WAITING LOBBY ROOM
  // -------------------------------------------------------------
  const renderWaitingLobby = () => {
    if (!currentRoom) return null;

    return (
      <div className="w-full max-w-2xl mx-auto py-8 space-y-6 animate-fadeIn">
        <div className="p-6 rounded-3xl bg-pink-950/40 border border-pink-500/25 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-pink-500/20 pb-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-pink-400">
                MULTIPLAYER WAITING ROOM
              </div>
              <h2 className="font-black text-2xl sm:text-3xl text-white">{currentRoom.name}</h2>
              <div className="text-xs text-pink-300/80 mt-1 flex items-center gap-2">
                <span>Difficulty: <b className="text-pink-400 capitalize">{currentRoom.difficulty}</b></span>
                <span>·</span>
                <span>Mode: <b className="text-pink-400 capitalize">{currentRoom.gameMode}</b></span>
              </div>
            </div>

            {/* Room Code Badge */}
            <div className="flex items-center gap-2">
              <div className="px-4 py-2 rounded-2xl bg-black/50 border border-pink-500/40 text-center">
                <div className="text-[9px] font-bold text-pink-400 uppercase">Room Code</div>
                <div className="font-black text-lg text-white tracking-widest">{currentRoom.id}</div>
              </div>
              <button
                onClick={() => handleCopyCode(currentRoom.id)}
                className="p-3 rounded-2xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 text-pink-200 text-sm font-bold cursor-pointer transition active:scale-95"
                title="Copy Room Code"
              >
                {copiedCode ? "✓ Copied" : "📋 Copy"}
              </button>
            </div>
          </div>

          {/* Connected Real Players List */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs font-black text-pink-300 uppercase">
              <span>Connected Players ({currentRoom.players.length}/{currentRoom.maxPlayers})</span>
              <span className="text-pink-400 font-bold">1 Impostor randomly picked at start</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentRoom.players.map((p) => {
                const isMe = p.id === playerId;
                return (
                  <div
                    key={p.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 shadow-md ${
                      isMe
                        ? "bg-pink-600/25 border-pink-400 ring-2 ring-pink-500/50"
                        : "bg-pink-950/40 border-pink-500/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{p.avatar}</span>
                      <div>
                        <div className="font-black text-sm text-white flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {isMe && <span className="text-[10px] text-pink-300 font-bold">(You)</span>}
                        </div>
                        <div className="text-[10px] text-pink-400 font-bold">
                          {p.isHost ? "👑 Lobby Host" : "Ready to play"}
                        </div>
                      </div>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                );
              })}

              {/* Empty Slots */}
              {Array.from({ length: Math.max(0, currentRoom.maxPlayers - currentRoom.players.length) }).map(
                (_, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl border border-dashed border-pink-500/20 bg-pink-950/10 flex items-center justify-center text-xs text-pink-400/50 font-bold"
                  >
                    <span>Waiting for Player {currentRoom.players.length + i + 1}...</span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-pink-500/20 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleLeaveRoom}
              className="px-6 py-4 rounded-2xl font-bold text-xs bg-pink-950/40 hover:bg-pink-900/30 border border-pink-500/25 text-pink-300 cursor-pointer transition active:scale-95"
            >
              🚪 LEAVE LOBBY
            </button>

            {isHost ? (
              <button
                onClick={handleStartMatch}
                disabled={currentRoom.players.length < 2}
                className={`flex-1 py-4 rounded-2xl font-black text-sm tracking-wider flex items-center justify-center gap-2 shadow-xl transition cursor-pointer ${
                  currentRoom.players.length >= 2
                    ? "bg-gradient-to-r from-pink-500 via-pink-600 to-pink-500 text-white shadow-pink-500/35 hover:brightness-110 active:scale-95"
                    : "bg-pink-950/40 text-pink-500/40 border border-pink-500/15 cursor-not-allowed"
                }`}
              >
                <span>▶</span> START MATCH ({currentRoom.players.length} PLAYERS)
              </button>
            ) : (
              <div className="flex-1 py-4 rounded-2xl bg-pink-950/30 border border-pink-500/20 text-center font-bold text-xs text-pink-300 animate-pulse flex items-center justify-center">
                Waiting for Host ({currentRoom.hostName}) to start the game...
              </div>
            )}
          </div>
          {validationError && (
            <div className="text-xs text-rose-400 font-bold text-center">
              ⚠️ {validationError}
            </div>
          )}
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // RENDER: ROLE REVEAL
  // -------------------------------------------------------------
  const renderRoleReveal = () => {
    if (!currentRoom) return null;

    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-6 animate-popIn">
        <div className="text-7xl animate-bounce">
          {isImpostor ? "🎭" : "🛡️"}
        </div>
        <div className="space-y-2">
          <div className="text-xs font-black tracking-widest text-pink-300 uppercase">
            YOUR ASSIGNED ROLE
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight">
            {isImpostor ? "YOU ARE THE IMPOSTOR" : "YOU ARE A CREWMATE"}
          </h2>
          <p className="text-sm text-pink-200/80">
            {isImpostor
              ? "You do NOT know the secret word! Bluff your clue and deduce the word before voting!"
              : `The secret word is "${currentRoom.secretWord?.word.toUpperCase()}" in [${currentRoom.secretWord?.category}]. Give subtle clues!`}
          </p>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // RENDER: CLUE FEED PHASE (TURN BASED FOR REAL PLAYERS)
  // -------------------------------------------------------------
  const renderClueFeed = () => {
    if (!currentRoom) return null;
    const currentTurnPlayer = currentRoom.players.find((p) => p.id === currentRoom.currentTurnPlayerId);

    return (
      <div className="max-w-xl mx-auto w-full space-y-5 animate-fadeIn py-4">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-1">
          <div className="text-xs font-black text-pink-300 uppercase tracking-wider flex items-center gap-2">
            <span>Round {currentRoom.round}</span>
            <span className="text-pink-500/40">·</span>
            <span>Room: {currentRoom.id}</span>
          </div>
          <button
            onClick={handleLeaveRoom}
            className="px-3 py-1 rounded-xl bg-pink-950/40 hover:bg-pink-900/30 border border-pink-500/25 text-pink-300 text-xs font-bold cursor-pointer transition active:scale-95"
          >
            🚪 Leave Match
          </button>
        </div>

        {/* Secret Word or Impostor Card */}
        <div className="p-4 rounded-3xl bg-pink-950/40 border border-pink-500/20 shadow-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-2xl">
              {isImpostor ? "🎭" : "🛡️"}
            </div>
            <div>
              <div className="text-[10px] font-black uppercase text-pink-400 tracking-wider">
                {isImpostor ? "Role: Impostor" : "Role: Crewmate"}
              </div>
              <div className="font-black text-white text-base">
                {isImpostor ? (
                  <span className="text-pink-300">Secret: [ ? ? ? ? ]</span>
                ) : (
                  <span>
                    Word:{" "}
                    <b className={hideSecretWord ? "blur-sm transition" : "text-pink-400 transition"}>
                      {currentRoom.secretWord?.word.toUpperCase()}
                    </b>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isImpostor && (
              <button
                onClick={() => setHideSecretWord((prev) => !prev)}
                className="px-2.5 py-1.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs font-bold hover:bg-pink-500/20 cursor-pointer"
              >
                {hideSecretWord ? "👁️ Show" : "🙈 Hide"}
              </button>
            )}
          </div>
        </div>

        {/* Live Clue Feed */}
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          <div className="text-[11px] font-black uppercase text-pink-300/80 px-1">
            Live Clue Feed ({currentRoom.clues.length}/{currentRoom.players.length})
          </div>

          {currentRoom.clues.map((c, i) => (
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

          {/* Turn indicator message */}
          <div className="p-3 rounded-2xl bg-pink-950/30 border border-pink-500/20 text-pink-200 text-xs flex items-center gap-2 animate-pulse">
            <span className="text-base">👉</span>
            <span>
              {isMyTurn
                ? "It's YOUR TURN to submit a one-word clue!"
                : `Waiting for ${currentTurnPlayer?.name || "next player"} to give a clue...`}
            </span>
          </div>
        </div>

        {/* Input Bar (When it's YOUR TURN) */}
        {isMyTurn && (
          <div className="space-y-2 pt-2 animate-fadeIn">
            <div className="flex gap-2">
              <input
                value={clueInput}
                onChange={(e) => {
                  setClueInput(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmitClue();
                }}
                autoFocus
                placeholder={
                  isImpostor
                    ? "Type a bluff clue to blend in..."
                    : `Type a clue for "${currentRoom.secretWord?.word.toUpperCase()}"...`
                }
                className="flex-1 px-4 py-3 rounded-2xl bg-black/40 border border-pink-500/30 text-sm text-white placeholder-pink-300/40 outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400"
              />
              <button
                onClick={handleSubmitClue}
                className="px-6 py-3 rounded-2xl font-black text-xs bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/25 hover:brightness-110 cursor-pointer active:scale-95"
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
      </div>
    );
  };

  // -------------------------------------------------------------
  // RENDER: VOTING PHASE (VOTE WHO THE IMPOSTOR IS)
  // -------------------------------------------------------------
  const renderVotingPhase = () => {
    if (!currentRoom) return null;

    const myVote = currentRoom.votes[playerId];

    return (
      <div className="max-w-xl mx-auto w-full py-6 space-y-5 animate-fadeIn">
        {/* Header */}
        <div className="text-center pb-2 border-b border-pink-500/20 space-y-1">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-300 text-xs font-black tracking-widest uppercase animate-pulse">
            🗳️ VOTING PHASE: GUESS THE IMPOSTOR
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Who is the Impostor?</h2>
          <p className="text-xs text-pink-300/80">
            Review the clues given and vote for the player you suspect!
          </p>
        </div>

        {/* Clues Review Summary */}
        <div className="p-4 rounded-2xl bg-pink-950/40 border border-pink-500/20 space-y-2">
          <div className="text-[10px] font-black text-pink-400 uppercase tracking-wider">
            Clues Submitted This Round:
          </div>
          <div className="grid grid-cols-2 gap-2">
            {currentRoom.clues.map((c) => (
              <div
                key={c.id}
                className="px-3 py-2 rounded-xl bg-pink-900/30 border border-pink-500/15 flex items-center justify-between text-xs"
              >
                <span className="font-bold text-pink-200">{c.playerName}:</span>
                <span className="font-black text-white">"{c.text}"</span>
              </div>
            ))}
          </div>
        </div>

        {/* Player Voting Grid */}
        <div className="space-y-2">
          <div className="text-xs font-black text-pink-300 uppercase px-1 flex justify-between">
            <span>Select a Suspect to Eject</span>
            <span className="text-pink-400">
              Votes Cast: {Object.keys(currentRoom.votes).length}/{currentRoom.players.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {currentRoom.players
              .filter((p) => p.isAlive)
              .map((p) => {
                const isSelected = selectedVoteTarget === p.id;
                const hasVoted = Boolean(currentRoom.votes[p.id]);

                return (
                  <button
                    key={p.id}
                    disabled={Boolean(myVote)}
                    onClick={() => {
                      sound.playClick();
                      setSelectedVoteTarget(p.id);
                    }}
                    className={`p-3.5 rounded-2xl text-left border transition relative cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-br from-pink-600/40 to-pink-950 border-pink-400 ring-2 ring-pink-500 shadow-lg shadow-pink-500/30"
                        : "bg-pink-950/30 border-pink-500/20 hover:bg-pink-900/30"
                    } ${myVote ? "opacity-75 cursor-default" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{p.avatar}</span>
                        <div>
                          <div className="font-black text-sm text-white">
                            {p.name} {p.id === playerId && "(You)"}
                          </div>
                          <div className="text-[10px] text-pink-300/70 font-semibold mt-0.5">
                            {hasVoted ? "✓ Vote Locked" : "Thinking..."}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs font-black">
                          ✓
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Skip Option */}
        <button
          disabled={Boolean(myVote)}
          onClick={() => setSelectedVoteTarget("skip")}
          className={`w-full py-3 rounded-2xl border text-xs font-black uppercase transition cursor-pointer ${
            selectedVoteTarget === "skip"
              ? "bg-zinc-800 border-pink-400 text-white ring-2 ring-pink-500"
              : "bg-pink-950/20 border-pink-500/20 text-pink-300 hover:bg-pink-900/20"
          } ${myVote ? "opacity-75 cursor-default" : ""}`}
        >
          Skip Vote (Not enough evidence)
        </button>

        {/* Confirm Vote Button */}
        {!myVote ? (
          <button
            disabled={!selectedVoteTarget}
            onClick={handleConfirmVote}
            className={`w-full py-4 rounded-2xl font-black text-sm tracking-wider uppercase transition cursor-pointer shadow-lg ${
              selectedVoteTarget
                ? "bg-gradient-to-r from-pink-500 via-pink-600 to-pink-500 text-white shadow-pink-500/35 hover:brightness-110 active:scale-95"
                : "bg-pink-950/40 text-pink-500/40 border border-pink-500/10 cursor-not-allowed"
            }`}
          >
            CONFIRM VOTE
          </button>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center animate-pulse">
            ✓ Your vote is locked in! Waiting for other players to finish voting...
          </div>
        )}
      </div>
    );
  };

  // -------------------------------------------------------------
  // RENDER: EJECTION REVEAL
  // -------------------------------------------------------------
  const renderEjectionReveal = () => {
    if (!currentRoom || !currentRoom.ejectionResult) return null;
    const res = currentRoom.ejectionResult;

    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-6 animate-popIn">
        <div className="text-7xl animate-bounce">
          {res.isSkip ? "⏩" : res.wasImpostor ? "🎉" : "💀"}
        </div>

        <div className="space-y-2">
          <div className="text-xs font-black tracking-widest uppercase text-pink-300">
            VOTING RESULTS
          </div>

          {res.isSkip ? (
            <h2 className="text-3xl font-black text-white">The Vote Was Skipped!</h2>
          ) : (
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white">
                {res.electedPlayerAvatar} {res.electedPlayerName} Was Ejected!
              </h2>
              <div
                className={`inline-block px-5 py-2 rounded-2xl text-sm font-black tracking-wider uppercase shadow-xl ${
                  res.wasImpostor
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white ring-2 ring-emerald-300"
                    : "bg-gradient-to-r from-rose-600 to-pink-700 text-white ring-2 ring-rose-400"
                }`}
              >
                {res.wasImpostor
                  ? "🎭 THEY WERE THE IMPOSTOR!"
                  : "🛡️ THEY WERE AN INNOCENT CREWMATE!"}
              </div>
            </div>
          )}

          <p className="text-xs text-pink-200/70 pt-2">
            {res.wasImpostor
              ? "The Impostor has one final chance to steal victory by guessing the secret word!"
              : "The Impostor is still at large and gets to make their deduction!"}
          </p>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // RENDER: FINAL GUESS PHASE
  // -------------------------------------------------------------
  const renderGuessPhase = () => {
    if (!currentRoom) return null;

    return (
      <div className="max-w-md mx-auto w-full text-center space-y-6 animate-fadeIn py-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white">Final Word Deduction</h2>
          <p className="text-xs text-pink-200/80">
            {isImpostor
              ? "Type your final guess for the secret word!"
              : "The Impostor is making their final deduction guess..."}
          </p>
        </div>

        {/* Clues Summary */}
        <div className="flex flex-wrap gap-1.5 justify-center">
          {currentRoom.clues.map((c, i) => (
            <span
              key={i}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-pink-500/15 border border-pink-500/30 text-pink-200"
            >
              "{c.text}"
            </span>
          ))}
        </div>

        {isImpostor ? (
          <div className="space-y-3 pt-2">
            <input
              value={guessInput}
              onChange={(e) => {
                setGuessInput(e.target.value);
                if (validationError) setValidationError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmGuess();
              }}
              autoFocus
              placeholder="Type your final guess (one word)..."
              className="w-full px-5 py-4 rounded-2xl bg-white text-zinc-950 font-black text-base outline-none shadow-xl focus:ring-4 focus:ring-pink-500 text-center"
            />
            {validationError && (
              <div className="text-xs text-rose-400 font-bold">⚠️ {validationError}</div>
            )}
            <button
              onClick={handleConfirmGuess}
              className="w-full py-4 rounded-2xl font-black text-base bg-gradient-to-r from-pink-500 via-pink-600 to-pink-500 text-white shadow-xl shadow-pink-500/35 hover:brightness-110 cursor-pointer transition active:scale-95"
            >
              CONFIRM FINAL GUESS
            </button>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-pink-950/30 border border-pink-500/20 text-pink-200 text-sm font-bold animate-pulse">
            💭 Impostor is deducing the word...
          </div>
        )}
      </div>
    );
  };

  // -------------------------------------------------------------
  // RENDER: REVEAL & MATCH RESULTS
  // -------------------------------------------------------------
  const renderReveal = () => {
    if (!currentRoom) return null;
    const userWon =
      (isImpostor && currentRoom.winner === "impostor") ||
      (!isImpostor && currentRoom.winner === "crewmates");

    return (
      <div className="max-w-lg mx-auto w-full text-center space-y-6 animate-popIn py-6">
        <div className="text-7xl animate-bounce">{userWon ? "🎉" : "💀"}</div>

        <div className="space-y-1">
          <div className="text-xs font-black tracking-widest uppercase text-pink-300">
            MATCH RESULT
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            {currentRoom.winner === "impostor" ? "🎭 IMPOSTOR WINS!" : "🛡️ CREWMATES WIN!"}
          </h2>
          <p className="text-sm text-pink-200/80 font-medium">
            {userWon ? "Fantastic deduction! Victory is yours!" : "Better luck next round!"}
          </p>
        </div>

        {/* Word Card */}
        <div className="p-5 rounded-3xl bg-pink-950/50 border border-pink-500/30 shadow-2xl space-y-2">
          <div className="text-[10px] font-black uppercase text-pink-400 tracking-widest">
            SECRET WORD WAS
          </div>
          <div className="text-4xl font-black text-white tracking-wider">
            {currentRoom.secretWord?.word.toUpperCase()}
          </div>
          <div className="text-xs text-pink-300/80 font-semibold">
            Category: {currentRoom.secretWord?.category}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 pt-2">
          {isHost && (
            <button
              onClick={() => multiplayerSync.nextRound(currentRoom.id)}
              className="flex-1 py-4 rounded-2xl font-black text-sm bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-400 hover:to-pink-500 text-white shadow-xl shadow-pink-500/30 cursor-pointer active:scale-95"
            >
              NEXT ROUND ({currentRoom.round + 1})
            </button>
          )}
          <button
            onClick={() => multiplayerSync.returnRoomToLobby(currentRoom.id)}
            className="flex-1 py-4 rounded-2xl font-black text-sm bg-pink-950/40 hover:bg-pink-900/30 border border-pink-500/30 text-pink-200 cursor-pointer active:scale-95"
          >
            RETURN TO LOBBY
          </button>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // MAIN ROUTING
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen w-full flex flex-col relative bg-[#1A0A0F] text-[#FFE4E1] overflow-x-hidden">
      <PetalBackground />

      <main className="w-full max-w-6xl mx-auto px-4 py-6 flex-1 flex flex-col justify-center relative z-10">
        {!currentRoom && renderHomeAndLobbies()}
        {currentRoom && currentRoom.matchPhase === "waiting" && renderWaitingLobby()}
        {currentRoom && currentRoom.matchPhase === "role_reveal" && renderRoleReveal()}
        {currentRoom && currentRoom.matchPhase === "clue_feed" && renderClueFeed()}
        {currentRoom && currentRoom.matchPhase === "voting" && renderVotingPhase()}
        {currentRoom && currentRoom.matchPhase === "ejection_reveal" && renderEjectionReveal()}
        {currentRoom && currentRoom.matchPhase === "guess" && renderGuessPhase()}
        {currentRoom && currentRoom.matchPhase === "reveal" && renderReveal()}
      </main>

      <SoundSettingsModal isOpen={isSoundOpen} onClose={() => setIsSoundOpen(false)} />
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
      <StatsModal isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} />

      <footer className="w-full border-t border-pink-500/10 py-4 text-center text-xs text-pink-300/40 relative z-10">
        Impostor Word Guesser · Pink Edition · Real-Time Multiplayer
      </footer>
    </div>
  );
}
