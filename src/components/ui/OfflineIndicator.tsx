/**
 * Offline Indicator Component
 * Shows network status and sync progress with real-time updates
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { networkManager } from '@/services/network-manager.service';
import { syncManager } from '@/services/sync-manager.service';
import { offlineStorageManager } from '@/services/offline-storage.service';

interface OfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

interface SyncStats {
  pendingActions: number;
  syncedActions: number;
  failedActions: number;
  conflictActions: number;
  storageStats: any;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className = '',
  showDetails = false,
  position = 'top-right'
}) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    // Subscribe to network status changes
    const unsubscribeNetwork = networkManager.onNetworkStatusChange((status) => {
      setIsOnline(status.isOnline);
    });

    // Initialize network status
    const networkStatus = networkManager.getNetworkStatus();
    setIsOnline(networkStatus.isOnline);

    // Load initial sync stats
    loadSyncStats();

    // Set up periodic stats refresh
    const statsInterval = setInterval(loadSyncStats, 5000);

    // Listen for sync events (if available)
    const syncInterval = setInterval(async () => {
      if (networkStatus.isOnline && syncStats?.pendingActions && syncStats.pendingActions > 0) {
        setIsSyncing(true);
        try {
          await syncManager.sync();
          setLastSyncTime(new Date());
        } catch (error) {
          console.error('Sync failed:', error);
        } finally {
          setIsSyncing(false);
          loadSyncStats();
        }
      }
    }, 10000);

    return () => {
      unsubscribeNetwork();
      clearInterval(statsInterval);
      clearInterval(syncInterval);
    };
  }, [syncStats?.pendingActions]);

  const loadSyncStats = async () => {
    try {
      const stats = await syncManager.getSyncStats();
      setSyncStats(stats);
    } catch (error) {
      console.error('Failed to load sync stats:', error);
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500';
    if (isSyncing) return 'bg-yellow-500';
    if (syncStats?.pendingActions && syncStats.pendingActions > 0) return 'bg-orange-500';
    if (syncStats?.failedActions && syncStats.failedActions > 0) return 'bg-red-400';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isSyncing) return 'Syncing...';
    if (syncStats?.pendingActions && syncStats.pendingActions > 0) return `${syncStats.pendingActions} pending`;
    if (syncStats?.failedActions && syncStats.failedActions > 0) return `${syncStats.failedActions} failed`;
    return 'Online';
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  const forcSync = async () => {
    if (!isOnline) return;
    
    setIsSyncing(true);
    try {
      await syncManager.sync();
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsSyncing(false);
      loadSyncStats();
    }
  };

  return (
    <div className={`fixed z-50 ${getPositionClasses()} ${className}`}>
      <motion.div
        className="relative"
        onHoverStart={() => setShowTooltip(true)}
        onHoverEnd={() => setShowTooltip(false)}
      >
        {/* Status Indicator */}
        <motion.div
          className={`flex items-center space-x-2 px-3 py-2 rounded-full shadow-lg backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 cursor-pointer`}
          onClick={forcSync}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Status Dot */}
          <motion.div
            className={`w-3 h-3 rounded-full ${getStatusColor()}`}
            animate={isSyncing ? { scale: [1, 1.2, 1] } : {}}
            transition={{ repeat: isSyncing ? Infinity : 0, duration: 1 }}
          />
          
          {/* Status Text */}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {getStatusText()}
          </span>
        </motion.div>

        {/* Detailed Tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full mt-2 right-0 w-80 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700"
            >
              <div className="space-y-3">
                {/* Network Status */}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Network Status
                  </span>
                  <span className={`text-sm font-semibold ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                    {isOnline ? 'Connected' : 'Disconnected'}
                  </span>
                </div>

                {/* Sync Statistics */}
                {syncStats && (
                  <>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Sync Status
                      </h4>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Pending:</span>
                          <span className="font-medium">{syncStats.pendingActions}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Synced:</span>
                          <span className="font-medium text-green-600">{syncStats.syncedActions}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Failed:</span>
                          <span className="font-medium text-red-600">{syncStats.failedActions}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Conflicts:</span>
                          <span className="font-medium text-yellow-600">{syncStats.conflictActions}</span>
                        </div>
                      </div>
                    </div>

                    {/* Last Sync Time */}
                    {lastSyncTime && (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Last Sync:</span>
                          <span className="font-medium">
                            {lastSyncTime.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Storage Stats */}
                    {showDetails && syncStats.storageStats && (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Storage Usage
                        </h4>
                        <div className="space-y-1">
                          {Object.entries(syncStats.storageStats).map(([store, stats]: [string, any]) => (
                            <div key={store} className="flex justify-between text-xs">
                              <span className="text-gray-500 capitalize">{store}:</span>
                              <span className="font-medium">{stats.total} items</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Manual Sync Button */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <button
                    onClick={forcSync}
                    disabled={!isOnline || isSyncing}
                    className="w-full px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors duration-200"
                  >
                    {isSyncing ? 'Syncing...' : 'Force Sync'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Sync Progress Animation */}
      <AnimatePresence>
        {isSyncing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -inset-1 rounded-full"
          >
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-blue-500"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OfflineIndicator;