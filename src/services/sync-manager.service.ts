/**
 * Sync Manager with Intelligent Conflict Resolution
 * Handles data synchronization between offline storage and server
 */

import { logger } from './logging.service';
import { offlineStorageManager, OfflineAction } from './offline-storage.service';
import { databaseService } from './database.service';
import { SessionRecord, User, AIInsight } from '@/types';

export interface SyncResult {
  success: boolean;
  action: OfflineAction;
  error?: string;
  conflict?: boolean;
  resolution?: 'server_wins' | 'client_wins' | 'merged' | 'manual_required';
}

export interface ConflictResolution {
  strategy: 'server_wins' | 'client_wins' | 'merge' | 'manual';
  customMerger?: (serverData: any, clientData: any) => any;
}

export interface SyncConfig {
  batchSize: number;
  maxRetries: number;
  retryDelay: number;
  conflictResolution: {
    [entityType: string]: ConflictResolution;
  };
  autoSyncEnabled: boolean;
  autoSyncInterval: number;
}

export class SyncManager {
  private static instance: SyncManager;
  private config: SyncConfig;
  private isSyncing = false;
  private syncTimer: NodeJS.Timeout | null = null;
  private retryQueue: Set<string> = new Set();

  private constructor() {
    this.config = {
      batchSize: 10,
      maxRetries: 3,
      retryDelay: 5000, // 5 seconds
      conflictResolution: {
        session: {
          strategy: 'merge',
          customMerger: this.mergeSessionData.bind(this)
        },
        user: {
          strategy: 'server_wins'
        },
        insight: {
          strategy: 'client_wins'
        },
        timesheet: {
          strategy: 'merge',
          customMerger: this.mergeTimesheetData.bind(this)
        }
      },
      autoSyncEnabled: true,
      autoSyncInterval: 30000 // 30 seconds
    };
  }

  public static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  /**
   * Initialize sync manager
   */
  public async initialize(): Promise<void> {
    await offlineStorageManager.initialize();
    
    if (this.config.autoSyncEnabled) {
      this.startAutoSync();
    }

    logger.info('app', 'SyncManager initialized', { 
      autoSync: this.config.autoSyncEnabled,
      interval: this.config.autoSyncInterval 
    });
  }

