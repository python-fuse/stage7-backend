import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    console.log('🛡️ JwtAuthGuard - Authorization header:', authHeader);

    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    console.log('🛡️ JwtAuthGuard - handleRequest:', { err, user, info });

    if (err || !user) {
      console.log('❌ JwtAuthGuard - Authentication failed');
      throw err || new Error('Unauthorized');
    }

    console.log('✅ JwtAuthGuard - Authentication successful');
    return user;
  }
}
