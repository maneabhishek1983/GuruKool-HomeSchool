'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, themeClasses } from '../../themes/theme-utils';
import { Card, CardHeader, CardTitle, CardContent } from '../base/Card';
import { animationPresets } from '../../animations/presets';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'ai-insight';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  read: boolean;
  actionable?: boolean;
  actions?: NotificationAction[];
  aiConfidence?: number;
  category?: string;
  metadata?: Record<string, any>;
}

export interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  action: (notification: Notification) => void;
}

interface NotificationCenterProps {
  notifications: Notification[];
  aiFilterEnabled?: boolean;
  maxVisible?: number;
  groupByCategory?: boolean;
  showTimestamp?: boolean;
  onNotificationClick?: (notification: Notification) => void;
  onNotificationDismiss?: (notificationId: string) => void;
  onMarkAllRead?: () => void;
  className?: string;
}

const notificationIcons = {
  info: '💡',
  success: '✅',
  warning: '⚠️',
  error: '❌',
  'ai-insight': '🤖',
};

const priorityColors = {
  low: 'border-l-gray-400 bg-gray-50 dark:bg-gray-900/20',
  medium: 'border-l-blue-400 bg-blue-50 dark:bg-blue-900/20',
  high: 'border-l-orange-400 bg-orange-50 dark:bg-orange-900/20',
  urgent: 'border-l-red-400 bg-red-50 dark:bg-red-900/20',
};

const typeColors = {
  info: 'text-blue-600 dark:text-blue-400',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-orange-600 dark:text-orange-400',
  error: 'text-red-600 dark:text-red-400',
  'ai-insight': 'text-purple-600 dark:text-purple-400',
};

// AI-powered notification filtering and prioritization
const useAINotificationFilter = (
  notifications: Notification[],
  enabled: boolean = true
) => {
  return useMemo(() => {
    if (!enabled) return notifications;

    // AI-like scoring algorithm
    const scoreNotification = (notification: Notification): number => {
      let score = 0;
      
      // Priority scoring
      const priorityScores = { low: 1, medium: 2, high: 3, urgent: 4 };
      score += priorityScores[notification.priority] * 10;
      
      // Recency scoring (more recent = higher score)
      const hoursSinceCreated = (Date.now() - notification.timestamp.getTime()) / (1000 * 60 * 60);
      score += Math.max(0, 24 - hoursSinceCreated) * 2;
      
      // Unread bonus
      if (!notification.read) score += 5;
      
      // Actionable bonus
      if (notification.actionable) score += 3;
      
      // AI confidence bonus
      if (notification.aiConfidence) {
        score += (notification.aiConfidence / 100) * 5;
      }
      
      // Type-specific scoring
      if (notification.type === 'error' || notification.type === 'warning') {
        score += 5;
      }
      
      return score;
    };

    return [...notifications]
      .map(notification => ({
        ...notification,
        aiScore: scoreNotification(notification),
      }))
      .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
  }, [notifications, enabled]);
};

