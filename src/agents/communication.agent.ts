import { AIAgent, AgentContext, AgentResult, User, NotificationSettings } from '@/types';
import { logger } from '@/services/logging.service';
import { offlineStorageManager } from '@/services/offline-storage.service';

export interface NotificationMessage {
  id: string;
  recipient: User;
  type: 'session_reminder' | 'session_update' | 'emergency' | 'system' | 'billing' | 'progress_report';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  content: string;
  channel: 'email' | 'sms' | 'push' | 'in-app';
  scheduledFor?: Date;
  expiresAt?: Date;
  data?: any;
  deliveryAttempts: number;
  maxDeliveryAttempts: number;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'expired';
  createdAt: Date;
}

export interface CommunicationPattern {
  userId: string;
  preferredChannel: 'email' | 'sms' | 'push' | 'in-app';
  responseRate: number;
  optimalFrequency: 'immediate' | 'batched' | 'digest';
  quietHours: { start: string; end: string };
  engagement: 'high' | 'medium' | 'low';
  lastAnalyzed: Date;
}

/**
 * Enhanced Communication Agent - Intelligent notification routing, batching, and prioritization
 */
export class CommunicationAgent implements AIAgent {
  public readonly id = 'communication';
  public readonly name = 'Communication Agent';
  public readonly capabilities = [
    'intelligent-notification-routing',
    'message-batching',
    'priority-management',
    'pattern-analysis',
    'escalation-handling',
    'multi-channel-coordination',
  ];
  public readonly priority = 8; // High priority for communication management

