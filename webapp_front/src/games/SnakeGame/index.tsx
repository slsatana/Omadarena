import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronLeft, 
  Gift, 
  Medal, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  AlertCircle,
  Clock
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { Button, BackButton } from '../../components/Shared';
import { audio, haptics } from '../../utils/audio';

const GRID_WIDTH = 25;
const GRID_HEIGHT = 30;
const INITIAL_SNAKE = [{ x: 12, y: 15 }, { x: 12, y: 16 }, { x: 12, y: 17 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const INITIAL_SPEED = 120;
const POINTS_PER_FOOD = 2;

type Point = { x: number; y: number };

export const SnakeGame = () => {
  const { setScreen, user, addPoints, updateHighScore, useAttempt, t, gamesStats, selectedGameId } = useGame();
  
  const gameStat = gamesStats[selectedGameId];
  const dailyPoints = gameStat?.pointsEarnedToday || 0;
  const MAX_LIMIT = gameStat?.dailyPointsLimit || 5000;
  const attemptsLeft = gameStat?.attemptsLeft ?? 0;
  
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'MAX_REACHED' | 'NO_ATTEMPTS'>('IDLE');
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [superFood, setSuperFood] = useState<Point | null>(null);
  const [score, setScore] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const directionRef = useRef<Point>(INITIAL_DIRECTION);
  
  // Refs for game loop to avoid dependency churn
  const snakeRef = useRef<Point[]>(INITIAL_SNAKE);
  const foodRef = useRef<Point>({ x: 5, y: 5 });
  const superFoodRef = useRef<Point | null>(null);
  const superFoodTimerRef = useRef<number | null>(null);
  const growCountRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const currentSpeedRef = useRef<number>(INITIAL_SPEED);
  const lastSpeedUpdateRef = useRef<number>(0);
  const gameStateRef = useRef<typeof gameState>('IDLE');

  // Sync refs with state for the loop
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood: Point;
    let attempts = 0;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_WIDTH),
        y: Math.floor(Math.random() * GRID_HEIGHT),
      };
      attempts++;
      if (attempts > 100) break;
    } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, []);

  const spawnSuperFood = useCallback((currentSnake: Point[], currentFood: Point) => {
    let newFood: Point;
    let attempts = 0;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_WIDTH),
        y: Math.floor(Math.random() * GRID_HEIGHT),
      };
      attempts++;
      if (attempts > 100) return;
    } while (
      currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
      (newFood.x === currentFood.x && newFood.y === currentFood.y)
    );
    
    superFoodRef.current = newFood;
    setSuperFood(newFood);
    
    if (superFoodTimerRef.current) clearTimeout(superFoodTimerRef.current);
    superFoodTimerRef.current = window.setTimeout(() => {
      superFoodRef.current = null;
      setSuperFood(null);
    }, 10000);
  }, []);

  const startGame = () => {
    if (attemptsLeft <= 0) {
      setGameState('NO_ATTEMPTS');
      return;
    }
    
    if (!useAttempt()) {
      return;
    }

    const initialFood = generateFood(INITIAL_SNAKE);
    
    snakeRef.current = INITIAL_SNAKE;
    directionRef.current = INITIAL_DIRECTION;
    foodRef.current = initialFood;
    scoreRef.current = 0;
    currentSpeedRef.current = INITIAL_SPEED;
    lastSpeedUpdateRef.current = performance.now();
    
    if (superFoodTimerRef.current) clearTimeout(superFoodTimerRef.current);
    superFoodRef.current = null;
    setSuperFood(null);
    growCountRef.current = 0;
    
    setSnake(INITIAL_SNAKE);
    setFood(initialFood);
    setScore(0);
    setGameState('PLAYING');
  };

  const handleGameOver = useCallback((reason: 'COLLISION' | 'MAX_SCORE', finalScore: number) => {
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    if (superFoodTimerRef.current) clearTimeout(superFoodTimerRef.current);
    
    scoreRef.current = finalScore;
    setScore(finalScore);
    
    addPoints(finalScore);
    updateHighScore(finalScore);
    
    if (reason === 'MAX_SCORE') {
      setGameState('MAX_REACHED');
    } else {
      setGameState('GAMEOVER');
    }
  }, [addPoints, updateHighScore]);

  const update = useCallback((time: number) => {
    if (gameStateRef.current !== 'PLAYING') return;

    if (time - lastSpeedUpdateRef.current > 30000) {
      currentSpeedRef.current *= 0.98; // 2% faster
      lastSpeedUpdateRef.current = time;
    }

    if (time - lastUpdateRef.current > currentSpeedRef.current) {
      lastUpdateRef.current = time;

      const currentSnake = snakeRef.current;
      const head = currentSnake[0];
      const newHead = {
        x: head.x + directionRef.current.x,
        y: head.y + directionRef.current.y,
      };

      // Wrap around walls
      if (newHead.x < 0) newHead.x = GRID_WIDTH - 1;
      else if (newHead.x >= GRID_WIDTH) newHead.x = 0;
      
      if (newHead.y < 0) newHead.y = GRID_HEIGHT - 1;
      else if (newHead.y >= GRID_HEIGHT) newHead.y = 0;

      // Check self collision
      if (currentSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        audio.playGameOver();
        haptics.error();
        handleGameOver('COLLISION', scoreRef.current);
        return;
      }

      const newSnake = [newHead, ...currentSnake];
      let ateFood = false;

      // Check food collision
      if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
        ateFood = true;
        const newScore = scoreRef.current + POINTS_PER_FOOD;
        scoreRef.current = newScore;
        setScore(newScore);
        audio.playCoin();
        haptics.success();
        
        const newFood = generateFood(newSnake);
        foodRef.current = newFood;
        setFood(newFood);
        
        if (!superFoodRef.current && Math.random() < 0.1) {
          spawnSuperFood(newSnake, newFood);
        }
        
        if (newScore >= MAX_LIMIT) {
          audio.playLevelUp();
          haptics.heavy();
          handleGameOver('MAX_SCORE', newScore);
          return;
        }
      } else if (superFoodRef.current && newHead.x === superFoodRef.current.x && newHead.y === superFoodRef.current.y) {
        ateFood = true;
        growCountRef.current += 1; // Extra growth
        const newScore = scoreRef.current + (POINTS_PER_FOOD * 2);
        scoreRef.current = newScore;
        setScore(newScore);
        audio.playCoin();
        haptics.heavy();
        
        if (superFoodTimerRef.current) clearTimeout(superFoodTimerRef.current);
        superFoodRef.current = null;
        setSuperFood(null);
        
        if (newScore >= MAX_LIMIT) {
          audio.playLevelUp();
          haptics.heavy();
          handleGameOver('MAX_SCORE', newScore);
          return;
        }
      }

      if (!ateFood) {
        if (growCountRef.current > 0) {
          growCountRef.current--;
        } else {
          newSnake.pop();
        }
      }
      
      snakeRef.current = newSnake;
      setSnake(newSnake);
    }

    gameLoopRef.current = requestAnimationFrame(update);
  }, [generateFood, spawnSuperFood, handleGameOver]);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      lastUpdateRef.current = performance.now();
      gameLoopRef.current = requestAnimationFrame(update);
    }
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, update]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING') return;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (directionRef.current.y === 0) directionRef.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (directionRef.current.y === 0) directionRef.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (directionRef.current.x === 0) directionRef.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (directionRef.current.x === 0) directionRef.current = { x: 1, y: 0 };
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = canvas.width / GRID_WIDTH;

    // Clear
    ctx.fillStyle = '#09090b'; // zinc-950
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines (subtle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_WIDTH; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i <= GRID_HEIGHT; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }

    // Draw food
    ctx.fillStyle = '#f97316'; // orange-500
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#f97316';
    ctx.beginPath();
    ctx.roundRect(
      food.x * cellSize + 2,
      food.y * cellSize + 2,
      cellSize - 4,
      cellSize - 4,
      4
    );
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw super food
    if (superFood) {
      ctx.fillStyle = '#a855f7'; // purple-500
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#a855f7';
      ctx.beginPath();
      
      const cx = superFood.x * cellSize + cellSize / 2;
      const cy = superFood.y * cellSize + cellSize / 2;
      const time = Date.now() / 150;
      const radius = (cellSize / 2 - 2) + Math.sin(time) * 2;
      
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Draw snake
    snake.forEach((segment, index) => {
      const isHead = index === 0;
      ctx.fillStyle = isHead ? '#3b82f6' : '#1d4ed8'; // blue-500 : blue-700
      
      if (isHead) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#3b82f6';
      }

      ctx.beginPath();
      ctx.roundRect(
        segment.x * cellSize + 1,
        segment.y * cellSize + 1,
        cellSize - 2,
        cellSize - 2,
        isHead ? 6 : 4
      );
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }, [snake, food, superFood]);

  // Swipe handling
  const touchStartRef = useRef<Point | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > 30) {
        if (deltaX > 0 && directionRef.current.x === 0) directionRef.current = { x: 1, y: 0 };
        else if (deltaX < 0 && directionRef.current.x === 0) directionRef.current = { x: -1, y: 0 };
      }
    } else {
      if (Math.abs(deltaY) > 30) {
        if (deltaY > 0 && directionRef.current.y === 0) directionRef.current = { x: 0, y: 1 };
        else if (deltaY < 0 && directionRef.current.y === 0) directionRef.current = { x: 0, y: -1 };
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col justify-between text-white overflow-hidden font-sans">
      {/* Header */}
      <div className="p-3 safe-top flex justify-between items-center z-20 shrink-0 bg-zinc-950/50 backdrop-blur-md border-b border-zinc-900">
        <div className="w-9 h-9" /> {/* Placeholder to keep score centered */}
        <div className="flex flex-col items-center">
          <p className="text-[15px] font-black uppercase tracking-[0.2em] text-zinc-500">{t.snake.score}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black tabular-nums">{score}</span>
            <span className="text-[9px] text-zinc-500 font-bold">/ {MAX_LIMIT}</span>
          </div>
        </div>
        <button 
          onClick={() => setGameState(prev => prev === 'PLAYING' ? 'PAUSED' : 'PLAYING')}
          className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-transform"
        >
          {gameState === 'PAUSED' ? <Play size={18} /> : <Pause size={18} />}
        </button>
      </div>

      {/* Game Area */}
      <div 
        className="flex-1 relative flex items-center justify-center p-4 min-h-0"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={400}
            height={480}
            style={{ aspectRatio: '25/30', maxHeight: '100%', maxWidth: '100%' }}
            className="bg-zinc-900/50 rounded-2xl border border-zinc-800/50 shadow-2xl"
          />
        </div>
      </div>

      {/* Overlays */}
      <AnimatePresence mode="wait">
        {gameState === 'IDLE' && (
          <motion.div 
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-950 z-[100] flex flex-col overflow-y-auto"
          >
            {/* Background */}
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/60 via-zinc-950/80 to-zinc-950 z-10" />
              <motion.img 
                initial={{ scale: 1.1 }}
                animate={{ scale: 1.2 }}
                transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
                src="https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1000" 
                className="w-full h-full object-cover opacity-50 blur-[2px]"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Content */}
            <div className="relative z-20 flex-1 flex flex-col p-6 safe-top safe-pb">
              {/* Top Bar */}
              <div className="flex justify-between items-start mb-8">
                <BackButton onClick={() => setScreen('EVENT_DETAILS')} />
                <div className="text-right">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Version</p>
                  <p className="text-xs font-black text-zinc-300">v2.4.0</p>
                </div>
              </div>

              {/* Hero Section */}
              <div className="flex-1 flex flex-col items-center justify-center text-center mb-8">
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-20 h-20 bg-blue-500/20 rounded-3xl flex items-center justify-center mb-6 border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.2)]"
                >
                  <Medal size={40} className="text-blue-500" />
                </motion.div>
                <motion.h1 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl font-black tracking-tighter uppercase italic mb-2 bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent"
                >
                  {t.gameDetails.SNAKE.title || "Snake"}
                </motion.h1>
                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-zinc-400 text-sm max-w-[280px] leading-relaxed"
                >
                  {t.gameDetails.SNAKE.desc || "Eat food, grow longer, don't crash!"}
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
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{t.common.best || "Best"}</p>
                    <p className="text-2xl font-black text-white">{user.highScore}</p>
                  </div>
                  <div className="bg-zinc-900/50 backdrop-blur-md p-4 rounded-2xl border border-zinc-800/50">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{t.common.attemptsLeft || "Attempts"}</p>
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
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">{t.leaderboard.title || "Leaders"}</span>
                  </button>
                  <button 
                    onClick={() => setScreen('SHOP')}
                    className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800/50 rounded-2xl py-4 flex flex-col items-center gap-2 active:scale-95 transition-transform"
                  >
                    <Gift size={24} className="text-blue-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">{t.arenaGame?.prizes || "Prizes"}</span>
                  </button>
                </div>

                {/* Main Action */}
                <Button 
                  onClick={startGame} 
                  className="w-full py-5 text-lg font-black tracking-widest uppercase italic shadow-[0_0_40px_rgba(59,130,246,0.3)]"
                >
                  {t.gameBoard.play || "Play"}
                </Button>
              </motion.div>
            </div>
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
            <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-8 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">{t.common.paused || "PAUSED"}</h2>
            <div className="flex flex-col gap-4 w-full max-w-[200px]">
              <Button onClick={() => setGameState('PLAYING')} className="py-4 text-lg">
                {t.common.resume || "RESUME"}
              </Button>
              <Button onClick={() => setShowExitConfirm(true)} variant="secondary" className="py-4 text-lg">
                {t.common.exitToMenu || "EXIT"}
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
            <h3 className="text-2xl font-black mb-2 uppercase italic tracking-tighter">{t.common.areYouSure || "ARE YOU SURE?"}</h3>
            <p className="text-zinc-400 mb-8">{t.common.exitConfirmText || "You will lose this attempt."}</p>
            <div className="flex flex-col gap-3 w-full max-w-[240px]">
              <Button onClick={() => { setShowExitConfirm(false); setGameState('IDLE'); }} className="py-4 bg-red-500 text-white border-red-500/50">
                {t.common.yesExit || "EXIT TO MENU"}
              </Button>
              <Button onClick={() => setShowExitConfirm(false)} variant="secondary" className="py-4">
                {t.common.cancel || "RESUME"}
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
              <img 
                src="https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1000" 
                className="w-full h-full object-cover opacity-20 grayscale"
                referrerPolicy="no-referrer"
              />
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
                {gameState === 'MAX_REACHED' ? (t.colorSort?.maxReached || "MAX REACHED") : (t.result?.congrats || "GAME OVER")}
              </h2>
              
              <div className="bg-zinc-900/80 backdrop-blur-md w-full p-6 rounded-3xl border border-zinc-800 mb-8 mt-4">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{t.common.score}</p>
                <p className="text-5xl font-black text-blue-500 tracking-tighter">{score}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full mb-6">
                <button 
                  onClick={() => setScreen('LEADERBOARD')}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 flex flex-col items-center gap-2 active:scale-95 transition-transform"
                >
                  <Trophy size={20} className="text-orange-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t.leaderboard.title || "LEADERS"}</span>
                </button>
                <button 
                  onClick={() => setScreen('SHOP')}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 flex flex-col items-center gap-2 active:scale-95 transition-transform"
                >
                  <Gift size={20} className="text-blue-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t.arenaGame?.prizes || "PRIZES"}</span>
                </button>
              </div>

              <div className="flex flex-col gap-3 w-full">
                <Button onClick={startGame} className="w-full py-5 text-lg font-black tracking-widest uppercase italic flex items-center justify-center gap-3">
                  <RotateCcw size={20} /> {t.arenaGame.tryAgain || "TRY AGAIN"}
                </Button>
                <Button onClick={() => setGameState('IDLE')} variant="secondary" className="w-full py-4 text-sm font-bold uppercase tracking-widest">
                  {t.common.backToMenu || "BACK"}
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
            <h2 className="text-3xl font-black tracking-tighter mb-4 uppercase italic">{t.arenaGame.noAttempts || "NO ATTEMPTS"}</h2>
            <p className="text-zinc-400 text-sm mb-10 max-w-[240px]">{t.match3?.comeBackTomorrow || "Come back tomorrow"}</p>
            <Button onClick={() => setScreen('EVENT_DETAILS')} className="w-full max-w-[280px] py-5 text-lg font-black tracking-widest uppercase italic">
              {t.common.backToMenu || "BACK TO ARENAS"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <AnimatePresence>
        {gameState === 'PLAYING' && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="p-4 safe-pb flex flex-col items-center gap-4 bg-zinc-950 shrink-0 border-t border-zinc-900 z-10"
          >
            <div className="grid grid-cols-3 gap-2">
              <div />
              <ControlBtn icon={<ArrowUp size={32} />} onClick={() => directionRef.current = { x: 0, y: -1 }} />
              <div />
              <ControlBtn icon={<ArrowLeft size={32} />} onClick={() => directionRef.current = { x: -1, y: 0 }} />
              <ControlBtn icon={<ArrowDown size={32} />} onClick={() => directionRef.current = { x: 0, y: 1 }} />
              <ControlBtn icon={<ArrowRight size={32} />} onClick={() => directionRef.current = { x: 1, y: 0 }} />
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ControlBtn = ({ icon, onClick }: { icon: React.ReactNode; onClick: () => void }) => (
  <button 
    onClick={() => {
      onClick();
      audio.playTone(400, 'sine', 0.05);
      haptics.light();
    }}
    className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-95 active:bg-zinc-800 transition-all shadow-lg hover:bg-zinc-800"
  >
    {icon}
  </button>
);
