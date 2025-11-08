/**
 * Security Service
 * Comprehensive security system with encryption, audit logging, rate limiting, and protection
 */

import { logger } from './logging.service';
import { offlineStorageManager } from './offline-storage.service';

export interface SecurityConfig {
  encryptionEnabled: boolean;
  auditLoggingEnabled: boolean;
  rateLimitingEnabled: boolean;
  ddosProtectionEnabled: boolean;
  sessionTimeout: number; // minutes
  maxLoginAttempts: number;
  lockoutDuration: number; // minutes
  passwordPolicy: PasswordPolicy;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventReuse: number; // number of previous passwords to remember
  maxAge: number; // days before password expires
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userRole: 'student' | 'teacher' | 'parent' | 'admin';
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  timestamp: Date;
  outcome: 'success' | 'failure' | 'blocked';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  details: any;
  sessionId: string;
}

export interface SecurityEvent {
  id: string;
  type:
    | 'login_attempt'
    | 'failed_login'
    | 'suspicious_activity'
    | 'rate_limit_exceeded'
    | 'potential_attack'
    | 'data_access'
    | 'permission_denied';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  description: string;
  data: any;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface RateLimitRule {
  id: string;
  name: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | '*';
  maxRequests: number;
  windowMs: number; // time window in milliseconds
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
  keyGenerator?: (req: any) => string; // Function to generate rate limit key
}

export interface EncryptionKey {
  id: string;
  algorithm: 'AES-256-GCM' | 'AES-128-GCM';
  key: string; // Base64 encoded key
  iv?: string; // Base64 encoded IV for GCM
  createdAt: Date;
  expiresAt?: Date;
  purpose: 'data' | 'communication' | 'file' | 'session';
  active: boolean;
}

export interface AccessControlRule {
  id: string;
  name: string;
  resource: string;
  action: string;
  roles: string[];
  conditions?: AccessCondition[];
  effect: 'allow' | 'deny';
  priority: number;
}

export interface AccessCondition {
  type:
    | 'time_based'
    | 'location_based'
    | 'device_based'
    | 'session_based'
    | 'custom';
  field: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'in' | 'not_in';
  value: any;
}

export interface SecurityMetrics {
  totalSecurityEvents: number;
  criticalEvents: number;
  blockedRequests: number;
  rateLimitViolations: number;
  suspiciousActivities: number;
  encryptedDataSize: number;
  auditLogEntries: number;
  lastSecurityScan: Date;
  systemSecurityScore: number; // 0-100
}

export class SecurityService {
  private static instance: SecurityService;
  private config: SecurityConfig;
  private rateLimitStore: Map<string, { count: number; resetTime: number }> =
    new Map();
  private loginAttempts: Map<
    string,
    { count: number; lastAttempt: Date; lockedUntil?: Date }
  > = new Map();
  private activeKeys: Map<string, EncryptionKey> = new Map();
  private accessRules: AccessControlRule[] = [];

  private constructor() {
    this.config = this.getDefaultSecurityConfig();
    this.initializeSecurity();
  }

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  /**
   * Initialize security system
   */
  private async initializeSecurity(): Promise<void> {
    try {
      // Load security configuration
      const savedConfig = await offlineStorageManager.get<SecurityConfig>(
        'securityConfig',
        'default'
      );
      if (savedConfig) {
        this.config = { ...this.config, ...savedConfig };
      }

      // Load encryption keys
      await this.loadEncryptionKeys();

      // Load access control rules
      await this.loadAccessControlRules();

      // Initialize rate limiting cleanup
      this.startRateLimitCleanup();

      logger.info('app', 'Security service initialized', {
        encryptionEnabled: this.config.encryptionEnabled,
        auditLoggingEnabled: this.config.auditLoggingEnabled,
        rateLimitingEnabled: this.config.rateLimitingEnabled,
      });
    } catch (error) {
      logger.error(
        'app',
        'Failed to initialize security service',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Encrypt sensitive data
   */
  public async encryptData(
    data: string,
    purpose: EncryptionKey['purpose'] = 'data'
  ): Promise<string> {
    if (!this.config.encryptionEnabled) {
      return data;
    }

    try {
      const key = this.getActiveEncryptionKey(purpose);
      if (!key) {
        throw new Error('No active encryption key available');
      }

      // In a real implementation, this would use actual crypto libraries
      // For this example, we'll simulate encryption
      const encrypted = Buffer.from(data).toString('base64');
      const result = `${key.id}:${encrypted}`;

      await this.logAuditEvent(
        'data_encryption',
        'data',
        undefined,
        'success',
        'low',
        {
          purpose,
          dataLength: data.length,
        }
      );

      return result;
    } catch (error) {
      await this.logAuditEvent(
        'data_encryption',
        'data',
        undefined,
        'failure',
        'medium',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
      throw error;
    }
  }

  /**
   * Decrypt sensitive data
   */
  public async decryptData(
    encryptedData: string,
    purpose: EncryptionKey['purpose'] = 'data'
  ): Promise<string> {
    if (!this.config.encryptionEnabled) {
      return encryptedData;
    }

    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted data format');
      }

      const [keyId, encryptedPart] = parts;
      const key = this.activeKeys.get(keyId || '');
      if (!key) {
        throw new Error('Encryption key not found');
      }

      // In a real implementation, this would use actual crypto libraries
      const decrypted = Buffer.from(encryptedPart || '', 'base64').toString();

      await this.logAuditEvent(
        'data_decryption',
        'data',
        undefined,
        'success',
        'low',
        {
          purpose,
          keyId,
        }
      );

      return decrypted;
    } catch (error) {
      await this.logAuditEvent(
        'data_decryption',
        'data',
        undefined,
        'failure',
        'medium',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
      throw error;
    }
  }

  /**
   * Log audit event
   */
  public async logAuditEvent(
    action: string,
    resource: string,
    resourceId: string | undefined,
    outcome: AuditLogEntry['outcome'],
    riskLevel: AuditLogEntry['riskLevel'],
    details: any,
    userId: string = 'system',
    userRole: AuditLogEntry['userRole'] = 'admin'
  ): Promise<void> {
    if (!this.config.auditLoggingEnabled) {
      return;
    }

    try {
      const auditEntry: AuditLogEntry = {
        id: this.generateAuditId(),
        userId,
        userRole,
        action,
        resource,
        ...(resourceId !== undefined && { resourceId }),
        ipAddress: this.getCurrentIpAddress(),
        userAgent: this.getCurrentUserAgent(),
        ...((await this.getLocationFromIp(this.getCurrentIpAddress())) !==
          undefined && {
          location: await this.getLocationFromIp(this.getCurrentIpAddress()),
        }),
        timestamp: new Date(),
        outcome,
        riskLevel,
        details,
        sessionId: this.getCurrentSessionId(),
      };

      // Store audit entry
      await offlineStorageManager.store('auditLogs', auditEntry, 'high');

      // Log to system logger for immediate visibility
      logger.info('app', 'Audit event logged', {
        action,
        resource,
        outcome,
        riskLevel,
        userId,
      });

      // Check for suspicious activity
      if (riskLevel === 'high' || riskLevel === 'critical') {
        await this.handleSuspiciousActivity(auditEntry);
      }
    } catch (error) {
      logger.error(
        'app',
        'Failed to log audit event',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Check rate limit for request
   */
  public checkRateLimit(
    key: string,
    rule: RateLimitRule,
    req?: any
  ): { allowed: boolean; remainingRequests: number; resetTime: number } {
    if (!this.config.rateLimitingEnabled) {
      return {
        allowed: true,
        remainingRequests: rule.maxRequests,
        resetTime: 0,
      };
    }

    const now = Date.now();
    const rateLimitKey = rule.keyGenerator ? rule.keyGenerator(req) : key;
    const current = this.rateLimitStore.get(rateLimitKey);

    if (!current || now > current.resetTime) {
      // Reset or initialize rate limit
      this.rateLimitStore.set(rateLimitKey, {
        count: 1,
        resetTime: now + rule.windowMs,
      });
      return {
        allowed: true,
        remainingRequests: rule.maxRequests - 1,
        resetTime: now + rule.windowMs,
      };
    }

    if (current.count >= rule.maxRequests) {
      // Rate limit exceeded
      this.logSecurityEvent('rate_limit_exceeded', 'high', rateLimitKey, {
        rule: rule.name,
        attempts: current.count,
        window: rule.windowMs,
      });

      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: current.resetTime,
      };
    }

    // Increment counter
    current.count++;
    this.rateLimitStore.set(rateLimitKey, current);

    return {
      allowed: true,
      remainingRequests: rule.maxRequests - current.count,
      resetTime: current.resetTime,
    };
  }

  /**
   * Validate login attempt
   */
  public async validateLoginAttempt(
    identifier: string,
    ipAddress: string
  ): Promise<{
    allowed: boolean;
    remainingAttempts: number;
    lockedUntil?: Date;
  }> {
    const key = `${identifier}:${ipAddress}`;
    const attempts = this.loginAttempts.get(key);
    const now = new Date();

    if (attempts && attempts.lockedUntil && now < attempts.lockedUntil) {
      // Still locked
      return {
        allowed: false,
        remainingAttempts: 0,
        lockedUntil: attempts.lockedUntil,
      };
    }

    if (!attempts || (attempts.lockedUntil && now >= attempts.lockedUntil)) {
      // No attempts or lock has expired
      this.loginAttempts.set(key, {
        count: 0,
        lastAttempt: now,
      });
      return {
        allowed: true,
        remainingAttempts: this.config.maxLoginAttempts,
      };
    }

    const remainingAttempts = this.config.maxLoginAttempts - attempts.count;
    if (remainingAttempts <= 0) {
      // Lock the account
      const lockedUntil = new Date(
        now.getTime() + this.config.lockoutDuration * 60 * 1000
      );
      attempts.lockedUntil = lockedUntil;
      this.loginAttempts.set(key, attempts);

      await this.logSecurityEvent('failed_login', 'high', identifier, {
        ipAddress,
        attempts: attempts.count,
        lockedUntil,
      });

      return {
        allowed: false,
        remainingAttempts: 0,
        lockedUntil,
      };
    }

    return {
      allowed: true,
      remainingAttempts,
    };
  }

  /**
   * Record failed login attempt
   */
  public async recordFailedLoginAttempt(
    identifier: string,
    ipAddress: string
  ): Promise<void> {
    const key = `${identifier}:${ipAddress}`;
    const attempts = this.loginAttempts.get(key) || {
      count: 0,
      lastAttempt: new Date(),
    };

    attempts.count++;
    attempts.lastAttempt = new Date();
    this.loginAttempts.set(key, attempts);

    await this.logSecurityEvent('failed_login', 'medium', identifier, {
      ipAddress,
      attemptCount: attempts.count,
    });

    await this.logAuditEvent(
      'login_attempt',
      'authentication',
      identifier,
      'failure',
      attempts.count > 3 ? 'high' : 'medium',
      { ipAddress, attemptCount: attempts.count }
    );
  }

  /**
   * Clear login attempts (on successful login)
   */
  public clearLoginAttempts(identifier: string, ipAddress: string): void {
    const key = `${identifier}:${ipAddress}`;
    this.loginAttempts.delete(key);
  }

  /**
   * Check access permissions
   */
  public async checkAccess(
    userId: string,
    userRole: string,
    resource: string,
    action: string,
    context: any = {}
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // Find applicable access rules
      const applicableRules = this.accessRules
        .filter(
          rule =>
            (rule.resource === resource || rule.resource === '*') &&
            (rule.action === action || rule.action === '*') &&
            rule.roles.includes(userRole)
        )
        .sort((a, b) => b.priority - a.priority);

      for (const rule of applicableRules) {
        // Check conditions
        if (
          rule.conditions &&
          !this.evaluateConditions(rule.conditions, context)
        ) {
          continue;
        }

        const result: { allowed: boolean; reason?: string } = {
          allowed: rule.effect === 'allow',
          ...(rule.effect === 'deny' && {
            reason: `Access denied by rule: ${rule.name}`,
          }),
        };

        await this.logAuditEvent(
          'access_check',
          resource,
          context.resourceId,
          result.allowed ? 'success' : 'blocked',
          result.allowed ? 'low' : 'medium',
          {
            action,
            userRole,
            appliedRule: rule.name,
            effect: rule.effect,
          },
          userId,
          userRole as AuditLogEntry['userRole']
        );

        return result;
      }

      // No applicable rule found - default deny
      await this.logAuditEvent(
        'access_check',
        resource,
        context.resourceId,
        'blocked',
        'medium',
        {
          action,
          userRole,
          reason: 'No applicable access rule found',
        },
        userId,
        userRole as AuditLogEntry['userRole']
      );

      return {
        allowed: false,
        reason: 'No applicable access rule found',
      };
    } catch (error) {
      logger.error(
        'app',
        'Failed to check access permissions',
        error instanceof Error ? error : undefined
      );
      return {
        allowed: false,
        reason: 'Error checking permissions',
      };
    }
  }

  /**
   * Generate security report
   */
  public async generateSecurityReport(period: {
    startDate: Date;
    endDate: Date;
  }): Promise<{
    metrics: SecurityMetrics;
    events: SecurityEvent[];
    recommendations: string[];
    riskAssessment: { level: 'low' | 'medium' | 'high'; factors: string[] };
  }> {
    try {
      // Get audit logs for period
      const auditLogs = await this.getAuditLogsForPeriod(period);
      const securityEvents = await this.getSecurityEventsForPeriod(period);

      const metrics: SecurityMetrics = {
        totalSecurityEvents: securityEvents.length,
        criticalEvents: securityEvents.filter(e => e.severity === 'critical')
          .length,
        blockedRequests: auditLogs.filter(log => log.outcome === 'blocked')
          .length,
        rateLimitViolations: securityEvents.filter(
          e => e.type === 'rate_limit_exceeded'
        ).length,
        suspiciousActivities: securityEvents.filter(
          e => e.type === 'suspicious_activity'
        ).length,
        encryptedDataSize: await this.getEncryptedDataSize(),
        auditLogEntries: auditLogs.length,
        lastSecurityScan: new Date(),
        systemSecurityScore: this.calculateSecurityScore(
          auditLogs,
          securityEvents
        ),
      };

      const recommendations = this.generateSecurityRecommendations(
        metrics,
        securityEvents
      );
      const riskAssessment = this.assessSecurityRisk(metrics, securityEvents);

      return {
        metrics,
        events: securityEvents,
        recommendations,
        riskAssessment,
      };
    } catch (error) {
      logger.error(
        'app',
        'Failed to generate security report',
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  /**
   * Anonymize data for AI training
   */
  public anonymizeForAI(
    data: any,
    options: {
      removePersonalInfo: boolean;
      hashIdentifiers: boolean;
      generalizeData: boolean;
    } = {
      removePersonalInfo: true,
      hashIdentifiers: true,
      generalizeData: true,
    }
  ): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const anonymized = JSON.parse(JSON.stringify(data));

    if (options.removePersonalInfo) {
      this.removePersonalInformation(anonymized);
    }

    if (options.hashIdentifiers) {
      this.hashIdentifiers(anonymized);
    }

    if (options.generalizeData) {
      this.generalizeData(anonymized);
    }

    return anonymized;
  }

  // Private helper methods

  private getDefaultSecurityConfig(): SecurityConfig {
    return {
      encryptionEnabled: true,
      auditLoggingEnabled: true,
      rateLimitingEnabled: true,
      ddosProtectionEnabled: true,
      sessionTimeout: 60, // 1 hour
      maxLoginAttempts: 5,
      lockoutDuration: 15, // 15 minutes
      passwordPolicy: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventReuse: 5,
        maxAge: 90, // 90 days
      },
    };
  }

  private async loadEncryptionKeys(): Promise<void> {
    try {
      const keys =
        await offlineStorageManager.getAll<EncryptionKey>('encryptionKeys');
      keys.forEach(key => {
        if (key.active && (!key.expiresAt || key.expiresAt > new Date())) {
          this.activeKeys.set(key.id, key);
        }
      });

      // Generate default key if none exist
      if (this.activeKeys.size === 0) {
        await this.generateEncryptionKey('data');
      }
    } catch (error) {
      logger.error(
        'app',
        'Failed to load encryption keys',
        error instanceof Error ? error : undefined
      );
    }
  }

  private async loadAccessControlRules(): Promise<void> {
    try {
      this.accessRules =
        await offlineStorageManager.getAll<AccessControlRule>('accessRules');

      // Add default rules if none exist
      if (this.accessRules.length === 0) {
        await this.createDefaultAccessRules();
      }
    } catch (error) {
      logger.error(
        'app',
        'Failed to load access control rules',
        error instanceof Error ? error : undefined
      );
    }
  }

  private async generateEncryptionKey(
    purpose: EncryptionKey['purpose']
  ): Promise<EncryptionKey> {
    const key: EncryptionKey = {
      id: this.generateKeyId(),
      algorithm: 'AES-256-GCM',
      key: this.generateRandomKey(),
      createdAt: new Date(),
      purpose,
      active: true,
    };

    await offlineStorageManager.store('encryptionKeys', key, 'high');
    this.activeKeys.set(key.id, key);

    return key;
  }

  private getActiveEncryptionKey(
    purpose: EncryptionKey['purpose']
  ): EncryptionKey | undefined {
    for (const key of this.activeKeys.values()) {
      if (key.purpose === purpose && key.active) {
        return key;
      }
    }
    return undefined;
  }

  private startRateLimitCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.rateLimitStore.entries()) {
        if (now > data.resetTime) {
          this.rateLimitStore.delete(key);
        }
      }
    }, 60000); // Clean up every minute
  }

  private async handleSuspiciousActivity(
    auditEntry: AuditLogEntry
  ): Promise<void> {
    await this.logSecurityEvent(
      'suspicious_activity',
      auditEntry.riskLevel as any,
      auditEntry.userId,
      {
        action: auditEntry.action,
        resource: auditEntry.resource,
        details: auditEntry.details,
      }
    );

    // Additional security measures based on risk level
    if (auditEntry.riskLevel === 'critical') {
      // Lock user session, notify administrators, etc.
      logger.warn('app', 'Critical security event detected', {
        userId: auditEntry.userId,
        action: auditEntry.action,
        resource: auditEntry.resource,
      });
    }
  }

  private async logSecurityEvent(
    type: SecurityEvent['type'],
    severity: SecurityEvent['severity'],
    userId: string | undefined,
    data: any
  ): Promise<void> {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      type,
      severity,
      ...(userId !== undefined && { userId }),
      ipAddress: this.getCurrentIpAddress(),
      userAgent: this.getCurrentUserAgent(),
      description: this.getEventDescription(type, data),
      data,
      timestamp: new Date(),
      resolved: false,
    };

    await offlineStorageManager.store('securityEvents', event, 'high');
  }

