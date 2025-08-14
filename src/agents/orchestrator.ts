import { AIAgent, AgentContext, AgentResult } from '@/types';
import { SecurityAnalysisAgent } from './security-analysis.agent';
import { AuthVerificationAgent } from './auth-verification.agent';
import { TaskAutomationAgent } from './task-automation.agent';
import { AnalyticsAgent } from './analytics.agent';
import { CommunicationAgent } from './communication.agent';
import { agentRegistry } from './registry';
import { executionEngine } from './execution-engine';

export interface MCPServerConfig {
  name: string;
  endpoint: string;
  apiKey?: string;
  capabilities: string[];
  enabled: boolean;
}

export interface AgentEvent {
  type: string;
  data: any;
  timestamp: number;
  source: string;
}

/**
 * AI Agent Orchestrator - Central hub for managing all AI agents and MCP server integrations
 */
export class AIAgentOrchestrator {
  private static instance: AIAgentOrchestrator;
  private agents = new Map<string, AIAgent>();
  private mcpServers = new Map<string, MCPServerConfig>();
  private eventQueue: AgentEvent[] = [];
  private isProcessing = false;

  private constructor() {
    this.initializeAgents();
    this.initializeMCPServers();
    this.startEventProcessor();
  }

  public static getInstance(): AIAgentOrchestrator {
    if (!AIAgentOrchestrator.instance) {
      AIAgentOrchestrator.instance = new AIAgentOrchestrator();
    }
    return AIAgentOrchestrator.instance;
  }

  /**
   * Initialize all AI agents
   */
  private initializeAgents(): void {
    // Security and Authentication Agents
    agentRegistry.registerAgent(new SecurityAnalysisAgent(), {
      tags: ['security', 'authentication'],
      priority: 10,
      maxRetries: 2,
    });
    
    agentRegistry.registerAgent(new AuthVerificationAgent(), {
      tags: ['security', 'authentication'],
      priority: 9,
      maxRetries: 3,
    });
    
    // Core Business Logic Agents
    agentRegistry.registerAgent(new TaskAutomationAgent(), {
      tags: ['automation', 'business-logic'],
      priority: 7,
      dependencies: [],
    });
    
    agentRegistry.registerAgent(new AnalyticsAgent(), {
      tags: ['analytics', 'insights'],
      priority: 6,
      dependencies: [],
    });
    
    agentRegistry.registerAgent(new CommunicationAgent(), {
      tags: ['communication', 'notifications'],
      priority: 5,
      dependencies: [],
    });

    // Legacy agent map for backward compatibility
    agentRegistry.getAllAgents().forEach(agent => {
      this.agents.set(agent.id, agent);
    });

    console.log(`Initialized ${agentRegistry.getStats().totalAgents} AI agents`);
  }

  /**
   * Initialize MCP server connections
   */
  private initializeMCPServers(): void {
    // Educational Content MCP Server
    this.registerMCPServer({
      name: 'education-content',
      endpoint: 'http://localhost:3001/mcp/education',
      capabilities: ['curriculum-analysis', 'lesson-planning', 'progress-tracking'],
      enabled: true,
    });

    // Security Analysis MCP Server
    this.registerMCPServer({
      name: 'security-analysis',
      endpoint: 'http://localhost:3002/mcp/security',
      capabilities: ['fraud-detection', 'behavior-analysis', 'risk-assessment'],
      enabled: true,
    });

    // Communication MCP Server
    this.registerMCPServer({
      name: 'communication',
      endpoint: 'http://localhost:3003/mcp/communication',
      capabilities: ['smart-notifications', 'message-routing', 'escalation-management'],
      enabled: true,
    });

    console.log(`Initialized ${this.mcpServers.size} MCP servers`);
  }

  /**
   * Register a new AI agent
   */
  public registerAgent(name: string, agent: AIAgent): void {
    this.agents.set(name, agent);
    console.log(`Registered AI agent: ${name}`);
  }

  /**
   * Register a new MCP server
   */
  public registerMCPServer(config: MCPServerConfig): void {
    this.mcpServers.set(config.name, config);
    console.log(`Registered MCP server: ${config.name}`);
  }

