'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';

interface TimesheetEntry {
  id: string;
  session_id?: string;
  teacher_id: string;
  student_id: string;
  student_name?: string;
  parent_id?: string;
  session_start: string;
  session_end?: string;
  duration_minutes?: number;
  hourly_rate?: number;
  total_amount?: number;
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
}

interface TimesheetManagerProps {
  teacherId: string;
  userId: string;
  onClose?: () => void;
  onStartSession?: () => void;
}

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const TimesheetManager: React.FC<TimesheetManagerProps> = ({
  teacherId,
  userId,
  onClose,
  onStartSession,
}) => {
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>([]);
  const [activeSession, setActiveSession] = useState<TimesheetEntry | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'reports'>(
    'current'
  );
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  // Update elapsed time every second for active session
  useEffect(() => {
    if (!activeSession) {
      setElapsedTime('00:00:00');
      return;
    }

    const updateElapsed = () => {
      const startTime = new Date(activeSession.session_start).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);

      const hours = Math.floor(elapsed / 3600);
      const minutes = Math.floor((elapsed % 3600) / 60);
      const seconds = elapsed % 60;

      setElapsedTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const loadTimesheets = useCallback(async () => {
    setLoading(true);
    try {
      // Try to fetch from API first (uses admin client to bypass RLS)
      const teacherIdsToCheck = [teacherId];
      if (userId && userId !== teacherId) {
        teacherIdsToCheck.push(userId);
      }

      // Fetch active session
      const activeResponse = await fetch(
        `/api/teacher-sessions/active?userId=${userId}`
      );
      if (activeResponse.ok) {
        const activeData = await activeResponse.json();
        if (activeData.hasActiveSession && activeData.session) {
          setActiveSession({
            id: activeData.session.id,
            teacher_id: activeData.session.teacher_id,
            student_id: activeData.session.student_id,
            student_name: activeData.session.student_name,
            session_start: activeData.session.session_start,
            status: 'active',
          });
        } else {
          setActiveSession(null);
        }
      }

      // Fetch session history from teacher_sessions
      const { data: sessions, error } = await supabase
        .from('teacher_sessions')
        .select(
          `
          id,
          teacher_id,
          student_id,
          session_start,
          session_end,
          duration_minutes,
          notes,
          students:student_id (name)
        `
        )
        .in('teacher_id', teacherIdsToCheck)
        .not('session_end', 'is', null)
        .order('session_start', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching sessions:', error);
      } else if (sessions) {
        const formattedSessions: TimesheetEntry[] = sessions.map((s: any) => ({
          id: s.id,
          teacher_id: s.teacher_id,
          student_id: s.student_id,
          student_name: s.students?.name || 'Unknown Student',
          session_start: s.session_start,
          session_end: s.session_end,
          duration_minutes: s.duration_minutes,
          status: 'completed' as const,
          notes: s.notes,
        }));
        setTimesheets(formattedSessions);
      }
    } catch (error) {
      console.error('Error loading timesheets:', error);
    } finally {
      setLoading(false);
    }
  }, [teacherId, userId]);

  useEffect(() => {
    loadTimesheets();
  }, [loadTimesheets, selectedDate]);

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      paused: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const calculateTotalHours = () => {
    return timesheets.reduce((total, timesheet) => {
      return total + (timesheet.duration_minutes || 0);
    }, 0);
  };

  const calculateTotalEarnings = () => {
    return timesheets.reduce((total, timesheet) => {
      // Default rate of 25 GBP/hour if not specified
      const rate = timesheet.hourly_rate || 25;
      const hours = (timesheet.duration_minutes || 0) / 60;
      return total + hours * rate;
    }, 0);
  };

  const handleStartSession = () => {
    if (onStartSession) {
      onStartSession();
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600 text-center">Loading timesheets...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Timesheet Management
            </h2>
            <p className="text-gray-600 mt-1">
              Track your teaching sessions and earnings
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
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
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Hours</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatDuration(calculateTotalHours())}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Earnings</p>
            <p className="text-2xl font-bold text-green-600">
              £{calculateTotalEarnings().toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Sessions</p>
            <p className="text-2xl font-bold text-purple-600">
              {timesheets.length}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex space-x-4">
          {[
            { id: 'current', label: 'Current Session' },
            { id: 'history', label: 'History' },
            { id: 'reports', label: 'Reports' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'current' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Current Session
              </h3>
              {!activeSession && (
                <button
                  onClick={handleStartSession}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                  Start New Session (Scan QR)
                </button>
              )}
            </div>

            {!activeSession ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-gray-600">No active session</p>
                <p className="text-sm text-gray-500 mt-2">
                  Click "Start New Session" to scan a student's QR code and
                  begin
                </p>
              </div>
            ) : (
              <div className="border-2 border-green-200 bg-green-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-green-700 font-medium">
                      Session In Progress
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor('active')}`}
                  >
                    Active
                  </span>
                </div>

                <div className="text-center mb-6">
                  <p className="text-sm text-gray-600 mb-1">Session Duration</p>
                  <p className="text-4xl font-mono font-bold text-green-700">
                    {elapsedTime}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Student</p>
                    <p className="font-medium text-gray-900">
                      {activeSession.student_name || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Started</p>
                    <p className="font-medium text-gray-900">
                      {new Date(
                        activeSession.session_start
                      ).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleStartSession}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                      />
                    </svg>
                    End Session (Scan QR)
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Session History
              </h3>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            {timesheets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No sessions found</p>
                <p className="text-sm text-gray-500 mt-2">
                  Complete sessions will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {timesheets.map(timesheet => (
                  <div
                    key={timesheet.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {timesheet.student_name || 'Session'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {new Date(
                            timesheet.session_start
                          ).toLocaleDateString()}{' '}
                          {new Date(
                            timesheet.session_start
                          ).toLocaleTimeString()}{' '}
                          -{' '}
                          {timesheet.session_end
                            ? new Date(
                                timesheet.session_end
                              ).toLocaleTimeString()
                            : 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Duration:{' '}
                          {formatDuration(timesheet.duration_minutes || 0)}
                        </p>
                        {timesheet.notes && (
                          <p className="text-sm text-gray-600 mt-1">
                            {timesheet.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(timesheet.status)}`}
                        >
                          {timesheet.status}
                        </span>
                        {timesheet.duration_minutes && (
                          <p className="text-sm font-medium text-gray-900 mt-1">
                            £
                            {((timesheet.duration_minutes / 60) * 25).toFixed(
                              2
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'reports' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              Timesheet Reports
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Summary</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Hours:</span>
                    <span className="font-medium">
                      {formatDuration(calculateTotalHours())}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Earnings:</span>
                    <span className="font-medium">
                      £{calculateTotalEarnings().toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Rate:</span>
                    <span className="font-medium">
                      £
                      {calculateTotalHours() > 0
                        ? (
                            calculateTotalEarnings() /
                            (calculateTotalHours() / 60)
                          ).toFixed(2)
                        : '0.00'}
                      /hour
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Sessions:</span>
                    <span className="font-medium">{timesheets.length}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">
                  Quick Actions
                </h4>
                <div className="space-y-3">
                  <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Export Timesheet (CSV)
                  </button>
                  <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                    Generate Invoice
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
