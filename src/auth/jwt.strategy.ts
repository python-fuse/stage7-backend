import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtPayload } from './auth.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    const secret = configService.get<string>('JWT_SECRET') || 'fallback-secret';
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
    console.log('🔑 JWT Strategy initialized with secret:', secret);
  }

  async validate(payload: JwtPayload) {
    console.log('🔍 JWT validate called with payload:', payload);

    const user = await this.authService.validateUser(payload.sub);
    console.log('👤 User found:', user);

    if (!user) {
      console.log('❌ User not found, throwing UnauthorizedException');
      throw new UnauthorizedException('User not found');
    }

    const result = {
      userId: payload.sub,
      email: payload.email,
      type: payload.type,
    };
    console.log('✅ Returning user data:', result);
    return result;
  }
}
