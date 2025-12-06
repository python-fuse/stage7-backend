import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsNumber()
  expiresInDays?: number; // Optional: API key expiration in days
}

export interface ApiKeyResponse {
  id: string;
  key: string;
  name: string;
  createdAt: Date;
  expiresAt: Date | null;
}

export interface ApiKeyListItem {
  id: string;
  name: string;
  createdAt: Date;
  expiresAt: Date | null;
  revoked: boolean;
  lastUsedAt: Date | null;
  keyPreview: string; // Only show first few characters
}
