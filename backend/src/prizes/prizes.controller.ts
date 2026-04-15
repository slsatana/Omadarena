import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/v1/prizes')
export class PrizesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getPublicPrizes() {
    const prizes = await this.prisma.prize.findMany({ 
      where: { isActive: true },
      orderBy: { cost: 'asc' }
    });

    // Map Prisma models to the exact interface the frontend Shop expects
    return prizes.map(p => ({
      id: p.id,
      gameId: p.gameId,
      name: p.name,
      description: `Real prize from Omad Arena: ${p.name}`,
      pointsCost: p.cost,
      image: p.imageUrl,
      available: p.stockCount > 0,
    }));
  }
}
