import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../../context/GameContext';
import { Button } from '../../components/Shared';
import { audio, haptics } from '../../utils/audio';
import { Play, Pause, X, Trophy, RefreshCw, Zap, Star, Target, ChevronLeft, AlertCircle, Bomb, ArrowLeftRight, ArrowUpDown, Clock } from 'lucide-react';

const GRID_SIZE = 8;
const COLORS = [
  'bg-rose-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-400',
  'bg-purple-500',
  'bg-cyan-400'
];
const MAX_MOVES = 25;

type Powerup = 'none' | 'horizontal' | 'vertical' | 'bomb';

interface CellData {
  id: string;
  color: number;
  powerup: Powerup;
  isMatched: boolean;
}

// States without local storage
const generateId = () => Math.random().toString(36).substr(2, 9);

const createEmptyGrid = (): CellData[][] => {
  return Array(GRID_SIZE).fill(null).map(() => 
    Array(GRID_SIZE).fill(null).map(() => ({
      id: generateId(),
      color: Math.floor(Math.random() * COLORS.length),
      powerup: 'none',
      isMatched: false
    }))
  );
};

// Helper to check if a grid has initial matches
const hasMatches = (grid: CellData[][]) => {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const color = grid[r][c].color;
      if (c < GRID_SIZE - 2 && grid[r][c+1].color === color && grid[r][c+2].color === color) return true;
      if (r < GRID_SIZE - 2 && grid[r+1][c].color === color && grid[r+2][c].color === color) return true;
    }
  }
  return false;
};

const createInitialGrid = () => {
  let grid = createEmptyGrid();
  while (hasMatches(grid)) {
    grid = createEmptyGrid();
  }
  return grid;
};

