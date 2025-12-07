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
import { Repository } from 'typeorm';
import { User as UserEntity } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async signup(signupDto: SignupDto): Promise<AuthResponse> {
    const { email, password } = signupDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
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

    await this.userRepository.save(user);

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
    const user = await this.userRepository.findOne({ where: { email } });
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

    const token = this.jwtService.sign(payload);
    console.log('🔐 Token signed with payload:', payload);
    console.log('🔐 Generated token:', token);

    return token;
  }

  async validateUser(userId: string): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { id: userId } }) as Promise<
      User | undefined
    >;
  }
}
