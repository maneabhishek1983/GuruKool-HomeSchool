'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/design-system/components/base/Card';
import { User, SessionRecord } from '@/types';
import { AILessonPlanSuggestions } from './AILessonPlanSuggestions';
import { VoiceToTextNotes } from './VoiceToTextNotes';
import { LocationAwareSessionManager } from './LocationAwareSessionManager';
import { DragDropScheduleManager } from './DragDropScheduleManager';
import { enhancedSessionStore } from '@/store/session.store';

interface TeacherDashboardProps {
  user: User;
  className?: string;
}

interface DashboardStats {
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  activeSession: SessionRecord | null;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  user,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'schedule' | 'lessons' | 'notes'
  >('overview');
  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 0,
    completedSessions: 0,
    upcomingSessions: 0,
    activeSession: null,
  });
  const [recentSessions, setRecentSessions] = useState<SessionRecord[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionRecord | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user.id]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Load teacher's sessions
      const sessions = await enhancedSessionStore.getSessionsWithInsights({
        teacherId: user.id,
        includeAIInsights: true,
        includeAnalytics: true,
        sortBy: 'date',
        sortOrder: 'desc',
        limit: 50,
      });

      // Calculate stats
      const now = new Date();
      const completedSessions = sessions.filter(s => s.status === 'completed');
      const upcomingSessions = sessions.filter(
        s => s.status === 'scheduled' && s.scheduledStart > now
      );
      const activeSession =
        sessions.find(s => s.status === 'in-progress') || null;

      setStats({
        totalSessions: sessions.length,
        completedSessions: completedSessions.length,
        upcomingSessions: upcomingSessions.length,
        activeSession,
      });

      // Set recent sessions (last 10)
      setRecentSessions(sessions.slice(0, 10));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionUpdate = (session: SessionRecord) => {
    setRecentSessions(prev =>
      prev.map(s => (s.id === session.id ? session : s))
    );

    if (session.status === 'in-progress') {
      setStats(prev => ({ ...prev, activeSession: session }));
    } else if (prev => prev.activeSession?.id === session.id) {
      setStats(prev => ({ ...prev, activeSession: null }));
    }
  };

  const handleScheduleUpdate = (sessions: SessionRecord[]) => {
    // Update recent sessions with new schedule data
    setRecentSessions(prev => {
      const updatedSessions = [...prev];
      sessions.forEach(updatedSession => {
        const index = updatedSessions.findIndex(
          s => s.id === updatedSession.id
        );
        if (index !== -1) {
          updatedSessions[index] = updatedSession;
        }
      });
      return updatedSessions;
    });
  };

  const formatSessionTime = (session: SessionRecord): string => {
    const start = new Date(session.scheduledStart);
    const end = new Date(session.scheduledEnd);
    return `${start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })} - ${end.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })}`;
  };

  const getSessionStatusColor = (status: string): string => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'schedule', label: 'Schedule', icon: '📅' },
    { id: 'lessons', label: 'Lesson Plans', icon: '📚' },
    { id: 'notes', label: 'Session Notes', icon: '📝' },
  ];

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Teacher Dashboard
          </h1>
          <p className="text-gray-600">Welcome back, {user.name}</p>
        </div>

        {stats.activeSession && (
          <div className="flex items-center gap-3 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div>
              <p className="text-sm font-medium text-green-900">
                Active Session
              </p>
              <p className="text-xs text-green-700">
                {stats.activeSession.subject} - {stats.activeSession.studentId}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalSessions}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.completedSessions}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⏰</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.upcomingSessions}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalSessions > 0
                  ? Math.round(
                      (stats.completedSessions / stats.totalSessions) * 100
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Sessions */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recent Sessions
                </h3>
                {recentSessions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No sessions found
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentSessions.slice(0, 5).map(session => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                        onClick={() => setSelectedSession(session)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">
                              {session.subject}
                            </h4>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${getSessionStatusColor(session.status)}`}
                            >
                              {session.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Student: {session.studentId}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(
                              session.scheduledStart
                            ).toLocaleDateString()}{' '}
                            • {formatSessionTime(session)}
                          </p>
                        </div>
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Location & Session Management */}
              <LocationAwareSessionManager
                teacherId={user.id}
                user={user}
                onSessionUpdate={handleSessionUpdate}
              />
            </div>
          )}

          {activeTab === 'schedule' && (
            <DragDropScheduleManager
              teacherId={user.id}
              user={user}
              onScheduleUpdate={handleScheduleUpdate}
            />
          )}

          {activeTab === 'lessons' && (
            <div className="space-y-6">
              {selectedSession ? (
                <AILessonPlanSuggestions
                  studentId={selectedSession.studentId}
                  teacherId={user.id}
                  subject={selectedSession.subject}
                  user={user}
                />
              ) : (
                <Card className="p-6 text-center">
                  <p className="text-gray-500 mb-4">
                    Select a session to view AI lesson plan suggestions
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {recentSessions.slice(0, 6).map(session => (
                      <button
                        key={session.id}
                        onClick={() => setSelectedSession(session)}
                        className="p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50"
                      >
                        <h4 className="font-medium text-gray-900">
                          {session.subject}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Student: {session.studentId}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(
                            session.scheduledStart
                          ).toLocaleDateString()}
                        </p>
                      </button>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-6">
              {selectedSession ? (
                <VoiceToTextNotes
                  sessionId={selectedSession.id}
                  user={user}
                  onNotesUpdate={notes => {
                    // Update session notes in local state
                    setRecentSessions(prev =>
                      prev.map(s =>
                        s.id === selectedSession.id ? { ...s, notes } : s
                      )
                    );
                  }}
                />
              ) : (
                <Card className="p-6 text-center">
                  <p className="text-gray-500 mb-4">
                    Select a session to add voice-to-text notes
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {recentSessions.slice(0, 6).map(session => (
                      <button
                        key={session.id}
                        onClick={() => setSelectedSession(session)}
                        className="p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50"
                      >
                        <h4 className="font-medium text-gray-900">
                          {session.subject}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Student: {session.studentId}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(
                            session.scheduledStart
                          ).toLocaleDateString()}
                        </p>
                        {session.notes && (
                          <div className="mt-2 flex items-center gap-1 text-green-600">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span className="text-xs">Has notes</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Session Details Modal */}
      <AnimatePresence>
        {selectedSession && activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setSelectedSession(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Session Details
                </h3>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Subject
                    </label>
                    <p className="text-gray-900">{selectedSession.subject}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Student
                    </label>
                    <p className="text-gray-900">{selectedSession.studentId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full ${getSessionStatusColor(selectedSession.status)}`}
                    >
                      {selectedSession.status}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Duration
                    </label>
                    <p className="text-gray-900">
                      {formatSessionTime(selectedSession)}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <p className="text-gray-900">
                    {selectedSession.location.address}
                  </p>
                </div>

                {selectedSession.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Notes
                    </label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {selectedSession.notes}
                      </p>
                    </div>
                  </div>
                )}

                {selectedSession.aiInsights &&
                  selectedSession.aiInsights.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        AI Insights
                      </label>
                      <div className="mt-1 space-y-2">
                        {selectedSession.aiInsights.map(insight => (
                          <div
                            key={insight.id}
                            className="p-3 bg-purple-50 border border-purple-200 rounded-lg"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-purple-900">
                                {insight.type}
                              </span>
                              <span className="text-xs text-purple-600">
                                {Math.round(insight.confidence * 100)}%
                                confidence
                              </span>
                            </div>
                            <p className="text-sm text-purple-800">
                              {insight.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
