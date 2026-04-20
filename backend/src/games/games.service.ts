import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { randomUUID } from 'crypto';

@Injectable()
export class GamesService {


  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) {}

  private getTashkentDate(): Date {
    const rawFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tashkent',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = rawFormatter.formatToParts(new Date());
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  }

  async getGames(userId: string) {
    const games = await this.prisma.game.findMany({ include: { venueNetwork: true } });
    const dateKey = this.getTashkentDate();
    const startOfDay = dateKey;
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    let usages: any[] = [];
    let resultsToday: any[] = [];

    if (userId) {
      usages = await this.prisma.dailyAttemptProgression.findMany({
        where: { userId, dateKey }
      });

      resultsToday = await this.prisma.gameResult.findMany({
        where: {
          session: { userId },
          reviewStatus: 'ACCEPTED',
          createdAt: { gte: startOfDay, lt: endOfDay }
        },
        include: { session: true }
      });
    }

    return games.map(g => {
      const used = usages.find(u => u.gameId === g.id)?.attemptsUsed || 0;
      const pointsEarnedToday = resultsToday
        .filter(r => r.session.gameId === g.id)
        .reduce((sum, r) => sum + r.awardedPoints, 0);

      return {
        id: g.id,
        name: g.name,
        venueNetworkName: g.venueNetwork?.name || null,
        attemptsUsedToday: used,
        attemptsLeft: g.dailyAttemptsLimit === 0 ? 999 : Math.max(0, g.dailyAttemptsLimit - used),
        pointsEarnedToday,
        dailyPointsLimit: g.dailyPointsLimit,
        imageUrl: g.imageUrl,
        displayName: g.displayName,
        isActive: g.isActive
      };
    });
  }

  async getLeaderboard(gameId: string) {
    const results = await this.prisma.gameResult.findMany({
      where: {
        reviewStatus: 'ACCEPTED',
        session: {
          gameId,
          status: 'SUBMITTED',
          user: {
            roleAssignments: {
              none: {
                role: { in: ['ADMIN', 'SUPER_ADMIN', 'VENUE'] }
              }
            }
          }
        }
      },
      include: {
        session: { include: { user: true } }
      },
      orderBy: { rawScore: 'desc' },
      take: 500
    });

    const leaderboard = [];
    const seenUsers = new Set<string>();
    
    for (const r of results) {
      if (leaderboard.length >= 10) break;
      const userId = r.session.userId;
      if (!seenUsers.has(userId)) {
        seenUsers.add(userId);
          leaderboard.push({
            rank: leaderboard.length + 1,
            name: r.session.user.displayName || `User ${r.session.user.phone.slice(-4)}`,
            score: r.rawScore,
            friendCode: r.session.user.friendCode,
            avatarUrl: r.session.user.avatarUrl
          });
      }
    }
    return leaderboard;
  }

  async getGlobalLeaderboard() {
    const wallets = await this.prisma.wallet.findMany({
      where: {
        user: {
          roleAssignments: {
            none: {
              role: { in: ['ADMIN', 'SUPER_ADMIN', 'VENUE'] }
            }
          }
        }
      },
      orderBy: { balance: 'desc' },
      take: 100,
      include: { user: true }
    });

    return wallets.map((w, index) => ({
      rank: index + 1,
      name: w.user.displayName || `User ${w.user.phone.slice(-4)}`,
      score: Number(w.balance),
      friendCode: w.user.friendCode,
      avatarUrl: w.user.avatarUrl
    }));
  }

  async startGame(userId: string, gameId: string) {
    const dateKey = this.getTashkentDate();

    // Verify constraints inside transaction
    return this.prisma.$transaction(async (tx) => {
      let daily = await tx.dailyAttemptProgression.findUnique({
        where: { userId_gameId_dateKey: { userId, gameId, dateKey } },
      });

      if (!daily) {
        daily = await tx.dailyAttemptProgression.create({
          data: { userId, gameId, dateKey, attemptsUsed: 0 },
        });
      }

      const game = await tx.game.findUnique({ where: { id: gameId } });
      if (!game) throw new BadRequestException('Game not found');

      if (game.dailyAttemptsLimit > 0 && daily.attemptsUsed >= game.dailyAttemptsLimit) {
        throw new ForbiddenException(`Daily limit of ${game.dailyAttemptsLimit} attempts reached for this game.`);
      }

      await tx.dailyAttemptProgression.update({
        where: { id: daily.id },
        data: { attemptsUsed: daily.attemptsUsed + 1 },
      });

      const session = await tx.gameSession.create({
        data: {
          userId,
          gameId,
          sessionTokenJti: randomUUID(), // Server signed token ID
          status: 'STARTED',
        },
      });

      return {
        sessionId: session.id,
        sessionToken: session.sessionTokenJti, // Signed token simulating a real JWT
      };
    });
  }

  async submitScore(userId: string, payload: any, idempotencyKey: string) {
    const session = await this.prisma.gameSession.findUnique({
      where: { id: payload.sessionId },
      include: { game: true },
    });

    if (!session || session.userId !== userId) {
      throw new ForbiddenException('Invalid session');
    }
    if (session.status !== 'STARTED') {
      throw new BadRequestException('Session already processed');
    }

    // 1. Anti-Cheat Simulation (Speed checks, etc)
    const rawScore = payload.score;
    const timePlayed = payload.timePlayedSeconds || 1;
    if ((rawScore / timePlayed) > session.game.maxScorePerMinute) {
      // Flag as frozen/audit
      await this.prisma.gameSession.update({
        where: { id: session.id },
        data: { status: 'REJECTED' },
      });
      await this.prisma.gameResult.create({
        data: {
          sessionId: session.id, rawScore, timePlayedSeconds: timePlayed,
          awardedPoints: 0, reviewStatus: 'REJECTED', rejectReason: 'Max Score Threshold Exceeded'
        }
      });
      throw new ForbiddenException('Score rejected due to anomaly detection');
    }

    // 2. Conversion & Logic
    const pointsRatio = Number(session.game.scoreToPointsRatio);
    const convertedPoints = Math.ceil(rawScore * pointsRatio);

    // 3. Apply Daily Cap Limits 5000 (Asia/Tashkent bound)
    const startOfDay = this.getTashkentDate();
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const earningsToday = await this.prisma.gameResult.aggregate({
      where: {
        session: { userId, gameId: session.game.id },
        reviewStatus: 'ACCEPTED',
        createdAt: { gte: startOfDay, lt: endOfDay }
      },
      _sum: { awardedPoints: true }
    });

    const currentEarned = earningsToday._sum.awardedPoints || 0;
    let awardedPoints = 0;
    const dailyCap = session.game.dailyPointsLimit;
    if (currentEarned < dailyCap) {
      awardedPoints = Math.min(convertedPoints, dailyCap - currentEarned);
    }

    // 4. SQL Execution Pipeline
    return this.prisma.$transaction(async (tx) => {
      await tx.gameSession.update({
        where: { id: session.id },
        data: { status: 'SUBMITTED', endedAt: new Date() },
      });

      const result = await tx.gameResult.create({
        data: {
          sessionId: session.id,
          rawScore,
          timePlayedSeconds: timePlayed,
          awardedPoints,
          reviewStatus: 'ACCEPTED',
        },
      });

      if (awardedPoints > 0) {
        await this.walletService.awardPoints({
          userId,
          amount: awardedPoints,
          type: 'GAME_EARN',
          referenceType: 'GAME_SESSION',
          referenceId: session.id,
          idempotencyKey,
        });
      }

      return {
        awardedPoints,
        reviewStatus: 'ACCEPTED'
      };
    });
  }
}
