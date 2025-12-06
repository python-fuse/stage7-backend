import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { InMemoryStorage, ApiKey } from '../database/storage';
import { CreateApiKeyDto, ApiKeyResponse, ApiKeyListItem } from './keys.dto';

@Injectable()
export class KeysService {
  createApiKey(
    userId: string,
    createApiKeyDto: CreateApiKeyDto,
  ): ApiKeyResponse {
    const { name, expiresInDays } = createApiKeyDto;

    // Generate a random API key (64 characters hex)
    const key = `sk_${randomBytes(32).toString('hex')}`;

    // Calculate expiration date if provided
    let expiresAt: Date | null = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    const apiKey: ApiKey = {
      id: randomBytes(16).toString('hex'),
      key,
      userId,
      name,
      createdAt: new Date(),
      expiresAt,
      revoked: false,
      lastUsedAt: null,
    };

    InMemoryStorage.createApiKey(apiKey);

    return {
      id: apiKey.id,
      key: apiKey.key, // Only returned on creation
      name: apiKey.name,
      createdAt: apiKey.createdAt,
      expiresAt: apiKey.expiresAt,
    };
  }

  listApiKeys(userId: string): ApiKeyListItem[] {
    const apiKeys = InMemoryStorage.findApiKeysByUserId(userId);

    return apiKeys.map((apiKey) => ({
      id: apiKey.id,
      name: apiKey.name,
      createdAt: apiKey.createdAt,
      expiresAt: apiKey.expiresAt,
      revoked: apiKey.revoked,
      lastUsedAt: apiKey.lastUsedAt,
      keyPreview: apiKey.key.substring(0, 10) + '...',
    }));
  }

  revokeApiKey(userId: string, keyId: string): { message: string } {
    const apiKeys = InMemoryStorage.findApiKeysByUserId(userId);
    const apiKey = apiKeys.find((k) => k.id === keyId);

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    InMemoryStorage.updateApiKey(apiKey.key, { revoked: true });

    return { message: 'API key revoked successfully' };
  }

  validateApiKey(key: string): { userId: string; type: string } | null {
    const apiKey = InMemoryStorage.findApiKeyByKey(key);

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
    InMemoryStorage.updateApiKey(key, { lastUsedAt: new Date() });

    return {
      userId: apiKey.userId,
      type: 'service',
    };
  }
}
