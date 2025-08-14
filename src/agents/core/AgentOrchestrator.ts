import { AIAgent, AgentContext, AgentResult } from '@/types';
import { logger } from '@/services/logging.service';

/**
 * Core AI Agent Orchestrator
 * Central hub for managing multiple AI agents and coordinating their execution
 */
export class AgentOrchestrator {
  private static instance: AgentOrchestrator;
  private agents = new Map<string, AIAgent>();
  private executionQueue: Array<{
    agentId: string;
    context: AgentContext;
    resolve: (result: AgentResult) => void;
    reject: (error: Error) => void;
  }> = [];
  private isProcessing = false;
  private maxConcurrentExecutions = 5;
  private activeExecutions = 0;

  private constructor() {
    this.startQueueProcessor();
  }

  /**
   * Get singleton instance of AgentOrchestrator
   */
  public static getInstance(): AgentOrchestrator {
    if (!AgentOrchestrator.instance) {
      AgentOrchestrator.instance = new AgentOrchestrator();
    }
    return AgentOrchestrator.instance;
  }

  /**
   * Register an AI agent with the orchestrator
   */
  public registerAgent(agent: AIAgent): void {
    if (this.agents.has(agent.id)) {
      throw new Error(`Agent with id '${agent.id}' is already registered`);
    }

    this.agents.set(agent.id, agent);
    logger.info('agent', `Registered AI agent: ${agent.name} (${agent.id})`);
  }

  /**
   * Unregister an AI agent from the orchestrator
   */
  public unregisterAgent(agentId: string): boolean {
    const removed = this.agents.delete(agentId);
    if (removed) {
      logger.info('agent', `Unregistered AI agent: ${agentId}`);
    }
    return removed;
  }

  /**
   * Get a registered agent by ID
   */
  public getAgent(agentId: string): AIAgent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all registered agents
   */
  public getAllAgents(): AIAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents by capability
   */
  public getAgentsByCapability(capability: string): AIAgent[] {
    return Array.from(this.agents.values()).filter(agent =>
      agent.capabilities.includes(capability)
    );
  }