  /**
   * Execute a specific AI agent with context
   */
  public async executeAgent(
    agentName: string,
    context: any,
    options?: {
      timeout?: number;
      retries?: number;
      mcpIntegration?: boolean;
    }
  ): Promise<AgentResult> {
    const agent = this.agents.get(agentName);
    if (!agent) {
      throw new Error(`Agent '${agentName}' not found`);
    }

    const agentContext: AgentContext = {
      user: context.user || null,
      sessionData: context.sessionData || [],
      preferences: context.preferences || {},
      historicalData: context.historicalData || { sessions: [], analytics: [], interactions: [] },
      ...context,
    };

    try {
      // Enhance context with MCP server data if enabled
      if (options?.mcpIntegration !== false) {
        agentContext.mcpData = await this.getMCPEnhancedData(agentName, context);
      }

      const result = await agent.execute(agentContext);
      
      // Log successful execution
      await this.notifyEvent('agent_execution_success', {
        agentName,
        context: agentContext,
        result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      console.error(`Agent execution failed for '${agentName}':`, error);
      
      // Log failed execution
      await this.notifyEvent('agent_execution_failed', {
        agentName,
        context: agentContext,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Agent execution failed',
      };
    }
  }

  /**
   * Execute multiple agents in parallel
   */
  public async executeAgentsParallel(
    requests: Array<{ agentName: string; context: any; options?: any }>
  ): Promise<AgentResult[]> {
    const promises = requests.map(req =>
      this.executeAgent(req.agentName, req.context, req.options)
    );

    return Promise.all(promises);
  }

  /**
   * Execute agents in a workflow sequence
   */
  public async executeAgentWorkflow(
    workflow: Array<{
      agentName: string;
      context: any;
      dependsOn?: string[];
      options?: any;
    }>
  ): Promise<Map<string, AgentResult>> {
    const results = new Map<string, AgentResult>();
    const executed = new Set<string>();

    for (const step of workflow) {
      // Check dependencies
      if (step.dependsOn) {
        const missingDeps = step.dependsOn.filter(dep => !executed.has(dep));
        if (missingDeps.length > 0) {
          throw new Error(`Missing dependencies for ${step.agentName}: ${missingDeps.join(', ')}`);
        }
      }

      // Enhance context with previous results
      const enhancedContext = {
        ...step.context,
        previousResults: Object.fromEntries(results),
      };

      const result = await this.executeAgent(step.agentName, enhancedContext, step.options);
      results.set(step.agentName, result);
      executed.add(step.agentName);
    }

    return results;
  }

  /**
   * Notify agents of events for reactive processing
   */
  public async notifyEvent(eventType: string, data: any): Promise<void> {
    const event: AgentEvent = {
      type: eventType,
      data,
      timestamp: Date.now(),
      source: 'orchestrator',
    };

    this.eventQueue.push(event);
    
    // Process immediately if not already processing
    if (!this.isProcessing) {
      this.processEventQueue();
    }
  }

  /**
   * Get enhanced data from MCP servers
   */
  private async getMCPEnhancedData(agentName: string, context: any): Promise<any> {
    const relevantServers = Array.from(this.mcpServers.values()).filter(
      server => server.enabled && this.isServerRelevantForAgent(server, agentName)
    );

    if (relevantServers.length === 0) {
      return {};
    }

    const mcpPromises = relevantServers.map(async server => {
      try {
        const response = await this.callMCPServer(server, {
          agent: agentName,
          context,
          timestamp: Date.now(),
        });
        return { [server.name]: response };
      } catch (error) {
        console.error(`MCP server ${server.name} call failed:`, error);
        return { [server.name]: null };
      }
    });

    const mcpResults = await Promise.all(mcpPromises);
    return Object.assign({}, ...mcpResults);
  }

  /**
   * Check if MCP server is relevant for the agent
   */
  private isServerRelevantForAgent(server: MCPServerConfig, agentName: string): boolean {
    const agentMCPMapping: Record<string, string[]> = {
      'security-analysis': ['security-analysis'],
      'auth-verification': ['security-analysis'],
      'task-automation': ['education-content', 'communication'],
      'analytics': ['education-content'],
      'communication': ['communication'],
    };

    return agentMCPMapping[agentName]?.includes(server.name) || false;
  }

  /**
   * Call MCP server endpoint
   */
  private async callMCPServer(server: MCPServerConfig, data: any): Promise<any> {
    try {
      const response = await fetch(server.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(server.apiKey && { 'Authorization': `Bearer ${server.apiKey}` }),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`MCP server responded with status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`MCP server call failed for ${server.name}:`, error);
      throw error;
    }
  }

  /**
   * Process event queue for reactive agent execution
   */
  private async processEventQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift()!;
        await this.processEvent(event);
      }
    } catch (error) {
      console.error('Event processing failed:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process individual event
   */
  private async processEvent(event: AgentEvent): Promise<void> {
    // Define event-to-agent mappings
    const eventAgentMappings: Record<string, string[]> = {
      'qr_generated': ['security-analysis'],
      'auth_success': ['task-automation', 'analytics'],
      'auth_failure': ['security-analysis', 'communication'],
      'session_started': ['task-automation', 'analytics'],
      'session_completed': ['task-automation', 'analytics', 'communication'],
      'high_risk_auth_attempt': ['security-analysis', 'communication'],
    };

    const relevantAgents = eventAgentMappings[event.type] || [];

    for (const agentName of relevantAgents) {
      try {
        await this.executeAgent(agentName, {
          event,
          eventType: event.type,
          eventData: event.data,
          timestamp: event.timestamp,
        });
      } catch (error) {
        console.error(`Reactive agent execution failed for ${agentName}:`, error);
      }
    }
  }

  /**
   * Start the event processor
   */
  private startEventProcessor(): void {
    // Process events every 5 seconds
    setInterval(() => {
      this.processEventQueue();
    }, 5000);
  }

  /**
   * Get orchestrator status and statistics
   */
  public getStatus(): {
    agents: number;
    mcpServers: number;
    queuedEvents: number;
    isProcessing: boolean;
    uptime: number;
  } {
    return {
      agents: this.agents.size,
      mcpServers: this.mcpServers.size,
      queuedEvents: this.eventQueue.length,
      isProcessing: this.isProcessing,
      uptime: Date.now(), // Would track actual uptime in production
    };
  }

  /**
   * Health check for all agents and MCP servers
   */
  public async healthCheck(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    agents: Record<string, 'healthy' | 'unhealthy'>;
    mcpServers: Record<string, 'healthy' | 'unhealthy'>;
  }> {
    const agentHealth: Record<string, 'healthy' | 'unhealthy'> = {};
    const mcpHealth: Record<string, 'healthy' | 'unhealthy'> = {};

    // Check agent health
    for (const [name, agent] of this.agents) {
      try {
        // Simple health check - try to execute with minimal context
        await agent.execute({
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
        });
        agentHealth[name] = 'healthy';
      } catch {
        agentHealth[name] = 'unhealthy';
      }
    }

    // Check MCP server health
    for (const [name, server] of this.mcpServers) {
      if (!server.enabled) {
        mcpHealth[name] = 'healthy'; // Disabled servers are considered healthy
        continue;
      }

      try {
        await this.callMCPServer(server, { healthCheck: true });
        mcpHealth[name] = 'healthy';
      } catch {
        mcpHealth[name] = 'unhealthy';
      }
    }

    // Determine overall health
    const unhealthyAgents = Object.values(agentHealth).filter(h => h === 'unhealthy').length;
    const unhealthyServers = Object.values(mcpHealth).filter(h => h === 'unhealthy').length;
    
    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyAgents === 0 && unhealthyServers === 0) {
      overall = 'healthy';
    } else if (unhealthyAgents < this.agents.size / 2 && unhealthyServers < this.mcpServers.size / 2) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }

    return {
      overall,
      agents: agentHealth,
      mcpServers: mcpHealth,
    };
  }
}