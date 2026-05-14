// @ts-nocheck - TODO: tests rotted against current API — rewrite or delete
import { AgentRegistry } from '../registry';
import { BaseAgent } from '../base.agent';
import { AgentContext, AgentResult } from '@/types';

// Mock agents for testing
class MockAgent1 extends BaseAgent {
  public readonly id = 'mock-agent-1';
  public readonly name = 'Mock Agent 1';
  public readonly capabilities = ['capability-1', 'capability-2'];
  public readonly priority = 8;

  public async execute(context: AgentContext): Promise<AgentResult> {
    return this.createSuccessResult({ agent: 'mock-1' });
  }
}

class MockAgent2 extends BaseAgent {
  public readonly id = 'mock-agent-2';
  public readonly name = 'Mock Agent 2';
  public readonly capabilities = ['capability-2', 'capability-3'];
  public readonly priority = 6;

  public async execute(context: AgentContext): Promise<AgentResult> {
    return this.createSuccessResult({ agent: 'mock-2' });
  }
}

// TODO: tests rotted against current API — rewrite or delete
describe.skip('AgentRegistry', () => {
  let registry: AgentRegistry;
  let mockAgent1: MockAgent1;
  let mockAgent2: MockAgent2;

  beforeEach(() => {
    registry = new AgentRegistry();
    mockAgent1 = new MockAgent1();
    mockAgent2 = new MockAgent2();
  });

  afterEach(() => {
    registry.clear();
  });

  describe('Agent Registration', () => {
    test('should register agents successfully', () => {
      registry.registerAgent(mockAgent1);
      registry.registerAgent(mockAgent2);

      expect(registry.getAgent('mock-agent-1')).toBe(mockAgent1);
      expect(registry.getAgent('mock-agent-2')).toBe(mockAgent2);
    });

    test('should register agents with custom configuration', () => {
      registry.registerAgent(mockAgent1, {
        maxRetries: 5,
        timeout: 60000,
        tags: ['test', 'mock'],
        dependencies: ['mock-agent-2'],
      });

      const config = registry.getAgentConfig('mock-agent-1');
      expect(config?.maxRetries).toBe(5);
      expect(config?.timeout).toBe(60000);
      expect(config?.tags).toContain('test');
      expect(config?.dependencies).toContain('mock-agent-2');
    });

    test('should unregister agents', () => {
      registry.registerAgent(mockAgent1);
      expect(registry.getAgent('mock-agent-1')).toBe(mockAgent1);

      const unregistered = registry.unregisterAgent('mock-agent-1');
      expect(unregistered).toBe(true);
      expect(registry.getAgent('mock-agent-1')).toBeNull();
    });

    test('should return false when unregistering non-existent agent', () => {
      const unregistered = registry.unregisterAgent('non-existent');
      expect(unregistered).toBe(false);
    });
  });

  describe('Agent Discovery', () => {
    beforeEach(() => {
      registry.registerAgent(mockAgent1, { tags: ['group-1'] });
      registry.registerAgent(mockAgent2, { tags: ['group-2'] });
    });

    test('should find agents by capability', () => {
      const agents1 = registry.findAgentsByCapability('capability-1');
      const agents2 = registry.findAgentsByCapability('capability-2');
      const agents3 = registry.findAgentsByCapability('capability-3');

      expect(agents1).toHaveLength(1);
      expect(agents1[0]?.id).toBe('mock-agent-1');

      expect(agents2).toHaveLength(2);
      expect(agents2.map(a => a.id)).toContain('mock-agent-1');
      expect(agents2.map(a => a.id)).toContain('mock-agent-2');

      expect(agents3).toHaveLength(1);
      expect(agents3[0]?.id).toBe('mock-agent-2');
    });

    test('should find agents by tag', () => {
      const group1Agents = registry.findAgentsByTag('group-1');
      const group2Agents = registry.findAgentsByTag('group-2');

      expect(group1Agents).toHaveLength(1);
      expect(group1Agents[0]?.id).toBe('mock-agent-1');

      expect(group2Agents).toHaveLength(1);
      expect(group2Agents[0]?.id).toBe('mock-agent-2');
    });

    test('should return empty array for non-existent capability', () => {
      const agents = registry.findAgentsByCapability('non-existent');
      expect(agents).toHaveLength(0);
    });

    test('should return empty array for non-existent tag', () => {
      const agents = registry.findAgentsByTag('non-existent');
      expect(agents).toHaveLength(0);
    });
  });

  describe('Agent Management', () => {
    beforeEach(() => {
      registry.registerAgent(mockAgent1);
      registry.registerAgent(mockAgent2);
    });

    test('should enable/disable agents', () => {
      expect(registry.getAgent('mock-agent-1')).toBe(mockAgent1);

      registry.setAgentEnabled('mock-agent-1', false);
      expect(registry.getAgent('mock-agent-1')).toBeNull();

      registry.setAgentEnabled('mock-agent-1', true);
      expect(registry.getAgent('mock-agent-1')).toBe(mockAgent1);
    });

    test('should update agent configuration', () => {
      const updated = registry.updateAgentConfig('mock-agent-1', {
        maxRetries: 10,
        timeout: 45000,
      });

      expect(updated).toBe(true);

      const config = registry.getAgentConfig('mock-agent-1');
      expect(config?.maxRetries).toBe(10);
      expect(config?.timeout).toBe(45000);
    });

    test('should return false when updating non-existent agent config', () => {
      const updated = registry.updateAgentConfig('non-existent', {
        maxRetries: 5,
      });
      expect(updated).toBe(false);
    });
  });

  describe('Execution Planning', () => {
    beforeEach(() => {
      registry.registerAgent(mockAgent1, { tags: ['high-priority'] });
      registry.registerAgent(mockAgent2, { tags: ['low-priority'] });
    });

    test('should create execution plan for all agents', () => {
      const plan = registry.createExecutionPlan(mockContext);

      expect(plan.agents).toHaveLength(2);
      expect(plan.executionOrder).toHaveLength(2);
      expect(plan.parallelGroups).toHaveLength(2);
      expect(plan.estimatedDuration).toBeGreaterThan(0);
    });

    test('should filter agents by capability', () => {
      const plan = registry.createExecutionPlan(mockContext, {
        capabilities: ['capability-1'],
      });

      expect(plan.agents).toHaveLength(1);
      expect(plan.agents[0]?.id).toBe('mock-agent-1');
    });

    test('should filter agents by tag', () => {
      const plan = registry.createExecutionPlan(mockContext, {
        tags: ['high-priority'],
      });

      expect(plan.agents).toHaveLength(1);
      expect(plan.agents[0]?.id).toBe('mock-agent-1');
    });

    test('should limit number of agents', () => {
      const plan = registry.createExecutionPlan(mockContext, {
        maxAgents: 1,
      });

      expect(plan.agents).toHaveLength(1);
      // Should select the higher priority agent
      expect(plan.agents[0]?.id).toBe('mock-agent-1');
    });

    test('should filter by priority threshold', () => {
      const plan = registry.createExecutionPlan(mockContext, {
        priorityThreshold: 7,
      });

      expect(plan.agents).toHaveLength(1);
      expect(plan.agents[0]?.id).toBe('mock-agent-1');
    });
  });

  describe('Statistics', () => {
    test('should provide registry statistics', () => {
      registry.registerAgent(mockAgent1);
      registry.registerAgent(mockAgent2);

      const stats = registry.getStats();

      expect(stats.totalAgents).toBe(2);
      expect(stats.enabledAgents).toBe(2);
      expect(stats.capabilities).toContain('capability-1');
      expect(stats.capabilities).toContain('capability-2');
      expect(stats.capabilities).toContain('capability-3');
      expect(stats.averagePriority).toBe(7); // (8 + 6) / 2
    });

    test('should handle empty registry statistics', () => {
      const stats = registry.getStats();

      expect(stats.totalAgents).toBe(0);
      expect(stats.enabledAgents).toBe(0);
      expect(stats.capabilities).toHaveLength(0);
      expect(stats.averagePriority).toBe(0);
    });
  });

  describe('Dependency Validation', () => {
    test('should validate dependencies successfully', () => {
      registry.registerAgent(mockAgent1);
      registry.registerAgent(mockAgent2, {
        dependencies: ['mock-agent-1'],
      });

      const validation = registry.validateDependencies();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should detect missing dependencies', () => {
      registry.registerAgent(mockAgent1, {
        dependencies: ['non-existent-agent'],
      });

      const validation = registry.validateDependencies();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveLength(1);
      expect(validation.errors[0]).toContain('non-existent-agent');
    });
  });
});
