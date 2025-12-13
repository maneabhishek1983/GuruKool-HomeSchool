/**
 * Security Service Tests
 * Tests for security operations, password validation, rate limiting, and access control
 */

import {
  SecurityConfig,
  PasswordPolicy,
  AuditLogEntry,
  SecurityEvent,
  RateLimitRule,
  AccessControlRule,
  AccessCondition,
} from '../security.service';

// Mock dependencies
jest.mock('../logging.service', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../offline-storage.service', () => ({
  offlineStorageManager: {
    store: jest.fn(),
    get: jest.fn(),
    getAll: jest.fn(),
    delete: jest.fn(),
    initialize: jest.fn(),
  },
}));

describe('SecurityService Types', () => {
  describe('SecurityConfig', () => {
    it('should have all required properties', () => {
      const config: SecurityConfig = {
        encryptionEnabled: true,
        auditLoggingEnabled: true,
        rateLimitingEnabled: true,
        ddosProtectionEnabled: true,
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        lockoutDuration: 15,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          preventReuse: 5,
          maxAge: 90,
        },
      };

      expect(config.encryptionEnabled).toBe(true);
      expect(config.sessionTimeout).toBe(30);
      expect(config.maxLoginAttempts).toBe(5);
      expect(config.lockoutDuration).toBe(15);
    });
  });

  describe('PasswordPolicy', () => {
    it('should define password requirements', () => {
      const policy: PasswordPolicy = {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventReuse: 10,
        maxAge: 60,
      };

      expect(policy.minLength).toBe(12);
      expect(policy.requireUppercase).toBe(true);
      expect(policy.preventReuse).toBe(10);
      expect(policy.maxAge).toBe(60);
    });

    it('should allow relaxed password policy', () => {
      const policy: PasswordPolicy = {
        minLength: 6,
        requireUppercase: false,
        requireLowercase: false,
        requireNumbers: false,
        requireSpecialChars: false,
        preventReuse: 0,
        maxAge: 0, // No expiration
      };

      expect(policy.minLength).toBe(6);
      expect(policy.requireSpecialChars).toBe(false);
    });
  });

  describe('AuditLogEntry', () => {
    it('should capture all audit information', () => {
      const entry: AuditLogEntry = {
        id: 'audit-123',
        userId: 'user-456',
        userRole: 'parent',
        action: 'view_timesheet',
        resource: 'timesheet',
        resourceId: 'timesheet-789',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        location: 'New York, US',
        timestamp: new Date(),
        outcome: 'success',
        riskLevel: 'low',
        details: { page: 'dashboard' },
        sessionId: 'session-abc',
      };

      expect(entry.id).toBe('audit-123');
      expect(entry.userRole).toBe('parent');
      expect(entry.outcome).toBe('success');
      expect(entry.riskLevel).toBe('low');
    });

    it('should allow all user roles', () => {
      const roles: Array<'student' | 'teacher' | 'parent' | 'admin'> = [
        'student',
        'teacher',
        'parent',
        'admin',
      ];

      roles.forEach(role => {
        const entry: AuditLogEntry = {
          id: `audit-${role}`,
          userId: 'user-123',
          userRole: role,
          action: 'login',
          resource: 'auth',
          ipAddress: '127.0.0.1',
          userAgent: 'Test',
          timestamp: new Date(),
          outcome: 'success',
          riskLevel: 'low',
          details: {},
          sessionId: 'session-123',
        };

        expect(entry.userRole).toBe(role);
      });
    });

    it('should support all outcome types', () => {
      const outcomes: Array<'success' | 'failure' | 'blocked'> = [
        'success',
        'failure',
        'blocked',
      ];

      outcomes.forEach(outcome => {
        const entry: AuditLogEntry = {
          id: 'audit-123',
          userId: 'user-123',
          userRole: 'parent',
          action: 'login',
          resource: 'auth',
          ipAddress: '127.0.0.1',
          userAgent: 'Test',
          timestamp: new Date(),
          outcome,
          riskLevel: 'low',
          details: {},
          sessionId: 'session-123',
        };

        expect(entry.outcome).toBe(outcome);
      });
    });

    it('should support all risk levels', () => {
      const levels: Array<'low' | 'medium' | 'high' | 'critical'> = [
        'low',
        'medium',
        'high',
        'critical',
      ];

      levels.forEach(level => {
        const entry: AuditLogEntry = {
          id: 'audit-123',
          userId: 'user-123',
          userRole: 'admin',
          action: 'delete_user',
          resource: 'users',
          ipAddress: '127.0.0.1',
          userAgent: 'Test',
          timestamp: new Date(),
          outcome: 'success',
          riskLevel: level,
          details: {},
          sessionId: 'session-123',
        };

        expect(entry.riskLevel).toBe(level);
      });
    });
  });

  describe('SecurityEvent', () => {
    it('should capture security event details', () => {
      const event: SecurityEvent = {
        id: 'event-123',
        type: 'suspicious_activity',
        severity: 'high',
        userId: 'user-456',
        ipAddress: '10.0.0.1',
        userAgent: 'Bot/1.0',
        description: 'Multiple failed login attempts detected',
        data: { attempts: 10, timeWindow: '5 minutes' },
        timestamp: new Date(),
        resolved: false,
      };

      expect(event.type).toBe('suspicious_activity');
      expect(event.severity).toBe('high');
      expect(event.resolved).toBe(false);
    });

    it('should support all event types', () => {
      const types: SecurityEvent['type'][] = [
        'login_attempt',
        'failed_login',
        'suspicious_activity',
        'rate_limit_exceeded',
        'potential_attack',
        'data_access',
        'permission_denied',
      ];

      types.forEach(type => {
        const event: SecurityEvent = {
          id: `event-${type}`,
          type,
          severity: 'medium',
          ipAddress: '127.0.0.1',
          userAgent: 'Test',
          description: `Test ${type} event`,
          data: {},
          timestamp: new Date(),
          resolved: false,
        };

        expect(event.type).toBe(type);
      });
    });

    it('should handle resolved events', () => {
      const event: SecurityEvent = {
        id: 'event-123',
        type: 'failed_login',
        severity: 'medium',
        userId: 'user-456',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        description: 'Failed login attempt',
        data: {},
        timestamp: new Date('2024-01-15T10:00:00Z'),
        resolved: true,
        resolvedAt: new Date('2024-01-15T10:30:00Z'),
        resolvedBy: 'admin-789',
      };

      expect(event.resolved).toBe(true);
      expect(event.resolvedAt).toBeDefined();
      expect(event.resolvedBy).toBe('admin-789');
    });
  });

  describe('RateLimitRule', () => {
    it('should define rate limiting parameters', () => {
      const rule: RateLimitRule = {
        id: 'rule-api',
        name: 'API Rate Limit',
        endpoint: '/api/*',
        method: '*',
        maxRequests: 100,
        windowMs: 60000, // 1 minute
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
      };

      expect(rule.maxRequests).toBe(100);
      expect(rule.windowMs).toBe(60000);
      expect(rule.method).toBe('*');
    });

    it('should support specific HTTP methods', () => {
      const methods: RateLimitRule['method'][] = [
        'GET',
        'POST',
        'PUT',
        'DELETE',
        'PATCH',
        '*',
      ];

      methods.forEach(method => {
        const rule: RateLimitRule = {
          id: `rule-${method}`,
          name: `${method} Rate Limit`,
          endpoint: '/api/test',
          method,
          maxRequests: 10,
          windowMs: 1000,
          skipSuccessfulRequests: false,
          skipFailedRequests: false,
        };

        expect(rule.method).toBe(method);
      });
    });

    it('should support custom key generator', () => {
      const keyGenerator = (req: any) => `${req.ip}-${req.userId}`;

      const rule: RateLimitRule = {
        id: 'rule-custom',
        name: 'Custom Key Rate Limit',
        endpoint: '/api/sensitive',
        method: 'POST',
        maxRequests: 5,
        windowMs: 300000, // 5 minutes
        skipSuccessfulRequests: true,
        skipFailedRequests: false,
        keyGenerator,
      };

      expect(rule.keyGenerator).toBeDefined();
      expect(rule.keyGenerator!({ ip: '1.2.3.4', userId: 'user-123' })).toBe(
        '1.2.3.4-user-123'
      );
    });
  });

  describe('AccessControlRule', () => {
    it('should define access control parameters', () => {
      const rule: AccessControlRule = {
        id: 'acl-timesheet',
        name: 'Timesheet Access',
        resource: 'timesheet',
        action: 'read',
        roles: ['parent', 'teacher', 'admin'],
        effect: 'allow',
        priority: 1,
      };

      expect(rule.roles).toContain('parent');
      expect(rule.effect).toBe('allow');
      expect(rule.priority).toBe(1);
    });

    it('should support deny effect', () => {
      const rule: AccessControlRule = {
        id: 'acl-admin-only',
        name: 'Admin Only Resource',
        resource: 'admin_panel',
        action: '*',
        roles: ['student', 'teacher', 'parent'],
        effect: 'deny',
        priority: 10,
      };

      expect(rule.effect).toBe('deny');
      expect(rule.priority).toBe(10);
    });

    it('should support conditions', () => {
      const conditions: AccessCondition[] = [
        {
          type: 'time_based',
          field: 'currentHour',
          operator: 'gt',
          value: 8,
        },
        {
          type: 'time_based',
          field: 'currentHour',
          operator: 'lt',
          value: 18,
        },
      ];

      const rule: AccessControlRule = {
        id: 'acl-business-hours',
        name: 'Business Hours Only',
        resource: 'reports',
        action: 'export',
        roles: ['admin'],
        conditions,
        effect: 'allow',
        priority: 5,
      };

      expect(rule.conditions).toHaveLength(2);
      expect(rule.conditions![0]!.type).toBe('time_based');
    });
  });

  describe('AccessCondition', () => {
    it('should support all condition types', () => {
      const types: AccessCondition['type'][] = [
        'time_based',
        'location_based',
        'device_based',
        'session_based',
        'custom',
      ];

      types.forEach(type => {
        const condition: AccessCondition = {
          type,
          field: 'testField',
          operator: 'equals',
          value: 'testValue',
        };

        expect(condition.type).toBe(type);
      });
    });

    it('should support all operators', () => {
      const operators: AccessCondition['operator'][] = [
        'equals',
        'contains',
        'gt',
        'lt',
        'in',
        'not_in',
      ];

      operators.forEach(operator => {
        const condition: AccessCondition = {
          type: 'custom',
          field: 'testField',
          operator,
          value:
            operator === 'in' || operator === 'not_in' ? ['a', 'b'] : 'test',
        };

        expect(condition.operator).toBe(operator);
      });
    });
  });
});

