import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../../context/GameContext';
import { audio, haptics } from '../../utils/audio';
import { 
  Trophy, 
  Gift, 
  Users, 
  Play, 
  Info, 
  ArrowLeft, 
  Share2, 
  Zap, 
  Star,
  Medal,
  Clock,
  Settings,
  Volume2,
  Pause,
  X,
  RotateCcw
} from 'lucide-react';
import { ShopContent } from '../../components/ShopContent';
import { Button, BackButton } from '../../components/Shared';

// --- Constants ---
const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 640;
const PLAYER_SIZE = 44;
const OBSTACLE_SIZE = 50;
const BONUS_SIZE = 30;
const LANES = [CANVAS_WIDTH / 4, (CANVAS_WIDTH / 4) * 3];
const LANE_WIDTH = CANVAS_WIDTH / 2;

type GameState = 'MAIN' | 'RULES' | 'PLAYING' | 'GAMEOVER' | 'RATING' | 'PRIZES' | 'INVITE';

export const ArenaRunner = () => {
  const { user, updateHighScore, addPoints, useAttempt, t, setScreen, gamesStats, selectedGameId } = useGame();
  
  const gameStat = gamesStats[selectedGameId];
  const dailyPoints = gameStat?.pointsEarnedToday || 0;
  const MAX_LIMIT = gameStat?.dailyPointsLimit || 5000;
  const attemptsLeft = gameStat?.attemptsLeft ?? 0;
  const [gameState, setGameState] = useState<GameState | 'READY'>('MAIN');
  const [score, setScore] = useState(0);
  const [lastScore, setLastScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef({
    playerLane: 0, // 0 or 1
    playerX: LANES[0],
    obstacles: [] as any[],
    bonuses: [] as any[],
    particles: [] as any[],
    speed: 8,
    distance: 0,
    lastTime: 0,
    spawnTimer: 0,
    bonusTimer: 0,
    isGameOver: false,
    score: 0,
    gridOffset: 0,
    difficultyTimer: 0
  });

  const requestRef = useRef<number>();

  const resetGame = () => {
    gameRef.current = {
      playerLane: 0,
      playerX: LANES[0],
      obstacles: [],
      bonuses: [],
      particles: [],
      speed: 6,
      distance: 0,
      lastTime: 0,
      spawnTimer: 0,
      bonusTimer: 0,
      isGameOver: false,
      score: 0,
      gridOffset: 0,
      difficultyTimer: 0
    };
    setScore(0);
    setIsPaused(false);
  };

  const spawnObstacle = () => {
    const lane = Math.random() > 0.5 ? 0 : 1;
    // Check if a bonus is already in this lane near the top
    const tooClose = gameRef.current.bonuses.some(b => b.lane === lane && b.y < 100);
    if (tooClose) return;

    gameRef.current.obstacles.push({
      x: LANES[lane],
      y: -OBSTACLE_SIZE,
      lane,
      type: Math.random() > 0.8 ? 'large' : 'normal'
    });
  };

  const spawnBonus = () => {
    const lane = Math.random() > 0.5 ? 0 : 1;
    // Check if an obstacle is already in this lane near the top
    const tooClose = gameRef.current.obstacles.some(o => o.lane === lane && o.y < 100);
    if (tooClose) return;

    gameRef.current.bonuses.push({
      x: LANES[lane],
      y: -BONUS_SIZE,
      lane
    });
  };

  const createParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < 8; i++) {
      gameRef.current.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1.0,
        color
      });
    }
  };

  const update = useCallback((time: number) => {
    if (gameRef.current.isGameOver || isPaused) {
      gameRef.current.lastTime = time; // Keep lastTime updated to avoid dt spike on resume
      return;
    }

    const dt = gameRef.current.lastTime ? (time - gameRef.current.lastTime) / 1000 : 0;
    gameRef.current.lastTime = time;

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    // --- Logic ---
    const limitedDt = Math.min(dt, 0.1);
    
    // Difficulty increase: 1% faster every 10 seconds
    gameRef.current.difficultyTimer += limitedDt;
    if (gameRef.current.difficultyTimer >= 10) {
      gameRef.current.speed *= 1.01;
      gameRef.current.difficultyTimer = 0;
    }

    gameRef.current.speed += 0.3 * limitedDt; // Increased from 0.15
    gameRef.current.distance += gameRef.current.speed * limitedDt * 10;
    gameRef.current.gridOffset = (gameRef.current.gridOffset + gameRef.current.speed) % 40;

    const targetX = LANES[gameRef.current.playerLane];
    gameRef.current.playerX += (targetX - gameRef.current.playerX) * 0.2;

    gameRef.current.spawnTimer += limitedDt;
    // More frequent obstacles
    if (gameRef.current.spawnTimer > 1.0 / (gameRef.current.speed / 6)) {
      spawnObstacle();
      gameRef.current.spawnTimer = 0;
    }

    gameRef.current.bonusTimer += limitedDt;
    // Less frequent bonuses
    if (gameRef.current.bonusTimer > 6) {
      spawnBonus();
      gameRef.current.bonusTimer = 0;
    }

    for (let i = gameRef.current.obstacles.length - 1; i >= 0; i--) {
      const obs = gameRef.current.obstacles[i];
      obs.y += gameRef.current.speed;
      
      const dx = Math.abs(gameRef.current.playerX - obs.x);
      const dy = Math.abs((CANVAS_HEIGHT - 120) - obs.y);
      if (dx < 35 && dy < 35) {
        gameRef.current.isGameOver = true;
        audio.playGameOver();
        haptics.error();
        const finalScore = Math.floor(gameRef.current.score);
        setLastScore(finalScore);
        updateHighScore(finalScore);
        
        // Award points with daily limit handled by GameContext
        if (finalScore > 0) {
          addPoints(finalScore);
        }
        
        setGameState('GAMEOVER');
        return;
      }

      if (obs.y > CANVAS_HEIGHT + 100) gameRef.current.obstacles.splice(i, 1);
    }

    for (let i = gameRef.current.bonuses.length - 1; i >= 0; i--) {
      const bonus = gameRef.current.bonuses[i];
      bonus.y += gameRef.current.speed;
      
      const dx = Math.abs(gameRef.current.playerX - bonus.x);
      const dy = Math.abs((CANVAS_HEIGHT - 120) - bonus.y);
      if (dx < 40 && dy < 40) {
        gameRef.current.score += 5; // Balanced coin points
        audio.playCoin();
        haptics.light();
        createParticles(bonus.x, bonus.y, '#FFD60A');
        gameRef.current.bonuses.splice(i, 1);
      }

      if (bonus.y > CANVAS_HEIGHT + 100) gameRef.current.bonuses.splice(i, 1);
    }

    for (let i = gameRef.current.particles.length - 1; i >= 0; i--) {
      const p = gameRef.current.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.05;
      if (p.life <= 0) gameRef.current.particles.splice(i, 1);
    }

    // Balanced multiplier for ~1000 pts per 10min run
    gameRef.current.score += gameRef.current.speed * limitedDt * 0.1;
    setScore(Math.floor(gameRef.current.score));

    // --- Rendering ---
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = 'rgba(10, 132, 255, 0.3)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= CANVAS_WIDTH; x += LANE_WIDTH) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = gameRef.current.gridOffset; y <= CANVAS_HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(1, 'rgba(10, 132, 255, 0.1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Obstacles: Spiky Diamond
    ctx.shadowBlur = 15;
    gameRef.current.obstacles.forEach(obs => {
      ctx.fillStyle = '#FF453A';
      ctx.shadowColor = '#FF453A';
      ctx.beginPath();
      ctx.moveTo(obs.x, obs.y - OBSTACLE_SIZE/2);
      ctx.lineTo(obs.x + OBSTACLE_SIZE/2, obs.y);
      ctx.lineTo(obs.x, obs.y + OBSTACLE_SIZE/2);
      ctx.lineTo(obs.x - OBSTACLE_SIZE/2, obs.y);
      ctx.closePath();
      ctx.fill();
      
      // Inner detail
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.moveTo(obs.x, obs.y - OBSTACLE_SIZE/4);
      ctx.lineTo(obs.x + OBSTACLE_SIZE/4, obs.y);
      ctx.lineTo(obs.x, obs.y + OBSTACLE_SIZE/4);
      ctx.lineTo(obs.x - OBSTACLE_SIZE/4, obs.y);
      ctx.closePath();
      ctx.fill();
    });

    // Bonuses: Glowing Hexagon
    gameRef.current.bonuses.forEach(bonus => {
      ctx.fillStyle = '#FFD60A';
      ctx.shadowColor = '#FFD60A';
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const x = bonus.x + (BONUS_SIZE / 2) * Math.cos(angle);
        const y = bonus.y + (BONUS_SIZE / 2) * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      
      // Pulse effect
      ctx.strokeStyle = 'rgba(255, 214, 10, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bonus.x, bonus.y, (BONUS_SIZE / 2) + Math.sin(Date.now() / 200) * 5, 0, Math.PI * 2);
      ctx.stroke();
    });

    gameRef.current.particles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 4, 4);
    });
    ctx.globalAlpha = 1.0;

    // Player: Sleek Ship/Arrow
    ctx.fillStyle = '#0A84FF';
    ctx.shadowColor = '#0A84FF';
    ctx.shadowBlur = 25;
    ctx.beginPath();
    const px = gameRef.current.playerX;
    const py = CANVAS_HEIGHT - 120;
    ctx.moveTo(px, py - PLAYER_SIZE/2); // Tip
    ctx.lineTo(px + PLAYER_SIZE/2, py + PLAYER_SIZE/2); // Bottom right
    ctx.lineTo(px, py + PLAYER_SIZE/4); // Bottom indent
    ctx.lineTo(px - PLAYER_SIZE/2, py + PLAYER_SIZE/2); // Bottom left
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [updateHighScore, isPaused]);

  const updateRef = useRef(update);
  updateRef.current = update;

  useEffect(() => {
    if (gameState === 'PLAYING') {
      gameRef.current.lastTime = 0;
      const loop = (time: number) => {
        if (gameState !== 'PLAYING') return;
        updateRef.current(time);
        requestRef.current = requestAnimationFrame(loop);
      };
      requestRef.current = requestAnimationFrame(loop);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState]);

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

  const handleTap = () => {
    if (gameState === 'PLAYING') {
      gameRef.current.playerLane = gameRef.current.playerLane === 0 ? 1 : 0;
      audio.playShoot();
      haptics.light();
    }
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
            <li className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#0A84FF]" />
              Tap to switch lanes
            </li>
            <li className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#0A84FF]" />
              Avoid obstacles and collect bonuses
            </li>
            <li className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#0A84FF]" />
              Each attempt costs 1 point
            </li>
          </ul>
        </div>

        <Button 
          onClick={handleActualStart} 
          disabled={attemptsLeft <= 0}
          className="w-full py-6 rounded-[32px] bg-[#0A84FF] text-white font-black italic text-2xl shadow-[0_15px_40px_rgba(10,132,255,0.4)] flex items-center justify-center gap-4 active:scale-95 active:translate-y-1 transition-all uppercase tracking-tighter border-b-4 border-[#0056b3]"
        >
          <Play className="fill-white" size={24} /> {attemptsLeft > 0 ? t.arenaGame.start : t.arenaGame.noAttempts}
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
          animate={{ 
            scale: [1, 1.05, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ duration: 6, repeat: Infinity }}
          className="relative w-48 h-48 mb-8"
        >
          <div className="absolute inset-0 bg-[#0A84FF]/30 blur-[80px] rounded-full animate-pulse" />
          <div className="relative w-full h-full bg-gradient-to-br from-[#0A84FF] to-[#0040FF] rounded-[52px] flex items-center justify-center shadow-[0_0_60px_rgba(10,132,255,0.5)] border-4 border-white/10">
            <Zap size={100} className="text-white fill-current drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
          </div>
        </motion.div>

        <div className="mb-6 flex flex-col items-center">
          <h1 className="text-6xl font-black tracking-tighter italic leading-[0.8]">{t.gameDetails.ARENA_RUNNER.title}</h1>
        </div>
        
        
        
        <Button 
          onClick={handleStart} 
          className="w-full py-8 rounded-[40px] bg-[#0A84FF] text-white font-black italic text-4xl shadow-[0_20px_50px_rgba(10,132,255,0.4)] flex items-center justify-center gap-4 active:scale-95 active:translate-y-1 transition-all uppercase tracking-tighter border-b-8 border-[#0056b3]"
        >
          <Play className="fill-white" size={40} /> {t.arenaGame.play}
        </Button>
        
        <Button variant="ghost" onClick={() => setGameState('RULES')} className="w-full py-4 text-sm font-black text-white/30 uppercase tracking-widest mt-2">
          <Info className="mr-2" size={16} /> {t.arenaGame.rules}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-12">
        {[
          { id: 'RATING', icon: <Trophy />, label: t.arenaGame.rating, color: '#FFD60A' },
          { id: 'PRIZES', icon: <Gift />, label: t.arenaGame.prizes, color: '#32D74B' },
          { id: 'INVITE', icon: <Users />, label: t.arenaGame.invite, color: '#0A84FF' }
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => setGameState(item.id as any)} 
            className="flex flex-col items-center gap-2 p-5 bg-white/5 rounded-[32px] active:scale-95 transition-transform border border-white/5"
          >
            <div style={{ color: item.color }}>{item.icon}</div>
            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">{item.label}</span>
          </button>
        ))}
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

        <div className="bg-white/5 rounded-[40px] p-8 border border-white/10 mb-12 space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-white/40 font-bold uppercase text-xs tracking-widest">{t.arenaGame.best}</span>
            <span className="text-2xl font-black">{user.highScore}</span>
          </div>
          <div className="h-px bg-white/5" />
          <div className="flex justify-between items-center">
            <span className="text-white/40 font-bold uppercase text-xs tracking-widest">{t.common.dailyLimit || 'Daily Limit'}</span>
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
          <div className="grid grid-cols-2 gap-4">
            <Button variant="ghost" onClick={() => setGameState('RATING')} className="py-5 font-black bg-white/5 rounded-[24px] text-xs uppercase tracking-widest border border-white/5">
              {t.arenaGame.rating}
            </Button>
            <Button variant="ghost" onClick={() => setGameState('INVITE')} className="py-5 font-black bg-white/5 rounded-[24px] text-xs uppercase tracking-widest border border-white/5">
              {t.arenaGame.invite}
            </Button>
          </div>
          <button onClick={() => setGameState('MAIN')} className="w-full py-4 text-white/30 font-black uppercase tracking-widest text-xs">
            {t.common.backToMenu || 'Back to Menu'}
          </button>
        </div>
      </motion.div>
    </div>
  );

  const Rules = () => (
    <div className="flex flex-col h-full bg-[#050505] text-white p-8 overflow-y-auto">
      <BackButton onClick={() => setGameState('MAIN')} className="mb-8 self-start" />
      <h2 className="text-4xl font-black mb-8 tracking-tighter italic">{t.arenaGame.rules}</h2>
      <div className="space-y-6">
        <div className="bg-white/5 p-6 rounded-[32px] border border-white/10">
          <p className="text-lg font-medium text-white/70 leading-relaxed">
            {t.arenaGame.rulesText}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 p-6 rounded-[32px] border border-white/10 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-[#FF453A]/20 rounded-full flex items-center justify-center mb-3">
              <Zap size={24} className="text-[#FF453A]" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Avoid</span>
            <span className="text-sm font-bold">Obstacles</span>
          </div>
          <div className="bg-white/5 p-6 rounded-[32px] border border-white/10 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-[#FFD60A]/20 rounded-full flex items-center justify-center mb-3">
              <Star size={24} className="text-[#FFD60A]" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Collect</span>
            <span className="text-sm font-bold">Bonuses</span>
          </div>
        </div>
      </div>
      <div className="mt-auto pt-8">
        <Button onClick={() => setGameState('MAIN')} className="w-full py-5 rounded-[24px] bg-white/10 hover:bg-white/20">
          {t.common.back || 'Back'}
        </Button>
      </div>
    </div>
  );

  const Rating = () => (
    <div className="flex flex-col h-full bg-[#050505] text-white p-8 overflow-y-auto">
      <BackButton onClick={() => setGameState('MAIN')} className="mb-8 self-start" />
      <h2 className="text-4xl font-black mb-8 tracking-tighter italic">{t.arenaGame.rating}</h2>
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((rank) => (
          <div key={rank} className="flex items-center justify-between p-5 bg-white/5 rounded-[28px] border border-white/5">
            <div className="flex items-center gap-4">
              <span className={`text-lg font-black ${rank === 1 ? 'text-[#FFD60A]' : rank === 2 ? 'text-[#C0C0C0]' : rank === 3 ? 'text-[#CD7F32]' : 'text-white/20'}`}>#{rank}</span>
              <div className="w-10 h-10 rounded-full bg-white/10" />
              <span className="font-bold">Player {rank}</span>
            </div>
            <span className="font-black text-[#0A84FF]">{10000 - rank * 1000}</span>
          </div>
        ))}
      </div>
    </div>
  );


  const Invite = () => (
    <div className="flex flex-col h-full bg-[#050505] text-white p-8 overflow-y-auto">
      <BackButton onClick={() => setGameState('MAIN')} className="mb-8 self-start" />
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-32 h-32 bg-[#0A84FF]/20 rounded-full flex items-center justify-center mb-8 relative">
          <div className="absolute inset-0 bg-[#0A84FF]/20 blur-3xl rounded-full" />
          <Users size={64} className="text-[#0A84FF] relative z-10" />
        </div>
        <h2 className="text-4xl font-black mb-4 tracking-tighter italic">{t.arenaGame.inviteTitle}</h2>
        <p className="text-white/50 font-medium mb-12 leading-relaxed">
          {t.arenaGame.inviteDesc}
        </p>
        <Button className="w-full py-5 rounded-[24px] bg-[#0A84FF]">
          {t.arenaGame.copyLink}
        </Button>
      </div>
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
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full" onClick={handleTap}>
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
                <div className="flex flex-col pointer-events-none">
                  <span className="text-5xl font-black text-white italic tracking-tighter">{score}</span>
                </div>
              </div>
              <div className="bg-black/60 backdrop-blur-xl px-5 py-2.5 rounded-full border border-white/10 flex items-center gap-3 pointer-events-none">
                <Clock size={18} className="text-[#0A84FF]" />
                <span className="font-mono font-black text-sm tracking-widest">{Math.floor(gameRef.current.distance)}m</span>
              </div>
            </div>

            {isPaused && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-8">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-[#111] p-10 rounded-[40px] border border-white/10 text-center w-full max-w-xs"
                >
                  {!showExitConfirm ? (
                    <>
                      <h2 className="text-4xl font-black mb-8 italic tracking-tighter">{t.common.paused || 'PAUSED'}</h2>
                      <div className="space-y-4">
                        <Button onClick={() => setIsPaused(false)} className="w-full py-4 rounded-[24px] bg-[#0A84FF] font-black italic text-xl">
                          {t.common.resume || 'RESUME'}
                        </Button>
                        <Button 
                          variant="ghost" 
                          onClick={() => setShowExitConfirm(true)} 
                          className="w-full py-4 rounded-[24px] bg-white/5 border border-white/10 font-black text-xs uppercase tracking-widest"
                        >
                          {t.common.exitToMenu || 'Exit to Menu'}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="text-3xl font-black mb-4 italic tracking-tighter text-[#FF453A]">{t.common.areYouSure || 'ARE YOU SURE?'}</h2>
                      <p className="text-white/60 text-sm mb-8 leading-relaxed">
                        {t.common.exitConfirmText || 'Exiting now will end your current game and your attempt will be lost.'}
                      </p>
                      <div className="space-y-4">
                        <Button onClick={handleExit} className="w-full py-4 rounded-[24px] bg-[#FF453A] font-black italic text-xl">
                          {t.common.yesExit || 'YES, EXIT'}
                        </Button>
                        <Button 
                          variant="ghost" 
                          onClick={() => setShowExitConfirm(false)} 
                          className="w-full py-4 rounded-[24px] bg-white/5 border border-white/10 font-black text-xs uppercase tracking-widest"
                        >
                          {t.common.cancel || 'CANCEL'}
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

        {gameState === 'RULES' && (
          <motion.div key="rules" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full">
            <Rules />
          </motion.div>
        )}

        {gameState === 'RATING' && (
          <motion.div key="rating" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full">
            <Rating />
          </motion.div>
        )}

        {gameState === 'PRIZES' && (
          <motion.div key="prizes" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full">
            <ShopContent embedded onBack={() => setGameState('MAIN')} />
          </motion.div>
        )}

        {gameState === 'INVITE' && (
          <motion.div key="invite" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full">
            <Invite />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

