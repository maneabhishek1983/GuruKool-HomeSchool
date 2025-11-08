'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/design-system/components/base/Card';
import { SessionRecord } from '@/types/session.types';
import { User } from '@/types';
import {
  SessionStatus,
  SchedulingRequest,
  SchedulingResult,
} from '@/types/session.types';
import { enhancedSessionStore } from '@/store/session.store';

interface TimeSlot {
  id: string;
  start: Date;
  end: Date;
  duration: number;
}

interface DraggedSession {
  session: SessionRecord;
  originalSlot: TimeSlot;
}

interface ConflictInfo {
  type: 'time' | 'location' | 'teacher' | 'student';
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestions: string[];
}

interface DragDropScheduleManagerProps {
  teacherId: string;
  user: User;
  onScheduleUpdate?: (sessions: SessionRecord[]) => void;
  className?: string;
}

export const DragDropScheduleManager: React.FC<
  DragDropScheduleManagerProps
> = ({ teacherId, user, onScheduleUpdate, className = '' }) => {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [draggedSession, setDraggedSession] = useState<DraggedSession | null>(
    null
  );
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  useEffect(() => {
    loadScheduleData();
    generateTimeSlots();
  }, [teacherId, selectedDate, viewMode]);

  const loadScheduleData = async () => {
    try {
      setIsLoading(true);

      const startDate = new Date(selectedDate);
      const endDate = new Date(selectedDate);

      if (viewMode === 'week') {
        startDate.setDate(startDate.getDate() - startDate.getDay());
        endDate.setDate(startDate.getDate() + 6);
      }

      endDate.setHours(23, 59, 59, 999);

      const teacherSessions =
        await enhancedSessionStore.getSessionsWithInsights({
          teacherId,
          dateRange: { start: startDate, end: endDate },
          sortBy: 'date',
          sortOrder: 'asc',
        });

      setSessions(teacherSessions);
      onScheduleUpdate?.(teacherSessions);
    } catch (error) {
      console.error('Failed to load schedule data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateTimeSlots = () => {
    const slots: TimeSlot[] = [];
    const startHour = 8; // 8 AM
    const endHour = 18; // 6 PM
    const slotDuration = 60; // 60 minutes

    if (viewMode === 'day') {
      for (let hour = startHour; hour < endHour; hour++) {
        const start = new Date(selectedDate);
        start.setHours(hour, 0, 0, 0);

        const end = new Date(start);
        end.setMinutes(end.getMinutes() + slotDuration);

        slots.push({
          id: `slot-${hour}`,
          start,
          end,
          duration: slotDuration,
        });
      }
    } else {
      // Week view - generate slots for each day
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(selectedDate);
        currentDate.setDate(currentDate.getDate() - currentDate.getDay() + day);

        for (let hour = startHour; hour < endHour; hour++) {
          const start = new Date(currentDate);
          start.setHours(hour, 0, 0, 0);

          const end = new Date(start);
          end.setMinutes(end.getMinutes() + slotDuration);

          slots.push({
            id: `slot-${day}-${hour}`,
            start,
            end,
            duration: slotDuration,
          });
        }
      }
    }

    setTimeSlots(slots);
  };

  const handleDragStart = (session: SessionRecord, originalSlot: TimeSlot) => {
    setDraggedSession({ session, originalSlot });
  };

  const handleDragOver = (e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    setDragOverSlot(slotId);
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = async (e: React.DragEvent, targetSlot: TimeSlot) => {
    e.preventDefault();
    setDragOverSlot(null);

    if (!draggedSession) {
      return;
    }

    const { session } = draggedSession;

    // Check for conflicts
    const detectedConflicts = await detectSchedulingConflicts(
      session,
      targetSlot
    );

    if (detectedConflicts.length > 0) {
      setConflicts(detectedConflicts);
      return;
    }

    // Update session with new time
    await updateSessionSchedule(session, targetSlot);
    setDraggedSession(null);
  };

  const detectSchedulingConflicts = async (
    session: SessionRecord,
    newSlot: TimeSlot
  ): Promise<ConflictInfo[]> => {
    const conflicts: ConflictInfo[] = [];

    // Check for time conflicts with other sessions
    const conflictingSessions = sessions.filter(
      s =>
        s.id !== session.id &&
        s.status !== 'cancelled' &&
        isTimeOverlap(newSlot, {
          start: s.scheduledStart,
          end: s.scheduledEnd,
        })
    );

    if (conflictingSessions.length > 0) {
      conflicts.push({
        type: 'time',
        description: `Time conflict with ${conflictingSessions.length} existing session(s)`,
        severity: 'high',
        suggestions: [
          'Choose a different time slot',
          'Reschedule conflicting sessions',
          'Extend session duration if needed',
        ],
      });
    }

    // Check for location conflicts (if sessions are at the same location)
    const locationConflicts = conflictingSessions.filter(
      s => s.location.address === session.location.address
    );

    if (locationConflicts.length > 0) {
      conflicts.push({
        type: 'location',
        description: `Location conflict at ${session.location.address}`,
        severity: 'medium',
        suggestions: [
          'Change session location',
          'Schedule sessions back-to-back',
          'Allow travel time between sessions',
        ],
      });
    }

    // Check for student conflicts
    const studentConflicts = conflictingSessions.filter(
      s => s.studentId === session.studentId
    );

    if (studentConflicts.length > 0) {
      conflicts.push({
        type: 'student',
        description: `Student has another session at this time`,
        severity: 'high',
        suggestions: [
          'Choose a different time slot',
          'Combine sessions if appropriate',
          'Reschedule one of the sessions',
        ],
      });
    }

    return conflicts;
  };

  const isTimeOverlap = (
    slot1: { start: Date; end: Date },
    slot2: { start: Date; end: Date }
  ): boolean => {
    return slot1.start < slot2.end && slot1.end > slot2.start;
  };

  const updateSessionSchedule = async (
    session: SessionRecord,
    newSlot: TimeSlot
  ) => {
    try {
      const updatedSession = await enhancedSessionStore.updateSession(
        {
          sessionId: session.id,
          updates: {
            scheduledStart: newSlot.start,
            scheduledEnd: newSlot.end,
          },
          requestedBy: user.id,
          reason: 'Schedule rearrangement via drag and drop',
        },
        user
      );

      if (updatedSession) {
        // Reload schedule data
        await loadScheduleData();
      }
    } catch (error) {
      console.error('Failed to update session schedule:', error);
    }
  };

  const resolveConflict = async (
    conflictIndex: number,
    resolution: 'force' | 'cancel'
  ) => {
    if (resolution === 'cancel') {
      setConflicts([]);
      setDraggedSession(null);
      return;
    }

    if (resolution === 'force' && draggedSession) {
      const targetSlot = timeSlots.find(slot => slot.id === dragOverSlot);
      if (targetSlot) {
        await updateSessionSchedule(draggedSession.session, targetSlot);
      }
      setConflicts([]);
      setDraggedSession(null);
    }
  };

  const getSessionsForSlot = (slot: TimeSlot): SessionRecord[] => {
    return sessions.filter(session => {
      const sessionStart = new Date(session.scheduledStart);
      const sessionEnd = new Date(session.scheduledEnd);

      return (
        (sessionStart.getTime() >= slot.start.getTime() &&
          sessionStart.getTime() < slot.end.getTime()) ||
        (sessionStart.getTime() < slot.start.getTime() &&
          sessionEnd.getTime() > slot.start.getTime())
      );
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getSessionStatusColor = (status: SessionStatus): string => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in-progress':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    }
    setSelectedDate(newDate);
  };

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Schedule Manager
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'day'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Week
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 hover:bg-gray-100 rounded"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <h4 className="text-lg font-medium text-gray-900">
            {viewMode === 'day'
              ? formatDate(selectedDate)
              : `Week of ${formatDate(selectedDate)}`}
          </h4>

          <button
            onClick={() => navigateDate('next')}
            className="p-2 hover:bg-gray-100 rounded"
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </Card>

      {/* Schedule Grid */}
      <Card className="p-4">
        <div
          className={`grid gap-2 ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-1'}`}
        >
          {viewMode === 'week' && (
            <>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div
                  key={day}
                  className="text-center font-medium text-gray-700 py-2 border-b"
                >
                  {day}
                </div>
              ))}
            </>
          )}

          {timeSlots.map(slot => {
            const slotSessions = getSessionsForSlot(slot);
            const isDragOver = dragOverSlot === slot.id;

            return (
              <div
                key={slot.id}
                className={`min-h-[80px] p-2 border-2 border-dashed rounded-lg transition-colors ${
                  isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                }`}
                onDragOver={e => handleDragOver(e, slot.id)}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, slot)}
              >
                <div className="text-xs text-gray-500 mb-2">
                  {formatTime(slot.start)} - {formatTime(slot.end)}
                </div>

                <div className="space-y-1">
                  {slotSessions.map(session => (
                    <motion.div
                      key={session.id}
                      draggable
                      onDragStart={() => handleDragStart(session, slot)}
                      className={`p-2 rounded border cursor-move ${getSessionStatusColor(session.status)}`}
                      whileHover={{ scale: 1.02 }}
                      whileDrag={{ scale: 1.05, rotate: 2 }}
                    >
                      <div className="text-sm font-medium">
                        {session.subject}
                      </div>
                      <div className="text-xs">
                        Student: {session.studentId}
                      </div>
                      <div className="text-xs">{session.location.address}</div>
                    </motion.div>
                  ))}
                </div>

                {slotSessions.length === 0 && (
                  <div className="text-center text-gray-400 text-sm py-4">
                    Drop session here
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Conflict Resolution Modal */}
      <AnimatePresence>
        {conflicts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Scheduling Conflicts Detected
              </h3>

              <div className="space-y-4 mb-6">
                {conflicts.map((conflict, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      conflict.severity === 'high'
                        ? 'bg-red-50 border border-red-200'
                        : conflict.severity === 'medium'
                          ? 'bg-yellow-50 border border-yellow-200'
                          : 'bg-blue-50 border border-blue-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          conflict.severity === 'high'
                            ? 'bg-red-500'
                            : conflict.severity === 'medium'
                              ? 'bg-yellow-500'
                              : 'bg-blue-500'
                        }`}
                      ></div>
                      <span className="font-medium text-gray-900">
                        {conflict.description}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600">
                      <p className="font-medium mb-1">Suggestions:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {conflict.suggestions.map((suggestion, idx) => (
                          <li key={idx}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => resolveConflict(0, 'force')}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                >
                  Force Schedule
                </button>
                <button
                  onClick={() => resolveConflict(0, 'cancel')}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      <Card className="p-4">
        <h4 className="font-medium text-gray-900 mb-2">How to Use</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Drag sessions to different time slots to reschedule</li>
          <li>• Conflicts will be automatically detected and highlighted</li>
          <li>• Use day/week view to see different schedule perspectives</li>
          <li>• Sessions are color-coded by status</li>
        </ul>
      </Card>
    </div>
  );
};
