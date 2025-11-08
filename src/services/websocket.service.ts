import { WS_EVENTS } from '@/constants';
import { logger } from './logging.service';
import { offlineStorageManager } from './offline-storage.service';

export interface WebSocketMessage {
  event: string;
  sessionId?: string;
  data?: any;
  timestamp: number;
}

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

export interface TypingIndicator {
  userId: string;
  chatId: string;
  isTyping: boolean;
  timestamp: number;
}

export interface ReadReceipt {
  messageId: string;
  userId: string;
  readAt: number;
}

export interface ConnectionStatus {
  isConnected: boolean;
  lastConnected: Date | null;
  reconnectAttempts: number;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  latency: number;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  messageTimeout: number;
  typingTimeout: number;
  maxQueueSize: number;
}

/**
 * WebSocket Service for real-time communication
 */
export class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private messageHandlers = new Map<string, Set<(data: any) => void>>();
  private connectionState:
    | 'connecting'
    | 'connected'
    | 'disconnected'
    | 'error' = 'disconnected';

  // Enhanced messaging features
  private messageQueue: RealtimeMessage[] = [];
  private pendingAcks: Map<
    string,
    { message: RealtimeMessage; timeout: NodeJS.Timeout }
  > = new Map();
  private typingTimers: Map<string, NodeJS.Timeout> = new Map();
  private messageListeners: Set<(message: RealtimeMessage) => void> = new Set();
  private typingListeners: Set<(indicator: TypingIndicator) => void> =
    new Set();
  private readReceiptListeners: Set<(receipt: ReadReceipt) => void> = new Set();
  private connectionStatusListeners: Set<(status: ConnectionStatus) => void> =
    new Set();

  private connectionStatus: ConnectionStatus = {
    isConnected: false,
    lastConnected: null,
    reconnectAttempts: 0,
    connectionQuality: 'disconnected',
    latency: 0,
  };

  private currentUserId: string = 'anonymous';

  private constructor() {
    this.config = {
      url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws',
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      messageTimeout: 30000,
      typingTimeout: 3000,
      maxQueueSize: 1000,
    };

    this.initializePageVisibilityHandlers();
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Connect to WebSocket server
   */
  public connect(userId?: string): Promise<void> {
    if (userId) {
      this.currentUserId = userId;
    }

    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.connectionState = 'connecting';
      this.connectionStatus.reconnectAttempts = this.reconnectAttempts;

      try {
        const wsUrl = `${this.config.url}?userId=${encodeURIComponent(this.currentUserId)}&timestamp=${Date.now()}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          logger.info('app', 'WebSocket connected successfully');
          this.connectionState = 'connected';
          this.connectionStatus = {
            isConnected: true,
            lastConnected: new Date(),
            reconnectAttempts: 0,
            connectionQuality: 'excellent',
            latency: 0,
          };
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.processQueuedMessages();
          this.notifyConnectionStatusListeners();
          resolve();
        };

        this.ws.onmessage = event => {
          this.handleMessage(event);
        };

        this.ws.onclose = event => {
          logger.info('app', 'WebSocket disconnected', {
            code: event.code,
            reason: event.reason,
          });
          this.connectionState = 'disconnected';
          this.connectionStatus.isConnected = false;
          this.connectionStatus.connectionQuality = 'disconnected';
          this.stopHeartbeat();
          this.notifyConnectionStatusListeners();
          if (event.code !== 1000) {
            // Not a normal closure
            this.handleReconnection();
          }
        };

        this.ws.onerror = error => {
          const err = new Error('WebSocket error');
          logger.error('app', 'WebSocket error', err);
          this.connectionState = 'error';
          reject(err);
        };

        // Connection timeout
        setTimeout(() => {
          if (this.connectionState === 'connecting') {
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);
      } catch (error) {
        this.connectionState = 'error';
        logger.error(
          'app',
          'Failed to create WebSocket connection',
          error instanceof Error ? error : undefined
        );
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.stopHeartbeat();
    this.connectionState = 'disconnected';
  }

  /**
   * Send message to WebSocket server
   */
  public send(message: WebSocketMessage): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, message not sent:', message);
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      return false;
    }
  }

  /**
   * Subscribe to specific event type
   */
  public subscribe(
    eventType: string,
    handler: (data: any) => void
  ): () => void {
    if (!this.messageHandlers.has(eventType)) {
      this.messageHandlers.set(eventType, new Set());
    }

    this.messageHandlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(eventType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.messageHandlers.delete(eventType);
        }
      }
    };
  }

  /**
   * Subscribe to QR authentication status updates
   */
  public subscribeToQRAuth(
    sessionId: string,
    handler: (status: any) => void
  ): () => void {
    return this.subscribe(WS_EVENTS.QR_AUTH_STATUS, data => {
      if (data.sessionId === sessionId) {
        handler(data);
      }
    });
  }

  /**
   * Subscribe to session updates
   */
  public subscribeToSessionUpdates(handler: (update: any) => void): () => void {
    return this.subscribe(WS_EVENTS.SESSION_UPDATE, handler);
  }

  /**
   * Subscribe to notifications
   */
  public subscribeToNotifications(
    handler: (notification: any) => void
  ): () => void {
    return this.subscribe(WS_EVENTS.NOTIFICATION, handler);
  }

  /**
   * Subscribe to sync status updates
   */
  public subscribeToSyncStatus(handler: (status: any) => void): () => void {
    return this.subscribe(WS_EVENTS.SYNC_STATUS, handler);
  }

  /**
   * Subscribe to AI insights
   */
  public subscribeToAIInsights(handler: (insight: any) => void): () => void {
    return this.subscribe(WS_EVENTS.AI_INSIGHT, handler);
  }

  /**
   * Request QR code generation
   */
  public requestQRGeneration(deviceInfo?: string): void {
    this.send({
      event: 'qr_generate_request',
      data: { deviceInfo },
      timestamp: Date.now(),
    });
  }

  /**
   * Send QR verification request
   */
  public sendQRVerification(token: string, sessionId: string): void {
    this.send({
      event: 'qr_verify_request',
      sessionId,
      data: { token },
      timestamp: Date.now(),
    });
  }

  /**
   * Send heartbeat to keep connection alive
   */
  public sendHeartbeat(): void {
    const heartbeatStart = Date.now();
    this.send({
      event: 'heartbeat',
      timestamp: heartbeatStart,
    });
  }

  /**
   * Send real-time message with delivery confirmation
   */
  public async sendRealtimeMessage(
    message: Omit<RealtimeMessage, 'id' | 'timestamp' | 'deliveryStatus'>
  ): Promise<string> {
    const realtimeMessage: RealtimeMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: Date.now(),
      deliveryStatus: 'pending',
    };

    try {
      if (this.isConnected()) {
        await this.sendWebSocketMessage(realtimeMessage);
        realtimeMessage.deliveryStatus = 'sent';
        logger.debug('app', `Real-time message sent`, {
          id: realtimeMessage.id,
        });

        // Set up acknowledgment timeout if required
        if (realtimeMessage.requiresAck) {
          this.setupAckTimeout(realtimeMessage);
        }
      } else {
        this.queueMessage(realtimeMessage);
        logger.debug('app', `Message queued for later delivery`, {
          id: realtimeMessage.id,
        });
      }

      // Store message for offline access
      await this.storeMessage(realtimeMessage);
      return realtimeMessage.id;
    } catch (error) {
      logger.error(
        'app',
        `Failed to send real-time message ${realtimeMessage.id}`,
        error instanceof Error ? error : undefined
      );
      realtimeMessage.deliveryStatus = 'pending';
      this.queueMessage(realtimeMessage);
      throw error;
    }
  }

  /**
   * Send typing indicator
   */
  public sendTypingIndicator(chatId: string, isTyping: boolean): void {
    const indicator: TypingIndicator = {
      userId: this.currentUserId,
      chatId,
      isTyping,
      timestamp: Date.now(),
    };

    if (this.isConnected()) {
      this.send({
        event: 'typing_indicator',
        data: indicator,
        timestamp: Date.now(),
      });
    }

    // Auto-clear typing indicator after timeout
    const timerKey = `${chatId}_${this.currentUserId}`;
    const existingTimer = this.typingTimers.get(timerKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    if (isTyping) {
      const timer = setTimeout(() => {
        this.sendTypingIndicator(chatId, false);
      }, this.config.typingTimeout);
      this.typingTimers.set(timerKey, timer);
    } else {
      this.typingTimers.delete(timerKey);
    }
  }

  /**
   * Send read receipt
   */
  public sendReadReceipt(messageId: string): void {
    const receipt: ReadReceipt = {
      messageId,
      userId: this.currentUserId,
      readAt: Date.now(),
    };

    if (this.isConnected()) {
      this.send({
        event: 'read_receipt',
        data: receipt,
        timestamp: Date.now(),
      });
    }

    // Update local message read status
    this.updateMessageReadStatus(messageId);
  }

  /**
   * Subscribe to real-time messages
   */
  public onRealtimeMessage(
    callback: (message: RealtimeMessage) => void
  ): () => void {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  /**
   * Subscribe to typing indicators
   */
  public onTypingIndicator(
    callback: (indicator: TypingIndicator) => void
  ): () => void {
    this.typingListeners.add(callback);
    return () => this.typingListeners.delete(callback);
  }

  /**
   * Subscribe to read receipts
   */
  public onReadReceipt(callback: (receipt: ReadReceipt) => void): () => void {
    this.readReceiptListeners.add(callback);
    return () => this.readReceiptListeners.delete(callback);
  }

  /**
   * Subscribe to connection status changes
   */
  public onConnectionStatusChange(
    callback: (status: ConnectionStatus) => void
  ): () => void {
    this.connectionStatusListeners.add(callback);
    return () => this.connectionStatusListeners.delete(callback);
  }

  /**
   * Get current connection state
   */
  public getConnectionState(): string {
    return this.connectionState;
  }

  /**
   * Check if WebSocket is connected
   */
  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection statistics
   */
  public getStats(): {
    connectionState: string;
    reconnectAttempts: number;
    subscribedEvents: string[];
    totalSubscribers: number;
    messageQueueSize: number;
    pendingAcks: number;
    connectionStatus: ConnectionStatus;
  } {
    return {
      connectionState: this.connectionState,
      reconnectAttempts: this.reconnectAttempts,
      subscribedEvents: Array.from(this.messageHandlers.keys()),
      totalSubscribers: Array.from(this.messageHandlers.values()).reduce(
        (total, handlers) => total + handlers.size,
        0
      ),
      messageQueueSize: this.messageQueue.length,
      pendingAcks: this.pendingAcks.size,
      connectionStatus: this.connectionStatus,
    };
  }

  /**
   * Get enhanced connection status
   */
  public getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Get message queue statistics
   */
  public getMessageQueueStats(): {
    total: number;
    pending: number;
    sent: number;
    failed: number;
    byPriority: Record<string, number>;
  } {
    const byPriority = this.messageQueue.reduce(
      (acc, msg) => {
        acc[msg.priority] = (acc[msg.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total: this.messageQueue.length,
      pending: this.messageQueue.filter(msg => msg.deliveryStatus === 'pending')
        .length,
      sent: this.messageQueue.filter(msg => msg.deliveryStatus === 'sent')
        .length,
      failed: this.messageQueue.filter(
        msg =>
          msg.deliveryStatus === 'pending' &&
          Date.now() - msg.timestamp > this.config.messageTimeout
      ).length,
      byPriority,
    };
  }

  /**
   * Clear message queue
   */
  public clearMessageQueue(): number {
    const queueSize = this.messageQueue.length;
    this.messageQueue = [];
    logger.info('app', `Cleared ${queueSize} messages from queue`);
    return queueSize;
  }

  /**
   * Set user ID for connection
   */
  public setUserId(userId: string): void {
    this.currentUserId = userId;
  }

  /**
   * Get current user ID
   */
  public getUserId(): string {
    return this.currentUserId;
  }

  // Private methods

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      // Handle heartbeat response and calculate latency
      if (message.event === 'heartbeat_response') {
        this.connectionStatus.latency = Date.now() - message.timestamp;
        this.updateConnectionQuality();
        return;
      }

      // Handle real-time messaging events
      switch (message.event) {
        case 'realtime_message':
          this.handleRealtimeMessage(message.data);
          break;
        case 'typing_indicator':
          this.handleTypingIndicator(message.data);
          break;
        case 'read_receipt':
          this.handleReadReceipt(message.data);
          break;
        case 'message_ack':
          this.handleMessageAck(message.data);
          break;
        case 'delivery_confirmation':
          this.handleDeliveryConfirmation(message.data);
          break;
        default:
          // Fallback to existing event handling
          const handlers = this.messageHandlers.get(message.event);
          if (handlers) {
            handlers.forEach(handler => {
              try {
                handler(message.data || message);
              } catch (error) {
                logger.error(
                  'app',
                  `Error in WebSocket message handler for ${message.event}`,
                  error instanceof Error ? error : undefined
                );
              }
            });
          } else if (process.env.NODE_ENV === 'development') {
            logger.debug('app', 'Unhandled WebSocket message', message);
          }
      }
    } catch (error) {
      logger.error(
        'app',
        'Failed to parse WebSocket message',
        error instanceof Error ? error : undefined
      );
    }
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `Attempting to reconnect (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})...`
    );

    setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, this.config.reconnectInterval * this.reconnectAttempts);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // Enhanced messaging helper methods

  /**
   * Handle incoming real-time messages
   */
  private handleRealtimeMessage(message: RealtimeMessage): void {
    logger.debug('app', 'Real-time message received', {
      id: message.id,
      type: message.type,
    });

    // Store message for offline access
    this.storeMessage(message);

    // Notify listeners
    this.notifyMessageListeners(message);

    // Send acknowledgment if required
    if (message.requiresAck) {
      this.sendMessageAck(message.id);
    }
  }

  /**
   * Handle typing indicators
   */
  private handleTypingIndicator(indicator: TypingIndicator): void {
    this.notifyTypingListeners(indicator);
  }

  /**
   * Handle read receipts
   */
  private handleReadReceipt(receipt: ReadReceipt): void {
    this.updateMessageReadStatus(receipt.messageId);
    this.notifyReadReceiptListeners(receipt);
  }

  /**
   * Handle message acknowledgments
   */
  private handleMessageAck(data: { messageId: string }): void {
    const pending = this.pendingAcks.get(data.messageId);
    if (pending) {
      clearTimeout(pending.timeout);
      pending.message.deliveryStatus = 'delivered';
      this.pendingAcks.delete(data.messageId);
      this.updateStoredMessage(pending.message);
      logger.debug('app', `Message acknowledged`, {
        messageId: data.messageId,
      });
    }
  }

  /**
   * Handle delivery confirmations
   */
  private handleDeliveryConfirmation(data: {
    messageId: string;
    delivered: boolean;
  }): void {
    // Update message delivery status
    logger.debug('app', `Delivery confirmation received`, data);
  }

  /**
   * Update connection quality based on latency
   */
  private updateConnectionQuality(): void {
    if (this.connectionStatus.latency < 50) {
      this.connectionStatus.connectionQuality = 'excellent';
    } else if (this.connectionStatus.latency < 150) {
      this.connectionStatus.connectionQuality = 'good';
    } else {
      this.connectionStatus.connectionQuality = 'poor';
    }
    this.notifyConnectionStatusListeners();
  }

  /**
   * Send WebSocket message
   */
  private async sendWebSocketMessage(message: RealtimeMessage): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      try {
        this.ws.send(
          JSON.stringify({
            event: 'realtime_message',
            data: message,
            timestamp: Date.now(),
          })
        );
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Queue message for later delivery
   */
  private queueMessage(message: RealtimeMessage): void {
    this.messageQueue.push(message);

    // Limit queue size
    if (this.messageQueue.length > this.config.maxQueueSize) {
      this.messageQueue = this.messageQueue.slice(-this.config.maxQueueSize);
      logger.warn(
        'app',
        'Message queue size limit reached, older messages discarded'
      );
    }
  }

  /**
   * Process queued messages when connection is restored
   */
  private async processQueuedMessages(): Promise<void> {
    if (this.messageQueue.length === 0) {
      return;
    }

    logger.info(
      'app',
      `Processing ${this.messageQueue.length} queued messages`
    );
    const messages = [...this.messageQueue];
    this.messageQueue = [];

    for (const message of messages) {
      try {
        // Check if message has expired
        if (message.expiresAt && Date.now() > message.expiresAt) {
          logger.warn('app', `Expired message discarded`, { id: message.id });
          continue;
        }

        await this.sendWebSocketMessage(message);
        message.deliveryStatus = 'sent';
        await this.updateStoredMessage(message);

        if (message.requiresAck) {
          this.setupAckTimeout(message);
        }
      } catch (error) {
        logger.error(
          'app',
          `Failed to send queued message ${message.id}`,
          error instanceof Error ? error : undefined
        );
        this.queueMessage(message); // Re-queue failed message
      }
    }
  }

  /**
   * Set up acknowledgment timeout
   */
  private setupAckTimeout(message: RealtimeMessage): void {
    const timeout = setTimeout(() => {
      logger.warn('app', `Message acknowledgment timeout`, {
        messageId: message.id,
      });
      message.deliveryStatus = 'pending'; // Reset to pending for retry
      this.pendingAcks.delete(message.id);
    }, this.config.messageTimeout);

    this.pendingAcks.set(message.id, { message, timeout });
  }

  /**
   * Send message acknowledgment
   */
  private sendMessageAck(messageId: string): void {
    if (this.isConnected()) {
      this.send({
        event: 'message_ack',
        data: { messageId },
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Store message in offline storage
   */
  private async storeMessage(message: RealtimeMessage): Promise<void> {
    try {
      await offlineStorageManager.store(
        'messages',
        {
          id: message.id,
          type: message.type,
          from: message.from,
          to: message.to,
          content: message.content,
          data: message.data,
          timestamp: message.timestamp,
          deliveryStatus: message.deliveryStatus,
          priority: message.priority,
          read: false,
          expiresAt: message.expiresAt,
        },
        message.priority === 'critical' ? 'high' : message.priority
      );
    } catch (error) {
      logger.error(
        'app',
        'Failed to store message',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Update stored message
   */
  private async updateStoredMessage(message: RealtimeMessage): Promise<void> {
    try {
      const stored = await offlineStorageManager.get('messages', message.id);
      if (stored) {
        await offlineStorageManager.store(
          'messages',
          {
            ...stored,
            deliveryStatus: message.deliveryStatus,
            timestamp: message.timestamp,
          },
          message.priority === 'critical' ? 'high' : message.priority
        );
      }
    } catch (error) {
      logger.error(
        'app',
        'Failed to update stored message',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Update message read status
   */
  private async updateMessageReadStatus(messageId: string): Promise<void> {
    try {
      const stored = await offlineStorageManager.get('messages', messageId);
      if (stored) {
        await offlineStorageManager.store(
          'messages',
          {
            ...stored,
            read: true,
            readAt: Date.now(),
          },
          stored.priority
        );
      }
    } catch (error) {
      logger.error(
        'app',
        'Failed to update message read status',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize page visibility handlers
   */
  private initializePageVisibilityHandlers(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          logger.debug(
            'app',
            'Page became hidden, maintaining WebSocket connection'
          );
        } else {
          logger.debug(
            'app',
            'Page became visible, checking WebSocket connection'
          );
          if (!this.isConnected() && this.currentUserId !== 'anonymous') {
            this.connect(this.currentUserId);
          }
        }
      });
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });
    }
  }

  /**
   * Notify message listeners
   */
  private notifyMessageListeners(message: RealtimeMessage): void {
    this.messageListeners.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        logger.error(
          'app',
          'Error in message listener',
          error instanceof Error ? error : undefined
        );
      }
    });
  }

  /**
   * Notify typing listeners
   */
  private notifyTypingListeners(indicator: TypingIndicator): void {
    this.typingListeners.forEach(callback => {
      try {
        callback(indicator);
      } catch (error) {
        logger.error(
          'app',
          'Error in typing listener',
          error instanceof Error ? error : undefined
        );
      }
    });
  }

  /**
   * Notify read receipt listeners
   */
  private notifyReadReceiptListeners(receipt: ReadReceipt): void {
    this.readReceiptListeners.forEach(callback => {
      try {
        callback(receipt);
      } catch (error) {
        logger.error(
          'app',
          'Error in read receipt listener',
          error instanceof Error ? error : undefined
        );
      }
    });
  }

  /**
   * Notify connection status listeners
   */
  private notifyConnectionStatusListeners(): void {
    this.connectionStatusListeners.forEach(callback => {
      try {
        callback(this.connectionStatus);
      } catch (error) {
        logger.error(
          'app',
          'Error in connection status listener',
          error instanceof Error ? error : undefined
        );
      }
    });
  }

  /**
   * Enhanced cleanup
   */
  public cleanup(): void {
    // Clear reconnection timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Clear all typing timers
    this.typingTimers.forEach(timer => clearTimeout(timer));
    this.typingTimers.clear();

    // Clear all pending acknowledgments
    this.pendingAcks.forEach(({ timeout }) => clearTimeout(timeout));
    this.pendingAcks.clear();

    // Disconnect WebSocket
    this.disconnect();

    // Clear all listeners
    this.messageListeners.clear();
    this.typingListeners.clear();
    this.readReceiptListeners.clear();
    this.connectionStatusListeners.clear();
    this.messageHandlers.clear();

    // Clear message queue
    this.messageQueue = [];

    logger.info('app', 'WebSocket service cleaned up');
  }
}

// Export singleton instance
export const wsService = WebSocketService.getInstance();
