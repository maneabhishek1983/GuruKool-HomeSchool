'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import LiquidButton from '@/components/ui/LiquidButton';

interface SubjectStat {
  subject: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  hoursSpent: number;
}

interface LearningAnalyticsProps {
  studentName: string;
  weekOf?: string;
  totalHours: number;
  totalSessions: number;
  averageScore: number;
  subjectStats: SubjectStat[];
  strongestSubject?: string;
  needsImprovement?: string;
  onViewFullReport?: () => void;
  className?: string;
}

export default function LearningAnalytics({
  studentName,
  weekOf = 'This Week',
  totalHours,
  totalSessions,
  averageScore,
  subjectStats,
  strongestSubject,
  needsImprovement,
  onViewFullReport,
  className = '',
}: LearningAnalyticsProps) {
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return '📈';
      case 'down':
        return '📉';
      default:
        return '➡️';
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-300';
      case 'down':
        return 'text-orange-300';
      default:
        return 'text-blue-300';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-300';
    if (score >= 70) return 'text-blue-300';
    if (score >= 50) return 'text-yellow-300';
    return 'text-orange-300';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-3xl ${className}`}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/optimized/progress/learning-analytics.webp"
          alt="Learning Analytics"
          fill
          className="object-cover"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-indigo-900/85 to-purple-900/90" />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-white/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -70, 0],
              x: [0, Math.random() * 50 - 25, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.6, 1],
            }}
            transition={{
              duration: 7 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 4,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-white mb-1">
            📊 Learning Analytics
          </h3>
          <p className="text-blue-100">
            {studentName} • {weekOf}
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20 text-center"
          >
            <div className="text-3xl font-bold text-white mb-1">{totalHours}</div>
            <div className="text-xs text-blue-100">Hours</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20 text-center"
          >
            <div className="text-3xl font-bold text-white mb-1">{totalSessions}</div>
            <div className="text-xs text-blue-100">Sessions</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20 text-center"
          >
            <div className={`text-3xl font-bold mb-1 ${getScoreColor(averageScore)}`}>
              {averageScore}%
            </div>
            <div className="text-xs text-blue-100">Avg Score</div>
          </motion.div>
        </div>

        {/* Subject Performance */}
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20 mb-4">
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            📚 Subject Performance
          </h4>

          <div className="space-y-3">
            {subjectStats.map((stat, index) => (
              <motion.div
                key={stat.subject}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center gap-3"
              >
                {/* Subject Name */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {stat.subject}
                  </div>
                  <div className="text-xs text-blue-100">
                    {stat.hoursSpent}h spent
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex-1">
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.score}%` }}
                      transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                      className={`h-full ${
                        stat.score >= 90
                          ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                          : stat.score >= 70
                          ? 'bg-gradient-to-r from-blue-400 to-cyan-500'
                          : 'bg-gradient-to-r from-yellow-400 to-orange-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Score & Trend */}
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${getScoreColor(stat.score)}`}>
                    {stat.score}%
                  </span>
                  <span className={`text-lg ${getTrendColor(stat.trend)}`}>
                    {getTrendIcon(stat.trend)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Insights Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {strongestSubject && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="backdrop-blur-xl bg-green-500/20 rounded-2xl p-4 border border-green-400/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">💪</span>
                <span className="text-xs font-semibold text-green-100">Strongest</span>
              </div>
              <div className="text-lg font-bold text-white">{strongestSubject}</div>
            </motion.div>
          )}

          {needsImprovement && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="backdrop-blur-xl bg-orange-500/20 rounded-2xl p-4 border border-orange-400/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🎯</span>
                <span className="text-xs font-semibold text-orange-100">Focus On</span>
              </div>
              <div className="text-lg font-bold text-white">{needsImprovement}</div>
            </motion.div>
          )}
        </div>

        {/* AI Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20 mb-4"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">🤖</span>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-white mb-2">AI Insights</h4>
              <p className="text-sm text-blue-100 leading-relaxed">
                {averageScore >= 85
                  ? `${studentName} is performing exceptionally well! Continue the current learning pace and consider advancing to more challenging material.`
                  : averageScore >= 70
                  ? `${studentName} shows solid understanding. Focus on ${needsImprovement || 'weaker areas'} to achieve even better results.`
                  : `${studentName} would benefit from additional practice in ${needsImprovement || 'key subjects'}. Consider shorter, more frequent study sessions.`}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Action Button */}
        {onViewFullReport && (
          <LiquidButton
            variant="primary"
            size="large"
            onClick={onViewFullReport}
            className="w-full bg-white text-indigo-900 hover:bg-blue-50"
          >
            📈 View Full Analytics Report
          </LiquidButton>
        )}

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-4 text-xs text-blue-100 text-center"
        >
          💡 Analytics updated in real-time based on session data
        </motion.div>
      </div>

      {/* Decorative Gradient Orbs */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-400 rounded-full blur-3xl opacity-20" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-400 rounded-full blur-3xl opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-purple-400 rounded-full blur-3xl opacity-10" />
    </motion.div>
  );
}
