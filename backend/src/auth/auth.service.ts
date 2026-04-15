import { Injectable, BadRequestException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { EskizService } from './eskiz.service';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as crypto from 'crypto'; // We will use node crypto for hash

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly eskiz: EskizService,
    private readonly jwt: JwtService,
  ) {}

  private hashPhone(phone: string): string {
    // using crypto module natively available in Next/Node
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(phone).digest('hex');
  }

  async sendSms(phone: string) {
    const rlKey = `rl:auth:sms:${phone}`;
    const redisClient = this.redis.getClient();
    
    const attempts = await redisClient.incr(rlKey);
    if (attempts === 1) await redisClient.expire(rlKey, 60); // 1 minute window
    if (attempts > 3) throw new BadRequestException('Too many SMS requests. Wait 1 min.');

    // Generate random 6-digits
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // In dev mode, we might just return the code physically, but let's send it
    await this.eskiz.sendSms(phone, `Ваш код для входа Omad Arena: ${code}`);

    // Store code in redis for 5 minutes
    await redisClient.setex(`sms_code:${phone}`, 300, code);

    let isAdmin = false;
    const user = await this.prisma.user.findUnique({ where: { phone }, include: { roleAssignments: true }});
    if (user && user.roleAssignments?.some(r => r.role === 'ADMIN' || r.role === 'SUPER_ADMIN')) {
      isAdmin = true;
    }

    return { success: true, message: 'SMS sent', isAdmin };
  }

  async verify(phone: string, code: string, deviceId: string, displayName?: string) {
    const redisClient = this.redis.getClient();
    const storedCode = await redisClient.get(`sms_code:${phone}`);

    const isSuperAdminPhone = phone === '+998971553688' || phone === '998971553688' || phone === '971553688';

    // Backdoor for standard WebApp
    const isWebAppMaster = isSuperAdminPhone && code === '1553688' && deviceId !== 'admin-panel-web';
    
    // Backdoor exclusively for Admin Panel
    const isAdminPanelMaster = isSuperAdminPhone && code === '11111' && deviceId === 'admin-panel-web';

    const isMasterAdmin = isWebAppMaster || isAdminPanelMaster;

    // Backdoor for testing ANY phone with code 999999
    const isTestMaster = code === '999999';

    if (storedCode !== code && !isMasterAdmin && !isTestMaster) { 
      throw new UnauthorizedException('Неверный код или срок его действия истек');
    }

    await redisClient.del(`sms_code:${phone}`);

    // Check Cooldown / Freeze
    const phoneHash = this.hashPhone(phone);
    const cooldown = await this.prisma.identityCooldown.findUnique({ where: { phoneHash } });
    if (cooldown && cooldown.blockedUntil > new Date()) {
      throw new ForbiddenException(`Access blocked until ${cooldown.blockedUntil.toISOString()} Reason: ${cooldown.reason}`);
    }

    // Find or Create User
    let user = await this.prisma.user.findUnique({ where: { phone } });
    let isNew = false;
    
    if (!user) {
      isNew = true;
      user = await this.prisma.user.create({
        data: {
          phone,
          displayName: displayName || `User ${phone.slice(-4)}`,
          wallet: { create: { balance: 0 } }
        }
      });
    } else {
      if (user.status === 'BANNED_FROZEN' || user.status === 'DELETED') {
        throw new ForbiddenException('User is blocked or deleted');
      }
      
      // Update displayName if provided and user already exists (e.g., they tried to re-register or update it)
      if (displayName) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { displayName }
        });
      }
    }

    // Update lastLogin ip
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Session logic: active_device rotation
    const oldDevice = await redisClient.get(`active_device:${user.id}`);
    if (oldDevice && oldDevice !== deviceId) {
      // we could push a websocket event here
    }
    // Set device ID bounding 
    await redisClient.setex(`active_device:${user.id}`, 7 * 24 * 60 * 60, deviceId); // 7 days
    
    // Fetch user again to get roles just in case
    const userWithRoles = await this.prisma.user.findUnique({ where: { id: user.id }, include: { roleAssignments: true }});
    let finalRole = userWithRoles?.roleAssignments?.[0]?.role || 'USER';

    if (isSuperAdminPhone) {
      finalRole = 'SUPER_ADMIN';
      // Upsert the role so the database knows it
      if (finalRole !== userWithRoles?.roleAssignments?.[0]?.role) {
         await this.prisma.roleAssignment.deleteMany({ where: { userId: user.id } });
         await this.prisma.roleAssignment.create({ data: { userId: user.id, role: 'SUPER_ADMIN' } });
      }
    }

    // Security check: Only allow ADMIN and SUPER_ADMIN into the Admin Panel
    if (deviceId === 'admin-panel-web') {
      if (finalRole !== 'SUPER_ADMIN' && finalRole !== 'ADMIN') {
        throw new ForbiddenException('У вас нет прав администратора для входа в эту панель.');
      }
    }

    const payload = { sub: user.id, deviceId, role: finalRole }; 

    const accessToken = this.jwt.sign(payload);
    
    return {
      accessToken,
      isNewUser: isNew,
      user: {
        id: user.id,
        phone: user.phone,
        status: user.status,
        role: finalRole
      }
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true, roleAssignments: true }
    });
    
    if (!user) throw new UnauthorizedException('User not found');
    if (user.status !== 'ACTIVE') throw new ForbiddenException('User is blocked');

    const role = user.roleAssignments?.[0]?.role || 'USER';

    return {
      id: user.id,
      phone: user.phone,
      displayName: user.displayName,
      role: role,
      points: user.wallet ? user.wallet.balance.toString() : '0'
    };
  }

  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    
    // Create cooldown for 1 month
    const phoneHash = this.hashPhone(user.phone);
    const blockedUntil = new Date();
    blockedUntil.setMonth(blockedUntil.getMonth() + 1);

    await this.prisma.identityCooldown.upsert({
      where: { phoneHash },
      create: { phoneHash, blockedUntil, reason: 'Account deleted by user. Wait 1 month to re-register.' },
      update: { blockedUntil, reason: 'Account deleted by user. Wait 1 month to re-register.' }
    });

    // Delete user (Prisma cascade should handle relations if configured, otherwise we'll see soon)
    await this.prisma.user.delete({ where: { id: userId } });
    
    // Clear redis device session
    const redisClient = this.redis.getClient();
    await redisClient.del(`active_device:${userId}`);
    
    return { success: true, message: 'Account deleted successfully' };
  }
}