  /**
   * Start automatic sync process
   */
  public startAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.sync();
      }
    }, this.config.autoSyncInterval);

    logger.info('app', 'Auto-sync started');
  }

  /**
   * Stop automatic sync process
   */
  public stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    logger.info('app', 'Auto-sync stopped');
  }

  /**
   * Manual sync trigger
   */
  public async sync(): Promise<{ completed: number; failed: number; conflicts: number }> {
    if (this.isSyncing) {
      logger.warn('app', 'Sync already in progress');
      return { completed: 0, failed: 0, conflicts: 0 };
    }

    this.isSyncing = true;
    logger.info('app', 'Starting sync process');

    let completed = 0;
    let failed = 0;
    let conflicts = 0;

    try {
      // Get pending actions from offline storage
      const pendingActions = await offlineStorageManager.getPendingActions();
      
      if (pendingActions.length === 0) {
        logger.debug('app', 'No pending actions to sync');
        return { completed: 0, failed: 0, conflicts: 0 };
      }

      // Process actions in batches
      for (let i = 0; i < pendingActions.length; i += this.config.batchSize) {
        const batch = pendingActions.slice(i, i + this.config.batchSize);
        const batchResults = await this.processBatch(batch);

        batchResults.forEach(result => {
          if (result.success) {
            completed++;
          } else if (result.conflict) {
            conflicts++;
          } else {
            failed++;
          }
        });
      }

      logger.info('app', 'Sync completed', { completed, failed, conflicts });
    } catch (error) {
      logger.error('app', 'Sync failed', error instanceof Error ? error : undefined);
      failed++;
    } finally {
      this.isSyncing = false;
    }

    return { completed, failed, conflicts };
  }

  /**
   * Process a batch of offline actions
   */
  private async processBatch(actions: OfflineAction[]): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    for (const action of actions) {
      try {
        const result = await this.processAction(action);
        results.push(result);

        // Update action status based on result
        if (result.success) {
          await offlineStorageManager.markSyncStatus('offlineActions', action.id, 'synced');
        } else if (result.conflict) {
          await this.handleConflict(action, result);
        } else {
          await this.handleFailure(action, result);
        }
      } catch (error) {
        logger.error('app', `Failed to process action ${action.id}`, error instanceof Error ? error : undefined);
        results.push({
          success: false,
          action,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Process individual offline action
   */
  private async processAction(action: OfflineAction): Promise<SyncResult> {
    logger.debug('app', `Processing action ${action.type} for ${action.entity}`, { id: action.id });

    try {
      switch (action.type) {
        case 'create':
          return await this.processCreate(action);
        case 'update':
          return await this.processUpdate(action);
        case 'delete':
          return await this.processDelete(action);
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }
    } catch (error) {
      return {
        success: false,
        action,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process create action
   */
  private async processCreate(action: OfflineAction): Promise<SyncResult> {
    const { entity, data } = action;

    try {
      let result;
      
      switch (entity) {
        case 'session':
          result = await databaseService.createSession(data as SessionRecord);
          break;
        case 'user':
          result = await databaseService.createUser(data as User);
          break;
        case 'insight':
          // Assume we have a method for creating insights
          result = await this.createInsight(data as AIInsight);
          break;
        default:
          throw new Error(`Unsupported entity type for create: ${entity}`);
      }

      if (result) {
        // Update local storage with server-generated data (like IDs)
        await offlineStorageManager.store(entity + 's', result, 'medium');
        await offlineStorageManager.markSyncStatus(entity + 's', result.id, 'synced');
        
        return { success: true, action };
      } else {
        return { success: false, action, error: 'Create operation failed' };
      }
    } catch (error) {
      return { 
        success: false, 
        action, 
        error: error instanceof Error ? error.message : 'Create failed' 
      };
    }
  }

  /**
   * Process update action
   */
  private async processUpdate(action: OfflineAction): Promise<SyncResult> {
    const { entity, data } = action;

    try {
      // First, get the latest server version
      let serverData;
      
      switch (entity) {
        case 'session':
          serverData = await databaseService.getSessionById(data.id);
          break;
        case 'user':
          serverData = await databaseService.getUserById(data.id);
          break;
        default:
          throw new Error(`Unsupported entity type for update: ${entity}`);
      }

      if (!serverData) {
        return { success: false, action, error: 'Entity not found on server' };
      }

      // Check for conflicts (simplified version comparison)
      const localData = await offlineStorageManager.get(entity + 's', data.id);
      const conflict = this.detectConflict(serverData, localData, data);

      if (conflict) {
        return await this.resolveConflict(action, serverData, data);
      }

      // No conflict, proceed with update
      let result;
      
      switch (entity) {
        case 'session':
          result = await databaseService.updateSession(data.id, data);
          break;
        case 'user':
          result = await databaseService.updateUser(data.id, data);
          break;
        default:
          throw new Error(`Unsupported entity type for update: ${entity}`);
      }

      if (result) {
        await offlineStorageManager.store(entity + 's', result, 'medium');
        await offlineStorageManager.markSyncStatus(entity + 's', result.id, 'synced');
        
        return { success: true, action };
      } else {
        return { success: false, action, error: 'Update operation failed' };
      }
    } catch (error) {
      return { 
        success: false, 
        action, 
        error: error instanceof Error ? error.message : 'Update failed' 
      };
    }
  }

  /**
   * Process delete action
   */
  private async processDelete(action: OfflineAction): Promise<SyncResult> {
    const { entity, data } = action;

    try {
      let result;
      
      switch (entity) {
        case 'session':
          result = await databaseService.deleteSession(data.id);
          break;
        case 'user':
          result = await databaseService.deleteUser(data.id);
          break;
        default:
          throw new Error(`Unsupported entity type for delete: ${entity}`);
      }

      if (result) {
        await offlineStorageManager.delete(entity + 's', data.id);
        return { success: true, action };
      } else {
        return { success: false, action, error: 'Delete operation failed' };
      }
    } catch (error) {
      return { 
        success: false, 
        action, 
        error: error instanceof Error ? error.message : 'Delete failed' 
      };
    }
  }

  /**
   * Detect if there's a conflict between server and local data
   */
  private detectConflict(serverData: any, localData: any, pendingData: any): boolean {
    if (!serverData || !localData) return false;

    // Simple timestamp-based conflict detection
    // In a real implementation, you'd use version numbers or more sophisticated comparison
    const serverTimestamp = new Date(serverData.updatedAt || serverData.createdAt).getTime();
    const localTimestamp = new Date(localData.timestamp || 0).getTime();

    return serverTimestamp > localTimestamp;
  }

  /**
   * Resolve conflict using configured strategy
   */
  private async resolveConflict(action: OfflineAction, serverData: any, clientData: any): Promise<SyncResult> {
    const resolution = this.config.conflictResolution[action.entity];
    
    if (!resolution) {
      return {
        success: false,
        action,
        conflict: true,
        error: 'No conflict resolution strategy defined',
        resolution: 'manual_required'
      };
    }

    logger.info('app', `Resolving conflict for ${action.entity} using ${resolution.strategy}`, { id: clientData.id });

    try {
      let resolvedData;

      switch (resolution.strategy) {
        case 'server_wins':
          resolvedData = serverData;
          break;
          
        case 'client_wins':
          resolvedData = clientData;
          // Update server with client data
          await this.updateServer(action.entity, clientData);
          break;
          
        case 'merge':
          if (resolution.customMerger) {
            resolvedData = resolution.customMerger(serverData, clientData);
            // Update server with merged data
            await this.updateServer(action.entity, resolvedData);
          } else {
            // Simple merge strategy
            resolvedData = { ...serverData, ...clientData };
            await this.updateServer(action.entity, resolvedData);
          }
          break;
          
        case 'manual':
          return {
            success: false,
            action,
            conflict: true,
            resolution: 'manual_required',
            error: 'Manual conflict resolution required'
          };
      }

      // Update local storage with resolved data
      await offlineStorageManager.store(action.entity + 's', resolvedData, 'high');
      await offlineStorageManager.markSyncStatus(action.entity + 's', resolvedData.id, 'synced');

      return {
        success: true,
        action,
        conflict: true,
        resolution: resolution.strategy
      };
    } catch (error) {
      return {
        success: false,
        action,
        conflict: true,
        error: error instanceof Error ? error.message : 'Conflict resolution failed',
        resolution: 'manual_required'
      };
    }
  }

  /**
   * Custom merger for session data
   */
  private mergeSessionData(serverData: SessionRecord, clientData: SessionRecord): SessionRecord {
    return {
      ...serverData,
      // Client wins for notes and status changes
      notes: clientData.notes || serverData.notes,
      status: clientData.status || serverData.status,
      actualStart: clientData.actualStart || serverData.actualStart,
      actualEnd: clientData.actualEnd || serverData.actualEnd,
      // Merge AI insights
      aiInsights: [
        ...serverData.aiInsights,
        ...clientData.aiInsights.filter(insight => 
          !serverData.aiInsights.some(existing => existing.id === insight.id)
        )
      ],
      // Server wins for core scheduling data
      scheduledStart: serverData.scheduledStart,
      scheduledEnd: serverData.scheduledEnd,
      location: serverData.location,
      // Update timestamp
      updatedAt: new Date()
    };
  }

  /**
   * Custom merger for timesheet data
   */
  private mergeTimesheetData(serverData: any, clientData: any): any {
    return {
      ...serverData,
      // Client wins for time tracking data
      actualHours: clientData.actualHours || serverData.actualHours,
      breakDuration: clientData.breakDuration || serverData.breakDuration,
      notes: clientData.notes || serverData.notes,
      // Server wins for billing data
      hourlyRate: serverData.hourlyRate,
      totalAmount: serverData.totalAmount,
      // Update timestamp
      updatedAt: new Date()
    };
  }

  /**
   * Update server with data
   */
  private async updateServer(entity: string, data: any): Promise<void> {
    switch (entity) {
      case 'session':
        await databaseService.updateSession(data.id, data);
        break;
      case 'user':
        await databaseService.updateUser(data.id, data);
        break;
      default:
        throw new Error(`Unsupported entity type for server update: ${entity}`);
    }
  }

  /**
   * Handle sync failure
   */
  private async handleFailure(action: OfflineAction, result: SyncResult): Promise<void> {
    action.retryCount++;

    if (action.retryCount >= action.maxRetries) {
      logger.error('app', `Action ${action.id} exceeded max retries`, { retryCount: action.retryCount });
      await offlineStorageManager.markSyncStatus('offlineActions', action.id, 'failed');
    } else {
      logger.warn('app', `Action ${action.id} failed, will retry`, { retryCount: action.retryCount });
      // Schedule retry
      setTimeout(() => {
        this.retryAction(action);
      }, this.config.retryDelay * action.retryCount); // Exponential backoff
    }
  }

  /**
   * Handle conflict that couldn't be resolved
   */
  private async handleConflict(action: OfflineAction, result: SyncResult): Promise<void> {
    logger.warn('app', `Unresolved conflict for action ${action.id}`, result);
    await offlineStorageManager.markSyncStatus('offlineActions', action.id, 'conflict');
    
    // In a real implementation, you might:
    // 1. Notify the user about the conflict
    // 2. Store conflict details for manual resolution
    // 3. Trigger a conflict resolution UI
  }

  /**
   * Retry failed action
   */
  private async retryAction(action: OfflineAction): Promise<void> {
    if (this.retryQueue.has(action.id)) {
      return; // Already queued for retry
    }

    this.retryQueue.add(action.id);

    try {
      const result = await this.processAction(action);
      
      if (result.success) {
        await offlineStorageManager.markSyncStatus('offlineActions', action.id, 'synced');
      } else {
        await this.handleFailure(action, result);
      }
    } catch (error) {
      logger.error('app', `Retry failed for action ${action.id}`, error instanceof Error ? error : undefined);
      await this.handleFailure(action, { success: false, action, error: 'Retry failed' });
    } finally {
      this.retryQueue.delete(action.id);
    }
  }

  /**
   * Get sync statistics
   */
  public async getSyncStats(): Promise<{
    pendingActions: number;
    syncedActions: number;
    failedActions: number;
    conflictActions: number;
    storageStats: any;
  }> {
    const [pendingActions, syncedActions, failedActions, conflictActions, storageStats] = await Promise.all([
      offlineStorageManager.getAll('offlineActions', { syncStatus: 'pending' }),
      offlineStorageManager.getAll('offlineActions', { syncStatus: 'synced' }),
      offlineStorageManager.getAll('offlineActions', { syncStatus: 'failed' }),
      offlineStorageManager.getAll('offlineActions', { syncStatus: 'conflict' }),
      offlineStorageManager.getStorageStats()
    ]);

    return {
      pendingActions: pendingActions.length,
      syncedActions: syncedActions.length,
      failedActions: failedActions.length,
      conflictActions: conflictActions.length,
      storageStats
    };
  }

  /**
   * Force sync specific entity
   */
  public async forceSyncEntity(entity: string, id: string): Promise<SyncResult> {
    const data = await offlineStorageManager.get(entity + 's', id);
    
    if (!data) {
      return {
        success: false,
        action: { id: '', type: 'update', entity, data: {}, timestamp: Date.now(), priority: 'high', retryCount: 0, maxRetries: 3, syncStatus: 'pending' },
        error: 'Entity not found in offline storage'
      };
    }

    const action: OfflineAction = {
      id: `force_sync_${Date.now()}`,
      type: 'update',
      entity,
      data,
      timestamp: Date.now(),
      priority: 'high',
      retryCount: 0,
      maxRetries: 3,
      syncStatus: 'pending'
    };

    return await this.processAction(action);
  }

  /**
   * Placeholder for creating insights (implement based on your needs)
   */
  private async createInsight(insight: AIInsight): Promise<AIInsight | null> {
    // This would typically call your insights API endpoint
    // For now, just return the insight with a server ID
    return { ...insight, id: `server_${insight.id}` };
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.stopAutoSync();
    this.retryQueue.clear();
    logger.info('app', 'SyncManager cleaned up');
  }
}

// Export singleton instance
export const syncManager = SyncManager.getInstance();