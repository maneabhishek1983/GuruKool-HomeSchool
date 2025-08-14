/**
 * Offline Notification Queue Component
 * Handles notification queuing and batch processing when offline
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { offlineStorageManager } from '@/services/offline-storage.service';
import { webSocketService } from '@/services/websocket.service';
import { networkManager } from '@/services/network-manager.service';

interface QueuedNotification {
  id: string;
  type: 'message' | 'session_update' | 'reminder' | 'alert';
  title: string;
  content: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  recipient: string;
  sender: string;
  data?: any;
  scheduledFor?: Date;
  expiresAt?: Date;
  deliveryStatus: 'queued' | 'sending' | 'sent' | 'failed' | 'expired';
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  lastAttempt?: Date;
}

interface OfflineNotificationQueueProps {
  userId: string;
  className?: string;
  autoProcess?: boolean;
}

export const OfflineNotificationQueue: React.FC<OfflineNotificationQueueProps> = ({
  userId,
  className = '',
  autoProcess = true
}) => {
  const [notifications, setNotifications] = useState<QueuedNotification[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStats, setProcessingStats] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    queued: 0
  });

  // Load queued notifications from storage
  const loadQueuedNotifications = useCallback(async () => {
    try {
      const stored = await offlineStorageManager.getAll<QueuedNotification>('notifications');
      const userNotifications = stored.filter(n => n.sender === userId || n.recipient === userId);
      setNotifications(userNotifications);
      
      // Update stats
      const stats = {
        total: userNotifications.length,
        sent: userNotifications.filter(n => n.deliveryStatus === 'sent').length,
        failed: userNotifications.filter(n => n.deliveryStatus === 'failed').length,
        queued: userNotifications.filter(n => n.deliveryStatus === 'queued').length,
      };
      setProcessingStats(stats);
    } catch (error) {
      console.error('Failed to load queued notifications:', error);
    }
  }, [userId]);

  // Queue new notification
  const queueNotification = useCallback(async (notification: Omit<QueuedNotification, 'id' | 'createdAt' | 'attempts' | 'deliveryStatus'>) => {
    try {
      const queuedNotification: QueuedNotification = {
        ...notification,
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        deliveryStatus: 'queued',
        attempts: 0,
        createdAt: new Date()
      };

      // Store in offline storage
      await offlineStorageManager.store('notifications', queuedNotification, notification.priority);

      // Update local state
      setNotifications(prev => [...prev, queuedNotification]);

      return queuedNotification.id;
    } catch (error) {
      console.error('Failed to queue notification:', error);
      throw error;
    }
  }, []);

  // Process queued notifications
  const processQueue = useCallback(async () => {
    if (!isOnline || isProcessing) {
      return;
    }

    const queuedNotifications = notifications.filter(n => 
      n.deliveryStatus === 'queued' && 
      n.attempts < n.maxAttempts &&
      (!n.expiresAt || new Date() < n.expiresAt) &&
      (!n.scheduledFor || new Date() >= n.scheduledFor)
    );

    if (queuedNotifications.length === 0) {
      return;
    }

    setIsProcessing(true);

    try {
      // Sort by priority and creation time
      const sortedNotifications = queuedNotifications.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) {
          return priorityDiff;
        }
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

      // Process in batches
      const batchSize = 5;
      for (let i = 0; i < sortedNotifications.length; i += batchSize) {
        const batch = sortedNotifications.slice(i, i + batchSize);
        await processBatch(batch);
      }

    } catch (error) {
      console.error('Queue processing failed:', error);
    } finally {
      setIsProcessing(false);
      await loadQueuedNotifications();
    }
  }, [isOnline, isProcessing, notifications, loadQueuedNotifications]);

  // Process batch of notifications
  const processBatch = async (batch: QueuedNotification[]) => {
    const results = await Promise.allSettled(
      batch.map(async (notification) => {
        try {
          // Update attempt count
          notification.attempts++;
          notification.lastAttempt = new Date();
          notification.deliveryStatus = 'sending';

          // Send via WebSocket if available
          if (webSocketService.isConnected()) {
            await webSocketService.sendRealtimeMessage({
              type: notification.type as any,
              from: notification.sender,
              to: notification.recipient,
              content: notification.content,
              priority: notification.priority,
              data: {
                title: notification.title,
                ...notification.data
              }
            });

            notification.deliveryStatus = 'sent';
          } else {
            throw new Error('WebSocket not connected');
          }

          // Update in storage
          await offlineStorageManager.store('notifications', notification, notification.priority);

        } catch (error) {
          console.error(`Failed to send notification ${notification.id}:`, error);
          
          if (notification.attempts >= notification.maxAttempts) {
            notification.deliveryStatus = 'failed';
          } else {
            notification.deliveryStatus = 'queued';
          }

          await offlineStorageManager.store('notifications', notification, notification.priority);
        }
      })
    );

    return results;
  };

  // Clear sent/failed notifications
  const clearProcessedNotifications = useCallback(async () => {
    try {
      const processedNotifications = notifications.filter(n => 
        n.deliveryStatus === 'sent' || n.deliveryStatus === 'failed'
      );

      for (const notification of processedNotifications) {
        await offlineStorageManager.delete('notifications', notification.id);
      }

      await loadQueuedNotifications();
    } catch (error) {
      console.error('Failed to clear processed notifications:', error);
    }
  }, [notifications, loadQueuedNotifications]);

  // Retry failed notification
  const retryNotification = useCallback(async (notificationId: string) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification || notification.deliveryStatus !== 'failed') {
        return;
      }

      notification.deliveryStatus = 'queued';
      notification.attempts = 0;
      
      await offlineStorageManager.store('notifications', notification, notification.priority);
      await loadQueuedNotifications();

      if (isOnline && autoProcess) {
        processQueue();
      }
    } catch (error) {
      console.error('Failed to retry notification:', error);
    }
  }, [notifications, isOnline, autoProcess, loadQueuedNotifications, processQueue]);

  // Initialize component
  useEffect(() => {
    loadQueuedNotifications();

    // Subscribe to network status
    const unsubscribe = networkManager.onNetworkStatusChange((status) => {
      setIsOnline(status.isOnline);
      
      if (status.isOnline && autoProcess) {
        // Auto-process queue when coming back online
        setTimeout(() => processQueue(), 1000);
      }
    });

    // Initial network status
    const networkStatus = networkManager.getNetworkStatus();
    setIsOnline(networkStatus.isOnline);

    return unsubscribe;
  }, [loadQueuedNotifications, autoProcess, processQueue]);

  // Auto-process queue periodically
  useEffect(() => {
    if (!autoProcess) {
      return;
    }

    const interval = setInterval(() => {
      if (isOnline && processingStats.queued > 0) {
        processQueue();
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [autoProcess, isOnline, processingStats.queued, processQueue]);

  const getStatusColor = (status: QueuedNotification['deliveryStatus']) => {
    switch (status) {
      case 'sent': return 'text-green-600 bg-green-100';
      case 'sending': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'expired': return 'text-gray-600 bg-gray-100';
      case 'queued':
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getPriorityColor = (priority: QueuedNotification['priority']) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-blue-500 bg-blue-50';
      case 'low': return 'border-gray-500 bg-gray-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with stats */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Notification Queue
        </h3>
        <div className="flex items-center space-x-4">
          <div className="flex space-x-4 text-sm">
            <span className="text-gray-600">
              Total: <span className="font-medium">{processingStats.total}</span>
            </span>
            <span className="text-yellow-600">
              Queued: <span className="font-medium">{processingStats.queued}</span>
            </span>
            <span className="text-green-600">
              Sent: <span className="font-medium">{processingStats.sent}</span>
            </span>
            <span className="text-red-600">
              Failed: <span className="font-medium">{processingStats.failed}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            onClick={processQueue}
            disabled={!isOnline || isProcessing}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Process Queue'}
          </button>
          <button
            onClick={clearProcessedNotifications}
            className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Clear Processed
          </button>
        </div>
        
        <div className={`flex items-center space-x-1 text-sm ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      {/* Notifications list */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`p-3 rounded-lg border-l-4 ${getPriorityColor(notification.priority)}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900 dark:text-white truncate">
                      {notification.title}
                    </h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(notification.deliveryStatus)}`}>
                      {notification.deliveryStatus}
                    </span>
                    <span className="text-xs text-gray-500 uppercase">
                      {notification.priority}
                    </span>
                  </div>
                  
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {notification.content}
                  </p>
                  
                  <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                    <span>To: {notification.recipient}</span>
                    <span>Attempts: {notification.attempts}/{notification.maxAttempts}</span>
                    <span>Created: {notification.createdAt.toLocaleTimeString()}</span>
                    {notification.lastAttempt && (
                      <span>Last attempt: {notification.lastAttempt.toLocaleTimeString()}</span>
                    )}
                  </div>

                  {notification.scheduledFor && notification.scheduledFor > new Date() && (
                    <div className="mt-1 text-xs text-blue-600">
                      Scheduled for: {notification.scheduledFor.toLocaleString()}
                    </div>
                  )}

                  {notification.expiresAt && (
                    <div className="mt-1 text-xs text-orange-600">
                      Expires: {notification.expiresAt.toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex space-x-1 ml-2">
                  {notification.deliveryStatus === 'failed' && (
                    <button
                      onClick={() => retryNotification(notification.id)}
                      className="px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {notifications.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">📬</div>
            <div className="text-lg font-medium mb-1">No notifications in queue</div>
            <div className="text-sm">Notifications will appear here when queued</div>
          </div>
        )}
      </div>

      {/* Processing indicator */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <motion.div
                className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <span className="text-sm text-blue-800 font-medium">
                Processing notification queue...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OfflineNotificationQueue;