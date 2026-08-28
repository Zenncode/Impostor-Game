"use client";
import React from "react";
import sound from "../lib/soundSystem";

type Props = {
  streak: number;
  points: number;
  onOpenStats: () => void;
  onOpenRules: () => void;
  onOpenSound: () => void;
  onHomeClick?: () => void;
};

export default function Navbar({
  streak,
  points,
  onOpenStats,
  onOpenRules,
  onOpenSound,
  onHomeClick,
}: Props) {
  return (
    <header className="w-full border-b border-pink-500/20 bg-[#1A0A0F]/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={() => {
            sound.playClick();
            if (onHomeClick) onHomeClick();
          }}
          className="flex items-center gap-2.5 cursor-pointer group text-left"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-600 via-pink-500 to-pink-400 flex items-center justify-center text-xl shadow-md shadow-pink-500/30 group-hover:scale-105 transition transform">
            🎭
          </div>
          <div>
            <div className="font-black text-sm sm:text-base leading-none text-white flex items-center gap-1.5">
              <span>IMPOSTOR</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                PINK 🌸
              </span>
            </div>
            <div className="text-[10px] text-pink-300/70 font-semibold tracking-wider">
              WORD GUESSER
            </div>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Streak & Points Badges */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-pink-950/40 border border-pink-500/20 text-xs font-bold">
            <span className="text-amber-400">🔥 {streak}</span>
            <span className="text-pink-500/40">|</span>
            <span className="text-pink-300">🌸 {points}</span>
          </div>

          {/* Rules Button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenRules();
            }}
            title="How to play"
            className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-pink-950/30 hover:bg-pink-900/30 border border-pink-500/20 text-pink-300 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition active:scale-95"
          >
            <span>📖</span>
            <span className="hidden sm:inline">Rules</span>
          </button>

          {/* Stats Button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenStats();
            }}
            title="View Stats & Badges"
            className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-pink-950/30 hover:bg-pink-900/30 border border-pink-500/20 text-pink-300 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition active:scale-95"
          >
            <span>🏆</span>
            <span className="hidden sm:inline">Stats</span>
          </button>

          {/* Sound & Music Settings */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenSound();
            }}
            title="Sound & Music Settings"
            className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-pink-950/30 hover:bg-pink-900/30 border border-pink-500/20 text-pink-300 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition active:scale-95"
          >
            <span>🔊</span>
            <span className="hidden sm:inline">Audio</span>
          </button>
        </div>
      </div>
    </header>
  );
}

