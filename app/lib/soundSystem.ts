// Procedural Web Audio API Sound System
// Zero external asset dependencies, zero latency, runs on all modern browsers

class SoundSystem {
  private ctx: AudioContext | null = null;
  private sfxEnabled: boolean = true;
  private bgmEnabled: boolean = false;
  private sfxVolume: number = 0.7;
  private bgmVolume: number = 0.3;
  private bgmOscillators: { stop: () => void }[] = [];
  private bgmTimer: NodeJS.Timeout | null = null;
  private isBgmPlaying: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      const savedSfx = localStorage.getItem("impostor_sfx");
      const savedBgm = localStorage.getItem("impostor_bgm");
      const savedSfxVol = localStorage.getItem("impostor_sfx_vol");
      const savedBgmVol = localStorage.getItem("impostor_bgm_vol");

      if (savedSfx !== null) this.sfxEnabled = savedSfx === "true";
      if (savedBgm !== null) this.bgmEnabled = savedBgm === "true";
      if (savedSfxVol !== null) this.sfxVolume = parseFloat(savedSfxVol);
      if (savedBgmVol !== null) this.bgmVolume = parseFloat(savedBgmVol);
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public getSettings() {
    return {
      sfxEnabled: this.sfxEnabled,
      bgmEnabled: this.bgmEnabled,
      sfxVolume: this.sfxVolume,
      bgmVolume: this.bgmVolume,
    };
  }

