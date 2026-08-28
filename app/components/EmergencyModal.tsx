"use client";
import React, { useState, useEffect } from "react";
import sound from "../lib/soundSystem";
import type { Player, Clue } from "../types/game";

type Props = {
  isOpen: boolean;
  players: Player[];
  clues: Clue[];
  impostorId: string;
  onVoteComplete: (eliminatedPlayer: Player | null, isImpostorEliminated: boolean) => void;
  onClose: () => void;
};

export default function EmergencyModal({
  isOpen,
  players,
  clues,
  impostorId,
  onVoteComplete,
  onClose,
}: Props) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isVotingEnded, setIsVotingEnded] = useState(false);
  const [eliminatedPlayer, setEliminatedPlayer] = useState<Player | null>(null);
  const [chatMessages, setChatMessages] = useState<{ id: string; name: string; avatar: string; text: string }[]>([]);

  useEffect(() => {
    if (isOpen) {
      sound.playEmergency();
      setIsVotingEnded(false);
      setSelectedPlayerId(null);
      setEliminatedPlayer(null);

      // Generate simulated chat dialogue based on current clues
      const messages: { id: string; name: string; avatar: string; text: string }[] = [];
      const aliveBots = players.filter((p) => !p.isHuman && p.isAlive);

      if (aliveBots.length > 0) {
        const bot1 = aliveBots[0];
        messages.push({
          id: "msg-1",
          name: bot1.name,
          avatar: bot1.avatar,
          text: "Why did we call an emergency meeting? Who is looking suspicious?",
        });
      }

      if (clues.length > 0) {
        const lastClue = clues[clues.length - 1];
        if (aliveBots.length > 1) {
          const bot2 = aliveBots[1];
          messages.push({
            id: "msg-2",
            name: bot2.name,
            avatar: bot2.avatar,
            text: `The clue "${lastClue.text}" felt kind of vague... was that the impostor?`,
          });
        }
      }

      setChatMessages(messages);
    }
  }, [isOpen, players, clues]);

  if (!isOpen) return null;

  const handleCastVote = () => {
    if (!selectedPlayerId && selectedPlayerId !== "skip") return;
    sound.playVoteCast();

    let targetPlayer: Player | null = null;
    if (selectedPlayerId !== "skip") {
      targetPlayer = players.find((p) => p.id === selectedPlayerId) || null;
    }

    setEliminatedPlayer(targetPlayer);
    setIsVotingEnded(true);

    const isImpostor = targetPlayer?.id === impostorId;

    setTimeout(() => {
      onVoteComplete(targetPlayer, isImpostor);
    }, 2800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-fadeIn">
      <div
        className="w-full max-w-xl rounded-3xl p-6 relative flex flex-col border-2 border-pink-500 shadow-2xl shadow-pink-500/40"
        style={{
          background: "linear-gradient(155deg, #2D0818, #14040B)",
          color: "#FFE4E1",
        }}
      >
        {/* Siren Banner */}
        <div className="text-center pb-4 border-b border-pink-500/20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-300 text-xs font-black tracking-widest uppercase animate-pulse">
            🚨 EMERGENCY MEETING IN SESSION 🚨
          </div>
          <h2 className="text-2xl font-black text-white mt-2">Who is the Impostor?</h2>
          <p className="text-xs text-pink-300/70">Analyze suspicion levels and vote to eliminate the suspect!</p>
        </div>

        {!isVotingEnded ? (
          <div className="space-y-4 py-4">
            {/* Suspect Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {players
                .filter((p) => p.isAlive)
                .map((p) => {
                  const isSelected = selectedPlayerId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        sound.playClick();
                        setSelectedPlayerId(p.id);
                      }}
                      className={`p-3 rounded-2xl text-left border cursor-pointer transition relative ${
                        isSelected
                          ? "bg-pink-600/30 border-pink-400 shadow-lg shadow-pink-500/20 ring-2 ring-pink-500"
                          : "bg-pink-950/30 border-pink-500/20 hover:bg-pink-900/20"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{p.avatar}</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-white truncate">
                            {p.name} {p.isHuman && "(You)"}
                          </div>
                          <div className="text-[10px] text-pink-300/70">
                            Suspicion: <span className={p.suspicion > 50 ? "text-rose-400 font-bold" : "text-pink-400"}>{p.suspicion}%</span>
                          </div>
                        </div>
                      </div>
                      {/* Suspicion Bar */}
                      <div className="w-full bg-pink-950 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            p.suspicion > 60
                              ? "bg-rose-500"
                              : p.suspicion > 30
                              ? "bg-pink-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${p.suspicion}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
            </div>

            {/* Skip Vote Option */}
            <button
              onClick={() => {
                sound.playClick();
                setSelectedPlayerId("skip");
              }}
              className={`w-full py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                selectedPlayerId === "skip"
                  ? "bg-zinc-800 border-pink-400 text-white ring-2 ring-pink-500"
                  : "bg-pink-950/20 border-pink-500/20 text-pink-300 hover:bg-pink-900/20"
              }`}
            >
              Skip Vote (Not enough evidence)
            </button>

            {/* Chat Simulation */}
            <div className="p-3 rounded-2xl bg-black/30 border border-pink-500/15 max-h-24 overflow-y-auto space-y-1.5">
              <div className="text-[10px] font-bold text-pink-400/80 uppercase">Meeting Discussion:</div>
              {chatMessages.map((m) => (
                <div key={m.id} className="text-xs text-pink-200/90 flex items-start gap-1.5">
                  <span>{m.avatar}</span>
                  <span>
                    <b className="text-pink-300">{m.name}:</b> {m.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => {
                  sound.playClick();
                  onClose();
                }}
                className="flex-1 py-3 rounded-2xl font-bold text-xs bg-pink-950/40 hover:bg-pink-900/30 border border-pink-500/20 text-pink-300 cursor-pointer"
              >
                CANCEL MEETING
              </button>
              <button
                disabled={!selectedPlayerId}
                onClick={handleCastVote}
                className={`flex-1 py-3 rounded-2xl font-black text-xs tracking-wider uppercase transition cursor-pointer shadow-lg ${
                  selectedPlayerId
                    ? "bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-pink-500/30 active:scale-95"
                    : "bg-pink-950/40 text-pink-500/40 border border-pink-500/10 cursor-not-allowed"
                }`}
              >
                CONFIRM VOTE
              </button>
            </div>
          </div>
        ) : (
          /* Ejection Reveal Screen */
          <div className="py-12 text-center space-y-4 animate-fadeIn">
            {eliminatedPlayer ? (
              <>
                <div className="text-6xl animate-bounce">{eliminatedPlayer.avatar}</div>
                <h3 className="text-2xl font-black text-white">
                  {eliminatedPlayer.name} was ejected.
                </h3>
                <p className="text-lg font-bold">
                  {eliminatedPlayer.id === impostorId ? (
                    <span className="text-pink-400 animate-pulse">
                      🌸 {eliminatedPlayer.name} WAS THE IMPOSTOR! 🌸
                    </span>
                  ) : (
                    <span className="text-zinc-400">
                      {eliminatedPlayer.name} was NOT The Impostor.
                    </span>
                  )}
                </p>
              </>
            ) : (
              <>
                <div className="text-5xl">🕊️</div>
                <h3 className="text-2xl font-black text-white">No one was ejected.</h3>
                <p className="text-sm text-pink-300/70">The meeting ended with a skipped vote.</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

