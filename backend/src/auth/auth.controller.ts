import { Controller, Post, Body, Get, Req, UseGuards, HttpCode, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SendSmsDto, VerifySmsDto } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-sms')
  @HttpCode(200)
  async sendSms(@Body() dto: SendSmsDto) {
    return this.authService.sendSms(dto.phone);
  }

  @Post('verify')
  @HttpCode(200)
  async verify(@Body() dto: VerifySmsDto) {
    return this.authService.verify(dto.phone, dto.code, dto.deviceId, dto.displayName);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: any) {
    return this.authService.getMe(req.user.userId);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  async deleteAccount(@Req() req: any) {
    return this.authService.deleteAccount(req.user.userId);
  }
}
