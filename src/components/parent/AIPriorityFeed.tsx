"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIRecommendation, SessionRecord } from '@/types/session.types';
import { User } from '@/types';
import { enhancedSessionStore } from '@/store/session.store';

interface AIPriorityFeedProps {
  childId: string;
  parentId: string;
  currentUser: User;
  onRecommendationAction?: (recommendation: AIRecommendation, action: string) => void;
  className?: string;
}

interface PriorityItem {
  id: string;
  type: 'urgent' | 'important' | 'informational';
  title: string;
  description: string;
  action?: string;
  timestamp: Date;
  category: 'academic' | 'behavioral' | 'scheduling' | 'communication';
  priority: number;
}

export default function AIPriorityFeed({
  childId,
  parentId,
  currentUser,
  onRecommendationAction,
  className = ''
}: AIPriorityFeedProps) {
  const [priorityItems, setPriorityItems] = useState<PriorityItem[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'timestamp'>('priority');

  useEffect(() => {
    loadPriorityFeed();
  }, [childId, parentId]);

  const loadPriorityFeed = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load AI recommendations for the child
      const recommendations = await enhancedSessionStore.getAIInsights(childId);
      setAiRecommendations(recommendations);

      // Generate priority items from recommendations and session data
      const items = await generatePriorityItems(recommendations);
      setPriorityItems(items);

    } catch (err) {
      setError('Failed to load priority feed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const generatePriorityItems = async (recommendations: AIRecommendation[]): Promise<PriorityItem[]> => {
    const items: PriorityItem[] = [];

    // Convert AI recommendations to priority items
    recommendations.forEach((rec, index) => {
      const priority = rec.severity === 'high' ? 3 : rec.severity === 'medium' ? 2 : 1;
      
      const item: PriorityItem = {
        id: `rec-${index}`,
        type: priority === 3 ? 'urgent' : priority === 2 ? 'important' : 'informational',
        title: rec.title,
        description: rec.description,
        timestamp: new Date(),
        category: determineCategory(rec.title),
        priority
      };
      if (rec.suggestedActions?.[0]) {
        item.action = rec.suggestedActions[0];
      }
      items.push(item);
    });

    // Add sample priority items for demonstration
    items.push(
      {
        id: 'academic-1',
        type: 'urgent',
        title: 'Math Progress Alert',
        description: 'Your child is struggling with fractions. Consider scheduling extra practice sessions.',
        action: 'Schedule Extra Session',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        category: 'academic',
        priority: 3
      },
      {
        id: 'behavioral-1',
        type: 'important',
        title: 'Positive Behavior Recognition',
        description: 'Great improvement in focus during reading sessions. Consider positive reinforcement.',
        action: 'Send Encouragement',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        category: 'behavioral',
        priority: 2
      },
      {
        id: 'scheduling-1',
        type: 'informational',
        title: 'Upcoming Session Reminder',
        description: 'Science session scheduled for tomorrow at 3 PM. Materials needed: microscope kit.',
        action: 'View Details',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        category: 'scheduling',
        priority: 1
      }
    );

    return items.sort((a, b) => b.priority - a.priority);
  };

  const determineCategory = (title: string): 'academic' | 'behavioral' | 'scheduling' | 'communication' => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('math') || lowerTitle.includes('science') || lowerTitle.includes('reading') || lowerTitle.includes('progress')) {
      return 'academic';
    }
    if (lowerTitle.includes('behavior') || lowerTitle.includes('focus') || lowerTitle.includes('attention')) {
      return 'behavioral';
    }
    if (lowerTitle.includes('session') || lowerTitle.includes('schedule') || lowerTitle.includes('reminder')) {
      return 'scheduling';
    }
    return 'communication';
  };

  const handleAction = (item: PriorityItem, action: string) => {
    onRecommendationAction?.(
      {
        id: item.id,
        title: item.title,
        description: item.description,
        severity: item.type === 'urgent' ? 'high' : item.type === 'important' ? 'medium' : 'low',
        suggestedActions: item.action ? [item.action] : [],
        confidence: 0.8 // Default confidence
      },
      action
    );
  };

  const getFilteredItems = () => {
    let filtered = priorityItems;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (sortBy === 'priority') {
      filtered = filtered.sort((a, b) => b.priority - a.priority);
    } else {
      filtered = filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    return filtered;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'important': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'informational': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'academic': return '📚';
      case 'behavioral': return '🎯';
      case 'scheduling': return '📅';
      case 'communication': return '💬';
      default: return '📋';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffHours > 24) {
      return `${Math.floor(diffHours / 24)}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading AI insights...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  const filteredItems = getFilteredItems();

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          AI Priority Feed
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Smart Recommendations</span>
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="academic">Academic</option>
            <option value="behavioral">Behavioral</option>
            <option value="scheduling">Scheduling</option>
            <option value="communication">Communication</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'priority' | 'timestamp')}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="priority">Priority</option>
            <option value="timestamp">Time</option>
          </select>
        </div>
      </div>

      {/* Priority Items */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 border rounded-lg transition-all duration-200 hover:shadow-md ${
                item.type === 'urgent' ? 'border-red-200 bg-red-50' :
                item.type === 'important' ? 'border-yellow-200 bg-yellow-50' :
                'border-blue-200 bg-blue-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="text-2xl">{getCategoryIcon(item.category)}</div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-gray-900">{item.title}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getTypeColor(item.type)}`}>
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-3">{item.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(item.timestamp)}
                      </span>
                      
                      {item.action && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleAction(item, item.action!)}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                        >
                          {item.action}
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-gray-500"
          >
            <div className="text-4xl mb-2">🎉</div>
            <p>No priority items to show!</p>
            <p className="text-sm">Everything is running smoothly.</p>
          </motion.div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-lg font-semibold text-red-600">
            {priorityItems.filter(item => item.type === 'urgent').length}
          </div>
          <div className="text-xs text-gray-500">Urgent</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-yellow-600">
            {priorityItems.filter(item => item.type === 'important').length}
          </div>
          <div className="text-xs text-gray-500">Important</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-blue-600">
            {priorityItems.filter(item => item.type === 'informational').length}
          </div>
          <div className="text-xs text-gray-500">Info</div>
        </div>
      </div>
    </div>
  );
}
