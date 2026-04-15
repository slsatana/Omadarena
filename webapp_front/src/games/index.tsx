import React from 'react';

import { ArenaRunner } from './ArenaRunner';
import { NeonJump } from './NeonJump';
import { CyberShield } from './CyberShield';
import { HigherLower } from './HigherLower';
import { SnakeGame } from './SnakeGame';
import { SkyStack } from './SkyStack';
import { Match3 } from './Match3';
import { ColorSort } from './ColorSort';
import { Tetris } from './Tetris';

export type GameId = 'ARENA_RUNNER' | 'NEON_JUMP' | 'CYBER_SHIELD' | 'HIGHER_LOWER' | 'SNAKE' | 'SKY_STACK' | 'MATCH3' | 'COLOR_SORT' | 'TETRIS';

export const Games: Record<GameId, React.FC> = {
  ARENA_RUNNER: ArenaRunner,
  NEON_JUMP: NeonJump,
  CYBER_SHIELD: CyberShield,
  HIGHER_LOWER: HigherLower,
  SNAKE: SnakeGame,
  SKY_STACK: SkyStack,
  MATCH3: Match3,
  COLOR_SORT: ColorSort,
  TETRIS: Tetris
};