export const Match3: React.FC = () => {
  const { user, addPoints, updateHighScore, t, setScreen, useAttempt, gamesStats, selectedGameId } = useGame();
  
  const gameStat = gamesStats[selectedGameId];
  const dailyPoints = gameStat?.pointsEarnedToday || 0;
  const MAX_LIMIT = gameStat?.dailyPointsLimit || 5000;
  const attemptsLeft = gameStat?.attemptsLeft ?? 0;
  
  const [grid, setGrid] = useState<CellData[][]>(createInitialGrid());
  const [selected, setSelected] = useState<{r: number, c: number} | null>(null);
  const [moves, setMoves] = useState(MAX_MOVES);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const [view, setView] = useState<'MAIN' | 'GAME' | 'PAUSE' | 'GAMEOVER' | 'NO_ATTEMPTS'>('MAIN');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  // Game actions
  const startGame = () => {
    if (attemptsLeft <= 0) {
      setView('NO_ATTEMPTS');
      return;
    }
    
    if (useAttempt()) {
      setGrid(createInitialGrid());
      setMoves(MAX_MOVES);
      setScore(0);
      setCombo(1);
      setView('GAME');
    }
  };

  const handleCellClick = (r: number, c: number) => {
    if (isAnimating || moves <= 0) return;

    if (!selected) {
      setGrid(prev => {
        const newGrid = [...prev];
        newGrid[r] = [...newGrid[r]];
        return newGrid;
      });
      setSelected({r, c});
      return;
    }

    const isAdjacent = (Math.abs(selected.r - r) === 1 && selected.c === c) || 
                       (Math.abs(selected.c - c) === 1 && selected.r === r);

    if (isAdjacent) {
      swapCells(selected.r, selected.c, r, c);
    } else {
      setSelected({r, c});
    }
  };

  const swapCells = async (r1: number, c1: number, r2: number, c2: number) => {
    setIsAnimating(true);
    setSelected(null);

    let newGrid = [...grid.map(row => [...row])];
    const temp = newGrid[r1][c1];
    newGrid[r1][c1] = newGrid[r2][c2];
    newGrid[r2][c2] = temp;
    
    setGrid(newGrid);
    
    // Wait for swap animation
    await new Promise(res => setTimeout(res, 300));

    const { matches, horizontalGroups, verticalGroups } = findMatches(newGrid);
    
    if (matches.length > 0) {
      setMoves(m => m - 1);
      audio.playMatch();
      haptics.success();
      await processMatches(newGrid, matches, horizontalGroups, verticalGroups, 1, {r1, c1, r2, c2});
    } else {
      // Swap back
      audio.playHit();
      haptics.error();
      const revertGrid = [...newGrid.map(row => [...row])];
      const tempBack = revertGrid[r1][c1];
      revertGrid[r1][c1] = revertGrid[r2][c2];
      revertGrid[r2][c2] = tempBack;
      setGrid(revertGrid);
      setIsAnimating(false);
    }
  };

  const findMatches = (currentGrid: CellData[][]) => {
    const matches: {r: number, c: number}[] = [];
    const matchedSet = new Set<string>();
    const horizontalGroups: {r: number, c: number}[][] = [];
    const verticalGroups: {r: number, c: number}[][] = [];

    // Horizontal
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE - 2; c++) {
        const color = currentGrid[r][c].color;
        if (color === -1) continue;
        let matchLength = 1;
        while (c + matchLength < GRID_SIZE && currentGrid[r][c + matchLength].color === color) {
          matchLength++;
        }
        if (matchLength >= 3) {
          const group = [];
          for (let i = 0; i < matchLength; i++) {
            matchedSet.add(`${r},${c+i}`);
            group.push({r, c: c+i});
          }
          horizontalGroups.push(group);
          c += matchLength - 1;
        }
      }
    }

    // Vertical
    for (let c = 0; c < GRID_SIZE; c++) {
      for (let r = 0; r < GRID_SIZE - 2; r++) {
        const color = currentGrid[r][c].color;
        if (color === -1) continue;
        let matchLength = 1;
        while (r + matchLength < GRID_SIZE && currentGrid[r + matchLength][c].color === color) {
          matchLength++;
        }
        if (matchLength >= 3) {
          const group = [];
          for (let i = 0; i < matchLength; i++) {
            matchedSet.add(`${r+i},${c}`);
            group.push({r: r+i, c});
          }
          verticalGroups.push(group);
          r += matchLength - 1;
        }
      }
    }

    matchedSet.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      matches.push({r, c});
    });

    return { matches, horizontalGroups, verticalGroups };
  };

  const processMatches = async (
    currentGrid: CellData[][], 
    matches: {r: number, c: number}[], 
    horizontalGroups: {r: number, c: number}[][],
    verticalGroups: {r: number, c: number}[][],
    currentCombo: number,
    swapOrigin?: {r1: number, c1: number, r2: number, c2: number}
  ) => {
    let newGrid = [...currentGrid.map(row => [...row])];
    let pointsGained = matches.length * 2 * currentCombo;
    
    // Determine powerups to create
    const powerupsToCreate: {r: number, c: number, type: Powerup, color: number}[] = [];
    
    // Check for 5-in-a-row (bomb)
    const allGroups = [...horizontalGroups, ...verticalGroups];
    const bombGroups = allGroups.filter(g => g.length >= 5);
    const lineGroups = allGroups.filter(g => g.length === 4);
    
    // We need to place the powerup at the swapped cell if possible, or the center.
    const getPlacementCell = (group: {r: number, c: number}[]) => {
      if (swapOrigin) {
        const {r1, c1, r2, c2} = swapOrigin;
        const p1 = group.find(p => p.r === r1 && p.c === c1);
        if (p1) return p1;
        const p2 = group.find(p => p.r === r2 && p.c === c2);
        if (p2) return p2;
      }
      return group[Math.floor(group.length / 2)];
    };

    bombGroups.forEach(g => {
      const cell = getPlacementCell(g);
      powerupsToCreate.push({r: cell.r, c: cell.c, type: 'bomb', color: newGrid[cell.r][cell.c].color});
    });

    lineGroups.forEach(g => {
      // If it's already part of a bomb, skip
      if (bombGroups.some(bg => bg.some(bc => bc.r === g[0].r && bc.c === g[0].c))) return;
      
      const cell = getPlacementCell(g);
      const isHorizontal = g[0].r === g[1].r;
      powerupsToCreate.push({r: cell.r, c: cell.c, type: isHorizontal ? 'horizontal' : 'vertical', color: newGrid[cell.r][cell.c].color});
    });

    // Handle existing powerups that are matched
    const triggerPowerups = (r: number, c: number) => {
      const p = newGrid[r][c].powerup;
      if (p === 'none') return;
      
      newGrid[r][c].powerup = 'none'; // Prevent infinite loops
      
      if (p === 'horizontal') {
        for (let i = 0; i < GRID_SIZE; i++) {
          if (!newGrid[r][i].isMatched) {
            newGrid[r][i].isMatched = true;
            pointsGained += 2 * currentCombo;
            triggerPowerups(r, i);
          }
        }
      } else if (p === 'vertical') {
        for (let i = 0; i < GRID_SIZE; i++) {
          if (!newGrid[i][c].isMatched) {
            newGrid[i][c].isMatched = true;
            pointsGained += 2 * currentCombo;
            triggerPowerups(i, c);
          }
        }
      } else if (p === 'bomb') {
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            const nr = r + i;
            const nc = c + j;
            if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
              if (!newGrid[nr][nc].isMatched) {
                newGrid[nr][nc].isMatched = true;
                pointsGained += 2 * currentCombo;
                triggerPowerups(nr, nc);
              }
            }
          }
        }
      }
    };

    // Mark as matched
    matches.forEach(({r, c}) => {
      newGrid[r][c].isMatched = true;
    });

    // Trigger powerups
    matches.forEach(({r, c}) => {
      triggerPowerups(r, c);
    });

    // Place new powerups (unmark them as matched)
    powerupsToCreate.forEach(p => {
      newGrid[p.r][p.c].isMatched = false;
      newGrid[p.r][p.c].powerup = p.type;
      newGrid[p.r][p.c].color = p.color;
    });
    
    setGrid(newGrid);
    setScore(s => s + pointsGained);
    setCombo(currentCombo);

    await new Promise(res => setTimeout(res, 300));

    // Remove matched and drop
    for (let c = 0; c < GRID_SIZE; c++) {
      let emptySlots = 0;
      for (let r = GRID_SIZE - 1; r >= 0; r--) {
        if (newGrid[r][c].isMatched) {
          emptySlots++;
        } else if (emptySlots > 0) {
          newGrid[r + emptySlots][c] = newGrid[r][c];
          newGrid[r][c] = { id: generateId(), color: -1, powerup: 'none', isMatched: false };
        }
      }
      for (let i = 0; i < emptySlots; i++) {
        newGrid[i][c] = {
          id: generateId(),
          color: Math.floor(Math.random() * COLORS.length),
          powerup: 'none',
          isMatched: false
        };
      }
    }

    setGrid(newGrid);
    await new Promise(res => setTimeout(res, 300));

    const { matches: newMatches, horizontalGroups: newH, verticalGroups: newV } = findMatches(newGrid);
    if (newMatches.length > 0) {
      audio.playMatch();
      haptics.success();
      await processMatches(newGrid, newMatches, newH, newV, currentCombo + 1);
    } else {
      setCombo(1);
      setIsAnimating(false);
    }
  };

  const endGame = useCallback(() => {
    setView('GAMEOVER');
    audio.playGameOver();
    haptics.heavy();
    updateHighScore(score);
    if (score > 0) {
      addPoints(score);
    }
  }, [score, updateHighScore, addPoints]);

  useEffect(() => {
    if (moves <= 0 && !isAnimating && view === 'GAME') {
      endGame();
    }
  }, [moves, isAnimating, view, endGame]);

  const handleExit = () => {
    setShowExitConfirm(true);
  };

  const confirmExit = () => {
    setShowExitConfirm(false);
    setView('MAIN');
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-white font-sans relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      {view === 'MAIN' && (
        <div className="flex-1 flex flex-col p-4 sm:p-6 safe-top safe-pb z-10 overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-between mb-4 sm:mb-8">
            <button onClick={() => setScreen('EVENT_DETAILS')} className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors">
              <ChevronLeft size={24} />
            </button>
            <div className="flex items-center gap-2 bg-zinc-900 px-4 py-2 rounded-full">
              <Star size={16} className="text-yellow-500" />
              <span className="font-bold">{dailyPoints} / {MAX_LIMIT}</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-3xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
              <Target size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-black mb-2 tracking-tight">{t.gameDetails.MATCH3.title || 'Neon Match'}</h1>
            <p className="text-zinc-400 mb-6 max-w-[280px] text-sm">
              {t.gameDetails.MATCH3.desc || "Match 3 or more blocks to score points. Use combos for massive multipliers!"}
            </p>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 w-full max-w-sm mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-zinc-400 text-sm">{t.common.attemptsLeft || "Attempts Left"}</span>
                <span className="font-bold text-lg">{attemptsLeft}</span>
              </div>
            </div>

            <motion.button 
              whileTap={{ scale: 0.96 }}
              onClick={startGame}
              className="w-full max-w-sm py-3.5 text-lg font-bold !bg-white !text-black hover:!bg-zinc-200 mb-3 rounded-2xl transition-colors"
            >
              {t.gameBoard.play || "PLAY NOW"}
            </motion.button>

            <div className="flex gap-3 w-full max-w-sm">
              <Button 
                onClick={() => setScreen('LEADERBOARD')}
                className="flex-1 py-3 bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 flex items-center justify-center gap-2 text-sm"
              >
                <Trophy size={16} className="text-yellow-500" />
                {t.leaderboard.title}
              </Button>
              <Button 
                onClick={() => setScreen('SHOP')}
                className="flex-1 py-3 bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 flex items-center justify-center gap-2 text-sm"
              >
                <Star size={16} className="text-purple-500" />
                {t.shop?.title || "Prizes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {view === 'GAME' && (
        <div className="flex-1 flex flex-col p-4 safe-top safe-pb z-10">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => setView('PAUSE')} className="p-2.5 bg-zinc-900 rounded-xl">
              <Pause size={20} />
            </button>
            
            <div className="flex gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{t.common.score || "SCORE"}</span>
                <span className="text-xl font-black text-white leading-none">{score}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{t.match3?.moves || "MOVES"}</span>
                <span className="text-xl font-black text-purple-400 leading-none">{moves}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center min-h-0">
            <div className="w-full max-w-md aspect-square max-h-full bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800 shadow-2xl flex flex-col">
              <div 
                className="w-full h-full grid gap-1 flex-1"
                style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
              >
                {grid.map((row, r) => 
                  row.map((cell, c) => (
                    <motion.div
                      key={cell.id}
                      layout
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: cell.isMatched ? 0 : 1, 
                        opacity: cell.isMatched ? 0 : 1,
                        y: 0
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      onClick={() => handleCellClick(r, c)}
                      className={`
                        relative rounded-lg cursor-pointer flex items-center justify-center
                        ${cell.color !== -1 ? COLORS[cell.color] : 'bg-transparent'}
                        ${selected?.r === r && selected?.c === c ? 'ring-4 ring-white z-10 scale-110' : ''}
                        hover:brightness-110 transition-all
                      `}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-lg" />
                      {cell.powerup === 'bomb' && <Bomb className="text-white drop-shadow-md z-10" size={24} />}
                      {cell.powerup === 'horizontal' && <ArrowLeftRight className="text-white drop-shadow-md z-10" size={24} />}
                      {cell.powerup === 'vertical' && <ArrowUpDown className="text-white drop-shadow-md z-10" size={24} />}
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          {combo > 1 && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-purple-500 text-white px-6 py-2 rounded-full font-black text-xl shadow-lg shadow-purple-500/50"
            >
              {combo}x COMBO!
            </motion.div>
          )}
        </div>
      )}

      {view === 'PAUSE' && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm text-center">
            <h2 className="text-2xl font-black mb-6">{t.common.paused || "PAUSED"}</h2>
            <div className="space-y-3">
              <motion.button 
                whileTap={{ scale: 0.96 }}
                onClick={() => setView('GAME')} 
                className="w-full py-3.5 !bg-white !text-black hover:!bg-zinc-200 rounded-2xl font-bold transition-colors"
              >
                {t.common.resume || "RESUME"}
              </motion.button>
              <Button onClick={handleExit} className="w-full py-3.5 bg-zinc-800 text-white hover:bg-zinc-700">
                {t.common.exitToMenu || "EXIT TO MENU"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showExitConfirm && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-red-500/30 rounded-3xl p-6 w-full max-w-sm text-center">
            <AlertCircle size={40} className="text-red-500 mx-auto mb-3" />
            <h2 className="text-xl font-black mb-2">{t.common.areYouSure || "ARE YOU SURE?"}</h2>
            <p className="text-zinc-400 mb-6 text-sm">
              {t.common.exitConfirmText || "If you exit now, your attempt will be lost."}
            </p>
            <div className="space-y-3">
              <Button onClick={confirmExit} className="w-full py-3.5 bg-red-500 text-white hover:bg-red-600">
                {t.common.yesExit || "EXIT & LOSE ATTEMPT"}
              </Button>
              <Button onClick={() => setShowExitConfirm(false)} className="w-full py-3.5 bg-zinc-800 text-white hover:bg-zinc-700">
                {t.common.cancel || "CANCEL"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {view === 'GAMEOVER' && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy size={32} className="text-purple-500" />
            </div>
            <h2 className="text-2xl font-black mb-2">{t.match3?.gameOver || "OUT OF MOVES"}</h2>
            <p className="text-zinc-400 mb-6 text-sm">{t.common.score || "Final Score"}</p>
            
            <div className="text-5xl font-black text-white mb-6">
              {score}
            </div>

            {dailyPoints >= MAX_LIMIT && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-3 rounded-xl mb-6 text-sm font-medium">
                {t.common.dailyLimit || "Daily point limit reached"}
              </div>
            )}

            <div className="space-y-3">
              {attemptsLeft > 0 ? (
                <motion.button 
                  whileTap={{ scale: 0.96 }}
                  onClick={startGame} 
                  className="w-full py-3.5 !bg-white !text-black hover:!bg-zinc-200 rounded-2xl font-bold transition-colors"
                >
                  {t.arenaGame.tryAgain || "PLAY AGAIN"} ({attemptsLeft} left)
                </motion.button>
              ) : (
                <Button disabled className="w-full py-3.5 bg-zinc-800 text-zinc-500">
                  {t.arenaGame.noAttempts || "NO ATTEMPTS LEFT"}
                </Button>
              )}
              <Button onClick={() => setView('MAIN')} className="w-full py-3.5 bg-zinc-800 text-white hover:bg-zinc-700">
                {t.common.backToMenu || "BACK TO MENU"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {view === 'NO_ATTEMPTS' && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={32} className="text-zinc-400" />
            </div>
            <h2 className="text-xl font-black mb-3">{t.arenaGame.noAttempts || "Out of Attempts"}</h2>
            <p className="text-zinc-400 mb-6 text-sm">
              {t.colorSort.noAttempts || "You've used all your attempts for today. Come back tomorrow for more!"}
            </p>
            <motion.button 
              whileTap={{ scale: 0.96 }}
              onClick={() => setView('MAIN')} 
              className="w-full py-3.5 !bg-white !text-black hover:!bg-zinc-200 rounded-2xl font-bold transition-colors"
            >
              {t.common.backToMenu || "BACK TO MENU"}
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
};
