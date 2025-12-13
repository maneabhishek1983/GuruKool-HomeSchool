import jwt from 'jsonwebtoken';
import { AuthToken, User } from '@/types';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  sessionId?: string | undefined;
  deviceInfo?: string | undefined;
  iat?: number;
  exp?: number;
}

export class TokenService {
  private static instance: TokenService;
  private readonly JWT_SECRET: string;
  private readonly ACCESS_TOKEN_EXPIRY = '24h';
  private readonly REFRESH_TOKEN_EXPIRY = '7d';

  private constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error(
        'JWT_SECRET environment variable must be configured with at least 32 characters. ' +
          'Token signing requires a secure secret.'
      );
    }
    this.JWT_SECRET = secret;
  }

  public static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  /**
   * Generate access and refresh tokens for a user
   */
  public generateTokens(user: User, sessionId?: string, deviceInfo?: string): AuthToken {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId,
      deviceInfo,
    };

    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
      issuer: 'gurukool-homeschool',
      audience: 'gurukool-users',
    });

    const refreshToken = jwt.sign(
      { userId: user.id, tokenType: 'refresh' },
      this.JWT_SECRET,
      {
        expiresIn: this.REFRESH_TOKEN_EXPIRY,
        issuer: 'gurukool-homeschool',
        audience: 'gurukool-users',
      }
    );

    return {
      accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
  }

  /**
   * Verify and decode an access token
   */
  public verifyAccessToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET, {
        issuer: 'gurukool-homeschool',
        audience: 'gurukool-users',
      }) as TokenPayload;

      return decoded;
    } catch (error) {
      console.error('Access token verification failed:', error);
      return null;
    }
  }

  /**
   * Verify a refresh token
   */
  public verifyRefreshToken(token: string): { userId: string } | null {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET, {
        issuer: 'gurukool-homeschool',
        audience: 'gurukool-users',
      }) as any;

      if (decoded.tokenType !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return { userId: decoded.userId };
    } catch (error) {
      console.error('Refresh token verification failed:', error);
      return null;
    }
  }

  /**
   * Refresh an access token using a refresh token
   */
  public async refreshAccessToken(refreshToken: string, user: User): Promise<AuthToken | null> {
    const decoded = this.verifyRefreshToken(refreshToken);
    
    if (!decoded || decoded.userId !== user.id) {
      return null;
    }

    // Generate new tokens
    return this.generateTokens(user);
  }

  /**
   * Check if a token is expired
   */
  public isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return true;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch {
      return true;
    }
  }

  /**
   * Get token expiration time
   */
  public getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return null;
      }

      return new Date(decoded.exp * 1000);
    } catch {
      return null;
    }
  }

  /**
   * Extract user information from token
   */
  public getUserFromToken(token: string): Partial<User> | null {
    const payload = this.verifyAccessToken(token);
    
    if (!payload) {
      return null;
    }

    return {
      id: payload.userId,
      email: payload.email,
      role: payload.role as User['role'],
    };
  }

  /**
   * Generate a secure session ID
   */
  public generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Validate token format
   */
  public isValidTokenFormat(token: string): boolean {
    try {
      const parts = token.split('.');
      return parts.length === 3;
    } catch {
      return false;
    }
  }

  /**
   * Get token metadata
   */
  public getTokenMetadata(token: string): {
    isValid: boolean;
    isExpired: boolean;
    expiresAt: Date | null;
    payload: TokenPayload | null;
  } {
    const isValid = this.isValidTokenFormat(token);
    const isExpired = this.isTokenExpired(token);
    const expiresAt = this.getTokenExpiration(token);
    const payload = isValid && !isExpired ? this.verifyAccessToken(token) : null;

    return {
      isValid,
      isExpired,
      expiresAt,
      payload,
    };
  }
}

// Export singleton instance
export const tokenService = TokenService.getInstance();