import { AIAgent, AgentContext, AgentResult, AIInsight } from '@/types';
import { logger } from '@/services/logging.service';

/**
 * Base AI Agent class providing common functionality for all agents
 */
export abstract class BaseAgent implements AIAgent {
  public abstract readonly id: string;
  public abstract readonly name: string;
  public abstract readonly capabilities: string[];
  public abstract readonly priority: number;

  protected isHealthy = true;
  protected lastExecution: Date | null = null;
  protected executionCount = 0;
  protected errorCount = 0;
  protected averageExecutionTime = 0;

  /**
   * Main execution method - must be implemented by subclasses
   */
  public abstract execute(context: AgentContext): Promise<AgentResult>;

  /**
   * Health check method
   */
  public async healthCheck(): Promise<AgentResult> {
    try {
      const healthData = {
        status: this.isHealthy ? 'healthy' : 'unhealthy',
        agent: this.name,
        lastExecution: this.lastExecution,
        executionCount: this.executionCount,
        errorCount: this.errorCount,
        errorRate:
          this.executionCount > 0 ? this.errorCount / this.executionCount : 0,
        averageExecutionTime: this.averageExecutionTime,
      };

      return {
        success: true,
        data: healthData,
      };
    } catch (error) {
      return {
        success: false,
        error: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Execute with performance tracking and error handling
   */
  public async executeWithTracking(
    context: AgentContext
  ): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      // Handle health check requests
      if (context.healthCheck) {
        return await this.healthCheck();
      }

      // Validate context
      const validationResult = this.validateContext(context);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: `Context validation failed: ${validationResult.error}`,
        };
      }

      // Execute the agent
      const result = await this.execute(context);

      // Update metrics on success
      this.updateMetrics(startTime, true);
      this.lastExecution = new Date();

      return result;
    } catch (error) {
      // Update metrics on error
      this.updateMetrics(startTime, false);
      this.isHealthy = false;

      return {
        success: false,
        error: `Agent execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Validate agent context
   */
  protected validateContext(context: AgentContext): {
    isValid: boolean;
    error?: string;
  } {
    // Basic validation - can be overridden by subclasses
    if (!context) {
      return { isValid: false, error: 'Context is required' };
    }

    return { isValid: true };
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(startTime: number, success: boolean): void {
    const executionTime = Date.now() - startTime;

    this.executionCount++;
    if (!success) {
      this.errorCount++;
    }

    // Update average execution time
    this.averageExecutionTime =
      (this.averageExecutionTime * (this.executionCount - 1) + executionTime) /
      this.executionCount;
  }

  /**
   * Create a standardized AI insight
   */
  protected createInsight(
    sessionId: string,
    type: AIInsight['type'],
    content: string,
    confidence: number,
    metadata?: Record<string, any>
  ): AIInsight {
    return {
      id: `${this.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      type,
      content,
      confidence: Math.max(0, Math.min(1, confidence)), // Ensure confidence is between 0 and 1
      metadata: metadata || {},
      createdAt: new Date(),
    };
  }

  /**
   * Log agent activity
   */
  protected log(
    level: 'info' | 'warn' | 'error',
    message: string,
    data?: any
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      agent: this.name,
      level,
      message,
      data,
    };

    switch (level) {
      case 'error':
        logger.error('agent', `[${this.name}] ${message}`, data);
        break;
      case 'warn':
        logger.warn('agent', `[${this.name}] ${message}`, data);
        break;
      default:
        logger.info('agent', `[${this.name}] ${message}`, data);
    }
  }

  /**
   * Get agent statistics
   */
  public getStats(): {
    id: string;
    name: string;
    isHealthy: boolean;
    executionCount: number;
    errorCount: number;
    errorRate: number;
    averageExecutionTime: number;
    lastExecution: Date | null;
  } {
    return {
      id: this.id,
      name: this.name,
      isHealthy: this.isHealthy,
      executionCount: this.executionCount,
      errorCount: this.errorCount,
      errorRate:
        this.executionCount > 0 ? this.errorCount / this.executionCount : 0,
      averageExecutionTime: this.averageExecutionTime,
      lastExecution: this.lastExecution,
    };
  }

  /**
   * Reset agent statistics
   */
  public resetStats(): void {
    this.executionCount = 0;
    this.errorCount = 0;
    this.averageExecutionTime = 0;
    this.lastExecution = null;
    this.isHealthy = true;
  }

  /**
   * Check if agent can handle a specific capability
   */
  public hasCapability(capability: string): boolean {
    return this.capabilities.includes(capability);
  }

  /**
   * Get agent priority for execution ordering
   */
  public getPriority(): number {
    return this.priority;
  }

  /**
   * Determine if agent should execute based on context
   */
  public shouldExecute(context: AgentContext): boolean {
    // Default implementation - can be overridden by subclasses
    return true;
  }

  /**
   * Pre-execution hook - called before execute()
   */
  protected async beforeExecute(context: AgentContext): Promise<void> {
    // Override in subclasses if needed
  }

  /**
   * Post-execution hook - called after execute()
   */
  protected async afterExecute(
    context: AgentContext,
    result: AgentResult
  ): Promise<void> {
    // Override in subclasses if needed
  }

  /**
   * Handle agent errors gracefully
   */
  protected handleError(error: unknown, context: AgentContext): AgentResult {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    this.log('error', 'Agent execution failed', {
      error: errorMessage,
      context,
    });

    return {
      success: false,
      error: `${this.name} execution failed: ${errorMessage}`,
    };
  }

  /**
   * Create a successful result with optional insights and actions
   */
  protected createSuccessResult(
    data: any,
    insights?: AIInsight[],
    actions?: any[]
  ): AgentResult {
    const result: AgentResult = {
      success: true,
      data,
    };

    if (insights) {
      result.insights = insights;
    }

    if (actions) {
      result.actions = actions;
    }

    return result;
  }

  /**
   * Create a failed result with error message
   */
  protected createErrorResult(error: string): AgentResult {
    return {
      success: false,
      error,
    };
  }
}
