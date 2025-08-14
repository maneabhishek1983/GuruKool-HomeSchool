"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthContext } from '@/lib/authContext';
import { enhancedSessionStore } from '@/store/session.store';
import { User } from '@/types';
import { SessionRecord, AIRecommendation, SchedulingConflict } from '@/types/session.types';
import AILessonPlanSuggestions from '@/components/teacher/AILessonPlanSuggestions';
import VoiceToTextNotes from '@/components/teacher/VoiceToTextNotes';
import LocationAwareSessionManager from '@/components/teacher/LocationAwareSessionManager';
import DragDropScheduleManager from '@/components/teacher/DragDropScheduleManager';

export default function TeacherDashboard() {
  const { user } = useAuthContext();
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'sessions' | 'ai-tools'>('overview');
  const [conflicts, setConflicts] = useState<SchedulingConflict[]>([]);
  const [aiInsights, setAiInsights] = useState<AIRecommendation[]>([]);

  const loadTeacherData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // In development, use mock data since database isn't connected
      if (process.env.NODE_ENV !== 'production') {
        // Mock sessions data
        const mockSessions: SessionRecord[] = [
          {
            id: 'session-1',
            studentId: 'student-1',
            teacherId: user!.id,
            parentId: 'parent-1',
            subject: 'Mathematics',
            scheduledStart: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
            scheduledEnd: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // Tomorrow + 1 hour
            status: 'scheduled',
            location: 'Living Room',
            notes: 'Focus on algebra fundamentals',
            aiInsights: {
              recommendedActivities: ['interactive math games', 'visual problem solving'],
              difficultyLevel: 'intermediate',
              learningStyle: 'visual',
              engagementScore: 85
            }
          },
          {
            id: 'session-2',
            studentId: 'student-1',
            teacherId: user!.id,
            parentId: 'parent-1',
            subject: 'Science',
            scheduledStart: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
            scheduledEnd: new Date(Date.now() - 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // Yesterday + 1 hour
            status: 'completed',
            location: 'Study Room',
            notes: 'Great progress on photosynthesis concepts',
            aiInsights: {
              recommendedActivities: ['nature observation', 'plant experiments'],
              difficultyLevel: 'beginner',
              learningStyle: 'hands-on',
              engagementScore: 92
            }
          },
          {
            id: 'session-3',
            studentId: 'student-2',
            teacherId: user!.id,
            parentId: 'parent-2',
            subject: 'English Literature',
            scheduledStart: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
            scheduledEnd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000), // Day after tomorrow + 1.5 hours
            status: 'scheduled',
            location: 'Library Corner',
            notes: 'Reading comprehension and creative writing',
            aiInsights: {
              recommendedActivities: ['story analysis', 'creative writing prompts'],
              difficultyLevel: 'advanced',
              learningStyle: 'analytical',
              engagementScore: 78
            }
          }
        ];

        // Mock AI insights
        const mockInsights: AIRecommendation[] = [
          {
            id: 'insight-1',
            type: 'performance',
            title: 'Student Engagement Trending Up',
            description: 'Your interactive teaching methods have increased student engagement by 15% this week.',
            priority: 'medium',
            confidence: 0.85,
            suggestedActions: ['Continue using visual aids', 'Add more hands-on activities']
          },
          {
            id: 'insight-2',
            type: 'schedule',
            title: 'Optimal Learning Time Detected',
            description: 'Students show 20% better performance during morning sessions (9-11 AM).',
            priority: 'high',
            confidence: 0.92,
            suggestedActions: ['Schedule challenging topics in morning', 'Keep afternoons for review']
          },
          {
            id: 'insight-3',
            type: 'curriculum',
            title: 'Math Skills Gap Identified',
            description: 'AI analysis suggests focusing more on foundational arithmetic before advancing to algebra.',
            priority: 'high',
            confidence: 0.88,
            suggestedActions: ['Add 15 minutes of arithmetic practice', 'Use math games for reinforcement']
          }
        ];

        setSessions(mockSessions);
        setAiInsights(mockInsights);
      } else {
        // Production code - load from actual services
        const teacherSessions = await enhancedSessionStore.getSessionsWithInsights({
          teacherId: user!.id,
          includeAIInsights: true,
          includeAnalytics: true
        });
        setSessions(teacherSessions);

        const insights = await enhancedSessionStore.getSessionRecommendations('sample-student', user!.id);
        setAiInsights(insights);
      }

    } catch (err) {
      setError('Failed to load dashboard data: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadTeacherData();
    }
  }, [user, loadTeacherData]);

  const handleSessionUpdate = async (updatedSessions: SessionRecord[]) => {
    try {
      setSessions(updatedSessions);
      // Additional logic for updating sessions
    } catch (err) {
      setError('Failed to update sessions: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleConflictDetected = (newConflicts: SchedulingConflict[]) => {
    setConflicts(newConflicts);
  };

  const handleLocationVerified = (location: any) => {
    // Location verified
    // Additional logic for location verification
  };

  const handleNotesUpdate = (notes: string) => {
    if (selectedSession) {
      setSelectedSession((prev: SessionRecord | null) => prev ? { ...prev, notes } : null);
    }
  };

  const getUpcomingSessions = () => {
    const now = new Date();
    return sessions
      .filter(session => new Date(session.scheduledStart) > now)
      .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())
      .slice(0, 5);
  };

  const getRecentSessions = () => {
    const now = new Date();
    return sessions
      .filter(session => new Date(session.scheduledEnd) < now)
      .sort((a, b) => new Date(b.scheduledEnd).getTime() - new Date(a.scheduledEnd).getTime())
      .slice(0, 5);
  };

  const getSessionStats = () => {
    const total = sessions.length;
    const completed = sessions.filter(s => s.status === 'completed').length;
    const upcoming = sessions.filter(s => s.status === 'scheduled').length;
    const inProgress = sessions.filter(s => s.status === 'in-progress').length;

    // Calculate worked hours (completed sessions)
    const workedHours = sessions
      .filter(s => s.status === 'completed')
      .reduce((total, session) => {
        const duration = (session.scheduledEnd.getTime() - session.scheduledStart.getTime()) / (1000 * 60 * 60);
        return total + duration;
      }, 0);

    // Calculate booked hours (scheduled + in-progress sessions)
    const bookedHours = sessions
      .filter(s => s.status === 'scheduled' || s.status === 'in-progress')
      .reduce((total, session) => {
        const duration = (session.scheduledEnd.getTime() - session.scheduledStart.getTime()) / (1000 * 60 * 60);
        return total + duration;
      }, 0);

    return { 
      total, 
      completed, 
      upcoming, 
      inProgress, 
      workedHours: Math.round(workedHours * 10) / 10, // Round to 1 decimal place
      bookedHours: Math.round(bookedHours * 10) / 10
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your AI-enhanced dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadTeacherData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const stats = getSessionStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                AI-Enhanced Teacher Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Welcome back, {user?.name || 'Teacher'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">AI Assistant</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'schedule', label: 'Schedule', icon: '📅' },
              { id: 'sessions', label: 'Sessions', icon: '🎓' },
              { id: 'ai-tools', label: 'AI Tools', icon: '🤖' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {[
                  { label: 'Total Sessions', value: stats.total, color: 'blue', icon: '📊' },
                  { label: 'Completed', value: stats.completed, color: 'green', icon: '✅' },
                  { label: 'Upcoming', value: stats.upcoming, color: 'yellow', icon: '📅' },
                  { label: 'In Progress', value: stats.inProgress, color: 'purple', icon: '⏳' },
                  { label: 'Worked Hours', value: `${stats.workedHours}h`, color: 'emerald', icon: '⏰' },
                  { label: 'Booked Hours', value: `${stats.bookedHours}h`, color: 'orange', icon: '📝' }
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-lg shadow p-4 lg:p-6">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 bg-${stat.color}-100 rounded-full flex items-center justify-center`}>
                        <span className="text-lg">{stat.icon}</span>
                      </div>
                      <div className="ml-3 lg:ml-4">
                        <p className="text-xs lg:text-sm font-medium text-gray-600">{stat.label}</p>
                        <p className="text-xl lg:text-2xl font-semibold text-gray-900">{stat.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Insights */}
              {aiInsights.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">AI Insights & Recommendations</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {aiInsights.slice(0, 3).map((insight, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg"
                        >
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-blue-900">{insight.title}</p>
                            <p className="text-sm text-blue-700">{insight.description}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Upcoming Sessions */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Upcoming Sessions</h3>
                </div>
                <div className="p-6">
                  {getUpcomingSessions().length > 0 ? (
                    <div className="space-y-4">
                      {getUpcomingSessions().map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">{session.subject}</h4>
                            <p className="text-sm text-gray-600">
                              {new Date(session.scheduledStart).toLocaleDateString()} at {new Date(session.scheduledStart).toLocaleTimeString()}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedSession(session);
                              setActiveTab('sessions');
                            }}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            View Details
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No upcoming sessions</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'schedule' && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <DragDropScheduleManager
                sessions={sessions}
                currentUser={user!}
                onScheduleUpdate={handleSessionUpdate}
                onConflictDetected={handleConflictDetected}
              />
            </motion.div>
          )}

          {activeTab === 'sessions' && (
            <motion.div
              key="sessions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Session List */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">All Sessions</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {sessions.map((session) => (
                        <div
                          key={session.id}
                          onClick={() => setSelectedSession(session)}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedSession?.id === session.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <h4 className="font-medium text-gray-900">{session.subject}</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(session.scheduledStart).toLocaleDateString()} • {session.status}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Session Details */}
                {selectedSession ? (
                  <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">Session Details</h3>
                    </div>
                    <div className="p-6 space-y-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">{selectedSession.subject}</h4>
                        <p className="text-sm text-gray-600">
                          {new Date(selectedSession.scheduledStart).toLocaleDateString()} at {new Date(selectedSession.scheduledStart).toLocaleTimeString()}
                        </p>
                        <div className="mt-2">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            selectedSession.status === 'completed' ? 'bg-green-100 text-green-800' :
                            selectedSession.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedSession.status}
                          </span>
                        </div>
                      </div>

                      {/* Session Notes */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Session Notes</h5>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          {selectedSession.notes || 'No notes available for this session.'}
                        </p>
                      </div>

                      {/* AI Insights */}
                      {selectedSession.aiInsights && (
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">AI Insights</h5>
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-sm text-blue-700 mb-2">
                              <strong>Learning Style:</strong> {selectedSession.aiInsights.learningStyle}
                            </p>
                            <p className="text-sm text-blue-700 mb-2">
                              <strong>Difficulty Level:</strong> {selectedSession.aiInsights.difficultyLevel}
                            </p>
                            <p className="text-sm text-blue-700">
                              <strong>Engagement Score:</strong> {selectedSession.aiInsights.engagementScore}%
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Location Management */}
                      <LocationAwareSessionManager
                        session={selectedSession}
                        currentUser={user!}
                        onLocationVerified={handleLocationVerified}
                      />

                      {/* Voice-to-Text Notes */}
                      <VoiceToTextNotes
                        session={selectedSession}
                        currentUser={user!}
                        onNotesUpdate={handleNotesUpdate}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">Session Details</h3>
                    </div>
                    <div className="p-6">
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h4 className="text-lg font-medium text-gray-900 mb-2">No Session Selected</h4>
                        <p className="text-gray-600">Click on a session from the list to view its details, notes, and AI insights.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'ai-tools' && (
            <motion.div
              key="ai-tools"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* AI Tools Introduction */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">🤖 AI-Powered Teaching Assistant</h2>
                    <p className="text-gray-600">Enhance your teaching with intelligent recommendations and insights</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center text-blue-700">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Personalized lesson plans
                  </div>
                  <div className="flex items-center text-blue-700">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Real-time analytics
                  </div>
                  <div className="flex items-center text-blue-700">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Smart recommendations
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AI Lesson Plan Generator */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <span className="mr-2">📚</span>
                      AI Lesson Plan Generator
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">Generate personalized lesson plans based on student profiles, year level, and current progress</p>
                  </div>
                  <div className="p-6">
                    {/* Student Profile Selector */}
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-900 mb-3">📋 Student Profiles</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 border border-blue-200 rounded-lg bg-blue-50 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-blue-900">Emma Johnson</h5>
                              <p className="text-sm text-blue-700">Year 2 • Age 7</p>
                              <p className="text-xs text-blue-600">Visual learner • 78% progress</p>
                            </div>
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 text-xs">✓</span>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div>
                            <h5 className="font-medium text-gray-900">James Smith</h5>
                            <p className="text-sm text-gray-600">Year 4 • Age 9</p>
                            <p className="text-xs text-gray-500">Kinesthetic learner • 85% progress</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress-Based Suggestions */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">🎯 AI-Generated Suggestions (Based on Emma&apos;s Progress)</h4>
                      
                      <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full mr-2">Next Up</span>
                              <h5 className="font-medium text-green-900">Mathematics - Addition with Regrouping</h5>
                            </div>
                            <p className="text-sm text-green-700 mb-2">Year 2 National Curriculum • Building on completed subtraction skills (92%)</p>
                            <div className="flex items-center text-xs text-green-600 space-x-4">
                              <span>⏱️ 25-30 minutes</span>
                              <span>👁️ Visual aids included</span>
                              <span>🎮 Interactive activities</span>
                            </div>
                          </div>
                          <button className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 ml-3">
                            Generate Plan
                          </button>
                        </div>
                      </div>

                      <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full mr-2">Recommended</span>
                              <h5 className="font-medium text-blue-900">English - Reading Comprehension</h5>
                            </div>
                            <p className="text-sm text-blue-700 mb-2">Year 2 Level • Focus on inference skills (Current: 68% - needs improvement)</p>
                            <div className="flex items-center text-xs text-blue-600 space-x-4">
                              <span>⏱️ 20 minutes</span>
                              <span>📖 Story-based learning</span>
                              <span>❓ Question prompts</span>
                            </div>
                          </div>
                          <button className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 ml-3">
                            Generate Plan
                          </button>
                        </div>
                      </div>

                      <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full mr-2">Review</span>
                              <h5 className="font-medium text-yellow-900">Science - Living vs Non-Living</h5>
                            </div>
                            <p className="text-sm text-yellow-700 mb-2">Year 2 Review • Previous lesson scored 65% - reinforcement needed</p>
                            <div className="flex items-center text-xs text-yellow-600 space-x-4">
                              <span>⏱️ 15 minutes</span>
                              <span>🔍 Hands-on sorting</span>
                              <span>📷 Real-world examples</span>
                            </div>
                          </div>
                          <button className="px-3 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 ml-3">
                            Generate Review
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* AI Analysis Summary */}
                    <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <h5 className="font-medium text-purple-900 mb-2">🧠 AI Analysis for Emma</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-purple-700 mb-1"><strong>Strengths:</strong></p>
                          <ul className="text-purple-600 text-xs space-y-1 ml-2">
                            <li>• Excels at visual pattern recognition</li>
                            <li>• Strong mathematical foundations</li>
                            <li>• Consistent attendance and engagement</li>
                          </ul>
                        </div>
                        <div>
                          <p className="text-purple-700 mb-1"><strong>Focus Areas:</strong></p>
                          <ul className="text-purple-600 text-xs space-y-1 ml-2">
                            <li>• Reading comprehension inference skills</li>
                            <li>• Scientific concept retention</li>
                            <li>• Attention span during longer activities</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex flex-wrap gap-2">
                        <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded transition-colors">
                          📊 View Full Progress Report
                        </button>
                        <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded transition-colors">
                          🎯 Adjust Learning Goals  
                        </button>
                        <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded transition-colors">
                          👥 Switch Student Profile
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Real-time AI Analytics */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <span className="mr-2">📊</span>
                      Real-time Learning Analytics
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">AI analyzes student engagement and comprehension in real-time</p>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-green-900">Student Engagement</h4>
                          <span className="text-2xl font-bold text-green-600">92%</span>
                        </div>
                        <p className="text-sm text-green-700 mt-1">↑ 15% improvement this week</p>
                        <div className="mt-2 bg-green-200 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-blue-900">Learning Objectives Met</h4>
                          <span className="text-2xl font-bold text-blue-600">85%</span>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">Above average performance</p>
                        <div className="mt-2 bg-blue-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                      </div>

                      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-yellow-900">Attention Span</h4>
                          <span className="text-2xl font-bold text-yellow-600">78%</span>
                        </div>
                        <p className="text-sm text-yellow-700 mt-1">Consider shorter segments</p>
                        <div className="mt-2 bg-yellow-200 rounded-full h-2">
                          <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Smart Recommendations Panel */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <span className="mr-2">🎯</span>
                    Smart Teaching Recommendations
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">AI-powered suggestions to optimize your teaching approach</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border border-purple-200 rounded-lg bg-purple-50">
                      <div className="flex items-center mb-2">
                        <span className="text-purple-600 text-xl mr-2">🧠</span>
                        <h4 className="font-medium text-purple-900">Learning Style Optimization</h4>
                      </div>
                      <p className="text-sm text-purple-700 mb-3">Student responds best to visual learning methods</p>
                      <button className="w-full px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700">
                        Apply Suggestions
                      </button>
                    </div>

                    <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                      <div className="flex items-center mb-2">
                        <span className="text-orange-600 text-xl mr-2">⏰</span>
                        <h4 className="font-medium text-orange-900">Optimal Timing</h4>
                      </div>
                      <p className="text-sm text-orange-700 mb-3">Schedule challenging topics for 9-11 AM sessions</p>
                      <button className="w-full px-3 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700">
                        Update Schedule
                      </button>
                    </div>

                    <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                      <div className="flex items-center mb-2">
                        <span className="text-green-600 text-xl mr-2">🎮</span>
                        <h4 className="font-medium text-green-900">Engagement Boost</h4>
                      </div>
                      <p className="text-sm text-green-700 mb-3">Add interactive games and hands-on activities</p>
                      <button className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                        Browse Activities
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Assistant Chat (Preview) */}
              <div className="bg-white rounded-lg shadow border-2 border-dashed border-gray-300">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <span className="mr-2">💬</span>
                    AI Teaching Assistant Chat
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">Coming Soon</span>
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Ask questions, get teaching advice, and receive instant support</p>
                </div>
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm">🤖</span>
                    </div>
                    <div className="flex-1 bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700">&ldquo;How can I help make today&apos;s math lesson more engaging for visual learners?&rdquo;</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      placeholder="Ask your AI teaching assistant..."
                      disabled
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-400"
                    />
                    <button
                      disabled
                      className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
