import React, { useState, useEffect, useRef } from 'react';
import { 
  Pause, 
  Play, 
  ArrowLeft, 
  Shield, 
  Zap, 
  Trophy, 
  Gift, 
  Users, 
  Info, 
  RotateCcw,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../../context/GameContext';
import { Button, BackButton } from '../../components/Shared';
import { audio, haptics } from '../../utils/audio';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 700;
const CORE_RADIUS = 40;
const SHIELD_RADIUS = 70;
const SHIELD_WIDTH = 1.2; // Radians
const INITIAL_PROJECTILE_SPEED = 3;
const MAX_DAILY_POINTS = 5000;

const SWEETS = ['🍰', '🧁', '🍩', '🍪', '🍬', '🍭', '🍫', '🍦', '🥧'];

interface Projectile {
  x: number;
  y: number;
  angle: number;
  speed: number;
  type: 'enemy' | 'bonus';
  active: boolean;
  sweet: string;
}

export const CyberShield: React.FC = () => {
  const { user, updateHighScore, addPoints, useAttempt, t, setScreen, gamesStats, selectedGameId } = useGame();
  const gameStat = gamesStats[selectedGameId];
  const dailyPoints = gameStat?.pointsEarnedToday || 0;
  const MAX_LIMIT = gameStat?.dailyPointsLimit || MAX_DAILY_POINTS;
  const attemptsLeft = gameStat?.attemptsLeft ?? 0;

  const [gameState, setGameState] = useState<'MAIN' | 'READY' | 'PLAYING' | 'GAMEOVER' | 'RULES' | 'RATING' | 'PRIZES' | 'INVITE'>('MAIN');
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(3);
  const [lastScore, setLastScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);
  const gameRef = useRef({
    shieldAngle: 0,
    projectiles: [] as Projectile[],
    score: 0,
    health: 3,
    speed: INITIAL_PROJECTILE_SPEED,
    lastSpawn: 0,
    startTime: 0,
    lastSpeedUpdate: 0,
    touching: false,
    touchX: 0
  });

  const resetGame = () => {
    gameRef.current = {
      shieldAngle: 0,
      projectiles: [],
      score: 0,
      health: 3,
      speed: INITIAL_PROJECTILE_SPEED,
      lastSpawn: Date.now(),
      startTime: Date.now(),
      lastSpeedUpdate: Date.now(),
      touching: false,
      touchX: 0
    };
    setScore(0);
    setHealth(3);
    setLastScore(0);
    setIsPaused(false);
  };

  const spawnProjectile = () => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 400;
    const x = CANVAS_WIDTH / 2 + Math.cos(angle) * distance;
    const y = CANVAS_HEIGHT / 2 + Math.sin(angle) * distance;
    
    gameRef.current.projectiles.push({
      x,
      y,
      angle: angle + Math.PI, // Point towards center
      speed: gameRef.current.speed,
      type: Math.random() > 0.8 ? 'bonus' : 'enemy',
      active: true,
      sweet: SWEETS[Math.floor(Math.random() * SWEETS.length)]
    });
  };

  const update = () => {
    if (isPaused) {
      gameRef.current.lastSpawn = Date.now();
      gameRef.current.lastSpeedUpdate = Date.now();
      return;
    }
    const g = gameRef.current;
    const now = Date.now();

    // Difficulty scaling
    if (now - g.lastSpeedUpdate > 20000) {
      g.speed *= 1.01;
      g.lastSpeedUpdate = now;
    }

    // Spawn logic
    const spawnRate = Math.max(500, 1500 - (g.score / 10));
    if (now - g.lastSpawn > spawnRate) {
      spawnProjectile();
      g.lastSpawn = now;
    }

    // Projectile movement
    g.projectiles.forEach(p => {
      if (!p.active) return;
      
      p.x += Math.cos(p.angle) * p.speed;
      p.y += Math.sin(p.angle) * p.speed;

      const dx = p.x - CANVAS_WIDTH / 2;
      const dy = p.y - CANVAS_HEIGHT / 2;
      const dist = Math.sqrt(dx*dx + dy*dy);

      // Shield collision
      if (dist < SHIELD_RADIUS + 15 && dist > SHIELD_RADIUS - 15) {
        let pAngle = Math.atan2(dy, dx);
        if (pAngle < 0) pAngle += Math.PI * 2;
        
        let sAngle = g.shieldAngle % (Math.PI * 2);
        if (sAngle < 0) sAngle += Math.PI * 2;

        const diff = Math.abs(pAngle - sAngle);
        const wrappedDiff = Math.min(diff, Math.PI * 2 - diff);

        if (wrappedDiff < SHIELD_WIDTH / 2 + 0.1) {
          p.active = false;
          if (p.type === 'bonus') {
            g.score += 5;
            audio.playCoin();
            haptics.success();
          } else {
            g.score += 1;
            audio.playHit();
            haptics.light();
          }
          setScore(Math.floor(g.score));
        }
      }

      // Core collision
      if (dist < CORE_RADIUS) {
        p.active = false;
        if (p.type === 'enemy') {
          g.health--;
          setHealth(g.health);
          audio.playHit();
          haptics.heavy();
          // Add a small camera shake or core pulse effect here if desired
          if (g.health <= 0) {
            audio.playGameOver();
            haptics.error();
            const finalScore = g.score;
            setLastScore(finalScore);
            updateHighScore(finalScore);
            
            if (finalScore > 0) {
              addPoints(finalScore);
            }
            
            setGameState('GAMEOVER');
          }
        }
      }
    });

    g.projectiles = g.projectiles.filter(p => p.active);
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const g = gameRef.current;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const cx = CANVAS_WIDTH / 2;
    const cy = CANVAS_HEIGHT / 2;

    // Draw Face (Core)
    ctx.save();
    ctx.translate(cx, cy);
    
    // Head
    ctx.beginPath();
    ctx.arc(0, 0, CORE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#FFDBAC'; // Skin tone
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#333';
    // Left eye
    ctx.beginPath();
    ctx.arc(-12, -8, 4, 0, Math.PI * 2);
    ctx.fill();
    // Right eye
    ctx.beginPath();
    ctx.arc(12, -8, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Blush if healthy
    if (g.health > 1) {
      ctx.fillStyle = 'rgba(255, 100, 100, 0.3)';
      ctx.beginPath();
      ctx.arc(-18, 5, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(18, 5, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Draw Mouth (Shield)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(g.shieldAngle);
    
    ctx.beginPath();
    ctx.arc(0, 0, SHIELD_RADIUS, -SHIELD_WIDTH/2, SHIELD_WIDTH/2);
    ctx.strokeStyle = '#FF4D4D'; // Red lips
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#FF4D4D';
    ctx.stroke();
    
    // Teeth/Inside mouth
    ctx.beginPath();
    ctx.arc(0, 0, SHIELD_RADIUS - 4, -SHIELD_WIDTH/2 + 0.1, SHIELD_WIDTH/2 - 0.1);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.restore();

    // Draw Projectiles (Sweets)
    g.projectiles.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      
      // Glow based on type
      ctx.shadowBlur = 20;
      ctx.shadowColor = p.type === 'enemy' ? '#FF453A' : '#FFD60A';
      
      // Draw emoji
      ctx.font = '32px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.sweet, 0, 0);
      
      ctx.restore();
    });
  };

  useEffect(() => {
    let animationFrameId: number;
    
    const startLoop = () => {
      if (gameState === 'PLAYING') {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        
        if (!ctx) {
          // If canvas is not ready, try again in the next frame
          animationFrameId = requestAnimationFrame(startLoop);
          return;
        }

        const loop = () => {
          update();
          draw(ctx);
          animationFrameId = requestAnimationFrame(loop);
        };
        animationFrameId = requestAnimationFrame(loop);
      }
    };

    startLoop();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [gameState, isPaused]);

  const handleStart = () => {
    setGameState('READY');
  };

  const handleActualStart = () => {
    if (useAttempt()) {
      resetGame();
      setGameState('PLAYING');
    } else {
      alert(t.arenaGame.noAttempts);
    }
  };

  const handleExit = () => {
    setIsPaused(false);
    setShowExitConfirm(false);
    setGameState('MAIN');
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameState !== 'PLAYING' || isPaused) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = (clientX - rect.left) - rect.width / 2;
    const y = (clientY - rect.top) - rect.height / 2;
    
    gameRef.current.shieldAngle = Math.atan2(y, x);
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
            {t.arenaGame.cyberShieldRules.map((rule: string, index: number) => (
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
          <span className="text-4xl font-black text-[#FF4D4D]">{user.highScore}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">{t.common.dailyPoints}</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-[#FFD60A]">{dailyPoints}/{MAX_LIMIT}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
        <motion.div 
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="relative w-48 h-48 mb-8"
        >
          <div className="absolute inset-0 bg-[#0A84FF]/30 blur-[80px] rounded-full animate-pulse" />
          <div className="relative w-full h-full bg-gradient-to-br from-[#0A84FF] to-[#0040FF] rounded-[52px] flex items-center justify-center shadow-[0_0_60px_rgba(10,132,255,0.5)] border-4 border-white/10">
            <Shield size={100} className="text-white fill-current drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
          </div>
        </motion.div>

        <div className="mb-6 flex flex-col items-center w-full">
          <h1 className="text-5xl font-black tracking-tighter italic text-center w-full text-white break-words px-2">{t.gameDetails.CYBER_SHIELD.title}</h1>
        </div>
        
        
        
        <div className="flex flex-col items-center w-full relative">
          <Button 
            onClick={handleStart} 
            className="w-full py-8 rounded-[40px] bg-[#0A84FF] text-white font-black italic text-4xl shadow-[0_20px_50px_rgba(10,132,255,0.4)] flex items-center justify-center gap-4 active:scale-95 active:translate-y-1 transition-all uppercase tracking-tighter border-b-8 border-[#0056b3]"
          >
            <Play className="fill-white" size={40} /> {t.arenaGame.play}
          </Button>
          <div className="mt-4 text-center">
            <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">{t.common.attemptsLeft}: </span>
            <span className="text-white font-black">{attemptsLeft}</span>
          </div>
        </div>
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
            className="h-full"
            onMouseMove={handleMouseMove}
            onTouchMove={handleMouseMove}
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
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{t.common.health}</span>
                  <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className={`w-3 h-1.5 rounded-full ${i < health ? 'bg-[#FF453A]' : 'bg-white/10'}`} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{t.common.score}</span>
                <span className="text-2xl font-black tabular-nums">{score}</span>
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
