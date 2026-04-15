import { Module } from '@nestjs/common';
import { PrizesController } from './prizes.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PrizesController],
  providers: [PrismaService],
})
export class PrizesModule {}
