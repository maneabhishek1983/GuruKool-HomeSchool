import { createClient } from '@supabase/supabase-js';
import { SecurityService } from './security.service';
import { LoggingService } from './logging.service';

export interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  id: string;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDelivery {
  id: string;
  endpointId: string;
  payload: WebhookPayload;
  status: 'pending' | 'delivered' | 'failed';
  attempts: number;
  lastAttempt: string;
  nextRetry?: string;
  responseCode?: number;
  responseBody?: string;
  createdAt: string;
}

export class WebhookService {
  private supabase: any;
  private securityService: SecurityService;
  private loggingService: LoggingService;
  private retryDelays: number[] = [1000, 5000, 15000, 60000, 300000]; // 1s, 5s, 15s, 1m, 5m

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    this.securityService = new SecurityService();
    this.loggingService = new LoggingService();
  }

  /**
   * Register a new webhook endpoint
   */
  async registerEndpoint(
    url: string,
    events: string[],
    secret: string,
    userId: string
  ): Promise<WebhookEndpoint> {
    try {
      // Validate URL
      if (!this.isValidUrl(url)) {
        throw new Error('Invalid webhook URL');
      }

      // Validate events
      if (!events.length || !this.areValidEvents(events)) {
        throw new Error('Invalid events specified');
      }

      // Generate endpoint ID
      const endpointId = this.securityService.generateUUID();

      // Hash the secret
      const hashedSecret = await this.securityService.hashData(secret);

      const endpoint: WebhookEndpoint = {
        id: endpointId,
        url,
        events,
        secret: hashedSecret,
        isActive: true,
        retryCount: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store in database
      const { data, error } = await this.supabase
        .from('webhook_endpoints')
        .insert(endpoint)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to register webhook: ${error.message}`);
      }

      await this.loggingService.logInfo('Webhook Endpoint Registered', {
        endpointId,
        url,
        events,
        userId
      });

      return data;
    } catch (error) {
      await this.loggingService.logError('Webhook Registration Failed', {
        url,
        events,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Send a webhook event to all registered endpoints
   */
  async sendEvent(event: string, data: any): Promise<void> {
    try {
      // Get all active endpoints for this event
      const { data: endpoints, error } = await this.supabase
        .from('webhook_endpoints')
        .select('*')
        .eq('isActive', true)
        .contains('events', [event]);

      if (error) {
        throw new Error(`Failed to fetch webhook endpoints: ${error.message}`);
      }

      if (!endpoints.length) {
        return; // No endpoints registered for this event
      }

      // Create webhook payload
      const payload: WebhookPayload = {
        event,
        data,
        timestamp: new Date().toISOString(),
        id: this.securityService.generateUUID()
      };

      // Send to each endpoint
      const deliveryPromises = endpoints.map(endpoint =>
        this.deliverWebhook(endpoint, payload)
      );

      await Promise.allSettled(deliveryPromises);

      await this.loggingService.logInfo('Webhook Event Sent', {
        event,
        endpointCount: endpoints.length,
        payloadId: payload.id
      });

    } catch (error) {
      await this.loggingService.logError('Webhook Event Send Failed', {
        event,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Deliver webhook to a specific endpoint
   */
  private async deliverWebhook(
    endpoint: WebhookEndpoint,
    payload: WebhookPayload
  ): Promise<void> {
    try {
      // Create delivery record
      const delivery: WebhookDelivery = {
        id: this.securityService.generateUUID(),
        endpointId: endpoint.id,
        payload,
        status: 'pending',
        attempts: 0,
        lastAttempt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      // Store delivery record
      await this.supabase
        .from('webhook_deliveries')
        .insert(delivery);

      // Attempt delivery
      await this.attemptDelivery(delivery, endpoint);

    } catch (error) {
      await this.loggingService.logError('Webhook Delivery Failed', {
        endpointId: endpoint.id,
        payloadId: payload.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Attempt to deliver a webhook
   */
  private async attemptDelivery(
    delivery: WebhookDelivery,
    endpoint: WebhookEndpoint
  ): Promise<void> {
    try {
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Gurukool-Webhook/1.0',
        'X-Webhook-Event': delivery.payload.event,
        'X-Webhook-ID': delivery.payload.id,
        'X-Webhook-Timestamp': delivery.payload.timestamp
      };

      // Add signature if secret is available
      if (endpoint.secret) {
        const signature = await this.securityService.generateHMAC(
          JSON.stringify(delivery.payload),
          endpoint.secret
        );
        headers['X-Webhook-Signature'] = signature;
      }

      // Make HTTP request
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(delivery.payload),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      // Update delivery status
      const newAttempts = delivery.attempts + 1;
      const isSuccess = response.ok;
      const status = isSuccess ? 'delivered' : 'failed';

      await this.updateDeliveryStatus(delivery.id, {
        status,
        attempts: newAttempts,
        lastAttempt: new Date().toISOString(),
        responseCode: response.status,
        responseBody: await response.text()
      });

      if (isSuccess) {
        await this.loggingService.logInfo('Webhook Delivered Successfully', {
          deliveryId: delivery.id,
          endpointId: endpoint.id,
          responseCode: response.status
        });
      } else {
        // Schedule retry if attempts remaining
        if (newAttempts < endpoint.retryCount) {
          await this.scheduleRetry(delivery.id, newAttempts);
        } else {
          await this.loggingService.logError('Webhook Delivery Failed - Max Retries', {
            deliveryId: delivery.id,
            endpointId: endpoint.id,
            attempts: newAttempts,
            responseCode: response.status
          });
        }
      }

    } catch (error) {
      // Handle network errors
      const newAttempts = delivery.attempts + 1;
      
      await this.updateDeliveryStatus(delivery.id, {
        status: 'failed',
        attempts: newAttempts,
        lastAttempt: new Date().toISOString(),
        responseBody: error instanceof Error ? error.message : 'Network error'
      });

      // Schedule retry if attempts remaining
      if (newAttempts < endpoint.retryCount) {
        await this.scheduleRetry(delivery.id, newAttempts);
      }
    }
  }

  /**
   * Schedule a retry for failed webhook delivery
   */
  private async scheduleRetry(deliveryId: string, attempt: number): Promise<void> {
    const delay = this.retryDelays[Math.min(attempt - 1, this.retryDelays.length - 1)];
    const nextRetry = new Date(Date.now() + delay).toISOString();

    await this.updateDeliveryStatus(deliveryId, {
      nextRetry,
      status: 'pending'
    });

    // In a real implementation, you'd use a job queue (like Bull/BullMQ)
    // For now, we'll use setTimeout as a simple example
    setTimeout(async () => {
      await this.retryDelivery(deliveryId);
    }, delay);
  }

  /**
   * Retry a failed webhook delivery
   */
  private async retryDelivery(deliveryId: string): Promise<void> {
    try {
      // Get delivery and endpoint details
      const { data: delivery } = await this.supabase
        .from('webhook_deliveries')
        .select('*')
        .eq('id', deliveryId)
        .single();

      const { data: endpoint } = await this.supabase
        .from('webhook_endpoints')
        .select('*')
        .eq('id', delivery.endpointId)
        .single();

      if (delivery && endpoint) {
        await this.attemptDelivery(delivery, endpoint);
      }
    } catch (error) {
      await this.loggingService.logError('Webhook Retry Failed', {
        deliveryId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update delivery status in database
   */
  private async updateDeliveryStatus(
    deliveryId: string,
    updates: Partial<WebhookDelivery>
  ): Promise<void> {
    await this.supabase
      .from('webhook_deliveries')
      .update(updates)
      .eq('id', deliveryId);
  }

  /**
   * Get webhook delivery history
   */
  async getDeliveryHistory(
    endpointId?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<WebhookDelivery[]> {
    let query = this.supabase
      .from('webhook_deliveries')
      .select('*')
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);

    if (endpointId) {
      query = query.eq('endpointId', endpointId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch delivery history: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get webhook endpoint statistics
   */
  async getEndpointStats(endpointId: string): Promise<any> {
    const { data: deliveries, error } = await this.supabase
      .from('webhook_deliveries')
      .select('status, attempts, createdAt')
      .eq('endpointId', endpointId);

    if (error) {
      throw new Error(`Failed to fetch endpoint stats: ${error.message}`);
    }

    const stats = {
      total: deliveries.length,
      delivered: deliveries.filter(d => d.status === 'delivered').length,
      failed: deliveries.filter(d => d.status === 'failed').length,
      pending: deliveries.filter(d => d.status === 'pending').length,
      averageAttempts: deliveries.reduce((sum, d) => sum + d.attempts, 0) / deliveries.length
    };

    return stats;
  }

  /**
   * Deactivate a webhook endpoint
   */
  async deactivateEndpoint(endpointId: string): Promise<void> {
    const { error } = await this.supabase
      .from('webhook_endpoints')
      .update({ isActive: false, updatedAt: new Date().toISOString() })
      .eq('id', endpointId);

    if (error) {
      throw new Error(`Failed to deactivate endpoint: ${error.message}`);
    }

    await this.loggingService.logInfo('Webhook Endpoint Deactivated', {
      endpointId
    });
  }

  /**
   * Delete a webhook endpoint
   */
  async deleteEndpoint(endpointId: string): Promise<void> {
    // Delete associated deliveries first
    await this.supabase
      .from('webhook_deliveries')
      .delete()
      .eq('endpointId', endpointId);

    // Delete endpoint
    const { error } = await this.supabase
      .from('webhook_endpoints')
      .delete()
      .eq('id', endpointId);

    if (error) {
      throw new Error(`Failed to delete endpoint: ${error.message}`);
    }

    await this.loggingService.logInfo('Webhook Endpoint Deleted', {
      endpointId
    });
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate event names
   */
  private areValidEvents(events: string[]): boolean {
    const validEvents = [
      'session.created',
      'session.updated',
      'session.completed',
      'user.registered',
      'user.updated',
      'analytics.generated',
      'payment.processed',
      'notification.sent'
    ];

    return events.every(event => validEvents.includes(event));
  }
}
