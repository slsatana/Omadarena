import { Controller, Post, Get, Body, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtOptionalAuthGuard } from '../auth/jwt-optional-auth.guard'; // Wait, let me check if we use JwtAuthGuard. Actually I can use the existing guard.

@Controller('api/v1/wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @UseGuards(JwtOptionalAuthGuard)
  @Post('redeem-promo')
  async redeemPromo(@Req() req: any, @Body() body: { code: string }) {
    if (!req.user) {
      throw new BadRequestException('Unauthorized');
    }
    if (!body.code) {
      throw new BadRequestException('Code is required');
    }
    const result = await this.walletService.redeemPromo(req.user.userId, body.code);
    return result;
  }

  @UseGuards(JwtOptionalAuthGuard)
  @Get('history')
  async getHistory(@Req() req: any) {
    if (!req.user) {
      throw new BadRequestException('Unauthorized');
    }
    return this.walletService.getHistory(req.user.userId);
  }
}

