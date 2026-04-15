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

  private async genericCreate(model: string, body: any) {
    // @ts-ignore
    const data = await this.prisma[model].create({ data: body });
    return this.convertBigIntToString(data);
  }

  private async genericUpdate(model: string, id: string, body: any) {
    // @ts-ignore
    const data = await this.prisma[model].update({ where: { id }, data: body });
    return this.convertBigIntToString(data);
  }

  private async genericDelete(model: string, id: string) {
    // @ts-ignore
    const data = await this.prisma[model].delete({ where: { id } });
    return this.convertBigIntToString(data);
  }

  // ============================================
  // SPECIFIC ENDPOINTS
  // ============================================

  // USERS
  async getUsers(params: any) { 
    const result = await this.genericGetList('user', params, 'createdAt', { roleAssignments: true });
    result.data = result.data.map((u: any) => {
      const u2 = { ...u };
      u2.role = u2.roleAssignments?.[0]?.role || 'USER';
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
  async updateUser(id: string, body: any) { 
    const role = body.role;
    const venueNetworkId = body.venueNetworkId;
    delete body.role;
    delete body.venueNetworkId;
    delete body.roleAssignments;

    if (role !== undefined) {
      await this.prisma.roleAssignment.deleteMany({ where: { userId: id } });
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        await this.prisma.roleAssignment.create({ data: { userId: id, role } });
      } else if (role === 'VENUE') {
        await this.prisma.roleAssignment.create({ data: { userId: id, role: 'VENUE', venueNetworkId: venueNetworkId || null } });
      }
    }
    
    return this.genericUpdate('user', id, body); 
  }
  async deleteUser(id: string) { return this.genericDelete('user', id); }

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
  async updateGame(id: string, body: any) { return this.genericUpdate('game', id, body); }

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
  
  async createVenueNetwork(body: any) { 
    let gameIds: string[] | null = null;
    if (body.games !== undefined) {
       gameIds = Array.isArray(body.games) ? body.games : [];
       delete body.games;
    }
    require("fs").appendFileSync("/tmp/backend-body.log", "\nBODY RECV: " + JSON.stringify(body)); let gameConfigs: any = null;
    if (body.gameConfigs !== undefined) {
       gameConfigs = body.gameConfigs;
       delete body.gameConfigs;
    }
    const created = await this.genericCreate('venueNetwork', body);
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
  
  async updateVenueNetwork(id: string, body: any) { 
    let gameIds: string[] | null = null;
    if (body.games !== undefined) {
       gameIds = Array.isArray(body.games) ? body.games : [];
       delete body.games;
    }
    require("fs").appendFileSync("/tmp/backend-body.log", "\nBODY RECV: " + JSON.stringify(body)); let gameConfigs: any = null;
    if (body.gameConfigs !== undefined) {
       gameConfigs = body.gameConfigs;
       delete body.gameConfigs;
    }
    
    let oldGameIds: string[] = [];
    if (gameIds !== null) {
      const oldGames = await this.prisma.game.findMany({ where: { venueNetworkId: id } });
      oldGameIds = oldGames.map(g => g.id);
    }

    const updated = await this.genericUpdate('venueNetwork', id, body);

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
  
  async deleteVenueNetwork(id: string) { 
    await this.prisma.game.updateMany({
      where: { venueNetworkId: id },
      data: { venueNetworkId: null, displayName: null, imageUrl: null }
    });
    return this.genericDelete('venueNetwork', id); 
  }

  // PRIZES
  async getPrizes(params: any) { return this.genericGetList('prize', params, 'name', { game: true }); }
  async getPrize(id: string) { return this.genericGetOne('prize', id); }
  async createPrize(body: any) { return this.genericCreate('prize', body); }
  async updatePrize(id: string, body: any) { return this.genericUpdate('prize', id, body); }
  async deletePrize(id: string) { return this.genericDelete('prize', id); }

  // PROMO CODES
  async getPromoCodes(params: any) { return this.genericGetList('promoCode', params, 'code'); }
  async getPromoCode(id: string) { return this.genericGetOne('promoCode', id); }
  async createPromoCode(body: any) { 
    body.startDate = new Date(body.startDate);
    body.endDate = new Date(body.endDate);
    return this.genericCreate('promoCode', body); 
  }
  async updatePromoCode(id: string, body: any) { 
    if (body.startDate) body.startDate = new Date(body.startDate);
    if (body.endDate) body.endDate = new Date(body.endDate);
    return this.genericUpdate('promoCode', id, body); 
  }
  async deletePromoCode(id: string) { return this.genericDelete('promoCode', id); }

  // WALLET TRANSACTIONS (Read Only)
  async getTransactions(params: any) { 
    const res = await this.genericGetList('walletTransaction', params, 'createdAt', { user: true }); 
    // Flatten user relation for frontend
    res.data = res.data.map((tx: any) => ({ ...tx, userPhone: tx.user?.phone }));
    return res;
  }
  async getTransaction(id: string) { return this.genericGetOne('walletTransaction', id); }

  // DASHBOARD STATS
  async getStats() {
    const [totalUsers, activeGames, totalPointsRaw, prizesRedeemed] = await Promise.all([
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
      })
    ]);
    return {
      totalUsers,
      activeGames,
      totalPointsAwarded: totalPointsRaw?._sum?.amount ? totalPointsRaw._sum.amount.toString() : '0',
      prizesRedeemed
    };
  }
}
