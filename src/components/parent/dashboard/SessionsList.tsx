'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimesheetService, TimesheetEntry } from '@/services/timesheet.service';
import { StudentProfile, TeacherProfile } from '@/types';
import { SectionTitle } from '@/components/layouts/LiquidLearningLayout';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

interface SessionsListProps {
  parentId: string;
  students: StudentProfile[];
  teachers: TeacherProfile[];
}

export default function SessionsList({
  parentId,
  students,
  teachers,
}: SessionsListProps) {
  const [sessions, setSessions] = useState<TimesheetEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [selectedStudent, setSelectedStudent] = useState<string>('all');

  useEffect(() => {
    loadSessions();
  }, [parentId, filter, selectedStudent]);

  const loadSessions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all sessions for this parent
      const entries = await TimesheetService.getParentTimesheet(parentId);

      // Apply client-side filters
      let filteredEntries = entries;

      // Filter by student if selected
      if (selectedStudent !== 'all') {
        filteredEntries = filteredEntries.filter(
          (e) => e.student_id === selectedStudent
        );
      }

      // Filter by status
      if (filter === 'active') {
        filteredEntries = filteredEntries.filter(
          (e) => e.status === 'checked_in'
        );
      } else if (filter === 'completed') {
        filteredEntries = filteredEntries.filter(
          (e) => e.status === 'checked_out'
        );
      }

      // Sort by check-in time (most recent first)
      filteredEntries.sort(
        (a, b) =>
          new Date(b.check_in_time).getTime() -
          new Date(a.check_in_time).getTime()
      );

      setSessions(filteredEntries);
    } catch (err) {
      console.error('Error loading sessions:', err);
      setError('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const getStudentName = (studentId: string): string => {
    const student = students.find((s) => s.id === studentId);
    return student?.name || 'Unknown Student';
  };

  const getTeacherName = (teacherId: string): string => {
    const teacher = teachers.find((t) => t.id === teacherId);
    return teacher?.name || 'Unknown Teacher';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number | undefined): string => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const activeCount = sessions.filter((s) => s.status === 'checked_in').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <SectionTitle subtitle="View teaching sessions for your children">
          Sessions
        </SectionTitle>

        {/* Active indicator */}
        {activeCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium text-green-700">
              {activeCount} Active Session{activeCount > 1 ? 's' : ''}
            </span>
          </motion.div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Status Filter */}
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-1 border border-slate-200/50">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Student Filter */}
        {students.length > 1 && (
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">All Students</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-12 text-center border border-slate-200/50">
          <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading sessions...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50/90 backdrop-blur-xl rounded-2xl p-8 text-center border border-red-200/50">
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadSessions}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : sessions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-12 text-center border border-slate-200/50"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-sky-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-sky-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            No Sessions Yet
          </h3>
          <p className="text-slate-600 max-w-md mx-auto">
            When teachers check in with your students using QR codes, their
            sessions will appear here.
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden"
        >
          {/* Table Header */}
          <div className="grid grid-cols-6 gap-4 px-6 py-4 bg-slate-50/80 border-b border-slate-200/50 text-sm font-semibold text-slate-600">
            <div>Date</div>
            <div>Student</div>
            <div>Teacher</div>
            <div>Check-In</div>
            <div>Check-Out</div>
            <div>Duration</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-slate-100">
            <AnimatePresence>
              {sessions.map((session) => (
                <motion.div
                  key={session.id}
                  variants={itemVariants}
                  className="grid grid-cols-6 gap-4 px-6 py-4 hover:bg-sky-50/50 transition-colors"
                >
                  <div className="text-slate-900 font-medium">
                    {formatDate(session.check_in_time)}
                  </div>
                  <div className="text-slate-700">
                    {getStudentName(session.student_id)}
                  </div>
                  <div className="text-slate-700">
                    {getTeacherName(session.teacher_id)}
                  </div>
                  <div className="text-slate-600">
                    {formatTime(session.check_in_time)}
                  </div>
                  <div className="text-slate-600">
                    {session.check_out_time
                      ? formatTime(session.check_out_time)
                      : '-'}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-700">
                      {formatDuration(session.duration_minutes)}
                    </span>
                    {session.status === 'checked_in' && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Summary Footer */}
          <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-200/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">
                Showing {sessions.length} session
                {sessions.length !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-6">
                <span className="text-slate-600">
                  Total:{' '}
                  <strong className="text-slate-900">
                    {formatDuration(
                      sessions.reduce(
                        (sum, s) => sum + (s.duration_minutes || 0),
                        0
                      )
                    )}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
