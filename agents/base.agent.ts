/**
 * Base Agent Interface
 *
 * Abstract base class for all autonomous agents.
 * Provides common functionality and enforces agent contract.
 */

export interface AgentContext {
  action: string;
  payload?: any;
}

export interface AgentResult {
  success: boolean;
  message: string;
  data?: any;
  artifacts?: string[];
  errors?: string[];
}

export abstract class BaseAgent {
  abstract id: string;
  abstract name: string;
  abstract priority: number;
  abstract capabilities: string[];

  /**
   * Main execution entry point for all agents
   */
  abstract execute(context: AgentContext): Promise<AgentResult>;

  /**
   * Validate agent context before execution
   */
  protected validateContext(context: AgentContext): AgentResult | null {
    if (!context.action) {
      return {
        success: false,
        message: 'Action is required in agent context',
        errors: ['Missing required field: action'],
      };
    }

    return null; // null means validation passed
  }

  /**
   * Create success result
   */
  protected createSuccessResult(
    message: string,
    data?: any,
    artifacts?: string[]
  ): AgentResult {
    const result: AgentResult = {
      success: true,
      message,
      data,
    };
    if (artifacts !== undefined) {
      result.artifacts = artifacts;
    }
    return result;
  }

  /**
   * Create error result
   */
  protected createErrorResult(
    message: string,
    errors: string[] = []
  ): AgentResult {
    return {
      success: false,
      message,
      errors,
    };
  }

  /**
   * Log agent activity
   */
  protected log(
    message: string,
    level: 'info' | 'success' | 'error' = 'info'
  ): void {
    const prefix = {
      info: `[${this.name}]`,
      success: `[${this.name}] ✓`,
      error: `[${this.name}] ✗`,
    }[level];

    console.log(`${prefix} ${message}`);
  }

  /**
   * Create an insight result (specialized success result with confidence score)
   */
  protected createInsight(
    type: string,
    data: any,
    confidence: number = 1.0
  ): AgentResult {
    return {
      success: true,
      message: `Insight generated: ${type}`,
      data: {
        type,
        confidence,
        timestamp: new Date().toISOString(),
        ...data,
      },
    };
  }
}
