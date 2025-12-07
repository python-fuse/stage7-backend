import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  expiresInDays?: number;
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
  keyPreview: string;
}
