/**
 * Network Manager Service
 * Handles network status detection and automatic sync triggers
 */

import { logger } from './logging.service';
import { syncManager } from './sync-manager.service';
import { offlineStorageManager } from './offline-storage.service';

export interface NetworkStatus {
  isOnline: boolean;
  connectionType: 'ethernet' | 'wifi' | 'cellular' | 'unknown';
  effectiveType: '2g' | '3g' | '4g' | '5g' | 'unknown';
  downlink: number;
  rtt: number;
  saveData: boolean;
  lastChanged: Date;
}

export interface QueueStats {
  total: number;
  high: number;
  medium: number;
  low: number;
  processing: number;
  failed: number;
}

export class NetworkManager {
  private static instance: NetworkManager;
  private networkStatus: NetworkStatus;
  private connectionListeners: Set<(status: NetworkStatus) => void> = new Set();
  private syncTimer: NodeJS.Timeout | null = null;
  private queueProcessor: NodeJS.Timeout | null = null;
  private connectivityCheckInterval: NodeJS.Timeout | null = null;
  private isProcessingQueue = false;
  // Store bound references so they can be properly removed
  private boundHandleOnline = this.handleOnline.bind(this);
  private boundHandleOffline = this.handleOffline.bind(this);
  private boundHandleConnectionChange = this.handleConnectionChange.bind(this);

  private constructor() {
    this.networkStatus = this.getInitialNetworkStatus();
    this.initializeEventListeners();
    this.startQueueProcessor();
  }

  public static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  /**
   * Initialize network status
   */
  private getInitialNetworkStatus(): NetworkStatus {
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    return {
      isOnline: navigator.onLine,
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
      saveData: connection?.saveData || false,
      lastChanged: new Date(),
    };
  }

  /**
   * Set up event listeners for network changes
   */
  private initializeEventListeners(): void {
    // Listen for online/offline events using stored bound references
    window.addEventListener('online', this.boundHandleOnline);
    window.addEventListener('offline', this.boundHandleOffline);

    // Listen for connection changes (if available)
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    if (connection) {
      connection.addEventListener(
        'change',
        this.boundHandleConnectionChange
      );
    }

    // Periodic connectivity check (store interval for cleanup)
    this.connectivityCheckInterval = setInterval(() => {
      this.checkConnectivity();
    }, 30000); // Check every 30 seconds

    logger.info('app', 'NetworkManager event listeners initialized');
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    logger.info('app', 'Network came online');
    this.updateNetworkStatus({ isOnline: true });
    this.triggerSync();
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    logger.warn('app', 'Network went offline');
    this.updateNetworkStatus({ isOnline: false });
    this.pauseSync();
  }

  /**
   * Handle connection property changes
   */
  private handleConnectionChange(): void {
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    if (connection) {
      const updates = {
        connectionType: connection.type || 'unknown',
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
        saveData: connection.saveData || false,
      };

      logger.debug('app', 'Connection properties changed', updates);
      this.updateNetworkStatus(updates);

      // Trigger sync if connection improved
      if (this.networkStatus.isOnline && this.shouldTriggerSync(updates)) {
        this.triggerSync();
      }
    }
  }

  /**
   * Update network status and notify listeners
   */
  private updateNetworkStatus(updates: Partial<NetworkStatus>): void {
    const oldStatus = { ...this.networkStatus };
    this.networkStatus = {
      ...this.networkStatus,
      ...updates,
      lastChanged: new Date(),
    };

    // Notify listeners of status change
    this.connectionListeners.forEach(listener => {
      try {
        listener(this.networkStatus);
      } catch (error) {
        logger.error(
          'app',
          'Error in network status listener',
          error instanceof Error ? error : undefined
        );
      }
    });

    logger.debug('app', 'Network status updated', {
      old: oldStatus,
      new: this.networkStatus,
    });
  }

