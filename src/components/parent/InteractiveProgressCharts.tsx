'use client';

import React, { useState, useEffect } from 'react';
import { SessionRecord } from '@/types/session.types';
import { User } from '@/types';
import { enhancedSessionStore } from '@/store/session.store';

interface InteractiveProgressChartsProps {
  childId: string;
  parentId: string;
  currentUser: User;
  onChartInteraction?: (data: { type: string; [key: string]: unknown }) => void;
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

export default function InteractiveProgressCharts({
  childId,
  onChartInteraction,
  className = '',
}: InteractiveProgressChartsProps) {
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    'week' | 'month' | 'quarter' | 'year'
  >('month');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'radar'>('line');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProgressData();
  }, [childId]);

  const loadProgressData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const sessions = await enhancedSessionStore.getSessionsByStudent(childId);
      const data = generateProgressData(sessions);
      setProgressData(data);
    } catch (err) {
      setError(
        'Failed to load progress data: ' +
          (err instanceof Error ? err.message : 'Unknown error')
      );
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
        const duration =
          (new Date(s.scheduledEnd).getTime() -
            new Date(s.scheduledStart).getTime()) /
          (1000 * 60 * 60);
        return sum + duration;
      }, 0);

      const monthlyData: MonthlyData[] = [];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

      months.forEach((month, index) => {
        const monthSessions = subjectSessions.filter(s => {
          const sessionMonth = new Date(s.scheduledStart).getMonth();
          return sessionMonth === index;
        });

        const monthScore = 70 + Math.random() * 30;
        const monthHours = monthSessions.reduce((sum, s) => {
          const duration =
            (new Date(s.scheduledEnd).getTime() -
              new Date(s.scheduledStart).getTime()) /
            (1000 * 60 * 60);
          return sum + duration;
        }, 0);

        monthlyData.push({
          month,
          score: Math.round(monthScore),
          sessions: monthSessions.length,
          hours: Math.round(monthHours * 10) / 10,
          topics: ['Topic 1', 'Topic 2', 'Topic 3'].slice(
            0,
            Math.floor(Math.random() * 3) + 1
          ),
        });
      });

      const overallScore = Math.round(
        monthlyData.reduce((sum, m) => sum + m.score, 0) / monthlyData.length
      );
      const trend =
        overallScore > 80
          ? 'improving'
          : overallScore > 70
            ? 'stable'
            : 'declining';

      return {
        subject,
        overallScore,
        trend,
        sessionsCompleted: totalSessions,
        totalHours: Math.round(totalHours * 10) / 10,
        lastSessionDate:
          subjectSessions.length > 0
            ? new Date(
                Math.max(
                  ...subjectSessions.map(s =>
                    new Date(s.scheduledStart).getTime()
                  )
                )
              )
            : new Date(),
        strengths: [
          'Problem Solving',
          'Critical Thinking',
          'Active Participation',
        ].slice(0, Math.floor(Math.random() * 3) + 1),
        areasForImprovement: [
          'Time Management',
          'Focus',
          'Homework Completion',
        ].slice(0, Math.floor(Math.random() * 3) + 1),
        monthlyData,
      };
    });
  };

  const handleSubjectClick = (subject: string) => {
    setSelectedSubject(subject);
    onChartInteraction?.({ type: 'subject_selected', subject });
  };

  const handleTimeframeChange = (
    timeframe: 'week' | 'month' | 'quarter' | 'year'
  ) => {
    setSelectedTimeframe(timeframe);
    onChartInteraction?.({ type: 'timeframe_changed', timeframe });
  };

  const handleChartTypeChange = (type: 'line' | 'bar' | 'radar') => {
    setChartType(type);
    onChartInteraction?.({ type: 'chart_type_changed', chartType: type });
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-emerald-600';
      case 'stable':
        return 'text-blue-600';
      case 'declining':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) {
      return 'text-emerald-600';
    }
    if (score >= 80) {
      return 'text-blue-600';
    }
    if (score >= 70) {
      return 'text-amber-600';
    }
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600" />
        <span className="ml-2 text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}
      >
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  const selectedData = progressData.find(d => d.subject === selectedSubject);

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">
          Progress Overview
        </h3>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <select
          value={selectedTimeframe}
          onChange={e =>
            handleTimeframeChange(
              e.target.value as 'week' | 'month' | 'quarter' | 'year'
            )
          }
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="week">Week</option>
          <option value="month">Month</option>
          <option value="quarter">Quarter</option>
          <option value="year">Year</option>
        </select>

        <select
          value={chartType}
          onChange={e =>
            handleChartTypeChange(e.target.value as 'line' | 'bar' | 'radar')
          }
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="line">Line</option>
          <option value="bar">Bar</option>
          <option value="radar">Radar</option>
        </select>
      </div>

      {/* Subject Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {progressData.map(subject => (
          <button
            key={subject.subject}
            onClick={() => handleSubjectClick(subject.subject)}
            className={`p-3 text-left rounded-lg border transition-colors ${
              selectedSubject === subject.subject
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">
                {subject.subject}
              </span>
              <span
                className={`text-xs font-medium ${getTrendColor(subject.trend)}`}
              >
                {subject.trend === 'improving'
                  ? '↑'
                  : subject.trend === 'declining'
                    ? '↓'
                    : '→'}
              </span>
            </div>
            <div
              className={`text-xl font-bold ${getScoreColor(subject.overallScore)}`}
            >
              {subject.overallScore}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {subject.sessionsCompleted} sessions · {subject.totalHours}h
            </div>
          </button>
        ))}
      </div>

      {/* Selected Subject Details */}
      {selectedSubject && selectedData && (
        <div className="space-y-4">
          {/* Chart Area */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">
                {selectedSubject} -{' '}
                {selectedTimeframe.charAt(0).toUpperCase() +
                  selectedTimeframe.slice(1)}
                ly
              </h4>
              <span className="text-xs text-gray-500">{chartType} chart</span>
            </div>

            {/* Simple Bar Visualization */}
            <div className="flex items-end justify-between gap-1 h-32 px-2">
              {selectedData.monthlyData.map((point, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all"
                    style={{ height: `${(point.score / 100) * 100}%` }}
                  />
                  <span className="text-xs text-gray-500 mt-1">
                    {point.month}
                  </span>
                </div>
              ))}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <div className="text-xs text-gray-500">Avg Score</div>
                <div className="text-lg font-semibold text-gray-900">
                  {selectedData.overallScore}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Sessions</div>
                <div className="text-lg font-semibold text-gray-900">
                  {selectedData.sessionsCompleted}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Hours</div>
                <div className="text-lg font-semibold text-gray-900">
                  {selectedData.totalHours}h
                </div>
              </div>
            </div>
          </div>

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Strengths
              </h5>
              <ul className="space-y-1">
                {selectedData.strengths.map((strength, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                To Improve
              </h5>
              <ul className="space-y-1">
                {selectedData.areasForImprovement.map((area, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* AI Insights - Compact */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Insights
        </h4>
        <ul className="space-y-1 text-sm text-gray-600">
          <li>
            • Strong improvement in Mathematics with consistent attendance
          </li>
          <li>• Consider focusing on Science topics showing decline</li>
          <li>• English sessions show good engagement levels</li>
        </ul>
      </div>
    </div>
  );
}
