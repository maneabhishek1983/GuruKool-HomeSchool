import { AIAgent, AgentContext, AgentResult } from '@/types';
import { agentRegistry, AgentExecutionPlan } from './registry';
import { BaseAgent } from './base.agent';

export interface ExecutionOptions {
  timeout?: number;
  maxRetries?: number;
  failFast?: boolean;
  parallelExecution?: boolean;
  retryDelay?: number;
}

export interface ExecutionResult {
  success: boolean;
  results: Map<string, AgentResult>;
  executionTime: number;
  errors: string[];
  retries: Map<string, number>;
}

export interface ExecutionMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  agentMetrics: Map<string, {
    executions: number;
    successes: number;
    failures: number;
    averageTime: number;
  }>;
}

/**
 * Agent Execution Engine - Handles the execution of AI agents with advanced features
 */
export class AgentExecutionEngine {
  private static instance: AgentExecutionEngine;
  private metrics: ExecutionMetrics;
  private activeExecutions = new Map<string, Promise<ExecutionResult>>();

  private constructor() {
    this.metrics = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      agentMetrics: new Map(),
    };
  }

  public static getInstance(): AgentExecutionEngine {
    if (!AgentExecutionEngine.instance) {
      AgentExecutionEngine.instance = new AgentExecutionEngine();
    }
    return AgentExecutionEngine.instance;
  }

  /**
   * Execute a single agent
   */
  public async executeAgent(
    agentId: string,
    context: AgentContext,
    options: ExecutionOptions = {}
  ): Promise<AgentResult> {
    const agent = agentRegistry.getAgent(agentId);
    if (!agent) {
      return {
        success: false,
        error: `Agent not found: ${agentId}`,
      };
    }

    const config = agentRegistry.getAgentConfig(agentId);
    const finalOptions = {
      timeout: options.timeout || config?.timeout || 30000,
      maxRetries: options.maxRetries || config?.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      ...options,
    };

    return await this.executeAgentWithRetry(agent, context, finalOptions);
  }

  /**
   * Execute multiple agents based on execution plan
   */
  public async executeAgents(
    context: AgentContext,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create execution plan
    const plan = agentRegistry.createExecutionPlan(context);
    
    // Store active execution
    const executionPromise = this.performExecution(plan, context, options);
    this.activeExecutions.set(executionId, executionPromise);

    try {
      const result = await executionPromise;
      
      // Update metrics
      this.updateMetrics(result, Date.now() - startTime);
      
      return result;
    } finally {
      this.activeExecutions.delete(executionId);
    }
  }

  /**
   * Execute agents by capability
   */
  public async executeByCapability(
    capability: string,
    context: AgentContext,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    const agents = agentRegistry.findAgentsByCapability(capability);
    
    if (agents.length === 0) {
      return {
        success: false,
        results: new Map(),
        executionTime: 0,
        errors: [`No agents found with capability: ${capability}`],
        retries: new Map(),
      };
    }

    const plan: AgentExecutionPlan = {
      agents,
      executionOrder: agents.map(a => a.id),
      parallelGroups: [agents.map(a => a.id)],
      estimatedDuration: 5000,
    };

    return await this.performExecution(plan, context, options);
  }

  /**
   * Execute agents by tag
   */
  public async executeByTag(
    tag: string,
    context: AgentContext,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    const agents = agentRegistry.findAgentsByTag(tag);
    
    if (agents.length === 0) {
      return {
        success: false,
        results: new Map(),
        executionTime: 0,
        errors: [`No agents found with tag: ${tag}`],
        retries: new Map(),
      };
    }

    const plan: AgentExecutionPlan = {
      agents,
      executionOrder: agents.map(a => a.id),
      parallelGroups: [agents.map(a => a.id)],
      estimatedDuration: 5000,
    };

    return await this.performExecution(plan, context, options);
  }

  /**
   * Perform the actual execution based on plan
   */
  private async performExecution(
    plan: AgentExecutionPlan,
    context: AgentContext,
    options: ExecutionOptions
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const results = new Map<string, AgentResult>();
    const errors: string[] = [];
    const retries = new Map<string, number>();

    try {
      if (options.parallelExecution && plan.parallelGroups.length > 0) {
        // Execute in parallel groups
        for (const group of plan.parallelGroups) {
          const groupPromises = group.map(async (agentId) => {
            const agent = plan.agents.find(a => a.id === agentId);
            if (!agent) {
              return;
            }

            try {
              const result = await this.executeAgentWithRetry(agent, context, options);
              results.set(agentId, result);
              
              if (!result.success && options.failFast) {
                throw new Error(`Agent ${agentId} failed: ${result.error}`);
              }
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : 'Unknown error';
              errors.push(`Agent ${agentId}: ${errorMsg}`);
              results.set(agentId, { success: false, error: errorMsg });
            }
          });

          await Promise.all(groupPromises);

          if (options.failFast && errors.length > 0) {
            break;
          }
        }
      } else {
        // Execute sequentially
        for (const agentId of plan.executionOrder) {
          const agent = plan.agents.find(a => a.id === agentId);
          if (!agent) {
            continue;
          }

          try {
            const result = await this.executeAgentWithRetry(agent, context, options);
            results.set(agentId, result);
            
            if (!result.success && options.failFast) {
              errors.push(`Agent ${agentId} failed: ${result.error}`);
              break;
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`Agent ${agentId}: ${errorMsg}`);
            results.set(agentId, { success: false, error: errorMsg });
            
            if (options.failFast) {
              break;
            }
          }
        }
      }
    } catch (error) {
      errors.push(`Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const executionTime = Date.now() - startTime;
    const successfulResults = Array.from(results.values()).filter(r => r.success);

    return {
      success: errors.length === 0 && successfulResults.length > 0,
      results,
      executionTime,
      errors,
      retries,
    };
  }

  /**
   * Execute agent with retry logic
   */
  private async executeAgentWithRetry(
    agent: AIAgent,
    context: AgentContext,
    options: ExecutionOptions
  ): Promise<AgentResult> {
    let lastError: Error | null = null;
    let retryCount = 0;

    while (retryCount <= (options.maxRetries || 3)) {
      try {
        const result = await this.executeAgentWithTimeout(agent, context, options.timeout || 30000);
        
        // Update agent metrics
        this.updateAgentMetrics(agent.id, true, Date.now());
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        retryCount++;
        
        if (retryCount <= (options.maxRetries || 3)) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, options.retryDelay || 1000));
        }
      }
    }

    // Update agent metrics for failure
    this.updateAgentMetrics(agent.id, false, Date.now());

    return {
      success: false,
      error: `Agent ${agent.id} failed after ${retryCount} retries: ${lastError?.message}`,
    };
  }

  /**
   * Execute agent with timeout
   */
  private async executeAgentWithTimeout(
    agent: AIAgent,
    context: AgentContext,
    timeout: number
  ): Promise<AgentResult> {
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Agent ${agent.id} execution timed out after ${timeout}ms`));
      }, timeout);

      try {
        let result: AgentResult;
        
        if (agent instanceof BaseAgent) {
          result = await agent.executeWithTracking(context);
        } else {
          result = await agent.execute(context);
        }
        
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Update execution metrics
   */
  private updateMetrics(result: ExecutionResult, executionTime: number): void {
    this.metrics.totalExecutions++;
    
    if (result.success) {
      this.metrics.successfulExecutions++;
    } else {
      this.metrics.failedExecutions++;
    }

    // Update average execution time
    this.metrics.averageExecutionTime = 
      (this.metrics.averageExecutionTime * (this.metrics.totalExecutions - 1) + executionTime) / 
      this.metrics.totalExecutions;
  }

  /**
   * Update agent-specific metrics
   */
  private updateAgentMetrics(agentId: string, success: boolean, executionTime: number): void {
    if (!this.metrics.agentMetrics.has(agentId)) {
      this.metrics.agentMetrics.set(agentId, {
        executions: 0,
        successes: 0,
        failures: 0,
        averageTime: 0,
      });
    }

    const agentMetrics = this.metrics.agentMetrics.get(agentId);
    if (!agentMetrics) {
      return; // Safety check - should never happen but TypeScript needs it
    }
    
    agentMetrics.executions++;
    
    if (success) {
      agentMetrics.successes++;
    } else {
      agentMetrics.failures++;
    }

    agentMetrics.averageTime = 
      (agentMetrics.averageTime * (agentMetrics.executions - 1) + executionTime) / 
      agentMetrics.executions;
  }

  /**
   * Get execution metrics
   */
  public getMetrics(): ExecutionMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  public resetMetrics(): void {
    this.metrics = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      agentMetrics: new Map(),
    };
  }

  /**
   * Get active executions
   */
  public getActiveExecutions(): string[] {
    return Array.from(this.activeExecutions.keys());
  }

  /**
   * Cancel an active execution
   */
  public async cancelExecution(executionId: string): Promise<boolean> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      return false;
    }

    // Note: This is a simplified cancellation. In a real implementation,
    // you would need more sophisticated cancellation mechanisms
    this.activeExecutions.delete(executionId);
    return true;
  }

  /**
   * Health check for the execution engine
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    activeExecutions: number;
    metrics: ExecutionMetrics;
    registryStats: any;
  }> {
    const registryStats = agentRegistry.getStats();
    const activeExecutions = this.activeExecutions.size;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (activeExecutions > 10) {
      status = 'degraded';
    }
    
    if (activeExecutions > 50 || registryStats.enabledAgents === 0) {
      status = 'unhealthy';
    }

    return {
      status,
      activeExecutions,
      metrics: this.getMetrics(),
      registryStats,
    };
  }
}

// Export singleton instance
export const executionEngine = AgentExecutionEngine.getInstance();