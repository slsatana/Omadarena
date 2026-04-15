import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { EskizService } from './eskiz.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'SUPER_SECRET_FALLBACK',
      signOptions: { expiresIn: '7d' }, // 7 days long lived for mobile mainly
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, EskizService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
