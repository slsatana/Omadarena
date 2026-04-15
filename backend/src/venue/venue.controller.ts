import { Controller, Post, Body, Headers, UseGuards, Request, Get } from '@nestjs/common';
import { VenueService } from './venue.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/v1/venue')
export class VenueController {
  constructor(private readonly venueService: VenueService) {}

  @Post('scan')
  async scanQr(@Body('qrCodeData') qrCodeData: string, @Request() req: any) {
    return this.venueService.scanQr(qrCodeData, req.user.userId);
  }

  @Post('redeem')
  async redeemQr(
    @Body('claimId') claimId: string,
    @Headers('idempotency-key') idempotencyKey: string,
    @Request() req: any
  ) {
    return this.venueService.redeemQr(claimId, req.user.userId, idempotencyKey || 'auto-gen');
  }

  @Get('stats')
  async getStats(@Request() req: any) {
    return this.venueService.getStats(req.user.userId);
  }
}
