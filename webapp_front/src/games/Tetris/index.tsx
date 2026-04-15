import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, AlertCircle, Trophy, Flame, Zap, Shield, Clock, Grid, ArrowLeft, ArrowRight, ArrowDown, ChevronDown, RotateCw, Snowflake } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { Button, BackButton } from '../../components/Shared';
import { audio, haptics } from '../../utils/audio';

// Constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 24; // Will scale with CSS
const MAX_SCORE = 5000;
const TICK_RATE_START = 400;
const TICK_RATE_MIN = 80;

// Colors for tetrominoes with gradients
const COLORS = {
  I: 'from-cyan-400 to-cyan-600',
  J: 'from-blue-500 to-blue-700',
  L: 'from-orange-400 to-orange-600',
  O: 'from-yellow-300 to-yellow-500',
  S: 'from-green-400 to-green-600',
  T: 'from-purple-500 to-purple-700',
  Z: 'from-red-500 to-red-700',
};

const HEX_COLORS = {
  I: '#22d3ee',
  J: '#3b82f6',
  L: '#fb923c',
  O: '#fde047',
  S: '#4ade80',
  T: '#a855f7',
  Z: '#ef4444',
};

// Tetromino shapes
const SHAPES = {
  I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  J: [[1,0,0],[1,1,1],[0,0,0]],
  L: [[0,0,1],[1,1,1],[0,0,0]],
  O: [[1,1],[1,1]],
  S: [[0,1,1],[1,1,0],[0,0,0]],
  T: [[0,1,0],[1,1,1],[0,0,0]],
  Z: [[1,1,0],[0,1,1],[0,0,0]]
};

type TetrominoType = keyof typeof SHAPES;

interface Piece {
  type: TetrominoType;
  shape: number[][];
  x: number;
  y: number;
}

const createEmptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));

const getRandomPiece = (): Piece => {
  const types = Object.keys(SHAPES) as TetrominoType[];
  const type = types[Math.floor(Math.random() * types.length)];
  return {
    type,
    shape: SHAPES[type],
    x: Math.floor(COLS / 2) - Math.floor(SHAPES[type][0].length / 2),
    y: 0
  };
};

