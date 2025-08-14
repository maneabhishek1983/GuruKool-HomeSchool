"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SessionRecord, User, AIRecommendation } from '@/types';
import { enhancedSessionStore } from '@/store/session.store';

interface InteractiveProgressChartsProps {
  childId: string;
  parentId: string;
  currentUser: User;
  onChartInteraction?: (data: any) => void;
  className?: string;
}

interface ProgressData {
  subject: string;
  overallScore: number;
  trend: 'improving' | 'stable' | 'declining';
  sessionsCompleted: number;
  totalHours: number;
  lastSessionDate: Date;
  strengths: string[];
  areasForImprovement: string[];
  monthlyData: MonthlyData[];
}

interface MonthlyData {
  month: string;
  score: number;
  sessions: number;
  hours: number;
  topics: string[];
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
  }[];
}

export default function InteractiveProgressCharts({
  childId,
  parentId,
  currentUser,
  onChartInteraction,
  className = ''
}: InteractiveProgressChartsProps) {
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'radar'>('line');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drillDownData, setDrillDownData] = useState<any>(null);

  useEffect(() => {
    loadProgressData();
  }, [childId]);

  const loadProgressData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load session data for the child
      const sessions = await enhancedSessionStore.getSessionsByStudent(childId);
      
      // Generate progress data from sessions
      const data = generateProgressData(sessions);
      setProgressData(data);

    } catch (err) {
      setError('Failed to load progress data: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const generateProgressData = (sessions: SessionRecord[]): ProgressData[] => {
    const subjects = ['Mathematics', 'Science', 'English', 'History'];
    
    return subjects.map(subject => {
      const subjectSessions = sessions.filter(s => s.subject === subject);
      const totalSessions = subjectSessions.length;
      const totalHours = subjectSessions.reduce((sum, s) => {
        const duration = (new Date(s.scheduledEnd).getTime() - new Date(s.scheduledStart).getTime()) / (1000 * 60 * 60);
        return sum + duration;
      }, 0);

      // Generate monthly data
      const monthlyData: MonthlyData[] = [];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      
      months.forEach((month, index) => {
        const monthSessions = subjectSessions.filter(s => {
          const sessionMonth = new Date(s.scheduledStart).getMonth();
          return sessionMonth === index;
        });

        const monthScore = 70 + Math.random() * 30; // Simulate scores
        const monthHours = monthSessions.reduce((sum, s) => {
          const duration = (new Date(s.scheduledEnd).getTime() - new Date(s.scheduledStart).getTime()) / (1000 * 60 * 60);
          return sum + duration;
        }, 0);

        monthlyData.push({
          month,
          score: Math.round(monthScore),
          sessions: monthSessions.length,
          hours: Math.round(monthHours * 10) / 10,
          topics: ['Topic 1', 'Topic 2', 'Topic 3'].slice(0, Math.floor(Math.random() * 3) + 1)
        });
      });

      const overallScore = Math.round(monthlyData.reduce((sum, m) => sum + m.score, 0) / monthlyData.length);
      const trend = overallScore > 80 ? 'improving' : overallScore > 70 ? 'stable' : 'declining';

      return {
        subject,
        overallScore,
        trend,
        sessionsCompleted: totalSessions,
        totalHours: Math.round(totalHours * 10) / 10,
        lastSessionDate: subjectSessions.length > 0 ? 
          new Date(Math.max(...subjectSessions.map(s => new Date(s.scheduledStart).getTime()))) : 
          new Date(),
        strengths: ['Problem Solving', 'Critical Thinking', 'Active Participation'].slice(0, Math.floor(Math.random() * 3) + 1),
        areasForImprovement: ['Time Management', 'Focus', 'Homework Completion'].slice(0, Math.floor(Math.random() * 3) + 1),
        monthlyData
      };
    });
  };

  const getChartData = (subject: string): ChartData => {
    const subjectData = progressData.find(d => d.subject === subject);
    if (!subjectData) return { labels: [], datasets: [] };

    const labels = subjectData.monthlyData.map(d => d.month);
    const scores = subjectData.monthlyData.map(d => d.score);
    const sessions = subjectData.monthlyData.map(d => d.sessions);

    return {
      labels,
      datasets: [
        {
          label: 'Score',
          data: scores,
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2
        },
        {
          label: 'Sessions',
          data: sessions.map(s => s * 10), // Scale for visibility
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2
        }
      ]
    };
  };

  const handleSubjectClick = (subject: string) => {
    setSelectedSubject(subject);
    onChartInteraction?.({ type: 'subject_selected', subject });
  };

  const handleTimeframeChange = (timeframe: 'week' | 'month' | 'quarter' | 'year') => {
    setSelectedTimeframe(timeframe);
    onChartInteraction?.({ type: 'timeframe_changed', timeframe });
  };

  const handleChartTypeChange = (type: 'line' | 'bar' | 'radar') => {
    setChartType(type);
    onChartInteraction?.({ type: 'chart_type_changed', chartType: type });
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'stable': return '➡️';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'stable': return 'text-blue-600';
      case 'declining': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading progress data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Interactive Progress Charts
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">AI-Powered Insights</span>
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Timeframe:</label>
          <select
            value={selectedTimeframe}
            onChange={(e) => handleTimeframeChange(e.target.value as any)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="quarter">Quarter</option>
            <option value="year">Year</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Chart Type:</label>
          <select
            value={chartType}
            onChange={(e) => handleChartTypeChange(e.target.value as any)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="line">Line</option>
            <option value="bar">Bar</option>
            <option value="radar">Radar</option>
          </select>
        </div>
      </div>

      {/* Subject Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {progressData.map((subject) => (
          <motion.div
            key={subject.subject}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSubjectClick(subject.subject)}
            className={`p-4 bg-white border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedSubject === subject.subject ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{subject.subject}</h4>
              <span className="text-lg">{getTrendIcon(subject.trend)}</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Score:</span>
                <span className={`font-semibold ${getScoreColor(subject.overallScore)}`}>
                  {subject.overallScore}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sessions:</span>
                <span className="font-medium">{subject.sessionsCompleted}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Hours:</span>
                <span className="font-medium">{subject.totalHours}h</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Trend:</span>
                <span className={`text-sm font-medium ${getTrendColor(subject.trend)}`}>
                  {subject.trend}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detailed Chart View */}
      {selectedSubject && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="p-6 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">
                {selectedSubject} Progress - {selectedTimeframe.charAt(0).toUpperCase() + selectedTimeframe.slice(1)}ly View
              </h4>
              <div className="text-sm text-gray-500">
                Chart Type: {chartType.charAt(0).toUpperCase() + chartType.slice(1)}
              </div>
            </div>

            {/* Chart Placeholder */}
            <div className="h-64 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">📊</div>
                <p className="text-gray-600">Interactive Chart</p>
                <p className="text-sm text-gray-500">Chart visualization would be rendered here</p>
              </div>
            </div>

            {/* Chart Data Summary */}
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="font-semibold text-blue-900">Average Score</div>
                <div className="text-2xl font-bold text-blue-600">
                  {progressData.find(d => d.subject === selectedSubject)?.overallScore}%
                </div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="font-semibold text-green-900">Total Sessions</div>
                <div className="text-2xl font-bold text-green-600">
                  {progressData.find(d => d.subject === selectedSubject)?.sessionsCompleted}
                </div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="font-semibold text-purple-900">Total Hours</div>
                <div className="text-2xl font-bold text-purple-600">
                  {progressData.find(d => d.subject === selectedSubject)?.totalHours}h
                </div>
              </div>
            </div>
          </div>

          {/* Strengths and Areas for Improvement */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <h5 className="font-medium text-gray-900 mb-3">Strengths</h5>
              <div className="space-y-2">
                {progressData.find(d => d.subject === selectedSubject)?.strengths.map((strength, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">{strength}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <h5 className="font-medium text-gray-900 mb-3">Areas for Improvement</h5>
              <div className="space-y-2">
                {progressData.find(d => d.subject === selectedSubject)?.areasForImprovement.map((area, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">{area}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* AI Insights */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-3">AI Insights</h4>
        <div className="space-y-2 text-sm text-blue-800">
          <p>• Your child shows strong improvement in Mathematics with consistent session attendance</p>
          <p>• Consider focusing on Science topics that show declining trends</p>
          <p>• English sessions are well-balanced with good engagement levels</p>
          <p>• Recommended: Schedule additional practice sessions for challenging topics</p>
        </div>
      </div>
    </div>
  );
}
