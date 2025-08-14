import { AIAgent, AgentContext, AgentResult, AIInsight } from '@/types';
import { logger } from '@/services/logging.service';

/**
 * Abstract base class for all AI agents
 * Provides common functionality and enforces the AIAgent interface
 */
export abstract class BaseAIAgent implements AIAgent {
  public abstract readonly id: string;
  public abstract readonly name: string;
  public abstract readonly capabilities: string[];
  public abstract readonly priority: number;

  // Performance tracking
  protected executionCount = 0;
  protected errorCount = 0;
  protected totalExecutionTime = 0;
  protected lastExecution: Date | null = null;
  protected isHealthy = true;

  /**
   * Main execution method - must be implemented by subclasses
   */
  public abstract execute(context: AgentContext): Promise<AgentResult>;

  /**
   * Execute with built-in error handling and performance tracking
   */
  public async executeWithTracking(context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    this.executionCount++;

    try {
      // Pre-execution validation
      const validationResult = this.validateContext(context);
      if (!validationResult.isValid) {
        return this.createErrorResult(`Context validation failed: ${validationResult.error}`);
      }

      // Handle health check requests
      if (context.healthCheck) {
        return this.performHealthCheck();
      }

      // Execute the agent logic
      const result = await this.execute(context);
      
      // Post-execution tracking
      const executionTime = Date.now() - startTime;
      this.totalExecutionTime += executionTime;
      this.lastExecution = new Date();
      this.isHealthy = result.success;

      return {
        ...result,
        executionTime,
        metadata: {
          ...result.metadata,
          agentId: this.id,
          agentName: this.name,
          executionTime,
        },
      };
    } catch (error) {
      this.errorCount++;
      this.isHealthy = false;
      
      const executionTime = Date.now() - startTime;
      this.totalExecutionTime += executionTime;
      
      return this.createErrorResult(
        `Agent execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { executionTime }
      );
    }
  }

  /**
   * Validate the agent context
   */
  protected validateContext(context: AgentContext): { isValid: boolean; error?: string } {
    if (!context) {
      return { isValid: false, error: 'Context is required' };
    }

    // Validate required context properties based on agent capabilities
    if (this.capabilities.includes('user-dependent') && !context.user) {
      return { isValid: false, error: 'User context is required for this agent' };
    }

    if (this.capabilities.includes('session-dependent') && (!context.sessionData || context.sessionData.length === 0)) {
      return { isValid: false, error: 'Session data is required for this agent' };
    }

    return { isValid: true };
  }

  /**
   * Perform health check
   */
  protected performHealthCheck(): AgentResult {
    const stats = this.getPerformanceStats();
    
    return {
      success: this.isHealthy,
      data: {
        agentId: this.id,
        agentName: this.name,
        status: this.isHealthy ? 'healthy' : 'unhealthy',
        capabilities: this.capabilities,
        priority: this.priority,
        ...stats,
      },
    };
  }

  /**
   * Get performance statistics
   */
  public getPerformanceStats(): {
    executionCount: number;
    errorCount: number;
    errorRate: number;
    averageExecutionTime: number;
    lastExecution: Date | null;
    isHealthy: boolean;
  } {
    return {
      executionCount: this.executionCount,
      errorCount: this.errorCount,
      errorRate: this.executionCount > 0 ? this.errorCount / this.executionCount : 0,
      averageExecutionTime: this.executionCount > 0 ? this.totalExecutionTime / this.executionCount : 0,
      lastExecution: this.lastExecution,
      isHealthy: this.isHealthy,
    };
  }

  /**
   * Reset performance statistics
   */
  public resetStats(): void {
    this.executionCount = 0;
    this.errorCount = 0;
    this.totalExecutionTime = 0;
    this.lastExecution = null;
    this.isHealthy = true;
  }

  /**
   * Check if agent has a specific capability
   */
  public hasCapability(capability: string): boolean {
    return this.capabilities.includes(capability);
  }

  /**
   * Determine if agent should execute based on context
   */
  public shouldExecute(context: AgentContext): boolean {
    // Default implementation - can be overridden by subclasses
    return true;
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
      id: `${this.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      type,
      content,
      confidence: Math.max(0, Math.min(1, confidence)), // Clamp between 0 and 1
      metadata: {
        ...metadata,
        agentId: this.id,
        agentName: this.name,
        createdBy: 'ai-agent',
      },
      createdAt: new Date(),
    };
  }

  /**
   * Create a successful result
   */
  protected createSuccessResult(
    data: any,
    insights?: AIInsight[],
    actions?: any[],
    metadata?: Record<string, any>
  ): AgentResult {
    return {
      success: true,
      data,
      insights,
      actions,
      metadata: {
        ...metadata,
        agentId: this.id,
        agentName: this.name,
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Create an error result
   */
  protected createErrorResult(error: string, metadata?: Record<string, any>): AgentResult {
    return {
      success: false,
      error,
      metadata: {
        ...metadata,
        agentId: this.id,
        agentName: this.name,
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Log agent activity
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const enhancedMessage = `[${this.name}] ${message}`;
    const meta = { agentId: this.id, agentName: this.name };

    switch (level) {
      case 'error':
        logger.error('agent', enhancedMessage, data instanceof Error ? data : undefined, data, meta);
        break;
      case 'warn':
        logger.warn('agent', enhancedMessage, data, meta);
        break;
      default:
        logger.info('agent', enhancedMessage, data, meta);
    }
  }

  /**
   * Process context data safely
   */
  protected processContextData<T>(
    data: any,
    processor: (data: any) => T,
    fallback: T
  ): T {
    try {
      return processor(data);
    } catch (error) {
      this.log('warn', 'Context data processing failed, using fallback', { error, data });
      return fallback;
    }
  }

  /**
   * Extract relevant session data based on agent capabilities
   */
  protected extractRelevantSessions(context: AgentContext): any[] {
    if (!context.sessionData || context.sessionData.length === 0) {
      return [];
    }

    // Default implementation returns all sessions
    // Subclasses can override to filter based on specific criteria
    return context.sessionData;
  }

  /**
   * Generate execution summary
   */
  protected generateExecutionSummary(
    context: AgentContext,
    result: AgentResult
  ): string {
    const summary = [
      `Agent: ${this.name}`,
      `Success: ${result.success}`,
      `Execution Time: ${result.executionTime || 'N/A'}ms`,
    ];

    if (result.insights && result.insights.length > 0) {
      summary.push(`Insights Generated: ${result.insights.length}`);
    }

    if (result.actions && result.actions.length > 0) {
      summary.push(`Actions Recommended: ${result.actions.length}`);
    }

    if (result.error) {
      summary.push(`Error: ${result.error}`);
    }

    return summary.join(' | ');
  }
}