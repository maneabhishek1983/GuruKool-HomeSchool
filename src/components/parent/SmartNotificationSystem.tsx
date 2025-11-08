'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SessionRecord, AIRecommendation } from '@/types/session.types';
import { User } from '@/types';
import { enhancedSessionStore } from '@/store/session.store';

interface SmartNotificationSystemProps {
  childId: string;
  parentId: string;
  currentUser: User;
  onNotificationAction?: (
    notification: NotificationItem,
    action: string
  ) => void;
  className?: string;
}

interface NotificationItem {
  id: string;
  type: 'urgent' | 'important' | 'informational' | 'reminder';
  category:
    | 'academic'
    | 'behavioral'
    | 'scheduling'
    | 'communication'
    | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: number;
  actions: NotificationAction[];
  aiInsight?: string;
  relatedSessionId?: string;
}

interface NotificationAction {
  label: string;
  action: string;
  type: 'primary' | 'secondary' | 'danger';
}

export default function SmartNotificationSystem({
  childId,
  parentId,
  currentUser,
  onNotificationAction,
  className = '',
}: SmartNotificationSystemProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<
    NotificationItem[]
  >([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showRead, setShowRead] = useState(false);
  const [sortBy, setSortBy] = useState<'priority' | 'timestamp'>('priority');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, [childId]);

  useEffect(() => {
    filterAndSortNotifications();
  }, [notifications, selectedCategory, showRead, sortBy]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load AI insights and session data
      const aiInsights = await enhancedSessionStore.getAIInsights(childId);
      const sessions = await enhancedSessionStore.getSessionsByStudent(childId);

      // Generate notifications from AI insights and session data
      const notificationItems = generateNotifications(aiInsights, sessions);
      setNotifications(notificationItems);

      // Calculate unread count
      setUnreadCount(notificationItems.filter(n => !n.read).length);
    } catch (err) {
      setError(
        'Failed to load notifications: ' +
          (err instanceof Error ? err.message : 'Unknown error')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const generateNotifications = (
    aiInsights: AIRecommendation[],
    sessions: SessionRecord[]
  ): NotificationItem[] => {
    const items: NotificationItem[] = [];

    // Convert AI insights to notifications
    aiInsights.forEach((insight, index) => {
      const priority =
        insight.severity === 'high' ? 3 : insight.severity === 'medium' ? 2 : 1;
      const type =
        priority === 3
          ? 'urgent'
          : priority === 2
            ? 'important'
            : 'informational';

      const notificationItem: NotificationItem = {
        id: `ai-${index}`,
        type,
        category: determineCategory(insight.title),
        title: insight.title,
        message: insight.description,
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Random time in last 24h
        read: false,
        priority,
        actions:
          insight.suggestedActions?.map((action: string) => ({
            label: action,
            action: action.toLowerCase().replace(/\s+/g, '_'),
            type: priority === 3 ? 'primary' : 'secondary',
          })) || [],
        aiInsight: 'AI-generated recommendation',
      };

      // Only add relatedSessionId if sessions exist
      if (sessions.length > 0 && sessions[0]?.id) {
        notificationItem.relatedSessionId = sessions[0].id;
      }

      items.push(notificationItem);
    });

    // Add sample notifications for demonstration
    items.push(
      {
        id: 'session-reminder-1',
        type: 'reminder',
        category: 'scheduling',
        title: 'Upcoming Session Reminder',
        message:
          'Math session scheduled for tomorrow at 3 PM. Teacher will arrive 10 minutes early.',
        timestamp: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        read: false,
        priority: 2,
        actions: [
          { label: 'View Details', action: 'view_details', type: 'primary' },
          { label: 'Reschedule', action: 'reschedule', type: 'secondary' },
        ],
        relatedSessionId: 'session-1',
      },
      {
        id: 'progress-alert-1',
        type: 'urgent',
        category: 'academic',
        title: 'Academic Progress Alert',
        message:
          'Your child is struggling with fractions. Consider scheduling extra practice sessions.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        read: false,
        priority: 3,
        actions: [
          {
            label: 'Schedule Extra Session',
            action: 'schedule_extra',
            type: 'primary',
          },
          {
            label: 'View Progress Report',
            action: 'view_report',
            type: 'secondary',
          },
        ],
        aiInsight:
          'AI detected learning pattern indicating need for additional support',
      },
      {
        id: 'behavior-positive-1',
        type: 'informational',
        category: 'behavioral',
        title: 'Positive Behavior Recognition',
        message:
          'Great improvement in focus during reading sessions. Consider positive reinforcement.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        read: true,
        priority: 1,
        actions: [
          {
            label: 'Send Encouragement',
            action: 'send_encouragement',
            type: 'primary',
          },
        ],
      },
      {
        id: 'communication-1',
        type: 'important',
        category: 'communication',
        title: 'Teacher Message',
        message:
          "Your child completed today's homework assignment successfully. Great work!",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        read: false,
        priority: 2,
        actions: [
          { label: 'Reply', action: 'reply', type: 'primary' },
          { label: 'Mark as Read', action: 'mark_read', type: 'secondary' },
        ],
      }
    );

    return items.sort((a, b) => b.priority - a.priority);
  };

  const determineCategory = (
    title: string
  ): 'academic' | 'behavioral' | 'scheduling' | 'communication' | 'system' => {
    const lowerTitle = title.toLowerCase();
    if (
      lowerTitle.includes('math') ||
      lowerTitle.includes('science') ||
      lowerTitle.includes('progress') ||
      lowerTitle.includes('academic')
    ) {
      return 'academic';
    }
    if (
      lowerTitle.includes('behavior') ||
      lowerTitle.includes('focus') ||
      lowerTitle.includes('attention')
    ) {
      return 'behavioral';
    }
    if (
      lowerTitle.includes('session') ||
      lowerTitle.includes('schedule') ||
      lowerTitle.includes('reminder')
    ) {
      return 'scheduling';
    }
    if (
      lowerTitle.includes('message') ||
      lowerTitle.includes('communication')
    ) {
      return 'communication';
    }
    return 'system';
  };

  const filterAndSortNotifications = () => {
    let filtered = notifications;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(n => n.category === selectedCategory);
    }

    // Filter by read status
    if (!showRead) {
      filtered = filtered.filter(n => !n.read);
    }

    // Sort
    if (sortBy === 'priority') {
      filtered = filtered.sort((a, b) => b.priority - a.priority);
    } else {
      filtered = filtered.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );
    }

    setFilteredNotifications(filtered);
  };

  const handleNotificationAction = (
    notification: NotificationItem,
    action: string
  ) => {
    onNotificationAction?.(notification, action);

    // Handle internal actions
    switch (action) {
      case 'mark_read':
        markAsRead(notification.id);
        break;
      case 'mark_all_read':
        markAllAsRead();
        break;
      case 'delete':
        deleteNotification(notification.id);
        break;
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => {
      const deletedNotification = notifications.find(
        n => n.id === notificationId
      );
      return deletedNotification && !deletedNotification.read
        ? Math.max(0, prev - 1)
        : prev;
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'important':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'informational':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'reminder':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'academic':
        return '📚';
      case 'behavioral':
        return '🎯';
      case 'scheduling':
        return '📅';
      case 'communication':
        return '💬';
      case 'system':
        return '⚙️';
      default:
        return '📋';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    }
    if (diffHours > 0) {
      return `${diffHours}h ago`;
    }
    if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    }
    return 'Just now';
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading notifications...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg
              className="w-5 h-5 text-red-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Smart Notifications
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">AI-Filtered</span>
          {unreadCount > 0 && (
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
              {unreadCount} unread
            </span>
          )}
          <svg
            className="w-5 h-5 text-blue-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">
              Category:
            </label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="academic">Academic</option>
              <option value="behavioral">Behavioral</option>
              <option value="scheduling">Scheduling</option>
              <option value="communication">Communication</option>
              <option value="system">System</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">
              Sort by:
            </label>
            <select
              value={sortBy}
              onChange={e =>
                setSortBy(e.target.value as 'priority' | 'timestamp')
              }
              className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="priority">Priority</option>
              <option value="timestamp">Time</option>
            </select>
          </div>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showRead}
              onChange={e => setShowRead(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Show read</span>
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              handleNotificationAction({} as NotificationItem, 'mark_all_read')
            }
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            Mark All Read
          </motion.button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredNotifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 border rounded-lg transition-all duration-200 hover:shadow-md ${
                notification.read
                  ? 'bg-gray-50 border-gray-200'
                  : 'bg-white border-gray-200 shadow-sm'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl">
                  {getCategoryIcon(notification.category)}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">
                        {notification.title}
                      </h4>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full border ${getTypeColor(notification.type)}`}
                      >
                        {notification.type.charAt(0).toUpperCase() +
                          notification.type.slice(1)}
                      </span>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(notification.timestamp)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 mb-3">
                    {notification.message}
                  </p>

                  {notification.aiInsight && (
                    <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                      🤖 {notification.aiInsight}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      {notification.actions.map((action, actionIndex) => (
                        <motion.button
                          key={actionIndex}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            handleNotificationAction(
                              notification,
                              action.action
                            )
                          }
                          className={`px-3 py-1 text-xs rounded-md transition-colors ${
                            action.type === 'primary'
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : action.type === 'danger'
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {action.label}
                        </motion.button>
                      ))}
                    </div>

                    <div className="flex items-center space-x-2">
                      {!notification.read && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            handleNotificationAction(notification, 'mark_read')
                          }
                          className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                        >
                          Mark Read
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          handleNotificationAction(notification, 'delete')
                        }
                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      >
                        Delete
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredNotifications.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-gray-500"
          >
            <div className="text-4xl mb-2">📭</div>
            <p>No notifications to show!</p>
            <p className="text-sm">You're all caught up.</p>
          </motion.div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-lg font-semibold text-red-600">
            {notifications.filter(n => n.type === 'urgent' && !n.read).length}
          </div>
          <div className="text-xs text-gray-500">Urgent</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-yellow-600">
            {
              notifications.filter(n => n.type === 'important' && !n.read)
                .length
            }
          </div>
          <div className="text-xs text-gray-500">Important</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-blue-600">
            {
              notifications.filter(n => n.type === 'informational' && !n.read)
                .length
            }
          </div>
          <div className="text-xs text-gray-500">Info</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-green-600">
            {notifications.filter(n => n.type === 'reminder' && !n.read).length}
          </div>
          <div className="text-xs text-gray-500">Reminders</div>
        </div>
      </div>
    </div>
  );
}
