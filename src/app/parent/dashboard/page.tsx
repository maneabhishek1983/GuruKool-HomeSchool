'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthContext } from '../../../lib/authContext';
import AIPriorityFeed from '../../../components/parent/AIPriorityFeed';
import TeacherLocationTracker from '../../../components/parent/TeacherLocationTracker';
import InteractiveProgressCharts from '../../../components/parent/InteractiveProgressCharts';
import SmartNotificationSystem from '../../../components/parent/SmartNotificationSystem';
import CreateStudentForm from '../../../components/parent/CreateStudentForm';

export default function ParentDashboard() {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'progress' | 'tracking' | 'notifications' | 'students'
  >('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateStudent, setShowCreateStudent] = useState(false);
  const [childrenData, setChildrenData] = useState([
    {
      id: 'student-1',
      name: 'Emma Johnson',
      age: 7,
      year: 'Year 2',
      subjects: ['Mathematics', 'English', 'Science'],
      currentProgress: 78,
      lastSession: new Date(Date.now() - 24 * 60 * 60 * 1000),
      upcomingSession: new Date(Date.now() + 24 * 60 * 60 * 1000),
      teacher: 'John Teacher',
    },
    {
      id: 'student-2',
      name: 'James Johnson',
      age: 9,
      year: 'Year 4',
      subjects: ['Mathematics', 'English', 'Science', 'History'],
      currentProgress: 85,
      lastSession: new Date(Date.now() - 12 * 60 * 60 * 1000),
      upcomingSession: new Date(Date.now() + 48 * 60 * 60 * 1000),
      teacher: 'John Teacher',
    },
  ]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your parent dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                👨‍👩‍👧‍👦 Parent Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Welcome back, {user?.name || 'Parent'} • Track your
                children&apos;s learning journey
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                👥 {childrenData.length} Children
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
              { id: 'progress', label: 'Progress', icon: '📈' },
              { id: 'tracking', label: 'Live Tracking', icon: '📍' },
              { id: 'notifications', label: 'Notifications', icon: '🔔' },
              { id: 'students', label: 'Students', icon: '👨‍🎓' },
            ].map(tab => (
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
              {/* Children Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {childrenData.map(child => (
                  <div
                    key={child.id}
                    className="bg-white rounded-lg shadow p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {child.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {child.year} • Age {child.age}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {child.currentProgress}%
                        </div>
                        <p className="text-xs text-gray-500">
                          Overall Progress
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Subjects:</p>
                        <div className="flex flex-wrap gap-1">
                          {child.subjects.map(subject => (
                            <span
                              key={subject}
                              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                            >
                              {subject}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Last Session:</span>
                          <span className="text-gray-900">
                            {child.lastSession.toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-gray-600">Next Session:</span>
                          <span className="text-blue-600">
                            {child.upcomingSession.toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-gray-600">Teacher:</span>
                          <span className="text-gray-900">{child.teacher}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Priority Feed */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    🤖 AI Priority Updates
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Important insights and recommendations for your children
                  </p>
                </div>
                <div className="p-6">
                  <AIPriorityFeed
                    childId={childrenData[0]?.id || 'student-1'}
                    parentId={user?.id || 'parent-1'}
                    currentUser={
                      user ||
                      ({
                        id: 'parent-1',
                        name: 'Parent',
                        role: 'parent',
                      } as any)
                    }
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'progress' && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <InteractiveProgressCharts
                parentId={user?.id || 'parent-1'}
                childrenData={childrenData}
              />
            </motion.div>
          )}

          {activeTab === 'tracking' && (
            <motion.div
              key="tracking"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    📍 Live Teacher Location
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Real-time tracking during active sessions for safety and
                    transparency
                  </p>
                </div>
                <div className="p-6">
                  <TeacherLocationTracker
                    parentId={user?.id || 'parent-1'}
                    teacherId="teacher-1"
                    activeSessionId="session-1"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <SmartNotificationSystem
                parentId={user?.id || 'parent-1'}
                childrenIds={childrenData.map(child => child.id)}
              />
            </motion.div>
          )}

          {activeTab === 'students' && (
            <motion.div
              key="students"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Header with Add Student Button */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Student Profiles
                  </h2>
                  <p className="text-gray-600">
                    Manage your children&apos;s learning profiles
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateStudent(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <span>➕</span>
                  <span>Add Student</span>
                </motion.button>
              </div>

              {/* Students Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {childrenData.map(child => (
                  <motion.div
                    key={child.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-lg shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                        {child.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {child.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {child.year} • Age {child.age}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Overall Progress
                          </span>
                          <span className="text-sm font-bold text-blue-600">
                            {child.currentProgress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${child.currentProgress}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 mb-2">Subjects:</p>
                        <div className="flex flex-wrap gap-1">
                          {child.subjects.map(subject => (
                            <span
                              key={subject}
                              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                            >
                              {subject}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Next Session:</span>
                          <span>
                            {child.upcomingSession.toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Teacher:</span>
                          <span>{child.teacher}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex space-x-2">
                      <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors">
                        📝 Edit
                      </button>
                      <button className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 text-sm rounded-md hover:bg-blue-100 transition-colors">
                        📊 Details
                      </button>
                    </div>
                  </motion.div>
                ))}

                {/* Add Student Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 cursor-pointer"
                  onClick={() => setShowCreateStudent(true)}
                >
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl text-gray-400">➕</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                    Add New Student
                  </h3>
                  <p className="text-sm text-gray-500">
                    Create a learning profile for your child
                  </p>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Student Modal */}
      <AnimatePresence>
        {showCreateStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateStudent(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Create Student Profile
                </h3>
                <button
                  onClick={() => setShowCreateStudent(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
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

              <CreateStudentForm
                onSubmit={studentData => {
                  const newStudent = {
                    id: `student-${Date.now()}`,
                    name: studentData.name,
                    age: parseInt(studentData.age),
                    year: studentData.year,
                    subjects: studentData.subjects,
                    currentProgress: 0,
                    lastSession: new Date(),
                    upcomingSession: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    teacher: 'John Teacher',
                  };
                  setChildrenData(prev => [...prev, newStudent]);
                  setShowCreateStudent(false);
                }}
                onCancel={() => setShowCreateStudent(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