  private evaluateConditions(
    conditions: AccessCondition[],
    context: any
  ): boolean {
    return conditions.every(condition => {
      const contextValue = this.getNestedValue(context, condition.field);

      switch (condition.operator) {
        case 'equals':
          return contextValue === condition.value;
        case 'contains':
          return String(contextValue).includes(String(condition.value));
        case 'gt':
          return Number(contextValue) > Number(condition.value);
        case 'lt':
          return Number(contextValue) < Number(condition.value);
        case 'in':
          return (
            Array.isArray(condition.value) &&
            condition.value.includes(contextValue)
          );
        case 'not_in':
          return (
            Array.isArray(condition.value) &&
            !condition.value.includes(contextValue)
          );
        default:
          return false;
      }
    });
  }

  private async getAuditLogsForPeriod(period: {
    startDate: Date;
    endDate: Date;
  }): Promise<AuditLogEntry[]> {
    const allLogs =
      await offlineStorageManager.getAll<AuditLogEntry>('auditLogs');
    return allLogs.filter(
      log =>
        log.timestamp >= period.startDate && log.timestamp <= period.endDate
    );
  }

  private async getSecurityEventsForPeriod(period: {
    startDate: Date;
    endDate: Date;
  }): Promise<SecurityEvent[]> {
    const allEvents =
      await offlineStorageManager.getAll<SecurityEvent>('securityEvents');
    return allEvents.filter(
      event =>
        event.timestamp >= period.startDate && event.timestamp <= period.endDate
    );
  }

