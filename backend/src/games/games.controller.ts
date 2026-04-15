import { Controller, Get, Post, Body, Param, Headers, UseGuards, Request } from '@nestjs/common';
import { GamesService } from './games.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtOptionalAuthGuard } from '../auth/jwt-optional-auth.guard';

@Controller('api/v1/games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @UseGuards(JwtOptionalAuthGuard)
  @Get()
  async getGames(@Request() req: any) {
    const userId = req.user?.userId || null;
    return this.gamesService.getGames(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('leaderboards/global')
  async getGlobalLeaderboard() {
    return this.gamesService.getGlobalLeaderboard();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/leaderboard')
  async getLeaderboard(@Param('id') gameId: string) {
    return this.gamesService.getLeaderboard(gameId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/start')
  async start(@Param('id') gameId: string, @Request() req: any) {
    return this.gamesService.startGame(req.user.userId, gameId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/submit')
  async submitScore(
    @Param('id') gameId: string,
    @Body() body: any,
    @Headers('idempotency-key') idempotencyKey: string,
    @Request() req: any
  ) {
    return this.gamesService.submitScore(req.user.userId, body, idempotencyKey);
  }
}
