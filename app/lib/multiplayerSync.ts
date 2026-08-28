import type { Difficulty, WordEntry } from "../constants/words";
import type { Clue } from "../types/game";
import { pickSecretWord } from "./gameHelpers";

export type RoomStatus = "waiting" | "in_game" | "finished";

export type RoomPlayer = {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  role?: "crewmate" | "impostor" | null;
  isAlive?: boolean;
  suspicion?: number;
};

export type EjectionResult = {
  electedTargetId: string;
  electedPlayerName: string | null;
  electedPlayerAvatar: string | null;
  wasImpostor: boolean;
  isSkip: boolean;
  voteTally: Record<string, number>;
};

export type GameRoom = {
  id: string; // e.g. "PINK-8472"
  name: string;
  hostId: string;
  hostName: string;
  status: RoomStatus;
  maxPlayers: number;
  difficulty: Difficulty;
  gameMode: "classic" | "blitz";
  players: RoomPlayer[];
  secretWord: WordEntry | null;
  impostorId: string | null;
  clues: Clue[];
  currentTurnPlayerId: string | null;
  turnIndex: number;
  matchPhase: "waiting" | "role_reveal" | "clue_feed" | "voting" | "ejection_reveal" | "emergency" | "guess" | "reveal";
  emergencyCaller?: string | null;
  votes: Record<string, string>; // voterId -> targetPlayerId | "skip"
  ejectionResult?: EjectionResult | null;
  winner: "impostor" | "crewmates" | null;
  impostorGuess: string | null;
  isGuessCorrect: boolean | null;
  round: number;
  createdAt: number;
  updatedAt: number;
};

const ROOMS_STORAGE_KEY = "impostor_active_online_rooms_v1";