const NotificationItem = ({
  notification,
  onDismiss,
  onClick,
  showTimestamp = true,
}: {
  notification: Notification;
  onDismiss?: (id: string) => void;
  onClick?: (notification: Notification) => void;
  showTimestamp?: boolean;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      whileHover={{ y: -1 }}
      className={cn(
        'relative p-4 border-l-4 rounded-lg cursor-pointer',
        'transition-all duration-200',
        priorityColors[notification.priority],
        !notification.read && 'shadow-md',
        isHovered && 'shadow-lg'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick?.(notification)}
    >
      {/* Dismiss button */}
      <AnimatePresence>
        {isHovered && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss?.(notification.id);
            }}
          >
            <span className="text-xs">✕</span>
          </motion.button>
        )}
      </AnimatePresence>

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn('text-lg', typeColors[notification.type])}>
          {notificationIcons[notification.type]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className={cn(
              'font-medium text-sm',
              !notification.read && 'font-semibold'
            )}>
              {notification.title}
            </h4>
            {showTimestamp && (
              <span className="text-xs text-gray-500 ml-2">
                {formatTimestamp(notification.timestamp)}
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            {notification.message}
          </p>

          {/* AI Confidence */}
          {notification.aiConfidence && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-500">AI Confidence:</span>
              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${notification.aiConfidence}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-xs text-gray-500">{notification.aiConfidence}%</span>
            </div>
          )}

          {/* Actions */}
          {notification.actions && notification.actions.length > 0 && (
            <div className="flex gap-2 mt-3">
              {notification.actions.map((action) => (
                <motion.button
                  key={action.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'px-3 py-1 text-xs rounded-full font-medium',
                    'transition-colors duration-200',
                    action.type === 'primary' && 'bg-blue-500 text-white hover:bg-blue-600',
                    action.type === 'secondary' && 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200',
                    action.type === 'danger' && 'bg-red-500 text-white hover:bg-red-600'
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    action.action(notification);
                  }}
                >
                  {action.label}
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Unread indicator */}
        {!notification.read && (
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-1" />
        )}
      </div>
    </motion.div>
  );
};

export function NotificationCenter({
  notifications,
  aiFilterEnabled = true,
  maxVisible = 10,
  groupByCategory = false,
  showTimestamp = true,
  onNotificationClick,
  onNotificationDismiss,
  onMarkAllRead,
  className,
}: NotificationCenterProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const filteredNotifications = useAINotificationFilter(notifications, aiFilterEnabled);

  const displayNotifications = useMemo(() => {
    let filtered = filteredNotifications;

    // Apply filter
    switch (filter) {
      case 'unread':
        filtered = filtered.filter(n => !n.read);
        break;
      case 'urgent':
        filtered = filtered.filter(n => n.priority === 'urgent' || n.priority === 'high');
        break;
    }

    // Limit visible notifications
    return filtered.slice(0, maxVisible);
  }, [filteredNotifications, filter, maxVisible]);

  const groupedNotifications = useMemo(() => {
    if (!groupByCategory) return { 'All': displayNotifications };

    return displayNotifications.reduce((groups, notification) => {
      const category = notification.category || 'General';
      if (!groups[category]) groups[category] = [];
      groups[category].push(notification);
      return groups;
    }, {} as Record<string, Notification[]>);
  }, [displayNotifications, groupByCategory]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={animationPresets.fadeInUp}
      className={cn('space-y-4', className)}
    >
      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-2 py-1 text-xs bg-red-500 text-white rounded-full"
                >
                  {unreadCount}
                </motion.span>
              )}
              {aiFilterEnabled && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                  AI Filtered
                </span>
              )}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {/* Filter buttons */}
              <div className="flex rounded-lg overflow-hidden border">
                {(['all', 'unread', 'urgent'] as const).map((filterType) => (
                  <button
                    key={filterType}
                    onClick={() => setFilter(filterType)}
                    className={cn(
                      'px-3 py-1 text-xs font-medium transition-colors',
                      filter === filterType
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                    )}
                  >
                    {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                  </button>
                ))}
              </div>

              {/* Mark all read */}
              {unreadCount > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onMarkAllRead}
                  className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200"
                >
                  Mark All Read
                </motion.button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {Object.entries(groupedNotifications).map(([category, categoryNotifications]) => (
                <div key={category}>
                  {groupByCategory && Object.keys(groupedNotifications).length > 1 && (
                    <motion.button
                      onClick={() => toggleCategory(category)}
                      className="flex items-center gap-2 w-full text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-300"
                    >
                      <motion.span
                        animate={{ rotate: expandedCategories.has(category) ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        ▶
                      </motion.span>
                      {category} ({categoryNotifications.length})
                    </motion.button>
                  )}

                  <AnimatePresence>
                    {(!groupByCategory || expandedCategories.has(category) || Object.keys(groupedNotifications).length === 1) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-2"
                      >
                        {categoryNotifications.map((notification) => (
                          <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onDismiss={onNotificationDismiss}
                            onClick={onNotificationClick}
                            showTimestamp={showTimestamp}
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </AnimatePresence>

            {displayNotifications.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-gray-500"
              >
                <span className="text-4xl mb-2 block">📭</span>
                <p>No notifications to display</p>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Sample notification generator for testing
export const generateSampleNotifications = (count: number = 5): Notification[] => {
  const types: Notification['type'][] = ['info', 'success', 'warning', 'error', 'ai-insight'];
  const priorities: Notification['priority'][] = ['low', 'medium', 'high', 'urgent'];
  const categories = ['Sessions', 'Billing', 'AI Insights', 'System', 'Communication'];

  return Array.from({ length: count }, (_, i) => ({
    id: `notification-${i}`,
    title: `Notification ${i + 1}`,
    message: `This is a sample notification message for testing purposes. It contains some important information.`,
    type: types[Math.floor(Math.random() * types.length)],
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
    read: Math.random() > 0.6,
    actionable: Math.random() > 0.5,
    aiConfidence: Math.random() > 0.5 ? Math.floor(Math.random() * 40) + 60 : undefined,
    category: categories[Math.floor(Math.random() * categories.length)],
    actions: Math.random() > 0.7 ? [
      {
        id: 'action-1',
        label: 'View Details',
        type: 'primary',
        action: () => console.log('View details clicked'),
      },
      {
        id: 'action-2',
        label: 'Dismiss',
        type: 'secondary',
        action: () => console.log('Dismiss clicked'),
      },
    ] : undefined,
  }));
};