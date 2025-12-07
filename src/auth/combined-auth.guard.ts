import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { KeysService } from '../keys/keys.service';
import { AuthService } from './auth.service';

/**
 * Combined Auth Guard that accepts both:
 * 1. JWT Bearer tokens (for user authentication)
 * 2. API Keys (for service-to-service authentication)
 *
 * Priority:
 * - Checks for Bearer token first
 * - Falls back to x-api-key header if no Bearer token
 * - Throws error if neither is present or both are invalid
 */
@Injectable()
export class CombinedAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
    private keysService: KeysService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Extract Bearer token
    const bearerToken = this.extractBearerToken(request);

    // Extract API key
    const apiKey = request.headers['x-api-key'];

    // Try JWT authentication first
    if (bearerToken) {
      console.log('Attempting JWT authentication', bearerToken);
      try {
        const payload = this.jwtService.verify(bearerToken, {
          secret:
            process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        });

        const user = this.authService.validateUser(payload.sub);

        if (!user) {
          throw new UnauthorizedException('User not found');
        }

        request.user = {
          userId: payload.sub,
          email: payload.email,
          type: 'user',
        };

        return true;
      } catch (error) {
        // If JWT is invalid, throw error (don't fall back to API key)
        throw new UnauthorizedException('Invalid or expired token');
      }
    }

    // Try API key authentication
    if (apiKey) {
      const result = await this.keysService.validateApiKey(apiKey);

      if (!result) {
        throw new UnauthorizedException('Invalid API key');
      }

      request.user = result;
      return true;
    }

    // Neither authentication method provided
    throw new UnauthorizedException(
      'Authentication required: Provide Bearer token or x-api-key header',
    );
  }

  private extractBearerToken(request: any): string | null {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }
}
