import { BaseAIAgent } from '../BaseAIAgent';
import { AgentContext, AgentResult } from '@/types';

// Concrete implementation for testing
class TestAgent extends BaseAIAgent {
  public readonly id = 'test-agent';
  public readonly name = 'Test Agent';
  public readonly capabilities = ['test', 'validation'];
  public readonly priority = 5;

  private shouldFail = false;
  private executionDelay = 0;
  private customValidation?: (context: AgentContext) => { isValid: boolean; error?: string };

  public async execute(context: AgentContext): Promise<AgentResult> {
    if (this.executionDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.executionDelay));
    }

    if (this.shouldFail) {
      throw new Error('Test agent execution failed');
    }

    const insights = [];
    if (context.sessionId) {
      insights.push(this.createInsight(
        context.sessionId,
        'recommendation',
        'Test insight generated',
        0.8,
        { testData: true }
      ));
    }

    return this.createSuccessResult(
      {
        message: 'Test execution successful',
        contextInfo: {
          hasUser: !!context.user,
          sessionCount: context.sessionData?.length || 0,
          timestamp: context.timestamp,
        },
      },
      insights,
      [{ id: 'test-action', type: 'test', description: 'Test action', priority: 1, automated: false }]
    );
  }

  // Test helpers
  public setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  public setExecutionDelay(delay: number): void {
    this.executionDelay = delay;
  }

  public setCustomValidation(validation: (context: AgentContext) => { isValid: boolean; error?: string }): void {
    this.customValidation = validation;
  }

  protected validateContext(context: AgentContext): { isValid: boolean; error?: string } {
    if (this.customValidation) {
      return this.customValidation(context);
    }
    return super.validateContext(context);
  }
}

// Agent with user dependency for testing
class UserDependentAgent extends BaseAIAgent {
  public readonly id = 'user-dependent-agent';
  public readonly name = 'User Dependent Agent';
  public readonly capabilities = ['user-dependent', 'test'];
  public readonly priority = 3;

  public async execute(context: AgentContext): Promise<AgentResult> {
    return this.createSuccessResult({
      userId: context.user?.id,
      userName: context.user?.name,
    });
  }
}

// Agent with session dependency for testing
class SessionDependentAgent extends BaseAIAgent {
  public readonly id = 'session-dependent-agent';
  public readonly name = 'Session Dependent Agent';
  public readonly capabilities = ['session-dependent', 'test'];
  public readonly priority = 2;

  public async execute(context: AgentContext): Promise<AgentResult> {
    return this.createSuccessResult({
      sessionCount: context.sessionData?.length || 0,
      sessions: context.sessionData?.map(s => s.id) || [],
    });
  }
}

