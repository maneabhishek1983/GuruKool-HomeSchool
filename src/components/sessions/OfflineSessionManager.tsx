/**
 * Offline Session Manager Component
 * Handles session management with offline capabilities and automatic sync
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { offlineStorageManager } from '@/services/offline-storage.service';
import { syncManager } from '@/services/sync-manager.service';
import { networkManager } from '@/services/network-manager.service';
import { timesheetAutomationService } from '@/services/timesheet-automation.service';
import { SessionRecord, SessionStatus } from '@/types/session.types';
import { Location, AIInsight } from '@/types';

interface OfflineSessionManagerProps {
  userId: string;
  userRole: 'teacher' | 'parent' | 'student';
  onSessionUpdate?: (session: SessionRecord) => void;
}

interface LocalSession extends SessionRecord {
  isOfflineCreated?: boolean;
  lastSyncAttempt?: Date;
  syncStatus: 'pending' | 'synced' | 'failed' | 'conflict';
}

export const OfflineSessionManager: React.FC<OfflineSessionManagerProps> = ({
  userId,
  userRole,
  onSessionUpdate
}) => {
  const [sessions, setSessions] = useState<LocalSession[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTimers, setActiveTimers] = useState<Map<string, any>>(new Map());

  // Load sessions from offline storage
  const loadOfflineSessions = useCallback(async () => {
    try {
      const storedSessions = await offlineStorageManager.getAll<LocalSession>('sessions');
      const userSessions = storedSessions.filter(session => {
        switch (userRole) {
          case 'teacher':
            return session.teacherId === userId;
          case 'parent':
            return session.parentId === userId;
          case 'student':
            return session.studentId === userId;
          default:
            return false;
        }
      });

      setSessions(userSessions);

      // Load active timers
      const timers = timesheetAutomationService.getActiveSessions();
      setActiveTimers(timers);
    } catch (error) {
      console.error('Failed to load offline sessions:', error);
    }
  }, [userId, userRole]);

  // Create new session offline
  const createOfflineSession = useCallback(async (sessionData: Partial<SessionRecord>) => {
    try {
      const newSession: LocalSession = {
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        teacherId: sessionData.teacherId || '',
        studentId: sessionData.studentId || '',
        parentId: sessionData.parentId || '',
        subject: sessionData.subject || '',
        scheduledStart: sessionData.scheduledStart || new Date(),
        scheduledEnd: sessionData.scheduledEnd || new Date(Date.now() + 60 * 60 * 1000),
        status: (sessionData.status || 'scheduled') as SessionStatus,
        location: (sessionData.location as Location) || {
          address: '',
          coordinates: { latitude: 0, longitude: 0 },
          verified: false
        },
        attachments: sessionData.attachments || [],
        aiInsights: sessionData.aiInsights || [],
        aiRecommendations: sessionData.aiRecommendations || [],
        learningPatterns: sessionData.learningPatterns || [],
        sessionAnalytics: sessionData.sessionAnalytics || {} as any,
        notes: sessionData.notes,
        createdAt: sessionData.createdAt || new Date(),
        updatedAt: new Date(),
        version: sessionData.version || 1,
        isOfflineCreated: true,
        syncStatus: 'pending',
      };

      // Store in offline storage
      await offlineStorageManager.store('sessions', newSession, 'high');

      // Queue for sync when online
      await offlineStorageManager.queueOfflineAction({
        type: 'create',
        entity: 'session',
        data: newSession,
        priority: 'high',
        maxRetries: 3
      });

      // Update local state
      setSessions(prev => [...prev, newSession]);
      onSessionUpdate?.(newSession);

      return newSession;
    } catch (error) {
      console.error('Failed to create offline session:', error);
      throw error;
    }
  }, [onSessionUpdate]);

  // Update session offline
  const updateOfflineSession = useCallback(async (sessionId: string, updates: Partial<SessionRecord>) => {
    try {
      const sessionIndex = sessions.findIndex(s => s.id === sessionId);
      if (sessionIndex === -1) {
        throw new Error('Session not found');
      }

      const updatedSession: LocalSession = {
        ...sessions[sessionIndex],
        ...updates,
        syncStatus: 'pending',
        updatedAt: new Date()
      };

      // Update in offline storage
      await offlineStorageManager.store('sessions', updatedSession, 'high');

      // Queue for sync
      await offlineStorageManager.queueOfflineAction({
        type: 'update',
        entity: 'session',
        data: updatedSession,
        priority: 'medium',
        maxRetries: 3
      });

      // Update local state
      setSessions(prev => prev.map(session => 
        session.id === sessionId ? updatedSession : session
      ));

      onSessionUpdate?.(updatedSession);

      return updatedSession;
    } catch (error) {
      console.error('Failed to update offline session:', error);
      throw error;
    }
  }, [sessions, onSessionUpdate]);

  // Start session timer
  const startSessionTimer = useCallback(async (sessionId: string) => {
    try {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const timesheetId = await timesheetAutomationService.startSession(
        sessionId,
        session.teacherId,
        session.studentId,
        {
          parentId: session.parentId,
          notes: session.notes,
          requireLocationVerification: true
        }
      );

      // Update session status
      await updateOfflineSession(sessionId, {
        status: 'in-progress',
        actualStart: new Date()
      });

      // Update active timers
      const updatedTimers = timesheetAutomationService.getActiveSessions();
      setActiveTimers(updatedTimers);

      return timesheetId;
    } catch (error) {
      console.error('Failed to start session timer:', error);
      throw error;
    }
  }, [sessions, updateOfflineSession]);

  // Stop session timer
  const stopSessionTimer = useCallback(async (sessionId: string, notes?: string) => {
    try {
      const stopOptions: { notes?: string } = {};
      if (notes !== undefined && notes !== null) {
        stopOptions.notes = notes;
      }
      const completedEntry = await timesheetAutomationService.stopSession(sessionId, stopOptions);

      // Update session status
      const updateData: Partial<LocalSession> = {
        status: 'completed',
        actualEnd: completedEntry.endTime,
      };
      if (notes !== undefined) {
        updateData.notes = notes;
      }
      await updateOfflineSession(sessionId, updateData);

      // Update active timers
      const updatedTimers = timesheetAutomationService.getActiveSessions();
      setActiveTimers(updatedTimers);

      return completedEntry;
    } catch (error) {
      console.error('Failed to stop session timer:', error);
      throw error;
    }
  }, [updateOfflineSession]);

  // Sync sessions when online
  const syncSessions = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      const result = await syncManager.sync();
      if (result.completed > 0 || result.failed > 0) {
        // Reload sessions after sync
        await loadOfflineSessions();
      }
    } catch (error) {
      console.error('Session sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, loadOfflineSessions]);

  // Initialize component
  useEffect(() => {
    loadOfflineSessions();

    // Subscribe to network status
    const unsubscribe = networkManager.onNetworkStatusChange((status) => {
      setIsOnline(status.isOnline);
      if (status.isOnline && !isSyncing) {
        // Auto-sync when coming back online
        syncSessions();
      }
    });

    // Initial network status
    const networkStatus = networkManager.getNetworkStatus();
    setIsOnline(networkStatus.isOnline);

    return unsubscribe;
  }, [loadOfflineSessions, syncSessions, isSyncing]);

  // Get sync status color
  const getSyncStatusColor = (status: LocalSession['syncStatus']) => {
    switch (status) {
      case 'synced': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      case 'conflict': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getSyncStatusIcon = (status: LocalSession['syncStatus']) => {
    switch (status) {
      case 'synced': return '✓';
      case 'pending': return '⏳';
      case 'failed': return '✗';
      case 'conflict': return '⚠️';
      default: return '?';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with sync status */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Sessions
        </h2>
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-1 text-sm ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>
          <button
            onClick={syncSessions}
            disabled={!isOnline || isSyncing}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSyncing ? 'Syncing...' : 'Sync'}
          </button>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-3">
        <AnimatePresence>
          {sessions.map((session) => {
            const isActive = activeTimers.has(session.id);
            
            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`p-4 rounded-lg border ${
                  session.isOfflineCreated 
                    ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20' 
                    : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                } shadow-sm`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {session.subject}
                      </h3>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        session.status === 'completed' ? 'bg-green-100 text-green-800' :
                        session.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        session.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {session.status}
                      </span>
                      <div className={`text-xs ${getSyncStatusColor(session.syncStatus)}`}>
                        {getSyncStatusIcon(session.syncStatus)}
                      </div>
                    </div>
                    
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {session.scheduledStart.toLocaleDateString()} at{' '}
                      {session.scheduledStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    
                    {session.location && (
                      <div className="mt-1 text-sm text-gray-500">
                        📍 {typeof session.location === 'string' ? session.location : session.location.address}
                      </div>
                    )}

                    {session.isOfflineCreated && (
                      <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                        Created offline - will sync when connected
                      </div>
                    )}

                    {isActive && (
                      <div className="mt-2 text-xs text-green-600 font-medium">
                        ⏱️ Timer running
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    {userRole === 'teacher' && session.status === 'scheduled' && (
                      <button
                        onClick={() => startSessionTimer(session.id)}
                        className="px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Start
                      </button>
                    )}

                    {userRole === 'teacher' && session.status === 'in-progress' && isActive && (
                      <button
                        onClick={() => stopSessionTimer(session.id)}
                        className="px-3 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Stop
                      </button>
                    )}

                    {session.syncStatus === 'failed' && (
                      <button
                        onClick={() => syncSessions()}
                        className="px-3 py-1 text-xs bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </div>

                {/* Session Notes */}
                {session.notes && (
                  <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-300">
                    {session.notes}
                  </div>
                )}

                {/* AI Insights */}
                {session.aiInsights && session.aiInsights.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      AI Insights
                    </div>
                    {session.aiInsights.slice(0, 2).map((insight: AIInsight, index: number) => (
                      <div key={index} className="text-sm text-blue-600 dark:text-blue-400">
                        💡 {insight.content}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {sessions.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">📅</div>
            <div className="text-lg font-medium mb-1">No sessions found</div>
            <div className="text-sm">Sessions will appear here when you create them</div>
          </div>
        )}
      </div>

      {/* Quick Actions for Teachers */}
      {userRole === 'teacher' && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Quick Actions
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => createOfflineSession({
                teacherId: userId,
                subject: 'New Session',
                scheduledStart: new Date(),
                scheduledEnd: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
                status: 'scheduled'
              })}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Session
            </button>
            <button
              onClick={loadOfflineSessions}
              className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineSessionManager;