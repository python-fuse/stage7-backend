import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { InMemoryStorage, ApiKey } from '../database/storage';
import { CreateApiKeyDto, ApiKeyResponse, ApiKeyListItem } from './keys.dto';
import { Repository } from 'typeorm';
import { ApiKey as ApiKeyEntity } from './keys.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class KeysService {
  constructor(
    @InjectRepository(ApiKeyEntity)
    private readonly keysRepository: Repository<ApiKeyEntity>,
  ) {}

  private hashApiKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  async createApiKey(
    userId: string,
    createApiKeyDto: CreateApiKeyDto,
  ): Promise<ApiKeyResponse> {
    const { name, expiresInDays } = createApiKeyDto;

    // Generate a random API key (64 characters hex)
    const key = `sk_${randomBytes(32).toString('hex')}`;
    const hashedKey = this.hashApiKey(key);

    // Calculate expiration date if provided
    let expiresAt: Date | null = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    const apiKey = this.keysRepository.create({
      key: hashedKey, // Store hashed version
      userId,
      name,
      expiresAt,
      revoked: false,
      lastUsedAt: null,
    });

    await this.keysRepository.save(apiKey);

    // Return the plain key only once - user must save it!
    return {
      id: apiKey.id,
      key: key, // Return plain key (not hashed)
      name: apiKey.name,
      createdAt: apiKey.createdAt,
      expiresAt: apiKey.expiresAt,
    };
  }

  async listApiKeys(userId: string): Promise<ApiKeyListItem[]> {
    const apiKeys = await this.keysRepository.find({ where: { userId } });

    return apiKeys.map((apiKey) => ({
      id: apiKey.id,
      name: apiKey.name,
      createdAt: apiKey.createdAt,
      expiresAt: apiKey.expiresAt,
      revoked: apiKey.revoked,
      lastUsedAt: apiKey.lastUsedAt,
    }));
  }

  async revokeApiKey(
    userId: string,
    keyId: string,
  ): Promise<{ message: string }> {
    const apiKeys = await this.keysRepository.find({ where: { userId } });
    const apiKey = apiKeys.find((k) => k.id === keyId);

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    await this.keysRepository.update(apiKey.id, { revoked: true });

    return { message: 'API key revoked successfully' };
  }

  async validateApiKey(
    key: string,
  ): Promise<{ userId: string; type: string } | null> {
    const hashedKey = this.hashApiKey(key);
    const apiKey = await this.keysRepository.findOne({
      where: { key: hashedKey },
    });

    if (!apiKey) {
      return null;
    }

    // Check if revoked
    if (apiKey.revoked) {
      throw new UnauthorizedException('API key has been revoked');
    }

    // Check if expired
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      throw new UnauthorizedException('API key has expired');
    }

    // Update last used timestamp
    await this.keysRepository.update(apiKey.id, { lastUsedAt: new Date() });

    return {
      userId: apiKey.userId,
      type: 'service',
    };
  }
}
