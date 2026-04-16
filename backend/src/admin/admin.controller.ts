import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Res, UseGuards, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Admin REST (Refine.dev)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('api/v1/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  private sendListResponse(res: Response, result: { data: any, total: number }) {
    res.setHeader('X-Total-Count', result.total);
    res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count');
    return res.json(result.data);
  }

  // ==================== DASHBOARD STATS ====================
  @Get('stats')
  @ApiOperation({ summary: 'Get Dashboard Stats' })
  async getStats(@Res() res: Response) {
    return res.json(await this.adminService.getStats());
  }

  // ==================== USERS ====================
  @Get('users')
  async getUsers(@Query() query: any, @Res() res: Response) {
    return this.sendListResponse(res, await this.adminService.getUsers(query));
  }
  @Get('users/:id')
  async getUser(@Param('id') id: string) { return this.adminService.getUser(id); }
  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() body: any, @Req() req: any) { return this.adminService.updateUser(id, body, req.user); }
  @Delete('users/:id')
  async deleteUser(@Param('id') id: string, @Req() req: any) { return this.adminService.deleteUser(id, req.user); }

  // ==================== GAMES ====================
  @Get('games')
  async getGames(@Query() query: any, @Res() res: Response) {
    return this.sendListResponse(res, await this.adminService.getGames(query));
  }
  @Get('games/:id')
  async getGame(@Param('id') id: string) { return this.adminService.getGame(id); }
  @Patch('games/:id')
  async updateGame(@Param('id') id: string, @Body() body: any, @Req() req: any) { return this.adminService.updateGame(id, body, req.user); }

  // ==================== VENUE NETWORKS ====================
  @Get('venue_networks')
  async getVenueNetworks(@Query() query: any, @Res() res: Response) {
    return this.sendListResponse(res, await this.adminService.getVenueNetworks(query));
  }
  @Get('venue_networks/:id')
  async getVenueNetwork(@Param('id') id: string) { return this.adminService.getVenueNetwork(id); }
  @Post('venue_networks')
  async createVenueNetwork(@Body() body: any, @Req() req: any) { return this.adminService.createVenueNetwork(body, req.user); }
  @Patch('venue_networks/:id')
  async updateVenueNetwork(@Param('id') id: string, @Body() body: any, @Req() req: any) { return this.adminService.updateVenueNetwork(id, body, req.user); }
  @Delete('venue_networks/:id')
  async deleteVenueNetwork(@Param('id') id: string, @Req() req: any) { return this.adminService.deleteVenueNetwork(id, req.user); }

  // ==================== PRIZES ====================
  @Get('prizes')
  async getPrizes(@Query() query: any, @Res() res: Response) {
    return this.sendListResponse(res, await this.adminService.getPrizes(query));
  }
  @Get('prizes/:id')
  async getPrize(@Param('id') id: string) { return this.adminService.getPrize(id); }
  @Post('prizes')
  async createPrize(@Body() body: any, @Req() req: any) { 
    if(body.cost) body.cost = parseInt(body.cost, 10);
    if(body.stockCount) body.stockCount = parseInt(body.stockCount, 10);
    return this.adminService.createPrize(body, req.user); 
  }
  @Patch('prizes/:id')
  async updatePrize(@Param('id') id: string, @Body() body: any, @Req() req: any) { 
    if(body.cost) body.cost = parseInt(body.cost, 10);
    if(body.stockCount) body.stockCount = parseInt(body.stockCount, 10);
    return this.adminService.updatePrize(id, body, req.user); 
  }
  @Delete('prizes/:id')
  async deletePrize(@Param('id') id: string, @Req() req: any) { return this.adminService.deletePrize(id, req.user); }

  // ==================== PROMO CODES ====================
  @Get('promo_codes')
  async getPromoCodes(@Query() query: any, @Res() res: Response) {
    return this.sendListResponse(res, await this.adminService.getPromoCodes(query));
  }
  @Get('promo_codes/:id')
  async getPromoCode(@Param('id') id: string) { return this.adminService.getPromoCode(id); }
  @Post('promo_codes')
  async createPromoCode(@Body() body: any, @Req() req: any) { 
    if(body.pointsReward) body.pointsReward = parseInt(body.pointsReward, 10);
    if(body.maxUsesGlobally) body.maxUsesGlobally = parseInt(body.maxUsesGlobally, 10);
    return this.adminService.createPromoCode(body, req.user); 
  }
  @Patch('promo_codes/:id')
  async updatePromoCode(@Param('id') id: string, @Body() body: any, @Req() req: any) { 
    if(body.pointsReward) body.pointsReward = parseInt(body.pointsReward, 10);
    if(body.maxUsesGlobally) body.maxUsesGlobally = parseInt(body.maxUsesGlobally, 10);
    return this.adminService.updatePromoCode(id, body, req.user); 
  }
  @Delete('promo_codes/:id')
  async deletePromoCode(@Param('id') id: string, @Req() req: any) { return this.adminService.deletePromoCode(id, req.user); }

  // ==================== AUDIT LOGS ====================
  @Get('audit_logs')
  async getAuditLogs(@Query() query: any, @Res() res: Response) {
    return this.sendListResponse(res, await this.adminService.getAuditLogs(query));
  }

  // ==================== TRANSACTIONS ====================
  @Get('wallet_transactions')
  async getTransactions(@Query() query: any, @Res() res: Response) {
    return this.sendListResponse(res, await this.adminService.getTransactions(query));
  }
  @Get('wallet_transactions/:id')
  async getTransaction(@Param('id') id: string) { return this.adminService.getTransaction(id); }
}
