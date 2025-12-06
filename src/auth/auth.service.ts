import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { InMemoryStorage, User } from '../database/storage';
import { SignupDto, LoginDto, AuthResponse, JwtPayload } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async signup(signupDto: SignupDto): Promise<AuthResponse> {
    const { email, password } = signupDto;

    // Check if user already exists
    const existingUser = InMemoryStorage.findUserByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user: User = {
      id: randomUUID(),
      email,
      password: hashedPassword,
      createdAt: new Date(),
    };

    InMemoryStorage.createUser(user);

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    // Find user
    const user = InMemoryStorage.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  private generateToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      type: 'user',
    };

    return this.jwtService.sign(payload);
  }

  validateUser(userId: string): User | undefined {
    return InMemoryStorage.findUserById(userId);
  }
}
