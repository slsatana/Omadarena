import { Controller, Get, Post, Param, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { JwtOptionalAuthGuard } from '../auth/jwt-optional-auth.guard';
import { v4 as uuidv4 } from 'uuid';

@Controller('api/v1/prizes')
export class PrizesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService
  ) {}

  @Get()
  async getPublicPrizes() {
    const prizes = await this.prisma.prize.findMany({ 
      where: { isActive: true },
      orderBy: { cost: 'asc' }
    });

    return prizes.map(p => ({
      id: p.id,
      gameId: p.gameId,
      name: p.name,
      description: `Real prize from Omad Arena: ${p.name}`,
      pointsCost: p.cost,
      image: p.imageUrl,
      hiddenImageUrl: p.hiddenImageUrl,
      available: p.stockCount > 0,
    }));
  }

  @UseGuards(JwtOptionalAuthGuard)
  @Post(':id/buy')
  async buyPrize(@Req() req: any, @Param('id') prizeId: string) {
    if (!req.user) {
      throw new BadRequestException('Unauthorized');
    }
    
    return this.prisma.$transaction(async (tx) => {
      // 1. Find the prize and ensure it's active and in stock using row lock (FOR UPDATE)
      const [prizeRaw] = await tx.$queryRaw<any[]>`
        SELECT id, cost, "stockCount", "imageUrl", "hiddenImageUrl" 
        FROM prizes 
        WHERE id = ${prizeId}::uuid FOR UPDATE;
      `;
      
      if (!prizeRaw) throw new BadRequestException('Prize not found');
      if (prizeRaw.stockCount <= 0) throw new BadRequestException('Out of stock');

      const cost = parseInt(prizeRaw.cost, 10);
      
      // 2. Spend points - this calls our transactional helper without a nested $transaction 
      // wait, we shouldn't nest Prisma transactions.
      // So we will just deduct balance directly here to be fully atomic within this TX.
      const userId = req.user.userId;
      
      const [walletRow] = await tx.$queryRaw<any[]>`
        SELECT id, balance FROM wallets WHERE user_id = ${userId}::uuid FOR UPDATE;
      `;
      if (!walletRow) throw new BadRequestException('Wallet not found');

      const currentBalance = BigInt(walletRow.balance);
      const amountToSpend = BigInt(cost);

      if (currentBalance < amountToSpend) {
        throw new BadRequestException('Insufficient points');
      }

      const newBalance = currentBalance - amountToSpend;

      // 3. Create Order
      const idempotencyKey = 'buy_prize_' + prizeId + '_' + Date.now(); // simple uniqueness
      const order = await tx.order.create({
        data: {
          userId,
          prizeId,
          status: 'PAID',
          cost,
          idempotencyKey
        }
      });

      // 4. Create Wallet Tx
      await tx.walletTransaction.create({
        data: {
          walletId: walletRow.id,
          userId,
          type: 'PRIZE_PURCHASE',
          amount: -cost,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          referenceType: 'ORDER',
          referenceId: order.id,
          idempotencyKey
        }
      });

      // 5. Update wallet
      await tx.wallet.update({
        where: { id: walletRow.id },
        data: { balance: newBalance }
      });

      // 6. Deduct Prize stock
      await tx.prize.update({
        where: { id: prizeId },
        data: { stockCount: prizeRaw.stockCount - 1 }
      });

      // 7. Generate Claim (QR)
      const qrCodeData = uuidv4();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // valid for 30 days

      const claim = await tx.prizeClaim.create({
        data: {
          userId,
          prizeId,
          orderId: order.id,
          qrCodeData,
          status: 'PURCHASED',
          expiresAt
        }
      });

      // return success and the real image
      return { 
        success: true, 
        qrCode: qrCodeData, 
        realImage: prizeRaw.imageUrl,
        newBalance: newBalance.toString()
      };
    });
  }
}