  /**
   * Execute a specific agent with context
   */
  public async executeAgent(agentId: string, context: AgentContext): Promise<AgentResult> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return {
        success: false,
        error: `Agent '${agentId}' not found`,
      };
    }

    return new Promise((resolve, reject) => {
      this.executionQueue.push({
        agentId,
        context: this.enrichContext(context),
        resolve,
        reject,
      });

      this.processQueue();
    });
  }

  /**
   * Execute multiple agents in parallel
   */
  public async executeAgentsParallel(
    requests: Array<{ agentId: string; context: AgentContext }>
  ): Promise<AgentResult[]> {
    const promises = requests.map(req =>
      this.executeAgent(req.agentId, req.context)
    );

    return Promise.all(promises);
  }

  /**
   * Execute agents in sequence with dependency management
   */
  public async executeAgentSequence(
    sequence: Array<{
      agentId: string;
      context: AgentContext;
      dependsOn?: string[];
    }>
  ): Promise<Map<string, AgentResult>> {
    const results = new Map<string, AgentResult>();
    const executed = new Set<string>();

    for (const step of sequence) {
      // Check dependencies
      if (step.dependsOn) {
        const missingDeps = step.dependsOn.filter(dep => !executed.has(dep));
        if (missingDeps.length > 0) {
          const errorResult: AgentResult = {
            success: false,
            error: `Missing dependencies for ${step.agentId}: ${missingDeps.join(', ')}`,
          };
          results.set(step.agentId, errorResult);
          continue;
        }
      }

      // Enhance context with previous results
      const enhancedContext: AgentContext = {
        ...step.context,
        metadata: {
          ...step.context.metadata,
          previousResults: Object.fromEntries(results),
          sequencePosition: executed.size,
        },
      };

      const result = await this.executeAgent(step.agentId, enhancedContext);
      results.set(step.agentId, result);
      executed.add(step.agentId);

      // Stop sequence if agent failed and it's critical
      if (!result.success && step.context.urgencyLevel === 'critical') {
        break;
      }
    }

    return results;
  }

  /**
   * Execute agents by capability
   */
  public async executeByCapability(
    capability: string,
    context: AgentContext
  ): Promise<AgentResult[]> {
    const capableAgents = this.getAgentsByCapability(capability);
    
    if (capableAgents.length === 0) {
      return [{
        success: false,
        error: `No agents found with capability '${capability}'`,
      }];
    }

    // Sort by priority (higher priority first)
    capableAgents.sort((a, b) => b.priority - a.priority);

    const requests = capableAgents.map(agent => ({
      agentId: agent.id,
      context,
    }));

    return this.executeAgentsParallel(requests);
  }

  /**
   * Get orchestrator statistics
   */
  public getStats(): {
    totalAgents: number;
    queuedExecutions: number;
    activeExecutions: number;
    maxConcurrentExecutions: number;
    agentsByCapability: Record<string, number>;
  } {
    const agentsByCapability: Record<string, number> = {};
    
    for (const agent of this.agents.values()) {
      for (const capability of agent.capabilities) {
        agentsByCapability[capability] = (agentsByCapability[capability] || 0) + 1;
      }
    }

    return {
      totalAgents: this.agents.size,
      queuedExecutions: this.executionQueue.length,
      activeExecutions: this.activeExecutions,
      maxConcurrentExecutions: this.maxConcurrentExecutions,
      agentsByCapability,
    };
  }

  /**
   * Health check for all registered agents
   */
  public async healthCheck(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    agents: Record<string, 'healthy' | 'unhealthy'>;
    details: Record<string, any>;
  }> {
    const agentHealth: Record<string, 'healthy' | 'unhealthy'> = {};
    const details: Record<string, any> = {};

    const healthCheckPromises = Array.from(this.agents.entries()).map(
      async ([agentId, agent]) => {
        try {
          const healthContext: AgentContext = {
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
            timestamp: Date.now(),
          };

          const result = await agent.execute(healthContext);
          agentHealth[agentId] = result.success ? 'healthy' : 'unhealthy';
          details[agentId] = result.data || result.error;
        } catch (error) {
          agentHealth[agentId] = 'unhealthy';
          details[agentId] = error instanceof Error ? error.message : 'Unknown error';
        }
      }
    );

    await Promise.all(healthCheckPromises);

    // Determine overall health
    const unhealthyCount = Object.values(agentHealth).filter(h => h === 'unhealthy').length;
    const totalCount = Object.keys(agentHealth).length;
    
    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyCount === 0) {
      overall = 'healthy';
    } else if (unhealthyCount < totalCount / 2) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }

    return {
      overall,
      agents: agentHealth,
      details,
    };
  }

  /**
   * Set maximum concurrent executions
   */
  public setMaxConcurrentExecutions(max: number): void {
    if (max < 1) {
      throw new Error('Maximum concurrent executions must be at least 1');
    }
    this.maxConcurrentExecutions = max;
  }

  /**
   * Clear the execution queue
   */
  public clearQueue(): void {
    // Reject all pending executions
    for (const item of this.executionQueue) {
      item.reject(new Error('Queue cleared'));
    }
    this.executionQueue = [];
  }

  /**
   * Enrich context with additional metadata
   */
  private enrichContext(context: AgentContext): AgentContext {
    return {
      ...context,
      timestamp: context.timestamp || Date.now(),
      metadata: {
        ...context.metadata,
        orchestratorVersion: '1.0.0',
        executionId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      },
    };
  }

  /**
   * Process the execution queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.executionQueue.length === 0) {
      return;
    }

    if (this.activeExecutions >= this.maxConcurrentExecutions) {
      return;
    }

    this.isProcessing = true;

    try {
      while (
        this.executionQueue.length > 0 &&
        this.activeExecutions < this.maxConcurrentExecutions
      ) {
        const item = this.executionQueue.shift()!;
        this.executeQueueItem(item);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute a single queue item
   */
  private async executeQueueItem(item: {
    agentId: string;
    context: AgentContext;
    resolve: (result: AgentResult) => void;
    reject: (error: Error) => void;
  }): Promise<void> {
    this.activeExecutions++;

    try {
      const agent = this.agents.get(item.agentId);
      if (!agent) {
        item.resolve({
          success: false,
          error: `Agent '${item.agentId}' not found`,
        });
        return;
      }

      const startTime = Date.now();
      const result = await agent.execute(item.context);
      const executionTime = Date.now() - startTime;

      // Add execution time to result
      const enrichedResult: AgentResult = {
        ...result,
        executionTime,
        metadata: {
          ...item.context.metadata,
          ...result.metadata,
          agentId: item.agentId,
          agentName: agent.name,
        },
      };

      item.resolve(enrichedResult);
    } catch (error) {
      item.reject(error instanceof Error ? error : new Error('Unknown execution error'));
    } finally {
      this.activeExecutions--;
      // Continue processing queue
      this.processQueue();
    }
  }

  /**
   * Start the queue processor
   */
  private startQueueProcessor(): void {
    // Process queue every 100ms
    setInterval(() => {
      this.processQueue();
    }, 100);
  }
}

// Export singleton instance
export const agentOrchestrator = AgentOrchestrator.getInstance();