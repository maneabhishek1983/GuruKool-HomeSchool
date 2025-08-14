import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { QR_CODE_EXPIRY_TIME, WS_EVENTS } from '@/constants';
import { QRAuthState, AuthToken, User } from '@/types';
import { AIAgentOrchestrator } from '@/agents/orchestrator';
import { tokenService } from './token.service';
import { sessionService } from './session.service';
import { DatabaseService } from './database.service';

export interface QRAuthConfig {
  expirationTime: number;
  refreshInterval: number;
  fallbackEnabled: boolean;
  aiEnhanced: boolean;
  mcpIntegration: boolean;
}

export interface QRTokenPayload {
  sessionId: string;
  timestamp: number;
  deviceInfo?: string | undefined;
  location?: {
    latitude: number;
    longitude: number;
  } | undefined;
  aiContext?: {
    userBehaviorPattern: string;
    riskScore: number;
    recommendedActions: string[];
  } | undefined;
}

export class QRAuthService {
  private static instance: QRAuthService;
  private activeTokens = new Map<string, QRTokenPayload>();
  private wsConnections = new Map<string, WebSocket>();
  private aiOrchestrator: AIAgentOrchestrator;
  private dbService: DatabaseService;
  private config: QRAuthConfig;

  private constructor() {
    // Disable AI enhancement in development to prevent MCP server errors
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    this.config = {
      expirationTime: QR_CODE_EXPIRY_TIME,
      refreshInterval: 30000,
      fallbackEnabled: true,
      aiEnhanced: !isDevelopment, // Disable in development
      mcpIntegration: !isDevelopment, // Disable in development
    };
    this.aiOrchestrator = AIAgentOrchestrator.getInstance();
    this.dbService = DatabaseService.getInstance();
    this.initializeCleanupTimer();
  }

  public static getInstance(): QRAuthService {
    if (!QRAuthService.instance) {
      QRAuthService.instance = new QRAuthService();
    }
    return QRAuthService.instance;
  }

  /**
   * Generate QR code with AI-enhanced security and MCP integration
   */
  public async generateQRCode(deviceInfo?: string): Promise<{
    qrCode: string;
    sessionId: string;
    expiresAt: Date;
    aiInsights?: any;
  }> {
    try {
      const sessionId = uuidv4();
      const timestamp = Date.now();
      const expiresAt = new Date(timestamp + this.config.expirationTime);

      // Get AI-enhanced security context
      let aiContext;
      if (this.config.aiEnhanced) {
        aiContext = await this.getAISecurityContext(deviceInfo);
      }

      // Create token payload with AI insights
      const tokenPayload: QRTokenPayload = {
        sessionId,
        timestamp,
        deviceInfo,
        aiContext,
      };

      // Generate JWT token
      const token = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '5m' }
      );

      // Store active token in memory and database
      this.activeTokens.set(sessionId, tokenPayload);
      
      // Store in database for persistence (skip in development)
      if (process.env.NODE_ENV === 'production') {
        try {
          await this.dbService.createAuthSession({
            session_id: sessionId,
            token_data: tokenPayload,
            ai_context: aiContext,
            risk_score: aiContext?.riskScore || 0.1,
            expires_at: expiresAt.toISOString(),
          });
        } catch (dbError) {
          console.warn('Database operation failed, continuing with in-memory storage:', dbError);
        }
      }

      // Generate QR code with embedded token
      const qrCodeData = JSON.stringify({
        token,
        sessionId,
        timestamp,
        version: '2.0',
        aiEnhanced: this.config.aiEnhanced,
      });

      const qrCode = await QRCode.toDataURL(qrCodeData, {
        errorCorrectionLevel: 'H',
        margin: 1,
        color: {
          dark: '#1f2937',
          light: '#ffffff',
        },
        width: 256,
      });

      // Notify AI agents about QR generation
      if (this.config.aiEnhanced) {
        await this.aiOrchestrator.notifyEvent('qr_generated', {
          sessionId,
          deviceInfo,
          aiContext,
          timestamp,
        });
      }

      // Schedule automatic cleanup
      setTimeout(() => {
        this.cleanupExpiredToken(sessionId);
      }, this.config.expirationTime);

