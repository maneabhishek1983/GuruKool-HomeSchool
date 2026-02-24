'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface ProgressDataPoint {
  label: string;
  value: number;
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

// Generate stable particle positions
const generateParticlePositions = (count: number) => {
  const positions = [];
  for (let i = 0; i < count; i++) {
    positions.push({
      left: (i * 17 + 5) % 100,
      top: (i * 23 + 10) % 100,
      duration: 5 + (i % 3),
      delay: (i * 0.3) % 2,
    });
  }
  return positions;
};

const PARTICLE_POSITIONS = generateParticlePositions(12);

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
  const isOnTrack = currentValue >= targetValue * 0.7;

  return (
    <div
      className={`relative overflow-hidden bg-emerald-900 rounded-xl ${className}`}
    >
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {PARTICLE_POSITIONS.map((particle, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white/20"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-sm text-emerald-200">
              {studentName} · {subject}
            </p>
          </div>
          <div className="text-right bg-white/10 rounded-lg px-3 py-2">
            <div className="text-2xl font-bold text-white">{currentValue}%</div>
            <div className="text-xs text-emerald-200">Current</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-5 bg-white/10 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-emerald-100">Progress to Goal</span>
            <span className="text-sm font-medium text-white">
              {progressPercentage.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progressPercentage, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                isOnTrack ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
          </div>
          <div className="flex items-center justify-between mt-1 text-xs text-emerald-300">
            <span>0%</span>
            <span>Target: {targetValue}%</span>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="mb-5 bg-white/10 rounded-lg p-3">
          <h4 className="text-sm font-medium text-emerald-100 mb-3">Trend</h4>
          <div className="flex items-end justify-between gap-1.5 h-24">
            {data.map((point, index) => (
              <div
                key={index}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div className="w-full relative group">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(point.value / maxValue) * 96}px` }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className={`w-full rounded-t ${
                      index === data.length - 1
                        ? 'bg-emerald-400'
                        : 'bg-emerald-400/40'
                    }`}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-white text-gray-900 text-xs rounded px-2 py-1 whitespace-nowrap shadow">
                      {point.value}%
                    </div>
                  </div>
                </div>
                <span className="text-xs text-emerald-300">{point.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {improvementPercentage !== undefined && (
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-xs text-emerald-200 mb-0.5">Change</div>
              <div
                className={`text-lg font-semibold ${
                  improvementPercentage > 0
                    ? 'text-emerald-300'
                    : improvementPercentage < 0
                      ? 'text-red-300'
                      : 'text-white'
                }`}
              >
                {improvementPercentage > 0 ? '+' : ''}
                {improvementPercentage}%
              </div>
            </div>
          )}
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-emerald-200 mb-0.5">Status</div>
            <div
              className={`text-sm font-medium ${
                isOnTrack ? 'text-emerald-300' : 'text-amber-300'
              }`}
            >
              {isOnTrack ? 'On Track' : 'Needs Focus'}
            </div>
          </div>
        </div>

        {/* Action */}
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="w-full py-2 px-4 text-sm font-medium text-emerald-900 bg-white hover:bg-emerald-50 rounded-lg transition-colors"
          >
            View Details
          </button>
        )}
      </div>
    </div>
  );
}
