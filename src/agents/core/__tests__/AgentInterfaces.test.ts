import { AgentContext, AgentResult, AIInsight, RecommendedAction } from '@/types';

describe('Agent Interfaces', () => {
  describe('AgentContext', () => {
    it('should create valid AgentContext with minimal required fields', () => {
      const context: AgentContext = {
        user: null,
        sessionData: [],
        preferences: {
          notifications: { email: true, push: true, sms: false, inApp: true, frequency: 'immediate' },
          dashboard: { layout: 'detailed', theme: 'light', widgets: [] },
          privacy: { dataSharing: false, analytics: true, aiTraining: true },
          accessibility: { fontSize: 'medium', highContrast: false, reducedMotion: false, screenReader: false }
        },
        historicalData: { sessions: [], analytics: [], interactions: [] },
      };

      expect(context).toBeDefined();
      expect(context.user).toBeNull();
      expect(context.sessionData).toEqual([]);
      expect(context.preferences).toBeDefined();
      expect(context.historicalData).toBeDefined();
    });

    it('should create AgentContext with full user data', () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'parent' as const,
        preferences: {
          notifications: { email: true, push: true, sms: false, inApp: true, frequency: 'immediate' as const },
          dashboard: { layout: 'detailed' as const, theme: 'light' as const, widgets: [] },
          privacy: { dataSharing: false, analytics: true, aiTraining: true },
          accessibility: { fontSize: 'medium' as const, highContrast: false, reducedMotion: false, screenReader: false }
        },
        createdAt: new Date(),
        lastActive: new Date(),
      };

      const context: AgentContext = {
        user: mockUser,
        sessionData: [],
        preferences: mockUser.preferences,
        historicalData: { sessions: [], analytics: [], interactions: [] },
        timestamp: Date.now(),
        sessionId: 'session123',
      };

      expect(context.user).toEqual(mockUser);
      expect(context.timestamp).toBeDefined();
      expect(context.sessionId).toBe('session123');
    });

    it('should support authentication context properties', () => {
      const context: AgentContext = {
        user: null,
        sessionData: [],
        preferences: {
          notifications: { email: true, push: true, sms: false, inApp: true, frequency: 'immediate' },
          dashboard: { layout: 'detailed', theme: 'light', widgets: [] },
          privacy: { dataSharing: false, analytics: true, aiTraining: true },
          accessibility: { fontSize: 'medium', highContrast: false, reducedMotion: false, screenReader: false }
        },
        historicalData: { sessions: [], analytics: [], interactions: [] },
        tokenData: { token: 'abc123', expiry: Date.now() + 3600000 },
        userAgent: 'Mozilla/5.0...',
        ipAddress: '192.168.1.1',
        multiFactorRequired: true,
        riskScore: 0.3,
        authFactors: ['password', 'sms'],
      };

      expect(context.tokenData).toBeDefined();
      expect(context.userAgent).toBe('Mozilla/5.0...');
      expect(context.ipAddress).toBe('192.168.1.1');
      expect(context.multiFactorRequired).toBe(true);
      expect(context.riskScore).toBe(0.3);
      expect(context.authFactors).toEqual(['password', 'sms']);
    });

    it('should support task automation context properties', () => {
      const context: AgentContext = {
        user: null,
        sessionData: [],
        preferences: {
          notifications: { email: true, push: true, sms: false, inApp: true, frequency: 'immediate' },
          dashboard: { layout: 'detailed', theme: 'light', widgets: [] },
          privacy: { dataSharing: false, analytics: true, aiTraining: true },
          accessibility: { fontSize: 'medium', highContrast: false, reducedMotion: false, screenReader: false }
        },
        historicalData: { sessions: [], analytics: [], interactions: [] },
        urgencyLevel: 'high',
        batchMode: true,
        batchData: [{ id: 1, data: 'test' }, { id: 2, data: 'test2' }],
      };

      expect(context.urgencyLevel).toBe('high');
      expect(context.batchMode).toBe(true);
      expect(context.batchData).toHaveLength(2);
    });

    it('should support communication context properties', () => {
      const context: AgentContext = {
        user: null,
        sessionData: [],
        preferences: {
          notifications: { email: true, push: true, sms: false, inApp: true, frequency: 'immediate' },
          dashboard: { layout: 'detailed', theme: 'light', widgets: [] },
          privacy: { dataSharing: false, analytics: true, aiTraining: true },
          accessibility: { fontSize: 'medium', highContrast: false, reducedMotion: false, screenReader: false }
        },
        historicalData: { sessions: [], analytics: [], interactions: [] },
        notificationPreferences: {
          email: true,
          push: false,
          sms: true,
          inApp: true,
          frequency: 'daily'
        },
        communicationChannel: 'email',
      };

      expect(context.notificationPreferences).toBeDefined();
      expect(context.communicationChannel).toBe('email');
    });

    it('should support analytics context properties', () => {
      const context: AgentContext = {
        user: null,
        sessionData: [],
        preferences: {
          notifications: { email: true, push: true, sms: false, inApp: true, frequency: 'immediate' },
          dashboard: { layout: 'detailed', theme: 'light', widgets: [] },
          privacy: { dataSharing: false, analytics: true, aiTraining: true },
          accessibility: { fontSize: 'medium', highContrast: false, reducedMotion: false, screenReader: false }
        },
        historicalData: { sessions: [], analytics: [], interactions: [] },
        analyticsScope: 'student',
        timeRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31')
        },
      };

      expect(context.analyticsScope).toBe('student');
      expect(context.timeRange).toBeDefined();
      expect(context.timeRange?.start).toBeInstanceOf(Date);
      expect(context.timeRange?.end).toBeInstanceOf(Date);
    });

    it('should support system context properties', () => {
      const context: AgentContext = {
        user: null,
        sessionData: [],
        preferences: {
          notifications: { email: true, push: true, sms: false, inApp: true, frequency: 'immediate' },
          dashboard: { layout: 'detailed', theme: 'light', widgets: [] },
          privacy: { dataSharing: false, analytics: true, aiTraining: true },
          accessibility: { fontSize: 'medium', highContrast: false, reducedMotion: false, screenReader: false }
        },
        historicalData: { sessions: [], analytics: [], interactions: [] },
        healthCheck: true,
        eventType: 'session_completed',
        eventData: { sessionId: 'session123', duration: 3600 },
        deviceInfo: 'iPhone 12 Pro',
        mcpData: { serverResponse: 'success' },
        metadata: { customField: 'customValue' },
      };

      expect(context.healthCheck).toBe(true);
      expect(context.eventType).toBe('session_completed');
      expect(context.eventData).toBeDefined();
      expect(context.deviceInfo).toBe('iPhone 12 Pro');
      expect(context.mcpData).toBeDefined();
      expect(context.metadata).toBeDefined();
    });
  });

  describe('AgentResult', () => {
    it('should create successful AgentResult with minimal data', () => {
      const result: AgentResult = {
        success: true,
        data: { message: 'Success' },
      };

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ message: 'Success' });
      expect(result.error).toBeUndefined();
    });

    it('should create failed AgentResult with error', () => {
      const result: AgentResult = {
        success: false,
        error: 'Something went wrong',
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe('Something went wrong');
      expect(result.data).toBeUndefined();
    });

    it('should create AgentResult with insights', () => {
      const insights: AIInsight[] = [
        {
          id: 'insight1',
          sessionId: 'session123',
          type: 'recommendation',
          content: 'Student shows improvement in math',
          confidence: 0.85,
          metadata: { subject: 'math' },
          createdAt: new Date(),
        },
        {
          id: 'insight2',
          sessionId: 'session123',
          type: 'alert',
          content: 'Student missed 3 consecutive sessions',
          confidence: 1.0,
          metadata: { alertType: 'attendance' },
          createdAt: new Date(),
        },
      ];

      const result: AgentResult = {
        success: true,
        data: { processed: true },
        insights,
      };

      expect(result.insights).toHaveLength(2);
      expect(result.insights![0].type).toBe('recommendation');
      expect(result.insights![1].type).toBe('alert');
      expect(result.insights![0].confidence).toBe(0.85);
      expect(result.insights![1].confidence).toBe(1.0);
    });

    it('should create AgentResult with recommended actions', () => {
      const actions: RecommendedAction[] = [
        {
          id: 'action1',
          type: 'schedule',
          description: 'Schedule makeup session',
          priority: 8,
          automated: false,
        },
        {
          id: 'action2',
          type: 'notification',
          description: 'Send reminder to parent',
          priority: 5,
          automated: true,
        },
      ];

      const result: AgentResult = {
        success: true,
        data: { processed: true },
        actions,
      };

      expect(result.actions).toHaveLength(2);
      expect(result.actions![0].type).toBe('schedule');
      expect(result.actions![1].type).toBe('notification');
      expect(result.actions![0].automated).toBe(false);
      expect(result.actions![1].automated).toBe(true);
    });

    it('should create AgentResult with performance metrics', () => {
      const result: AgentResult = {
        success: true,
        data: { processed: true },
        executionTime: 150,
        confidence: 0.92,
      };

      expect(result.executionTime).toBe(150);
      expect(result.confidence).toBe(0.92);
    });

    it('should create AgentResult with follow-up actions and metadata', () => {
      const result: AgentResult = {
        success: true,
        data: { processed: true },
        nextActions: ['validate_results', 'send_notifications', 'update_analytics'],
        metadata: {
          agentId: 'test-agent',
          agentName: 'Test Agent',
          version: '1.0.0',
          customData: { key: 'value' },
        },
      };

      expect(result.nextActions).toHaveLength(3);
      expect(result.nextActions).toContain('validate_results');
      expect(result.metadata?.agentId).toBe('test-agent');
      expect(result.metadata?.customData).toEqual({ key: 'value' });
    });

    it('should create comprehensive AgentResult with all properties', () => {
      const insights: AIInsight[] = [
        {
          id: 'insight1',
          sessionId: 'session123',
          type: 'prediction',
          content: 'Student likely to excel in advanced topics',
          confidence: 0.78,
          metadata: { model: 'prediction-v2' },
          createdAt: new Date(),
        },
      ];

      const actions: RecommendedAction[] = [
        {
          id: 'action1',
          type: 'curriculum',
          description: 'Introduce advanced math concepts',
          priority: 7,
          automated: false,
        },
      ];

      const result: AgentResult = {
        success: true,
        data: {
          analysisComplete: true,
          studentsProcessed: 5,
          recommendations: 3,
        },
        insights,
        actions,
        executionTime: 245,
        confidence: 0.88,
        nextActions: ['schedule_advanced_sessions', 'notify_teacher'],
        metadata: {
          agentId: 'analytics-agent',
          agentName: 'Analytics Agent',
          timestamp: Date.now(),
          version: '2.1.0',
          processingMode: 'batch',
        },
      };

      expect(result.success).toBe(true);
      expect(result.data.studentsProcessed).toBe(5);
      expect(result.insights).toHaveLength(1);
      expect(result.actions).toHaveLength(1);
      expect(result.executionTime).toBe(245);
      expect(result.confidence).toBe(0.88);
      expect(result.nextActions).toHaveLength(2);
      expect(result.metadata?.agentId).toBe('analytics-agent');
    });
  });

  describe('Type Safety', () => {
    it('should enforce required properties in AgentContext', () => {
      // This test ensures TypeScript compilation catches missing required properties
      const context: AgentContext = {
        user: null,
        sessionData: [],
        preferences: {
          notifications: { email: true, push: true, sms: false, inApp: true, frequency: 'immediate' },
          dashboard: { layout: 'detailed', theme: 'light', widgets: [] },
          privacy: { dataSharing: false, analytics: true, aiTraining: true },
          accessibility: { fontSize: 'medium', highContrast: false, reducedMotion: false, screenReader: false }
        },
        historicalData: { sessions: [], analytics: [], interactions: [] },
      };

      expect(context).toBeDefined();
    });

    it('should enforce required properties in AgentResult', () => {
      // This test ensures TypeScript compilation catches missing required properties
      const successResult: AgentResult = {
        success: true,
      };

      const errorResult: AgentResult = {
        success: false,
        error: 'Test error',
      };

      expect(successResult.success).toBe(true);
      expect(errorResult.success).toBe(false);
      expect(errorResult.error).toBe('Test error');
    });

    it('should support optional properties correctly', () => {
      const context: AgentContext = {
        user: null,
        sessionData: [],
        preferences: {
          notifications: { email: true, push: true, sms: false, inApp: true, frequency: 'immediate' },
          dashboard: { layout: 'detailed', theme: 'light', widgets: [] },
          privacy: { dataSharing: false, analytics: true, aiTraining: true },
          accessibility: { fontSize: 'medium', highContrast: false, reducedMotion: false, screenReader: false }
        },
        historicalData: { sessions: [], analytics: [], interactions: [] },
      };

      // All optional properties should be undefined by default
      expect(context.timestamp).toBeUndefined();
      expect(context.sessionId).toBeUndefined();
      expect(context.healthCheck).toBeUndefined();
      expect(context.urgencyLevel).toBeUndefined();
      expect(context.batchMode).toBeUndefined();
    });
  });
});