      return {
        qrCode,
        sessionId,
        expiresAt,
        aiInsights: aiContext,
      };
    } catch (error) {
      console.error('QR Code generation failed:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Verify QR code token with AI-powered fraud detection
   */
  public async verifyQRToken(
    token: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{
    isValid: boolean;
    sessionId?: string;
    user?: User;
    aiVerification?: any;
    riskAssessment?: any;
  }> {
    try {
      // Decode and verify JWT
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback-secret'
      ) as QRTokenPayload;

      const { sessionId, timestamp } = decoded;

      // Check if token exists and is not expired
      const tokenData = this.activeTokens.get(sessionId);
      if (!tokenData) {
        return { isValid: false };
      }

      // AI-powered fraud detection
      let aiVerification;
      let riskAssessment;
      if (this.config.aiEnhanced) {
        const verificationResult = await this.performAIVerification({
          sessionId,
          userAgent: userAgent || undefined,
          ipAddress: ipAddress || undefined,
          tokenData,
        });
        aiVerification = verificationResult.verification;
        riskAssessment = verificationResult.riskAssessment;

        // Block if high risk
        if (riskAssessment.riskScore > 0.8) {
          await this.aiOrchestrator.notifyEvent('high_risk_auth_attempt', {
            sessionId,
            riskScore: riskAssessment.riskScore,
            reasons: riskAssessment.reasons,
          });
          return { isValid: false, riskAssessment };
        }
      }

      // Get user from database
      const user = await this.getUserFromSession(sessionId);

      // Clean up used token from memory and update database
      this.activeTokens.delete(sessionId);
      
      // Update database (skip in development)
      if (process.env.NODE_ENV === 'production') {
        try {
          await this.dbService.updateAuthSession(sessionId, { 
            status: 'success',
            user_id: user?.id || null
          });
        } catch (dbError) {
          console.warn('Database update failed:', dbError);
        }
      }

      // Notify AI agents of successful authentication
      if (this.config.aiEnhanced && user) {
        await this.aiOrchestrator.notifyEvent('auth_success', {
          userId: user.id,
          sessionId,
          riskScore: riskAssessment?.riskScore || 0,
          timestamp: Date.now(),
        });
      }

      if (user) {
        return {
          isValid: true,
          sessionId,
          user,
          aiVerification,
          riskAssessment,
        };
      } else {
        return {
          isValid: true,
          sessionId,
          aiVerification,
          riskAssessment,
        };
      }
    } catch (error) {
      console.error('QR Token verification failed:', error);
      return { isValid: false };
    }
  }

  /**
   * Set up WebSocket connection for real-time auth status updates
   */
  public setupWebSocketConnection(sessionId: string, ws: WebSocket): void {
    this.wsConnections.set(sessionId, ws);

    ws.addEventListener('close', () => {
      this.wsConnections.delete(sessionId);
    });

    // Send initial status
    this.sendAuthStatus(sessionId, 'pending');
  }

  /**
   * Send authentication status update via WebSocket
   */
  public sendAuthStatus(
    sessionId: string,
    status: 'pending' | 'success' | 'expired' | 'error',
    data?: any
  ): void {
    const ws = this.wsConnections.get(sessionId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          event: WS_EVENTS.QR_AUTH_STATUS,
          sessionId,
          status,
          data,
          timestamp: Date.now(),
        })
      );
    }
  }

  /**
   * Get AI-enhanced security context using MCP integration
   */
  private async getAISecurityContext(deviceInfo?: string): Promise<any> {
    try {
      // This would integrate with MCP servers for enhanced AI capabilities
      const securityAnalysis = await this.aiOrchestrator.executeAgent(
        'security-analysis',
        {
          deviceInfo,
          timestamp: Date.now(),
          context: 'qr_auth_generation',
        }
      );

      return {
        userBehaviorPattern: securityAnalysis.data?.behaviorPattern || 'normal',
        riskScore: securityAnalysis.data?.riskScore || 0.1,
        recommendedActions: securityAnalysis.data?.recommendations || [],
        deviceTrust: securityAnalysis.data?.deviceTrust || 'unknown',
        locationRisk: securityAnalysis.data?.locationRisk || 'low',
      };
    } catch (error) {
      console.error('AI security context generation failed:', error);
      return {
        userBehaviorPattern: 'unknown',
        riskScore: 0.5,
        recommendedActions: ['monitor_closely'],
        deviceTrust: 'unknown',
        locationRisk: 'medium',
      };
    }
  }

  /**
   * Perform AI-powered verification with MCP integration
   */
  private async performAIVerification(params: {
    sessionId: string;
    userAgent?: string | undefined;
    ipAddress?: string | undefined;
    tokenData: QRTokenPayload;
  }): Promise<{
    verification: any;
    riskAssessment: any;
  }> {
    try {
      // Use AI orchestrator to perform comprehensive verification
      const verificationResult = await this.aiOrchestrator.executeAgent(
        'auth-verification',
        {
          sessionId: params.sessionId,
          userAgent: params.userAgent,
          ipAddress: params.ipAddress,
          tokenData: params.tokenData,
          timestamp: Date.now(),
        }
      );

      return {
        verification: {
          deviceConsistency: verificationResult.data?.deviceConsistency || true,
          locationConsistency: verificationResult.data?.locationConsistency || true,
          timingAnalysis: verificationResult.data?.timingAnalysis || 'normal',
          behaviorMatch: verificationResult.data?.behaviorMatch || true,
        },
        riskAssessment: {
          riskScore: verificationResult.data?.riskScore || 0.1,
          reasons: verificationResult.data?.riskReasons || [],
          confidence: verificationResult.data?.confidence || 0.9,
          recommendations: verificationResult.data?.recommendations || [],
        },
      };
    } catch (error) {
      console.error('AI verification failed:', error);
      return {
        verification: { deviceConsistency: true, locationConsistency: true },
        riskAssessment: { riskScore: 0.5, reasons: ['ai_verification_failed'] },
      };
    }
  }

  /**
   * Get user from database based on session
   */
  private async getUserFromSession(sessionId: string): Promise<User | null> {
    try {
      // In development, return a mock admin user for QR authentication (full access)
      if (process.env.NODE_ENV !== 'production') {
        return {
          id: 'admin-qr-demo',
          name: 'QR Admin User',
          role: 'admin',
          email: 'qr-admin@example.com',
          preferences: {
            notifications: {
              email: true,
              push: true,
              sms: false,
              inApp: true,
              frequency: 'immediate',
            },
            dashboard: {
              layout: 'detailed',
              theme: 'light',
              widgets: ['sessions', 'analytics', 'notifications', 'users', 'system'],
            },
            privacy: {
              dataSharing: false,
              analytics: true,
              aiTraining: true,
            },
            accessibility: {
              fontSize: 'medium',
              highContrast: false,
              reducedMotion: false,
              screenReader: false,
            },
          },
          createdAt: new Date(),
          lastActive: new Date(),
        };
      }

      // Get auth session from database (production)
      const authSession = await this.dbService.getAuthSession(sessionId);
      if (!authSession) {
        return null;
      }

      // For demo purposes, return the default teacher user
      // In production, this would be determined by the auth session data
      return await this.dbService.getUserById('550e8400-e29b-41d4-a716-446655440001');
    } catch (error) {
      console.error('Error getting user from session:', error);
      return null;
    }
  }

  /**
   * Initialize cleanup timer for expired tokens
   */
  private initializeCleanupTimer(): void {
    setInterval(async () => {
      // Clean up expired tokens from memory
      const now = Date.now();
      for (const [sessionId, tokenData] of this.activeTokens.entries()) {
        if (now - tokenData.timestamp > this.config.expirationTime) {
          this.cleanupExpiredToken(sessionId);
        }
      }

      // Database cleanup disabled in development to reduce noise
      // Enable this in production with proper database configuration
    }, 60000); // Check every minute
  }

  /**
   * Clean up expired token and notify clients
   */
  private cleanupExpiredToken(sessionId: string): void {
    this.activeTokens.delete(sessionId);
    this.sendAuthStatus(sessionId, 'expired');

    // Close WebSocket connection
    const ws = this.wsConnections.get(sessionId);
    if (ws) {
      ws.close();
      this.wsConnections.delete(sessionId);
    }

    // Notify AI agents
    if (this.config.aiEnhanced) {
      this.aiOrchestrator.notifyEvent('qr_token_expired', {
        sessionId,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Get current authentication statistics for AI analysis
   */
  public getAuthStats(): {
    activeTokens: number;
    activeConnections: number;
    recentActivity: any[];
  } {
    return {
      activeTokens: this.activeTokens.size,
      activeConnections: this.wsConnections.size,
      recentActivity: [], // Would be populated with recent auth events
    };
  }
}