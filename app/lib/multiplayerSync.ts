import mqtt, { MqttClient } from "mqtt";
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

const LOBBY_DISCOVERY_TOPIC = "impostor-game/v2/lobbies";
const ROOM_TOPIC_PREFIX = "impostor-game/v2/rooms/";

// Multi-broker fallback URLs for 100% uptime
const BROKER_URLS = [
  "wss://broker.emqx.io:8084/mqtt",
  "wss://broker.hivemq.com:8884/mqtt",
  "wss://test.mosquitto.org:8081",
];

export function normalizeRoomCode(raw: string): string {
  const cleaned = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  const digits = cleaned.replace(/[^0-9]/g, "");
  if (digits.length >= 3) {
    return "PINK-" + digits;
  }
  return cleaned.startsWith("PINK") ? cleaned : "PINK-" + cleaned;
}

class MultiplayerSyncManager {
  private client: MqttClient | null = null;
  private currentRoom: GameRoom | null = null;
  private activeRoomsMap: Map<string, GameRoom> = new Map();
  private activeRoomsListeners: Set<(rooms: GameRoom[]) => void> = new Set();
  private roomListeners: Map<string, Set<(room: GameRoom | null) => void>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private joinRetryInterval: NodeJS.Timeout | null = null;
  private messageQueue: { topic: string; data: any }[] = [];
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        this.broadcastChannel = new BroadcastChannel("impostor_local_channel_v2");
        this.broadcastChannel.onmessage = (e) => {
          this.handleIncomingData(e.data.topic, e.data.payload);
        };
      } catch {
        // no broadcast channel
      }

      this.connectBroker(0);

      // Periodically clean stale rooms (older than 8s without heartbeat)
      setInterval(() => {
        const now = Date.now();
        let changed = false;
        this.activeRoomsMap.forEach((room, id) => {
          if (now - room.updatedAt > 8000) {
            this.activeRoomsMap.delete(id);
            changed = true;
          }
        });
        if (changed) this.notifyActiveRooms();
      }, 3000);
    }
  }

  private connectBroker(index: number) {
    if (index >= BROKER_URLS.length) index = 0;
    const url = BROKER_URLS[index];

    try {
      const clientId = "pink_" + Math.random().toString(36).substring(2, 11);
      this.client = mqtt.connect(url, {
        clientId,
        keepalive: 30,
        reconnectPeriod: 3000,
        connectTimeout: 5000,
        clean: true,
      });

      this.client.on("connect", () => {
        this.client?.subscribe(LOBBY_DISCOVERY_TOPIC);
        if (this.currentRoom) {
          this.client?.subscribe(ROOM_TOPIC_PREFIX + this.currentRoom.id.toUpperCase());
        }

        // Flush queued messages
        while (this.messageQueue.length > 0) {
          const item = this.messageQueue.shift();
          if (item) this.publish(item.topic, item.data);
        }

        // Request all active rooms on network
        this.publish(LOBBY_DISCOVERY_TOPIC, { type: "DISCOVER_ROOMS_PING" });
      });

      this.client.on("message", (topic, message) => {
        try {
          const payload = JSON.parse(message.toString());
          this.handleIncomingData(topic, payload);
        } catch {
          // ignore parsing error
        }
      });

      this.client.on("error", () => {
        // Try fallback broker on error
        setTimeout(() => {
          if (!this.client?.connected) {
            this.client?.end(true);
            this.connectBroker(index + 1);
          }
        }, 3000);
      });
    } catch {
      // ignore
    }
  }

  private handleIncomingData(topic: string, payload: any) {
    if (topic === LOBBY_DISCOVERY_TOPIC) {
      if (payload.type === "LOBBY_HEARTBEAT" && payload.room) {
        this.activeRoomsMap.set(payload.room.id, payload.room);
        this.notifyActiveRooms();
      } else if (payload.type === "LOBBY_CLOSED" && payload.roomId) {
        this.activeRoomsMap.delete(payload.roomId);
        this.notifyActiveRooms();
      } else if (payload.type === "DISCOVER_ROOMS_PING") {
        // If we are currently hosting a waiting room, immediately broadcast heartbeat
        if (this.currentRoom && this.isCurrentPlayerHost()) {
          this.publish(LOBBY_DISCOVERY_TOPIC, {
            type: "LOBBY_HEARTBEAT",
            room: this.currentRoom,
          });
        }
      }
    } else if (topic.startsWith(ROOM_TOPIC_PREFIX)) {
      const roomId = topic.replace(ROOM_TOPIC_PREFIX, "");
      this.handleRoomMessage(roomId, payload);
    }
  }

  private handleRoomMessage(roomId: string, data: any) {
    const isHost = this.isCurrentPlayerHost();

    if (data.type === "ROOM_STATE" && data.room) {
      this.currentRoom = data.room;
      this.notifyRoomListeners(roomId, data.room);
      this.activeRoomsMap.set(data.room.id, data.room);
      this.notifyActiveRooms();

      // Stop join retry interval if we received valid room state with us inside
      if (this.joinRetryInterval) {
        const myId = this.getCurrentPlayerId();
        if (data.room.players.some((p: RoomPlayer) => p.id === myId)) {
          clearInterval(this.joinRetryInterval);
          this.joinRetryInterval = null;
        }
      }
    } else if (data.type === "PLAYER_JOIN_REQUEST" && data.player) {
      if (this.currentRoom && this.currentRoom.id === roomId && isHost) {
        const room = this.currentRoom;
        if (room.status === "waiting" && room.players.length < room.maxPlayers) {
          const existingIdx = room.players.findIndex((p) => p.id === data.player.id);
          if (existingIdx >= 0) {
            room.players[existingIdx].name = data.player.name;
            room.players[existingIdx].avatar = data.player.avatar;
          } else {
            room.players.push({
              id: data.player.id,
              name: data.player.name,
              avatar: data.player.avatar,
              isHost: false,
              isReady: true,
              isAlive: true,
              suspicion: 15,
            });
          }
          room.updatedAt = Date.now();
          this.broadcastRoomState(room);
        }
      }
    } else if (data.type === "PLAYER_LEAVE_REQUEST" && data.playerId) {
      if (this.currentRoom && this.currentRoom.id === roomId && isHost) {
        const room = this.currentRoom;
        room.players = room.players.filter((p) => p.id !== data.playerId);
        if (room.players.length === 0) {
          this.deleteRoom(roomId);
        } else {
          room.updatedAt = Date.now();
          this.broadcastRoomState(room);
        }
      }
    } else if (data.type === "SUBMIT_CLUE_REQUEST" && data.clueText && data.playerId) {
      if (this.currentRoom && this.currentRoom.id === roomId && isHost) {
        this.processClueSubmission(this.currentRoom, data.clueText, data.playerId);
      }
    } else if (data.type === "CAST_VOTE_REQUEST" && data.voterId && data.targetId) {
      if (this.currentRoom && this.currentRoom.id === roomId && isHost) {
        this.processVote(this.currentRoom, data.voterId, data.targetId);
      }
    } else if (data.type === "SUBMIT_GUESS_REQUEST" && data.guessText) {
      if (this.currentRoom && this.currentRoom.id === roomId && isHost) {
        this.processFinalGuess(this.currentRoom, data.guessText);
      }
    }
  }

  private isCurrentPlayerHost(): boolean {
    if (!this.currentRoom) return false;
    const myId = this.getCurrentPlayerId();
    return this.currentRoom.hostId === myId || this.currentRoom.players[0]?.id === myId;
  }

  private getCurrentPlayerId(): string {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("impostor_player_id") || "";
  }

  private broadcastRoomState(room: GameRoom) {
    this.currentRoom = room;
    const topic = ROOM_TOPIC_PREFIX + room.id.toUpperCase();
    this.publish(topic, { type: "ROOM_STATE", room });
    this.notifyRoomListeners(room.id, room);
    this.activeRoomsMap.set(room.id, room);
    this.notifyActiveRooms();
  }

  private publish(topic: string, data: any) {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ topic, payload: data });
      } catch {
        // ignore
      }
    }

    if (this.client && this.client.connected) {
      this.client.publish(topic, JSON.stringify(data));
    } else {
      this.messageQueue.push({ topic, data });
    }
  }

  private notifyRoomListeners(roomId: string, room: GameRoom | null) {
    const listeners = this.roomListeners.get(roomId);
    if (listeners) {
      listeners.forEach((cb) => cb(room));
    }
  }

  private notifyActiveRooms() {
    const rooms = Array.from(this.activeRoomsMap.values()).filter(
      (r) => r.status === "waiting"
    );
    this.activeRoomsListeners.forEach((cb) => cb(rooms));
  }

  // --- HOST PROCESSING ---

  private processClueSubmission(room: GameRoom, clueText: string, playerId: string) {
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;

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

    if (room.clues.length >= room.players.length) {
      room.matchPhase = "voting";
      room.votes = {};
      room.currentTurnPlayerId = null;
    } else {
      const alivePlayers = room.players.filter((p) => p.isAlive);
      const nextPlayer = alivePlayers[nextTurnIndex % alivePlayers.length];
      room.currentTurnPlayerId = nextPlayer ? nextPlayer.id : null;
    }

    room.updatedAt = Date.now();
    this.broadcastRoomState(room);
  }

  private processVote(room: GameRoom, voterId: string, targetId: string) {
    room.votes[voterId] = targetId;
    const alivePlayers = room.players.filter((p) => p.isAlive);
    const allVoted = alivePlayers.every((p) => Boolean(room.votes[p.id]));

    if (allVoted) {
      const tally: Record<string, number> = {};
      Object.values(room.votes).forEach((t) => {
        tally[t] = (tally[t] || 0) + 1;
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
      room.updatedAt = Date.now();
      this.broadcastRoomState(room);

      setTimeout(() => {
        if (this.currentRoom && this.currentRoom.id === room.id && this.currentRoom.matchPhase === "ejection_reveal") {
          this.currentRoom.matchPhase = "guess";
          this.currentRoom.updatedAt = Date.now();
          this.broadcastRoomState(this.currentRoom);
        }
      }, 4500);
    } else {
      room.updatedAt = Date.now();
      this.broadcastRoomState(room);
    }
  }

  private processFinalGuess(room: GameRoom, guessText: string) {
    if (!room.secretWord) return;
    const trimmed = guessText.trim().toLowerCase();
    const isCorrect = trimmed === room.secretWord.word.toLowerCase();

    room.impostorGuess = guessText.trim();
    room.isGuessCorrect = isCorrect;
    room.winner = isCorrect ? "impostor" : "crewmates";
    room.matchPhase = "reveal";
    room.status = "finished";
    room.updatedAt = Date.now();

    this.broadcastRoomState(room);
  }

  // --- PUBLIC METHODS ---

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

    this.currentRoom = newRoom;
    const roomTopic = ROOM_TOPIC_PREFIX + newRoom.id.toUpperCase();
    this.client?.subscribe(roomTopic);

    // Heartbeat every 1.5s
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      if (this.currentRoom && this.currentRoom.id === newRoom.id) {
        this.currentRoom.updatedAt = Date.now();
        this.publish(LOBBY_DISCOVERY_TOPIC, {
          type: "LOBBY_HEARTBEAT",
          room: this.currentRoom,
        });
      }
    }, 1500);

    this.publish(LOBBY_DISCOVERY_TOPIC, { type: "LOBBY_HEARTBEAT", room: newRoom });
    this.broadcastRoomState(newRoom);

    return newRoom;
  }

  public joinRoom(
    roomId: string,
    player: { id: string; name: string; avatar: string }
  ): { success: boolean; error?: string; room?: GameRoom } {
    const formattedId = normalizeRoomCode(roomId);
    const roomTopic = ROOM_TOPIC_PREFIX + formattedId;

    this.client?.subscribe(roomTopic);

    const sendJoin = () => {
      this.publish(roomTopic, {
        type: "PLAYER_JOIN_REQUEST",
        player: {
          id: player.id,
          name: player.name,
          avatar: player.avatar,
        },
      });
    };

    sendJoin();

    // Retry sending join request every 800ms until state is synced
    if (this.joinRetryInterval) clearInterval(this.joinRetryInterval);
    this.joinRetryInterval = setInterval(sendJoin, 800);

    const knownRoom = this.activeRoomsMap.get(formattedId);
    if (knownRoom) {
      this.currentRoom = knownRoom;
      return { success: true, room: knownRoom };
    }

    const tempRoom: GameRoom = {
      id: formattedId,
      name: "Connecting to Lobby...",
      hostId: "",
      hostName: "Host",
      status: "waiting",
      maxPlayers: 6,
      difficulty: "medium",
      gameMode: "classic",
      players: [
        {
          id: player.id,
          name: player.name,
          avatar: player.avatar,
          isHost: false,
          isReady: true,
          isAlive: true,
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
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.currentRoom = tempRoom;
    return { success: true, room: tempRoom };
  }

  public leaveRoom(roomId: string, playerId: string) {
    const formattedId = normalizeRoomCode(roomId);
    const roomTopic = ROOM_TOPIC_PREFIX + formattedId;

    this.publish(roomTopic, {
      type: "PLAYER_LEAVE_REQUEST",
      playerId,
    });

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.joinRetryInterval) {
      clearInterval(this.joinRetryInterval);
      this.joinRetryInterval = null;
    }

    this.publish(LOBBY_DISCOVERY_TOPIC, { type: "LOBBY_CLOSED", roomId: formattedId });
    this.currentRoom = null;
  }

  public startMatch(roomId: string) {
    if (!this.currentRoom || this.currentRoom.id !== roomId) return;
    const room = this.currentRoom;
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

    this.broadcastRoomState(room);

    setTimeout(() => {
      if (this.currentRoom && this.currentRoom.id === roomId && this.currentRoom.matchPhase === "role_reveal") {
        this.currentRoom.matchPhase = "clue_feed";
        this.currentRoom.updatedAt = Date.now();
        this.broadcastRoomState(this.currentRoom);
      }
    }, 2800);
  }

  public submitClue(roomId: string, clueText: string, playerId: string) {
    const formattedId = normalizeRoomCode(roomId);
    const roomTopic = ROOM_TOPIC_PREFIX + formattedId;
    this.publish(roomTopic, {
      type: "SUBMIT_CLUE_REQUEST",
      clueText,
      playerId,
    });
  }

  public castVote(roomId: string, voterId: string, targetId: string) {
    const formattedId = normalizeRoomCode(roomId);
    const roomTopic = ROOM_TOPIC_PREFIX + formattedId;
    this.publish(roomTopic, {
      type: "CAST_VOTE_REQUEST",
      voterId,
      targetId,
    });
  }

  public submitFinalGuess(roomId: string, guessText: string) {
    const formattedId = normalizeRoomCode(roomId);
    const roomTopic = ROOM_TOPIC_PREFIX + formattedId;
    this.publish(roomTopic, {
      type: "SUBMIT_GUESS_REQUEST",
      guessText,
    });
  }

  public nextRound(roomId: string) {
    if (!this.currentRoom || this.currentRoom.id !== roomId) return;
    this.currentRoom.round += 1;
    this.startMatch(roomId);
  }

  public returnRoomToLobby(roomId: string) {
    if (!this.currentRoom || this.currentRoom.id !== roomId) return;
    const room = this.currentRoom;
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

    this.broadcastRoomState(room);
  }

  private deleteRoom(roomId: string) {
    this.activeRoomsMap.delete(roomId);
    this.publish(LOBBY_DISCOVERY_TOPIC, { type: "LOBBY_CLOSED", roomId });
    this.notifyActiveRooms();
  }

  public subscribeToActiveRooms(callback: (rooms: GameRoom[]) => void): () => void {
    this.activeRoomsListeners.add(callback);
    callback(Array.from(this.activeRoomsMap.values()).filter((r) => r.status === "waiting"));

    // Ping network for live rooms immediately
    this.publish(LOBBY_DISCOVERY_TOPIC, { type: "DISCOVER_ROOMS_PING" });

    return () => {
      this.activeRoomsListeners.delete(callback);
    };
  }

  public subscribeToRoom(
    roomId: string,
    callback: (room: GameRoom | null) => void
  ): () => void {
    const formattedId = normalizeRoomCode(roomId);
    if (!this.roomListeners.has(formattedId)) {
      this.roomListeners.set(formattedId, new Set());
    }
    this.roomListeners.get(formattedId)!.add(callback);

    const roomTopic = ROOM_TOPIC_PREFIX + formattedId;
    this.client?.subscribe(roomTopic);

    const current = this.currentRoom || this.activeRoomsMap.get(formattedId) || null;
    callback(current);

    return () => {
      const set = this.roomListeners.get(formattedId);
      if (set) {
        set.delete(callback);
        if (set.size === 0) this.roomListeners.delete(formattedId);
      }
    };
  }
}

export const multiplayerSync = new MultiplayerSyncManager();
