import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

// Signup DTO
export class SignupDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

// Login DTO
export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

// Response types
export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
  };
}

export interface JwtPayload {
  sub: string; // user id
  email: string;
  type: 'user'; // to distinguish from API keys
}
