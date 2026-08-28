"use client";
import React, { useState, useEffect } from "react";
import { loadStats, PlayerStats } from "../lib/stats";
import sound from "../lib/soundSystem";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function StatsModal({ isOpen, onClose }: Props) {
  const [stats, setStats] = useState<PlayerStats | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStats(loadStats());
    }
  }, [isOpen]);

  if (!isOpen || !stats) return null;

  const totalWins = stats.impostorWins + stats.crewmateWins;
  const winRate = stats.gamesPlayed > 0 ? Math.round((totalWins / stats.gamesPlayed) * 100) : 0;
  const unlockedBadgesCount = stats.badges.filter((b) => b.unlocked).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-lg max-h-[85vh] rounded-3xl p-6 relative flex flex-col border border-pink-500/30 shadow-2xl shadow-pink-500/20"
        style={{
          background: "linear-gradient(145deg, #240C1A, #15060E)",
          color: "#FFE4E1",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-pink-500/20">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400">
              🏆
            </span>
            <div>
              <h3 className="font-black text-xl text-white tracking-wide">Player Profile & Stats</h3>
              <p className="text-xs text-pink-300/70">Career deduction record & achievements</p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 flex items-center justify-center text-pink-300 cursor-pointer transition"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto space-y-5 py-4 pr-1 text-sm">
          {/* Key Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-pink-950/40 border border-pink-500/20 text-center">
              <div className="text-2xl font-black text-white">{stats.gamesPlayed}</div>
              <div className="text-[10px] font-bold tracking-wider text-pink-300/70 uppercase mt-0.5">Games</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-pink-950/40 border border-pink-500/20 text-center">
              <div className="text-2xl font-black text-pink-400">{winRate}%</div>
              <div className="text-[10px] font-bold tracking-wider text-pink-300/70 uppercase mt-0.5">Win Rate</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-pink-950/40 border border-pink-500/20 text-center">
              <div className="text-2xl font-black text-amber-400">{stats.currentStreak} 🔥</div>
              <div className="text-[10px] font-bold tracking-wider text-pink-300/70 uppercase mt-0.5">Streak</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-pink-950/40 border border-pink-500/20 text-center">
              <div className="text-2xl font-black text-pink-300">{stats.pinkPoints} 🌸</div>
              <div className="text-[10px] font-bold tracking-wider text-pink-300/70 uppercase mt-0.5">Pink Points</div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="p-4 rounded-2xl bg-pink-950/40 border border-pink-500/15 space-y-2">
            <div className="font-bold text-xs text-pink-300 uppercase tracking-wider">Role Performance</div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/15">
                <span className="text-pink-200">🎭 Impostor Wins</span>
                <span className="font-black text-white">{stats.impostorWins}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/15">
                <span className="text-pink-200">🛡️ Crewmate Wins</span>
                <span className="font-black text-white">{stats.crewmateWins}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/15">
                <span className="text-pink-200">⚡ Fast Deductions (&lt;15s)</span>
                <span className="font-black text-white">{stats.fastGuesses}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/15">
                <span className="text-pink-200">👑 Best Streak</span>
                <span className="font-black text-white">{stats.bestStreak}</span>
              </div>
            </div>
          </div>

          {/* Achievements / Badges */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <span className="font-bold text-xs text-pink-300 uppercase tracking-wider">
                Badges & Achievements ({unlockedBadgesCount}/{stats.badges.length})
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {stats.badges.map((b) => (
                <div
                  key={b.id}
                  className={`p-3 rounded-2xl border flex items-center gap-3 transition ${
                    b.unlocked
                      ? "bg-pink-900/30 border-pink-500/40 shadow-sm shadow-pink-500/10"
                      : "bg-pink-950/20 border-pink-500/10 opacity-50 grayscale"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                      b.unlocked ? "bg-gradient-to-br from-pink-500/30 to-pink-600/30 border border-pink-500/40" : "bg-zinc-800"
                    }`}
                  >
                    {b.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-white truncate flex items-center gap-1">
                      {b.name}
                      {b.unlocked && <span className="text-[10px] text-pink-400">✓</span>}
                    </div>
                    <div className="text-[10px] text-pink-300/70 truncate">{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-pink-500/20">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-full py-3 rounded-2xl font-black text-sm bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-400 hover:to-pink-500 text-white shadow-lg shadow-pink-500/25 cursor-pointer transition transform active:scale-95"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}