  private async getEncryptedDataSize(): Promise<number> {
    // Estimate encrypted data size - would be more accurate in real implementation
    return Math.floor(Math.random() * 1000000); // Random size for demo
  }

  private calculateSecurityScore(
    auditLogs: AuditLogEntry[],
    securityEvents: SecurityEvent[]
  ): number {
    let score = 100;

    // Deduct points for security events
    score -= securityEvents.filter(e => e.severity === 'critical').length * 10;
    score -= securityEvents.filter(e => e.severity === 'high').length * 5;
    score -= securityEvents.filter(e => e.severity === 'medium').length * 2;

    // Deduct points for failed audit events
    score -= auditLogs.filter(log => log.outcome === 'failure').length * 1;

    return Math.max(0, Math.min(100, score));
  }

  private generateSecurityRecommendations(
    metrics: SecurityMetrics,
    events: SecurityEvent[]
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.systemSecurityScore < 80) {
      recommendations.push(
        'System security score is below recommended threshold. Review and address security events.'
      );
    }

    if (metrics.criticalEvents > 0) {
      recommendations.push(
        'Critical security events detected. Immediate investigation required.'
      );
    }

    if (metrics.rateLimitViolations > 100) {
      recommendations.push(
        'High number of rate limit violations. Consider adjusting limits or investigating potential abuse.'
      );
    }

