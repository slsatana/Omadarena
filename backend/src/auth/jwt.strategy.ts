import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly redis: RedisService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'SUPER_SECRET_FALLBACK',
    });
  }

  async validate(payload: any) {
    // payload: { sub: userId, deviceId: "...", role: "USER" }
    const redisClient = this.redis.getClient();
    const activeDevice = await redisClient.get(`active_device:${payload.sub}`);
    
    // Check if the token's device ID matches the currently active device in Redis
    if (activeDevice && activeDevice !== payload.deviceId) {
      throw new UnauthorizedException('Logged in from another device');
    }

    return { userId: payload.sub, role: payload.role, deviceId: payload.deviceId };
  }
}
