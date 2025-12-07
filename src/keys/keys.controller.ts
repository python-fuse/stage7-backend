import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { KeysService } from './keys.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateApiKeyDto } from './keys.dto';
import type { ApiKeyResponse, ApiKeyListItem } from './keys.dto';

@Controller('keys')
@UseGuards(JwtAuthGuard)
export class KeysController {
  constructor(private readonly keysService: KeysService) {}

  @Post('create')
  createApiKey(
    @Body() createApiKeyDto: CreateApiKeyDto,
    @Request() req,
  ): ApiKeyResponse {
    return this.keysService.createApiKey(req.user.userId, createApiKeyDto);
  }

  @Get()
  async listApiKeys(@Request() req): Promise<ApiKeyListItem[]> {
    return this.keysService.listApiKeys(req.user.userId);
  }

  @Delete(':keyId')
  async revokeApiKey(
    @Param('keyId') keyId: string,
    @Request() req,
  ): Promise<{ message: string }> {
    return this.keysService.revokeApiKey(req.user.userId, keyId);
  }
}
