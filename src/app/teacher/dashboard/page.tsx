'use client';

import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { DataSheetsManager } from '@/components/teacher/DataSheetsManager';
import { TimesheetManager } from '@/components/teacher/TimesheetManager';
import { QRCheckInOut } from '@/components/teacher/QRCheckInOut';
import { MonthlyTimesheetReport } from '@/components/teacher/MonthlyTimesheetReport';
import {
  LiquidLearningLayout,
  GlassHeader,
  GlassStatCard,
  LiquidButton,
  SectionTitle,
} from '@/components/layouts/LiquidLearningLayout';
import { FloatingActionButton } from '@/design-system/components/interactive/FloatingActionButton';
import TeacherDashboardHero from '@/components/teacher/TeacherDashboardHero';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

type TabId = 'checkin' | 'timesheet' | 'overview' | 'data-sheets' | 'sessions';

const tabs = [
  { id: 'checkin' as TabId, label: 'Check-In/Out', icon: '📍' },
  { id: 'timesheet' as TabId, label: 'Timesheet Report', icon: '📊' },
  { id: 'data-sheets' as TabId, label: 'Data Sheets', icon: '📝' },
  { id: 'overview' as TabId, label: 'Overview', icon: '📈' },
  { id: 'sessions' as TabId, label: 'Sessions', icon: '📅' },
];