  /**
   * Check if we should trigger sync based on connection changes
   */
  private shouldTriggerSync(updates: Partial<NetworkStatus>): boolean {
    // Trigger sync if:
    // 1. Connection type improved (e.g., cellular to wifi)
    // 2. Effective type improved (e.g., 3g to 4g)
    // 3. Downlink speed increased significantly

    const connectionTypeOrder = {
      ethernet: 4,
      wifi: 3,
      cellular: 2,
      unknown: 1,
    };
    const effectiveTypeOrder = {
      '5g': 5,
      '4g': 4,
      '3g': 3,
      '2g': 2,
      unknown: 1,
    };

    const oldConnectionRank =
      connectionTypeOrder[
        this.networkStatus.connectionType as keyof typeof connectionTypeOrder
      ] || 1;
    const newConnectionRank =
      connectionTypeOrder[
        updates.connectionType as keyof typeof connectionTypeOrder
      ] || oldConnectionRank;

    const oldEffectiveRank =
      effectiveTypeOrder[
        this.networkStatus.effectiveType as keyof typeof effectiveTypeOrder
      ] || 1;
    const newEffectiveRank =
      effectiveTypeOrder[
        updates.effectiveType as keyof typeof effectiveTypeOrder
      ] || oldEffectiveRank;

    const downlinkImproved =
      (updates.downlink || 0) > this.networkStatus.downlink * 1.5;

    return (
      newConnectionRank > oldConnectionRank ||
      newEffectiveRank > oldEffectiveRank ||
      downlinkImproved
    );
  }