class MultiplayerSyncManager {
  private channel: BroadcastChannel | null = null;
  private roomListeners: Map<string, Set<(room: GameRoom | null) => void>> = new Map();
  private activeRoomsListeners: Set<(rooms: GameRoom[]) => void> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        this.channel = new BroadcastChannel("impostor_multiplayer_sync");
        this.channel.onmessage = (event) => {
          this.handleBroadcastMessage(event.data);
        };
      } catch {
        // Fallback for environments without BroadcastChannel
      }

      window.addEventListener("storage", (e) => {
        if (e.key === ROOMS_STORAGE_KEY) {
          this.notifyActiveRooms();
          const rooms = this.getAllRoomsFromStorage();
          this.roomListeners.forEach((listeners, roomId) => {
            const r = rooms.find((rm) => rm.id === roomId) || null;
            listeners.forEach((cb) => cb(r));
          });
        }
      });

      this.heartbeatInterval = setInterval(() => {
        this.cleanStaleRooms();
      }, 15000);
    }
  }

  private handleBroadcastMessage(data: { type: string; roomId?: string; room?: GameRoom }) {
    if (data.type === "ROOM_UPDATED" && data.room) {
      this.saveRoomToStorage(data.room);
      this.notifyRoomListeners(data.room.id, data.room);
      this.notifyActiveRooms();
    } else if (data.type === "ROOM_DELETED" && data.roomId) {
      this.deleteRoomFromStorage(data.roomId);
      this.notifyRoomListeners(data.roomId, null);
      this.notifyActiveRooms();
    } else if (data.type === "ROOMS_SYNC_REQUEST") {
      this.notifyActiveRooms();
    }
  }

  public getAllRoomsFromStorage(): GameRoom[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(ROOMS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveRoomToStorage(room: GameRoom) {
    if (typeof window === "undefined") return;
    try {
      const rooms = this.getAllRoomsFromStorage();
      const idx = rooms.findIndex((r) => r.id === room.id);
      if (idx >= 0) {
        rooms[idx] = room;
      } else {
        rooms.unshift(room);
      }
      localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms));
    } catch (e) {
      console.error("Failed to save room:", e);
    }
  }

  private deleteRoomFromStorage(roomId: string) {
    if (typeof window === "undefined") return;
    try {
      const rooms = this.getAllRoomsFromStorage().filter((r) => r.id !== roomId);
      localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms));
    } catch (e) {
      console.error("Failed to delete room:", e);
    }
  }

  private cleanStaleRooms() {
    const now = Date.now();
    const rooms = this.getAllRoomsFromStorage().filter(
      (r) => now - r.updatedAt < 1000 * 60 * 60
    );
    if (typeof window !== "undefined") {
      localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms));
      this.notifyActiveRooms();
    }
  }

  private broadcast(data: { type: string; roomId?: string; room?: GameRoom }) {
    if (this.channel) {
      this.channel.postMessage(data);
    }
  }

  private notifyRoomListeners(roomId: string, room: GameRoom | null) {
    const listeners = this.roomListeners.get(roomId);
    if (listeners) {
      listeners.forEach((cb) => cb(room));
    }
  }

  private notifyActiveRooms() {
    const rooms = this.getAllRoomsFromStorage();
    this.activeRoomsListeners.forEach((cb) => cb(rooms));
  }

  // --- PUBLIC API ---

  public createRoom(
    hostPlayer: { id: string; name: string; avatar: string },
    options: {
      name: string;
      maxPlayers: number;
      difficulty: Difficulty;
      gameMode: "classic" | "blitz";
    }
  ): GameRoom {
    const randomCode = "PINK-" + Math.floor(1000 + Math.random() * 9000);
    const now = Date.now();

    const newRoom: GameRoom = {
      id: randomCode,
      name: options.name.trim() || ("Lobby of " + hostPlayer.name),
      hostId: hostPlayer.id,
      hostName: hostPlayer.name,
      status: "waiting",
      maxPlayers: options.maxPlayers,
      difficulty: options.difficulty,
      gameMode: options.gameMode,
      players: [
        {
          id: hostPlayer.id,
          name: hostPlayer.name,
          avatar: hostPlayer.avatar,
          isHost: true,
          isReady: true,
          isAlive: true,
          suspicion: 15,
        },
      ],
      secretWord: null,
      impostorId: null,
      clues: [],
      currentTurnPlayerId: null,
      turnIndex: 0,
      matchPhase: "waiting",
      votes: {},
      ejectionResult: null,
      winner: null,
      impostorGuess: null,
      isGuessCorrect: null,
      round: 1,
      createdAt: now,
      updatedAt: now,
    };

    this.saveRoomToStorage(newRoom);
    this.broadcast({ type: "ROOM_UPDATED", room: newRoom });
    this.notifyRoomListeners(newRoom.id, newRoom);
    this.notifyActiveRooms();

    return newRoom;
  }

  public joinRoom(
    roomId: string,
    player: { id: string; name: string; avatar: string }
  ): { success: boolean; error?: string; room?: GameRoom } {
    const rooms = this.getAllRoomsFromStorage();
    const room = rooms.find(
      (r) => r.id.toLowerCase() === roomId.trim().toLowerCase()
    );

    if (!room) {
      return { success: false, error: "Room not found. Please check room code." };
    }

    if (room.status !== "waiting") {
      return { success: false, error: "Match already in progress in this room." };
    }

    const existingPlayerIndex = room.players.findIndex((p) => p.id === player.id);
    if (existingPlayerIndex >= 0) {
      room.players[existingPlayerIndex].name = player.name;
      room.players[existingPlayerIndex].avatar = player.avatar;
    } else {
      if (room.players.length >= room.maxPlayers) {
        return { success: false, error: "Room is already full!" };
      }
      room.players.push({
        id: player.id,
        name: player.name,
        avatar: player.avatar,
        isHost: false,
        isReady: true,
        isAlive: true,
        suspicion: 15,
      });
    }

    room.updatedAt = Date.now();
    this.saveRoomToStorage(room);
    this.broadcast({ type: "ROOM_UPDATED", room });
    this.notifyRoomListeners(room.id, room);
    this.notifyActiveRooms();

    return { success: true, room };
  }

  public leaveRoom(roomId: string, playerId: string) {
    const rooms = this.getAllRoomsFromStorage();
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;

    room.players = room.players.filter((p) => p.id !== playerId);

    if (room.players.length === 0) {
      this.deleteRoomFromStorage(roomId);
      this.broadcast({ type: "ROOM_DELETED", roomId });
      this.notifyRoomListeners(roomId, null);
      this.notifyActiveRooms();
      return;
    }

    if (room.hostId === playerId) {
      room.players[0].isHost = true;
      room.hostId = room.players[0].id;
      room.hostName = room.players[0].name;
    }

    room.updatedAt = Date.now();
    this.saveRoomToStorage(room);
    this.broadcast({ type: "ROOM_UPDATED", room });
    this.notifyRoomListeners(room.id, room);
    this.notifyActiveRooms();
  }

  public startMatch(roomId: string): GameRoom | null {
    const rooms = this.getAllRoomsFromStorage();
    const room = rooms.find((r) => r.id === roomId);
    if (!room || room.players.length < 2) return null;

    const word = pickSecretWord(room.difficulty);

    const randomIdx = Math.floor(Math.random() * room.players.length);
    const impostor = room.players[randomIdx];

    const updatedPlayers = room.players.map((p, i) => ({
      ...p,
      role: (i === randomIdx ? "impostor" : "crewmate") as "impostor" | "crewmate",
      isAlive: true,
      suspicion: i === randomIdx ? 45 : 15,
    }));

    room.status = "in_game";
    room.matchPhase = "role_reveal";
    room.secretWord = word;
    room.impostorId = impostor.id;
    room.players = updatedPlayers;
    room.clues = [];
    room.turnIndex = 0;
    room.currentTurnPlayerId = updatedPlayers[0].id;
    room.votes = {};
    room.ejectionResult = null;
    room.winner = null;
    room.impostorGuess = null;
    room.isGuessCorrect = null;
    room.updatedAt = Date.now();

    this.saveRoomToStorage(room);
    this.broadcast({ type: "ROOM_UPDATED", room });
    this.notifyRoomListeners(room.id, room);
    this.notifyActiveRooms();

    setTimeout(() => {
      const currentRooms = this.getAllRoomsFromStorage();
      const current = currentRooms.find((r) => r.id === roomId);
      if (current && current.matchPhase === "role_reveal") {
        current.matchPhase = "clue_feed";
        current.updatedAt = Date.now();
        this.saveRoomToStorage(current);
        this.broadcast({ type: "ROOM_UPDATED", room: current });
        this.notifyRoomListeners(current.id, current);
      }
    }, 2800);

    return room;
  }

  public submitClue(roomId: string, clueText: string, playerId: string): GameRoom | null {
    const rooms = this.getAllRoomsFromStorage();
    const room = rooms.find((r) => r.id === roomId);
    if (!room || room.matchPhase !== "clue_feed") return null;

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return null;

    const isImpostor = playerId === room.impostorId;
    const newClue: Clue = {
      id: "clue-" + Date.now() + "-" + room.clues.length,
      playerId: player.id,
      playerName: player.name,
      text: clueText.trim(),
      isImpostorClue: isImpostor,
      timestamp: Date.now(),
      valid: true,
    };

    room.clues.push(newClue);

    const nextTurnIndex = room.turnIndex + 1;
    room.turnIndex = nextTurnIndex;

    // Check if every player has submitted a clue (or clue round complete)
    const requiredClues = room.players.length;
    if (room.clues.length >= requiredClues) {
      // Transition immediately to the VOTING PHASE!
      room.matchPhase = "voting";
      room.votes = {};
      room.currentTurnPlayerId = null;
    } else {
      const alivePlayers = room.players.filter((p) => p.isAlive);
      const nextPlayer = alivePlayers[nextTurnIndex % alivePlayers.length];
      room.currentTurnPlayerId = nextPlayer ? nextPlayer.id : null;
    }

    room.updatedAt = Date.now();
    this.saveRoomToStorage(room);
    this.broadcast({ type: "ROOM_UPDATED", room });
    this.notifyRoomListeners(room.id, room);
    return room;
  }

  public castVote(roomId: string, voterId: string, targetId: string): GameRoom | null {
    const rooms = this.getAllRoomsFromStorage();
    const room = rooms.find((r) => r.id === roomId);
    if (!room || (room.matchPhase !== "voting" && room.matchPhase !== "emergency")) return null;

    room.votes[voterId] = targetId;

    const alivePlayers = room.players.filter((p) => p.isAlive);
    const allVoted = alivePlayers.every((p) => Boolean(room.votes[p.id]));

    if (allVoted) {
      // Calculate Vote Tally
      const tally: Record<string, number> = {};
      Object.values(room.votes).forEach((target) => {
        tally[target] = (tally[target] || 0) + 1;
      });

      let highestVotes = 0;
      let electedTarget = "skip";
      Object.entries(tally).forEach(([target, count]) => {
        if (count > highestVotes) {
          highestVotes = count;
          electedTarget = target;
        }
      });

      const electedPlayer = room.players.find((p) => p.id === electedTarget) || null;
      const isSkip = electedTarget === "skip";
      const wasImpostor = electedPlayer ? electedPlayer.id === room.impostorId : false;

      room.ejectionResult = {
        electedTargetId: electedTarget,
        electedPlayerName: electedPlayer ? electedPlayer.name : "Skip",
        electedPlayerAvatar: electedPlayer ? electedPlayer.avatar : "⏩",
        wasImpostor,
        isSkip,
        voteTally: tally,
      };

      room.matchPhase = "ejection_reveal";

      // Schedule transition to Guess Phase after Ejection Reveal
      setTimeout(() => {
        const currentRooms = this.getAllRoomsFromStorage();
        const cur = currentRooms.find((r) => r.id === roomId);
        if (cur && cur.matchPhase === "ejection_reveal") {
          cur.matchPhase = "guess";
          cur.updatedAt = Date.now();
          this.saveRoomToStorage(cur);
          this.broadcast({ type: "ROOM_UPDATED", room: cur });
          this.notifyRoomListeners(cur.id, cur);
        }
      }, 4500);
    }

    room.updatedAt = Date.now();
    this.saveRoomToStorage(room);
    this.broadcast({ type: "ROOM_UPDATED", room });
    this.notifyRoomListeners(room.id, room);
    return room;
  }

  public submitFinalGuess(roomId: string, guessText: string): GameRoom | null {
    const rooms = this.getAllRoomsFromStorage();
    const room = rooms.find((r) => r.id === roomId);
    if (!room || !room.secretWord) return null;

    const trimmed = guessText.trim().toLowerCase();
    const isCorrect = trimmed === room.secretWord.word.toLowerCase();

    room.impostorGuess = guessText.trim();
    room.isGuessCorrect = isCorrect;

    // Check if Impostor was already caught in voting:
    // If Impostor was voted out, they only win if they guessed the secret word correctly!
    // If Crewmates voted out the Impostor and Impostor guessed wrong -> Crewmates Win!
    if (isCorrect) {
      room.winner = "impostor";
    } else {
      room.winner = "crewmates";
    }

    room.matchPhase = "reveal";
    room.status = "finished";
    room.updatedAt = Date.now();

    this.saveRoomToStorage(room);
    this.broadcast({ type: "ROOM_UPDATED", room });
    this.notifyRoomListeners(room.id, room);
    this.notifyActiveRooms();

    return room;
  }

  public nextRound(roomId: string): GameRoom | null {
    const rooms = this.getAllRoomsFromStorage();
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return null;

    room.round += 1;
    return this.startMatch(roomId);
  }

  public returnRoomToLobby(roomId: string): GameRoom | null {
    const rooms = this.getAllRoomsFromStorage();
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return null;

    room.status = "waiting";
    room.matchPhase = "waiting";
    room.secretWord = null;
    room.impostorId = null;
    room.clues = [];
    room.votes = {};
    room.ejectionResult = null;
    room.winner = null;
    room.impostorGuess = null;
    room.isGuessCorrect = null;
    room.updatedAt = Date.now();

    this.saveRoomToStorage(room);
    this.broadcast({ type: "ROOM_UPDATED", room });
    this.notifyRoomListeners(room.id, room);
    this.notifyActiveRooms();

    return room;
  }

  public subscribeToActiveRooms(callback: (rooms: GameRoom[]) => void): () => void {
    this.activeRoomsListeners.add(callback);
    callback(this.getAllRoomsFromStorage());
    return () => {
      this.activeRoomsListeners.delete(callback);
    };
  }

  public subscribeToRoom(
    roomId: string,
    callback: (room: GameRoom | null) => void
  ): () => void {
    if (!this.roomListeners.has(roomId)) {
      this.roomListeners.set(roomId, new Set());
    }
    this.roomListeners.get(roomId)!.add(callback);

    const rooms = this.getAllRoomsFromStorage();
    const current = rooms.find((r) => r.id.toLowerCase() === roomId.toLowerCase()) || null;
    callback(current);

    return () => {
      const set = this.roomListeners.get(roomId);
      if (set) {
        set.delete(callback);
        if (set.size === 0) this.roomListeners.delete(roomId);
      }
    };
  }
}

export const multiplayerSync = new MultiplayerSyncManager();
