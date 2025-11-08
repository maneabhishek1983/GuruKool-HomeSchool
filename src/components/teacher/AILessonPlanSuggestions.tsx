'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIRecommendation, SessionRecord } from '@/types/session.types';
import { User } from '@/types';
import { enhancedSessionStore } from '@/store/session.store';

interface AILessonPlanSuggestionsProps {
  studentId: string;
  teacherId: string;
  subject: string;
  currentUser: User;
  onSuggestionSelect?: (suggestion: AIRecommendation) => void;
}

export default function AILessonPlanSuggestions({
  studentId,
  teacherId,
  subject,
  currentUser,
  onSuggestionSelect,
}: AILessonPlanSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<AIRecommendation | null>(null);

  useEffect(() => {
    loadAISuggestions();
  }, [studentId, teacherId, subject]);

  const loadAISuggestions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get AI recommendations from the enhanced session store
      const recommendations =
        await enhancedSessionStore.getSessionRecommendations(
          studentId,
          teacherId
        );

      // Filter recommendations for the current subject
      const subjectRecommendations = recommendations.filter(
        rec => rec.type === 'content' && rec.metadata?.subject === subject
      );

      setSuggestions(subjectRecommendations);
    } catch (err) {
      setError('Failed to load AI suggestions');
      console.error('Error loading AI suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionSelect = (suggestion: AIRecommendation) => {
    setSelectedSuggestion(suggestion);
    onSuggestionSelect?.(suggestion);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) {
      return 'text-green-600';
    }
    if (confidence >= 0.6) {
      return 'text-yellow-600';
    }
    return 'text-red-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 bg-white rounded-lg shadow-sm border border-gray-200"
      >
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading AI suggestions...</span>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 bg-red-50 rounded-lg border border-red-200"
      >
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
          <span className="text-red-700">{error}</span>
        </div>
        <button
          onClick={loadAISuggestions}
          className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </motion.div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 bg-gray-50 rounded-lg border border-gray-200"
      >
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No AI suggestions available
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            AI will generate suggestions based on student progress and learning
            patterns.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          AI Lesson Plan Suggestions
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Powered by AI</span>
          <svg
            className="w-5 h-5 text-blue-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      <div className="grid gap-4">
        <AnimatePresence>
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedSuggestion?.id === suggestion.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-gray-900">
                      {suggestion.title}
                    </h4>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(suggestion.priority || 'medium')}`}
                    >
                      {suggestion.priority || 'medium'}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">
                    {suggestion.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span
                        className={`text-sm font-medium ${getConfidenceColor(suggestion.confidence)}`}
                      >
                        {Math.round(suggestion.confidence * 100)}% confidence
                      </span>
                      {suggestion.actionable && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Actionable
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {suggestion.metadata?.estimatedDuration && (
                        <span className="text-xs text-gray-500">
                          ~{suggestion.metadata.estimatedDuration}
                        </span>
                      )}
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {suggestion.metadata?.resources &&
                suggestion.metadata.resources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-gray-500">
                        Resources:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {suggestion.metadata.resources.map(
                          (resource: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                            >
                              {resource}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {selectedSuggestion && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200"
        >
          <h4 className="font-medium text-blue-900 mb-2">
            Selected Suggestion
          </h4>
          <p className="text-sm text-blue-800 mb-3">
            {selectedSuggestion.description}
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                // Handle implementing the suggestion
                console.log('Implementing suggestion:', selectedSuggestion);
              }}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              Implement Suggestion
            </button>
            <button
              onClick={() => setSelectedSuggestion(null)}
              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
