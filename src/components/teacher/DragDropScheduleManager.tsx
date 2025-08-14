"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { SessionRecord, User, SchedulingConflict } from '@/types';
import { enhancedSessionStore } from '@/store/session.store';

interface DragDropScheduleManagerProps {
  sessions: SessionRecord[];
  currentUser: User;
  onScheduleUpdate?: (updatedSessions: SessionRecord[]) => void;
  onConflictDetected?: (conflicts: SchedulingConflict[]) => void;
  className?: string;
}

interface ScheduleItem {
  id: string;
  session: SessionRecord;
  isDragging: boolean;
  conflicts: SchedulingConflict[];
}

export default function DragDropScheduleManager({
  sessions,
  currentUser,
  onScheduleUpdate,
  onConflictDetected,
  className = ''
}: DragDropScheduleManagerProps) {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<SchedulingConflict[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<Date | null>(null);

  useEffect(() => {
    // Initialize schedule items
    const items: ScheduleItem[] = sessions.map(session => ({
      id: session.id,
      session,
      isDragging: false,
      conflicts: []
    }));
    setScheduleItems(items);
  }, [sessions]);

  useEffect(() => {
    // Analyze conflicts whenever schedule changes
    analyzeConflicts();
  }, [scheduleItems]);

  const analyzeConflicts = async () => {
    setIsAnalyzing(true);
    
    try {
      const sessionData = scheduleItems.map(item => item.session);
      
      // Use the enhanced session store to detect conflicts
      const allConflicts: SchedulingConflict[] = [];
      
      // Check for time conflicts
      for (let i = 0; i < sessionData.length; i++) {
        for (let j = i + 1; j < sessionData.length; j++) {
          const session1 = sessionData[i];
          const session2 = sessionData[j];
          
          if (hasTimeConflict(session1, session2)) {
            allConflicts.push({
              type: 'time',
              description: `Sessions overlap: ${session1.subject} and ${session2.subject}`,
              severity: 'high',
              affectedSessions: [session1.id, session2.id],
              suggestedResolutions: [
                'Reschedule one session',
                'Reduce session duration',
                'Combine sessions if appropriate'
              ]
            });
          }
        }
      }

      // Check for teacher conflicts (same teacher, overlapping times)
      const teacherConflicts = detectTeacherConflicts(sessionData);
      allConflicts.push(...teacherConflicts);

      // Check for location conflicts
      const locationConflicts = detectLocationConflicts(sessionData);
      allConflicts.push(...locationConflicts);

      setConflicts(allConflicts);
      onConflictDetected?.(allConflicts);

      // Update conflicts for each schedule item
      setScheduleItems(prev => prev.map(item => ({
        ...item,
        conflicts: allConflicts.filter(conflict => 
          conflict.affectedSessions.includes(item.session.id)
        )
      })));

    } catch (error) {
      console.error('Error analyzing conflicts:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const hasTimeConflict = (session1: SessionRecord, session2: SessionRecord): boolean => {
    const start1 = new Date(session1.scheduledStart).getTime();
    const end1 = new Date(session1.scheduledEnd).getTime();
    const start2 = new Date(session2.scheduledStart).getTime();
    const end2 = new Date(session2.scheduledEnd).getTime();

    return start1 < end2 && start2 < end1;
  };

  const detectTeacherConflicts = (sessions: SessionRecord[]): SchedulingConflict[] => {
    const conflicts: SchedulingConflict[] = [];
    const teacherSessions = new Map<string, SessionRecord[]>();

    // Group sessions by teacher
    sessions.forEach(session => {
      if (!teacherSessions.has(session.teacherId)) {
        teacherSessions.set(session.teacherId, []);
      }
      teacherSessions.get(session.teacherId)!.push(session);
    });

    // Check for overlapping sessions per teacher
    teacherSessions.forEach((teacherSessions, teacherId) => {
      for (let i = 0; i < teacherSessions.length; i++) {
        for (let j = i + 1; j < teacherSessions.length; j++) {
          if (hasTimeConflict(teacherSessions[i], teacherSessions[j])) {
            conflicts.push({
              type: 'teacher',
              description: `Teacher has overlapping sessions: ${teacherSessions[i].subject} and ${teacherSessions[j].subject}`,
              severity: 'high',
              affectedSessions: [teacherSessions[i].id, teacherSessions[j].id],
              suggestedResolutions: [
                'Assign different teacher',
                'Reschedule one session',
                'Request substitute teacher'
              ]
            });
          }
        }
      }
    });

    return conflicts;
  };

  const detectLocationConflicts = (sessions: SessionRecord[]): SchedulingConflict[] => {
    const conflicts: SchedulingConflict[] = [];
    const locationSessions = new Map<string, SessionRecord[]>();

    // Group sessions by location
    sessions.forEach(session => {
      const locationKey = session.location?.address || 'unknown';
      if (!locationSessions.has(locationKey)) {
        locationSessions.set(locationKey, []);
      }
      locationSessions.get(locationKey)!.push(session);
    });

    // Check for overlapping sessions at same location
    locationSessions.forEach((locationSessions, location) => {
      for (let i = 0; i < locationSessions.length; i++) {
        for (let j = i + 1; j < locationSessions.length; j++) {
          if (hasTimeConflict(locationSessions[i], locationSessions[j])) {
            conflicts.push({
              type: 'location',
              description: `Location conflict at ${location}: ${locationSessions[i].subject} and ${locationSessions[j].subject}`,
              severity: 'medium',
              affectedSessions: [locationSessions[i].id, locationSessions[j].id],
              suggestedResolutions: [
                'Use different location',
                'Reschedule one session',
                'Convert to virtual session'
              ]
            });
          }
        }
      }
    });

    return conflicts;
  };

  const handleDragStart = (itemId: string) => {
    setDraggedItem(itemId);
    setScheduleItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, isDragging: true } : item
    ));
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setScheduleItems(prev => prev.map(item => ({ ...item, isDragging: false })));
  };

  const handleReorder = (newOrder: ScheduleItem[]) => {
    setScheduleItems(newOrder);
    
    // Update session times based on new order
    const updatedSessions = newOrder.map((item, index) => {
      const session = item.session;
      const baseTime = new Date();
      baseTime.setHours(9 + index * 2, 0, 0, 0); // Start at 9 AM, 2-hour intervals
      
      const updatedSession: SessionRecord = {
        ...session,
        scheduledStart: new Date(baseTime),
        scheduledEnd: new Date(baseTime.getTime() + 2 * 60 * 60 * 1000), // 2 hours
        updatedAt: new Date()
      };
      
      return updatedSession;
    });

    onScheduleUpdate?.(updatedSessions);
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getConflictIcon = (conflicts: SchedulingConflict[]) => {
    if (conflicts.length === 0) return null;
    
    const hasHighSeverity = conflicts.some(c => c.severity === 'high');
    const color = hasHighSeverity ? 'text-red-500' : 'text-yellow-500';
    
    return (
      <div className={`w-6 h-6 rounded-full bg-red-100 flex items-center justify-center ${color}`}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Drag & Drop Schedule Manager
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">AI Conflict Detection</span>
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* Conflict Summary */}
      {conflicts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 rounded-lg"
        >
          <div className="flex items-center space-x-2 mb-2">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-red-900">
              {conflicts.length} Conflict{conflicts.length !== 1 ? 's' : ''} Detected
            </span>
          </div>
          <p className="text-sm text-red-700">
            AI has detected scheduling conflicts. Review and resolve them to optimize your schedule.
          </p>
        </motion.div>
      )}

      {/* Schedule List */}
      <div className="space-y-2">
        <Reorder.Group
          axis="y"
          values={scheduleItems}
          onReorder={handleReorder}
          className="space-y-2"
        >
          <AnimatePresence>
            {scheduleItems.map((item) => (
              <Reorder.Item
                key={item.id}
                value={item}
                onDragStart={() => handleDragStart(item.id)}
                onDragEnd={handleDragEnd}
                className="cursor-grab active:cursor-grabbing"
              >
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`p-4 bg-white border-2 rounded-lg shadow-sm transition-all duration-200 ${
                    item.isDragging
                      ? 'border-blue-500 shadow-lg scale-105'
                      : item.conflicts.length > 0
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.session.subject}</h4>
                        <p className="text-sm text-gray-600">
                          {formatDate(item.session.scheduledStart)} • {formatTime(item.session.scheduledStart)} - {formatTime(item.session.scheduledEnd)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.session.location?.address || 'Location TBD'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {getConflictIcon(item.conflicts)}
                      
                      <div className="text-right">
                        <span className="text-xs text-gray-500">Drag to reorder</span>
                      </div>
                    </div>
                  </div>

                  {/* Conflict Details */}
                  {item.conflicts.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 pt-3 border-t border-red-200"
                    >
                      <div className="space-y-2">
                        {item.conflicts.map((conflict, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <div className="flex-1">
                              <p className="text-sm text-red-700">{conflict.description}</p>
                              <div className="mt-1">
                                <span className="text-xs text-red-600 font-medium">Suggestions:</span>
                                <ul className="text-xs text-red-600 mt-1 space-y-1">
                                  {conflict.suggestedResolutions.map((resolution, idx) => (
                                    <li key={idx} className="flex items-center space-x-1">
                                      <span>•</span>
                                      <span>{resolution}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      </div>

      {/* Analysis Status */}
      {isAnalyzing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-blue-700 font-medium">AI is analyzing schedule conflicts...</span>
        </motion.div>
      )}

      {/* Instructions */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-2">How to use:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Drag sessions to reorder them in your schedule</li>
          <li>• AI will automatically detect and highlight conflicts</li>
          <li>• Review conflict suggestions to optimize your schedule</li>
          <li>• Changes are automatically saved and synchronized</li>
        </ul>
      </div>
    </div>
  );
}