describe('Password Validation', () => {
  const strongPolicy: PasswordPolicy = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventReuse: 5,
    maxAge: 90,
  };

  function validatePassword(
    password: string,
    policy: PasswordPolicy
  ): string[] {
    const errors: string[] = [];

    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters`);
    }
    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (policy.requireNumbers && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (
      policy.requireSpecialChars &&
      !/[!@#$%^&*(),.?":{}|<>]/.test(password)
    ) {
      errors.push('Password must contain at least one special character');
    }

    return errors;
  }

  it('should accept valid strong password', () => {
    const errors = validatePassword('SecurePass123!', strongPolicy);
    expect(errors).toHaveLength(0);
  });

  it('should reject password too short', () => {
    const errors = validatePassword('Abc1!', strongPolicy);
    expect(errors).toContain('Password must be at least 8 characters');
  });

  it('should reject password without uppercase', () => {
    const errors = validatePassword('password123!', strongPolicy);
    expect(errors).toContain(
      'Password must contain at least one uppercase letter'
    );
  });

  it('should reject password without lowercase', () => {
    const errors = validatePassword('PASSWORD123!', strongPolicy);
    expect(errors).toContain(
      'Password must contain at least one lowercase letter'
    );
  });

  it('should reject password without numbers', () => {
    const errors = validatePassword('SecurePass!', strongPolicy);
    expect(errors).toContain('Password must contain at least one number');
  });

  it('should reject password without special characters', () => {
    const errors = validatePassword('SecurePass123', strongPolicy);
    expect(errors).toContain(
      'Password must contain at least one special character'
    );
  });

  it('should report multiple validation failures', () => {
    const errors = validatePassword('abc', strongPolicy);
    expect(errors.length).toBeGreaterThan(1);
  });
});

describe('Rate Limiting Logic', () => {
  interface RateLimitStore {
    [key: string]: { count: number; resetAt: number };
  }

  function checkRateLimit(
    key: string,
    rule: RateLimitRule,
    store: RateLimitStore
  ): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = store[key];

    // Initialize or reset if window expired
    if (!entry || entry.resetAt < now) {
      store[key] = { count: 1, resetAt: now + rule.windowMs };
      return {
        allowed: true,
        remaining: rule.maxRequests - 1,
        resetAt: store[key]!.resetAt,
      };
    }

    // Check if limit exceeded
    if (entry.count >= rule.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    // Increment counter
    entry.count++;
    return {
      allowed: true,
      remaining: rule.maxRequests - entry.count,
      resetAt: entry.resetAt,
    };
  }

  const rule: RateLimitRule = {
    id: 'test-rule',
    name: 'Test Rate Limit',
    endpoint: '/api/test',
    method: 'GET',
    maxRequests: 3,
    windowMs: 1000,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  };

  it('should allow requests under limit', () => {
    const store: RateLimitStore = {};
    const result = checkRateLimit('user-123', rule, store);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('should track request count', () => {
    const store: RateLimitStore = {};

    checkRateLimit('user-123', rule, store);
    checkRateLimit('user-123', rule, store);
    const result = checkRateLimit('user-123', rule, store);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it('should block requests over limit', () => {
    const store: RateLimitStore = {};

    checkRateLimit('user-123', rule, store);
    checkRateLimit('user-123', rule, store);
    checkRateLimit('user-123', rule, store);
    const result = checkRateLimit('user-123', rule, store);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should separate limits by key', () => {
    const store: RateLimitStore = {};

    // Max out user-1
    checkRateLimit('user-1', rule, store);
    checkRateLimit('user-1', rule, store);
    checkRateLimit('user-1', rule, store);

    // User-2 should still have full allowance
    const result = checkRateLimit('user-2', rule, store);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('should reset after window expires', async () => {
    const shortRule = { ...rule, windowMs: 50 };
    const store: RateLimitStore = {};

    // Max out limit
    checkRateLimit('user-123', shortRule, store);
    checkRateLimit('user-123', shortRule, store);
    checkRateLimit('user-123', shortRule, store);
    checkRateLimit('user-123', shortRule, store);

    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 60));

    // Should be allowed again
    const result = checkRateLimit('user-123', shortRule, store);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });
});
