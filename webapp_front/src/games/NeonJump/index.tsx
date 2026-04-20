import React, { useState, useEffect, useRef } from 'react';
import { 
  Pause, 
  Play, 
  ArrowLeft, 
  ArrowRight,
  Zap, 
  Trophy, 
  Gift, 
  Users, 
  Info, 
  RotateCcw,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../../context/GameContext';
import { Button, BackButton } from '../../components/Shared';
import { audio, haptics } from '../../utils/audio';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 700;
const GRAVITY = 0.4;
const JUMP_FORCE = -13.5;
const PLATFORM_WIDTH = 60;
const PLATFORM_HEIGHT = 10;
const INITIAL_SPEED = 4;

interface Platform {
  x: number;
  y: number;
  type: 'normal' | 'moving' | 'breaking';
  direction?: number;
  width?: number;
}

interface Bonus {
  x: number;
  y: number;
  collected: boolean;
}

export const NeonJump: React.FC = () => {
  const { user, updateHighScore, addPoints, useAttempt, t, setScreen, gamesStats, selectedGameId } = useGame();
  
  const gameStat = gamesStats[selectedGameId];
  const dailyPoints = gameStat?.pointsEarnedToday || 0;
  const MAX_LIMIT = gameStat?.dailyPointsLimit || 5000;
  const attemptsLeft = gameStat?.attemptsLeft ?? 0;
  const [gameState, setGameState] = useState<'MAIN' | 'READY' | 'PLAYING' | 'GAMEOVER' | 'RULES' | 'RATING' | 'PRIZES' | 'INVITE'>('MAIN');
  const [score, setScore] = useState(0);
  const [lastScore, setLastScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);
  const lastTimestampRef = useRef<number>(0);
  const gameRef = useRef({
    player: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 100, vx: 0, vy: 0, size: 20 },
    platforms: [] as Platform[],
    bonuses: [] as Bonus[],
    score: 0,
    cameraY: 0,
    speed: INITIAL_SPEED,
    startTime: 0,
    lastSpeedUpdate: 0,
    keys: { left: false, right: false },
    deathLineY: CANVAS_HEIGHT
  });

  const resetGame = () => {
    const platforms: Platform[] = [];
    // Initial platforms
    for (let i = 0; i < 10; i++) {
      platforms.push({
        x: i === 0 ? 0 : Math.random() * (CANVAS_WIDTH - PLATFORM_WIDTH),
        y: CANVAS_HEIGHT - (i * 100),
        type: 'normal',
        width: i === 0 ? CANVAS_WIDTH : PLATFORM_WIDTH
      });
    }

    gameRef.current = {
      player: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 120, vx: 0, vy: 0, size: 20 },
      platforms,
      bonuses: [],
      score: 0,
      cameraY: 0,
      speed: INITIAL_SPEED,
      startTime: Date.now(),
      lastSpeedUpdate: Date.now(),
      keys: { left: false, right: false },
      deathLineY: CANVAS_HEIGHT
    };
    setScore(0);
    setLastScore(0);
    setIsPaused(false);
  };

  const update = (deltaTime: number) => {
    if (isPaused) {
      gameRef.current.lastSpeedUpdate = Date.now();
      return;
    }
    const g = gameRef.current;
    const now = Date.now();

    // Difficulty scaling: +1% speed every 10 seconds
    if (now - g.lastSpeedUpdate > 10000) {
      g.speed *= 1.01;
      g.lastSpeedUpdate = now;
    }

    // Player movement (delta-time normalized to 60fps)
    if (g.keys.left) g.player.vx = -5;
    else if (g.keys.right) g.player.vx = 5;
    else g.player.vx *= Math.pow(0.8, deltaTime);

    g.player.x += g.player.vx * deltaTime;
    g.player.vy += GRAVITY * deltaTime;
    g.player.y += g.player.vy * deltaTime;

    // Screen wrap
    if (g.player.x < 0) g.player.x = CANVAS_WIDTH;
    if (g.player.x > CANVAS_WIDTH) g.player.x = 0;

    // Camera follow
    if (g.player.y < CANVAS_HEIGHT / 2 + g.cameraY) {
      const diff = (CANVAS_HEIGHT / 2 + g.cameraY) - g.player.y;
      g.cameraY -= diff;
      // Balanced distance points
      g.score += diff / 25;
      setScore(Math.floor(g.score));
    }

    // Platform collision
    if (g.player.vy > 0) {
      g.platforms.forEach(p => {
        const pWidth = p.width || PLATFORM_WIDTH;
        if (
          g.player.x + g.player.size > p.x &&
          g.player.x - g.player.size < p.x + pWidth &&
          g.player.y + g.player.size > p.y &&
          g.player.y + g.player.size < p.y + PLATFORM_HEIGHT + 10
        ) {
          g.player.vy = JUMP_FORCE;
          g.player.y = p.y - g.player.size;
          audio.playJump();
          haptics.light();
        }
      });
    }

    // Bonus collision
    g.bonuses.forEach(b => {
      if (!b.collected) {
        const dx = g.player.x - b.x;
        const dy = g.player.y - b.y;
        if (Math.sqrt(dx*dx + dy*dy) < g.player.size + 15) {
          b.collected = true;
          g.score += 15; // Balanced coin points
          audio.playCoin();
          haptics.success();
          setScore(Math.floor(g.score));
        }
      }
    });

    // Spawn new platforms
    const highestPlatformY = Math.min(...g.platforms.map(p => p.y));
    if (highestPlatformY > g.cameraY - 100) {
      // Scaled down gap between platforms so they are reachable
      const newY = highestPlatformY - (70 + Math.random() * 80);
      g.platforms.push({
        x: Math.random() * (CANVAS_WIDTH - PLATFORM_WIDTH),
        y: newY,
        type: Math.random() > 0.6 ? 'moving' : 'normal',
        direction: Math.random() > 0.5 ? 1 : -1
      });

      if (Math.random() > 0.9) {
        g.bonuses.push({
          x: Math.random() * CANVAS_WIDTH,
          y: newY - 30,
          collected: false
        });
      }
    }

    // Moving platforms
    g.platforms.forEach(p => {
      if (p.type === 'moving' && p.direction) {
        p.x += p.direction * g.speed * 0.5 * deltaTime;
        if (p.x <= 0 || p.x >= CANVAS_WIDTH - PLATFORM_WIDTH) p.direction *= -1;
      }
    });

    // Cleanup
    g.platforms = g.platforms.filter(p => p.y < g.cameraY + CANVAS_HEIGHT + 100);
    g.bonuses = g.bonuses.filter(b => b.y < g.cameraY + CANVAS_HEIGHT + 100);

    // Update death line
    let currentBottom = g.cameraY + CANVAS_HEIGHT;
    if (g.score > 500) {
      g.deathLineY -= 0.3 * deltaTime; // Move up very slowly
      if (g.deathLineY > currentBottom) {
        g.deathLineY = currentBottom;
      }
    } else {
      g.deathLineY = currentBottom;
    }

    // Game Over
    if (g.player.y > g.deathLineY) {
      audio.playGameOver();
      haptics.error();
      const finalScore = Math.floor(g.score);
      setLastScore(finalScore);
      updateHighScore(finalScore);
      
      // Award points with daily limit handled by GameContext
      if (finalScore > 0) {
        addPoints(finalScore);
      }
      
      setGameState('GAMEOVER');
    }
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const g = gameRef.current;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    ctx.translate(0, -g.cameraY);

    // Draw Platforms (Clouds)
    g.platforms.forEach(p => {
      ctx.save();
      ctx.fillStyle = p.type === 'moving' ? '#E0F2FE' : '#FFFFFF';
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(255,255,255,0.5)';
      
      const x = p.x;
      const y = p.y;
      const h = PLATFORM_HEIGHT;
      const w = p.width || PLATFORM_WIDTH;
      
      if (w > PLATFORM_WIDTH) {
        // Draw a wider cloud or a solid rectangle for the first platform
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 5);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(x + 20, y + h/2, 15, 0, Math.PI * 2);
        ctx.arc(x + 40, y + h/2 - 8, 20, 0, Math.PI * 2);
        ctx.arc(x + 60, y + h/2, 15, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    });

    // Draw Bonuses
    g.bonuses.forEach(b => {
      if (!b.collected) {
        ctx.fillStyle = '#FFD60A';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#FFD60A';
        
        ctx.beginPath();
        const time = Date.now() / 200;
        const size = 10 + Math.sin(time) * 2;
        
        // Hexagon shape
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          const x = b.x + size * Math.cos(angle);
          const y = b.y + size * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      }
    });

    // Draw Player (Soft Toy)
    ctx.save();
    ctx.font = `${g.player.size * 2.5}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(255,255,255,0.5)';
    
    // Flip based on direction
    ctx.translate(g.player.x, g.player.y);
    if (g.player.vx < 0) ctx.scale(-1, 1);
    
    ctx.fillText('🧸', 0, 0);
    ctx.restore();

    // Draw Death Line
    if (g.score > 500) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 69, 58, 0.3)';
      ctx.fillRect(0, g.deathLineY, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.beginPath();
      ctx.moveTo(0, g.deathLineY);
      ctx.lineTo(CANVAS_WIDTH, g.deathLineY);
      ctx.strokeStyle = '#FF453A';
      ctx.lineWidth = 4;
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#FF453A';
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  };

  useEffect(() => {
    let animationFrameId: number;
    
    const startLoop = () => {
      if (gameState === 'PLAYING') {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        
        if (!ctx) {
          animationFrameId = requestAnimationFrame(startLoop);
          return;
        }

        const loop = (timestamp: number) => {
          // Delta-time: normalize to 60fps baseline. Cap at 3 frames to prevent huge jumps after tab switch
          const rawDelta = lastTimestampRef.current > 0 ? timestamp - lastTimestampRef.current : 16.67;
          const deltaTime = Math.min(rawDelta / (1000 / 60), 3);
          lastTimestampRef.current = timestamp;

          update(deltaTime);
          draw(ctx);
          animationFrameId = requestAnimationFrame(loop);
        };
        lastTimestampRef.current = 0;
        animationFrameId = requestAnimationFrame(loop);
      }
    };

    startLoop();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') gameRef.current.keys.left = true;
      if (e.key === 'ArrowRight') gameRef.current.keys.right = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') gameRef.current.keys.left = false;
      if (e.key === 'ArrowRight') gameRef.current.keys.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, isPaused]);

  const handleStart = () => {
    setGameState('READY');
  };

  const handleActualStart = () => {
    if (attemptsLeft > 0) {
      if (useAttempt()) {
        resetGame();
        setGameState('PLAYING');
      }
    } else {
      alert(t.arenaGame.noAttempts || "NO ATTEMPTS LEFT");
    }
  };

  const handleExit = () => {
    setIsPaused(false);
    setShowExitConfirm(false);
    setGameState('MAIN');
  };

  // --- Screens ---

  const ReadyScreen = () => (
    <div className="flex flex-col h-full bg-[#050505] text-white p-8 justify-center overflow-y-auto">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <h2 className="text-4xl font-black mb-8 italic tracking-tighter text-[#0A84FF]">{t.arenaGame.rules}</h2>
        
        <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 mb-12 text-left">
          <p className="text-white/70 leading-relaxed mb-4">
            {t.arenaGame.rulesText}
          </p>
          <ul className="space-y-3 text-sm text-white/50 font-medium">
            {t.arenaGame.neonJumpRules.map((rule: string, index: number) => (
              <li key={index} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0A84FF]" />
                {rule}
              </li>
            ))}
          </ul>
        </div>

        <Button 
          onClick={handleActualStart} 
          className="w-full py-6 rounded-[32px] bg-[#0A84FF] text-white font-black italic text-2xl shadow-[0_15px_40px_rgba(10,132,255,0.4)] flex items-center justify-center gap-4 active:scale-95 active:translate-y-1 transition-all uppercase tracking-tighter border-b-4 border-[#0056b3]"
        >
          <Play className="fill-white" size={24} /> {t.arenaGame.start}
        </Button>
        
        <button onClick={() => setGameState('MAIN')} className="mt-6 text-white/30 font-black uppercase tracking-widest text-xs">
          {t.common.back}
        </button>
      </motion.div>
    </div>
  );

  const MainMenu = () => (
    <div className="flex flex-col h-full bg-[#050505] text-white p-6 overflow-y-auto">
          <div className="flex justify-between items-start mb-12">
            <div className="flex flex-col">
              <BackButton onClick={() => setScreen('EVENT_DETAILS')} className="mb-4 self-start" />
              <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">{t.arenaGame.best}</span>
              <span className="text-4xl font-black text-[#0A84FF]">{user.highScore}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">{t.common.attemptsLeft || "ATTEMPTS"}</span>
              <span className="text-xl font-bold text-[#FFD60A]">{attemptsLeft}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">{t.common.dailyPoints || "DAILY PTS"}</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-[#FFD60A]">{dailyPoints}/{MAX_LIMIT}</span>
              </div>
            </div>
          </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
        <motion.div 
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-48 h-48 mb-8"
        >
          <div className="absolute inset-0 bg-[#0A84FF]/30 blur-[80px] rounded-full animate-pulse" />
          <div className="relative w-full h-full bg-gradient-to-br from-[#0A84FF] to-[#0040FF] rounded-[52px] flex items-center justify-center shadow-[0_0_60px_rgba(10,132,255,0.5)] border-4 border-white/10">
            <span className="text-8xl drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">🧸</span>
          </div>
        </motion.div>

        <div className="mb-6 flex flex-col items-center w-full">
          <h1 className="text-5xl font-black tracking-tighter italic text-center w-full text-white break-words px-2">{t.gameDetails.NEON_JUMP.title}</h1>
        </div>
        
        
        
        <Button 
          onClick={handleStart} 
          disabled={attemptsLeft <= 0}
          className="w-full py-8 rounded-[40px] bg-[#0A84FF] text-white font-black italic text-4xl shadow-[0_20px_50px_rgba(10,132,255,0.4)] flex items-center justify-center gap-4 active:scale-95 active:translate-y-1 transition-all uppercase tracking-tighter border-b-8 border-[#0056b3]"
        >
          <Play className="fill-white" size={40} /> {attemptsLeft > 0 ? t.arenaGame.play : t.arenaGame.noAttempts}
        </Button>
      </div>
    </div>
  );

  const GameOver = () => (
    <div className="flex flex-col h-full bg-[#050505] text-white p-8 justify-center text-center overflow-y-auto relative">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <BackButton onClick={() => setGameState('MAIN')} className="absolute top-8 left-8" />
        <h2 className="text-6xl font-black mb-2 tracking-tighter text-[#FF453A] italic">{t.arenaGame.gameOver}</h2>
        
        <div className="my-12">
          <span className="text-white/30 font-black uppercase tracking-[0.3em] text-xs block mb-2">{t.arenaGame.score}</span>
          <span className="text-8xl font-black tracking-tighter">{lastScore}</span>
        </div>

        <div className="bg-white/5 rounded-[40px] p-8 border border-white/10 mb-12 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-white/40 font-bold uppercase text-[10px] tracking-widest">{t.arenaGame.best}</span>
            <span className="text-2xl font-black">{user.highScore}</span>
          </div>
          <div className="h-px bg-white/10 w-full" />
          <div className="flex justify-between items-center">
            <span className="text-white/40 font-bold uppercase text-[10px] tracking-widest">{t.common.dailyLimit}</span>
            <span className="text-2xl font-black text-[#FFD60A]">{dailyPoints} / {MAX_LIMIT}</span>
          </div>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={handleStart} 
            className="w-full py-6 rounded-[32px] bg-[#0A84FF] text-white font-black italic text-2xl shadow-[0_15px_40px_rgba(10,132,255,0.4)] flex items-center justify-center gap-4 active:scale-95 active:translate-y-1 transition-all uppercase tracking-tighter border-b-4 border-[#0056b3]"
          >
            <RotateCcw size={24} /> {t.arenaGame.tryAgain}
          </Button>
          <button onClick={() => setGameState('MAIN')} className="w-full py-4 text-white/30 font-black uppercase tracking-widest text-xs">
            {t.common.backToMenu}
          </button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="relative w-full h-full bg-[#050505] overflow-hidden select-none touch-none">
      <AnimatePresence mode="wait">
        {gameState === 'MAIN' && (
          <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
            <MainMenu />
          </motion.div>
        )}

        {gameState === 'READY' && (
          <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
            <ReadyScreen />
          </motion.div>
        )}
        
        {gameState === 'PLAYING' && (
          <motion.div 
            key="playing" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="h-full relative"
          >
            <div className="absolute top-12 left-0 right-0 px-8 flex justify-between items-center z-50">
              <div className="flex items-center gap-4">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPaused(!isPaused);
                  }}
                  className="bg-black/60 backdrop-blur-xl p-2.5 rounded-full border border-white/10 pointer-events-auto active:scale-90 transition-transform"
                >
                  {isPaused ? <Play size={18} className="text-[#0A84FF] fill-current" /> : <Pause size={18} className="text-[#0A84FF] fill-current" />}
                </button>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{t.common.score}</span>
                  <span className="text-2xl font-black tabular-nums">{score}</span>
                </div>
              </div>
            </div>

            {isPaused && (
              <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-8">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-xs text-center">
                  {!showExitConfirm ? (
                    <>
                      <h2 className="text-5xl font-black mb-8 italic tracking-tighter">{t.common.paused}</h2>
                      <div className="space-y-4">
                        <Button onClick={() => setIsPaused(false)} className="w-full py-4 rounded-[24px] bg-[#0A84FF] font-black italic text-xl">
                          {t.common.resume}
                        </Button>
                        <Button 
                          variant="ghost" 
                          onClick={() => setShowExitConfirm(true)} 
                          className="w-full py-4 rounded-[24px] bg-white/5 border border-white/10 font-black text-xs uppercase tracking-widest"
                        >
                          {t.common.exitToMenu}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="text-3xl font-black mb-4 italic tracking-tighter text-[#FF453A]">{t.common.areYouSure}</h2>
                      <p className="text-white/60 text-sm mb-8 leading-relaxed">
                        {t.common.exitConfirmText}
                      </p>
                      <div className="space-y-4">
                        <Button onClick={handleExit} className="w-full py-4 rounded-[24px] bg-[#FF453A] font-black italic text-xl">
                          {t.common.yesExit}
                        </Button>
                        <Button 
                          variant="ghost" 
                          onClick={() => setShowExitConfirm(false)} 
                          className="w-full py-4 rounded-[24px] bg-white/5 border border-white/10 font-black text-xs uppercase tracking-widest"
                        >
                          {t.common.cancel}
                        </Button>
                      </div>
                    </>
                  )}
                </motion.div>
              </div>
            )}

            {/* Control Buttons */}
            {!isPaused && (
              <div className="absolute bottom-12 left-0 right-0 px-8 flex justify-between items-center z-50 pointer-events-none">
                <button
                  className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 pointer-events-auto active:scale-90 active:bg-white/20 transition-all"
                  onMouseDown={() => { gameRef.current.keys.left = true; }}
                  onMouseUp={() => { gameRef.current.keys.left = false; }}
                  onMouseLeave={() => { gameRef.current.keys.left = false; }}
                  onTouchStart={(e) => { e.preventDefault(); gameRef.current.keys.left = true; }}
                  onTouchEnd={(e) => { e.preventDefault(); gameRef.current.keys.left = false; }}
                >
                  <ArrowLeft size={32} className="text-white" />
                </button>
                <button
                  className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 pointer-events-auto active:scale-90 active:bg-white/20 transition-all"
                  onMouseDown={() => { gameRef.current.keys.right = true; }}
                  onMouseUp={() => { gameRef.current.keys.right = false; }}
                  onMouseLeave={() => { gameRef.current.keys.right = false; }}
                  onTouchStart={(e) => { e.preventDefault(); gameRef.current.keys.right = true; }}
                  onTouchEnd={(e) => { e.preventDefault(); gameRef.current.keys.right = false; }}
                >
                  <ArrowRight size={32} className="text-white" />
                </button>
              </div>
            )}

            <canvas 
              ref={canvasRef} 
              width={CANVAS_WIDTH} 
              height={CANVAS_HEIGHT} 
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}

        {gameState === 'GAMEOVER' && (
          <motion.div key="gameover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
            <GameOver />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