    if (events.filter(e => e.type === 'failed_login').length > 50) {
      recommendations.push(
        'High number of failed login attempts. Consider implementing additional authentication measures.'
      );
    }

    return recommendations;
  }

  private assessSecurityRisk(
    metrics: SecurityMetrics,
    events: SecurityEvent[]
  ): { level: 'low' | 'medium' | 'high'; factors: string[] } {
    const factors: string[] = [];
    let riskScore = 0;

    if (metrics.criticalEvents > 0) {
      riskScore += 30;
      factors.push(`${metrics.criticalEvents} critical security events`);
    }

    if (metrics.systemSecurityScore < 70) {
      riskScore += 20;
      factors.push('Low system security score');
    }

    if (metrics.rateLimitViolations > 200) {
      riskScore += 15;
      factors.push('High rate limit violations');
    }

    const unresolvedEvents = events.filter(e => !e.resolved).length;
    if (unresolvedEvents > 10) {
      riskScore += 10;
      factors.push(`${unresolvedEvents} unresolved security events`);
    }

    let level: 'low' | 'medium' | 'high';
    if (riskScore >= 50) {
      level = 'high';
    } else if (riskScore >= 25) {
      level = 'medium';
    } else {
      level = 'low';
    }

    return { level, factors };
  }

  private removePersonalInformation(obj: any): void {
    const sensitiveFields = [
      'email',
      'phone',
      'address',
      'ssn',
      'name',
      'firstName',
      'lastName',
      'fullName',
    ];

    for (const key in obj) {
      if (sensitiveFields.includes(key.toLowerCase())) {
        delete obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.removePersonalInformation(obj[key]);
      }
    }
  }

