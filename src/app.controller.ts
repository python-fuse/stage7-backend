import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { CombinedAuthGuard } from './auth/combined-auth.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Protected by JWT only (users only)
  @Get('user-only')
  @UseGuards(JwtAuthGuard)
  userOnlyRoute(@Request() req) {
    return {
      message: 'This route is accessible only by authenticated users with JWT',
      user: req.user,
    };
  }

  // Protected by Combined Auth (both users and services)
  @Get('protected')
  @UseGuards(CombinedAuthGuard)
  protectedRoute(@Request() req) {
    return {
      message: 'This route accepts both JWT tokens and API keys',
      user: req.user,
      accessType: req.user.type, // 'user' or 'service'
    };
  }

  // Another combined auth example
  @Get('data')
  @UseGuards(CombinedAuthGuard)
  getData(@Request() req) {
    return {
      data: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
      ],
      accessedBy: req.user,
    };
  }
}
