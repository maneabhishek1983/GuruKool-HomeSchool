/**
 * Analytics Dashboard Component
 * Interactive charts and visualizations for learning progress and performance metrics
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  analyticsService,
  LearningProgress,
  TeacherPerformance,
  SessionAnalytics,
  ComparativeAnalytics,
  AnalyticsFilter
} from '@/services/analytics.service';

interface AnalyticsDashboardProps {
  userId: string;
  userRole: 'teacher' | 'parent' | 'student' | 'admin';
  className?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  userId,
  userRole,
  className = ''
}) => {
  const [learningProgress, setLearningProgress] = useState<LearningProgress | null>(null);
  const [teacherPerformance, setTeacherPerformance] = useState<TeacherPerformance | null>(null);
  const [sessionAnalytics, setSessionAnalytics] = useState<SessionAnalytics | null>(null);
  const [comparativeAnalytics, setComparativeAnalytics] = useState<ComparativeAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');
  const [activeView, setActiveView] = useState<'progress' | 'performance' | 'sessions' | 'comparison'>('progress');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  const colors = {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    danger: '#EF4444',
    warning: '#F97316',
    info: '#06B6D4',
    purple: '#8B5CF6',
    pink: '#EC4899',
    indigo: '#6366F1',
    teal: '#14B8A6'
  };

  const chartColors = [
    colors.primary,
    colors.secondary,
    colors.accent,
    colors.warning,
    colors.purple,
    colors.pink,
    colors.indigo,
    colors.teal
  ];

  useEffect(() => {
    loadAnalyticsData();
  }, [userId, userRole, selectedTimeframe, selectedSubject]);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);

      const timeframe = getTimeframeDates(selectedTimeframe);
      const filter: AnalyticsFilter = {
        dateRange: timeframe,
        ...(userRole === 'teacher' ? { teacherIds: [userId] } : {}),
        ...(userRole === 'student' ? { studentIds: [userId] } : {}),
        ...(selectedSubject !== 'all' ? { subjects: [selectedSubject] } : {})
      };

      // Load different data based on user role
      const promises: Promise<any>[] = [];

      if (userRole === 'student' || userRole === 'parent') {
        promises.push(
          analyticsService.getLearningProgress(
            userRole === 'student' ? userId : '', // For parent, would need student ID
            selectedSubject !== 'all' ? selectedSubject : undefined,
            timeframe
          )
        );
      }

      if (userRole === 'teacher') {
        promises.push(
          analyticsService.getTeacherPerformance(userId, timeframe)
        );
      }

      promises.push(
        analyticsService.getSessionAnalytics(filter),
        analyticsService.getComparativeAnalytics(filter)
      );

      const results = await Promise.allSettled(promises);

      let resultIndex = 0;
      if (userRole === 'student' || userRole === 'parent') {
        if (results[resultIndex].status === 'fulfilled') {
          setLearningProgress(results[resultIndex].value);
        }
        resultIndex++;
      }

      if (userRole === 'teacher') {
        if (results[resultIndex].status === 'fulfilled') {
          setTeacherPerformance(results[resultIndex].value);
        }
        resultIndex++;
      }

      if (results[resultIndex].status === 'fulfilled') {
        setSessionAnalytics(results[resultIndex].value);
      }
      resultIndex++;

      if (results[resultIndex].status === 'fulfilled') {
        setComparativeAnalytics(results[resultIndex].value);
      }

    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeframeDates = (timeframe: string) => {
    const now = new Date();
    const startDate = new Date();

    switch (timeframe) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    return { startDate, endDate: now };
  };

  const MetricCard = ({ title, value, subtitle, trend, color = 'primary' }: {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: { value: number; label: string };
    color?: keyof typeof colors;
  }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {trend && (
          <div className={`text-right ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <p className="text-lg font-semibold">
              {trend.value >= 0 ? '↗' : '↘'} {Math.abs(trend.value)}%
            </p>
            <p className="text-xs text-gray-500">
              {trend.label}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-32" />
            ))}
          </div>
          <div className="mt-6 bg-gray-200 dark:bg-gray-700 rounded-lg h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track progress, performance, and insights
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          {/* Subject Selector */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600"
          >
            <option value="all">All Subjects</option>
            <option value="mathematics">Mathematics</option>
            <option value="science">Science</option>
            <option value="english">English</option>
            <option value="history">History</option>
          </select>

          {/* Timeframe Selector */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {['week', 'month', 'quarter', 'year'].map((timeframe) => (
              <button
                key={timeframe}
                onClick={() => setSelectedTimeframe(timeframe)}
                className={`px-3 py-1 text-sm rounded-md capitalize transition-colors ${
                  selectedTimeframe === timeframe
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {timeframe}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* View Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'progress', label: 'Learning Progress', icon: '📈' },
            { key: 'performance', label: 'Performance', icon: '🎯' },
            { key: 'sessions', label: 'Sessions', icon: '📊' },
            { key: 'comparison', label: 'Comparison', icon: '📈' }
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveView(key as any)}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeView === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content based on active view */}
      <AnimatePresence mode="wait">
        {activeView === 'progress' && learningProgress && (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Progress Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MetricCard
                title="Progress"
                value={`${learningProgress.progressPercentage.toFixed(1)}%`}
                subtitle="Overall completion"
                trend={{ value: 8.5, label: 'This month' }}
                color="secondary"
              />
              <MetricCard
                title="Total Sessions"
                value={learningProgress.totalSessions}
                subtitle="Learning sessions"
                trend={{ value: 12, label: 'vs last month' }}
              />
              <MetricCard
                title="Study Hours"
                value={`${learningProgress.totalHours.toFixed(1)}h`}
                subtitle="Time invested"
                trend={{ value: 15, label: 'This month' }}
                color="accent"
              />
              <MetricCard
                title="Average Rating"
                value={learningProgress.averageRating.toFixed(1)}
                subtitle="Session quality"
                trend={{ value: 5, label: 'Improvement' }}
                color="purple"
              />
            </div>

            {/* Progress Trend */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Learning Progress Trend
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={learningProgress.trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke={colors.primary}
                    fill={colors.primary}
                    fillOpacity={0.3}
                    name="Progress Score"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Milestones and Areas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Strength Areas */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Strength Areas
                </h3>
                <div className="space-y-3">
                  {learningProgress.strengthAreas.map((area, index) => (
                    <div key={area} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-gray-700 dark:text-gray-300">{area}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Improvement Areas */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Areas for Improvement
                </h3>
                <div className="space-y-3">
                  {learningProgress.improvementAreas.map((area, index) => (
                    <div key={area} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      <span className="text-gray-700 dark:text-gray-300">{area}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Milestones */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Learning Milestones
              </h3>
              <div className="space-y-4">
                {learningProgress.milestones.map((milestone) => (
                  <div key={milestone.id} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {milestone.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {milestone.description}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-blue-600">
                        {milestone.progress}%
                      </span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${milestone.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeView === 'performance' && teacherPerformance && (
          <motion.div
            key="performance"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MetricCard
                title="Overall Rating"
                value={teacherPerformance.averageRating.toFixed(1)}
                subtitle="Student feedback"
                trend={{ value: 3.2, label: 'This month' }}
                color="secondary"
              />
              <MetricCard
                title="Student Retention"
                value={`${teacherPerformance.studentRetention.toFixed(1)}%`}
                subtitle="Repeat students"
                trend={{ value: 5.8, label: 'Improvement' }}
                color="accent"
              />
              <MetricCard
                title="Punctuality"
                value={`${teacherPerformance.punctualityScore.toFixed(1)}%`}
                subtitle="On-time sessions"
                trend={{ value: -1.2, label: 'Slight decline' }}
                color="warning"
              />
              <MetricCard
                title="Engagement"
                value={`${teacherPerformance.engagementScore.toFixed(1)}%`}
                subtitle="Student engagement"
                trend={{ value: 7.5, label: 'Improving' }}
                color="purple"
              />
            </div>

            {/* Performance Radar Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Performance Overview
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={[
                  { metric: 'Teaching Quality', score: teacherPerformance.averageRating * 20 },
                  { metric: 'Punctuality', score: teacherPerformance.punctualityScore },
                  { metric: 'Preparation', score: teacherPerformance.preparationScore },
                  { metric: 'Engagement', score: teacherPerformance.engagementScore },
                  { metric: 'Student Retention', score: teacherPerformance.studentRetention },
                  { metric: 'Communication', score: 85 }
                ]}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar
                    name="Performance"
                    dataKey="score"
                    stroke={colors.primary}
                    fill={colors.primary}
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Trends */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Monthly Performance Trends
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={teacherPerformance.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="rating"
                    stroke={colors.primary}
                    name="Rating"
                  />
                  <Line
                    type="monotone"
                    dataKey="retention"
                    stroke={colors.secondary}
                    name="Retention %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Subject Expertise */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Subject Expertise
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={teacherPerformance.subjectExpertise}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" fill={colors.accent} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {activeView === 'sessions' && sessionAnalytics && (
          <motion.div
            key="sessions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Session Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MetricCard
                title="Total Sessions"
                value={sessionAnalytics.totalSessions}
                subtitle="All sessions"
                color="primary"
              />
              <MetricCard
                title="Completed"
                value={sessionAnalytics.completedSessions}
                subtitle={`${((sessionAnalytics.completedSessions / sessionAnalytics.totalSessions) * 100).toFixed(1)}% completion`}
                color="secondary"
              />
              <MetricCard
                title="Avg Duration"
                value={`${sessionAnalytics.averageDuration.toFixed(0)}m`}
                subtitle="Session length"
                color="accent"
              />
              <MetricCard
                title="Avg Rating"
                value={sessionAnalytics.averageRating.toFixed(1)}
                subtitle="Quality score"
                color="purple"
              />
            </div>

            {/* Sessions by Subject */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Sessions by Subject
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={sessionAnalytics.sessionsBySubject}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="count"
                      nameKey="subject"
                    >
                      {sessionAnalytics.sessionsBySubject.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Hours by Subject
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={sessionAnalytics.sessionsBySubject}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="hours" fill={colors.secondary} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Time Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Sessions by Time of Day
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={sessionAnalytics.sessionsByTimeOfDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke={colors.primary}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Sessions by Day of Week
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={sessionAnalytics.sessionsByDayOfWeek}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill={colors.accent} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {activeView === 'comparison' && comparativeAnalytics && (
          <motion.div
            key="comparison"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Comparative Analytics
              </h3>
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <div className="text-4xl mb-2">📊</div>
                <div>Comparative data will be displayed here</div>
                <div className="text-sm mt-1">
                  Student comparisons, subject analysis, and peer benchmarks
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnalyticsDashboard;