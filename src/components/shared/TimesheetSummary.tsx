'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { LiquidButton } from '@/components/ui/LiquidButton';

interface DayEntry {
  day: string;
  hours: number;
  sessions: number;
  status: 'complete' | 'partial' | 'none';
}

interface TimesheetSummaryProps {
  weekOf: string; // e.g., "Jan 15 - Jan 21, 2026"
  totalHours: number;
  totalSessions: number;
  weeklyEntries: DayEntry[];
  onViewFullReport?: () => void;
  onExport?: () => void;
  className?: string;
}

export default function TimesheetSummary({
  weekOf,
  totalHours,
  totalSessions,
  weeklyEntries,
  onViewFullReport,
  onExport,
  className = '',
}: TimesheetSummaryProps) {
  const maxHours = Math.max(...weeklyEntries.map(e => e.hours), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-3xl ${className}`}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/optimized/sessions/timesheet-summary.webp"
          alt="Timesheet Summary"
          fill
          className="object-cover"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-indigo-900/85 to-purple-900/90" />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-white/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -40, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 4 + Math.random(),
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">
              📊 Weekly Timesheet
            </h3>
            <p className="text-blue-100">{weekOf}</p>
          </div>

          {/* Total Hours Badge */}
          <motion.div
            className="backdrop-blur-xl bg-white/10 rounded-2xl px-4 py-3 border border-white/20 text-center"
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-3xl font-bold text-white">{totalHours}</div>
            <div className="text-xs text-blue-100">Total Hours</div>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {totalSessions}
                </div>
                <div className="text-sm text-blue-100">Sessions</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⏱️</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {(totalHours / Math.max(totalSessions, 1)).toFixed(1)}h
                </div>
                <div className="text-sm text-blue-100">Avg/Session</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Daily Breakdown */}
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20 mb-4">
          <h4 className="text-sm font-semibold text-white mb-3">
            Daily Breakdown
          </h4>
          <div className="space-y-3">
            {weeklyEntries.map((entry, index) => (
              <motion.div
                key={entry.day}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="flex items-center gap-3"
              >
                {/* Day */}
                <div className="w-12 text-xs font-medium text-blue-100">
                  {entry.day}
                </div>

                {/* Progress Bar */}
                <div className="flex-1 h-8 bg-white/5 rounded-lg overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(entry.hours / maxHours) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.5 + index * 0.05 }}
                    className={`h-full ${
                      entry.status === 'complete'
                        ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                        : entry.status === 'partial'
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                          : 'bg-gradient-to-r from-gray-400 to-gray-500'
                    }`}
                  />
                  <div className="absolute inset-0 flex items-center px-3">
                    <span className="text-xs font-semibold text-white drop-shadow-lg">
                      {entry.hours}h ({entry.sessions} sessions)
                    </span>
                  </div>
                </div>

                {/* Status Icon */}
                <div className="w-6">
                  {entry.status === 'complete' && (
                    <span className="text-green-400">✓</span>
                  )}
                  {entry.status === 'partial' && (
                    <span className="text-yellow-400">○</span>
                  )}
                  {entry.status === 'none' && (
                    <span className="text-gray-400">−</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {onViewFullReport && (
            <LiquidButton
              variant="primary"
              size="lg"
              onClick={onViewFullReport}
              className="flex-1 bg-white text-indigo-900 hover:bg-blue-50"
            >
              📄 Full Report
            </LiquidButton>
          )}
          {onExport && (
            <LiquidButton
              variant="ghost"
              size="lg"
              onClick={onExport}
              className="border-white text-white hover:bg-white/10"
            >
              📥 Export
            </LiquidButton>
          )}
        </div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-4 text-xs text-blue-100 text-center"
        >
          <span className="flex items-center justify-center gap-2">
            <span>✓ Complete</span>
            <span>○ Partial</span>
            <span>− No sessions</span>
          </span>
        </motion.div>
      </div>

      {/* Decorative Gradient Orbs */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-400 rounded-full blur-3xl opacity-20" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-400 rounded-full blur-3xl opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-indigo-400 rounded-full blur-3xl opacity-10" />
    </motion.div>
  );
}
