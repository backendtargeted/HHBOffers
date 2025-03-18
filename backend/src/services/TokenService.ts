import jwt, { SignOptions } from 'jsonwebtoken';
import User from '../models/User';
import { env } from '../config/environment';

export class TokenService {
  static generateAccessToken(user: User): string {
    return jwt.sign(
      { 
        userId: user.id,
        role: user.role,
        email: user.email
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRATION } as SignOptions
    );
  }

  static verifyToken(token: string): jwt.JwtPayload {
    return jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
  }

  static getTokenFromHeaders(headers: any): string | null {
    const authHeader = headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }
    return null;
  }
}
