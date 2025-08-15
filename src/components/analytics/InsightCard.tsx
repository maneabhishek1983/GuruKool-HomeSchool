'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/design-system/themes/theme-utils';
import { Card, CardContent } from '@/design-system/components/base/Card';

interface InsightCardProps {
  title: string;
  description: string;
  type: 'success' | 'warning' | 'info' | 'error' | 'recommendation' | 'alert' | 'prediction';
  confidence?: number;
  actionLabel?: string;
  onAction?: () => void;
  data?: any;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  className?: string;
}

const typeStyles = {
  success: 'border-l-success-500 bg-success-50 dark:bg-success-900/20',
  warning: 'border-l-warning-500 bg-warning-50 dark:bg-warning-900/20',
  info: 'border-l-primary-500 bg-primary-50 dark:bg-primary-900/20',
  error: 'border-l-error-500 bg-error-50 dark:bg-error-900/20',
  recommendation: 'border-l-secondary-500 bg-secondary-50 dark:bg-secondary-900/20',
  alert: 'border-l-warning-500 bg-warning-50 dark:bg-warning-900/20',
  prediction: 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/20',
};

const typeIcons = {
  success: '✅',
  warning: '⚠️',
  info: '💡',
  error: '❌',
  recommendation: '🎯',
  alert: '🚨',
  prediction: '🔮',
};

const typeColors = {
  success: 'text-success-700 dark:text-success-300',
  warning: 'text-warning-700 dark:text-warning-300',
  info: 'text-primary-700 dark:text-primary-300',
  error: 'text-error-700 dark:text-error-300',
  recommendation: 'text-secondary-700 dark:text-secondary-300',
  alert: 'text-warning-700 dark:text-warning-300',
  prediction: 'text-purple-700 dark:text-purple-300',
};

export function InsightCard({
  title,
  description,
  type,
  confidence,
  actionLabel,
  onAction,
  data,
  priority = 'medium',
  className
}: InsightCardProps) {
  const getPriorityColor = () => {
    switch (priority) {
      case 'critical': return 'border-red-500';
      case 'high': return 'border-orange-500';
      case 'medium': return 'border-blue-500';
      case 'low': return 'border-gray-500';
      default: return 'border-gray-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('w-full', className)}
    >
      <Card 
        variant="outlined" 
        className={cn(
          'border-l-4 transition-all duration-200 hover:shadow-md',
          typeStyles[type],
          getPriorityColor()
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-xl">{typeIcons[type]}</span>
              <h3 className={cn('font-semibold text-lg', typeColors[type])}>
                {title}
              </h3>
            </div>
            
            {confidence && (
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-500">Confidence:</span>
                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${confidence * 100}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </div>
                <span className="text-xs font-medium">{Math.round(confidence * 100)}%</span>
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
            {description}
          </p>

          {data && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
              <details className="cursor-pointer">
                <summary className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  View Data
                </summary>
                <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </details>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={cn(
                'px-2 py-1 text-xs font-medium rounded-full',
                priority === 'critical' ? 'bg-red-100 text-red-800' :
                priority === 'high' ? 'bg-orange-100 text-orange-800' :
                priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              )}>
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </span>
              
              <span className={cn(
                'px-2 py-1 text-xs font-medium rounded-full',
                typeColors[type].replace('text-', 'bg-').replace('-700', '-100').replace('-300', '-100'),
                typeColors[type].replace('-700', '-800').replace('-300', '-800')
              )}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
            </div>
            
            {actionLabel && onAction && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAction}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  'bg-primary-600 hover:bg-primary-700 text-white',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                )}
              >
                {actionLabel}
              </motion.button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default InsightCard;