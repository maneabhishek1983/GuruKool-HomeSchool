import { supabase } from '@/lib/supabase';
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';
import { logger } from './logging.service';

export interface RealtimeMessage {
  id: string;
  type:
    | 'message'
    | 'notification'
    | 'session_update'
    | 'location_update'
    | 'typing'
    | 'read_receipt'
    | 'system';
  from: string;
  to: string;
  content?: string;
  data?: any;
  timestamp: number;
  deliveryStatus: 'pending' | 'sent' | 'delivered' | 'read';
  priority: 'critical' | 'high' | 'medium' | 'low';
  expiresAt?: number;
  requiresAck?: boolean;
}

export interface ConnectionStatus {
  isConnected: boolean;
  lastConnected: Date | null;
  reconnectAttempts: number;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
}

/**
 * Supabase Realtime Service for real-time communication
 * Replaces WebSocket service with Supabase's built-in realtime features
 */
export class SupabaseRealtimeService {
  private static instance: SupabaseRealtimeService;
  private channels: Map<string, RealtimeChannel> = new Map();
  private messageHandlers = new Map<string, Set<(data: any) => void>>();
  private connectionState: 'connected' | 'disconnected' | 'error' =
    'disconnected';
  private connectionStatusListeners: Set<(status: ConnectionStatus) => void> =
    new Set();

  private connectionStatus: ConnectionStatus = {
    isConnected: false,
    lastConnected: null,
    reconnectAttempts: 0,
    connectionQuality: 'disconnected',
  };

  private constructor() {
    this.setupConnectionMonitoring();
  }

  static getInstance(): SupabaseRealtimeService {
    if (!SupabaseRealtimeService.instance) {
      SupabaseRealtimeService.instance = new SupabaseRealtimeService();
    }
    return SupabaseRealtimeService.instance;
  }

  /**
   * Setup connection monitoring for Supabase Realtime
   */
  private setupConnectionMonitoring(): void {
    // Monitor Supabase connection status
    setInterval(() => {
      const activeChannels = Array.from(this.channels.values());
      const hasActiveChannels = activeChannels.length > 0;

      this.connectionStatus.isConnected = hasActiveChannels;
      this.connectionStatus.connectionQuality = hasActiveChannels
        ? 'excellent'
        : 'disconnected';

      this.notifyConnectionStatusListeners();
    }, 5000);
  }

  /**
   * Subscribe to a Supabase Realtime channel
   */
  subscribe(
    channelName: string,
    event: string,
    callback: (payload: any) => void
  ): void {
    try {
      let channel = this.channels.get(channelName);

      if (!channel) {
        const newChannel = supabase.channel(channelName);
        if (!newChannel) {
          logger.error('app', `Failed to create channel: ${channelName}`);
          return;
        }

        this.channels.set(channelName, newChannel);

        newChannel
          .on('broadcast', { event }, (payload: any) => {
            callback(payload);
          })
          .subscribe((status: string) => {
            if (status === 'SUBSCRIBED') {
              this.connectionState = 'connected';
              this.connectionStatus.isConnected = true;
              this.connectionStatus.lastConnected = new Date();
              this.connectionStatus.connectionQuality = 'excellent';
              this.notifyConnectionStatusListeners();

              logger.info('app', `Subscribed to channel: ${channelName}`);
            } else if (status === 'CLOSED') {
              this.connectionState = 'disconnected';
              this.connectionStatus.isConnected = false;
              this.connectionStatus.connectionQuality = 'disconnected';
              this.notifyConnectionStatusListeners();

              logger.warn('app', `Channel closed: ${channelName}`);
            }
          });

        channel = newChannel;
      }

      // Add handler to the set
      if (!this.messageHandlers.has(event)) {
        this.messageHandlers.set(event, new Set());
      }
      const handlers = this.messageHandlers.get(event);
      if (handlers) {
        handlers.add(callback);
      }
    } catch (error) {
      logger.error(
        'app',
        'Error subscribing to channel:',
        error instanceof Error ? error : undefined
      );
      this.connectionState = 'error';
    }
  }

