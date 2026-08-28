"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { DIFFICULTY_CONFIG } from "./constants/gameConfig";
import type { Difficulty } from "./constants/words";
import type { WordEntry } from "./constants/words";
import { pickSecretWord, validateClue, shuffleArray, formatTime } from "./lib/gameHelpers";
import { getCluesForWord } from "./lib/clueBank";
import { getWordsForDifficulty } from "./constants/words";

const DIFF_ORDER: Difficulty[] = ["easy", "medium", "hard", "extremely_hard"];

type Clue = {
  id: string;
  text: string;
  timestamp: number;
};

type GamePhase = "lobby" | "clue" | "guess" | "reveal";

export default function Home() {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [phase, setPhase] = useState<GamePhase>("lobby");
  const [secretWord, setSecretWord] = useState<WordEntry | null>(null);
  const [clues, setClues] = useState<Clue[]>([]);
  const [timeLeft, setTimeLeft] = useState(75);
  const [clueInput, setClueInput] = useState("");
  const [guessInput, setGuessInput] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [winner, setWinner] = useState<"impostor" | "crewmates" | null>(null);
  const [impostorGuess, setImpostorGuess] = useState<string | null>(null);
  const [isGuessCorrect, setIsGuessCorrect] = useState<boolean | null>(null);
  const [round, setRound] = useState(1);
  const [prevWord, setPrevWord] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [celebrationType, setCelebrationType] = useState<"impostor" | "crewmates" | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cfg = DIFFICULTY_CONFIG[difficulty];
  const isCluePhaseDone = clues.length >= cfg.clueLimit;

  const startGame = useCallback(() => {
    const word = pickSecretWord(difficulty, prevWord || undefined);
    const clueOptions = getCluesForWord(word.word, word.category);
    const shuffled = shuffleArray([...clueOptions]).slice(0, cfg.clueLimit);
    const preClues: Clue[] = shuffled.map((text, i) => ({
      id: `pre-${i}`,
      text,
      timestamp: Date.now() + i,
    }));
    setSecretWord(word);
    setClues(preClues);
    setTimeLeft(cfg.timeLimit);
    setWinner(null);
    setImpostorGuess(null);
    setIsGuessCorrect(null);
    setClueInput("");
    setGuessInput("");
    setValidationError(null);
    setPhase("guess");
  }, [difficulty, prevWord, cfg.clueLimit, cfg.timeLimit]);

  useEffect(() => {
    if (phase !== "clue" && phase !== "guess") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (phase === "clue") {
            setPhase("guess");
            return cfg.timeLimit;
          } else {
            setWinner("crewmates");
            setIsGuessCorrect(false);
            setPhase("reveal");
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, cfg.timeLimit]);

  useEffect(() => {
    if (phase === "clue" && clues.length >= cfg.clueLimit) {
      const t = setTimeout(() => setPhase("guess"), 800);
      return () => clearTimeout(t);
    }
  }, [clues.length, cfg.clueLimit, phase]);

  const handleHumanClue = () => {
    if (!secretWord) return;
    const res = validateClue(clueInput, secretWord.word);
    if (!res.valid) {
      setValidationError(res.reason || "Invalid clue");
      return;
    }
    if (clues.some(c => c.text.toLowerCase() === clueInput.trim().toLowerCase())) {
      setValidationError("Clue already given!");
      return;
    }
    setValidationError(null);
    const newClue: Clue = {
      id: Date.now().toString(),
      text: clueInput.trim(),
      timestamp: Date.now(),
    };
    setClues((prev) => [...prev, newClue]);
    setClueInput("");
  };

  const handleGuess = () => {
    if (!secretWord) return;
    const guess = guessInput.trim();
    if (!guess) { setValidationError("Enter a guess"); return; }
    if (guess.includes(" ")) { setValidationError("Guess must be ONE WORD"); return; }
    setValidationError(null);
    setImpostorGuess(guess);
    const correct = guess.toLowerCase() === secretWord.word.toLowerCase();
    setIsGuessCorrect(correct);
    setWinner(correct ? "impostor" : "crewmates");
    setCelebrationType(correct ? "impostor" : "crewmates");
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
    setPhase("reveal");
  };

  const handleNextRound = () => {
    if (secretWord) setPrevWord(secretWord.word);
    setRound((r) => r + 1);
    startGame();
  };
  const handleNewGame = () => {
    setPrevWord(null);
    setRound(1);
    setPhase("lobby");
    setSecretWord(null);
    setClues([]);
  };

  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const timerProgress = timeLeft / cfg.timeLimit;
  const offset = circumference * (1 - timerProgress);
  const isWarn = timeLeft <= 10;

  const renderLobby = () => (
    <div className="w-full max-w-xl mx-auto text-center py-16 space-y-8">
      <div className="space-y-2">
        <h1 className="font-black text-4xl sm:text-6xl leading-tight" style={{color: "#FFE4E1"}}>
          IMPOSTOR<br/>
          <span style={{background: "linear-gradient(90deg, #FF69B4, #FF1493)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"}}>WORD GUESSER</span>
        </h1>
        <p className="text-lg" style={{color: "#FFB6C1"}}>Guess the secret word from clues</p>
      </div>

      <div className="space-y-4">
        <label className="text-xs font-black tracking-widest" style={{color: "#FFB6C1", display: "block", marginBottom: 8}}>CHOOSE DIFFICULTY</label>
        <div className="grid grid-cols-2 gap-3">
          {DIFF_ORDER.map(d => {
            const c = DIFFICULTY_CONFIG[d];
            const active = d === difficulty;
            const icons: Record<Difficulty, string> = { easy: "[EASY]", medium: "[MED]", hard: "[HARD]", extremely_hard: "[EXTREME]" };
            return (
              <button key={d} onClick={() => setDifficulty(d)}
                className={`p-4 rounded-2xl text-left cursor-pointer transition ${active ? "ring-2" : "hover:brightness-110"}`}
                style={{
                  background: active ? `linear-gradient(135deg, ${c.color}, ${c.color}dd)` : "rgba(255,255,255,0.05)",
                  border: active ? `2px solid ${c.color}` : "1px solid rgba(255,105,180,0.14)",
                  color: active ? "white" : "#FFE4E1",
                  boxShadow: active ? `0 8px 20px ${c.color}40` : "none",
                }}>
                {active && <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white text-[#FF1493] flex items-center justify-center text-xs">✓</div>}
                <div className="text-2xl">{icons[d]}</div>
                <div className="text-xs font-black mt-1">{c.label}</div>
                <div className="text-[11px] opacity-80">{c.clueLimit} clues - {c.timeLimit}s</div>
              </button>
            );
          })}
        </div>
      </div>

      <button onClick={startGame}
        className="w-full py-5 rounded-2xl font-black text-lg tracking-widest flex items-center justify-center gap-3 cursor-pointer"
        style={{background: "linear-gradient(135deg, #FF69B4, #FF1493)", color: "white", boxShadow: "0 10px 25px rgba(255,20,147,0.35)"}}>
        <span className="w-10 h-10 rounded-full bg-white text-[#FF1493] flex items-center justify-center text-xl">PLAY</span> START GAME
      </button>
    </div>
  );

  const renderTimer = () => (
    <div className="relative w-40 h-40 sm:w-48 sm:h-48 mx-auto mb-6">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
        <circle className="text-[#FF69B4]/15" cx="60" cy="60" r={radius} strokeWidth="10" fill="none" stroke="currentColor"/>
        <circle className={`text-[#FF69B4] transition-all duration-1000 ${isWarn ? "timer-ring-warn" : ""}`}
          cx="60" cy="60" r={radius} strokeWidth="10" fill="none" stroke="currentColor"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{strokeLinecap: "round", filter: isWarn ? "drop-shadow(0 0 8px #FF1493)" : "none"}}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`text-4xl sm:text-5xl font-black ${isWarn ? "text-[#FF1493] heartbeat" : "text-[#FFE4E1]"}`}>{formatTime(timeLeft)}</div>
      </div>
    </div>
  );

const renderCluePhase = () => (
    <div className="space-y-6">
      {renderTimer()}
      <div className="text-center text-xs opacity-60">Clues: {clues.length} / {cfg.clueLimit}</div>
      <div className="max-w-md mx-auto space-y-2">
        {clues.map((c, i) => (
          <div key={c.id} className="p-3 rounded-xl text-center" style={{background: "#2A1020", border: "1px solid rgba(255,105,180,0.15)"}}>
            <div className="text-lg font-black">"{c.text}"</div>
            <div className="text-[11px] opacity-40">#{i + 1}</div>
          </div>
        ))}
        {Array.from({length: cfg.clueLimit - clues.length}).map((_, i) => (
          <div key={`ghost-${i}`} className="p-3 rounded-xl border border-dashed text-center text-xs opacity-40" style={{borderColor: "rgba(255,105,180,0.2)", background: "rgba(255,105,180,0.04)"}}>
            waiting for clue {clues.length + i + 1}...
          </div>
        ))}
      </div>
      <div className="max-w-md mx-auto">
        <input value={clueInput} onChange={e => {setClueInput(e.target.value); if(validationError) setValidationError(null);}} onKeyDown={e => { if(e.key==="Enter") handleHumanClue(); }}
          placeholder="Type one-word clue..."
          className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none mb-2" style={{background: "#1A0A0F", border: validationError ? "1px solid #FF1493" : "1px solid rgba(255,105,180,0.25)", color: "#FFE4E1"}} />
        {validationError && <div className="text-xs text-center mb-2" style={{color: "#FF6EB4"}}>Error: {validationError}</div>}
        <button onClick={handleHumanClue} className="w-full py-3 rounded-xl font-black text-sm cursor-pointer" style={{background: "linear-gradient(135deg, #FF69B4, #FF1493)", color: "white"}}>SUBMIT CLUE</button>
        <div className="text-[11px] opacity-50 text-center mt-2">Rules: one word only - no secret word - no substring - no rhyming</div>
      </div>
    </div>
  );

const renderGuessPhase = () => (
    <div className="space-y-6 max-w-md mx-auto text-center">
      {renderTimer()}
      <h2 className="text-xl font-black">Guess the Secret Word!</h2>
      <div className="flex flex-wrap gap-1.5 justify-center">
        {clues.map((c, i) => <span key={i} className="px-2.5 py-1 rounded-full text-xs" style={{background: "rgba(255,105,180,0.15)", border: "1px solid rgba(255,105,180,0.2)"}}>"{c.text}"</span>)}
      </div>
      <input value={guessInput} onChange={e => {setGuessInput(e.target.value); if(validationError) setValidationError(null);}} onKeyDown={e => { if(e.key==="Enter") handleGuess(); }}
        placeholder="Type your guess (one word)..."
        className="w-full px-4 py-3 rounded-xl text-sm font-black outline-none mb-2" style={{background: "white", color: "#1A0A0F"}} />
      {validationError && <div className="text-xs mb-2" style={{color: "#FF6EB4"}}>Error: {validationError}</div>}
      <button onClick={handleGuess} className="w-full py-3 rounded-xl font-black text-sm cursor-pointer" style={{background: "white", color: "#FF1493"}}>GUESS!</button>
      <div className="text-xs opacity-70 mt-2">Correct - Impostor wins / Wrong - Crewmates win</div>
    </div>
  );

  const renderReveal = () => {
    const impostorWon = winner === "impostor";
    return (
      <div className="space-y-6 text-center" style={{background: impostorWon ? "linear-gradient(135deg, #FF1493, #8B0046)" : "linear-gradient(135deg, #FF69B4, #C71585)", color: "white"}}>
        <div className="text-6xl bounce-gentle">{impostorWon ? "[IMPOSTOR]" : "[CREWMATES]"}</div>
        <h2 className="text-3xl font-black">{impostorWon ? "IMPOSTOR WINS!" : "CREWMATES WIN!"}</h2>
        <p>{impostorWon ? "You deduced the secret word!" : "Wrong guess - word defended!"}</p>

        <div className="p-4 rounded-2xl mx-auto max-w-md" style={{background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.15)"}}>
          <div className="text-xs opacity-80 tracking-widest">SECRET WORD</div>
          <div className="text-4xl font-black tracking-widest mt-1">{secretWord?.word.toUpperCase()}</div>
          <div className="text-sm opacity-80 mt-1">{secretWord?.category}</div>
          <div className="mt-3 text-xs">Your guess: <b>"{impostorGuess || "-"}"</b> {isGuessCorrect !== null && (isGuessCorrect ? "Correct" : "Wrong")}</div>
        </div>

        <div className="flex gap-3 justify-center">
          <button onClick={handleNextRound} className="px-6 py-3 rounded-xl font-black text-sm cursor-pointer" style={{background: "white", color: impostorWon ? "#FF1493" : "#C71585"}}>NEXT ROUND</button>
          <button onClick={handleNewGame} className="px-6 py-3 rounded-xl font-black text-sm cursor-pointer" style={{background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.3)", color: "white"}}>NEW GAME</button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full flex flex-col" style={{background: "#1A0A0F"}}>
      <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-10 flex-1 flex flex-col">
        {phase === "lobby" && renderLobby()}
        {phase === "clue" && <div className="flex-1 flex flex-col justify-center">{renderCluePhase()}</div>}
        {phase === "guess" && <div className="flex-1 flex flex-col justify-center">{renderGuessPhase()}</div>}
        {phase === "reveal" && <div className="flex-1 flex flex-col justify-center p-6">{renderReveal()}</div>}

        {showConfetti && celebrationType && (
          <div className="fixed inset-0 pointer-events-none z-40" style={{overflow: "hidden"}}>
            {Array.from({length: 60}).map((_, i) => {
              const tx = `${(Math.random() - 0.5) * 400}px`;
              const ty = `${200 + Math.random() * 300}px`;
              const tr = `${(Math.random() - 0.5) * 720}deg`;
              const dur = `${0.8 + Math.random() * 0.6}s`;
              const colors = celebrationType === "impostor"
                ? ["#FF69B4", "#FF1493", "#C71585", "#FFB6C1", "#FF6EB4"]
                : ["#FFB6C1", "#FF69B4", "#FFE4E1", "#FFFFFF", "#FF6EB4"];
              const style: Record<string, string> = {
                left: `${50 + (Math.random() - 0.5) * 100}%`,
                top: `${30 + Math.random() * 40}%`,
                width: `${6 + Math.random() * 10}px`,
                height: `${6 + Math.random() * 10}px`,
                background: colors[Math.floor(Math.random() * colors.length)],
                borderRadius: Math.random() > 0.5 ? "50%" : "0",
                transform: `rotate(${Math.random() * 360}deg)`,
                opacity: "1",
                animation: `confettiBurst ${dur} ease-out forwards`,
                "--tx": tx, "--ty": ty, "--tr": tr,
              };
              return <div key={i} className="confetti-burst absolute" style={style} />;
            })}
          </div>
        )}

        <footer className="text-center text-xs opacity-40 py-4">Minimal Mode - Pink Edition - Made with love</footer>
      </div>
    </div>
  );
}