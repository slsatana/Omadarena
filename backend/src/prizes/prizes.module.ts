import { Module } from '@nestjs/common';
import { PrizesController } from './prizes.controller';
import { PrismaService } from '../prisma/prisma.service';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [WalletModule],
  controllers: [PrizesController],
  providers: [PrismaService],
})
export class PrizesModule {}
