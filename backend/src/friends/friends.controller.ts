import { Controller, Get, Post, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Friends')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get()
  async getFriends(@Req() req: any) {
    return this.friendsService.getFriends(req.user.userId);
  }

  @Get('pending')
  async getPendingRequests(@Req() req: any) {
    return this.friendsService.getPendingRequests(req.user.userId);
  }

  @Get('leaderboard')
  async getLeaderboard(@Req() req: any) {
    return this.friendsService.getFriendsLeaderboard(req.user.userId);
  }

  @Get('my-code')
  async getMyCode(@Req() req: any) {
    const code = await this.friendsService.ensureFriendCode(req.user.userId);
    return { friendCode: code };
  }

  @Post('add')
  async addFriend(@Req() req: any, @Body() body: { friendCode: string }) {
    return this.friendsService.addFriend(req.user.userId, body.friendCode);
  }

  @Post(':id/accept')
  async acceptFriend(@Req() req: any, @Param('id') id: string) {
    return this.friendsService.acceptFriend(req.user.userId, id);
  }

  @Delete(':id')
  async removeFriend(@Req() req: any, @Param('id') id: string) {
    return this.friendsService.removeFriend(req.user.userId, id);
  }
}
