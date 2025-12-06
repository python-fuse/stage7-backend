import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { KeysService } from '../keys/keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private keysService: KeysService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    const result = this.keysService.validateApiKey(apiKey);

    if (!result) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Attach user info to request
    request.user = result;
    return true;
  }
}
