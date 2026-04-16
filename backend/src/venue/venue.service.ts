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
}
