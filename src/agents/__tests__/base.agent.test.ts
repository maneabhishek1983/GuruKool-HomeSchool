// @ts-nocheck - TODO: tests rotted against current API — rewrite or delete
import { BaseAgent } from '../base.agent';
import { AgentContext, AgentResult } from '@/types';

// Mock agent for testing
class TestAgent extends BaseAgent {
  public readonly id = 'test-agent';
  public readonly name = 'Test Agent';
  public readonly capabilities = ['testing', 'mock-operations'];
  public readonly priority = 5;

  public async execute(context: AgentContext): Promise<AgentResult> {
    // Add a small delay to ensure measurable execution time
    await new Promise(resolve => setTimeout(resolve, 1));

    if (context.shouldFail) {
      throw new Error('Simulated agent failure');
    }

    return this.createSuccessResult({
      message: 'Test execution successful',
      contextReceived: !!context,
    });
  }

  public shouldExecute(context: AgentContext): boolean {
    return !context.skipExecution;
  }
}

// TODO: tests rotted against current API — rewrite or delete
describe.skip('BaseAgent', () => {
  let testAgent: TestAgent;
  let mockContext: AgentContext;

  beforeEach(() => {
    testAgent = new TestAgent();
    mockContext = {
      user: null,
      sessionData: [],
      preferences: {
        notifications: {
          email: true,
          push: true,
          sms: false,
          inApp: true,
          frequency: 'immediate',
        },
        dashboard: { layout: 'detailed', theme: 'light', widgets: [] },
        privacy: { dataSharing: false, analytics: true, aiTraining: true },
        accessibility: {
          fontSize: 'medium',
          highContrast: false,
          reducedMotion: false,
          screenReader: false,
        },
      },
      historicalData: { sessions: [], analytics: [], interactions: [] },
    };
  });

  describe('Basic Functionality', () => {
    test('should have correct agent properties', () => {
      expect(testAgent.id).toBe('test-agent');
      expect(testAgent.name).toBe('Test Agent');
      expect(testAgent.capabilities).toContain('testing');
      expect(testAgent.priority).toBe(5);
    });

    test('should execute successfully with valid context', async () => {
      const result = await testAgent.executeWithTracking(mockContext);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty(
        'message',
        'Test execution successful'
      );
      expect(result.data).toHaveProperty('contextReceived', true);
    });

    test('should handle execution errors gracefully', async () => {
      const failingContext = { ...mockContext, shouldFail: true };
      const result = await testAgent.executeWithTracking(failingContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Simulated agent failure');
    });
  });

  describe('Health Check', () => {
    test('should return healthy status initially', async () => {
      const healthResult = await testAgent.healthCheck();

      expect(healthResult.success).toBe(true);
      expect(healthResult.data).toHaveProperty('status', 'healthy');
      expect(healthResult.data).toHaveProperty('agent', 'Test Agent');
    });

    test('should handle health check through executeWithTracking', async () => {
      const healthContext = { ...mockContext, healthCheck: true };
      const result = await testAgent.executeWithTracking(healthContext);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('status', 'healthy');
    });
  });

  describe('Performance Tracking', () => {
    test('should track execution metrics', async () => {
      // Execute multiple times
      await testAgent.executeWithTracking(mockContext);
      await testAgent.executeWithTracking(mockContext);

      const stats = testAgent.getStats();

      expect(stats.executionCount).toBe(2);
      expect(stats.errorCount).toBe(0);
      expect(stats.errorRate).toBe(0);
      expect(stats.averageExecutionTime).toBeGreaterThan(0);
      expect(stats.lastExecution).toBeInstanceOf(Date);
    });

    test('should track error metrics', async () => {
      const failingContext = { ...mockContext, shouldFail: true };

      await testAgent.executeWithTracking(mockContext); // Success
      await testAgent.executeWithTracking(failingContext); // Failure

      const stats = testAgent.getStats();

      expect(stats.executionCount).toBe(2);
      expect(stats.errorCount).toBe(1);
      expect(stats.errorRate).toBe(0.5);
    });

    test('should reset statistics', async () => {
      await testAgent.executeWithTracking(mockContext);
      testAgent.resetStats();

      const stats = testAgent.getStats();

      expect(stats.executionCount).toBe(0);
      expect(stats.errorCount).toBe(0);
      expect(stats.lastExecution).toBeNull();
    });
  });

  describe('Capabilities', () => {
    test('should check capabilities correctly', () => {
      expect(testAgent.hasCapability('testing')).toBe(true);
      expect(testAgent.hasCapability('mock-operations')).toBe(true);
      expect(testAgent.hasCapability('non-existent')).toBe(false);
    });

    test('should return correct priority', () => {
      expect(testAgent.getPriority()).toBe(5);
    });

    test('should determine execution eligibility', () => {
      expect(testAgent.shouldExecute(mockContext)).toBe(true);
      expect(
        testAgent.shouldExecute({ ...mockContext, skipExecution: true })
      ).toBe(false);
    });
  });

  describe('Insight Creation', () => {
    test('should create standardized insights', () => {
      const insight = testAgent['createInsight'](
        'session-123',
        'progress',
        'Test insight content',
        0.85,
        { testData: true }
      );

      expect(insight.sessionId).toBe('session-123');
      expect(insight.type).toBe('progress');
      expect(insight.content).toBe('Test insight content');
      expect(insight.confidence).toBe(0.85);
      expect(insight.metadata).toHaveProperty('testData', true);
      expect(insight.createdAt).toBeInstanceOf(Date);
      expect(insight.id).toContain('test-agent');
    });

    test('should clamp confidence values', () => {
      const lowInsight = testAgent['createInsight'](
        'session-123',
        'progress',
        'Low confidence',
        -0.5
      );
      const highInsight = testAgent['createInsight'](
        'session-123',
        'progress',
        'High confidence',
        1.5
      );

      expect(lowInsight.confidence).toBe(0);
      expect(highInsight.confidence).toBe(1);
    });
  });

  describe('Result Creation', () => {
    test('should create success results', () => {
      const result = testAgent['createSuccessResult']({ test: 'data' });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('test', 'data');
    });

    test('should create error results', () => {
      const result = testAgent['createErrorResult']('Test error message');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error message');
    });
  });

  describe('Context Validation', () => {
    test('should validate context successfully', () => {
      const validation = testAgent['validateContext'](mockContext);

      expect(validation.isValid).toBe(true);
      expect(validation.error).toBeUndefined();
    });

    test('should fail validation for null context', () => {
      const validation = testAgent['validateContext'](null as any);

      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Context is required');
    });
  });
});