  /**
   * Subscribe to database changes (Postgres Changes)
   */
  subscribeToTable(
    table: string,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
    callback: (payload: RealtimePostgresChangesPayload<any>) => void,
    filter?: string
  ): void {
    try {
      const channelName = `${table}_changes`;
      let channel = this.channels.get(channelName);

      if (!channel) {
        const newChannel = supabase.channel(channelName);
        if (!newChannel) {
          logger.error('app', `Failed to create channel: ${channelName}`);
          return;
        }

        this.channels.set(channelName, newChannel);

        const postgresChanges = newChannel.on(
          'postgres_changes',
          {
            event,
            schema: 'public',
            table,
            ...(filter ? { filter } : {}),
          },
          callback
        );

        postgresChanges.subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            logger.info('app', `Subscribed to table changes: ${table}`);
          }
        });

        channel = newChannel;
      }
    } catch (error) {
      logger.error(
        'app',
        'Error subscribing to table changes:',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Send a broadcast message to a channel
   */
  async sendBroadcast(
    channelName: string,
    event: string,
    payload: any
  ): Promise<void> {
    try {
      const channel = this.channels.get(channelName);

      if (!channel) {
        const newChannel = supabase.channel(channelName);
        if (!newChannel) {
          logger.error('app', `Failed to create channel: ${channelName}`);
          return;
        }

        this.channels.set(channelName, newChannel);
        await newChannel.subscribe();
        await newChannel.send({
          type: 'broadcast',
          event,
          payload,
        });
      } else {
        await channel.send({
          type: 'broadcast',
          event,
          payload,
        });
      }

      logger.debug('app', `Broadcast sent to ${channelName}:${event}`);
    } catch (error) {
      logger.error(
        'app',
        'Error sending broadcast:',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Send a realtime message (compatible with old WebSocket API)
   */
  async sendRealtimeMessage(
    message: Partial<RealtimeMessage> &
      Pick<RealtimeMessage, 'type' | 'from' | 'to' | 'priority'>
  ): Promise<void> {
    const channelName = `user_${message.to}`;
    const event = message.type;

    const fullMessage: RealtimeMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      deliveryStatus: 'sent',
      ...message,
      type: message.type,
      from: message.from,
      to: message.to,
      priority: message.priority,
    };

    await this.sendBroadcast(channelName, event, fullMessage);
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(channelName: string): Promise<void> {
    try {
      const channel = this.channels.get(channelName);

      if (channel) {
        await supabase.removeChannel(channel);
        this.channels.delete(channelName);
        logger.info('app', `Unsubscribed from channel: ${channelName}`);
      }
    } catch (error) {
      logger.error(
        'app',
        'Error unsubscribing from channel:',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Unsubscribe from all channels
   */
  async unsubscribeAll(): Promise<void> {
    try {
      for (const channelName of this.channels.keys()) {
        await this.unsubscribe(channelName);
      }

      this.connectionState = 'disconnected';
      this.connectionStatus.isConnected = false;
      this.notifyConnectionStatusListeners();
    } catch (error) {
      logger.error(
        'app',
        'Error unsubscribing from all channels:',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Add connection status listener
   */
  onConnectionStatusChange(
    listener: (status: ConnectionStatus) => void
  ): () => void {
    this.connectionStatusListeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.connectionStatusListeners.delete(listener);
    };
  }

  /**
   * Notify connection status listeners
   */
  private notifyConnectionStatusListeners(): void {
    this.connectionStatusListeners.forEach(listener => {
      try {
        listener(this.connectionStatus);
      } catch (error) {
        logger.error(
          'app',
          'Error in connection status listener:',
          error instanceof Error ? error : undefined
        );
      }
    });
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return (
      this.connectionState === 'connected' && this.connectionStatus.isConnected
    );
  }

  /**
   * Get active channels count
   */
  getActiveChannelsCount(): number {
    return this.channels.size;
  }
}

// Export singleton instance
export const realtimeService = SupabaseRealtimeService.getInstance();
