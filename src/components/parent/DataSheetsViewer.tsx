'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DataSheet,
  DataSheetActivity,
  ActivityType,
} from '@/types/syllabus.types';
import { DataSheetsService } from '@/services/data-sheets.service';

interface DataSheetsViewerProps {
  studentId: string;
  studentName: string;
  onClose: () => void;
}

export const DataSheetsViewer: React.FC<DataSheetsViewerProps> = ({
  studentId,
  studentName,
  onClose,
}) => {
  const [dataSheets, setDataSheets] = useState<DataSheet[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<DataSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'activities' | 'progress'
  >('overview');

  useEffect(() => {
    loadDataSheets();
  }, [studentId]);

  const loadDataSheets = async () => {
    setLoading(true);
    try {
      const sheets = await DataSheetsService.getDataSheetsByStudent(studentId);
      setDataSheets(sheets);
      if (sheets.length > 0) {
        setSelectedSheet(sheets[0]);
      }
    } catch (error) {
      console.error('Error loading data sheets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityTypeColor = (type: ActivityType) => {
    const colors = {
      sensory: 'bg-purple-100 text-purple-800',
      writing: 'bg-blue-100 text-blue-800',
      communication: 'bg-green-100 text-green-800',
      social: 'bg-yellow-100 text-yellow-800',
      academics: 'bg-red-100 text-red-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getRatingStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading data sheets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Data Sheets - {studentName}
            </h2>
            <p className="text-gray-600 mt-1">
              {dataSheets.length} data sheet{dataSheets.length !== 1 ? 's' : ''}{' '}
              available
            </p>
          </div>
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
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar - Data Sheets List */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Data Sheets</h3>
              {dataSheets.length === 0 ? (
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600">No data sheets available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {dataSheets.map(sheet => (
                    <motion.div
                      key={sheet.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedSheet(sheet)}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedSheet?.id === sheet.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {sheet.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {new Date(sheet.date).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          {sheet.activities.length} activities
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Selected Data Sheet */}
          <div className="flex-1 overflow-y-auto">
            {selectedSheet ? (
              <div className="p-6">
                {/* Tabs */}
                <div className="flex space-x-4 mb-6 border-b border-gray-200">
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'activities', label: 'Activities' },
                    { id: 'progress', label: 'Progress' },
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

                {/* Tab Content */}
                {activeTab === 'overview' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {selectedSheet.title}
                      </h3>
                      <p className="text-gray-600">
                        {selectedSheet.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Activities
                        </h4>
                        <p className="text-2xl font-bold text-blue-600">
                          {selectedSheet.activities.length}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Date</h4>
                        <p className="text-sm text-gray-600">
                          {new Date(selectedSheet.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Status
                        </h4>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Completed
                        </span>
                      </div>
                    </div>

                    {selectedSheet.notes && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Notes
                        </h4>
                        <p className="text-gray-600 bg-gray-50 rounded-lg p-4">
                          {selectedSheet.notes}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'activities' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {selectedSheet.activities.map((activity, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {activity.activityName}
                            </h4>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActivityTypeColor(activity.activityType)}`}
                            >
                              {activity.activityType}
                            </span>
                          </div>
                          {activity.rating && (
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Rating</p>
                              <p className="text-yellow-500 font-medium">
                                {getRatingStars(activity.rating)}
                              </p>
                            </div>
                          )}
                        </div>

                        {activity.description && (
                          <p className="text-gray-600 mb-3">
                            {activity.description}
                          </p>
                        )}

                        {activity.observations && (
                          <div className="bg-blue-50 rounded-lg p-3">
                            <h5 className="font-medium text-blue-900 mb-1">
                              Observations
                            </h5>
                            <p className="text-blue-800 text-sm">
                              {activity.observations}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'progress' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="font-medium text-gray-900 mb-4">
                        Progress Summary
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">
                            Overall Progress
                          </p>
                          <p className="text-2xl font-bold text-green-600">
                            {selectedSheet.progressSummary?.overallProgress ||
                              85}
                            %
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            Activities Completed
                          </p>
                          <p className="text-2xl font-bold text-blue-600">
                            {
                              selectedSheet.activities.filter(
                                a => a.status === 'completed'
                              ).length
                            }
                            /{selectedSheet.activities.length}
                          </p>
                        </div>
                      </div>
                    </div>

                    {selectedSheet.challenges &&
                      selectedSheet.challenges.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">
                            Challenges
                          </h4>
                          <div className="space-y-2">
                            {selectedSheet.challenges.map(
                              (challenge, index) => (
                                <div
                                  key={index}
                                  className="bg-yellow-50 border border-yellow-200 rounded-lg p-3"
                                >
                                  <p className="text-yellow-800 text-sm">
                                    {challenge.description}
                                  </p>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600">
                    Select a data sheet to view details
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
