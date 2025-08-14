import { AIAgent, AgentContext, AgentResult } from '@/types';
import { BaseAgent } from './base.agent';

export interface AgentRegistration {
  agent: AIAgent;
  enabled: boolean;
  config: AgentConfig;
  registeredAt: Date;
}

export interface AgentConfig {
  maxRetries: number;
  timeout: number;
  priority: number;
  dependencies: string[];
  tags: string[];
  environment: 'development' | 'staging' | 'production' | 'all';
}

export interface AgentExecutionPlan {
  agents: AIAgent[];
  executionOrder: string[];
  parallelGroups: string[][];
  estimatedDuration: number;
}

/**
 * Agent Registry - Manages registration, discovery, and execution planning of AI agents
 */
export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents = new Map<string, AgentRegistration>();
  private capabilities = new Map<string, Set<string>>(); // capability -> agent IDs
  private dependencies = new Map<string, Set<string>>(); // agent ID -> dependencies
  private tags = new Map<string, Set<string>>(); // tag -> agent IDs

  private constructor() {}

  public static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  /**
   * Register an AI agent with configuration
   */
  public registerAgent(
    agent: AIAgent,
    config: Partial<AgentConfig> = {}
  ): void {
    const defaultConfig: AgentConfig = {
      maxRetries: 3,
      timeout: 30000, // 30 seconds
      priority: agent.priority || 5,
      dependencies: [],
      tags: [],
      environment: 'all',
    };

    const finalConfig = { ...defaultConfig, ...config };

    const registration: AgentRegistration = {
      agent,
      enabled: true,
      config: finalConfig,
      registeredAt: new Date(),
    };

    // Register agent
    this.agents.set(agent.id, registration);

    // Index capabilities
    agent.capabilities.forEach(capability => {
      if (!this.capabilities.has(capability)) {
        this.capabilities.set(capability, new Set());
      }
      this.capabilities.get(capability)!.add(agent.id);
    });

    // Index dependencies
    if (finalConfig.dependencies.length > 0) {
      this.dependencies.set(agent.id, new Set(finalConfig.dependencies));
    }

    // Index tags
    finalConfig.tags.forEach(tag => {
      if (!this.tags.has(tag)) {
        this.tags.set(tag, new Set());
      }
      this.tags.get(tag)!.add(agent.id);
    });

    console.log(`Registered agent: ${agent.name} (${agent.id})`);
  }

  /**
   * Unregister an AI agent
   */
  public unregisterAgent(agentId: string): boolean {
    const registration = this.agents.get(agentId);
    if (!registration) {
      return false;
    }

    // Remove from capabilities index
    registration.agent.capabilities.forEach(capability => {
      const agentSet = this.capabilities.get(capability);
      if (agentSet) {
        agentSet.delete(agentId);
        if (agentSet.size === 0) {
          this.capabilities.delete(capability);
        }
      }
    });

    // Remove from dependencies index
    this.dependencies.delete(agentId);

    // Remove from tags index
    registration.config.tags.forEach(tag => {
      const agentSet = this.tags.get(tag);
      if (agentSet) {
        agentSet.delete(agentId);
        if (agentSet.size === 0) {
          this.tags.delete(tag);
        }
      }
    });

    // Remove agent
    this.agents.delete(agentId);

    console.log(`Unregistered agent: ${agentId}`);
    return true;
  }

  /**
   * Get agent by ID
   */
  public getAgent(agentId: string): AIAgent | null {
    const registration = this.agents.get(agentId);
    return registration?.enabled ? registration.agent : null;
  }

  /**
   * Get all registered agents
   */
  public getAllAgents(): AIAgent[] {
    return Array.from(this.agents.values())
      .filter(reg => reg.enabled)
      .map(reg => reg.agent);
  }

  /**
   * Find agents by capability
   */
  public findAgentsByCapability(capability: string): AIAgent[] {
    const agentIds = this.capabilities.get(capability);
    if (!agentIds) {
      return [];
    }

    return Array.from(agentIds)
      .map(id => this.getAgent(id))
      .filter((agent): agent is AIAgent => agent !== null);
  }

  /**
   * Find agents by tag
   */
  public findAgentsByTag(tag: string): AIAgent[] {
    const agentIds = this.tags.get(tag);
    if (!agentIds) {
      return [];
    }

    return Array.from(agentIds)
      .map(id => this.getAgent(id))
      .filter((agent): agent is AIAgent => agent !== null);
  }

  /**
   * Enable/disable an agent
   */
  public setAgentEnabled(agentId: string, enabled: boolean): boolean {
    const registration = this.agents.get(agentId);
    if (!registration) {
      return false;
    }

    registration.enabled = enabled;
    return true;
  }

  /**
   * Get agent configuration
   */
  public getAgentConfig(agentId: string): AgentConfig | null {
    const registration = this.agents.get(agentId);
    return registration?.config || null;
  }

  /**
   * Update agent configuration
   */
  public updateAgentConfig(agentId: string, config: Partial<AgentConfig>): boolean {
    const registration = this.agents.get(agentId);
    if (!registration) {
      return false;
    }

    registration.config = { ...registration.config, ...config };
    return true;
  }

  /**
   * Create execution plan for agents based on context and requirements
   */
  public createExecutionPlan(
    context: AgentContext,
    requirements?: {
      capabilities?: string[];
      tags?: string[];
      maxAgents?: number;
      priorityThreshold?: number;
    }
  ): AgentExecutionPlan {
    let candidateAgents = this.getAllAgents();

    // Filter by capabilities
    if (requirements?.capabilities) {
      const capabilityAgents = new Set<string>();
      requirements.capabilities.forEach(capability => {
        const agents = this.findAgentsByCapability(capability);
        agents.forEach(agent => capabilityAgents.add(agent.id));
      });
      candidateAgents = candidateAgents.filter(agent => capabilityAgents.has(agent.id));
    }

    // Filter by tags
    if (requirements?.tags) {
      const tagAgents = new Set<string>();
      requirements.tags.forEach(tag => {
        const agents = this.findAgentsByTag(tag);
        agents.forEach(agent => tagAgents.add(agent.id));
      });
      candidateAgents = candidateAgents.filter(agent => tagAgents.has(agent.id));
    }

    // Filter by priority threshold
    if (requirements?.priorityThreshold) {
      candidateAgents = candidateAgents.filter(
        agent => agent.priority >= requirements.priorityThreshold!
      );
    }

    // Filter by context relevance
    candidateAgents = candidateAgents.filter(agent => {
      if (agent instanceof BaseAgent) {
        return agent.shouldExecute(context);
      }
      return true; // Default to true for non-BaseAgent implementations
    });

    // Limit number of agents
    if (requirements?.maxAgents) {
      candidateAgents = candidateAgents
        .sort((a, b) => b.priority - a.priority)
        .slice(0, requirements.maxAgents);
    }

    // Create execution order based on dependencies and priorities
    const executionOrder = this.calculateExecutionOrder(candidateAgents);
    const parallelGroups = this.identifyParallelGroups(candidateAgents);
    const estimatedDuration = this.estimateExecutionDuration(candidateAgents);

    return {
      agents: candidateAgents,
      executionOrder,
      parallelGroups,
      estimatedDuration,
    };
  }

  /**
   * Calculate optimal execution order based on dependencies and priorities
   */
  private calculateExecutionOrder(agents: AIAgent[]): string[] {
    const order: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (agentId: string) => {
      if (visited.has(agentId)) {
        return;
      }
      if (visiting.has(agentId)) {
        throw new Error(`Circular dependency detected involving agent: ${agentId}`);
      }

      visiting.add(agentId);

      // Visit dependencies first
      const dependencies = this.dependencies.get(agentId);
      if (dependencies) {
        dependencies.forEach(depId => {
          if (agents.some(a => a.id === depId)) {
            visit(depId);
          }
        });
      }

      visiting.delete(agentId);
      visited.add(agentId);
      order.push(agentId);
    };

    // Sort agents by priority (higher priority first)
    const sortedAgents = [...agents].sort((a, b) => b.priority - a.priority);

    // Visit each agent
    sortedAgents.forEach(agent => {
      if (!visited.has(agent.id)) {
        visit(agent.id);
      }
    });

    return order;
  }

  /**
   * Identify groups of agents that can run in parallel
   */
  private identifyParallelGroups(agents: AIAgent[]): string[][] {
    const groups: string[][] = [];
    const processed = new Set<string>();

    agents.forEach(agent => {
      if (processed.has(agent.id)) {
        return;
      }

      const group = [agent.id];
      processed.add(agent.id);

      // Find other agents that can run in parallel
      agents.forEach(otherAgent => {
        if (processed.has(otherAgent.id)) {
          return;
        }
        if (this.canRunInParallel(agent.id, otherAgent.id)) {
          group.push(otherAgent.id);
          processed.add(otherAgent.id);
        }
      });

      groups.push(group);
    });

    return groups;
  }

  /**
   * Check if two agents can run in parallel
   */
  private canRunInParallel(agentId1: string, agentId2: string): boolean {
    const deps1 = this.dependencies.get(agentId1) || new Set();
    const deps2 = this.dependencies.get(agentId2) || new Set();

    // Agents can run in parallel if neither depends on the other
    return !deps1.has(agentId2) && !deps2.has(agentId1);
  }

  /**
   * Estimate total execution duration
   */
  private estimateExecutionDuration(agents: AIAgent[]): number {
    // Simple estimation based on agent count and average execution time
    // In a real implementation, this would use historical performance data
    const baseTime = 1000; // 1 second base time
    const agentTime = 500; // 500ms per agent
    return baseTime + (agents.length * agentTime);
  }

  /**
   * Get registry statistics
   */
  public getStats(): {
    totalAgents: number;
    enabledAgents: number;
    capabilities: string[];
    tags: string[];
    averagePriority: number;
  } {
    const allAgents = Array.from(this.agents.values());
    const enabledAgents = allAgents.filter(reg => reg.enabled);

    return {
      totalAgents: allAgents.length,
      enabledAgents: enabledAgents.length,
      capabilities: Array.from(this.capabilities.keys()),
      tags: Array.from(this.tags.keys()),
      averagePriority: enabledAgents.length > 0 
        ? enabledAgents.reduce((sum, reg) => sum + reg.agent.priority, 0) / enabledAgents.length 
        : 0,
    };
  }

  /**
   * Validate agent dependencies
   */
  public validateDependencies(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    this.dependencies.forEach((deps, agentId) => {
      deps.forEach(depId => {
        if (!this.agents.has(depId)) {
          errors.push(`Agent ${agentId} depends on non-existent agent ${depId}`);
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Clear all registered agents
   */
  public clear(): void {
    this.agents.clear();
    this.capabilities.clear();
    this.dependencies.clear();
    this.tags.clear();
  }
}

// Export singleton instance
export const agentRegistry = AgentRegistry.getInstance();