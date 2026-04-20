import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class FriendsService {
  constructor(private readonly prisma: PrismaService) {}

  private generateFriendCode(): string {
    // 6 character alphanumeric code (e.g. OMAD42)
    return randomBytes(3).toString('hex').toUpperCase();
  }

  async ensureFriendCode(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    
    if ((user as any).friendCode) return (user as any).friendCode;
    
    // Generate unique code
    let code = this.generateFriendCode();
    let attempts = 0;
    while (attempts < 10) {
      const exists = await this.prisma.user.findFirst({ where: { friendCode: code } as any });
      if (!exists) break;
      code = this.generateFriendCode();
      attempts++;
    }
    
    await this.prisma.user.update({
      where: { id: userId },
      data: { friendCode: code } as any
    });
    
    return code;
  }

  async getFriends(userId: string) {
    await this.ensureFriendCode(userId);
    
    const [sent, received] = await Promise.all([
      (this.prisma as any).friendship.findMany({
        where: { userId, status: 'ACCEPTED' },
        include: { friend: { select: { id: true, displayName: true, avatarUrl: true, friendCode: true } } }
      }),
      (this.prisma as any).friendship.findMany({
        where: { friendId: userId, status: 'ACCEPTED' },
        include: { user: { select: { id: true, displayName: true, avatarUrl: true, friendCode: true } } }
      })
    ]);

    const friends = [
      ...sent.map((f: any) => ({ ...f.friend, friendshipId: f.id })),
      ...received.map((f: any) => ({ ...f.user, friendshipId: f.id }))
    ];

    // Get wallet balances for leaderboard
    const friendIds = friends.map((f: any) => f.id);
    const wallets = await this.prisma.wallet.findMany({
      where: { userId: { in: friendIds } },
      select: { userId: true, balance: true }
    });
    const walletMap = wallets.reduce((acc: any, w) => { acc[w.userId] = Number(w.balance); return acc; }, {});

    return friends.map((f: any, i: number) => ({
      ...f,
      score: walletMap[f.id] || 0,
    })).sort((a: any, b: any) => b.score - a.score)
      .map((f: any, i: number) => ({ ...f, rank: i + 1 }));
  }

  async getPendingRequests(userId: string) {
    return (this.prisma as any).friendship.findMany({
      where: { friendId: userId, status: 'PENDING' },
      include: { user: { select: { id: true, displayName: true, avatarUrl: true, friendCode: true } } }
    });
  }

  async addFriend(userId: string, friendCode: string) {
    if (!friendCode || friendCode.trim().length < 4) {
      throw new BadRequestException('Invalid friend code');
    }
    
    const targetUser = await this.prisma.user.findFirst({
      where: { friendCode: friendCode.trim().toUpperCase() } as any
    });
    
    if (!targetUser) throw new NotFoundException('User with this friend code not found');
    if (targetUser.id === userId) throw new BadRequestException('You cannot add yourself');
    
    // Check if already friends or pending
    const existing = await (this.prisma as any).friendship.findFirst({
      where: {
        OR: [
          { userId, friendId: targetUser.id },
          { userId: targetUser.id, friendId: userId }
        ]
      }
    });
    
    if (existing) {
      if (existing.status === 'ACCEPTED') throw new BadRequestException('Already friends');
      if (existing.status === 'PENDING') throw new BadRequestException('Friend request already sent');
    }
    
    await (this.prisma as any).friendship.create({
      data: { userId, friendId: targetUser.id, status: 'PENDING' }
    });
    
    return { success: true, message: 'Friend request sent', name: targetUser.displayName || `User ${targetUser.phone.slice(-4)}` };
  }

  async acceptFriend(userId: string, friendshipId: string) {
    const friendship = await (this.prisma as any).friendship.findUnique({
      where: { id: friendshipId }
    });
    
    if (!friendship || friendship.friendId !== userId) {
      throw new NotFoundException('Friend request not found');
    }
    
    await (this.prisma as any).friendship.update({
      where: { id: friendshipId },
      data: { status: 'ACCEPTED' }
    });
    
    return { success: true };
  }

  async removeFriend(userId: string, friendshipId: string) {
    const friendship = await (this.prisma as any).friendship.findFirst({
      where: {
        id: friendshipId,
        OR: [{ userId }, { friendId: userId }]
      }
    });
    
    if (!friendship) throw new NotFoundException('Friendship not found');
    
    await (this.prisma as any).friendship.delete({ where: { id: friendshipId } });
    
    return { success: true };
  }

  async getFriendsLeaderboard(userId: string) {
    const friends = await this.getFriends(userId);
    // Add current user
    const me = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true }
    });
    
    if (me) {
      friends.push({
        id: me.id,
        displayName: me.displayName,
        avatarUrl: (me as any).avatarUrl || null,
        friendCode: (me as any).friendCode || null,
        score: me.wallet ? Number(me.wallet.balance) : 0,
        isMe: true,
        rank: 0,
        friendshipId: null
      } as any);
    }
    
    return friends.sort((a: any, b: any) => b.score - a.score)
      .map((f: any, i: number) => ({ ...f, rank: i + 1 }));
  }
}