export const Tetris = () => {
  const { setScreen, addPoints, useAttempt, t, updateHighScore, user, gamesStats, selectedGameId } = useGame();
  
  const gameStat = gamesStats[selectedGameId];
  const dailyPoints = gameStat?.pointsEarnedToday || 0;
  const MAX_LIMIT = gameStat?.dailyPointsLimit || MAX_SCORE;
  const attemptsLeft = gameStat?.attemptsLeft ?? 0;
  
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'MAX_REACHED' | 'NO_ATTEMPTS'>('IDLE');
  const [board, setBoard] = useState<(string | null)[][]>(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextPiece, setNextPiece] = useState<Piece | null>(null);
  
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [popupText, setPopupText] = useState<{text: string, id: number, color?: string}[]>([]);
  const [microReward, setMicroReward] = useState<{type: string, text: string} | null>(null);
  const [isFrozen, setIsFrozen] = useState(false);
  
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const dropCounterRef = useRef<number>(0);
  const dropIntervalRef = useRef<number>(TICK_RATE_START);
  const pieceSpawnTimeRef = useRef<number>(0);
  const hardDropDistanceRef = useRef<number>(0);
  
  const boardRef = useRef(board);
  const currentPieceRef = useRef(currentPiece);
  const isFrozenRef = useRef(isFrozen);

  useEffect(() => {
    boardRef.current = board;
    currentPieceRef.current = currentPiece;
    isFrozenRef.current = isFrozen;
  }, [board, currentPiece, isFrozen]);

  // Micro-rewards timer
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    
    const interval = setInterval(() => {
      const rewards = [
        { type: 'points', text: '+50 Points!' },
        { type: 'slow', text: 'Time Slowed!' },
        { type: 'clear', text: 'Auto-Clear!' }
      ];
      const reward = rewards[Math.floor(Math.random() * rewards.length)];
      setMicroReward(reward);
      
      setTimeout(() => {
        setMicroReward(null);
      }, 3000);
      
      // Apply reward
      if (reward.type === 'points') {
        setScore(s => {
          const newScore = s + 50;
          scoreRef.current = newScore;
          return newScore;
        });
      } else if (reward.type === 'slow') {
        const old = dropIntervalRef.current;
        dropIntervalRef.current = TICK_RATE_START;
        setTimeout(() => { dropIntervalRef.current = old; }, 5000);
      } else if (reward.type === 'clear') {
        // Clear bottom line
        const newB = [...boardRef.current];
        newB.pop();
        newB.unshift(Array(COLS).fill(null));
        setBoard(newB);
        boardRef.current = newB;
        setScore(s => {
          const newScore = s + 100;
          scoreRef.current = newScore;
          return newScore;
        });
      }
      
      audio.play('success');
      haptics.medium();
      
    }, 25000); // Every 25 seconds
    
    return () => clearInterval(interval);
  }, [gameState]);

  const showPopup = (text: string, color?: string) => {
    const id = Date.now() + Math.random();
    setPopupText(prev => [...prev, { text, id, color }]);
    setTimeout(() => {
      setPopupText(prev => prev.filter(p => p.id !== id));
    }, 1500);
  };

  const [usedLastChance, setUsedLastChance] = useState(false);
  const usedLastChanceRef = useRef(usedLastChance);
  const nextPieceRef = useRef(nextPiece);
  const scoreRef = useRef(score);
  const linesRef = useRef(lines);
  const levelRef = useRef(level);
  const comboRef = useRef(combo);

  useEffect(() => {
    usedLastChanceRef.current = usedLastChance;
    nextPieceRef.current = nextPiece;
    scoreRef.current = score;
    linesRef.current = lines;
    levelRef.current = level;
    comboRef.current = combo;
  }, [usedLastChance, nextPiece, score, lines, level, combo]);

  const startGame = () => {
    if (dailyPoints >= MAX_LIMIT) {
      setGameState('MAX_REACHED');
      return;
    }
    if (!useAttempt()) {
      setGameState('NO_ATTEMPTS');
      return;
    }
    
    const emptyBoard = createEmptyBoard();
    setBoard(emptyBoard);
    boardRef.current = emptyBoard;
    
    setScore(0);
    scoreRef.current = 0;
    
    setLines(0);
    linesRef.current = 0;
    
    setLevel(1);
    levelRef.current = 1;
    
    setCombo(0);
    comboRef.current = 0;
    
    setUsedLastChance(false);
    usedLastChanceRef.current = false;
    
    const p1 = getRandomPiece();
    const p2 = getRandomPiece();
    setNextPiece(p1);
    nextPieceRef.current = p1;
    setCurrentPiece(p2);
    currentPieceRef.current = p2;
    
    pieceSpawnTimeRef.current = performance.now();
    dropIntervalRef.current = TICK_RATE_START;
    setGameState('PLAYING');
    audio.play('click');
    setIsFrozen(false);
    
    // Apply streak bonus
    if (user.streak === 1) {
      setScore(100);
      scoreRef.current = 100;
      showPopup("Day 1 Bonus: +100!", "#f59e0b");
    } else if (user.streak === 7) {
      dropIntervalRef.current = TICK_RATE_START + 200; // Slow start
      showPopup("Day 7 Boost: Slow Start!", "#8b5cf6");
    }
  };

  const handleFreeze = () => {
    if (gameState !== 'PLAYING') return;
    
    const newFrozenState = !isFrozen;
    setIsFrozen(newFrozenState);
    
    if (newFrozenState) {
      showPopup("TIME FROZEN", "#60a5fa");
      audio.play('success');
    } else {
      showPopup("TIME RESUMED", "#10b981");
      audio.play('click');
    }
    haptics.medium();
  };

  const checkCollision = (piece: Piece, b: (string | null)[][]) => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x;
          const newY = piece.y + y;
          if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && b[newY][newX] !== null)) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const rotate = (matrix: number[][]) => {
    const N = matrix.length;
    const result = matrix.map((row, i) =>
      row.map((val, j) => matrix[N - 1 - j][i])
    );
    return result;
  };

  const moveDown = useCallback(() => {
    if (!currentPieceRef.current || isFrozenRef.current) return;
    
    const newPiece = { ...currentPieceRef.current, y: currentPieceRef.current.y + 1 };
    
    if (!checkCollision(newPiece, boardRef.current)) {
      setCurrentPiece(newPiece);
      currentPieceRef.current = newPiece;
    } else {
      lockPiece();
    }
  }, []);

  const moveHorizontal = useCallback((dir: number) => {
    const currentPiece = currentPieceRef.current;
    if (!currentPiece || isFrozenRef.current) return;
    const newPiece = { ...currentPiece, x: currentPiece.x + dir };
    if (!checkCollision(newPiece, boardRef.current)) {
      setCurrentPiece(newPiece);
      currentPieceRef.current = newPiece;
      audio.play('click');
    }
  }, []);

  const rotatePiece = useCallback(() => {
    const currentPiece = currentPieceRef.current;
    if (!currentPiece || isFrozenRef.current) return;
    const newShape = rotate(currentPiece.shape);
    const newPiece = { ...currentPiece, shape: newShape };
    
    // Wall kick simple
    if (!checkCollision(newPiece, boardRef.current)) {
      setCurrentPiece(newPiece);
      currentPieceRef.current = newPiece;
      audio.play('click');
    } else {
      // Try shifting left or right
      const shiftRight = { ...newPiece, x: newPiece.x + 1 };
      if (!checkCollision(shiftRight, boardRef.current)) {
        setCurrentPiece(shiftRight);
        currentPieceRef.current = shiftRight;
        audio.play('click');
        return;
      }
      const shiftLeft = { ...newPiece, x: newPiece.x - 1 };
      if (!checkCollision(shiftLeft, boardRef.current)) {
        setCurrentPiece(shiftLeft);
        currentPieceRef.current = shiftLeft;
        audio.play('click');
      }
    }
  }, []);

  const hardDrop = useCallback(() => {
    const currentPiece = currentPieceRef.current;
    if (!currentPiece || isFrozenRef.current) return;
    let newY = currentPiece.y;
    while (!checkCollision({ ...currentPiece, y: newY + 1 }, boardRef.current)) {
      newY++;
    }
    hardDropDistanceRef.current = newY - currentPiece.y;
    const newPiece = { ...currentPiece, y: newY };
    setCurrentPiece(newPiece);
    currentPieceRef.current = newPiece;
    haptics.heavy();
    // Force lock next frame
    dropCounterRef.current = dropIntervalRef.current;
  }, []);

  const lockPiece = () => {
    const piece = currentPieceRef.current;
    const b = [...boardRef.current.map(row => [...row])];
    
    if (!piece) return;

    let isGameOver = false;
    let highestBlockY = ROWS;

    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          if (piece.y + y < 0) {
            isGameOver = true;
          } else {
            b[piece.y + y][piece.x + x] = piece.type;
            if (piece.y + y < highestBlockY) {
              highestBlockY = piece.y + y;
            }
          }
        }
      }
    }

    if (isGameOver || piece.y <= 0) {
      handleGameOver();
      return;
    }

    setBoard(b);
    boardRef.current = b;
    
    // Check speed bonus
    const timeTaken = performance.now() - pieceSpawnTimeRef.current;
    let speedBonus = 0;
    if (timeTaken < 1000) {
      speedBonus = 20;
      showPopup("Speed Bonus! +20", "#3b82f6");
    }
    
    // Check perfect drop (hard drop from > 12 blocks)
    let perfectDropBonus = 0;
    if (hardDropDistanceRef.current > 12) {
      perfectDropBonus = 40;
      showPopup("Perfect Drop! +40", "#10b981");
    }
    
    if (speedBonus > 0 || perfectDropBonus > 0) {
      setScore(s => {
        const newScore = s + speedBonus + perfectDropBonus;
        scoreRef.current = newScore;
        return newScore;
      });
    }

    clearLines(b);
    
    const next = nextPieceRef.current;
    const newNext = getRandomPiece();
    setCurrentPiece(next);
    currentPieceRef.current = next;
    setNextPiece(newNext);
    nextPieceRef.current = newNext;
    pieceSpawnTimeRef.current = performance.now();
    hardDropDistanceRef.current = 0;
    haptics.medium();
  };

  const clearLines = (b: (string | null)[][]) => {
    let linesCleared = 0;
    const newBoard = b.filter(row => {
      const isFull = row.every(cell => cell !== null);
      if (isFull) linesCleared++;
      return !isFull;
    });

    if (linesCleared > 0) {
      for (let i = 0; i < linesCleared; i++) {
        newBoard.unshift(Array(COLS).fill(null));
      }
      setBoard(newBoard);
      boardRef.current = newBoard;
      
      const newLines = linesRef.current + linesCleared;
      setLines(newLines);
      linesRef.current = newLines;
      
      // Calculate score
      let basePoints = 0;
      if (linesCleared === 1) basePoints = 40;
      else if (linesCleared === 2) basePoints = 100;
      else if (linesCleared === 3) basePoints = 300;
      else if (linesCleared === 4) basePoints = 800;

      const newCombo = comboRef.current + 1;
      setCombo(newCombo);
      comboRef.current = newCombo;
      
      let multiplier = 1;
      if (newCombo >= 5) multiplier = 1.5;
      else if (newCombo >= 3) multiplier = 1.2;
      else if (newCombo > 1) multiplier = 1.05;
      
      if (user.streak >= 3) {
        multiplier *= 1.2;
      }

      const pointsEarned = Math.floor(basePoints * multiplier);
      
      setScore(prev => {
        const newScore = prev + pointsEarned;
        scoreRef.current = newScore;
        return newScore;
      });

      if (linesCleared === 4) {
        showPopup("TETRIS! +" + pointsEarned);
        haptics.heavy();
      } else if (newCombo > 1) {
        showPopup(newCombo + "x COMBO!");
        haptics.medium();
      } else {
        audio.play('success');
      }

      // Level up
      const newLevel = Math.floor(newLines / 8) + 1;
      if (newLevel > levelRef.current) {
        setLevel(newLevel);
        levelRef.current = newLevel;
        dropIntervalRef.current = Math.max(TICK_RATE_MIN, TICK_RATE_START - (newLevel - 1) * 40);
        showPopup("LEVEL UP!");
      }
    } else {
      setCombo(0);
      comboRef.current = 0;
    }
  };

  const handleGameOver = () => {
    setGameState('GAMEOVER');
    audio.play('error');
    haptics.heavy();
    if (scoreRef.current > 0) {
      addPoints(scoreRef.current);
      updateHighScore('TETRIS', scoreRef.current);
    }
  };

  const update = useCallback((time: number) => {
    if (gameState !== 'PLAYING') return;

    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    dropCounterRef.current += deltaTime;
    if (!isFrozenRef.current && dropCounterRef.current > dropIntervalRef.current) {
      moveDown();
      dropCounterRef.current = 0;
    }

    requestRef.current = requestAnimationFrame(update);
  }, [gameState, moveDown]);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      lastTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(update);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, update]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING') return;
      switch (e.key) {
        case 'ArrowLeft': moveHorizontal(-1); break;
        case 'ArrowRight': moveHorizontal(1); break;
        case 'ArrowDown': moveDown(); break;
        case 'ArrowUp': rotatePiece(); break;
        case ' ': hardDrop(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, moveDown, moveHorizontal, rotatePiece, hardDrop]);

  // Touch controls
  const touchStartRef = useRef<{x: number, y: number} | null>(null);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || gameState !== 'PLAYING') return;
    
    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    };

    const dx = touchEnd.x - touchStartRef.current.x;
    const dy = touchEnd.y - touchStartRef.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < 20) {
      rotatePiece();
    } else if (absDx > absDy) {
      if (dx > 0) moveHorizontal(1);
      else moveHorizontal(-1);
    } else {
      if (dy > 0) hardDrop();
    }
    
    touchStartRef.current = null;
  };

  // Render ghost piece
  const getGhostY = () => {
    if (!currentPiece) return 0;
    let ghostY = currentPiece.y;
    while (!checkCollision({ ...currentPiece, y: ghostY + 1 }, board)) {
      ghostY++;
    }
    return ghostY;
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col text-white overflow-hidden font-sans">
      {/* Header */}
      <div className="py-1 px-3 safe-top flex justify-between items-center z-20 shrink-0 bg-zinc-950/60 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Grid size={12} className="text-blue-500" />
          </div>
          <div className="flex flex-col">
            <p className="text-[7px] font-black uppercase tracking-[0.1em] text-zinc-500 leading-none mb-0.5">Mission</p>
            <p className="text-[10px] font-black italic tracking-tight leading-none">TETRIS OPS</p>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-black tabular-nums tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{score}</span>
            <span className="text-[7px] text-zinc-500 font-black uppercase tracking-widest">pts</span>
          </div>
          <div className="w-12 h-0.5 bg-zinc-900 rounded-full mt-0.5 overflow-hidden">
            <motion.div 
              className="h-full bg-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${(score / MAX_SCORE) * 100}%` }}
            />
          </div>
        </div>

        <button 
          onClick={() => setGameState(prev => prev === 'PLAYING' ? 'PAUSED' : 'PLAYING')}
          className="w-6 h-6 rounded-lg bg-zinc-900/50 border border-white/5 flex items-center justify-center active:scale-90 transition-all hover:bg-zinc-800"
        >
          {gameState === 'PAUSED' ? <Play size={12} fill="currentColor" /> : <Pause size={12} fill="currentColor" />}
        </button>
      </div>

      {/* Main Game Area */}
      <div className={`flex-1 relative flex flex-col items-center p-4 min-h-0 overflow-hidden transition-colors duration-500 ${isFrozen ? 'bg-blue-900/10' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {gameState === 'PLAYING' && (
          <div className="w-full h-full flex flex-col items-center max-w-[500px]">
            {/* Top Stats Bar */}
            <div className="w-full flex justify-between items-center gap-2 mb-4 px-2 relative z-50">
              <div className="flex gap-2">
                <div className="bg-zinc-900/20 border border-white/5 rounded-xl px-3 h-10 flex items-center gap-2 backdrop-blur-md">
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Level</span>
                  <span className="text-sm font-black text-blue-400">{level}</span>
                </div>
                {user.streak > 0 && (
                  <div className="bg-zinc-900/20 border border-white/5 rounded-xl px-3 h-10 flex items-center gap-2 backdrop-blur-md">
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Streak</span>
                    <div className="flex items-center gap-1">
                      <Zap size={10} className="text-purple-400 fill-purple-400" />
                      <span className="text-sm font-black text-purple-400">{user.streak}d</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <AnimatePresence>
                  {combo > 1 && (
                    <motion.div 
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 20, opacity: 0 }}
                      className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 h-10 flex items-center gap-2 backdrop-blur-sm"
                    >
                      <Flame size={12} className="text-orange-500 fill-orange-500" />
                      <span className="text-[10px] font-black text-orange-500 uppercase italic">{combo}x</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="bg-zinc-900/20 border border-white/5 rounded-xl px-3 h-10 flex items-center gap-2 backdrop-blur-md">
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Next</span>
                  <div className="w-7 h-7 relative flex items-center justify-center bg-black/20 rounded-lg border border-white/5">
                    {nextPiece && (
                      <div className="relative scale-75" style={{ width: nextPiece.shape[0].length * 10, height: nextPiece.shape.length * 10 }}>
                        {nextPiece.shape.map((row, y) => 
                          row.map((cell, x) => cell ? (
                            <div key={`${x}-${y}`} className={`absolute w-2.5 h-2.5 rounded-[2px] bg-gradient-to-br ${COLORS[nextPiece.type]}`}
                              style={{
                                left: x * 10, top: y * 10,
                                boxShadow: `0 0 8px ${HEX_COLORS[nextPiece.type]}60`
                              }}
                            />
                          ) : null)
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Board Container */}
            <div className="relative flex-1 w-full flex items-center justify-center min-h-0 mb-6">
              <div className="relative bg-zinc-900/30 border border-white/10 rounded-2xl p-1.5 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-sm" style={{ marginLeft: '0px', marginTop: '80px', paddingTop: '6px', width: '182px', height: '400px' }}>
                <div className="relative bg-zinc-950 rounded-xl overflow-hidden w-full h-full shadow-inner">
                  {/* Grid lines */}
                  <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: 'linear-gradient(to right, #ffffff10 1px, transparent 1px), linear-gradient(to bottom, #ffffff10 1px, transparent 1px)',
                    backgroundSize: '10% 5%'
                  }} />

                  {/* Placed blocks */}
                  {board.map((row, y) => 
                    row.map((cell, x) => cell ? (
                      <div key={`cell-${x}-${y}`} className={`absolute rounded-[4px] border border-black/30 bg-gradient-to-br ${COLORS[cell as TetrominoType]}`}
                        style={{
                          left: `${x * 10}%`, top: `${y * 5}%`,
                          width: '10%', height: '5%',
                          boxShadow: `inset 0 1px 2px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.3), 0 0 10px ${HEX_COLORS[cell as TetrominoType]}30`
                        }}
                      />
                    ) : null)
                  )}

                  {/* Ghost piece */}
                  {currentPiece && (
                    currentPiece.shape.map((row, y) => 
                      row.map((cell, x) => cell ? (
                        <div key={`ghost-${x}-${y}`} className="absolute rounded-[4px] border border-white/10"
                          style={{
                            left: `${(currentPiece.x + x) * 10}%`, 
                            top: `${(getGhostY() + y) * 5}%`,
                            width: '10%', height: '5%',
                            backgroundColor: 'rgba(255,255,255,0.03)',
                            boxShadow: `inset 0 0 4px rgba(255,255,255,0.05)`
                          }}
                        />
                      ) : null)
                    )
                  )}

                  {/* Current piece */}
                  {currentPiece && (
                    currentPiece.shape.map((row, y) => 
                      row.map((cell, x) => cell ? (
                        <div key={`current-${x}-${y}`} className={`absolute rounded-[4px] border border-black/30 bg-gradient-to-br ${COLORS[currentPiece.type]}`}
                          style={{
                            left: `${(currentPiece.x + x) * 10}%`, 
                            top: `${(currentPiece.y + y) * 5}%`,
                            width: '10%', height: '5%',
                            boxShadow: `inset 0 1px 2px rgba(255,255,255,0.4), 0 4px 8px rgba(0,0,0,0.4), 0 0 15px ${HEX_COLORS[currentPiece.type]}60`
                          }}
                        />
                      ) : null)
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Popups */}
            <AnimatePresence>
              {popupText.map(popup => (
                <motion.div
                  key={popup.id}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: -50, scale: 1.2 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                  className="absolute z-50 text-2xl font-black italic text-white pointer-events-none text-center"
                  style={{ 
                    top: '40%',
                    color: popup.color || 'white',
                    textShadow: `0 0 10px ${popup.color || 'white'}80`
                  }}
                >
                  {popup.text}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Tactile Controls - Integrated below the board */}
            <div className="w-full px-4 flex flex-col gap-2 z-40 mt-auto pb-4">
              <div className="flex justify-between items-end">
                {/* Movement D-Pad */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button 
                    onPointerDown={() => moveHorizontal(-1)}
                    className="w-12 h-12 rounded-xl bg-zinc-900/20 border border-white/5 flex items-center justify-center active:bg-zinc-800/40 transition-all backdrop-blur-[2px]"
                    style={{ marginLeft: '80px' }}
                  >
                    <ArrowLeft size={24} className="text-zinc-400" />
                  </button>
                  <button 
                    onPointerDown={() => moveHorizontal(1)}
                    className="w-12 h-12 rounded-xl bg-zinc-900/20 border border-white/5 flex items-center justify-center active:bg-zinc-800/40 transition-all backdrop-blur-[2px]"
                    style={{ marginLeft: '80px' }}
                  >
                    <ArrowRight size={24} className="text-zinc-400" />
                  </button>
                </div>

                {/* Main Action Button */}
                <div className="flex flex-col items-center gap-2" style={{ marginLeft: '0px' }}>
                  <button 
                    onPointerDown={handleFreeze}
                    className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all backdrop-blur-sm ${
                      isFrozen 
                        ? 'bg-blue-400 border-blue-300 shadow-[0_0_20px_rgba(96,165,250,0.6)]' 
                        : 'bg-blue-900/20 border-blue-500/30 active:bg-blue-800/40'
                    }`}
                    style={{ marginLeft: '80px' }}
                  >
                    <Snowflake size={24} className={isFrozen ? 'text-white animate-pulse' : 'text-blue-400'} />
                  </button>
                  <button 
                    onPointerDown={rotatePiece}
                    className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-400/20 flex items-center justify-center active:scale-95 transition-all backdrop-blur-[2px]"
                    style={{ marginLeft: '70px', paddingLeft: '0px' }}
                  >
                    <RotateCw size={32} className="text-white/80" />
                  </button>
                </div>
              </div>

              <div className="flex gap-1.5">
                <button 
                  onPointerDown={moveDown}
                  className="flex-1 h-12 rounded-xl bg-zinc-900/20 border border-white/5 flex items-center justify-center active:bg-zinc-800/40 transition-all backdrop-blur-[2px]"
                >
                  <ArrowDown size={16} className="mr-1.5 text-zinc-500" />
                  <span className="font-black text-[8px] uppercase tracking-[0.1em] text-zinc-500">Soft</span>
                </button>
                <button 
                  onPointerDown={hardDrop}
                  className="flex-1 h-12 rounded-xl bg-blue-600/10 border border-blue-400/10 flex items-center justify-center active:bg-blue-600/20 transition-all backdrop-blur-[2px]"
                >
                  <ChevronDown size={16} className="mr-1.5 text-blue-500/60" />
                  <span className="font-black text-[8px] uppercase tracking-[0.1em] text-blue-500/60">Hard</span>
                </button>
              </div>
            </div>

            {/* Micro Reward */}
            <AnimatePresence>
              {microReward && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-20 z-40 bg-zinc-900/90 border border-zinc-700 rounded-full px-4 py-2 flex items-center gap-2 shadow-2xl backdrop-blur-md"
                >
                  <Zap size={16} className="text-yellow-500" />
                  <span className="text-sm font-bold text-white">{microReward.text}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Overlays */}
        {gameState === 'IDLE' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-md z-30 p-6 text-center">
            <div className="w-24 h-24 bg-blue-500/10 rounded-[2rem] flex items-center justify-center mb-8 border border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.2)] rotate-12">
              <Grid size={48} className="text-blue-500 -rotate-12" />
            </div>
            <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-2 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">{t.gameDetails.TETRIS.title}</h2>
            <p className="text-zinc-500 mb-12 max-w-[280px] text-sm font-medium leading-relaxed">
              {t.gameDetails.TETRIS.desc}
            </p>
            <div className="flex flex-col gap-4 w-full max-w-[300px]">
              <Button onClick={startGame} className="w-full py-6 text-xl font-black tracking-[0.2em] uppercase italic shadow-[0_0_40px_rgba(59,130,246,0.4)] border-t border-white/20">
                {t.gameBoard.play || 'START'}
              </Button>
              <div className="mt-2 text-center">
                <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">{t.common?.attemptsLeft || "ATTEMPTS"}: </span>
                <span className="text-white font-black">{attemptsLeft}</span>
              </div>
              <div className="mt-4">
                <BackButton onClick={() => setScreen('EVENT_DETAILS')} />
              </div>
            </div>
          </div>
        )}

        {gameState === 'PAUSED' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md flex flex-col items-center justify-center z-[100]"
          >
            <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-8 text-white">{t.common.paused || 'PAUSED'}</h2>
            <div className="flex flex-col gap-4 w-full max-w-[200px]">
              <Button onClick={() => setGameState('PLAYING')} className="py-4 text-lg">{t.common.resume || 'RESUME'}</Button>
              <Button onClick={() => setShowExitConfirm(true)} variant="secondary" className="py-4 text-lg">{t.common.exitToMenu || 'EXIT'}</Button>
            </div>
          </motion.div>
        )}

        {showExitConfirm && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-[110] bg-zinc-950/95 flex flex-col items-center justify-center p-8 text-center"
          >
            <AlertCircle size={64} className="text-red-500 mb-6" />
            <h3 className="text-2xl font-black mb-2 uppercase italic tracking-tighter">{t.common.areYouSure || 'ARE YOU SURE?'}</h3>
            <p className="text-zinc-400 mb-8">{t.colorSort.loseAttempt || 'You will lose this attempt.'}</p>
            <div className="flex flex-col gap-3 w-full max-w-[240px]">
              <Button onClick={() => { setShowExitConfirm(false); setGameState('IDLE'); }} className="py-4 bg-red-500 text-white border-red-500/50">
                {t.common.yesExit || 'EXIT TO MENU'}
              </Button>
              <Button onClick={() => setShowExitConfirm(false)} variant="secondary" className="py-4">
                {t.common.cancel || 'RESUME'}
              </Button>
            </div>
          </motion.div>
        )}

        {gameState === 'GAMEOVER' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/95 backdrop-blur-xl p-6 text-center"
          >
            <div className="w-28 h-28 bg-red-500/10 rounded-full flex items-center justify-center mb-8 border border-red-500/20 shadow-[0_0_60px_rgba(239,68,68,0.2)]">
              <Trophy size={56} className="text-red-500" />
            </div>
            <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-2 text-white">{t.result.congrats || 'GAME OVER'}</h2>
            <p className="text-zinc-500 mb-8 font-bold uppercase tracking-widest text-xs">
              Grid integrity compromised
            </p>
            
            <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8 w-full max-w-[320px] mb-10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
              <div className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] mb-2">{t.common.score || 'Final Yield'}</div>
              <div className="text-6xl font-black text-white mb-6 tracking-tighter">{score}</div>
              <div className="h-px w-full bg-white/5 mb-6" />
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-zinc-500">Lines Cleared</span>
                <span className="text-white">{lines}</span>
              </div>
            </div>

            <div className="flex flex-col gap-4 w-full max-w-[320px]">
              <Button onClick={startGame} className="py-6 text-xl font-black tracking-[0.2em] uppercase italic shadow-[0_0_40px_rgba(59,130,246,0.3)] border-t border-white/20">
                {t.arenaGame.tryAgain || 'TRY AGAIN'}
              </Button>
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => setScreen('LEADERBOARD')} variant="secondary" className="py-4 font-black uppercase tracking-widest text-[10px] border-white/5 bg-white/5">
                  {t.leaderboard.title || 'RANKINGS'}
                </Button>
                <Button onClick={() => setScreen('SHOP')} variant="secondary" className="py-4 font-black uppercase tracking-widest text-[10px] border-white/5 bg-white/5">
                  {t.shop?.buy || 'ARMORY'}
                </Button>
              </div>
              <button onClick={() => setScreen('EVENT_DETAILS')} className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 hover:text-white transition-colors">
                {t.common.backToMenu || 'RETURN TO COMMAND'}
              </button>
            </div>
          </motion.div>
        )}

        {gameState === 'MAX_REACHED' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-md p-6 text-center"
          >
            <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mb-6 border border-yellow-500/30">
              <Trophy size={48} className="text-yellow-500" />
            </div>
            <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-4 text-white">{t.colorSort.maxReached || 'MAX SCORE!'}</h2>
            <p className="text-zinc-400 mb-8 max-w-[280px]">
              {t.higherLower.limitDesc || "You've squeezed the max for today. Come back tomorrow for more points!"}
            </p>
            <Button onClick={() => setScreen('EVENT_DETAILS')} className="w-full max-w-[280px] py-5 text-lg font-black tracking-widest uppercase italic">
              {t.common.backToMenu || 'CONTINUE'}
            </Button>
          </motion.div>
        )}

        {gameState === 'NO_ATTEMPTS' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-md p-6 text-center"
          >
            <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center mb-6 border border-zinc-700">
              <Clock size={48} className="text-zinc-500" />
            </div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4 text-white">{t.colorSort.noAttempts || 'OUT OF ATTEMPTS'}</h2>
            <p className="text-zinc-400 mb-8 max-w-[280px]">
              {t.match3?.comeBackTomorrow || "You've used all your attempts for today. Come back tomorrow!"}
            </p>
            <Button onClick={() => setScreen('EVENT_DETAILS')} className="w-full max-w-[280px] py-5 text-lg font-black tracking-widest uppercase italic">
              {t.common.backToMenu || 'BACK TO MENU'}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
