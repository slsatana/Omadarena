import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VenueService {
  private readonly logger = new Logger(VenueService.name);

  constructor(private readonly prisma: PrismaService) {}

  async scanQr(qrCodeData: string, venueUserId: string) {
    const venueUserAssignments = await this.prisma.roleAssignment.findMany({
      where: { userId: venueUserId, role: 'VENUE' },
    });

    if (!venueUserAssignments.length) {
      throw new ForbiddenException('User is not a VENUE manager');
    }
    const myVenueNetworkIds = venueUserAssignments.filter(a => a.venueNetworkId).map(a => a.venueNetworkId);

    const claim = await this.prisma.prizeClaim.findFirst({
      where: { 
        qrCodeData: {
          startsWith: qrCodeData,
          mode: 'insensitive'
        }
      },
      include: {
        prize: { include: { game: true } },
        user: true,
      },
    });

    if (!claim) {
      throw new NotFoundException('QR Code not found');
    }

    if (claim.status === 'EXPIRED' || claim.expiresAt < new Date()) {
      return { status: 'EXPIRED', prizeName: claim.prize.name, message: 'Срок действия QR-кода истек' };
    }

    if (claim.status === 'REDEEMED') {
      return { status: 'REDEEMED', prizeName: claim.prize.name, message: 'QR-код уже был погашен' };
    }

    // Anti-Abuse: Must belong to same network
    const expectedNetworkId = claim.prize.game.venueNetworkId;
    if (!myVenueNetworkIds.includes(expectedNetworkId)) {
      throw new ForbiddenException('Этот приз принадлежит другой сети заведений');
    }

    return {
      status: 'VALID',
      claimId: claim.id,
      prizeName: claim.prize.name,
      userName: claim.user.displayName || claim.user.phone,
    };
  }

  async redeemQr(claimId: string, venueUserId: string, idempotencyKey: string) {
     return this.prisma.$transaction(async (tx) => {
        // Redundancy lock on Claim
        const [claimLock] = await tx.$queryRaw<any[]>`
          SELECT id, status FROM prize_claims WHERE id = ${claimId}::uuid FOR UPDATE;
        `;
        if (!claimLock) throw new NotFoundException('Claim not found');
        if (claimLock.status !== 'PURCHASED') throw new BadRequestException('Claim already redeemed or expired');

        const updated = await tx.prizeClaim.update({
          where: { id: claimId },
          data: {
            status: 'REDEEMED',
            redeemedAt: new Date(),
            redeemedByVenueUserId: venueUserId,
          }
        });

        // Audit Record can be logged here
        await tx.auditLog.create({
          data: {
            actorUserId: venueUserId,
            actorRole: 'VENUE',
            action: 'REDEEM_PRIZE',
            resourceType: 'PrizeClaim',
            resourceId: claimId,
          }
        });

        return { status: 'REDEEMED', redeemedAt: updated.redeemedAt };
     });
  }

  async getStats(venueUserId: string) {
    const venueUserAssignments = await this.prisma.roleAssignment.findMany({
      where: { userId: venueUserId, role: 'VENUE' },
    });
    const myVenueNetworkIds = venueUserAssignments
      .filter(a => a.venueNetworkId !== null)
      .map(a => a.venueNetworkId as string);

    const pending = await this.prisma.prizeClaim.count({
      where: {
        prize: { game: { venueNetworkId: { in: myVenueNetworkIds } } },

        status: 'PURCHASED'
      }
    });

    const redeemed = await this.prisma.prizeClaim.count({
      where: {
        prize: { game: { venueNetworkId: { in: myVenueNetworkIds } } },
        status: 'REDEEMED'
      }
    });

    const activeSessions = await this.prisma.gameSession.count({
      where: {
        game: { venueNetworkId: { in: myVenueNetworkIds } },
        startedAt: { gte: new Date(new Date().setHours(0,0,0,0)) }
      }
    });

    const uniquePlayersResult = await this.prisma.gameSession.groupBy({
      by: ['userId'],
      where: {
        game: { venueNetworkId: { in: myVenueNetworkIds } }
      }
    });
    const playersCount = uniquePlayersResult.length;

    const scoreStats = await this.prisma.gameResult.aggregate({
      _avg: { rawScore: true },
      where: {
        session: { game: { venueNetworkId: { in: myVenueNetworkIds } } }
      }
    });
    const avgScoreValue = scoreStats._avg.rawScore ? Math.round(scoreStats._avg.rawScore) : 0;

    return {
      players: playersCount,
      prizes: redeemed + pending,
      avgScore: avgScoreValue,
      active: activeSessions,
      pending: pending
    };
  }

  async getDetailedStats(venueUserId: string) {
    // Find all venue networks this user manages
    const venueUserAssignments = await this.prisma.roleAssignment.findMany({
      where: { userId: venueUserId, role: 'VENUE' },
    });
    const myVenueNetworkIds = venueUserAssignments
      .filter(a => a.venueNetworkId !== null)
      .map(a => a.venueNetworkId as string);

    if (!myVenueNetworkIds.length) {
      return { games: [], venueName: null };
    }

    // Get venue network info
    const venueNetwork = await this.prisma.venueNetwork.findFirst({
      where: { id: { in: myVenueNetworkIds } },
    });

    // Get all games linked to these networks
    const games = await this.prisma.game.findMany({
      where: { venueNetworkId: { in: myVenueNetworkIds } },
    });

    const gameStats = await Promise.all(
      games.map(async (game) => {
        // Unique players
        const uniquePlayers = await this.prisma.gameSession.groupBy({
          by: ['userId'],
          where: { gameId: game.id },
        });
        const playersCount = uniquePlayers.length;

        // Total / today sessions
        const totalSessions = await this.prisma.gameSession.count({ where: { gameId: game.id } });
        const todaySessions = await this.prisma.gameSession.count({
          where: {
            gameId: game.id,
            startedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        });

        // Score + time aggregations
        const resultAgg = await this.prisma.gameResult.aggregate({
          _avg: { rawScore: true, timePlayedSeconds: true },
          _max: { rawScore: true },
          _sum: { timePlayedSeconds: true, awardedPoints: true },
          where: { session: { gameId: game.id } },
        });

        // Prizes pending/redeemed
        const pendingPrizes = await this.prisma.prizeClaim.count({
          where: { prize: { gameId: game.id }, status: 'PURCHASED' },
        });
        const redeemedPrizes = await this.prisma.prizeClaim.count({
          where: { prize: { gameId: game.id }, status: 'REDEEMED' },
        });

        // Top players by best score in this game
        const topPlayerSessions = await this.prisma.gameSession.findMany({
          where: { gameId: game.id, result: { isNot: null } },
          include: {
            user: { select: { displayName: true, phone: true } },
            result: { select: { rawScore: true, timePlayedSeconds: true, awardedPoints: true } },
          },
          orderBy: { result: { rawScore: 'desc' } },
          take: 50,
        });

        // Aggregate per-user: take the best score per user
        const playerMap: Record<string, { name: string; bestScore: number; totalTimeSec: number; totalPoints: number; sessions: number }> = {};
        for (const session of topPlayerSessions) {
          const uid = session.userId;
          const phone = session.user.phone;
          const name = session.user.displayName || ('***' + phone.slice(-4));
          if (!playerMap[uid]) {
            playerMap[uid] = { name, bestScore: 0, totalTimeSec: 0, totalPoints: 0, sessions: 0 };
          }
          playerMap[uid].bestScore = Math.max(playerMap[uid].bestScore, session.result?.rawScore ?? 0);
          playerMap[uid].totalTimeSec += session.result?.timePlayedSeconds ?? 0;
          playerMap[uid].totalPoints += session.result?.awardedPoints ?? 0;
          playerMap[uid].sessions += 1;
        }

        const topPlayers = Object.values(playerMap)
          .sort((a, b) => b.bestScore - a.bestScore)
          .slice(0, 10)
          .map(p => ({
            name: p.name,
            bestScore: p.bestScore,
            totalTimeSec: p.totalTimeSec,
            totalPoints: p.totalPoints,
            sessions: p.sessions,
          }));

        return {
          gameId: game.id,
          gameName: game.displayName || game.name,
          imageUrl: game.imageUrl || null,
          isActive: game.isActive,
          playersCount,
          totalSessions,
          todaySessions,
          avgScore: resultAgg._avg.rawScore ? Math.round(resultAgg._avg.rawScore) : 0,
          maxScore: resultAgg._max.rawScore ?? 0,
          avgTimePlayedSec: resultAgg._avg.timePlayedSeconds ? Math.round(resultAgg._avg.timePlayedSeconds) : 0,
          totalTimePlayedSec: Number(resultAgg._sum.timePlayedSeconds ?? 0),
          totalPointsAwarded: Number(resultAgg._sum.awardedPoints ?? 0),
          pendingPrizes,
          redeemedPrizes,
          topPlayers,
        };
      })
    );

    return {
      venueName: venueNetwork?.name ?? null,
      games: gameStats,
    };
  }
}
