'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DataSheet,
  DataSheetActivity,
  ActivityType,
  ActivityStatus,
  Student,
  ACTIVITY_TYPES,
} from '@/types/syllabus.types';
import { DataSheetsService } from '@/services/data-sheets.service';
import { SyllabusService } from '@/services/syllabus.service';

interface DataSheetsManagerProps {
  teacherId: string;
  selectedDate?: string;
}

export const DataSheetsManager: React.FC<DataSheetsManagerProps> = ({
  teacherId,
  selectedDate = new Date().toISOString().split('T')[0],
}) => {
  const [dataSheets, setDataSheets] = useState<DataSheet[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<DataSheet | null>(null);
  const [activities, setActivities] = useState<DataSheetActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'activities' | 'progress'
  >('overview');

  useEffect(() => {
    loadDataSheets();
    loadStudents();
  }, [teacherId, selectedDate]);

  useEffect(() => {
    if (selectedSheet) {
      loadActivities(selectedSheet.id);
    }
  }, [selectedSheet]);

  const loadDataSheets = async () => {
    setLoading(true);
    try {
      const sheets = await DataSheetsService.getDataSheetsByTeacher(
        teacherId,
        selectedDate
      );
      setDataSheets(sheets);
    } catch (error) {
      console.error('Error loading data sheets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      // This would typically come from teacher assignments
      // For now, using mock data - in real implementation, get from teacher assignments
      const mockStudents: Student[] = [
        {
          id: '770e8400-e29b-41d4-a716-446655440001',
          parentId: '550e8400-e29b-41d4-a716-446655440002',
          name: 'Emma Johnson',
          age: 6,
          country: 'UK',
          gradeLevel: 'Year 1',
          gradeSystem: 'uk_year',
          learningPreferences: {
            learningStyle: 'visual',
            interests: ['mathematics', 'art'],
            attentionSpan: 'medium',
            preferredTime: 'morning',
          },
          specialNeeds: [],
          academicStandards: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      setStudents(mockStudents);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadActivities = async (dataSheetId: string) => {
    try {
      const sheetActivities =
        await DataSheetsService.getActivitiesByDataSheet(dataSheetId);
      setActivities(sheetActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const createNewDataSheet = async (student: Student) => {
    setCreating(true);
    try {
      const newSheet = await DataSheetsService.createDataSheet({
        studentId: student.id,
        teacherId: teacherId,
        parentId: student.parentId,
        date: selectedDate,
        title: `Daily Activities - ${student.name}`,
        description: `Comprehensive activity tracking for ${student.name} on ${selectedDate}`,
        activities: [],
        progressSummary: {
          overallProgress: 0,
          areasOfStrength: [],
          areasForImprovement: [],
        },
        challenges: [],
        prompts: [],
        isTemplate: false,
      });

      if (newSheet) {
        // Create default activities
        await DataSheetsService.createDefaultActivities(
          newSheet.id,
          selectedDate
        );
        setSelectedSheet(newSheet);
        await loadDataSheets();
      }
    } catch (error) {
      console.error('Error creating data sheet:', error);
    } finally {
      setCreating(false);
    }
  };

  const updateActivity = async (
    activityId: string,
    updates: Partial<DataSheetActivity>
  ) => {
    try {
      const updated = await DataSheetsService.updateActivity(
        activityId,
        updates
      );
      if (updated && selectedSheet) {
        await loadActivities(selectedSheet.id);
      }
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  };

  const getActivityStatusColor = (status: ActivityStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-gray-100 text-gray-800';
      case 'skipped':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingStars = (rating?: number) => {
    if (!rating) {
      return null;
    }
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-sm ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Sheets</h2>
          <p className="text-gray-600">
            Manage daily activities and progress tracking
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <input
            type="date"
            value={selectedDate}
            onChange={e => (window.location.search = `?date=${e.target.value}`)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Student Selection */}
      {dataSheets.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Create Data Sheet
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map(student => (
              <motion.div
                key={student.id}
                whileHover={{ scale: 1.02 }}
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300"
                onClick={() => createNewDataSheet(student)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {student.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-600">
                      {student.gradeLevel} • {student.country}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Data Sheets List */}
      {dataSheets.length > 0 && !selectedSheet && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dataSheets.map(sheet => (
            <motion.div
              key={sheet.id}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-lg shadow-sm border p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedSheet(sheet)}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {sheet.title}
                </h3>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{sheet.date}</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-4">{sheet.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    {sheet.progressSummary.overallProgress}% Complete
                  </span>
                </div>
                <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                  View Details →
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Data Sheet Detail View */}
      {selectedSheet && (
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedSheet.title}
                </h3>
                <p className="text-gray-600">{selectedSheet.description}</p>
              </div>
              <button
                onClick={() => setSelectedSheet(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ← Back to List
              </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 mt-4">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'activities', label: 'Activities' },
                { id: 'progress', label: 'Progress' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Progress Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">
                        Overall Progress
                      </h4>
                      <div className="text-2xl font-bold text-blue-700">
                        {selectedSheet.progressSummary.overallProgress}%
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-medium text-green-900 mb-2">
                        Strengths
                      </h4>
                      <div className="text-sm text-green-700">
                        {selectedSheet.progressSummary.areasOfStrength.length >
                        0
                          ? selectedSheet.progressSummary.areasOfStrength.join(
                              ', '
                            )
                          : 'To be assessed'}
                      </div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <h4 className="font-medium text-orange-900 mb-2">
                        Focus Areas
                      </h4>
                      <div className="text-sm text-orange-700">
                        {selectedSheet.progressSummary.areasForImprovement
                          .length > 0
                          ? selectedSheet.progressSummary.areasForImprovement.join(
                              ', '
                            )
                          : 'All areas progressing well'}
                      </div>
                    </div>
                  </div>

                  {/* Activity Types Overview */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">
                      Activity Types
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {Object.entries(ACTIVITY_TYPES).map(([type, config]) => {
                        const typeActivities = activities.filter(
                          a => a.activityType === type
                        );
                        const completed = typeActivities.filter(
                          a => a.status === 'completed'
                        ).length;

                        return (
                          <div
                            key={type}
                            className="text-center p-4 bg-gray-50 rounded-lg"
                          >
                            <div className="text-2xl mb-2">{config.icon}</div>
                            <div className="font-medium text-gray-900">
                              {config.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {completed}/{typeActivities.length} completed
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'activities' && (
                <motion.div
                  key="activities"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {activities.map(activity => (
                    <div
                      key={activity.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">
                            {ACTIVITY_TYPES[activity.activityType].icon}
                          </span>
                          <div>
                            <h5 className="font-medium text-gray-900">
                              {activity.activityName}
                            </h5>
                            <p className="text-sm text-gray-600">
                              {activity.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getActivityStatusColor(activity.status)}`}
                          >
                            {activity.status.replace('_', ' ')}
                          </span>
                          {activity.rating && (
                            <div className="flex items-center">
                              {getRatingStars(activity.rating)}
                            </div>
                          )}
                        </div>
                      </div>

                      {activity.status === 'scheduled' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              updateActivity(activity.id, {
                                status: 'in_progress',
                                actualStart: new Date().toISOString(),
                              })
                            }
                            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                          >
                            Start Activity
                          </button>
                          <button
                            onClick={() =>
                              updateActivity(activity.id, { status: 'skipped' })
                            }
                            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                          >
                            Skip
                          </button>
                        </div>
                      )}

                      {activity.status === 'in_progress' && (
                        <div className="space-y-3">
                          <div className="flex space-x-2">
                            <button
                              onClick={() =>
                                updateActivity(activity.id, {
                                  status: 'completed',
                                  actualEnd: new Date().toISOString(),
                                  rating: 4,
                                })
                              }
                              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                            >
                              Complete Activity
                            </button>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Progress Notes
                            </label>
                            <textarea
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              rows={2}
                              placeholder="Add notes about the student's progress..."
                              onChange={e =>
                                updateActivity(activity.id, {
                                  progressNotes: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      )}

                      {activity.status === 'completed' &&
                        activity.progressNotes && (
                          <div className="mt-3 p-3 bg-green-50 rounded-md">
                            <p className="text-sm text-green-800">
                              {activity.progressNotes}
                            </p>
                          </div>
                        )}
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'progress' && (
                <motion.div
                  key="progress"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="text-center py-8">
                    <p className="text-gray-600">
                      Progress tracking charts and analytics coming soon...
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};
