import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { WalletModule } from './wallet/wallet.module';
import { GamesModule } from './games/games.module';
import { VenueModule } from './venue/venue.module';
import { AdminModule } from './admin/admin.module';
import { PrizesModule } from './prizes/prizes.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [PrismaModule, RedisModule, AuthModule, WalletModule, GamesModule, VenueModule, AdminModule, PrizesModule, UploadModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