export default function TeacherDashboard() {
  const { user, logout } = useAuthContext();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('checkin');
  const [dashboardStats, setDashboardStats] = useState({
    assignedStudents: 0,
    activeSessions: 0,
    totalHoursThisWeek: 0,
    completedSessionsThisWeek: 0,
  });
  const [upcomingSession, setUpcomingSession] = useState<{
    studentName: string;
    time: string;
  } | null>(null);
  const [assignedStudents, setAssignedStudents] = useState<
    Array<{
      id: string;
      name: string;
      grade: string;
      country: string;
      progress: number;
    }>
  >([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardStats();
    }
  }, [user]);

  const loadDashboardStats = async () => {
    if (!user?.id) {
      return;
    }

    try {
      setIsLoadingStats(true);
      const response = await fetch(`/api/teacher/dashboard?userId=${user.id}`);
      const data = await response.json();

      if (response.ok) {
        setDashboardStats(data.stats);
        setUpcomingSession(data.upcomingSession);
        setAssignedStudents(data.students || []);
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // FAB actions for teacher
  const fabActions = [
    {
      id: 'quick-checkin',
      icon: (
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
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      label: 'Quick Check-In',
      onClick: () => setActiveTab('checkin'),
      color: 'success' as const,
    },
    {
      id: 'view-timesheet',
      icon: (
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
      label: 'View Timesheet',
      onClick: () => setActiveTab('timesheet'),
      color: 'primary' as const,
    },
    {
      id: 'manage-sessions',
      icon: (
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
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      label: 'Manage Sessions',
      onClick: () => setActiveTab('sessions'),
      color: 'secondary' as const,
    },
  ];

  if (!user) {
    return (
      <LiquidLearningLayout variant="default" gradientTheme="ocean">
        <div className="min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-slate-200/50"
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Access Denied
            </h1>
            <p className="text-slate-600 mb-6">
              Please log in to access the teacher dashboard.
            </p>
            <LiquidButton
              variant="primary"
              onClick={() => router.push('/login')}
            >
              Go to Login
            </LiquidButton>
          </motion.div>
        </div>
      </LiquidLearningLayout>
    );
  }

  return (
    <LiquidLearningLayout
      variant="default"
      gradientTheme="ocean"
      showMeshBackground
    >
      {/* Glass Header */}
      <GlassHeader>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-12 h-12 bg-gradient-to-br from-blue-600 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25"
              >
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                  Teacher Dashboard
                </h1>
                <p className="text-sm text-slate-600">
                  Welcome back, {user.name}!
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Navigation Tabs */}
              <div className="hidden md:flex bg-white/50 backdrop-blur-sm rounded-xl p-1 border border-slate-200/50">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
              <LiquidButton
                variant="primary"
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
              >
                Logout
              </LiquidButton>
            </div>
          </div>
        </div>
      </GlassHeader>

      {/* Mobile Tabs */}
      <div className="md:hidden px-4 py-3 bg-white/50 backdrop-blur-sm border-b border-slate-200/50">
        <div className="flex space-x-2 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 bg-white/50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Hero */}
        <TeacherDashboardHero
          teacherName={user.name}
          activeSessions={dashboardStats.activeSessions}
          totalHours={dashboardStats.totalHoursThisWeek}
          {...(upcomingSession ? { upcomingSession } : {})}
          onCheckIn={() => setActiveTab('checkin')}
          onViewSchedule={() => setActiveTab('sessions')}
          className="mb-8"
        />

        <AnimatePresence mode="wait">
          {/* Check-In/Out Tab */}
          {activeTab === 'checkin' && (
            <motion.div
              key="checkin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <QRCheckInOut
                onSuccess={entry => {
                  console.log('Check-in/out successful:', entry);
                  loadDashboardStats();
                }}
                onError={error => {
                  console.error('Check-in/out error:', error);
                }}
              />
            </motion.div>
          )}

          {/* Timesheet Report Tab */}
          {activeTab === 'timesheet' && (
            <motion.div
              key="timesheet"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <MonthlyTimesheetReport
                teacherId={user?.id || ''}
                teacherName={user?.name || ''}
              />
            </motion.div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Stats Grid */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
              >
                <motion.div variants={itemVariants}>
                  <GlassStatCard
                    title="Assigned Students"
                    value={dashboardStats.assignedStudents}
                    color="primary"
                    icon={
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
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    }
                  />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <GlassStatCard
                    title="Active Sessions"
                    value={dashboardStats.activeSessions}
                    color="success"
                    icon={
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
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    }
                  />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <GlassStatCard
                    title="Hours This Week"
                    value={`${dashboardStats.totalHoursThisWeek}h`}
                    color="secondary"
                    icon={
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
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    }
                  />
                </motion.div>
              </motion.div>

              {/* Recent Students & Quick Actions Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Assigned Students */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden"
                >
                  <div className="px-6 py-4 border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-white">
                    <h2 className="text-lg font-semibold text-slate-900">
                      Assigned Students
                    </h2>
                  </div>
                  <div className="p-6">
                    {isLoadingStats ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : assignedStudents.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-3">👨‍🎓</div>
                        <p className="text-slate-600">
                          No students assigned yet
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          Students will appear here once a parent assigns you
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {assignedStudents.map((student, index) => (
                          <motion.div
                            key={student.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-teal-500 rounded-full flex items-center justify-center text-white font-medium shadow-lg shadow-blue-500/20">
                                {student.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">
                                  {student.name}
                                </p>
                                <p className="text-sm text-slate-600">
                                  {student.grade} • {student.country}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-slate-900">
                                {student.progress}%
                              </p>
                              <div className="w-16 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-500 to-teal-500 rounded-full"
                                  style={{ width: `${student.progress}%` }}
                                />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden"
                >
                  <div className="px-6 py-4 border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-white">
                    <h2 className="text-lg font-semibold text-slate-900">
                      Quick Actions
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      {[
                        {
                          label: 'Check In / Out',
                          icon: '📍',
                          color: 'from-green-500 to-emerald-600',
                          action: () => setActiveTab('checkin'),
                        },
                        {
                          label: 'View Timesheet',
                          icon: '📊',
                          color: 'from-blue-500 to-blue-600',
                          action: () => setActiveTab('timesheet'),
                        },
                        {
                          label: 'Manage Sessions',
                          icon: '📅',
                          color: 'from-amber-500 to-orange-600',
                          action: () => setActiveTab('sessions'),
                        },
                        {
                          label: 'Refresh Data',
                          icon: '🔄',
                          color: 'from-teal-500 to-teal-600',
                          action: () => loadDashboardStats(),
                        },
                      ].map((action, index) => (
                        <motion.button
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * index }}
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={action.action}
                          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-200 group"
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-10 h-10 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center text-white shadow-lg`}
                            >
                              <span className="text-lg">{action.icon}</span>
                            </div>
                            <span className="font-medium text-slate-900">
                              {action.label}
                            </span>
                          </div>
                          <svg
                            className="w-5 h-5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all"
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
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Academic Standards Support */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-8 bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-white">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Academic Standards Support
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      {
                        flag: '🇬🇧',
                        title: 'UK Curriculum',
                        desc: 'National Curriculum for England with Reception through Year 11',
                      },
                      {
                        flag: '🇺🇸',
                        title: 'US Standards',
                        desc: 'Common Core State Standards with Kindergarten through Grade 12',
                      },
                      {
                        flag: '🇮🇳',
                        title: 'India NEP 2020',
                        desc: 'National Education Policy with Foundation through Higher Secondary',
                      },
                    ].map((standard, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 * index }}
                        className="text-center p-6 bg-gradient-to-b from-white to-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300"
                      >
                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <span className="text-2xl">{standard.flag}</span>
                        </div>
                        <h3 className="font-medium text-slate-900 mb-2">
                          {standard.title}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {standard.desc}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Data Sheets Tab */}
          {activeTab === 'data-sheets' && (
            <motion.div
              key="data-sheets"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <DataSheetsManager
                teacherId={user?.id || ''}
                selectedDate={new Date().toISOString().split('T')[0] || ''}
                assignedStudents={assignedStudents}
              />
            </motion.div>
          )}

          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <motion.div
              key="sessions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <TimesheetManager
                teacherId={user?.id || ''}
                userId={user?.id || ''}
                onStartSession={() => setActiveTab('checkin')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton
        actions={fabActions}
        position="bottom-right"
        variant="solid"
        color="primary"
      />
    </LiquidLearningLayout>
  );
}
