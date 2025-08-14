import { AgentOrchestrator } from '../AgentOrchestrator';
import { BaseAIAgent } from '../BaseAIAgent';
import { AgentContext, AgentResult } from '@/types';

// Simple test agent
class SimpleTestAgent extends BaseAIAgent {
  public readonly id = 'simple-test-agent';
  public readonly name = 'Simple Test Agent';
  public readonly capabilities = ['test', 'simple'];
  public readonly priority = 5;

  public async execute(context: AgentContext): Promise<AgentResult> {
    return this.createSuccessResult({
      message: 'Simple test execution completed',
      timestamp: Date.now(),
      hasUser: !!context.user,
    });
  }
}

describe('Core AI Agent Architecture Integration', () => {
  let orchestrator: AgentOrchestrator;
  let testAgent: SimpleTestAgent;

  beforeEach(() => {
    // Reset singleton for each test
    (AgentOrchestrator as any).instance = undefined;
    orchestrator = AgentOrchestrator.getInstance();
    testAgent = new SimpleTestAgent();
  });

  afterEach(() => {
    orchestrator.clearQueue();
  });

  it('should create AgentOrchestrator singleton', () => {
    const instance1 = AgentOrchestrator.getInstance();
    const instance2 = AgentOrchestrator.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should register and execute agent successfully', async () => {
    orchestrator.registerAgent(testAgent);

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

    const result = await orchestrator.executeAgent('simple-test-agent', context);

    expect(result.success).toBe(true);
    expect(result.data.message).toBe('Simple test execution completed');
    expect(result.executionTime).toBeDefined();
    expect(result.metadata?.agentId).toBe('simple-test-agent');
  });

  it('should handle agent not found', async () => {
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

    const result = await orchestrator.executeAgent('non-existent-agent', context);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Agent 'non-existent-agent' not found");
  });

  it('should provide orchestrator statistics', () => {
    orchestrator.registerAgent(testAgent);

    const stats = orchestrator.getStats();

    expect(stats.totalAgents).toBe(1);
    expect(stats.queuedExecutions).toBe(0);
    expect(stats.activeExecutions).toBe(0);
    expect(stats.agentsByCapability.test).toBe(1);
    expect(stats.agentsByCapability.simple).toBe(1);
  });

  it('should perform health check', async () => {
    orchestrator.registerAgent(testAgent);

    const healthCheck = await orchestrator.healthCheck();

    expect(healthCheck.overall).toBe('healthy');
    expect(healthCheck.agents['simple-test-agent']).toBe('healthy');
    expect(healthCheck.details['simple-test-agent']).toBeDefined();
  });

  it('should execute agents by capability', async () => {
    orchestrator.registerAgent(testAgent);

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

    const results = await orchestrator.executeByCapability('test', context);

    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(true);
    expect(results[0].data.message).toBe('Simple test execution completed');
  });

  it('should validate AgentContext structure', () => {
    const context: AgentContext = {
      user: {
        id: 'user1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'parent',
        preferences: {
          notifications: { email: true, push: true, sms: false, inApp: true, frequency: 'immediate' },
          dashboard: { layout: 'detailed', theme: 'light', widgets: [] },
          privacy: { dataSharing: false, analytics: true, aiTraining: true },
          accessibility: { fontSize: 'medium', highContrast: false, reducedMotion: false, screenReader: false }
        },
        createdAt: new Date(),
        lastActive: new Date(),
      },
      sessionData: [],
      preferences: {
        notifications: { email: true, push: true, sms: false, inApp: true, frequency: 'immediate' },
        dashboard: { layout: 'detailed', theme: 'light', widgets: [] },
        privacy: { dataSharing: false, analytics: true, aiTraining: true },
        accessibility: { fontSize: 'medium', highContrast: false, reducedMotion: false, screenReader: false }
      },
      historicalData: { sessions: [], analytics: [], interactions: [] },
      timestamp: Date.now(),
      urgencyLevel: 'medium',
      metadata: { testKey: 'testValue' },
    };

    expect(context.user).toBeDefined();
    expect(context.user?.role).toBe('parent');
    expect(context.urgencyLevel).toBe('medium');
    expect(context.metadata?.testKey).toBe('testValue');
  });

  it('should validate AgentResult structure', async () => {
    orchestrator.registerAgent(testAgent);

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

    const result = await orchestrator.executeAgent('simple-test-agent', context);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.executionTime).toBeDefined();
    expect(result.metadata).toBeDefined();
    expect(result.metadata?.agentId).toBe('simple-test-agent');
    expect(result.metadata?.agentName).toBe('Simple Test Agent');
  });
});