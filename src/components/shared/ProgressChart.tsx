'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { LiquidButton } from '@/components/ui/LiquidButton';

interface ProgressDataPoint {
  label: string; // e.g., "Week 1", "Jan", "Q1"
  value: number; // percentage or score
  date?: string;
}

interface ProgressChartProps {
  title?: string;
  studentName: string;
  subject?: string;
  data: ProgressDataPoint[];
  currentValue: number;
  targetValue?: number;
  improvementPercentage?: number;
  onViewDetails?: () => void;
  className?: string;
}

export default function ProgressChart({
  title = 'Learning Progress',
  studentName,
  subject = 'Overall',
  data,
  currentValue,
  targetValue = 100,
  improvementPercentage,
  onViewDetails,
  className = '',
}: ProgressChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), targetValue);
  const progressPercentage = (currentValue / targetValue) * 100;
  const isOnTrack = currentValue >= targetValue * 0.7; // 70% threshold

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-3xl ${className}`}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/optimized/progress/progress-chart.webp"
          alt="Progress Chart"
          fill
          className="object-cover"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/90 via-emerald-900/85 to-teal-900/90" />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(18)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-white/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -60, 0],
              x: [0, Math.random() * 40 - 20, 0],
              opacity: [0.2, 0.7, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 6 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">📈 {title}</h3>
            <p className="text-green-100">
              {studentName} • {subject}
            </p>
          </div>

          {/* Current Score Badge */}
          <motion.div
            className="backdrop-blur-xl bg-white/10 rounded-2xl px-4 py-3 border border-white/20 text-center"
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-3xl font-bold text-white">{currentValue}%</div>
            <div className="text-xs text-green-100">Current</div>
          </motion.div>
        </div>

        {/* Progress Bar */}
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-white">
              Progress to Goal
            </span>
            <span className="text-sm font-bold text-white">
              {progressPercentage.toFixed(0)}%
            </span>
          </div>
          <div className="h-4 bg-white/10 rounded-full overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className={`h-full ${
                isOnTrack
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                  : 'bg-gradient-to-r from-yellow-400 to-orange-500'
              }`}
            />
            {/* Target Line */}
            {targetValue && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white"
                style={{ left: `${(targetValue / maxValue) * 100}%` }}
              >
                <div className="absolute -top-1 -left-2 w-4 h-4 bg-white rounded-full" />
              </div>
            )}
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-green-100">
            <span>Start</span>
            <span>Target: {targetValue}%</span>
          </div>
        </div>

        {/* Chart Visualization */}
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20 mb-4">
          <h4 className="text-sm font-semibold text-white mb-3">
            Trend Over Time
          </h4>

          {/* Simple Bar Chart */}
          <div className="flex items-end justify-between gap-2 h-32">
            {data.map((point, index) => (
              <motion.div
                key={index}
                initial={{ height: 0 }}
                animate={{ height: `${(point.value / maxValue) * 100}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="flex-1 flex flex-col items-center gap-1"
              >
                {/* Bar */}
                <div className="w-full relative group cursor-pointer">
                  <div
                    className={`w-full rounded-t-lg ${
                      index === data.length - 1
                        ? 'bg-gradient-to-t from-green-400 to-emerald-500'
                        : 'bg-gradient-to-t from-green-400/60 to-emerald-500/60'
                    }`}
                    style={{ height: `${(point.value / maxValue) * 128}px` }}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="backdrop-blur-xl bg-white/95 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
                      <div className="text-xs font-bold text-gray-900">
                        {point.value}%
                      </div>
                      {point.date && (
                        <div className="text-xs text-gray-600">
                          {point.date}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Label */}
                <div className="text-xs text-green-100 font-medium">
                  {point.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {improvementPercentage !== undefined && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="backdrop-blur-xl bg-white/10 rounded-2xl p-3 border border-white/20"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">
                  {improvementPercentage > 0
                    ? '📈'
                    : improvementPercentage < 0
                      ? '📉'
                      : '➡️'}
                </span>
                <span className="text-xs text-green-100">Improvement</span>
              </div>
              <div
                className={`text-2xl font-bold ${
                  improvementPercentage > 0
                    ? 'text-green-300'
                    : improvementPercentage < 0
                      ? 'text-orange-300'
                      : 'text-white'
                }`}
              >
                {improvementPercentage > 0 ? '+' : ''}
                {improvementPercentage}%
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="backdrop-blur-xl bg-white/10 rounded-2xl p-3 border border-white/20"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{isOnTrack ? '✅' : '⚠️'}</span>
              <span className="text-xs text-green-100">Status</span>
            </div>
            <div className="text-lg font-bold text-white">
              {isOnTrack ? 'On Track' : 'Needs Focus'}
            </div>
          </motion.div>
        </div>

        {/* Action Button */}
        {onViewDetails && (
          <LiquidButton
            variant="primary"
            size="lg"
            onClick={onViewDetails}
            className="w-full bg-white text-green-900 hover:bg-green-50"
          >
            📊 View Detailed Report
          </LiquidButton>
        )}

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-4 text-xs text-green-100 text-center"
        >
          {isOnTrack
            ? '🎉 Great progress! Keep up the excellent work!'
            : '💪 Focus on consistent practice to reach your goal!'}
        </motion.div>
      </div>

      {/* Decorative Gradient Orbs */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-400 rounded-full blur-3xl opacity-20" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-400 rounded-full blur-3xl opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-teal-400 rounded-full blur-3xl opacity-10" />
    </motion.div>
  );
}
