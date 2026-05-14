import { AgentOrchestrator } from '../AgentOrchestrator';
import { BaseAIAgent } from '../BaseAIAgent';
import { AgentContext, AgentResult } from '@/types';

// Mock agent for testing
class MockAgent extends BaseAIAgent {
  public readonly id: string;
  public readonly name: string;
  public readonly capabilities: string[];
  public readonly priority: number;
  private shouldFail: boolean;
  private executionDelay: number;

  constructor(
    id: string,
    name: string,
    capabilities: string[] = ['test'],
    priority: number = 1,
    shouldFail: boolean = false,
    executionDelay: number = 0
  ) {
    super();
    this.id = id;
    this.name = name;
    this.capabilities = capabilities;
    this.priority = priority;
    this.shouldFail = shouldFail;
    this.executionDelay = executionDelay;
  }

  public async execute(context: AgentContext): Promise<AgentResult> {
    if (this.executionDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.executionDelay));
    }

    if (this.shouldFail) {
      throw new Error(`Mock agent ${this.id} failed`);
    }

    return this.createSuccessResult({
      agentId: this.id,
      message: `Executed successfully`,
      contextData: {
        hasUser: !!context.user,
        sessionCount: context.sessionData?.length || 0,
        timestamp: context.timestamp,
      },
    });
  }

  public setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }
}

