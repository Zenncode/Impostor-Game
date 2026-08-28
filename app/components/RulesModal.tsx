"use client";
import React from "react";
import sound from "../lib/soundSystem";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function RulesModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

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
              📖
            </span>
            <div>
              <h3 className="font-black text-xl text-white tracking-wide">How To Play</h3>
              <p className="text-xs text-pink-300/70">Impostor Word Guesser — Pink Edition</p>
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
        <div className="overflow-y-auto space-y-4 py-4 pr-1 text-sm">
          {/* Objective */}
          <div className="p-4 rounded-2xl bg-pink-950/40 border border-pink-500/15">
            <div className="font-bold text-pink-300 flex items-center gap-2 mb-1">
              <span>🎯</span> Objective (3-10 Players · Min 3)
            </div>
            <p className="text-xs text-pink-100/90 leading-relaxed">
              Designed for <b>3 to 10 players</b> (minimum 3: 1 Impostor + 2 Crewmates). Every round, a <b>SECRET WORD</b> is chosen. All Crewmates know the word, but the <b>IMPOSTOR</b> is in the dark! Players take turns giving <b>ONE-WORD CLUES</b>. The Impostor must deduce the word before the timer expires.
            </p>
          </div>

          {/* Roles */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-pink-900/20 border border-pink-500/30">
              <div className="font-bold text-sm text-pink-400 flex items-center gap-1.5 mb-1">
                <span>🎭</span> Impostor
              </div>
              <p className="text-[11px] text-pink-200/80 leading-relaxed">
                You don't know the word. Read the clues, spend hint tokens wisely, and type the correct single-word guess to win!
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-pink-900/20 border border-pink-500/30">
              <div className="font-bold text-sm text-pink-400 flex items-center gap-1.5 mb-1">
                <span>🛡️</span> Crewmate
              </div>
              <p className="text-[11px] text-pink-200/80 leading-relaxed">
                You know the secret word. Give subtle clues without giving the answer away too easily, or call an Emergency Meeting to eject the impostor!
              </p>
            </div>
          </div>

          {/* Clue Rules */}
          <div className="p-4 rounded-2xl bg-pink-950/40 border border-pink-500/15 space-y-2">
            <div className="font-bold text-pink-300 flex items-center gap-2">
              <span>✍️</span> Clue Rules
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-300">
                <div className="font-bold text-[11px] mb-0.5">✅ ALLOWED</div>
                <ul className="text-[10px] space-y-0.5 list-disc pl-3 text-emerald-200/90">
                  <li>Single word clues</li>
                  <li>Synonyms & related terms</li>
                  <li>Descriptive adjectives</li>
                </ul>
              </div>
              <div className="p-2 rounded-xl bg-rose-950/30 border border-rose-500/20 text-rose-300">
                <div className="font-bold text-[11px] mb-0.5">❌ FORBIDDEN</div>
                <ul className="text-[10px] space-y-0.5 list-disc pl-3 text-rose-200/90">
                  <li>The secret word itself</li>
                  <li>Substrings of the word</li>
                  <li>Rhymes & multiple words</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Difficulties */}
          <div className="p-4 rounded-2xl bg-pink-950/40 border border-pink-500/15">
            <div className="font-bold text-pink-300 flex items-center gap-2 mb-2">
              <span>⚡</span> Difficulty Levels
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center p-2 rounded-xl bg-pink-500/10">
                <span className="font-bold text-pink-300">🌸 Easy</span>
                <span className="text-[11px] text-pink-200/70">8 Clues · 90s · 3 Hints (First letter, category, length)</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-xl bg-pink-500/10">
                <span className="font-bold text-pink-400">🌺 Medium</span>
                <span className="text-[11px] text-pink-200/70">6 Clues · 75s · 2 Hints (First letter, category)</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-xl bg-pink-500/10">
                <span className="font-bold text-pink-500">🎀 Hard</span>
                <span className="text-[11px] text-pink-200/70">5 Clues · 60s · 1 Hint (Category only)</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-xl bg-pink-500/10">
                <span className="font-bold text-pink-600">💗 Extreme</span>
                <span className="text-[11px] text-pink-200/70">4 Clues · 45s · 0 Hints (Pure instinct!)</span>
              </div>
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
            GOT IT, LET'S PLAY!
          </button>
        </div>
      </div>
    </div>
  );
}

