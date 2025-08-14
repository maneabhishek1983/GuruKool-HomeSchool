/**
 * Offline Storage Manager using IndexedDB
 * Provides persistent local storage for offline-first architecture
 */

import { logger } from './logging.service';
import { SessionRecord, User, AIInsight } from '@/types';

export interface StoredData {
  id: string;
  data: any;
  timestamp: number;
  version: number;
  syncStatus: 'pending' | 'synced' | 'conflict' | 'failed';
  priority: 'high' | 'medium' | 'low';
}

export interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'session' | 'user' | 'insight' | 'timesheet';
  data: any;
  timestamp: number;
  priority: 'high' | 'medium' | 'low';
  retryCount: number;
  maxRetries: number;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface StorageConfig {
  dbName: string;
  version: number;
  stores: {
    name: string;
    keyPath: string;
    indexes?: { name: string; keyPath: string; unique?: boolean }[];
  }[];
}

export class OfflineStorageManager {
  private static instance: OfflineStorageManager;
  private db: IDBDatabase | null = null;
  private config: StorageConfig;

  private constructor() {
    this.config = {
      dbName: 'GuruKoolOfflineDB',
      version: 1,
      stores: [
        {
          name: 'sessions',
          keyPath: 'id',
          indexes: [
            { name: 'teacherId', keyPath: 'teacherId' },
            { name: 'studentId', keyPath: 'studentId' },
            { name: 'parentId', keyPath: 'parentId' },
            { name: 'syncStatus', keyPath: 'syncStatus' },
            { name: 'timestamp', keyPath: 'timestamp' }
          ]
        },
        {
          name: 'users',
          keyPath: 'id',
          indexes: [
            { name: 'role', keyPath: 'role' },
            { name: 'syncStatus', keyPath: 'syncStatus' }
          ]
        },
        {
          name: 'offlineActions',
          keyPath: 'id',
          indexes: [
            { name: 'timestamp', keyPath: 'timestamp' },
            { name: 'priority', keyPath: 'priority' },
            { name: 'syncStatus', keyPath: 'syncStatus' },
            { name: 'entity', keyPath: 'entity' }
          ]
        },
        {
          name: 'aiInsights',
          keyPath: 'id',
          indexes: [
            { name: 'sessionId', keyPath: 'sessionId' },
            { name: 'type', keyPath: 'type' },
            { name: 'syncStatus', keyPath: 'syncStatus' }
          ]
        },
        {
          name: 'metadata',
          keyPath: 'key'
        }
      ]
    };
  }

  public static getInstance(): OfflineStorageManager {
    if (!OfflineStorageManager.instance) {
      OfflineStorageManager.instance = new OfflineStorageManager();
    }
    return OfflineStorageManager.instance;
  }