describe('AgentOrchestrator', () => {
  let orchestrator: AgentOrchestrator;
  let mockAgent1: MockAgent;
  let mockAgent2: MockAgent;
  let mockAgent3: MockAgent;

  beforeEach(() => {
    // Create new instance for each test
    (AgentOrchestrator as any).instance = undefined;
    orchestrator = AgentOrchestrator.getInstance();

    mockAgent1 = new MockAgent(
      'agent1',
      'Test Agent 1',
      ['capability1', 'shared'],
      10
    );
    mockAgent2 = new MockAgent(
      'agent2',
      'Test Agent 2',
      ['capability2', 'shared'],
      5
    );
    mockAgent3 = new MockAgent('agent3', 'Test Agent 3', ['capability3'], 1);
  });

  afterEach(() => {
    orchestrator.clearQueue();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = AgentOrchestrator.getInstance();
      const instance2 = AgentOrchestrator.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Agent Registration', () => {
    it('should register agents successfully', () => {
      orchestrator.registerAgent(mockAgent1);
      orchestrator.registerAgent(mockAgent2);

      const stats = orchestrator.getStats();
      expect(stats.totalAgents).toBe(2);
    });

    it('should throw error when registering duplicate agent IDs', () => {
      orchestrator.registerAgent(mockAgent1);

      expect(() => {
        orchestrator.registerAgent(mockAgent1);
      }).toThrow("Agent with id 'agent1' is already registered");
    });

    it('should unregister agents successfully', () => {
      orchestrator.registerAgent(mockAgent1);
      orchestrator.registerAgent(mockAgent2);

      const removed = orchestrator.unregisterAgent('agent1');
      expect(removed).toBe(true);

      const stats = orchestrator.getStats();
      expect(stats.totalAgents).toBe(1);
    });

    it('should return false when unregistering non-existent agent', () => {
      const removed = orchestrator.unregisterAgent('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('Agent Retrieval', () => {
    beforeEach(() => {
      orchestrator.registerAgent(mockAgent1);
      orchestrator.registerAgent(mockAgent2);
      orchestrator.registerAgent(mockAgent3);
    });

    it('should get agent by ID', () => {
      const agent = orchestrator.getAgent('agent1');
      expect(agent).toBe(mockAgent1);
    });

    it('should return undefined for non-existent agent', () => {
      const agent = orchestrator.getAgent('non-existent');
      expect(agent).toBeUndefined();
    });

    it('should get all agents', () => {
      const agents = orchestrator.getAllAgents();
      expect(agents).toHaveLength(3);
      expect(agents).toContain(mockAgent1);
      expect(agents).toContain(mockAgent2);
      expect(agents).toContain(mockAgent3);
    });

    it('should get agents by capability', () => {
      const sharedCapabilityAgents =
        orchestrator.getAgentsByCapability('shared');
      expect(sharedCapabilityAgents).toHaveLength(2);
      expect(sharedCapabilityAgents).toContain(mockAgent1);
      expect(sharedCapabilityAgents).toContain(mockAgent2);

      const capability3Agents =
        orchestrator.getAgentsByCapability('capability3');
      expect(capability3Agents).toHaveLength(1);
      expect(capability3Agents).toContain(mockAgent3);
    });
  });

  describe('Agent Execution', () => {
    const mockContext: AgentContext = {
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

    beforeEach(() => {
      orchestrator.registerAgent(mockAgent1);
      orchestrator.registerAgent(mockAgent2);
    });

    it('should execute agent successfully', async () => {
      const result = await orchestrator.executeAgent('agent1', mockContext);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.agentId).toBe('agent1');
      expect(result.executionTime).toBeDefined();
      expect(result.metadata?.agentId).toBe('agent1');
    });

    it('should return error for non-existent agent', async () => {
      const result = await orchestrator.executeAgent(
        'non-existent',
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Agent 'non-existent' not found");
    });

    it('should handle agent execution errors', async () => {
      mockAgent1.setShouldFail(true);

      const result = await orchestrator.executeAgent('agent1', mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Mock agent agent1 failed');
    });

    it('should enrich context with metadata', async () => {
      const result = await orchestrator.executeAgent('agent1', mockContext);

      expect(result.success).toBe(true);
      expect(result.data.contextData.timestamp).toBeDefined();
      expect(result.metadata?.executionId).toBeDefined();
    });
  });

  describe('Parallel Execution', () => {
    const mockContext: AgentContext = {
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

    beforeEach(() => {
      orchestrator.registerAgent(mockAgent1);
      orchestrator.registerAgent(mockAgent2);
      orchestrator.registerAgent(mockAgent3);
    });

    it('should execute multiple agents in parallel', async () => {
      const requests = [
        { agentId: 'agent1', context: mockContext },
        { agentId: 'agent2', context: mockContext },
        { agentId: 'agent3', context: mockContext },
      ];

      const results = await orchestrator.executeAgentsParallel(requests);

      expect(results).toHaveLength(3);
      expect(results[0]!.success).toBe(true);
      expect(results[1]!.success).toBe(true);
      expect(results[2]!.success).toBe(true);
    });

    it('should handle mixed success/failure in parallel execution', async () => {
      mockAgent2.setShouldFail(true);

      const requests = [
        { agentId: 'agent1', context: mockContext },
        { agentId: 'agent2', context: mockContext },
        { agentId: 'agent3', context: mockContext },
      ];

      const results = await orchestrator.executeAgentsParallel(requests);

      expect(results).toHaveLength(3);
      expect(results[0]!.success).toBe(true);
      expect(results[1]!.success).toBe(false);
      expect(results[2]!.success).toBe(true);
    });
  });

  describe('Sequential Execution', () => {
    const mockContext: AgentContext = {
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

    beforeEach(() => {
      orchestrator.registerAgent(mockAgent1);
      orchestrator.registerAgent(mockAgent2);
      orchestrator.registerAgent(mockAgent3);
    });

    it('should execute agents in sequence', async () => {
      const sequence = [
        { agentId: 'agent1', context: mockContext },
        { agentId: 'agent2', context: mockContext, dependsOn: ['agent1'] },
        {
          agentId: 'agent3',
          context: mockContext,
          dependsOn: ['agent1', 'agent2'],
        },
      ];

      const results = await orchestrator.executeAgentSequence(sequence);

      expect(results.size).toBe(3);
      expect(results.get('agent1')?.success).toBe(true);
      expect(results.get('agent2')?.success).toBe(true);
      expect(results.get('agent3')?.success).toBe(true);
    });

    it('should handle dependency failures', async () => {
      const sequence = [
        { agentId: 'agent1', context: mockContext },
        {
          agentId: 'agent2',
          context: mockContext,
          dependsOn: ['non-existent'],
        },
      ];

      const results = await orchestrator.executeAgentSequence(sequence);

      expect(results.size).toBe(2);
      expect(results.get('agent1')?.success).toBe(true);
      expect(results.get('agent2')?.success).toBe(false);
      expect(results.get('agent2')?.error).toContain('Missing dependencies');
    });

    it('should stop sequence on critical failure', async () => {
      mockAgent1.setShouldFail(true);

      const sequence = [
        {
          agentId: 'agent1',
          context: { ...mockContext, urgencyLevel: 'critical' as const },
        },
        { agentId: 'agent2', context: mockContext, dependsOn: ['agent1'] },
      ];

      const results = await orchestrator.executeAgentSequence(sequence);

      expect(results.size).toBe(1);
      expect(results.get('agent1')?.success).toBe(false);
      expect(results.has('agent2')).toBe(false);
    });
  });

  describe('Capability-based Execution', () => {
    const mockContext: AgentContext = {
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

    beforeEach(() => {
      orchestrator.registerAgent(mockAgent1);
      orchestrator.registerAgent(mockAgent2);
      orchestrator.registerAgent(mockAgent3);
    });

    it('should execute agents by capability', async () => {
      const results = await orchestrator.executeByCapability(
        'shared',
        mockContext
      );

      expect(results).toHaveLength(2);
      expect(results[0]!.success).toBe(true);
      expect(results[1]!.success).toBe(true);
    });

    it('should sort agents by priority', async () => {
      const results = await orchestrator.executeByCapability(
        'shared',
        mockContext
      );

      // mockAgent1 has priority 10, mockAgent2 has priority 5
      // Results should be ordered by priority (higher first)
      expect(results[0]!.data.agentId).toBe('agent1');
      expect(results[1]!.data.agentId).toBe('agent2');
    });

    it('should return error for non-existent capability', async () => {
      const results = await orchestrator.executeByCapability(
        'non-existent',
        mockContext
      );

      expect(results).toHaveLength(1);
      expect(results[0]!.success).toBe(false);
      expect(results[0]!.error).toContain('No agents found with capability');
    });
  });

  describe('Statistics and Health Check', () => {
    beforeEach(() => {
      orchestrator.registerAgent(mockAgent1);
      orchestrator.registerAgent(mockAgent2);
      orchestrator.registerAgent(mockAgent3);
    });

    it('should provide accurate statistics', () => {
      const stats = orchestrator.getStats();

      expect(stats.totalAgents).toBe(3);
      expect(stats.queuedExecutions).toBe(0);
      expect(stats.activeExecutions).toBe(0);
      expect(stats.agentsByCapability['shared']).toBe(2);
      expect(stats.agentsByCapability['capability1']).toBe(1);
      expect(stats.agentsByCapability['capability2']).toBe(1);
      expect(stats.agentsByCapability['capability3']).toBe(1);
    });

    it('should perform health check on all agents', async () => {
      const healthCheck = await orchestrator.healthCheck();

      expect(healthCheck.overall).toBe('healthy');
      expect(healthCheck.agents['agent1']).toBe('healthy');
      expect(healthCheck.agents['agent2']).toBe('healthy');
      expect(healthCheck.agents['agent3']).toBe('healthy');
    });

    it('should detect unhealthy agents', async () => {
      mockAgent2.setShouldFail(true);

      const healthCheck = await orchestrator.healthCheck();

      expect(healthCheck.overall).toBe('degraded');
      expect(healthCheck.agents['agent1']).toBe('healthy');
      expect(healthCheck.agents['agent2']).toBe('unhealthy');
      expect(healthCheck.agents['agent3']).toBe('healthy');
    });
  });

  describe('Queue Management', () => {
    beforeEach(() => {
      orchestrator.registerAgent(mockAgent1);
      orchestrator.setMaxConcurrentExecutions(1);
    });

    it('should respect max concurrent executions', async () => {
      const slowAgent = new MockAgent(
        'slow',
        'Slow Agent',
        ['test'],
        1,
        false,
        50
      ); // Reduced delay
      orchestrator.registerAgent(slowAgent);

      const mockContext: AgentContext = {
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

      // Start multiple executions
      const promise1 = orchestrator.executeAgent('slow', mockContext);
      const promise2 = orchestrator.executeAgent('agent1', mockContext);

      // Wait for completion
      const results = await Promise.all([promise1, promise2]);

      // Both should succeed
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    }, 10000); // 10 second timeout

    it('should clear queue', async () => {
      orchestrator.setMaxConcurrentExecutions(1); // Set to 1 to allow controlled testing

      const mockContext: AgentContext = {
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

      // This will be queued
      const promise = orchestrator.executeAgent('agent1', mockContext);

      // Clear the queue
      orchestrator.clearQueue();

      // The promise should reject
      await expect(promise).rejects.toThrow('Queue cleared');
    });
  });
});
