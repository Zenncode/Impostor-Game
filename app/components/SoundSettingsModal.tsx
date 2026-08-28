"use client";
import React, { useState, useEffect } from "react";
import sound from "../lib/soundSystem";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function SoundSettingsModal({ isOpen, onClose }: Props) {
  const [sfx, setSfx] = useState(true);
  const [bgm, setBgm] = useState(false);
  const [sfxVol, setSfxVol] = useState(0.7);
  const [bgmVol, setBgmVol] = useState(0.3);

  useEffect(() => {
    const s = sound.getSettings();
    setSfx(s.sfxEnabled);
    setBgm(s.bgmEnabled);
    setSfxVol(s.sfxVolume);
    setBgmVol(s.bgmVolume);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleSfx = () => {
    const next = !sfx;
    setSfx(next);
    sound.setSfxEnabled(next);
    if (next) sound.playClick();
  };

  const handleToggleBgm = () => {
    const next = !bgm;
    setBgm(next);
    sound.setBgmEnabled(next);
  };

  const handleSfxVolChange = (v: number) => {
    setSfxVol(v);
    sound.setSfxVolume(v);
  };

  const handleBgmVolChange = (v: number) => {
    setBgmVol(v);
    sound.setBgmVolume(v);
  };

  const testSfx = (type: "pop" | "hint" | "victory" | "emergency") => {
    if (type === "pop") sound.playCluePop();
    if (type === "hint") sound.playHint();
    if (type === "victory") sound.playVictory();
    if (type === "emergency") sound.playEmergency();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-md rounded-3xl p-6 relative overflow-hidden border border-pink-500/30 shadow-2xl shadow-pink-500/20"
        style={{
          background: "linear-gradient(145deg, #240C1A, #15060E)",
          color: "#FFE4E1",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-pink-500/20">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400">
              🔊
            </span>
            <div>
              <h3 className="font-black text-xl text-white tracking-wide">Audio Settings</h3>
              <p className="text-xs text-pink-300/70">Custom Pink Soundscape & Synth BGM</p>
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

        {/* Content */}
        <div className="space-y-6 pt-5">
          {/* Sound Effects Toggle */}
          <div className="p-4 rounded-2xl bg-pink-950/30 border border-pink-500/15 flex items-center justify-between">
            <div>
              <div className="font-bold text-sm text-white">Sound Effects (SFX)</div>
              <div className="text-xs text-pink-300/60">Clicks, bubble pops, clues, hints, victory chime</div>
            </div>
            <button
              onClick={handleToggleSfx}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                sfx ? "bg-gradient-to-r from-pink-500 to-pink-600" : "bg-zinc-800"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md ${
                  sfx ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* SFX Volume Slider */}
          {sfx && (
            <div className="space-y-2 px-1">
              <div className="flex justify-between text-xs font-semibold text-pink-300">
                <span>SFX Volume</span>
                <span>{Math.round(sfxVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={sfxVol}
                onChange={(e) => handleSfxVolChange(parseFloat(e.target.value))}
                className="w-full accent-pink-500 h-2 bg-pink-950 rounded-lg cursor-pointer"
              />
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => testSfx("pop")}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/20 text-pink-200 cursor-pointer"
                >
                  Test Pop 🫧
                </button>
                <button
                  onClick={() => testSfx("hint")}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/20 text-pink-200 cursor-pointer"
                >
                  Test Hint ✨
                </button>
                <button
                  onClick={() => testSfx("victory")}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/20 text-pink-200 cursor-pointer"
                >
                  Test Fanfare 🎺
                </button>
              </div>
            </div>
          )}

          {/* BGM Ambient Synth Toggle */}
          <div className="p-4 rounded-2xl bg-pink-950/30 border border-pink-500/15 flex items-center justify-between">
            <div>
              <div className="font-bold text-sm text-white">Ambient Pink BGM</div>
              <div className="text-xs text-pink-300/60">Relaxing generative synth background music</div>
            </div>
            <button
              onClick={handleToggleBgm}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                bgm ? "bg-gradient-to-r from-pink-500 to-pink-600" : "bg-zinc-800"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md ${
                  bgm ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* BGM Volume Slider */}
          {bgm && (
            <div className="space-y-2 px-1">
              <div className="flex justify-between text-xs font-semibold text-pink-300">
                <span>BGM Music Volume</span>
                <span>{Math.round(bgmVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={bgmVol}
                onChange={(e) => handleBgmVolChange(parseFloat(e.target.value))}
                className="w-full accent-pink-500 h-2 bg-pink-950 rounded-lg cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-7 pt-4 border-t border-pink-500/20">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-full py-3 rounded-2xl font-black text-sm bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-400 hover:to-pink-500 text-white shadow-lg shadow-pink-500/25 cursor-pointer transition transform active:scale-95"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
}