  /**
   * Periodically check connectivity with a ping
   */
  private async checkConnectivity(): Promise<void> {
    try {
      // Simple connectivity check using a small image
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000),
      });

      const isOnline = response.ok;

      if (isOnline !== this.networkStatus.isOnline) {
        if (isOnline) {
          this.handleOnline();
        } else {
          this.handleOffline();
        }
      }
    } catch (error) {
      // If ping fails but navigator says we're online, we might have connectivity issues
      if (this.networkStatus.isOnline) {
        logger.warn(
          'app',
          'Connectivity check failed despite navigator.onLine = true'
        );
        this.updateNetworkStatus({ isOnline: false });
      }
    }
  }

  /**
   * Trigger sync when network is available
   */
  private async triggerSync(): Promise<void> {
    if (!this.networkStatus.isOnline) {
      logger.debug('app', 'Skipping sync - network offline');
      return;
    }

    try {
      logger.info('app', 'Triggering sync due to network availability');
      const result = await syncManager.sync();

      if (result.completed > 0 || result.failed > 0 || result.conflicts > 0) {
        logger.info('app', 'Network-triggered sync completed', result);
      }
    } catch (error) {
      logger.error(
        'app',
        'Network-triggered sync failed',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Pause sync when network is unavailable
   */
  private pauseSync(): void {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
    syncManager.stopAutoSync();
    logger.info('app', 'Sync paused due to network unavailability');
  }

  /**
   * Start queue processor for priority-based processing
   */
  private startQueueProcessor(): void {
    this.queueProcessor = setInterval(() => {
      if (!this.isProcessingQueue) {
        this.processActionQueue();
      }
    }, 5000); // Process queue every 5 seconds

    logger.info('app', 'Action queue processor started');
  }

  /**
   * Process offline action queue with priority-based processing
   */
  private async processActionQueue(): Promise<void> {
    if (this.isProcessingQueue || !this.networkStatus.isOnline) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      const pendingActions = await offlineStorageManager.getPendingActions();

      if (pendingActions.length === 0) {
        return;
      }

      // Group actions by priority
      const highPriorityActions = pendingActions.filter(
        action => action.priority === 'high'
      );
      const mediumPriorityActions = pendingActions.filter(
        action => action.priority === 'medium'
      );
      const lowPriorityActions = pendingActions.filter(
        action => action.priority === 'low'
      );

      // Process high priority actions first
      if (highPriorityActions.length > 0) {
        logger.debug(
          'app',
          `Processing ${highPriorityActions.length} high priority actions`
        );
        await this.processPriorityBatch(highPriorityActions, 'high');
      }

      // Process medium priority if we have good connectivity
      if (mediumPriorityActions.length > 0 && this.hasGoodConnectivity()) {
        logger.debug(
          'app',
          `Processing ${mediumPriorityActions.length} medium priority actions`
        );
        await this.processPriorityBatch(
          mediumPriorityActions.slice(0, 5),
          'medium'
        );
      }

      // Process low priority only if we have excellent connectivity and no higher priority items
      if (
        lowPriorityActions.length > 0 &&
        this.hasExcellentConnectivity() &&
        highPriorityActions.length === 0 &&
        mediumPriorityActions.length === 0
      ) {
        logger.debug(
          'app',
          `Processing ${Math.min(lowPriorityActions.length, 3)} low priority actions`
        );
        await this.processPriorityBatch(lowPriorityActions.slice(0, 3), 'low');
      }
    } catch (error) {
      logger.error(
        'app',
        'Error processing action queue',
        error instanceof Error ? error : undefined
      );
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Process a batch of actions for a specific priority
   */
  private async processPriorityBatch(
    actions: any[],
    priority: string
  ): Promise<void> {
    logger.info(
      'app',
      `Processing ${actions.length} ${priority} priority actions`
    );

    // For now, delegate to sync manager
    // In a more sophisticated implementation, you might process these directly
    try {
      await syncManager.sync();
    } catch (error) {
      logger.error(
        'app',
        `Failed to process ${priority} priority batch`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Check if we have good connectivity for medium priority actions
   */
  private hasGoodConnectivity(): boolean {
    return (
      this.networkStatus.isOnline &&
      (this.networkStatus.connectionType === 'wifi' ||
        this.networkStatus.connectionType === 'ethernet' ||
        (this.networkStatus.connectionType === 'cellular' &&
          ['4g', '5g'].includes(this.networkStatus.effectiveType)))
    );
  }

  /**
   * Check if we have excellent connectivity for low priority actions
   */
  private hasExcellentConnectivity(): boolean {
    return (
      this.networkStatus.isOnline &&
      (this.networkStatus.connectionType === 'wifi' ||
        this.networkStatus.connectionType === 'ethernet') &&
      this.networkStatus.downlink > 2 && // > 2 Mbps
      this.networkStatus.rtt < 100
    ); // < 100ms
  }

  /**
   * Get current network status
   */
  public getNetworkStatus(): NetworkStatus {
    return { ...this.networkStatus };
  }

  /**
   * Subscribe to network status changes
   */
  public onNetworkStatusChange(
    callback: (status: NetworkStatus) => void
  ): () => void {
    this.connectionListeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.connectionListeners.delete(callback);
    };
  }

  /**
   * Get action queue statistics
   */
  public async getQueueStats(): Promise<QueueStats> {
    const pendingActions = await offlineStorageManager.getPendingActions();
    const failedActions = await offlineStorageManager.getAll('offlineActions', {
      syncStatus: 'failed',
    });

    const stats = pendingActions.reduce(
      (acc, action) => {
        acc[
          (action as any).priority as keyof Pick<
            QueueStats,
            'high' | 'medium' | 'low'
          >
        ]++;
        return acc;
      },
      { high: 0, medium: 0, low: 0 }
    );

    return {
      total: pendingActions.length,
      high: stats.high,
      medium: stats.medium,
      low: stats.low,
      processing: this.isProcessingQueue ? 1 : 0,
      failed: failedActions.length,
    };
  }

  /**
   * Force queue processing (for manual trigger)
   */
  public async forceProcessQueue(): Promise<void> {
    if (this.isProcessingQueue) {
      logger.warn('app', 'Queue processing already in progress');
      return;
    }

    logger.info('app', 'Force processing action queue');
    await this.processActionQueue();
  }

  /**
   * Clear failed actions from queue
   */
  public async clearFailedActions(): Promise<number> {
    const failedActions = await offlineStorageManager.getAll('offlineActions', {
      syncStatus: 'failed',
    });

    let cleared = 0;
    for (const action of failedActions) {
      const success = await offlineStorageManager.delete(
        'offlineActions',
        (action as any).id
      );
      if (success) {
        cleared++;
      }
    }

    logger.info('app', `Cleared ${cleared} failed actions from queue`);
    return cleared;
  }

  /**
   * Set network detection sensitivity
   */
  public setDetectionSensitivity(level: 'high' | 'medium' | 'low'): void {
    // Adjust check intervals based on sensitivity
    const intervals = {
      high: 10000, // 10 seconds
      medium: 30000, // 30 seconds
      low: 60000, // 60 seconds
    };

    // Clear existing interval
    const existingInterval = setInterval(() => {}, 0);
    clearInterval(existingInterval);

    // Set new interval
    setInterval(() => {
      this.checkConnectivity();
    }, intervals[level]);

    logger.info('app', `Network detection sensitivity set to ${level}`, {
      interval: intervals[level],
    });
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    // Use stored bound references so removal actually works
    window.removeEventListener('online', this.boundHandleOnline);
    window.removeEventListener('offline', this.boundHandleOffline);

    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;
    if (connection) {
      connection.removeEventListener(
        'change',
        this.boundHandleConnectionChange
      );
    }

    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }

    if (this.queueProcessor) {
      clearInterval(this.queueProcessor);
    }

    if (this.connectivityCheckInterval) {
      clearInterval(this.connectivityCheckInterval);
    }

    this.connectionListeners.clear();

    logger.info('app', 'NetworkManager cleaned up');
  }
}

// Export singleton instance
export const networkManager = NetworkManager.getInstance();