  private hashIdentifiers(obj: any): void {
    const identifierFields = [
      'id',
      'userId',
      'studentId',
      'teacherId',
      'parentId',
    ];

    for (const key in obj) {
      if (identifierFields.includes(key) && typeof obj[key] === 'string') {
        obj[key] = this.simpleHash(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.hashIdentifiers(obj[key]);
      }
    }
  }

  private generalizeData(obj: any): void {
    // Generalize timestamps to hour precision
    for (const key in obj) {
      if (
        (key.includes('Date') || key.includes('Time')) &&
        obj[key] instanceof Date
      ) {
        const date = new Date(obj[key]);
        date.setMinutes(0, 0, 0);
        obj[key] = date;
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.generalizeData(obj[key]);
      }
    }
  }

  private async createDefaultAccessRules(): Promise<void> {
    const defaultRules: Omit<AccessControlRule, 'id'>[] = [
      {
        name: 'Admin Full Access',
        resource: '*',
        action: '*',
        roles: ['admin'],
        effect: 'allow',
        priority: 100,
      },
      {
        name: 'Teacher Session Access',
        resource: 'sessions',
        action: '*',
        roles: ['teacher'],
        effect: 'allow',
        priority: 50,
      },
      {
        name: 'Student Own Data Access',
        resource: 'student_data',
        action: 'read',
        roles: ['student'],
        conditions: [
          {
            type: 'custom',
            field: 'ownerId',
            operator: 'equals',
            value: '${userId}',
          },
        ],
        effect: 'allow',
        priority: 40,
      },
    ];

    for (const rule of defaultRules) {
      const fullRule: AccessControlRule = {
        ...rule,
        id: this.generateRuleId(),
      };
      await offlineStorageManager.store('accessRules', fullRule, 'medium');
      this.accessRules.push(fullRule);
    }
  }

  // Utility methods
  private getCurrentIpAddress(): string {
    return '127.0.0.1'; // Would get actual IP in real implementation
  }

  private getCurrentUserAgent(): string {
    return typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
  }

  private getCurrentSessionId(): string {
    return 'session_' + Date.now(); // Would use actual session ID
  }

  private async getLocationFromIp(ipAddress: string): Promise<string> {
    return 'Unknown Location'; // Would use IP geolocation service
  }

  private getEventDescription(type: SecurityEvent['type'], data: any): string {
    const descriptions: Record<SecurityEvent['type'], string> = {
      login_attempt: 'User login attempt',
      failed_login: 'Failed login attempt',
      suspicious_activity: 'Suspicious activity detected',
      rate_limit_exceeded: 'Rate limit exceeded',
      potential_attack: 'Potential attack detected',
      data_access: 'Sensitive data access',
      permission_denied: 'Permission denied',
    };
    return descriptions[type] || 'Security event';
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private simpleHash(input: string): string {
    // Simple hash function for demo - would use proper crypto hash in production
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  private generateRandomKey(): string {
    // Generate random key - would use crypto.randomBytes in production
    return Buffer.from(
      Array.from({ length: 32 }, () => Math.floor(Math.random() * 256))
    ).toString('base64');
  }

  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateKeyId(): string {
    return `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRuleId(): string {
    return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate HMAC for webhook verification
   */
  public generateHMAC(data: string, secret: string): string {
    // Simple HMAC implementation for demo - would use crypto.createHmac in production
    const combinedData = secret + data + secret;
    return this.simpleHash(combinedData);
  }

  /**
   * Generate UUID for tracking
   */
  public generateUUID(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Hash data using simple hash function
   */
  public hashData(data: string): string {
    return this.simpleHash(data);
  }

  /**
   * Update security configuration
   */
  public async updateSecurityConfig(
    newConfig: Partial<SecurityConfig>
  ): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await offlineStorageManager.store('securityConfig', this.config, 'high');
    logger.info('app', 'Security configuration updated');
  }

  /**
   * Get current security configuration
   */
  public getSecurityConfig(): SecurityConfig {
    return { ...this.config };
  }

  /**
   * Validate password against policy
   */
  public validatePassword(password: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < this.config.passwordPolicy.minLength) {
      errors.push(
        `Password must be at least ${this.config.passwordPolicy.minLength} characters long`
      );
    }

    if (
      this.config.passwordPolicy.requireUppercase &&
      !/[A-Z]/.test(password)
    ) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (
      this.config.passwordPolicy.requireLowercase &&
      !/[a-z]/.test(password)
    ) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (this.config.passwordPolicy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (
      this.config.passwordPolicy.requireSpecialChars &&
      !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    ) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const securityService = SecurityService.getInstance();