  /**
   * Initialize the IndexedDB database
   */
  public async initialize(): Promise<boolean> {
    try {
      if (this.db) {
        return true;
      }

      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.config.dbName, this.config.version);

        request.onerror = () => {
          logger.error('app', 'Failed to open IndexedDB database', request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          this.db = request.result;
          logger.info('app', 'IndexedDB database initialized successfully');
          resolve(true);
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          
          // Create object stores and indexes
          this.config.stores.forEach(storeConfig => {
            if (!db.objectStoreNames.contains(storeConfig.name)) {
              const store = db.createObjectStore(storeConfig.name, { keyPath: storeConfig.keyPath });
              
              // Create indexes
              if (storeConfig.indexes) {
                storeConfig.indexes.forEach(index => {
                  store.createIndex(index.name, index.keyPath, { unique: index.unique || false });
                });
              }
            }
          });

          logger.info('app', 'IndexedDB database schema upgraded');
        };
      });
    } catch (error) {
      logger.error('app', 'Failed to initialize offline storage', error instanceof Error ? error : undefined);
      return false;
    }
  }

  /**
   * Store data with sync metadata
   */
  public async store<T>(storeName: string, data: T, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<boolean> {
    try {
      await this.ensureInitialized();

      const storedData: StoredData = {
        id: (data as any).id || this.generateId(),
        data,
        timestamp: Date.now(),
        version: 1,
        syncStatus: 'pending',
        priority
      };

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const request = store.put(storedData);
        
        request.onsuccess = () => {
          logger.debug('app', `Data stored in ${storeName}`, { id: storedData.id });
          resolve(true);
        };
        
        request.onerror = () => {
          logger.error('app', `Failed to store data in ${storeName}`, request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      logger.error('app', `Failed to store data in ${storeName}`, error instanceof Error ? error : undefined);
      return false;
    }
  }

  /**
   * Retrieve data by ID
   */
  public async get<T>(storeName: string, id: string): Promise<T | null> {
    try {
      await this.ensureInitialized();

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        
        const request = store.get(id);
        
        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            resolve(result.data as T);
          } else {
            resolve(null);
          }
        };
        
        request.onerror = () => {
          logger.error('app', `Failed to get data from ${storeName}`, request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      logger.error('app', `Failed to get data from ${storeName}`, error instanceof Error ? error : undefined);
      return null;
    }
  }

  /**
   * Retrieve multiple items by criteria
   */
  public async getAll<T>(storeName: string, criteria?: { index?: string; value?: any; syncStatus?: string }): Promise<T[]> {
    try {
      await this.ensureInitialized();

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        
        let request: IDBRequest;
        
        if (criteria?.index && criteria?.value) {
          const index = store.index(criteria.index);
          request = index.getAll(criteria.value);
        } else {
          request = store.getAll();
        }
        
        request.onsuccess = () => {
          let results = request.result as StoredData[];
          
          // Filter by sync status if specified
          if (criteria?.syncStatus) {
            results = results.filter(item => item.syncStatus === criteria.syncStatus);
          }
          
          const data = results.map(item => item.data as T);
          resolve(data);
        };
        
        request.onerror = () => {
          logger.error('app', `Failed to get all data from ${storeName}`, request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      logger.error('app', `Failed to get all data from ${storeName}`, error instanceof Error ? error : undefined);
      return [];
    }
  }

  /**
   * Update data with conflict detection
   */
  public async update<T>(storeName: string, id: string, data: Partial<T>, currentVersion: number): Promise<{ success: boolean; conflict: boolean }> {
    try {
      await this.ensureInitialized();

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        // First, get the current data to check version
        const getRequest = store.get(id);
        
        getRequest.onsuccess = () => {
          const current = getRequest.result as StoredData;
          
          if (!current) {
            resolve({ success: false, conflict: false });
            return;
          }
          
          // Check for version conflict
          if (current.version > currentVersion) {
            logger.warn('app', `Version conflict detected for ${id}`, { current: current.version, provided: currentVersion });
            resolve({ success: false, conflict: true });
            return;
          }
          
          // Update the data
          const updatedData: StoredData = {
            ...current,
            data: { ...current.data, ...data },
            timestamp: Date.now(),
            version: current.version + 1,
            syncStatus: 'pending'
          };
          
          const putRequest = store.put(updatedData);
          
          putRequest.onsuccess = () => {
            logger.debug('app', `Data updated in ${storeName}`, { id });
            resolve({ success: true, conflict: false });
          };
          
          putRequest.onerror = () => {
            logger.error('app', `Failed to update data in ${storeName}`, putRequest.error);
            reject(putRequest.error);
          };
        };
        
        getRequest.onerror = () => {
          logger.error('app', `Failed to get current data for update in ${storeName}`, getRequest.error);
          reject(getRequest.error);
        };
      });
    } catch (error) {
      logger.error('app', `Failed to update data in ${storeName}`, error instanceof Error ? error : undefined);
      return { success: false, conflict: false };
    }
  }

  /**
   * Delete data
   */
  public async delete(storeName: string, id: string): Promise<boolean> {
    try {
      await this.ensureInitialized();

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const request = store.delete(id);
        
        request.onsuccess = () => {
          logger.debug('app', `Data deleted from ${storeName}`, { id });
          resolve(true);
        };
        
        request.onerror = () => {
          logger.error('app', `Failed to delete data from ${storeName}`, request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      logger.error('app', `Failed to delete data from ${storeName}`, error instanceof Error ? error : undefined);
      return false;
    }
  }

  /**
   * Add offline action to queue
   */
  public async queueOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount' | 'syncStatus'>): Promise<boolean> {
    const offlineAction: OfflineAction = {
      ...action,
      id: this.generateId(),
      timestamp: Date.now(),
      retryCount: 0,
      syncStatus: 'pending'
    };

    return this.store('offlineActions', offlineAction, action.priority);
  }

  /**
   * Get pending offline actions sorted by priority and timestamp
   */
  public async getPendingActions(): Promise<OfflineAction[]> {
    const actions = await this.getAll<OfflineAction>('offlineActions', { syncStatus: 'pending' });
    
    // Sort by priority (high > medium > low) then by timestamp (oldest first)
    return actions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Mark sync status for data
   */
  public async markSyncStatus(storeName: string, id: string, status: 'pending' | 'synced' | 'conflict' | 'failed'): Promise<boolean> {
    try {
      await this.ensureInitialized();

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const getRequest = store.get(id);
        
        getRequest.onsuccess = () => {
          const current = getRequest.result as StoredData;
          
          if (!current) {
            resolve(false);
            return;
          }
          
          current.syncStatus = status;
          current.timestamp = Date.now();
          
          const putRequest = store.put(current);
          
          putRequest.onsuccess = () => {
            logger.debug('app', `Sync status updated for ${id}`, { status });
            resolve(true);
          };
          
          putRequest.onerror = () => {
            logger.error('app', `Failed to update sync status for ${id}`, putRequest.error);
            reject(putRequest.error);
          };
        };
        
        getRequest.onerror = () => {
          logger.error('app', `Failed to get data for sync status update`, getRequest.error);
          reject(getRequest.error);
        };
      });
    } catch (error) {
      logger.error('app', `Failed to mark sync status`, error instanceof Error ? error : undefined);
      return false;
    }
  }

  /**
   * Clear all data (useful for logout or reset)
   */
  public async clearAll(): Promise<boolean> {
    try {
      await this.ensureInitialized();

      const storeNames = this.config.stores.map(store => store.name);
      
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(storeNames, 'readwrite');
        
        let completed = 0;
        const total = storeNames.length;
        
        storeNames.forEach(storeName => {
          const store = transaction.objectStore(storeName);
          const request = store.clear();
          
          request.onsuccess = () => {
            completed++;
            if (completed === total) {
              logger.info('app', 'All offline data cleared');
              resolve(true);
            }
          };
          
          request.onerror = () => {
            logger.error('app', `Failed to clear ${storeName}`, request.error);
            reject(request.error);
          };
        });
      });
    } catch (error) {
      logger.error('app', 'Failed to clear all offline data', error instanceof Error ? error : undefined);
      return false;
    }
  }

  /**
   * Get storage statistics
   */
  public async getStorageStats(): Promise<{ [storeName: string]: { total: number; pending: number; synced: number; conflicts: number } }> {
    const stats: { [storeName: string]: { total: number; pending: number; synced: number; conflicts: number } } = {};

    for (const storeConfig of this.config.stores) {
      if (storeConfig.name === 'metadata') continue;

      const allData = await this.getAll<any>(storeConfig.name);
      const pendingData = await this.getAll<any>(storeConfig.name, { syncStatus: 'pending' });
      const syncedData = await this.getAll<any>(storeConfig.name, { syncStatus: 'synced' });
      const conflictData = await this.getAll<any>(storeConfig.name, { syncStatus: 'conflict' });

      stats[storeConfig.name] = {
        total: allData.length,
        pending: pendingData.length,
        synced: syncedData.length,
        conflicts: conflictData.length
      };
    }

    return stats;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }
  }

  private generateId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const offlineStorageManager = OfflineStorageManager.getInstance();