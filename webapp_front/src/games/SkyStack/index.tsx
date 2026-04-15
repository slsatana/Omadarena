import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Pause, 
  Play, 
  RotateCcw, 
  Home, 
  Trophy, 
  ShoppingBag, 
  ChevronRight,
  X,
  AlertCircle,
  Zap,
  Ticket
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { Button } from '../../components/Shared';
import { audio, haptics } from '../../utils/audio';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const BLOCK_SIZE = 60;
const PENDULUM_LENGTH = 350;
const INITIAL_SPEED = 0.04;
const SPEED_INCREMENT = 0.002;
const GRAVITY = 0.6;
const PERFECT_THRESHOLD = 6;
const MIN_OVERLAP_PERCENT = 0.35;

interface Block {
  x: number;
  y: number;
  color: string;
}

type GameState = 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export const SkyStack: React.FC = () => {
  const { user, addPoints, useAttempt, setScreen, t, updateHighScore, gamesStats, selectedGameId } = useGame();
  const gameStat = gamesStats[selectedGameId];
  const dailyPoints = gameStat?.pointsEarnedToday || 0;
  const MAX_LIMIT = gameStat?.dailyPointsLimit || 5000;
  const attemptsLeft = gameStat?.attemptsLeft ?? 0;

  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [lastScore, setLastScore] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [perfectStreak, setPerfectStreak] = useState(0);
  const [showPerfect, setShowPerfect] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef({
    blocks: [] as Block[],
    currentBlock: { 
      x: 0, 
      y: 0, 
      angle: 0, 
      isFalling: false, 
      vy: 0,
      color: '#30D158'
    },
    cameraY: 0,
    targetCameraY: 0,
    speed: INITIAL_SPEED,
    particles: [] as any[],
    time: 0
  });

  const resetGame = useCallback(() => {
    const startY = CANVAS_HEIGHT - BLOCK_SIZE;
    gameRef.current = {
      blocks: [{ x: (CANVAS_WIDTH - BLOCK_SIZE) / 2, y: startY, color: '#0A84FF' }],
      currentBlock: { 
        x: 0, 
        y: 0, 
        angle: 0, 
        isFalling: false, 
        vy: 0,
        color: '#30D158'
      },
      cameraY: 0,
      targetCameraY: 0,
      speed: INITIAL_SPEED,
      particles: [],
      time: 0
    };
    setScore(0);
    scoreRef.current = 0;
    setPerfectStreak(0);
    setShowPerfect(false);
  }, []);

  const startGame = () => {
    if (attemptsLeft > 0) {
      if (useAttempt()) {
        resetGame();
        setGameState('PLAYING');
      }
    }
  };

  const handleAction = () => {
    if (gameState !== 'PLAYING') return;
    if (gameRef.current.currentBlock.isFalling) return;

    gameRef.current.currentBlock.isFalling = true;
    gameRef.current.currentBlock.vy = 0;
    audio.playShoot();
    haptics.light();
  };

  const checkCollision = () => {
    const g = gameRef.current;
    const current = g.currentBlock;
    const lastBlock = g.blocks[g.blocks.length - 1];

    // Check if it hit the top of the stack
    const targetY = lastBlock.y - BLOCK_SIZE;
    
    if (current.y >= targetY) {
      const diff = current.x - lastBlock.x;
      const absDiff = Math.abs(diff);

      // 35% area rule: if overlap < 35%, it falls
      if (absDiff < BLOCK_SIZE * (1 - MIN_OVERLAP_PERCENT)) {
        // Landed on block
        let isPerfect = false;
        if (absDiff < PERFECT_THRESHOLD) {
          isPerfect = true;
          current.x = lastBlock.x; // Snap for perfect
          setPerfectStreak(prev => prev + 1);
          setShowPerfect(true);
          setTimeout(() => setShowPerfect(false), 1000);
          audio.playCoin();
          haptics.success();
          
          // Perfect particles
          for(let i=0; i<12; i++) {
            g.particles.push({
              x: current.x + BLOCK_SIZE/2,
              y: current.y + BLOCK_SIZE,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              life: 1,
              color: '#FFD60A'
            });
          }
        } else {
          setPerfectStreak(0);
          audio.playHit();
          haptics.medium();
        }

        // Add to stack
        g.blocks.push({
          x: current.x,
          y: targetY,
          color: current.color
        });

        // Update score
        const points = Math.floor((g.blocks.length * 2) * (isPerfect ? 2 : 1));
        setScore(prev => {
          const newScore = prev + points;
          scoreRef.current = newScore;
          return newScore;
        });

        // Prepare next block
        g.speed += SPEED_INCREMENT;
        g.currentBlock = {
          x: 0,
          y: 0,
          angle: 0,
          isFalling: false,
          vy: 0,
          color: `hsl(${(g.blocks.length * 25) % 360}, 75%, 60%)`
        };

        // Camera follow: Keep only top 2 blocks visible at the bottom
        g.targetCameraY = targetY + 2.5 * BLOCK_SIZE - CANVAS_HEIGHT;
      }
    }

    // Check if it fell off screen
    if (current.y > CANVAS_HEIGHT + g.cameraY) {
      setGameState('GAMEOVER');
      audio.playGameOver();
      haptics.error();
      const finalScore = scoreRef.current;
      setLastScore(finalScore);
      updateHighScore(finalScore);
      addPoints(finalScore);
    }
  };

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    let animationFrameId: number;

    const update = () => {
      const g = gameRef.current;
      const current = g.currentBlock;

      if (!current.isFalling) {
        // Pendulum motion
        g.time += g.speed;
        current.angle = Math.sin(g.time) * (Math.PI / 4); // 45 degrees swing
        
        // Pivot point is higher up
        const pivotX = CANVAS_WIDTH / 2;
        const pivotY = g.cameraY - 100;
        
        current.x = pivotX + Math.sin(current.angle) * PENDULUM_LENGTH - BLOCK_SIZE / 2;
        current.y = pivotY + Math.cos(current.angle) * PENDULUM_LENGTH - BLOCK_SIZE / 2;
      } else {
        // Falling motion
        current.vy += GRAVITY;
        current.y += current.vy;
        checkCollision();
      }

      // Smooth camera
      g.cameraY += (g.targetCameraY - g.cameraY) * 0.1;

      // Update particles
      g.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
      });
      g.particles = g.particles.filter(p => p.life > 0);

      draw();
      animationFrameId = requestAnimationFrame(update);
    };

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const g = gameRef.current;

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.save();
      ctx.translate(0, -g.cameraY);

      // Draw string for current block
      if (!g.currentBlock.isFalling) {
        const pivotX = CANVAS_WIDTH / 2;
        const pivotY = g.cameraY - 100;
        
        // Aiming shadow
        const lastBlock = g.blocks[g.blocks.length - 1];
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(g.currentBlock.x, lastBlock.y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

        // Pivot point
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(pivotX, pivotY, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(pivotX, pivotY);
        ctx.lineTo(g.currentBlock.x + BLOCK_SIZE / 2, g.currentBlock.y + BLOCK_SIZE / 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw ground
      if (g.cameraY < 100) {
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, CANVAS_HEIGHT);
        ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.stroke();
      }

      // Draw stack
      g.blocks.forEach((b) => {
        ctx.fillStyle = b.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = b.color;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, BLOCK_SIZE, BLOCK_SIZE, 8);
        ctx.fill();
        
        // Shine/Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(b.x + 5, b.y + 5, BLOCK_SIZE - 10, 5);
      });

      // Draw current block
      ctx.fillStyle = g.currentBlock.color;
      ctx.shadowBlur = 15;
      ctx.shadowColor = g.currentBlock.color;
      ctx.beginPath();
      ctx.roundRect(g.currentBlock.x, g.currentBlock.y, BLOCK_SIZE, BLOCK_SIZE, 8);
      ctx.fill();

      // Draw particles
      g.particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState]);

  const handleExit = () => {
    setShowExitConfirm(true);
  };

  const confirmExit = () => {
    setScreen('EVENT_DETAILS');
    setShowExitConfirm(false);
  };

  return (
    <div className="relative w-full h-full bg-zinc-950 overflow-hidden flex flex-col">
      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 p-6 z-30 flex justify-between items-start safe-top">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-[var(--primary)]" />
            <span className="text-2xl font-black tracking-tighter">{score}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">
              {t.skyStack.today || 'Today'}: {dailyPoints} / {MAX_LIMIT}
            </p>
            <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[var(--primary)] transition-all duration-500" 
                style={{ width: `${(dailyPoints / MAX_LIMIT) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 bg-zinc-900/80 backdrop-blur px-3 py-1.5 rounded-full border border-white/10">
            <Ticket size={14} className="text-[var(--secondary)]" />
            <span className="text-xs font-black">{attemptsLeft}</span>
          </div>
          {gameState === 'PLAYING' && (
            <button 
              onClick={() => setGameState('PAUSED')}
              className="w-10 h-10 bg-zinc-900/80 backdrop-blur rounded-full flex items-center justify-center border border-white/10 active:scale-90 transition-transform"
            >
              <Pause size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Game Canvas */}
      <div 
        className="flex-1 relative cursor-pointer touch-none"
        onClick={handleAction}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-full object-contain"
        />

        {/* Perfect Indicator */}
        <AnimatePresence>
          {showPerfect && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 0 }}
              animate={{ scale: 1.2, opacity: 1, y: -50 }}
              exit={{ opacity: 0 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            >
              <h2 className="text-4xl font-black text-[#FFD60A] italic tracking-tighter drop-shadow-[0_0_10px_rgba(255,214,10,0.5)]">
                {t.skyStack.perfect || 'PERFECT!'}
              </h2>
              {perfectStreak > 1 && (
                <p className="text-center text-white font-black text-sm uppercase tracking-widest">
                  x{perfectStreak} Combo
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {gameState === 'START' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-zinc-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center"
          >
            {/* Exit Button */}
            <button 
              onClick={() => setScreen('EVENT_DETAILS')}
              className="absolute top-6 left-6 w-10 h-10 bg-zinc-900/80 backdrop-blur rounded-full flex items-center justify-center border border-white/10 active:scale-90 transition-transform z-50"
            >
              <X size={20} />
            </button>

            <div className="mb-12">
              <div className="w-24 h-24 bg-[var(--primary)]/20 rounded-3xl flex items-center justify-center mb-6 mx-auto border border-[var(--primary)]/30 shadow-[0_0_30px_rgba(10,132,255,0.2)]">
                <Zap size={48} className="text-[var(--primary)]" />
              </div>
              <h1 className="text-5xl font-black tracking-tighter mb-2">SKY STACK</h1>
              <p className="text-[var(--text-muted)] font-medium">{t.skyStack.desc}</p>
            </div>

            <div className="w-full space-y-4 max-w-xs">
              <Button 
                onClick={startGame}
                disabled={attemptsLeft <= 0}
                className="w-full py-6 text-xl rounded-[24px]"
              >
                {attemptsLeft > 0 ? t.skyStack.playNow : t.skyStack.noAttemptsLeft}
              </Button>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setScreen('LEADERBOARD')}
                  className="p-4 bg-zinc-900 rounded-[24px] border border-white/5 flex flex-col items-center gap-2 active:scale-95 transition-transform"
                >
                  <Trophy size={20} className="text-[var(--secondary)]" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t.skyStack.leaderboard}</span>
                </button>
                <button 
                  onClick={() => setScreen('SHOP')}
                  className="p-4 bg-zinc-900 rounded-[24px] border border-white/5 flex flex-col items-center gap-2 active:scale-95 transition-transform"
                >
                  <ShoppingBag size={20} className="text-[var(--primary)]" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t.skyStack.shop}</span>
                </button>
              </div>
            </div>

            {attemptsLeft <= 0 && (
              <p className="mt-8 text-[var(--danger)] font-bold text-sm">
                {t.skyStack.noAttempts}
              </p>
            )}
            {dailyPoints >= MAX_LIMIT && (
              <p className="mt-4 text-[var(--secondary)] font-bold text-sm">
                {t.skyStack.limitReached}
              </p>
            )}
          </motion.div>
        )}

        {gameState === 'PAUSED' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex flex-col items-center justify-center p-8"
          >
            <h2 className="text-4xl font-black mb-12 tracking-tighter">{t.skyStack.paused}</h2>
            <div className="w-full max-w-xs space-y-4">
              <Button 
                onClick={() => setGameState('PLAYING')}
                className="w-full py-5 text-lg rounded-[24px] flex items-center justify-center gap-3"
              >
                <Play size={20} /> {t.skyStack.continue}
              </Button>
              <button 
                onClick={handleExit}
                className="w-full py-5 bg-zinc-900 text-white font-bold rounded-[24px] border border-white/10 flex items-center justify-center gap-3 active:scale-95 transition-transform"
              >
                <Home size={20} /> {t.skyStack.exit}
              </button>
            </div>
          </motion.div>
        )}

        {showExitConfirm && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-[60] bg-zinc-950/90 flex flex-col items-center justify-center p-8 text-center"
          >
            <AlertCircle size={64} className="text-[var(--danger)] mb-6" />
            <h3 className="text-2xl font-black mb-2">{t.skyStack.areYouSure}</h3>
            <p className="text-[var(--text-muted)] mb-12">{t.skyStack.exitWarning}</p>
            <div className="w-full max-w-xs space-y-3">
              <button 
                onClick={confirmExit}
                className="w-full py-4 bg-[var(--danger)] text-white font-black rounded-[20px] active:scale-95 transition-transform"
              >
                {t.skyStack.exitAndLose}
              </button>
              <button 
                onClick={() => setShowExitConfirm(false)}
                className="w-full py-4 bg-zinc-900 text-white font-bold rounded-[20px] border border-white/10 active:scale-95 transition-transform"
              >
                {t.skyStack.cancel}
              </button>
            </div>
          </motion.div>
        )}

        {gameState === 'GAMEOVER' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-zinc-950/95 backdrop-blur-lg flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="mb-12">
              <h2 className="text-5xl font-black tracking-tighter mb-8">{t.skyStack.gameOver || 'GAME OVER'}</h2>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[0.3em] mb-1">{t.common.score || 'Score'}</p>
                  <p className="text-6xl font-black text-[var(--primary)] tracking-tighter">{lastScore}</p>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-[24px] border border-white/5">
                  <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mb-2">{t.skyStack.today || "Today's Progress"}</p>
                  <p className="text-xl font-black">{dailyPoints} / {MAX_LIMIT}</p>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="h-full bg-[var(--primary)]" 
                      style={{ width: `${(dailyPoints / MAX_LIMIT) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full max-w-xs space-y-3">
              <Button 
                onClick={startGame}
                disabled={attemptsLeft <= 0}
                className="w-full py-5 text-lg rounded-[24px] flex items-center justify-center gap-3"
              >
                <RotateCcw size={20} /> {t.skyStack.playNow || 'PLAY AGAIN'}
              </Button>
              <div className="grid grid-cols-4 gap-3">
                <button 
                  onClick={() => setScreen('EVENT_DETAILS')}
                  className="p-4 bg-zinc-900 rounded-[20px] border border-white/5 flex items-center justify-center active:scale-95 transition-transform text-[var(--danger)]"
                  title="Exit to Main Menu"
                >
                  <X size={20} />
                </button>
                <button 
                  onClick={() => setGameState('START')}
                  className="p-4 bg-zinc-900 rounded-[20px] border border-white/5 flex items-center justify-center active:scale-95 transition-transform"
                >
                  <Home size={20} />
                </button>
                <button 
                  onClick={() => setScreen('LEADERBOARD')}
                  className="p-4 bg-zinc-900 rounded-[20px] border border-white/5 flex items-center justify-center active:scale-95 transition-transform"
                >
                  <Trophy size={20} />
                </button>
                <button 
                  onClick={() => setScreen('SHOP')}
                  className="p-4 bg-zinc-900 rounded-[20px] border border-white/5 flex items-center justify-center active:scale-95 transition-transform"
                >
                  <ShoppingBag size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