describe('BaseAIAgent', () => {
  let testAgent: TestAgent;
  let userDependentAgent: UserDependentAgent;
  let sessionDependentAgent: SessionDependentAgent;

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

  const mockSession = {
    id: 'session1',
    studentId: 'student1',
    teacherId: 'teacher1',
    parentId: 'parent1',
    subject: 'Math',
    scheduledStart: new Date(),
    scheduledEnd: new Date(),
    location: {
      address: '123 Test St',
      coordinates: { latitude: 0, longitude: 0 },
      verified: true,
    },
    status: 'scheduled' as const,
    aiInsights: [],
    attachments: [],
  };

  const baseContext: AgentContext = {
    user: mockUser,
    sessionData: [mockSession],
    preferences: mockUser.preferences,
    historicalData: { sessions: [], analytics: [], interactions: [] },
    timestamp: Date.now(),
  };

  beforeEach(() => {
    testAgent = new TestAgent();
    userDependentAgent = new UserDependentAgent();
    sessionDependentAgent = new SessionDependentAgent();
  });

  describe('Basic Properties', () => {
    it('should have required properties', () => {
      expect(testAgent.id).toBe('test-agent');
      expect(testAgent.name).toBe('Test Agent');
      expect(testAgent.capabilities).toEqual(['test', 'validation']);
      expect(testAgent.priority).toBe(5);
    });

    it('should check capabilities', () => {
      expect(testAgent.hasCapability('test')).toBe(true);
      expect(testAgent.hasCapability('validation')).toBe(true);
      expect(testAgent.hasCapability('non-existent')).toBe(false);
    });

    it('should determine execution eligibility', () => {
      expect(testAgent.shouldExecute(baseContext)).toBe(true);
    });
  });

  describe('Execution with Tracking', () => {
    it('should execute successfully with tracking', async () => {
      const result = await testAgent.executeWithTracking(baseContext);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.message).toBe('Test execution successful');
      expect(result.executionTime).toBeDefined();
      expect(result.metadata?.agentId).toBe('test-agent');
      expect(result.metadata?.agentName).toBe('Test Agent');
    });

    it('should handle execution errors', async () => {
      testAgent.setShouldFail(true);
      
      const result = await testAgent.executeWithTracking(baseContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Agent execution failed');
      expect(result.metadata?.executionTime).toBeDefined();
    });

    it('should track performance metrics', async () => {
      // Set a small delay to ensure measurable execution time
      testAgent.setExecutionDelay(2);
      
      await testAgent.executeWithTracking(baseContext);
      await testAgent.executeWithTracking(baseContext);
      
      testAgent.setShouldFail(true);
      await testAgent.executeWithTracking(baseContext);

      const stats = testAgent.getPerformanceStats();
      expect(stats.executionCount).toBe(3);
      expect(stats.errorCount).toBe(1);
      expect(stats.errorRate).toBeCloseTo(1/3);
      expect(stats.averageExecutionTime).toBeGreaterThan(0);
      expect(stats.lastExecution).toBeInstanceOf(Date);
      expect(stats.isHealthy).toBe(false);
    });

    it('should reset statistics', async () => {
      await testAgent.executeWithTracking(baseContext);
      testAgent.resetStats();

      const stats = testAgent.getPerformanceStats();
      expect(stats.executionCount).toBe(0);
      expect(stats.errorCount).toBe(0);
      expect(stats.errorRate).toBe(0);
      expect(stats.averageExecutionTime).toBe(0);
      expect(stats.lastExecution).toBeNull();
      expect(stats.isHealthy).toBe(true);
    });
  });

  describe('Context Validation', () => {
    it('should validate basic context', async () => {
      const result = await testAgent.executeWithTracking(baseContext);
      expect(result.success).toBe(true);
    });

    it('should reject null context', async () => {
      const result = await testAgent.executeWithTracking(null as any);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Context is required');
    });

    it('should validate user-dependent agents', async () => {
      const contextWithoutUser = { ...baseContext, user: null };
      const result = await userDependentAgent.executeWithTracking(contextWithoutUser);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('User context is required');
    });

    it('should validate session-dependent agents', async () => {
      const contextWithoutSessions = { ...baseContext, sessionData: [] };
      const result = await sessionDependentAgent.executeWithTracking(contextWithoutSessions);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Session data is required');
    });

    it('should use custom validation', async () => {
      testAgent.setCustomValidation((context) => {
        if (!context.timestamp) {
          return { isValid: false, error: 'Timestamp is required' };
        }
        return { isValid: true };
      });

      const contextWithoutTimestamp = { ...baseContext };
      delete contextWithoutTimestamp.timestamp;

      const result = await testAgent.executeWithTracking(contextWithoutTimestamp);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Timestamp is required');
    });
  });

  describe('Health Check', () => {
    it('should perform health check', async () => {
      const healthContext = { ...baseContext, healthCheck: true };
      const result = await testAgent.executeWithTracking(healthContext);

      expect(result.success).toBe(true);
      expect(result.data.agentId).toBe('test-agent');
      expect(result.data.agentName).toBe('Test Agent');
      expect(result.data.status).toBe('healthy');
      expect(result.data.capabilities).toEqual(['test', 'validation']);
      expect(result.data.priority).toBe(5);
    });

    it('should report unhealthy status after errors', async () => {
      testAgent.setShouldFail(true);
      await testAgent.executeWithTracking(baseContext);

      const healthContext = { ...baseContext, healthCheck: true };
      const result = await testAgent.executeWithTracking(healthContext);

      expect(result.success).toBe(false);
      expect(result.data.status).toBe('unhealthy');
    });
  });

  describe('Insight Creation', () => {
    it('should create insights during execution', async () => {
      const contextWithSession = { ...baseContext, sessionId: 'session1' };
      const result = await testAgent.executeWithTracking(contextWithSession);

      expect(result.success).toBe(true);
      expect(result.insights).toHaveLength(1);
      
      const insight = result.insights![0];
      expect(insight.sessionId).toBe('session1');
      expect(insight.type).toBe('recommendation');
      expect(insight.content).toBe('Test insight generated');
      expect(insight.confidence).toBe(0.8);
      expect(insight.metadata?.agentId).toBe('test-agent');
      expect(insight.metadata?.testData).toBe(true);
    });

    it('should clamp confidence values', async () => {
      // Test through a custom agent that creates insights with invalid confidence
      class ConfidenceTestAgent extends BaseAIAgent {
        public readonly id = 'confidence-test';
        public readonly name = 'Confidence Test';
        public readonly capabilities = ['test'];
        public readonly priority = 1;

        public async execute(context: AgentContext): Promise<AgentResult> {
          const insights = [
            this.createInsight('session1', 'recommendation', 'High confidence', 1.5), // Should clamp to 1
            this.createInsight('session1', 'recommendation', 'Negative confidence', -0.5), // Should clamp to 0
          ];

          return this.createSuccessResult({ test: true }, insights);
        }
      }

      const confidenceAgent = new ConfidenceTestAgent();
      const result = await confidenceAgent.executeWithTracking(baseContext);

      expect(result.insights).toHaveLength(2);
      expect(result.insights![0].confidence).toBe(1);
      expect(result.insights![1].confidence).toBe(0);
    });
  });

  describe('Result Creation', () => {
    it('should create success results with metadata', async () => {
      const result = await testAgent.executeWithTracking(baseContext);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.insights).toBeDefined();
      expect(result.actions).toBeDefined();
      expect(result.metadata?.agentId).toBe('test-agent');
      expect(result.metadata?.agentName).toBe('Test Agent');
      expect(result.metadata?.timestamp).toBeDefined();
    });

    it('should create error results with metadata', async () => {
      testAgent.setShouldFail(true);
      const result = await testAgent.executeWithTracking(baseContext);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.metadata?.agentId).toBe('test-agent');
      expect(result.metadata?.agentName).toBe('Test Agent');
      expect(result.metadata?.timestamp).toBeDefined();
    });
  });

  describe('Logging', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log messages with agent context', () => {
      // Access protected method through type assertion
      (testAgent as any).log('info', 'Test message', { test: true });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Test Agent]',
        'Test message',
        { test: true }
      );
    });
  });

  describe('Context Data Processing', () => {
    it('should process context data safely', () => {
      const processor = (data: any) => data.value * 2;
      const fallback = 0;

      // Access protected method through type assertion
      const result1 = (testAgent as any).processContextData({ value: 5 }, processor, fallback);
      expect(result1).toBe(10);

      const result2 = (testAgent as any).processContextData(null, processor, fallback);
      expect(result2).toBe(0);

      const result3 = (testAgent as any).processContextData({ invalid: true }, processor, fallback);
      expect(result3).toBe(0);
    });

    it('should extract relevant sessions', () => {
      // Access protected method through type assertion
      const sessions = (testAgent as any).extractRelevantSessions(baseContext);
      expect(sessions).toEqual([mockSession]);

      const emptyContext = { ...baseContext, sessionData: [] };
      const emptySessions = (testAgent as any).extractRelevantSessions(emptyContext);
      expect(emptySessions).toEqual([]);
    });
  });

  describe('Execution Summary', () => {
    it('should generate execution summary', async () => {
      const result = await testAgent.executeWithTracking(baseContext);
      
      // Access protected method through type assertion
      const summary = (testAgent as any).generateExecutionSummary(baseContext, result);
      
      expect(summary).toContain('Agent: Test Agent');
      expect(summary).toContain('Success: true');
      expect(summary).toContain('Execution Time:');
      // Check if insights are mentioned in summary (could be 0 or more)
      expect(summary).toContain('Actions Recommended: 1');
    });

    it('should include error in summary', async () => {
      testAgent.setShouldFail(true);
      const result = await testAgent.executeWithTracking(baseContext);
      
      // Access protected method through type assertion
      const summary = (testAgent as any).generateExecutionSummary(baseContext, result);
      
      expect(summary).toContain('Success: false');
      expect(summary).toContain('Error:');
    });
  });
});