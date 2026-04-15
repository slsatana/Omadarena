import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  Info, 
  History, 
  Heart, 
  Zap, 
  Trophy, 
  RotateCcw,
  ChevronLeft,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../../context/GameContext';
import { Button, BackButton } from '../../components/Shared';

// Constants
const MAX_DAILY_POINTS = 5000;
const MAX_LIVES = 5;
const MAX_LIFE_PARTS = 3;

interface HistoryItem {
  id: string;
  prev: number;
  next: number;
  choice: 'higher' | 'lower';
  isX2: boolean;
  success: boolean;
  points: number;
  lifeLost: boolean;
  timestamp: number;
}

interface GameState {
  currentNumber: number;
  dailyPoints: number;
  livesRemaining: number;
  lifeParts: number;
  history: HistoryItem[];
}

export const HigherLower: React.FC = () => {
  const { user, addPoints, updateHighScore, t, setScreen, useAttempt, gamesStats, selectedGameId } = useGame();
  
  const gameStat = gamesStats[selectedGameId];
  const dailyPoints = gameStat?.pointsEarnedToday || 0;
  const MAX_LIMIT = gameStat?.dailyPointsLimit || MAX_DAILY_POINTS;
  const attemptsLeft = gameStat?.attemptsLeft ?? 0;

  // Game States
  const [currentNumber, setCurrentNumber] = useState<number>(() => Math.floor(Math.random() * 100) + 1);
  const [nextNumber, setNextNumber] = useState<number | null>(null);
  const [livesRemaining, setLivesRemaining] = useState(MAX_LIVES);
  const [lifeParts, setLifeParts] = useState(MAX_LIFE_PARTS);
  const [isX2, setIsX2] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [view, setView] = useState<'MAIN' | 'READY' | 'GAME' | 'RULES' | 'HISTORY' | 'GAMEOVER' | 'LIMIT'>('MAIN');
  const [previousView, setPreviousView] = useState<'MAIN' | 'GAME'>('MAIN');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; points: number; message: string; isEqual?: boolean } | null>(null);

  const handleActualStart = () => {
    if (useAttempt()) {
      setCurrentNumber(Math.floor(Math.random() * 100) + 1);
      setLivesRemaining(MAX_LIVES);
      setLifeParts(MAX_LIFE_PARTS);
      setHistory([]);
      setView('GAME');
    } else {
      alert(t.arenaGame?.noAttempts || "NO ATTEMPTS LEFT");
    }
  };

  const handleGuess = async (choice: 'higher' | 'lower') => {
    if (isProcessing || livesRemaining <= 0 || dailyPoints >= MAX_DAILY_POINTS) return;

    setIsProcessing(true);
    const next = Math.floor(Math.random() * 100) + 1;
    setNextNumber(next);

    let success = false;
    let isEqual = false;
    if (next === currentNumber) {
      isEqual = true;
      success = false;
    } else if (choice === 'higher') {
      success = next > currentNumber;
    } else {
      success = next < currentNumber;
    }

    let pointsGained = 0;
    let lifeLost = false;
    let newLifeParts = lifeParts;
    let newLivesRemaining = livesRemaining;

    if (success) {
      pointsGained = Math.ceil(currentNumber / 10) * (isX2 ? 2 : 1);
      // Cap at daily limit happens locally visually without local state caching
      addPoints(pointsGained); // Add to global user points too
      updateHighScore(dailyPoints + pointsGained);
    } else {
      lifeLost = true;
      if (isX2) {
        // Lose entire life
        newLifeParts = 0;
      } else {
        newLifeParts -= 1;
      }

      if (newLifeParts <= 0) {
        newLivesRemaining -= 1;
        newLifeParts = newLivesRemaining > 0 ? MAX_LIFE_PARTS : 0;
      }
      
      setLifeParts(newLifeParts);
      setLivesRemaining(newLivesRemaining);
    }

    const message = success 
      ? `${t.higherLower.correct} +${pointsGained} ${t.higherLower.points}` 
      : isEqual 
        ? t.higherLower.equal 
        : isX2 
          ? t.higherLower.wrong 
          : t.higherLower.wrong;

    setLastResult({ success, points: pointsGained, message, isEqual });

    const newHistoryItem: HistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      prev: currentNumber,
      next,
      choice,
      isX2,
      success,
      points: pointsGained,
      lifeLost,
      timestamp: Date.now()
    };

    setHistory(prev => [newHistoryItem, ...prev].slice(0, 20));

    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (newLivesRemaining <= 0) {
      setView('GAMEOVER');
    } else if (dailyPoints + pointsGained >= MAX_LIMIT) {
      setView('LIMIT');
    }

    setCurrentNumber(next);
    setNextNumber(null);
    setLastResult(null);
    setIsX2(false);
    setIsProcessing(false);
  };

  const resetDailyProgress = () => {
    setCurrentNumber(Math.floor(Math.random() * 100) + 1);
    setLivesRemaining(MAX_LIVES);
    setLifeParts(MAX_LIFE_PARTS);
    setHistory([]);
    setView('MAIN');
  };

  // --- Components ---

  const handleExit = () => {
    setShowExitConfirm(false);
    setView('MAIN');
  };

  const MainMenu = () => (
    <div className="flex flex-col h-full bg-[#050505] text-white p-6 overflow-y-auto">
      <div className="flex justify-between items-start mb-12">
        <div className="flex flex-col">
          <BackButton onClick={() => setScreen('EVENT_DETAILS')} className="mb-4 self-start" />
          <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">{t.higherLower.score}</span>
          <span className="text-4xl font-black text-[#FFD60A]">{dailyPoints}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">{t.higherLower.lives}</span>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[...Array(MAX_LIVES)].map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < livesRemaining ? 'bg-[#FF453A]' : 'bg-white/10'}`} />
              ))}
            </div>
            <span className="text-lg font-bold">{livesRemaining}/{MAX_LIVES}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ duration: 5, repeat: Infinity }}
          className="relative w-48 h-48 mb-8"
        >
          <div className="absolute inset-0 bg-[#FFD60A]/30 blur-[80px] rounded-full animate-pulse" />
          <div className="relative w-full h-full bg-gradient-to-br from-[#FFD60A] to-[#FF9500] rounded-[52px] flex items-center justify-center shadow-[0_0_60px_rgba(255,214,10,0.5)] border-4 border-white/10">
            <Zap size={100} className="text-white fill-current drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
          </div>
        </motion.div>

        <div className="mb-6 flex flex-col items-center w-full">
          <h1 className="text-5xl font-black tracking-tighter italic text-center w-full text-white break-words px-2 uppercase">{t.highestLower?.title || t.gameDetails.HIGHER_LOWER.title}</h1>
        </div>
        
        <p className="text-white/30 font-black mb-10 tracking-[0.3em] uppercase text-[10px]">{t.higherLower.dailyLimit}: 5000</p>
        
        <div className="flex flex-col items-center w-full relative">
          <Button 
            onClick={() => setView('READY')} 
            className="w-full py-8 rounded-[40px] bg-[#FFD60A] text-black font-black italic text-4xl shadow-[0_20px_50px_rgba(255,214,10,0.4)] flex items-center justify-center gap-4 active:scale-95 active:translate-y-1 transition-all uppercase tracking-tighter border-b-8 border-[#ccaa00]"
          >
            <ArrowUp className="fill-black" size={40} /> {t.gameBoard.play}
          </Button>
          <div className="mt-4 text-center">
            <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">{t.common?.attemptsLeft || t.arenaGame.attempts}: </span>
            <span className="text-white font-black">{attemptsLeft}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 w-full mt-4">
          <Button variant="ghost" onClick={() => { setPreviousView('MAIN'); setView('RULES'); }} className="py-4 text-sm font-black text-white/30 uppercase tracking-widest">
            <Info className="mr-2" size={16} /> {t.higherLower.rules}
          </Button>
          <Button variant="ghost" onClick={() => { setPreviousView('MAIN'); setView('HISTORY'); }} className="py-4 text-sm font-black text-white/30 uppercase tracking-widest">
            <History className="mr-2" size={16} /> {t.higherLower.history}
          </Button>
        </div>
      </div>
    </div>
  );

  const ReadyScreen = () => (
    <div className="flex flex-col h-full bg-[#050505] text-white p-8 justify-center overflow-y-auto">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <h2 className="text-4xl font-black mb-8 italic tracking-tighter text-[#FFD60A]">{t.higherLower.rules}</h2>
        
        <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 mb-12 text-left">
          <ul className="space-y-4 text-sm text-white/70 font-medium">
            {t.higherLower.rulesText.map((rule: string, i: number) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FFD60A] mt-1.5 shrink-0" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button 
          onClick={handleActualStart} 
          className="w-full py-6 rounded-[32px] bg-[#FFD60A] text-black font-black italic text-2xl shadow-[0_15px_40px_rgba(255,214,10,0.4)] flex items-center justify-center gap-4 active:scale-95 active:translate-y-1 transition-all uppercase tracking-tighter border-b-4 border-[#ccaa00]"
        >
          <Zap className="fill-black" size={24} /> {t.higherLower.start}
        </Button>
        
        <button onClick={() => setView('MAIN')} className="mt-6 text-white/30 font-black uppercase tracking-widest text-xs">
          {t.common.backToMenu || "BACK"}
        </button>
      </motion.div>
    </div>
  );

  const LifeIndicator = () => (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-1">
        {[...Array(MAX_LIVES)].map((_, i) => (
          <Heart 
            key={i} 
            size={16} 
            className={i < livesRemaining ? "text-[#FF453A] fill-[#FF453A]" : "text-white/20"} 
          />
        ))}
      </div>
      <div className="flex gap-1">
        {[...Array(MAX_LIFE_PARTS)].map((_, i) => (
          <div 
            key={i} 
            className={`h-1 w-6 rounded-full transition-colors ${i < lifeParts ? "bg-[#FF453A]" : "bg-white/10"}`} 
          />
        ))}
      </div>
      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
        {t.higherLower.lives}: {livesRemaining} • {t.higherLower.history}: {lifeParts}/3
      </span>
    </div>
  );



  return (
    <div className="relative w-full h-full bg-[#050505] overflow-hidden select-none touch-none text-white">
      <AnimatePresence mode="wait">
        {view === 'MAIN' && <MainMenu />}
        {view === 'READY' && <ReadyScreen />}
        {view === 'GAME' && (
          <motion.div 
            key="game" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="flex flex-col h-full p-6"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col">
                <BackButton onClick={() => setShowExitConfirm(true)} className="mb-4 self-start" />
                <h1 className="text-2xl font-black italic tracking-tighter leading-none uppercase">{t.higherLower.higher}</h1>
                <h1 className="text-2xl font-black italic tracking-tighter text-[#0A84FF] leading-none uppercase">{t.higherLower.lower}</h1>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setPreviousView('GAME'); setView('HISTORY'); }} className="p-3 bg-white/5 rounded-2xl border border-white/10 active:scale-95 transition-transform">
                  <History size={20} className="text-white/60" />
                </button>
                <button onClick={() => { setPreviousView('GAME'); setView('RULES'); }} className="p-3 bg-white/5 rounded-2xl border border-white/10 active:scale-95 transition-transform">
                  <Info size={20} className="text-white/60" />
                </button>
              </div>
            </div>

            {/* Exit Confirmation Modal */}
            <AnimatePresence>
              {showExitConfirm && (
                <div className="absolute inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-[#111] border border-white/10 rounded-[40px] p-8 w-full max-w-sm text-center shadow-2xl"
                  >
                    <div className="w-20 h-20 bg-[#FF453A]/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#FF453A]/30">
                      <AlertCircle size={40} className="text-[#FF453A]" />
                    </div>
                    <h2 className="text-3xl font-black mb-4 italic tracking-tighter text-[#FF453A] uppercase">{t.common.areYouSure || "ARE YOU SURE?"}</h2>
                    <p className="text-white/60 text-sm mb-8 leading-relaxed">
                      {t.common.exitConfirmText || "You will lose this attempt."}
                    </p>
                    <div className="space-y-4">
                      <Button onClick={handleExit} className="w-full py-4 rounded-[24px] bg-[#FF453A] font-black italic text-xl uppercase">
                        {t.common.yesExit || "EXIT AND LOSE"}
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={() => setShowExitConfirm(false)} 
                        className="w-full py-4 rounded-[24px] bg-white/5 border border-white/10 font-black text-xs uppercase tracking-widest"
                      >
                        {t.common.cancel || "CANCEL"}
                      </Button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-4 flex flex-col items-center">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">{t.common.score || "TODAY"}</span>
                <span className="text-2xl font-black text-[#FFD60A] tabular-nums">{dailyPoints}</span>
                <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(dailyPoints / MAX_LIMIT) * 100}%` }}
                    className="h-full bg-[#FFD60A]"
                  />
                </div>
                <span className="text-[8px] text-white/20 mt-1 uppercase font-bold">{t.higherLower.dailyLimit}: {MAX_LIMIT}</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-3xl p-4 flex flex-col items-center justify-center">
                <LifeIndicator />
              </div>
            </div>

            {/* Main Game Area */}
            <div className="flex-1 flex flex-col items-center justify-center relative">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={currentNumber}
                  initial={{ scale: 0.8, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 1.2, opacity: 0, y: -20 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-[#0A84FF]/20 blur-[80px] rounded-full px-0 mr-0 mb-2" />
                  <div className="relative text-[120px] font-black italic tracking-tighter leading-none flex items-center justify-center">
                    {currentNumber}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Result Overlay */}
              <AnimatePresence>
                {lastResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -40 }}
                    className="absolute top-1/2 left-0 right-0 -translate-y-1/2 z-50 flex flex-col items-center pointer-events-none"
                  >
                    <div className={`px-6 py-[13px] rounded-[32px] backdrop-blur-xl border flex flex-col items-center gap-2 text-center shadow-2xl ${
                      lastResult.success ? "bg-[#32D74B]/20 border-[#32D74B]/30" : "bg-[#FF453A]/20 border-[#FF453A]/30"
                    }`}>
                      {lastResult.success ? (
                        <CheckCircle2 className="text-[#32D74B]" size={32} />
                      ) : (
                        <AlertCircle className="text-[#FF453A]" size={32} />
                      )}
                      <span className="font-black text-lg leading-tight">{lastResult.message}</span>
                      {nextNumber && (
                        <span className="text-4xl font-black italic">{t.higherLower.resultDrawn}{nextNumber}</span>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="mt-auto space-y-4">
              {/* X2 Toggle */}
              <button 
                onClick={() => !isProcessing && setIsX2(!isX2)}
                disabled={isProcessing}
                className={`w-full p-4 rounded-3xl border transition-all flex items-center justify-between px-6 ${
                  isX2 
                    ? "bg-[#FFD60A] border-[#FFD60A] text-black shadow-[0_0_30px_rgba(255,214,10,0.3)]" 
                    : "bg-white/5 border-white/10 text-white/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Zap size={20} className={isX2 ? "fill-current" : ""} />
                  <div className="flex flex-col items-start">
                    <span className="font-black text-sm uppercase tracking-widest">{t.higherLower.x2Mode}</span>
                    <span className={`text-[10px] font-bold ${isX2 ? "text-black/60" : "text-white/30"}`}>
                      {t.higherLower.x2Desc}
                    </span>
                  </div>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${isX2 ? "bg-black/20" : "bg-white/10"}`}>
                  <motion.div 
                    animate={{ x: isX2 ? 22 : 2 }}
                    className={`absolute top-1 w-3 h-3 rounded-full ${isX2 ? "bg-black" : "bg-white/40"}`}
                  />
                </div>
              </button>

              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={() => handleGuess('higher')}
                  disabled={isProcessing}
                  className="py-8 rounded-[40px] bg-[#0A84FF] flex flex-col items-center gap-2 group overflow-hidden relative"
                >
                  <motion.div 
                    animate={isProcessing ? {} : { y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <ArrowUp size={32} />
                  </motion.div>
                  <span className="font-black italic text-xl tracking-tighter uppercase">{t.higherLower.higher}</span>
                </Button>
                <Button 
                  onClick={() => handleGuess('lower')}
                  disabled={isProcessing}
                  className="py-8 rounded-[40px] bg-white/10 flex flex-col items-center gap-2 group"
                >
                  <motion.div 
                    animate={isProcessing ? {} : { y: [0, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <ArrowDown size={32} />
                  </motion.div>
                  <span className="font-black italic text-xl tracking-tighter uppercase">{t.higherLower.lower}</span>
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'HISTORY' && (
          <motion.div 
            key="history"
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full bg-[#050505] p-6"
          >
            <div className="flex items-center gap-4 mb-8">
              <BackButton onClick={() => setView(previousView)} />
              <h2 className="text-2xl font-black italic tracking-tighter uppercase">{t.higherLower.history}</h2>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/20">
                  <History size={48} className="mb-4 opacity-20" />
                  <p className="font-bold uppercase tracking-widest text-xs">{t.higherLower.history} {t.common.back}</p>
                </div>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center">
                        <span className="text-lg font-black">{item.prev}</span>
                        <div className="text-white/20">
                          {item.choice === 'higher' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                        </div>
                        <span className={`text-lg font-black ${item.success ? "text-[#32D74B]" : "text-[#FF453A]"}`}>{item.next}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-xs font-bold uppercase tracking-wider ${item.success ? "text-[#32D74B]" : "text-[#FF453A]"}`}>
                          {item.success ? t.higherLower.correct : t.higherLower.wrong}
                        </span>
                        <span className="text-[10px] text-white/40">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-sm font-black ${item.points > 0 ? "text-[#FFD60A]" : "text-white/20"}`}>
                        {item.points > 0 ? `+${item.points}` : "0"}
                      </span>
                      {item.isX2 && (
                        <span className="text-[10px] font-black text-[#FFD60A] uppercase tracking-widest">{t.higherLower.x2Mode}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
        
        {view === 'RULES' && (
          <motion.div 
            key="rules"
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col h-full bg-[#050505] p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black italic tracking-tighter uppercase">{t.higherLower.rules}</h2>
              <button onClick={() => setView(previousView)} className="text-white/40 active:scale-95 transition-transform">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6 text-white/70">
              <section>
                <h3 className="text-white font-black uppercase tracking-widest text-xs mb-3 flex items-center gap-2">
                  <Zap size={14} className="text-[#FFD60A]" /> {t.common.next}
                </h3>
                <p className="text-sm leading-relaxed">
                  {t.higherLower.rulesText[0]}
                </p>
              </section>

              <section>
                <h3 className="text-white font-black uppercase tracking-widest text-xs mb-3 flex items-center gap-2">
                  <Trophy size={14} className="text-[#FFD60A]" /> {t.higherLower.score}
                </h3>
                <p className="text-sm leading-relaxed">
                  {t.higherLower.rulesText[2]} {t.higherLower.dailyLimit} — <span className="text-white font-bold">5000 {t.higherLower.points}</span>.
                </p>
              </section>

              <section>
                <h3 className="text-white font-black uppercase tracking-widest text-xs mb-3 flex items-center gap-2">
                  <Heart size={14} className="text-[#FF453A]" /> {t.higherLower.lives}
                </h3>
                <p className="text-sm leading-relaxed">
                  {t.higherLower.rulesText[3]} {t.higherLower.rulesText[4]}
                </p>
              </section>

              <section className="bg-[#FFD60A]/10 border border-[#FFD60A]/20 rounded-2xl p-4">
                <h3 className="text-[#FFD60A] font-black uppercase tracking-widest text-xs mb-2 flex items-center gap-2">
                  <Zap size={14} /> {t.higherLower.x2Mode}
                </h3>
                <p className="text-sm leading-relaxed text-[#FFD60A]/80">
                  {t.higherLower.x2Desc}
                </p>
              </section>
            </div>

            <Button onClick={() => setView(previousView)} className="mt-auto py-4 rounded-2xl bg-white/10 text-white uppercase">
              {t.common.close || "CLOSE"}
            </Button>
          </motion.div>
        )}

        {(view === 'GAMEOVER' || view === 'LIMIT') && (
          <motion.div 
            key="end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-8 text-center"
          >
            <div className="w-full max-w-xs">
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="mb-12"
              >
                {view === 'GAMEOVER' ? (
                  <>
                    <div className="w-24 h-24 bg-[#FF453A]/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#FF453A]/30">
                      <Heart size={48} className="text-[#FF453A]" />
                    </div>
                    <h2 className="text-[50px] font-black italic tracking-tighter text-[#FF453A] mb-4 mt-16 ml-0 uppercase">{t.higherLower.gameOver}</h2>
                    <p className="text-white/40 font-bold uppercase tracking-widest text-xs">{t.higherLower.noLives}</p>
                  </>
                ) : (
                  <>
                    <div className="w-24 h-24 bg-[#FFD60A]/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#FFD60A]/30">
                      <Trophy size={48} className="text-[#FFD60A]" />
                    </div>
                    <h2 className="text-[50px] font-black italic tracking-tighter text-[#FFD60A] mb-4 mt-16 ml-0 uppercase">{t.higherLower.limitReached}</h2>
                    <p className="text-white/40 font-bold uppercase tracking-widest text-xs">{t.higherLower.limitDesc}</p>
                  </>
                )}
              </motion.div>

              <div className="bg-white/5 rounded-[32px] pt-[19px] pb-[18px] pl-[30px] pr-6 border border-white/10 mb-12">
                <span className="text-white/30 font-black uppercase tracking-widest text-[10px] block mb-1">{t.common.score || "TODAY"}</span>
                <span className="text-[87px] font-black tabular-nums leading-tight">{dailyPoints}</span>
              </div>

              <div className="space-y-4">
                <Button onClick={() => setView('MAIN')} className="w-full pt-[13px] pb-[24px] pr-[33px] rounded-[40px] bg-white/10 text-white font-black italic text-[31px] mt-[-32px] mb-[17px] uppercase">
                  {t.common.backToMenu || "BACK TO ARENAS"}
                </Button>
                {/* Debug button to reset for testing */}
                <button onClick={resetDailyProgress} className="text-white/10 text-[10px] uppercase font-bold tracking-widest mt-8 pl-[26px]">
                  {t.higherLower.resetDebug}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