  public setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
    if (typeof window !== "undefined") localStorage.setItem("impostor_sfx", String(enabled));
  }

  public setBgmEnabled(enabled: boolean) {
    this.bgmEnabled = enabled;
    if (typeof window !== "undefined") localStorage.setItem("impostor_bgm", String(enabled));
    if (enabled) {
      this.startBgm();
    } else {
      this.stopBgm();
    }
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (typeof window !== "undefined") localStorage.setItem("impostor_sfx_vol", String(this.sfxVolume));
  }

  public setBgmVolume(vol: number) {
    this.bgmVolume = Math.max(0, Math.min(1, vol));
    if (typeof window !== "undefined") localStorage.setItem("impostor_bgm_vol", String(this.bgmVolume));
  }

  // --- SFX GENERATORS ---

  // 1. UI Click / Button Press
  public playClick() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

      gain.gain.setValueAtTime(this.sfxVolume * 0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // ignore
    }
  }

  // 2. Clue Popped / Revealed (Cute bubble pop)
  public playCluePop() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

      gain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // ignore
    }
  }

  // 3. Hint Used (Ascending magical sparkle arpeggio)
  public playHint() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime + idx * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(this.sfxVolume * 0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.18);
      });
    } catch {
      // ignore
    }
  }

  // 4. Timer Warning Pulse / Heartbeat
  public playHeartbeat() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [0, 0.14].forEach((delay) => {
        if (!this.ctx) return;
        const t = now + delay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(90, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.09);

        gain.gain.setValueAtTime(this.sfxVolume * 0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.09);
      });
    } catch {
      // ignore
    }
  }

  // 5. Timer Subtle Tick
  public playTick() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.02);

      gain.gain.setValueAtTime(this.sfxVolume * 0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.02);
    } catch {
      // ignore
    }
  }

  // 6. Victory Fanfare (Celebratory uplifting chords)
  public playVictory() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const chords = [
        { freqs: [440, 554.37, 659.25], start: 0, dur: 0.18 },
        { freqs: [493.88, 622.25, 739.99], start: 0.18, dur: 0.18 },
        { freqs: [587.33, 739.99, 880], start: 0.36, dur: 0.22 },
        { freqs: [659.25, 830.61, 987.77, 1318.5], start: 0.58, dur: 0.8 },
      ];

      chords.forEach((chord) => {
        chord.freqs.forEach((freq) => {
          if (!this.ctx) return;
          const now = this.ctx.currentTime + chord.start;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(this.sfxVolume * 0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + chord.dur);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now);
          osc.stop(now + chord.dur);
        });
      });
    } catch {
      // ignore
    }
  }

  // 7. Defeat / Wrong Buzz
  public playDefeat() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [
        { freq: 330, start: 0, dur: 0.25 },
        { freq: 311, start: 0.25, dur: 0.25 },
        { freq: 293, start: 0.5, dur: 0.5 },
      ];

      notes.forEach((n) => {
        if (!this.ctx) return;
        const t = now + n.start;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(n.freq, t);

        gain.gain.setValueAtTime(this.sfxVolume * 0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + n.dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + n.dur);
      });
    } catch {
      // ignore
    }
  }

  // 8. Emergency Meeting Siren
  public playEmergency() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const t = now + i * 0.35;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(700, t);
        osc.frequency.linearRampToValueAtTime(1100, t + 0.16);
        osc.frequency.linearRampToValueAtTime(700, t + 0.32);

        gain.gain.setValueAtTime(this.sfxVolume * 0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.34);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.34);
      }
    } catch {
      // ignore
    }
  }

  // 9. Vote Cast Sound (Satisfying punch/thud)
  public playVoteCast() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);

      gain.gain.setValueAtTime(this.sfxVolume * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // ignore
    }
  }

  // 10. Role Assignment Dramatic Sweep
  public playRoleReveal() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.35);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.35, now + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch {
      // ignore
    }
  }

  // --- PROCEDURAL AMBIENT PINK SYNTH BGM ---
  public startBgm() {
    if (!this.bgmEnabled || this.isBgmPlaying) return;
    this.initCtx();
    if (!this.ctx) return;

    this.isBgmPlaying = true;
    this.playBgmLoop();
  }

  public stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
    this.bgmOscillators.forEach((o) => {
      try {
        o.stop();
      } catch {
        // ignore
      }
    });
    this.bgmOscillators = [];
  }

  private playBgmLoop() {
    if (!this.isBgmPlaying || !this.bgmEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const chordProgressions = [
        [185.0, 277.18, 369.99, 554.37], // F#
        [220.0, 277.18, 440.0, 659.25],  // A
        [164.81, 246.94, 329.63, 493.88], // E
        [196.0, 293.66, 392.0, 587.33],  // G
      ];

      const now = this.ctx.currentTime;
      const beatDuration = 0.55;
      const totalMeasures = chordProgressions.length;
      const measureDuration = beatDuration * 4;

      chordProgressions.forEach((chord, measureIdx) => {
        const measureStart = now + measureIdx * measureDuration;

        chord.forEach((freq, noteIdx) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, measureStart);

          const volume = this.bgmVolume * 0.05 * (1 - noteIdx * 0.15);
          gain.gain.setValueAtTime(0.001, measureStart);
          gain.gain.linearRampToValueAtTime(volume, measureStart + 0.8);
          gain.gain.setValueAtTime(volume, measureStart + measureDuration - 0.6);
          gain.gain.exponentialRampToValueAtTime(0.0001, measureStart + measureDuration);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(measureStart);
          osc.stop(measureStart + measureDuration);

          this.bgmOscillators.push({ stop: () => osc.stop() });
        });

        for (let beat = 0; beat < 4; beat++) {
          const noteTime = measureStart + beat * beatDuration;
          const arpNote = chord[(beat + measureIdx) % chord.length] * 1.5;

          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = "triangle";
          osc.frequency.setValueAtTime(arpNote, noteTime);

          const arpVol = this.bgmVolume * 0.04;
          gain.gain.setValueAtTime(arpVol, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.45);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(noteTime);
          osc.stop(noteTime + 0.45);

          this.bgmOscillators.push({ stop: () => osc.stop() });
        }
      });

      const totalLoopTime = totalMeasures * measureDuration * 1000;
      this.bgmTimer = setTimeout(() => {
        this.bgmOscillators = [];
        this.playBgmLoop();
      }, totalLoopTime - 100);
    } catch {
      // fallback
    }
  }
}

export const sound = new SoundSystem();
export default sound;

