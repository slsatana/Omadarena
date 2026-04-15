import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, WalletTxType } from '@prisma/client';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Universal transactional method for awarding points to user.
   */
  async awardPoints(params: {
    userId: string;
    amount: number;
    type: WalletTxType;
    referenceType: string;
    referenceId: string;
    idempotencyKey?: string;
  }) {
    // 1. Validation
    if (params.amount <= 0) {
      throw new BadRequestException('Award amount must be strictly positive');
    }

    return this.prisma.$transaction(async (tx) => {
      // 2. Check Idempotency First
      if (params.idempotencyKey) {
        const existingTx = await tx.walletTransaction.findUnique({
          where: {
            userId_idempotencyKey: {
              userId: params.userId,
              idempotencyKey: params.idempotencyKey,
            },
          },
        });
        if (existingTx) {
          this.logger.warn(`Idempotency hit! Skipping award. tx_id=${existingTx.id}`);
          return existingTx;
        }
      }

      // 3. Select user wallet with strict row-lock to prevent Race Conditions
      const wallet = await tx.wallet.findUnique({
        where: { userId: params.userId },
      });

      if (!wallet) {
        throw new BadRequestException('Wallet not found');
      }

      // 4. Emulate SELECT ... FOR UPDATE via an immediate Prisma query with raw
      const [walletForUpdate] = await tx.$queryRaw<any[]>`
        SELECT id, balance FROM wallets WHERE id = ${wallet.id}::uuid FOR UPDATE;
      `;

      const currentBalance = BigInt(walletForUpdate.balance);
      const amountToAdd = BigInt(params.amount);
      const newBalance = currentBalance + amountToAdd;

      // 5. Audit Record
      const newTx = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId: params.userId,
          type: params.type,
          amount: params.amount,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          referenceType: params.referenceType,
          referenceId: params.referenceId,
          idempotencyKey: params.idempotencyKey,
        },
      });

      // 6. Final Wallet Update
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      });

      return newTx;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, // Good enough since we explicit lock
    });
  }

  /**
   * Spend points transaction
   */
  async spendPoints(params: {
    userId: string;
    amount: number;
    type: WalletTxType;
    referenceType: string;
    referenceId: string;
    idempotencyKey: string;
  }) {
    if (params.amount <= 0) {
      throw new BadRequestException('Spend amount must be strictly positive');
    }

    return this.prisma.$transaction(async (tx) => {
       /* Idempotency Check */
       const existingTx = await tx.walletTransaction.findUnique({
        where: {
          userId_idempotencyKey: {
            userId: params.userId,
            idempotencyKey: params.idempotencyKey,
          },
        },
      });
      if (existingTx) return existingTx;

      /* Lock Row */
      const [walletRow] = await tx.$queryRaw<any[]>`
        SELECT id, balance FROM wallets WHERE user_id = ${params.userId}::uuid FOR UPDATE;
      `;

      if (!walletRow) throw new BadRequestException('Wallet not found');

      const currentBalance = BigInt(walletRow.balance);
      const amountToSpend = BigInt(params.amount);

      if (currentBalance < amountToSpend) {
        throw new BadRequestException('Insufficient balance');
      }

      const newBalance = currentBalance - amountToSpend;

      const newTx = await tx.walletTransaction.create({
        data: {
          walletId: walletRow.id,
          userId: params.userId,
          type: params.type,
          amount: -params.amount,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          referenceType: params.referenceType,
          referenceId: params.referenceId,
          idempotencyKey: params.idempotencyKey,
        },
      });

      await tx.wallet.update({
        where: { id: walletRow.id },
        data: { balance: newBalance },
      });

      return newTx;
    });
  }

  /**
   * Redeem a promo code for a given user.
   */
  async redeemPromo(userId: string, code: string) {
    const promo = await this.prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promo || !promo.isActive) {
      throw new BadRequestException('Invalid or inactive promo code');
    }

    const now = new Date();
    if (now < promo.startDate || now > promo.endDate) {
      throw new BadRequestException('Promo code is expired or not yet active');
    }

    if (promo.currentUses >= promo.maxUsesGlobally) {
      throw new BadRequestException('Promo code usage limit reached');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Re-check the promo limits with a lock or just let unique constraint handle duplicates.
      const existingRedemption = await tx.promoRedemption.findUnique({
        where: { userId_promoCodeId: { userId, promoCodeId: promo.id } },
      });

      if (existingRedemption) {
        throw new BadRequestException('You have already redeemed this promo code');
      }

      // We increment usage. If multiple people do it, we rely on the logic, 
      // but actually doing an atomic update ensures no race conditions:
      const updatedPromo = await tx.promoCode.updateMany({
        where: { id: promo.id, currentUses: { lt: promo.maxUsesGlobally }, isActive: true },
        data: { currentUses: { increment: 1 } },
      });

      if (updatedPromo.count === 0) {
        throw new BadRequestException('Promo code limit reached during exact processing');
      }

      const redemption = await tx.promoRedemption.create({
        data: {
          userId,
          promoCodeId: promo.id,
        },
      });

      // Avoid nested transaction lock issues. We will award after or do it explicitly here via direct tx updates.
      // Easiest is to manually update balance here to stay inside `tx`:
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new BadRequestException('Wallet not found');

      const [walletForUpdate] = await tx.$queryRaw<any[]>`
        SELECT id, balance FROM wallets WHERE id = ${wallet.id}::uuid FOR UPDATE;
      `;

      const currentBalance = BigInt(walletForUpdate.balance);
      const amountToAdd = BigInt(promo.pointsReward);
      const newBalance = currentBalance + amountToAdd;

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId,
          type: 'PROMO_CODE',
          amount: promo.pointsReward,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          referenceType: 'PROMO',
          referenceId: promo.id,
          idempotencyKey: 'promo_' + redemption.id,
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      });

      return { success: true, awarded: promo.pointsReward, newBalance: newBalance.toString() };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    });
  }

  /**
   * Get transaction history for a user.
   */
  async getHistory(userId: string) {
    const transactions = await this.prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return transactions.map(t => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      balanceAfter: t.balanceAfter.toString(),
      referenceType: t.referenceType,
      createdAt: t.createdAt,
    }));
  }
}

