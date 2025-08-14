import { User, AuthToken } from '@/types';
import { tokenService } from './token.service';

export interface UserSession {
  id: string;
  userId: string;
  user: User;
  token: AuthToken;
  deviceInfo?: string | undefined;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  isActive: boolean;
  authMethod: 'qr' | 'traditional';
}

export class SessionService {
  private static instance: SessionService;
  private activeSessions = new Map<string, UserSession>();
  private userSessions = new Map<string, Set<string>>(); // userId -> sessionIds
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startCleanupTimer();
  }

  public static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  /**
   * Create a new user session
   */
  public createSession(
    user: User,
    authMethod: 'qr' | 'traditional',
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string
  ): UserSession {
    const sessionId = tokenService.generateSessionId();
    const token = tokenService.generateTokens(user, sessionId, deviceInfo);
    
    const session: UserSession = {
      id: sessionId,
      userId: user.id,
      user,
      token,
      deviceInfo,
      ipAddress,
      userAgent,
      createdAt: new Date(),
      lastActivity: new Date(),
      expiresAt: token.expiresAt,
      isActive: true,
      authMethod,
    };

    // Store session
    this.activeSessions.set(sessionId, session);
    
    // Track user sessions
    if (!this.userSessions.has(user.id)) {
      this.userSessions.set(user.id, new Set());
    }
    this.userSessions.get(user.id)!.add(sessionId);

    return session;
  }

  /**
   * Get session by ID
   */
  public getSession(sessionId: string): UserSession | null {
    const session = this.activeSessions.get(sessionId);
    
    if (!session || !session.isActive) {
      return null;
    }

    // Check if session is expired
    if (new Date() > session.expiresAt) {
      this.expireSession(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Get session by token
   */
  public getSessionByToken(accessToken: string): UserSession | null {
    const payload = tokenService.verifyAccessToken(accessToken);
    
    if (!payload || !payload.sessionId) {
      return null;
    }

    return this.getSession(payload.sessionId);
  }

  /**
   * Update session activity
   */
  public updateActivity(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    
    if (!session || !session.isActive) {
      return false;
    }

    session.lastActivity = new Date();
    return true;
  }

  /**
   * Refresh session token
   */
  public async refreshSession(sessionId: string): Promise<UserSession | null> {
    const session = this.activeSessions.get(sessionId);
    
    if (!session || !session.isActive) {
      return null;
    }

    try {
      const newToken = await tokenService.refreshAccessToken(session.token.refreshToken, session.user);
      
      if (!newToken) {
        this.expireSession(sessionId);
        return null;
      }

      // Update session with new token
      session.token = newToken;
      session.expiresAt = newToken.expiresAt;
      session.lastActivity = new Date();

      return session;
    } catch (error) {
      console.error('Session refresh failed:', error);
      this.expireSession(sessionId);
      return null;
    }
  }

  /**
   * Expire a session
   */
  public expireSession(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      return false;
    }

    // Mark as inactive
    session.isActive = false;

    // Remove from active sessions
    this.activeSessions.delete(sessionId);

    // Remove from user sessions
    const userSessionSet = this.userSessions.get(session.userId);
    if (userSessionSet) {
      userSessionSet.delete(sessionId);
      if (userSessionSet.size === 0) {
        this.userSessions.delete(session.userId);
      }
    }

    return true;
  }

  /**
   * Expire all sessions for a user
   */
  public expireUserSessions(userId: string): number {
    const userSessionSet = this.userSessions.get(userId);
    
    if (!userSessionSet) {
      return 0;
    }

    let expiredCount = 0;
    for (const sessionId of userSessionSet) {
      if (this.expireSession(sessionId)) {
        expiredCount++;
      }
    }

    return expiredCount;
  }

  /**
   * Get all active sessions for a user
   */
  public getUserSessions(userId: string): UserSession[] {
    const userSessionSet = this.userSessions.get(userId);
    
    if (!userSessionSet) {
      return [];
    }

    const sessions: UserSession[] = [];
    for (const sessionId of userSessionSet) {
      const session = this.getSession(sessionId);
      if (session) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  /**
   * Validate session
   */
  public validateSession(sessionId: string): {
    isValid: boolean;
    session: UserSession | null;
    reason?: string;
  } {
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      return { isValid: false, session: null, reason: 'Session not found' };
    }

    if (!session.isActive) {
      return { isValid: false, session: null, reason: 'Session inactive' };
    }

    if (new Date() > session.expiresAt) {
      this.expireSession(sessionId);
      return { isValid: false, session: null, reason: 'Session expired' };
    }

    // Verify token
    const tokenMetadata = tokenService.getTokenMetadata(session.token.accessToken);
    if (!tokenMetadata.isValid || tokenMetadata.isExpired) {
      this.expireSession(sessionId);
      return { isValid: false, session: null, reason: 'Invalid token' };
    }

    return { isValid: true, session };
  }

  /**
   * Get session statistics
   */
  public getSessionStats(): {
    totalActiveSessions: number;
    totalUsers: number;
    sessionsByAuthMethod: Record<string, number>;
    averageSessionDuration: number;
  } {
    const sessions = Array.from(this.activeSessions.values());
    const now = new Date();

    const sessionsByAuthMethod = sessions.reduce((acc, session) => {
      acc[session.authMethod] = (acc[session.authMethod] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalDuration = sessions.reduce((sum, session) => {
      return sum + (now.getTime() - session.createdAt.getTime());
    }, 0);

    const averageSessionDuration = sessions.length > 0 ? totalDuration / sessions.length : 0;

    return {
      totalActiveSessions: sessions.length,
      totalUsers: this.userSessions.size,
      sessionsByAuthMethod,
      averageSessionDuration,
    };
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = new Date();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.activeSessions) {
      if (!session.isActive || now > session.expiresAt) {
        expiredSessions.push(sessionId);
      }
    }

    for (const sessionId of expiredSessions) {
      this.expireSession(sessionId);
    }

    if (expiredSessions.length > 0) {
      console.log(`Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    // Clean up expired sessions every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000);
  }

  /**
   * Stop cleanup timer
   */
  public stopCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get session by user and device
   */
  public getSessionByUserAndDevice(userId: string, deviceInfo?: string): UserSession | null {
    const userSessions = this.getUserSessions(userId);
    
    if (!deviceInfo) {
      return userSessions[0] || null;
    }

    return userSessions.find(session => session.deviceInfo === deviceInfo) || null;
  }

  /**
   * Check if user has active sessions
   */
  public hasActiveSessions(userId: string): boolean {
    return this.getUserSessions(userId).length > 0;
  }
}

// Export singleton instance
export const sessionService = SessionService.getInstance();