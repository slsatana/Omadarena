import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Play, Pause, RotateCcw, ChevronLeft, Gift, Medal, AlertCircle, Clock, Undo2, Shuffle, Plus, Flame, Grid } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { Button, BackButton } from '../../components/Shared';
import { ShopContent } from '../../components/ShopContent';
import { audio, haptics } from '../../utils/audio';

// Colors
const COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#F9D56E', // Yellow
  '#FF9FF3', // Pink
  '#54A0FF', // Light Blue
  '#5F27CD', // Purple
  '#FF9F43', // Orange
  '#10AC84', // Green
  '#222F3E', // Dark Blue
  '#C8D6E5', // Light Grey
  '#8395A7'  // Grey
];

type Ball = { id: string; color: string };
type Tube = Ball[];

const TUBE_CAPACITY = 4;
// Removed MAX_SCORE 5000

export const ColorSort = () => {
  const { setScreen, user, addPoints, updateHighScore, useAttempt, t, gamesStats, selectedGameId } = useGame();
  
  const gameStat = gamesStats[selectedGameId];
  const dailyPoints = gameStat?.pointsEarnedToday || 0;
  const MAX_LIMIT = gameStat?.dailyPointsLimit || 5000;
  const attemptsLeft = gameStat?.attemptsLeft ?? 0;
  
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'MAX_REACHED' | 'NO_ATTEMPTS' | 'ALMOST_WON' | 'DAILY_BONUS' | 'SHOP' | 'MOVES_OUT'>('IDLE');
  const [level, setLevel] = useState(1);
  const [tubes, setTubes] = useState<Tube[]>([]);
  const [selectedTube, setSelectedTube] = useState<number | null>(null);
  const [history, setHistory] = useState<{from: number, to: number}[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [boosts, setBoosts] = useState({ undo: 3, shuffle: 1, extraTube: 1 });
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [invalidMove, setInvalidMove] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [movesLeft, setMovesLeft] = useState(0);
  const [movesMax, setMovesMax] = useState(0);

  // Calculate moves limit for a given level
  const calcMovesMax = (lvl: number) => {
    const isBreather = lvl % 5 === 0;
    const effectiveLvl = isBreather ? Math.max(1, lvl - 3) : lvl;
    const numColors = Math.min(10, 3 + Math.floor(effectiveLvl / 1.5));
    // Generous buffer: numColors * TUBE_CAPACITY * 1.8 + level bonus
    return Math.floor(numColors * TUBE_CAPACITY * 1.8 + lvl * 3);
  };

  // Level Generator
  const generateLevel = useCallback((lvl: number) => {
    // Every 5 levels is a breather (easier)
    const isBreather = lvl % 5 === 0;
    const effectiveLvl = isBreather ? Math.max(1, lvl - 3) : lvl;
    
    const numColors = Math.min(10, 3 + Math.floor(effectiveLvl / 1.5));
    const numTubes = numColors + 2;
    
    let newTubes: Tube[] = Array.from({ length: numTubes }, () => []);
    let ballId = 0;
    
    // Fill with solved state
    for (let i = 0; i < numColors; i++) {
      for (let j = 0; j < TUBE_CAPACITY; j++) {
        newTubes[i].push({ id: `ball-${lvl}-${ballId++}`, color: COLORS[i] });
      }
    }
    
    // Shuffle
    const shuffleMoves = isBreather ? 40 : 80 + effectiveLvl * 20;
    for (let i = 0; i < shuffleMoves; i++) {
      const nonEmpty = newTubes.map((t, idx) => ({t, idx})).filter(x => x.t.length > 0);
      const notFull = newTubes.map((t, idx) => ({t, idx})).filter(x => x.t.length < TUBE_CAPACITY);
      
      if (nonEmpty.length > 0 && notFull.length > 0) {
        const from = nonEmpty[Math.floor(Math.random() * nonEmpty.length)].idx;
        let to = notFull[Math.floor(Math.random() * notFull.length)].idx;
        if (from !== to) {
          const ball = newTubes[from].pop()!;
          newTubes[to].push(ball);
        }
      }
    }
    
    return newTubes;
  }, []);

  const startGame = () => {
    if (attemptsLeft <= 0) {
      setGameState('NO_ATTEMPTS');
      return;
    }
    if (!useAttempt()) return;
    
    const initMoves = calcMovesMax(1);
    setTubes(generateLevel(1));
    setLevel(1);
    setScore(0);
    setStreak(0);
    setHistory([]);
    setStartTime(Date.now());
    setMovesLeft(initMoves);
    setMovesMax(initMoves);
    setGameState('PLAYING');
  };

  const handleTubeClick = (index: number) => {
    if (gameState !== 'PLAYING') return;

    if (selectedTube === null) {
      // Select tube if it has balls
      if (tubes[index].length > 0) {
        setSelectedTube(index);
        haptics.light();
        audio.playTone(400, 'sine', 0.05);
      }
    } else {
      if (selectedTube === index) {
        // Deselect
        setSelectedTube(null);
        haptics.light();
        return;
      }

      // Try to move
      const sourceTube = tubes[selectedTube];
      const targetTube = tubes[index];
      const topBall = sourceTube[sourceTube.length - 1];

      const isValidMove = targetTube.length < TUBE_CAPACITY && 
        (targetTube.length === 0 || targetTube[targetTube.length - 1].color === topBall.color);

      if (isValidMove) {
        const newTubes = [...tubes];
        newTubes[selectedTube] = [...sourceTube];
        newTubes[index] = [...targetTube];
        
        const ball = newTubes[selectedTube].pop()!;
        newTubes[index].push(ball);
        
        setHistory([...history, { from: selectedTube, to: index }]);
        setTubes(newTubes);
        setSelectedTube(null);
        haptics.success();
        audio.playTone(600, 'sine', 0.1);

        // Decrement moves
        const newMovesLeft = movesLeft - 1;
        setMovesLeft(newMovesLeft);
        
        // Check win first
        const won = checkWin(newTubes);
        // If not won and no moves left, game over
        if (!won && newMovesLeft <= 0) {
          setTimeout(() => setGameState('MOVES_OUT'), 300);
        }
      } else {
        // Invalid move
        setInvalidMove(index);
        setTimeout(() => setInvalidMove(null), 400);
        setSelectedTube(null);
        haptics.error();
        audio.playTone(200, 'square', 0.1);
      }
    }
  };

  const checkWin = (currentTubes: Tube[]): boolean => {
    const isWin = currentTubes.every(tube => 
      tube.length === 0 || (tube.length === TUBE_CAPACITY && tube.every(b => b.color === tube[0].color))
    );

    if (isWin) {
      audio.playLevelUp();
      haptics.heavy();
      
      const timeTaken = (Date.now() - startTime) / 1000;
      const speedBonus = Math.max(0, Math.floor(10 - timeTaken/5));
      
      const multiplier = 1 + (streak * 0.05);
      const basePoints = 10 + (level * 2);
      const pointsEarned = Math.floor((basePoints + speedBonus) * multiplier);
      const newScore = score + pointsEarned;
      
      setScore(newScore);
      setStreak(s => s + 1);
      
      if (newScore >= MAX_LIMIT) {
        handleGameOver('MAX_SCORE', newScore);
      } else {
        setTimeout(() => {
          const nextLevel = level + 1;
          const nextMoves = calcMovesMax(nextLevel);
          setLevel(nextLevel);
          setTubes(generateLevel(nextLevel));
          setHistory([]);
          setStartTime(Date.now());
          setMovesLeft(nextMoves);
          setMovesMax(nextMoves);
        }, 1000);
      }
      return true;
    }
    return false;
  };

  const handleGameOver = (reason: 'MAX_SCORE' | 'QUIT', finalScore: number) => {
    addPoints(finalScore);
    updateHighScore(finalScore);
    setGameState(reason === 'MAX_SCORE' ? 'MAX_REACHED' : 'GAMEOVER');
  };

  const handleUndo = () => {
    if (history.length === 0 || boosts.undo <= 0) return;
    
    const lastMove = history[history.length - 1];
    const newTubes = [...tubes];
    newTubes[lastMove.from] = [...tubes[lastMove.from]];
    newTubes[lastMove.to] = [...tubes[lastMove.to]];
    
    const ball = newTubes[lastMove.to].pop()!;
    newTubes[lastMove.from].push(ball);
    
    setTubes(newTubes);
    setHistory(history.slice(0, -1));
    setBoosts(b => ({ ...b, undo: b.undo - 1 }));
    setMovesLeft(m => m + 1); // Restore the undone move
    haptics.light();
  };

  const handleShuffle = () => {
    if (boosts.shuffle <= 0) return;
    
    // Extract all balls
    const allBalls: Ball[] = [];
    tubes.forEach(t => allBalls.push(...t));
    
    // Shuffle balls
    for (let i = allBalls.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allBalls[i], allBalls[j]] = [allBalls[j], allBalls[i]];
    }
    
    // Distribute back
    const newTubes = tubes.map(t => {
      const newTube: Ball[] = [];
      for (let i = 0; i < t.length; i++) {
        newTube.push(allBalls.pop()!);
      }
      return newTube;
    });
    
    setTubes(newTubes);
    setHistory([]);
    setBoosts(b => ({ ...b, shuffle: b.shuffle - 1 }));
    haptics.heavy();
  };

  const handleExtraTube = () => {
    if (boosts.extraTube <= 0) return;
    setTubes([...tubes, []]);
    setBoosts(b => ({ ...b, extraTube: b.extraTube - 1 }));
    haptics.success();
  };

  const handleRestartAttempt = () => {
    // Check if almost won (e.g. > 70% of balls are correctly sorted)
    let sortedBalls = 0;
    let totalBalls = 0;
    tubes.forEach(t => {
      totalBalls += t.length;
      if (t.length > 0) {
        const color = t[0].color;
        let count = 0;
        for (let b of t) {
          if (b.color === color) count++;
          else break;
        }
        if (count === TUBE_CAPACITY) sortedBalls += count;
      }
    });
    
    if (totalBalls > 0 && sortedBalls / totalBalls > 0.6) {
      setGameState('ALMOST_WON');
    } else {
      // Just restart level
      setTubes(generateLevel(level));
      setHistory([]);
      setStartTime(Date.now());
      setGameState('PLAYING');
    }
  };

  // UI rendering
  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col justify-between text-white overflow-hidden font-sans touch-none">
      {/* Header */}
      <div className="p-3 safe-top flex justify-between items-center z-20 shrink-0 bg-zinc-950/50 backdrop-blur-md border-b border-zinc-900">
        {gameState === 'IDLE' ? (
          <BackButton onClick={() => setScreen('EVENT_DETAILS')} />
        ) : (
          <div className="w-9 h-9" />
        )}
        <div className="flex flex-col items-center">
          <p className="text-[15px] font-black uppercase tracking-[0.2em] text-zinc-500">{t.colorSort?.score || 'SCORE'}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black tabular-nums">{score}</span>
            <span className="text-[9px] text-zinc-500 font-bold">/ {MAX_LIMIT}</span>
          </div>
        </div>
        {/* Moves counter */}
        {gameState === 'PLAYING' && (
          <div className="flex flex-col items-center">
            <p className="text-[11px] font-black uppercase tracking-[0.15em] text-zinc-500">{t.colorSort?.movesLeft || 'MOVES'}</p>
            <span className={`text-lg font-black tabular-nums ${
              movesLeft <= 5 ? 'text-red-400' : movesLeft <= 10 ? 'text-yellow-400' : 'text-white'
            }`}>{movesLeft}</span>
          </div>
        )}
        {gameState === 'PLAYING' ? (
          <button 
            onClick={() => setGameState('PAUSED')}
            className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-transform"
          >
            <Pause size={18} />
          </button>
        ) : (
          <div className="w-9 h-9" />
        )}
      </div>

      {/* Game Area */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-4 min-h-0">
        {gameState === 'PLAYING' && (
          <>
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <div className="bg-orange-500/20 text-orange-500 px-3 py-1 rounded-full text-xs font-bold border border-orange-500/30 flex items-center gap-1">
                <Flame size={14} /> x{(1 + streak * 0.05).toFixed(2)}
              </div>
              <div className="bg-blue-500/20 text-blue-500 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/30">
                Lvl {level}
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 max-w-md mt-12 scale-90 sm:scale-100 origin-center transition-transform w-[95%]">
              {tubes.map((tube, i) => (
                <div 
                  key={i}
                  onClick={() => handleTubeClick(i)}
                  className={`relative w-12 h-48 bg-zinc-900/50 rounded-b-full border-2 border-t-0 flex flex-col-reverse items-center justify-start pb-2 gap-1 transition-all cursor-pointer ${
                    selectedTube === i ? 'border-white -translate-y-4 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 
                    invalidMove === i ? 'border-red-500 animate-shake' : 'border-zinc-700 hover:border-zinc-500'
                  }`}
                >
                  {/* Tube opening */}
                  <div className="absolute -top-1 left-[-2px] right-[-2px] h-2 rounded-[50%] border-2 border-inherit bg-zinc-950" />
                  
                  <AnimatePresence>
                    {tube.map((ball, j) => (
                      <motion.div
                        key={ball.id}
                        layoutId={ball.id}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="w-10 h-10 rounded-full shadow-inner"
                        style={{ 
                          backgroundColor: ball.color,
                          boxShadow: `inset -5px -5px 10px rgba(0,0,0,0.3), inset 5px 5px 10px rgba(255,255,255,0.3), 0 0 10px ${ball.color}40`
                        }}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Boosts */}
            <div className="absolute bottom-8 flex gap-4">
              <BoostBtn icon={<Undo2 size={20} />} count={boosts.undo} onClick={handleUndo} label={t.colorSort?.undo || "Undo"} />
              <BoostBtn icon={<Shuffle size={20} />} count={boosts.shuffle} onClick={handleShuffle} label={t.colorSort?.shuffle || "Shuffle"} />
              <BoostBtn icon={<Plus size={20} />} count={boosts.extraTube} onClick={handleExtraTube} label={t.colorSort?.extraTube || "Tube"} />
            </div>
          </>
        )}
      </div>

      {/* Overlays */}
      <AnimatePresence mode="wait">
        {gameState === 'IDLE' && (
          <motion.div 
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-950 z-[100] flex flex-col overflow-y-auto no-scrollbar touch-auto"
          >
            {/* Background */}
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/60 via-zinc-950/80 to-zinc-950 z-10" />
              <motion.img 
                initial={{ scale: 1.1 }}
                animate={{ scale: 1.2 }}
                transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
                src="https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=1000" 
                className="w-full h-full object-cover opacity-30 blur-[2px]"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Content */}
            <div className="relative z-20 flex-1 flex flex-col p-6 safe-top safe-pb">
              {/* Top Bar */}
              <div className="flex justify-between items-start mb-8">
                <BackButton onClick={() => setScreen('EVENT_DETAILS')} />
              </div>

              {/* Hero Section */}
              <div className="flex-1 flex flex-col items-center justify-center text-center mb-8">
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-20 h-20 bg-pink-500/20 rounded-3xl flex items-center justify-center mb-6 border border-pink-500/30 shadow-[0_0_30px_rgba(236,72,153,0.2)]"
                >
                  <Grid size={40} className="text-pink-500" />
                </motion.div>
                <motion.h1 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl font-black tracking-tighter uppercase italic mb-2 bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent"
                >
                  {t.colorSort?.title || "Color Sort"}
                </motion.h1>
                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-zinc-400 text-sm max-w-[280px] leading-relaxed"
                >
                  {t.colorSort?.rulesText || "Sort colored balls into tubes."}
                </motion.p>
              </div>

              {/* Stats & Actions */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="space-y-6"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-900/50 backdrop-blur-md p-4 rounded-2xl border border-zinc-800/50">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{t.colorSort?.best || "Best"}</p>
                    <p className="text-2xl font-black text-white">{user.highScore}</p>
                  </div>
                  <div className="bg-zinc-900/50 backdrop-blur-md p-4 rounded-2xl border border-zinc-800/50">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{t.colorSort?.attempts || "Attempts"}</p>
                    <p className="text-2xl font-black text-white">{attemptsLeft}</p>
                  </div>
                </div>

                {/* Navigation */}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setScreen('LEADERBOARD')}
                    className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800/50 rounded-2xl py-4 flex flex-col items-center gap-2 active:scale-95 transition-transform"
                  >
                    <Trophy size={24} className="text-orange-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">{t.colorSort?.leaderboard || "Leaders"}</span>
                  </button>
                  <button 
                    onClick={() => setGameState('SHOP')}
                    className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800/50 rounded-2xl py-4 flex flex-col items-center gap-2 active:scale-95 transition-transform"
                  >
                    <Gift size={24} className="text-pink-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">{t.colorSort?.prizes || "Shop"}</span>
                  </button>
                </div>

                {/* Main Action */}
                <Button 
                  onClick={startGame} 
                  className="w-full py-5 text-lg font-black tracking-widest uppercase italic shadow-[0_0_40px_rgba(236,72,153,0.3)] bg-pink-600 hover:bg-pink-500"
                >
                  {t.colorSort?.play || "Play"}
                </Button>
                

              </motion.div>
            </div>
          </motion.div>
        )}

        {gameState === 'SHOP' && (
          <motion.div 
            key="shop"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 bg-zinc-950 z-[110] flex flex-col safe-top safe-pb"
          >
            <ShopContent embedded onBack={() => setGameState('IDLE')} />
          </motion.div>
        )}



        {gameState === 'PAUSED' && (
          <motion.div 
            key="paused"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex flex-col items-center justify-center z-[100]"
          >
            <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-8 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">PAUSED</h2>
            <div className="flex flex-col gap-4 w-full max-w-[200px]">
              <Button onClick={() => setGameState('PLAYING')} className="py-4 text-lg">
                {t.colorSort?.continue || "Continue"}
              </Button>
              <Button onClick={() => handleRestartAttempt()} variant="secondary" className="py-4 text-lg">
                {t.arenaGame.tryAgain || "Restart"}
              </Button>
              <Button onClick={() => setShowExitConfirm(true)} variant="secondary" className="py-4 text-lg border-red-500/30 text-red-400">
                {t.common.exitToMenu || "EXIT"}
              </Button>
            </div>
          </motion.div>
        )}

        {gameState === 'ALMOST_WON' && (
          <motion.div 
            key="almost_won"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[110] bg-zinc-950/95 flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="w-20 h-20 bg-orange-500/20 rounded-3xl flex items-center justify-center mb-6 border border-orange-500/30">
              <Flame size={40} className="text-orange-500" />
            </div>
            <h3 className="text-2xl font-black mb-2 uppercase italic tracking-tighter">{t.colorSort?.almostThere || "Almost there!"}</h3>
            <p className="text-zinc-400 mb-8">{t.colorSort?.almostThereDesc || "You are very close to finishing this level."}</p>
            <div className="flex flex-col gap-3 w-full max-w-[240px]">
              <Button onClick={() => setGameState('PLAYING')} className="py-4 bg-orange-500 text-white border-orange-500/50">
                {t.colorSort?.continue || "Continue"}
              </Button>
              <Button onClick={() => { setGameState('IDLE'); handleGameOver('QUIT', score); }} variant="secondary" className="py-4">
                {t.common.cancel || "Give Up"}
              </Button>
            </div>
          </motion.div>
        )}

        {showExitConfirm && (
          <motion.div 
            key="exit_confirm"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[110] bg-zinc-950/95 flex flex-col items-center justify-center p-8 text-center"
          >
            <AlertCircle size={64} className="text-red-500 mb-6" />
            <h3 className="text-2xl font-black mb-2 uppercase italic tracking-tighter">{t.common.areYouSure || "Are you sure?"}</h3>
            <p className="text-zinc-400 mb-8">{t.colorSort?.loseAttempt || "Attempt will be lost"}</p>
            <div className="flex flex-col gap-3 w-full max-w-[240px]">
              <Button onClick={() => { setShowExitConfirm(false); handleGameOver('QUIT', score); }} className="py-4 bg-red-500 text-white border-red-500/50">
                {t.common.yesExit || "EXIT"}
              </Button>
              <Button onClick={() => setShowExitConfirm(false)} variant="secondary" className="py-4">
                {t.colorSort?.continue || "Continue"}
              </Button>
            </div>
          </motion.div>
        )}

        {(gameState === 'GAMEOVER' || gameState === 'MAX_REACHED') && (
          <motion.div 
            key="gameover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-950 z-[100] flex flex-col items-center justify-center p-6"
          >
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-zinc-950/90 z-10" />
            </div>

            <div className="relative z-20 w-full max-w-[320px] flex flex-col items-center text-center safe-pb">
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`w-20 h-20 ${gameState === 'MAX_REACHED' ? 'bg-orange-500/20 border-orange-500/30' : 'bg-red-500/20 border-red-500/30'} rounded-3xl flex items-center justify-center mb-6 border shadow-2xl`}
              >
                {gameState === 'MAX_REACHED' ? <Trophy size={40} className="text-orange-500" /> : <AlertCircle size={40} className="text-red-500" />}
              </motion.div>
              
              <h2 className="text-3xl font-black tracking-tighter mb-2 uppercase italic">
                {gameState === 'MAX_REACHED' ? (t.colorSort?.maxReached || "Max Reached") : (t.colorSort?.gameOver || "Game Over")}
              </h2>
              
              <div className="bg-zinc-900/80 backdrop-blur-md w-full p-6 rounded-3xl border border-zinc-800 mb-8 mt-4">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{t.colorSort?.score || "Score"}</p>
                <p className="text-5xl font-black text-pink-500 tracking-tighter">{score}</p>
              </div>

              <div className="flex flex-col gap-3 w-full">
                <Button onClick={startGame} className="w-full py-5 text-lg font-black tracking-widest uppercase italic flex items-center justify-center gap-3 bg-pink-600 hover:bg-pink-500">
                  <RotateCcw size={20} /> {t.colorSort?.tryAgain || "Try Again"}
                </Button>
                <Button onClick={() => setGameState('IDLE')} variant="secondary" className="w-full py-4 text-sm font-bold uppercase tracking-widest">
                  {t.common.backToMenu || "Back"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {gameState === 'NO_ATTEMPTS' && (
          <motion.div 
            key="no_attempts"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-950 z-[100] flex flex-col items-center justify-center p-8 text-center safe-top safe-pb"
          >
            <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center mb-6 border border-zinc-800">
              <Clock size={40} className="text-zinc-500" />
            </div>
            <h2 className="text-3xl font-black tracking-tighter mb-4 uppercase italic">{t.colorSort?.noAttempts || "No Attempts"}</h2>
            <Button onClick={() => setScreen('EVENT_DETAILS')} className="w-full max-w-[280px] py-5 text-lg font-black tracking-widest uppercase italic">
              {t.common.backToMenu || "Back to Arenas"}
            </Button>
          </motion.div>
        )}

        {gameState === 'MOVES_OUT' && (
          <motion.div
            key="moves_out"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-950 z-[100] flex flex-col items-center justify-center p-8 text-center safe-top safe-pb"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-20 h-20 bg-yellow-500/20 rounded-3xl flex items-center justify-center mb-6 border border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.2)]"
            >
              <AlertCircle size={40} className="text-yellow-400" />
            </motion.div>
            <h2 className="text-3xl font-black tracking-tighter mb-2 uppercase italic text-yellow-400">
              {t.colorSort?.noMoves || "No Moves Left!"}
            </h2>
            <div className="bg-zinc-900/80 backdrop-blur-md w-full max-w-[280px] p-5 rounded-3xl border border-zinc-800 mb-8 mt-4">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{t.colorSort?.score || "Score"}</p>
              <p className="text-5xl font-black text-pink-500 tracking-tighter">{score}</p>
            </div>
            <div className="flex flex-col gap-3 w-full max-w-[280px]">
              <Button onClick={startGame} className="w-full py-5 text-lg font-black tracking-widest uppercase italic bg-pink-600 hover:bg-pink-500 flex items-center justify-center gap-3">
                <RotateCcw size={20} /> {t.colorSort?.tryAgain || "Try Again"}
              </Button>
              <Button onClick={() => setGameState('IDLE')} variant="secondary" className="w-full py-4 text-sm font-bold uppercase tracking-widest">
                {t.common.backToMenu || "Back"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const BoostBtn = ({ icon, count, onClick, label }: { icon: React.ReactNode, count: number, onClick: () => void, label: string }) => (
  <button 
    onClick={onClick}
    disabled={count <= 0}
    className={`flex flex-col items-center gap-1 ${count > 0 ? 'opacity-100 active:scale-90' : 'opacity-40'} transition-transform`}
  >
    <div className="relative w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-lg">
      {icon}
      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-zinc-950">
        {count}
      </div>
    </div>
    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">{label}</span>
  </button>
);

const QuestItem = ({ title, progress, total, reward, completed }: { title: string, progress: number, total: number, reward: string, completed?: boolean }) => (
  <div className={`p-4 rounded-2xl border ${completed ? 'bg-pink-500/10 border-pink-500/30' : 'bg-zinc-900 border-zinc-800'} flex items-center justify-between`}>
    <div>
      <p className={`text-sm font-bold ${completed ? 'text-pink-400' : 'text-zinc-300'}`}>{title}</p>
      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Reward: {reward}</p>
    </div>
    <div className="flex flex-col items-end gap-2">
      <span className={`text-xs font-black ${completed ? 'text-pink-500' : 'text-zinc-400'}`}>{progress} / {total}</span>
      <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full ${completed ? 'bg-pink-500' : 'bg-zinc-600'}`} style={{ width: `${(progress / total) * 100}%` }} />
      </div>
    </div>
  </div>
);

const ShopItem = ({ title, price, icon, special, onClick }: { title: string, price: number, icon: React.ReactNode, special?: boolean, onClick?: () => void }) => (
  <button onClick={onClick} className={`p-4 rounded-3xl border flex flex-col items-center text-center gap-3 active:scale-95 transition-transform ${special ? 'bg-gradient-to-b from-pink-500/20 to-zinc-900 border-pink-500/50' : 'bg-zinc-900/80 border-zinc-800'}`}>
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${special ? 'bg-pink-500/20' : 'bg-zinc-800'}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-bold text-white mb-1">{title}</p>
      <p className="text-xs font-black text-pink-500">{price} Pts</p>
    </div>
  </button>
);
