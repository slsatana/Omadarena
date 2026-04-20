import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // GENERIC UTILS
  // ============================================
  private buildPaginationAndSort(params: any, defaultSortField = 'createdAt') {
    const { _start, _end, _sort, _order } = params;
    const skip = _start ? parseInt(_start, 10) : undefined;
    const take = _end && _start ? parseInt(_end, 10) - parseInt(_start, 10) : undefined;
    let orderBy = {};
    if (_sort) {
      orderBy = { [_sort]: _order ? _order.toLowerCase() : 'asc' };
    } else {
      orderBy = { [defaultSortField]: 'desc' };
    }
    return { skip, take, orderBy };
  }

  private convertBigIntToString(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (obj instanceof Date) return obj.toISOString(); // Fix Invalid Date
    if (typeof obj === 'bigint') return obj.toString();
    if (Array.isArray(obj)) return obj.map((i) => this.convertBigIntToString(i));
    if (typeof obj === 'object') {
      const res: any = {};
      for (const key of Object.keys(obj)) {
         res[key] = this.convertBigIntToString(obj[key]);
      }
      return res;
    }
    return obj;
  }

  private async logAudit(user: any, action: string, resourceType: string, resourceId: string, beforeJson?: any, afterJson?: any) {
    if (!user || user.id === 'SERVER_ADMIN') return;
    try {
      await this.prisma.auditLog.create({
        data: {
          actorUserId: user.id || null,
          actorRole: user.role || 'ADMIN',
          action,
          resourceType,
          resourceId,
          beforeJson: beforeJson || undefined,
          afterJson: afterJson || undefined
        }
      });
    } catch(e) {
      console.error('[AuditLog] Failed', e);
    }
  }

  private async genericGetList(model: string, params: any, defaultSort = 'createdAt', include?: any, extraWhere?: any) {
    const { skip, take, orderBy } = this.buildPaginationAndSort(params, defaultSort);
    
    const where: any = { ...extraWhere };
    const reservedKeys = ['_start', '_end', '_sort', '_order'];
    for (const key of Object.keys(params)) {
      if (!reservedKeys.includes(key) && params[key]) {
        where[key] = params[key];
      }
    }

    // @ts-ignore
    const [data, total] = await Promise.all([
      // @ts-ignore
      this.prisma[model].findMany({ skip, take, orderBy, include, where }),
      // @ts-ignore
      this.prisma[model].count({ where }),
    ]);
    return { data: this.convertBigIntToString(data), total };
  }

  private async genericGetOne(model: string, id: string, include?: any) {
    // @ts-ignore
    const data = await this.prisma[model].findUnique({ where: { id }, include });
    if (!data) throw new NotFoundException(`${model} not found`);
    return this.convertBigIntToString(data);
  }

  private async genericCreate(model: string, body: any, user?: any) {
    // @ts-ignore
    const data = await this.prisma[model].create({ data: body });
    if (user) await this.logAudit(user, 'CREATE', model.toUpperCase(), data.id, null, data);
    return this.convertBigIntToString(data);
  }

  private async genericUpdate(model: string, id: string, body: any, user?: any) {
    // @ts-ignore
    const before = await this.prisma[model].findUnique({ where: { id } });
    // @ts-ignore
    const data = await this.prisma[model].update({ where: { id }, data: body });
    if (user) await this.logAudit(user, 'UPDATE', model.toUpperCase(), id, before, data);
    return this.convertBigIntToString(data);
  }

  private async genericDelete(model: string, id: string, user?: any) {
    // @ts-ignore
    const before = await this.prisma[model].findUnique({ where: { id } });
    if (!before) return null;
    // @ts-ignore
    const data = await this.prisma[model].delete({ where: { id } });
    if (user) await this.logAudit(user, 'DELETE', model.toUpperCase(), id, before, null);
    return this.convertBigIntToString(data);
  }

  // ============================================
  // SPECIFIC ENDPOINTS
  // ============================================

  // USERS
  async getUsers(params: any) { 
    const result = await this.genericGetList('user', params, 'createdAt', { 
      roleAssignments: true,
      wallet: { select: { balance: true } },
      gameSessions: { include: { game: { select: { name: true } }, result: { select: { timePlayedSeconds: true } } } },
      _count: { select: { orders: true } }
    });
    result.data = result.data.map((u: any) => {
      const u2 = { ...u };
      u2.role = u2.roleAssignments?.[0]?.role || 'USER';
      
      u2.balance = u2.wallet?.balance || 0;
      u2.prizesBought = u2._count?.orders || 0;
      
      const gamesPlayed = [...new Set(u2.gameSessions?.map((s: any) => s.game?.name).filter(Boolean))];
      u2.gamesPlayedList = gamesPlayed.length > 0 ? gamesPlayed.join(', ') : '-';
      
      const validSessions = u2.gameSessions?.filter((s: any) => s.result?.timePlayedSeconds) || [];
      const totalTime = validSessions.reduce((acc: number, s: any) => acc + (s.result?.timePlayedSeconds || 0), 0);
      u2.avgTimeOnline = validSessions.length > 0 
        ? `${Math.round((totalTime / validSessions.length) / 60)} мин` 
        : '-';

      delete u2.gameSessions;
      delete u2.wallet;
      delete u2._count;
      delete u2.roleAssignments;
      return u2;
    });
    return result;
  }
  async getUser(id: string) { 
    const data = await this.genericGetOne('user', id, { roleAssignments: true }); 
    data.role = data.roleAssignments?.[0]?.role || 'USER';
    data.venueNetworkId = data.roleAssignments?.[0]?.venueNetworkId || null;
    return data;
  }
  async updateUser(id: string, body: any, user?: any) { 
    const role = body.role;
    const venueNetworkId = body.venueNetworkId;
    delete body.role;
    delete body.venueNetworkId;
    delete body.roleAssignments;

    if (role !== undefined) {
      await this.prisma.roleAssignment.deleteMany({ where: { userId: id } });
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        await this.prisma.roleAssignment.create({ data: { userId: id, role } });
      } else if (role === 'VENUE' && venueNetworkId) {
        await this.prisma.roleAssignment.create({ data: { userId: id, role, venueNetworkId } });
      }
    }
    
    return this.genericUpdate('user', id, body, user); 
  }
  async deleteUser(id: string, user?: any) { return this.genericDelete('user', id, user); }

  // GAMES
  async getGames(params: any) { 
    return this.genericGetList('game', params, 'id', { venueNetwork: { select: { id: true, name: true, isActive: true } } }); 
  }
  async getGame(id: string) { 
    const data = await this.genericGetOne('game', id); 
    
    const stats = await this.prisma.gameSession.aggregate({
      where: { gameId: id },
      _count: { id: true },
    });
    const points = await this.prisma.gameResult.aggregate({
      where: { session: { gameId: id } },
      _sum: { awardedPoints: true },
    });
    const uniqueUsers = await this.prisma.gameSession.groupBy({
      by: ['userId'],
      where: { gameId: id },
    });

    return {
      ...data,
      statsTotalSessions: stats._count.id,
      statsTotalPoints: points._sum.awardedPoints || 0,
      statsUniquePlayers: uniqueUsers.length,
    };
  }
  async updateGame(id: string, body: any, user?: any) { return this.genericUpdate('game', id, body, user); }

  // VENUE NETWORKS
  async getVenueNetworks(params: any) { 
    return this.genericGetList('venueNetwork', params, 'name'); 
  }
  
  async getVenueNetwork(id: string) { 
    const venue = await this.genericGetOne('venueNetwork', id, { games: { select: { id: true, displayName: true, imageUrl: true } } });
    if (venue && venue.games) {
      venue.gameConfigs = {};
      venue.games.forEach((g: any) => {
         venue.gameConfigs[g.id] = { displayName: g.displayName, imageUrl: g.imageUrl };
      });
      venue.games = venue.games.map((g: any) => g.id);
    }
    return venue;
  }
  
  async createVenueNetwork(body: any, user?: any) { 
    let gameIds: string[] | null = null;
    if (body.games !== undefined) {
       gameIds = Array.isArray(body.games) ? body.games : [];
       delete body.games;
    }
    let gameConfigs: any = null;
    if (body.gameConfigs !== undefined) {
       gameConfigs = body.gameConfigs;
       delete body.gameConfigs;
    }
    const created = await this.genericCreate('venueNetwork', body, user);
    if (gameIds && gameIds.length > 0) {
       await this.prisma.game.updateMany({
         where: { id: { in: gameIds } },
         data: { venueNetworkId: created.id }
       });
    }
    if (gameConfigs) {
       for (const gid of Object.keys(gameConfigs)) {
          await this.prisma.game.update({
            where: { id: gid },
            data: {
              displayName: gameConfigs[gid]?.displayName || null,
              imageUrl: gameConfigs[gid]?.imageUrl || null,
            }
          });
       }
    }
    return created;
  }
  
  async updateVenueNetwork(id: string, body: any, user?: any) { 
    let gameIds: string[] | null = null;
    if (body.games !== undefined) {
       gameIds = Array.isArray(body.games) ? body.games : [];
       delete body.games;
    }
    let gameConfigs: any = null;
    if (body.gameConfigs !== undefined) {
       gameConfigs = body.gameConfigs;
       delete body.gameConfigs;
    }
    
    let oldGameIds: string[] = [];
    if (gameIds !== null) {
      const oldGames = await this.prisma.game.findMany({ where: { venueNetworkId: id } });
      oldGameIds = oldGames.map(g => g.id);
    }

    const updated = await this.genericUpdate('venueNetwork', id, body, user);

    if (gameIds !== null) {
       const toAdd = gameIds.filter(gid => !oldGameIds.includes(gid));
       const toRemove = oldGameIds.filter(gid => !gameIds.includes(gid));

       if (toAdd.length > 0) {
         await this.prisma.game.updateMany({
           where: { id: { in: toAdd } },
           data: { venueNetworkId: id }
         });
       }

        if (toRemove.length > 0) {
          await this.prisma.game.updateMany({
            where: { id: { in: toRemove } },
            data: { venueNetworkId: null, displayName: null, imageUrl: null }
          });
        }
    }

    if (gameConfigs) {
       for (const gid of Object.keys(gameConfigs)) {
          await this.prisma.game.update({
            where: { id: gid },
            data: {
              displayName: gameConfigs[gid]?.displayName || null,
              imageUrl: gameConfigs[gid]?.imageUrl || null,
            }
          });
       }
    }

    return updated;
  }
  
  async deleteVenueNetwork(id: string, user?: any) { 
    const games = await this.prisma.game.findMany({ where: { venueNetworkId: id } });
    for (const game of games) {
      await this.prisma.prize.updateMany({
        where: { gameId: game.id },
        data: { isActive: false }
      });
    }
    await this.prisma.game.updateMany({
      where: { venueNetworkId: id },
      data: { venueNetworkId: null, displayName: null, imageUrl: null }
    });
    return this.genericDelete('venueNetwork', id, user); 
  }

  // PRIZES
  async getPrizes(params: any) { 
    return this.genericGetList('prize', params, 'createdAt', { game: { select: { id: true, name: true, displayName: true } } }); 
  }
  async getPrize(id: string) { return this.genericGetOne('prize', id); }
  async createPrize(body: any, user?: any) { return this.genericCreate('prize', body, user); }
  async updatePrize(id: string, body: any, user?: any) { return this.genericUpdate('prize', id, body, user); }
  async deletePrize(id: string, user?: any) {
    try {
      return await this.genericDelete('prize', id, user);
    } catch {
      // If foreign key constraint fails (orders/claims exist), we soft delete safely.
      const prize = await this.prisma.prize.findUnique({ where: { id } });
      if (prize) {
         if (user) await this.logAudit(user, 'SOFT_DELETE', 'PRIZE', id, prize, { isActive: false });
         const data = await this.prisma.prize.update({ 
           where: { id }, 
           data: { isActive: false, name: `[DELETED] ${prize.name}` } 
         });
         return this.convertBigIntToString(data);
      }
      return null;
    }
  }

  // PROMO CODES
  async getPromoCodes(params: any) { return this.genericGetList('promoCode', params, 'code'); }
  async getPromoCode(id: string) { return this.genericGetOne('promoCode', id); }
  async createPromoCode(body: any, user?: any) { 
    if (body.startDate) body.startDate = new Date(body.startDate);
    if (body.endDate) body.endDate = new Date(body.endDate);
    return this.genericCreate('promoCode', body, user); 
  }
  async updatePromoCode(id: string, body: any, user?: any) { 
    if (body.startDate) body.startDate = new Date(body.startDate);
    if (body.endDate) body.endDate = new Date(body.endDate);
    return this.genericUpdate('promoCode', id, body, user); 
  }
  async deletePromoCode(id: string, user?: any) { return this.genericDelete('promoCode', id, user); }

  // WALLET TRANSACTIONS (Read Only)
  async getTransactions(params: any) { 
    const extraWhere: any = {};
    if (params.userPhone) {
      extraWhere.user = { phone: { contains: params.userPhone, mode: 'insensitive' } };
      delete params.userPhone;
    }
    
    if (params.prizeId) {
      const orders = await this.prisma.order.findMany({ where: { prizeId: params.prizeId }, select: { id: true } });
      const orderIds = orders.map(o => o.id);
      extraWhere.referenceType = 'ORDER';
      extraWhere.referenceId = { in: orderIds };
      delete params.prizeId;
    } else if (params.gameId) {
      const sessions = await this.prisma.gameSession.findMany({ where: { gameId: params.gameId }, select: { id: true } });
      const sessionIds = sessions.map(s => s.id);
      
      const orders = await this.prisma.order.findMany({ where: { prize: { gameId: params.gameId } }, select: { id: true } });
      const orderIds = orders.map(o => o.id);

      extraWhere.OR = [
        { referenceType: 'GAME_SESSION', referenceId: { in: sessionIds } },
        { referenceType: 'ORDER', referenceId: { in: orderIds } }
      ];
      delete params.gameId;
    }

    const res = await this.genericGetList('walletTransaction', params, 'createdAt', { user: true }, extraWhere); 
    
    // Flatten user relation for frontend and find extra details
    const orderIds = res.data.filter((tx: any) => tx.referenceType === 'ORDER').map((tx: any) => tx.referenceId);
    const sessionIds = res.data.filter((tx: any) => tx.referenceType === 'GAME_SESSION').map((tx: any) => tx.referenceId);
    
    let claimsMap: Record<string, any> = {};
    let sessionsMap: Record<string, any> = {};

    if (orderIds.length > 0) {
      const claims = await this.prisma.prizeClaim.findMany({
        where: { orderId: { in: orderIds } },
        include: { prize: { include: { game: { include: { venueNetwork: true } } } } }
      });
      claimsMap = claims.reduce((acc, claim) => {
        acc[claim.orderId] = claim;
        return acc;
      }, {} as Record<string, any>);
    }

    if (sessionIds.length > 0) {
      const sessions = await this.prisma.gameSession.findMany({
        where: { id: { in: sessionIds } },
        include: { game: { include: { venueNetwork: true } } }
      });
      sessionsMap = sessions.reduce((acc, session) => {
        acc[session.id] = session;
        return acc;
      }, {} as Record<string, any>);
    }

    res.data = res.data.map((tx: any) => {
      let details = '';
      if (tx.referenceType === 'ORDER' && claimsMap[tx.referenceId]) {
         const claim = claimsMap[tx.referenceId];
         const shortCode = claim.qrCodeData ? claim.qrCodeData.split('-')[0].toUpperCase() : 'N/A';
         const statusStr = claim.status === 'PURCHASED' ? 'Ожидает выдачи' : (claim.status === 'REDEEMED' ? 'Выдан' : 'Истек');
         const gameName = claim.prize?.game?.name || '?';
         const venueName = claim.prize?.game?.venueNetwork?.name || 'All';
         details = `Приз: ${claim.prize?.name || '?'} | Заведение: ${venueName} | Игра: ${gameName} | Код: ${shortCode} | ${statusStr}`;
      } else if (tx.type === 'GAME_EARN' && tx.referenceType === 'GAME_SESSION' && sessionsMap[tx.referenceId]) {
         const sess = sessionsMap[tx.referenceId];
         const gameName = sess.game?.name || '?';
         const venueName = sess.game?.venueNetwork?.name || 'All';
         details = `Зачисление за игру | Заведение: ${venueName} | Игра: ${gameName}`;
      } else if (tx.type === 'GAME_EARN') {
         details = 'Зачисление за игру';
      }
      
      return { 
        ...tx, 
        userPhone: tx.user?.phone,
        details 
      };
    });
    return res;
  }
  async getTransaction(id: string) { return this.genericGetOne('walletTransaction', id); }

  // GAME SESSIONS
  async getGameSessions(params: any) {
    return this.genericGetList('gameSession', params, 'startedAt', { game: true, result: true });
  }

  // DASHBOARD STATS
  async getStats() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [totalUsers, activeGames, totalPointsRaw, prizesRedeemed, activeUsers7d, totalSessions, totalBalanceRaw] = await Promise.all([
      this.prisma.user.count({
        where: { phone: { notIn: ['+998901234567', '+998971234567', '+998931234567'] } }
      }),
      this.prisma.game.count({ where: { isActive: true } }),
      this.prisma.walletTransaction.aggregate({
        _sum: { amount: true },
        where: { type: 'GAME_EARN' }
      }),
      this.prisma.walletTransaction.count({
        where: { type: 'PRIZE_PURCHASE' }
      }),
      this.prisma.gameSession.groupBy({
        by: ['userId'],
        where: { startedAt: { gte: sevenDaysAgo } }
      }),
      this.prisma.gameSession.count(),
      this.prisma.wallet.aggregate({
        _sum: { balance: true }
      })
    ]);

    const retention = totalUsers > 0 ? Math.round((activeUsers7d.length / totalUsers) * 100) : 0;

    const chartData = [];
    for (let i = 6; i >= 0; i--) {
       const d = new Date();
       d.setDate(d.getDate() - i);
       d.setHours(0,0,0,0);
       const start = d;
       const end = new Date(start.getTime() + 86400000);
       
       const [sessCount, prizesCount, dailyUsers] = await Promise.all([
          this.prisma.gameSession.count({ where: { startedAt: { gte: start, lt: end } } }),
          this.prisma.order.count({ where: { createdAt: { gte: start, lt: end } } }),
          this.prisma.gameSession.groupBy({
             by: ['userId'],
             where: { startedAt: { gte: start, lt: end } }
          }).then(res => res.length)
       ]);

       const ds = start.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
       chartData.push({ name: ds, Игры: sessCount, Призы: prizesCount, Пользователи: dailyUsers });
    }

    return {
      totalUsers,
      activeGames,
      totalPointsAwarded: totalPointsRaw?._sum?.amount ? totalPointsRaw._sum.amount.toString() : '0',
      prizesRedeemed,
      retention,
      topRegion: 'Global',
      totalSessions,
      totalUnspentBalance: totalBalanceRaw?._sum?.balance ? totalBalanceRaw._sum.balance.toString() : '0',
      activeUsers7dCount: activeUsers7d.length,
      chartData
    };
  }

  // AUDIT LOGS
  async getAuditLogs(params: any) { 
    const result = await this.genericGetList('auditLog', params, 'createdAt', { user: true });
    
    // Map User to make it easier for refinement UI
    result.data = result.data.map((log: any) => ({
      ...log,
      userPhone: log.user?.phone || 'SERVER',
      userName: log.user?.displayName || 'SYSTEM',
    }));
    
    return result;
  }
}