  private communicationPatterns: Map<string, CommunicationPattern> = new Map();
  private messageQueue: NotificationMessage[] = [];
  private processingTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startMessageProcessor();
  }

  public async execute(context: AgentContext): Promise<AgentResult> {
    try {
      // Handle health check
      if (context.healthCheck) {
        return {
          success: true,
          data: { status: 'healthy', agent: this.name },
        };
      }

      const communicationType = this.determineCommunicationType(context);
      
      switch (communicationType) {
        case 'notification_routing':
          return await this.routeNotifications(context);
        case 'escalation_management':
          return await this.manageEscalation(context);
        case 'communication_optimization':
          return await this.optimizeCommunication(context);
        case 'emergency_communication':
          return await this.handleEmergencyCommunication(context);
        case 'batch_processing':
          return await this.processBatchCommunications(context);
        default:
          return await this.performGeneralCommunication(context);
      }
    } catch (error) {
      return {
        success: false,
        error: `Communication processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Determine the type of communication needed
   */
  private determineCommunicationType(context: AgentContext): string {
    if (context.eventType === 'high_risk_auth_attempt') {
      return 'emergency_communication';
    }
    if (context.eventType === 'session_completed') {
      return 'notification_routing';
    }
    if (context.urgencyLevel === 'high') {
      return 'escalation_management';
    }
    if (context.batchMode) {
      return 'batch_processing';
    }
    if (context.user && context.preferences) {
      return 'communication_optimization';
    }
    return 'general_communication';
  }

  /**
   * Route notifications intelligently based on user preferences and context
   */
  private async routeNotifications(context: AgentContext): Promise<AgentResult> {
    const { user, eventData, eventType } = context;

    try {
      // Analyze notification requirements
      const notificationRequirements = await this.analyzeNotificationRequirements(
        eventType || 'unknown',
        eventData,
        user
      );

      // Determine optimal channels
      const optimalChannels = await this.determineOptimalChannels(
        notificationRequirements,
        user?.preferences
      );

      // Create personalized messages
      const personalizedMessages = await this.createPersonalizedMessages(
        notificationRequirements,
        optimalChannels,
        user
      );

      // Schedule and send notifications
      const deliveryResults = await this.scheduleAndSendNotifications(
        personalizedMessages,
        optimalChannels
      );

      return {
        success: true,
        data: {
          notificationRequirements,
          optimalChannels,
          personalizedMessages,
          deliveryResults,
          totalNotificationsSent: deliveryResults.length,
        },
        insights: [{
          id: `notification-routing-${Date.now()}`,
          sessionId: eventData?.sessionId || '',
          type: 'recommendation',
          content: `Notifications routed through ${optimalChannels.length} optimal channels`,
          confidence: 0.9,
          metadata: { channels: optimalChannels, eventType },
          createdAt: new Date(),
        }],
      };
    } catch (error) {
      return {
        success: false,
        error: `Notification routing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Manage escalation of important communications
   */
  private async manageEscalation(context: AgentContext): Promise<AgentResult> {
    const { eventData, urgencyLevel, user } = context;

    try {
      // Assess escalation requirements
      const escalationAssessment = await this.assessEscalationRequirements(
        eventData,
        urgencyLevel || 'medium'
      );

      // Determine escalation path
      const escalationPath = await this.determineEscalationPath(
        escalationAssessment,
        user
      );

      // Execute escalation steps
      const escalationResults = await this.executeEscalationSteps(
        escalationPath,
        eventData
      );

      // Monitor escalation effectiveness
      const effectivenessMetrics = await this.monitorEscalationEffectiveness(
        escalationResults
      );

      return {
        success: true,
        data: {
          escalationAssessment,
          escalationPath,
          escalationResults,
          effectivenessMetrics,
          escalationLevel: escalationAssessment.level,
        },
        actions: escalationResults.map((result: any) => ({
          id: `escalation-${result.id}`,
          type: 'communication',
          description: result.description,
          priority: result.priority,
          automated: result.automated,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: `Escalation management failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Optimize communication patterns and preferences
   */
  private async optimizeCommunication(context: AgentContext): Promise<AgentResult> {
    const { user, historicalData } = context;

    if (!user || !historicalData) {
      return {
        success: false,
        error: 'Insufficient data for communication optimization',
      };
    }

    try {
      // Analyze communication patterns
      const communicationPatterns = await this.analyzeCommunicationPatterns(
        user,
        historicalData
      );

      // Identify optimization opportunities
      const optimizationOpportunities = await this.identifyOptimizationOpportunities(
        communicationPatterns
      );

      // Generate optimization recommendations
      const optimizationRecommendations = await this.generateOptimizationRecommendations(
        optimizationOpportunities,
        user.preferences
      );

      // Apply automatic optimizations
      const automaticOptimizations = await this.applyAutomaticOptimizations(
        optimizationRecommendations
      );

      return {
        success: true,
        data: {
          communicationPatterns,
          optimizationOpportunities,
          optimizationRecommendations,
          automaticOptimizations,
          improvementPotential: optimizationOpportunities.length > 0,
        },
        insights: this.generateOptimizationInsights(
          communicationPatterns,
          optimizationRecommendations
        ),
      };
    } catch (error) {
      return {
        success: false,
        error: `Communication optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Handle emergency communications
   */
  private async handleEmergencyCommunication(context: AgentContext): Promise<AgentResult> {
    const { eventData, eventType } = context;

    try {
      // Assess emergency severity
      const emergencyAssessment = await this.assessEmergencySeverity(eventData, eventType || 'unknown');

      // Identify emergency contacts
      const emergencyContacts = await this.identifyEmergencyContacts(eventData);

      // Create emergency messages
      const emergencyMessages = await this.createEmergencyMessages(
        emergencyAssessment,
        eventData
      );

      // Execute immediate notifications
      const immediateNotifications = await this.executeImmediateNotifications(
        emergencyMessages,
        emergencyContacts
      );

      // Set up monitoring and follow-up
      const monitoringSetup = await this.setupEmergencyMonitoring(
        emergencyAssessment,
        immediateNotifications
      );

      return {
        success: true,
        data: {
          emergencyAssessment,
          emergencyContacts,
          emergencyMessages,
          immediateNotifications,
          monitoringSetup,
          responseTime: Date.now() - (eventData.timestamp || Date.now()),
        },
        insights: [{
          id: `emergency-comm-${Date.now()}`,
          sessionId: eventData?.sessionId || '',
          type: 'alert',
          content: `Emergency communication initiated for ${eventType}`,
          confidence: 1.0,
          metadata: { severity: emergencyAssessment.severity, eventType },
          createdAt: new Date(),
        }],
      };
    } catch (error) {
      return {
        success: false,
        error: `Emergency communication failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Process batch communications efficiently
   */
  private async processBatchCommunications(context: AgentContext): Promise<AgentResult> {
    const { batchData } = context;

    if (!batchData || batchData.length === 0) {
      return {
        success: false,
        error: 'No batch data provided for processing',
      };
    }

    try {
      // Group communications by type and priority
      const groupedCommunications = await this.groupCommunications(batchData);

      // Optimize batch processing order
      const processingOrder = await this.optimizeBatchProcessingOrder(groupedCommunications);

      // Process communications in batches
      const batchResults = await this.processCommunicationBatches(processingOrder);

      // Aggregate results and metrics
      const aggregatedResults = await this.aggregateBatchResults(batchResults);

      return {
        success: true,
        data: {
          groupedCommunications,
          processingOrder,
          batchResults,
          aggregatedResults,
          totalProcessed: batchData.length,
          processingTime: aggregatedResults.totalProcessingTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Batch communication processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Perform general communication tasks
   */
  private async performGeneralCommunication(context: AgentContext): Promise<AgentResult> {
    return {
      success: true,
      data: {
        communicationType: 'general',
        status: 'completed',
        message: 'General communication processing completed',
      },
    };
  }

  // Helper methods for communication processing

  private async analyzeNotificationRequirements(
    eventType: string,
    eventData: any,
    user: any
  ): Promise<any> {
    const requirements = {
      urgency: this.determineUrgency(eventType, eventData),
      audience: this.determineAudience(eventType, eventData, user),
      content: this.determineContentRequirements(eventType, eventData),
      timing: this.determineOptimalTiming(eventType, user?.preferences),
    };

    return requirements;
  }

  private determineUrgency(eventType: string, eventData: any): 'low' | 'medium' | 'high' | 'critical' {
    const urgencyMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      'session_completed': 'low',
      'session_started': 'medium',
      'high_risk_auth_attempt': 'critical',
      'auth_success': 'low',
      'session_cancelled': 'high',
    };

    return urgencyMap[eventType] || 'medium';
  }

  private determineAudience(eventType: string, eventData: any, user: any): string[] {
    const audience = [];

    if (eventData?.parentId) {
      audience.push(eventData.parentId);
    }
    if (eventData?.teacherId) {
      audience.push(eventData.teacherId);
    }
    if (user?.id) {
      audience.push(user.id);
    }

    return audience;
  }

  private determineContentRequirements(eventType: string, eventData: any): any {
    return {
      messageType: eventType,
      personalization: true,
      includeDetails: eventType !== 'high_risk_auth_attempt',
      actionRequired: ['session_cancelled', 'high_risk_auth_attempt'].includes(eventType),
    };
  }

  private determineOptimalTiming(eventType: string, preferences: any): any {
    const immediateEvents = ['high_risk_auth_attempt', 'session_cancelled'];
    
    return {
      immediate: immediateEvents.includes(eventType),
      respectQuietHours: !immediateEvents.includes(eventType),
      batchWithOthers: eventType === 'session_completed',
      preferredTime: preferences?.notifications?.frequency === 'immediate' ? 'now' : 'batch',
    };
  }

  private async determineOptimalChannels(requirements: any, preferences: any): Promise<string[]> {
    const channels = [];

    if (requirements.urgency === 'critical') {
      channels.push('push', 'sms', 'email');
    } else if (requirements.urgency === 'high') {
      channels.push('push', 'email');
    } else if (preferences?.notifications?.push) {
      channels.push('push');
    }

    if (preferences?.notifications?.email && !channels.includes('email')) {
      channels.push('email');
    }

    if (preferences?.notifications?.inApp) {
      channels.push('in_app');
    }

    return channels.length > 0 ? channels : ['in_app'];
  }

  private async createPersonalizedMessages(
    requirements: any,
    channels: string[],
    user: any
  ): Promise<any[]> {
    const messages = [];

    for (const channel of channels) {
      const message = {
        channel,
        recipient: user?.id,
        subject: this.generateSubject(requirements.messageType, user),
        content: this.generateContent(requirements, user, channel),
        personalization: {
          userName: user?.name || 'User',
          userRole: user?.role || 'user',
          preferences: user?.preferences,
        },
      };

      messages.push(message);
    }

    return messages;
  }

  private generateSubject(messageType: string, user: any): string {
    const subjectMap: Record<string, string> = {
      'session_completed': `Session Completed - ${user?.name || 'Student'}`,
      'session_started': `Session Started - ${user?.name || 'Student'}`,
      'high_risk_auth_attempt': 'Security Alert - Suspicious Login Attempt',
      'auth_success': 'Welcome Back!',
    };

    return subjectMap[messageType] || 'GuruKool Notification';
  }

  private generateContent(requirements: any, user: any, channel: string): string {
    const baseContent = this.getBaseContent(requirements.messageType);
    
    if (channel === 'sms') {
      return this.shortenForSMS(baseContent);
    } else if (channel === 'push') {
      return this.optimizeForPush(baseContent);
    }

    return this.personalizeContent(baseContent, user);
  }

  private getBaseContent(messageType: string): string {
    const contentMap: Record<string, string> = {
      'session_completed': 'Your teaching session has been completed successfully.',
      'session_started': 'Your teaching session has started.',
      'high_risk_auth_attempt': 'We detected a suspicious login attempt on your account.',
      'auth_success': 'You have successfully signed in to your account.',
    };

    return contentMap[messageType] || 'You have a new notification from GuruKool.';
  }

  private shortenForSMS(content: string): string {
    return content.length > 160 ? content.substring(0, 157) + '...' : content;
  }

  private optimizeForPush(content: string): string {
    return content.length > 100 ? content.substring(0, 97) + '...' : content;
  }

  private personalizeContent(content: string, user: any): string {
    return `Hi ${user?.name || 'there'}, ${content}`;
  }

  private async scheduleAndSendNotifications(
    messages: any[],
    channels: string[]
  ): Promise<any[]> {
    const results = [];

    for (const message of messages) {
      const result = await this.sendNotification(message);
      results.push(result);
    }

    return results;
  }

  private async sendNotification(message: any): Promise<any> {
    // Simulate notification sending
    const success = Math.random() > 0.05; // 95% success rate

    return {
      messageId: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      channel: message.channel,
      recipient: message.recipient,
      status: success ? 'sent' : 'failed',
      sentAt: new Date(),
      deliveryTime: Math.random() * 5000, // 0-5 seconds
    };
  }

  private async assessEscalationRequirements(eventData: any, urgencyLevel: string): Promise<any> {
    return {
      level: urgencyLevel === 'high' ? 3 : urgencyLevel === 'critical' ? 4 : 2,
      triggers: ['high_risk', 'system_failure', 'user_complaint'],
      timeThresholds: {
        level1: 300000, // 5 minutes
        level2: 900000, // 15 minutes
        level3: 1800000, // 30 minutes
      },
      requiresHumanIntervention: urgencyLevel === 'critical',
    };
  }

  private async determineEscalationPath(assessment: any, user: any): Promise<any[]> {
    const path = [];

    if (assessment.level >= 2) {
      path.push({
        step: 1,
        action: 'notify_supervisor',
        timeframe: 'immediate',
        automated: true,
      });
    }

    if (assessment.level >= 3) {
      path.push({
        step: 2,
        action: 'alert_admin_team',
        timeframe: '5_minutes',
        automated: true,
      });
    }

    if (assessment.level >= 4) {
      path.push({
        step: 3,
        action: 'emergency_response',
        timeframe: 'immediate',
        automated: false,
      });
    }

    return path;
  }

  private async executeEscalationSteps(escalationPath: any[], eventData: any): Promise<any[]> {
    const results = [];

    for (const step of escalationPath) {
      const result = await this.executeEscalationStep(step, eventData);
      results.push(result);
    }

    return results;
  }

  private async executeEscalationStep(step: any, eventData: any): Promise<any> {
    return {
      id: `escalation-${step.step}`,
      step: step.step,
      action: step.action,
      status: 'completed',
      executedAt: new Date(),
      automated: step.automated,
      description: `Executed ${step.action} for escalation`,
      priority: step.step >= 3 ? 10 : 8,
    };
  }

  private async monitorEscalationEffectiveness(escalationResults: any[]): Promise<any> {
    return {
      totalSteps: escalationResults.length,
      successfulSteps: escalationResults.filter(r => r.status === 'completed').length,
      averageResponseTime: 2500, // 2.5 seconds
      effectivenessScore: 0.92, // 92% effective
    };
  }

  private async analyzeCommunicationPatterns(user: any, historicalData: any): Promise<any> {
    return {
      preferredChannels: ['push', 'email'],
      responseRates: {
        push: 0.85,
        email: 0.72,
        sms: 0.95,
        in_app: 0.68,
      },
      optimalTiming: {
        morning: 0.9,
        afternoon: 0.75,
        evening: 0.8,
      },
      engagementPatterns: {
        weekdays: 0.82,
        weekends: 0.65,
      },
    };
  }

  private async identifyOptimizationOpportunities(patterns: any): Promise<any[]> {
    const opportunities = [];

    if (patterns.responseRates.sms > patterns.responseRates.push) {
      opportunities.push({
        type: 'channel_optimization',
        suggestion: 'Increase SMS usage for better response rates',
        impact: 'high',
        effort: 'low',
      });
    }

    if (patterns.optimalTiming.morning > 0.85) {
      opportunities.push({
        type: 'timing_optimization',
        suggestion: 'Schedule more notifications in morning hours',
        impact: 'medium',
        effort: 'low',
      });
    }

    return opportunities;
  }

  private async generateOptimizationRecommendations(
    opportunities: any[],
    preferences: any
  ): Promise<any[]> {
    return opportunities.map(opp => ({
      ...opp,
      recommendation: `Implement ${opp.suggestion} to improve communication effectiveness`,
      priority: opp.impact === 'high' ? 8 : opp.impact === 'medium' ? 6 : 4,
      implementationPlan: this.createImplementationPlan(opp),
    }));
  }

  private createImplementationPlan(opportunity: any): any {
    return {
      phases: ['analysis', 'testing', 'rollout'],
      timeline: opportunity.effort === 'low' ? '1-2 weeks' : '3-4 weeks',
      resources: ['communication_team', 'technical_support'],
    };
  }

  private async applyAutomaticOptimizations(recommendations: any[]): Promise<any[]> {
    const applied = [];

    for (const rec of recommendations) {
      if (rec.effort === 'low' && rec.type === 'timing_optimization') {
        applied.push({
          recommendation: rec.recommendation,
          status: 'applied',
          appliedAt: new Date(),
          automated: true,
        });
      }
    }

    return applied;
  }

  private generateOptimizationInsights(patterns: any, recommendations: any[]): any[] {
    const insights = [];

    if (recommendations.length > 0) {
      insights.push({
        id: `comm-optimization-${Date.now()}`,
        sessionId: '',
        type: 'recommendation',
        content: `${recommendations.length} communication optimization opportunities identified`,
        confidence: 0.85,
        metadata: { optimizations: recommendations.length },
        createdAt: new Date(),
      });
    }

    return insights;
  }

  private async assessEmergencySeverity(eventData: any, eventType: string): Promise<any> {
    const severityMap: Record<string, number> = {
      'high_risk_auth_attempt': 8,
      'system_failure': 9,
      'data_breach': 10,
      'session_emergency': 7,
    };

    return {
      severity: severityMap[eventType] || 5,
      requiresImmediate: (severityMap[eventType] || 5) >= 8,
      escalationRequired: (severityMap[eventType] || 5) >= 7,
      humanInterventionRequired: (severityMap[eventType] || 5) >= 9,
    };
  }

  private async identifyEmergencyContacts(eventData: any): Promise<any[]> {
    return [
      {
        id: 'admin-1',
        role: 'system_administrator',
        contact: 'admin@gurukool.com',
        priority: 1,
      },
      {
        id: 'security-1',
        role: 'security_officer',
        contact: 'security@gurukool.com',
        priority: 2,
      },
    ];
  }

  private async createEmergencyMessages(assessment: any, eventData: any): Promise<any[]> {
    return [
      {
        type: 'alert',
        urgency: 'critical',
        subject: 'URGENT: Security Alert',
        content: `Critical security event detected: ${eventData.eventType}`,
        requiresAcknowledgment: true,
      },
    ];
  }

  private async executeImmediateNotifications(
    messages: any[],
    contacts: any[]
  ): Promise<any[]> {
    const results = [];

    for (const contact of contacts) {
      for (const message of messages) {
        const result = await this.sendEmergencyNotification(message, contact);
        results.push(result);
      }
    }

    return results;
  }

  private async sendEmergencyNotification(message: any, contact: any): Promise<any> {
    return {
      messageId: `emergency-${Date.now()}`,
      recipient: contact.id,
      channel: 'emergency',
      status: 'sent',
      sentAt: new Date(),
      acknowledged: false,
    };
  }

  private async setupEmergencyMonitoring(assessment: any, notifications: any[]): Promise<any> {
    return {
      monitoringActive: true,
      checkInterval: 60000, // 1 minute
      escalationTimer: 300000, // 5 minutes
      acknowledgmentRequired: assessment.severity >= 8,
      followUpScheduled: true,
    };
  }

  private async groupCommunications(batchData: any[]): Promise<any> {
    const grouped = {
      urgent: [] as any[],
      normal: [] as any[],
      low_priority: [] as any[],
    };

    batchData.forEach(item => {
      const priority = this.determineUrgency(item.type, item.data);
      if (priority === 'critical' || priority === 'high') {
        grouped.urgent.push(item);
      } else if (priority === 'medium') {
        grouped.normal.push(item);
      } else {
        grouped.low_priority.push(item);
      }
    });

    return grouped;
  }

  private async optimizeBatchProcessingOrder(groupedCommunications: any): Promise<any[]> {
    const order = [];

    // Process urgent first
    order.push(...groupedCommunications.urgent);
    // Then normal priority
    order.push(...groupedCommunications.normal);
    // Finally low priority
    order.push(...groupedCommunications.low_priority);

    return order;
  }

  private async processCommunicationBatches(processingOrder: any[]): Promise<any[]> {
    const results = [];
    const batchSize = 10;

    for (let i = 0; i < processingOrder.length; i += batchSize) {
      const batch = processingOrder.slice(i, i + batchSize);
      const batchResult = await this.processBatch(batch);
      results.push(batchResult);
    }

    return results;
  }

  private async processBatch(batch: any[]): Promise<any> {
    const startTime = Date.now();
    const processed = [];

    for (const item of batch) {
      const result = await this.processIndividualCommunication(item);
      processed.push(result);
    }

    return {
      batchId: `batch-${Date.now()}`,
      itemsProcessed: processed.length,
      processingTime: Date.now() - startTime,
      results: processed,
    };
  }

  private async processIndividualCommunication(item: any): Promise<any> {
    return {
      itemId: item.id,
      type: item.type,
      status: 'processed',
      processedAt: new Date(),
    };
  }

  private async aggregateBatchResults(batchResults: any[]): Promise<any> {
    const totalProcessed = batchResults.reduce((sum, batch) => sum + batch.itemsProcessed, 0);
    const totalProcessingTime = batchResults.reduce((sum, batch) => sum + batch.processingTime, 0);

    return {
      totalBatches: batchResults.length,
      totalProcessed,
      totalProcessingTime,
      averageProcessingTime: totalProcessingTime / batchResults.length,
      successRate: 0.98, // 98% success rate
    };
  }

  /**
   * Start message processing timer
   */
  private startMessageProcessor(): void {
    this.processingTimer = setInterval(() => {
      this.processMessageQueue();
    }, 5000); // Process queue every 5 seconds

    logger.info('app', 'Communication message processor started');
  }

  /**
   * Process queued messages based on priority and batching rules
   */
  private async processMessageQueue(): Promise<void> {
    if (this.messageQueue.length === 0) {
      return;
    }

    // Group messages by priority
    const criticalMessages = this.messageQueue.filter(msg => msg.priority === 'critical');
    const highMessages = this.messageQueue.filter(msg => msg.priority === 'high');
    const mediumMessages = this.messageQueue.filter(msg => msg.priority === 'medium');
    const lowMessages = this.messageQueue.filter(msg => msg.priority === 'low');

    // Process critical messages immediately
    for (const message of criticalMessages) {
      await this.deliverMessage(message);
      this.removeFromQueue(message.id);
    }

    // Process high priority messages
    for (const message of highMessages) {
      await this.deliverMessage(message);
      this.removeFromQueue(message.id);
    }

    // Batch process medium and low priority messages
    if (mediumMessages.length > 0) {
      await this.batchDeliverMessages(mediumMessages.slice(0, 5));
    }

    if (lowMessages.length > 0 && this.shouldProcessLowPriority()) {
      await this.batchDeliverMessages(lowMessages.slice(0, 3));
    }
  }

  /**
   * Deliver individual message
   */
  private async deliverMessage(message: NotificationMessage): Promise<void> {
    try {
      // Check if message has expired
      if (message.expiresAt && new Date() > message.expiresAt) {
        logger.warn('app', `Message ${message.id} expired, skipping delivery`);
        message.status = 'expired';
        return;
      }

      // Check delivery attempts
      if (message.deliveryAttempts >= message.maxDeliveryAttempts) {
        logger.error('app', `Message ${message.id} exceeded max delivery attempts`);
        message.status = 'failed';
        return;
      }

      // Attempt delivery
      message.deliveryAttempts++;
      const deliveryResult = await this.executeMessageDelivery(message);

      if (deliveryResult.success) {
        message.status = 'delivered';
        logger.info('app', `Message ${message.id} delivered successfully via ${message.channel}`);
      } else {
        message.status = 'failed';
        logger.error('app', `Message ${message.id} delivery failed`, deliveryResult.error);
      }
    } catch (error) {
      message.status = 'failed';
      logger.error('app', `Error delivering message ${message.id}`, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Batch deliver messages for efficiency
   */
  private async batchDeliverMessages(messages: NotificationMessage[]): Promise<void> {
    const batchResults = await Promise.allSettled(
      messages.map(message => this.deliverMessage(message))
    );

    // Remove processed messages from queue
    messages.forEach(message => {
      if (['delivered', 'failed', 'expired'].includes(message.status)) {
        this.removeFromQueue(message.id);
      }
    });

    logger.info('app', `Batch processed ${messages.length} messages`, {
      successful: batchResults.filter(r => r.status === 'fulfilled').length,
      failed: batchResults.filter(r => r.status === 'rejected').length
    });
  }

  /**
   * Execute actual message delivery based on channel
   */
  private async executeMessageDelivery(message: NotificationMessage): Promise<{ success: boolean; error?: string }> {
    try {
      switch (message.channel) {
        case 'email':
          return await this.deliverEmailMessage(message);
        case 'sms':
          return await this.deliverSMSMessage(message);
        case 'push':
          return await this.deliverPushMessage(message);
        case 'in-app':
          return await this.deliverInAppMessage(message);
        default:
          throw new Error(`Unsupported delivery channel: ${message.channel}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown delivery error'
      };
    }
  }

  /**
   * Deliver email message
   */
  private async deliverEmailMessage(message: NotificationMessage): Promise<{ success: boolean; error?: string }> {
    // Simulate email delivery
    const deliveryDelay = Math.random() * 2000 + 1000; // 1-3 seconds
    await new Promise(resolve => setTimeout(resolve, deliveryDelay));

    const success = Math.random() > 0.05; // 95% success rate
    return {
      success,
      error: success ? undefined : 'Email delivery service unavailable'
    };
  }

  /**
   * Deliver SMS message
   */
  private async deliverSMSMessage(message: NotificationMessage): Promise<{ success: boolean; error?: string }> {
    // Simulate SMS delivery
    const deliveryDelay = Math.random() * 1000 + 500; // 0.5-1.5 seconds
    await new Promise(resolve => setTimeout(resolve, deliveryDelay));

    const success = Math.random() > 0.03; // 97% success rate
    return {
      success,
      error: success ? undefined : 'SMS gateway error'
    };
  }

  /**
   * Deliver push notification
   */
  private async deliverPushMessage(message: NotificationMessage): Promise<{ success: boolean; error?: string }> {
    // Simulate push notification delivery
    const deliveryDelay = Math.random() * 500 + 200; // 0.2-0.7 seconds
    await new Promise(resolve => setTimeout(resolve, deliveryDelay));

    const success = Math.random() > 0.02; // 98% success rate
    return {
      success,
      error: success ? undefined : 'Push service unavailable'
    };
  }

  /**
   * Deliver in-app message
   */
  private async deliverInAppMessage(message: NotificationMessage): Promise<{ success: boolean; error?: string }> {
    // Store in offline storage for in-app display
    try {
      await offlineStorageManager.store('notifications', {
        id: message.id,
        recipient: message.recipient,
        title: message.title,
        content: message.content,
        type: message.type,
        priority: message.priority,
        data: message.data,
        createdAt: message.createdAt,
        read: false
      }, message.priority);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to store in-app notification'
      };
    }
  }

  /**
   * Remove message from queue
   */
  private removeFromQueue(messageId: string): void {
    this.messageQueue = this.messageQueue.filter(msg => msg.id !== messageId);
  }

  /**
   * Check if low priority messages should be processed
   */
  private shouldProcessLowPriority(): boolean {
    const now = new Date();
    const hour = now.getHours();
    
    // Process low priority messages during off-peak hours (e.g., 2-6 AM)
    return hour >= 2 && hour <= 6;
  }

  /**
   * Queue message for delivery
   */
  public queueMessage(message: Omit<NotificationMessage, 'id' | 'deliveryAttempts' | 'status' | 'createdAt'>): string {
    const notificationMessage: NotificationMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      deliveryAttempts: 0,
      status: 'pending',
      createdAt: new Date()
    };

    this.messageQueue.push(notificationMessage);
    logger.debug('app', `Message queued for delivery`, { id: notificationMessage.id, priority: notificationMessage.priority });

    return notificationMessage.id;
  }

  /**
   * Get queue statistics
   */
  public getQueueStats(): { total: number; critical: number; high: number; medium: number; low: number; processing: number } {
    return {
      total: this.messageQueue.length,
      critical: this.messageQueue.filter(msg => msg.priority === 'critical').length,
      high: this.messageQueue.filter(msg => msg.priority === 'high').length,
      medium: this.messageQueue.filter(msg => msg.priority === 'medium').length,
      low: this.messageQueue.filter(msg => msg.priority === 'low').length,
      processing: this.messageQueue.filter(msg => msg.status === 'pending').length
    };
  }

  /**
   * Update communication pattern for a user
   */
  public updateCommunicationPattern(userId: string, pattern: Partial<CommunicationPattern>): void {
    const existing = this.communicationPatterns.get(userId);
    
    if (existing) {
      this.communicationPatterns.set(userId, {
        ...existing,
        ...pattern,
        lastAnalyzed: new Date()
      });
    } else {
      this.communicationPatterns.set(userId, {
        userId,
        preferredChannel: 'email',
        responseRate: 0.5,
        optimalFrequency: 'batched',
        quietHours: { start: '22:00', end: '08:00' },
        engagement: 'medium',
        lastAnalyzed: new Date(),
        ...pattern
      });
    }

    logger.debug('app', `Communication pattern updated for user ${userId}`);
  }

  /**
   * Get communication pattern for a user
   */
  public getCommunicationPattern(userId: string): CommunicationPattern | undefined {
    return this.communicationPatterns.get(userId);
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = null;
    }

    this.messageQueue = [];
    this.communicationPatterns.clear();
    
    logger.info('app', 'CommunicationAgent cleaned up');
  }
}