'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { timesheetService, TimesheetEntry } from '@/services/timesheet.service';
import { useAuthContext } from '@/lib/authContext';

interface TimesheetViewProps {
  role: 'teacher' | 'parent';
  userId: string;
}

export function TimesheetView({ role, userId }: TimesheetViewProps) {
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('week');
  const [summary, setSummary] = useState({
    totalHours: 0,
    totalMinutes: 0,
    entriesCount: 0,
  });

  useEffect(() => {
    loadTimesheet();
  }, [userId, dateRange]);

  const loadTimesheet = async () => {
    try {
      setIsLoading(true);

      const { startDate, endDate } = getDateRange();

      // SIMPLIFIED: Service layer now handles querying both tables
      const fetchedEntries =
        role === 'teacher'
          ? await timesheetService.getTeacherTimesheet(
              userId,
              startDate,
              endDate
            )
          : await timesheetService.getParentTimesheet(
              userId,
              startDate,
              endDate
            );

      setEntries(fetchedEntries);
      calculateSummary(fetchedEntries);
    } catch (error) {
      console.error('Error loading timesheet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDateRange = (): { startDate: Date; endDate: Date } => {
    const endDate = new Date();
    const startDate = new Date();

    switch (dateRange) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'all':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    return { startDate, endDate };
  };

  const calculateSummary = (entries: TimesheetEntry[]) => {
    const completedEntries = entries.filter(
      e => e.status === 'checked_out' && e.duration_minutes
    );

    const totalMinutes = completedEntries.reduce(
      (sum, e) => sum + (e.duration_minutes || 0),
      0
    );

    setSummary({
      totalHours: Math.round((totalMinutes / 60) * 100) / 100,
      totalMinutes,
      entriesCount: completedEntries.length,
    });
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Range Selector */}
      <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-neutral-900">Timesheet</h2>

          <div className="flex gap-2">
            {(['week', 'month', 'all'] as const).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {range === 'week'
                  ? 'This Week'
                  : range === 'month'
                    ? 'This Month'
                    : 'All Time'}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-primary-50 border border-primary-200 rounded-xl"
          >
            <p className="text-sm text-primary-600 mb-1">Total Hours</p>
            <p className="text-3xl font-bold text-primary-900">
              {summary.totalHours}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 bg-success-50 border border-success-200 rounded-xl"
          >
            <p className="text-sm text-success-600 mb-1">Sessions</p>
            <p className="text-3xl font-bold text-success-900">
              {summary.entriesCount}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 bg-blue-50 border border-blue-200 rounded-xl"
          >
            <p className="text-sm text-blue-600 mb-1">Avg Session</p>
            <p className="text-3xl font-bold text-blue-900">
              {summary.entriesCount > 0
                ? formatDuration(
                    Math.round(summary.totalMinutes / summary.entriesCount)
                  )
                : '0h 0m'}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Timesheet Entries */}
      <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 p-6">
        <h3 className="text-lg font-bold text-neutral-900 mb-4">
          Detailed Entries
        </h3>

        {entries.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-neutral-600 text-lg mb-2">No entries found</p>
            <p className="text-neutral-500 text-sm">
              {dateRange === 'week'
                ? 'No check-ins this week'
                : dateRange === 'month'
                  ? 'No check-ins this month'
                  : 'No check-ins recorded'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          entry.status === 'checked_in'
                            ? 'bg-success-500 animate-pulse'
                            : 'bg-neutral-400'
                        }`}
                      />
                      <p className="font-semibold text-neutral-900">
                        {formatDate(entry.check_in_time)}
                      </p>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          entry.status === 'checked_in'
                            ? 'bg-success-100 text-success-700'
                            : 'bg-neutral-200 text-neutral-700'
                        }`}
                      >
                        {entry.status === 'checked_in'
                          ? 'In Progress'
                          : 'Completed'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-neutral-500">Check In</p>
                        <p className="font-medium text-neutral-900">
                          {formatTime(entry.check_in_time)}
                        </p>
                      </div>

                      {entry.check_out_time && (
                        <div>
                          <p className="text-neutral-500">Check Out</p>
                          <p className="font-medium text-neutral-900">
                            {formatTime(entry.check_out_time)}
                          </p>
                        </div>
                      )}

                      {entry.duration_minutes && (
                        <div>
                          <p className="text-neutral-500">Duration</p>
                          <p className="font-medium text-primary-600">
                            {formatDuration(entry.duration_minutes)}
                          </p>
                        </div>
                      )}

                      {entry.location?.address && (
                        <div>
                          <p className="text-neutral-500">Location</p>
                          <p className="font-medium text-neutral-900 truncate">
                            {entry.location.address}
                          </p>
                        </div>
                      )}
                    </div>

                    {entry.notes && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-neutral-200">
                        <p className="text-xs text-neutral-500 mb-1">Notes:</p>
                        <p className="text-sm text-neutral-700">
                          {entry.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 p-6">
        <h3 className="text-lg font-bold text-neutral-900 mb-4">
          Export & Reports
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button className="px-4 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-xl transition-colors">
            📄 Export to PDF
          </button>
          <button className="px-4 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-xl transition-colors">
            📊 Export to Excel
          </button>
          <button className="px-4 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-xl transition-colors">
            📧 Email Report
          </button>
        </div>
      </div>
    </div>
  );
}
