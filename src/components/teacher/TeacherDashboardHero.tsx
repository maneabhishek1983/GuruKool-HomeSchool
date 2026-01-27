'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { LiquidButton } from '@/components/ui/LiquidButton';
import { Liquid3DOrb } from '@/components/ui/Liquid3DOrb';

interface TeacherDashboardHeroProps {
  teacherName?: string;
  activeSessions?: number;
  totalHours?: number;
  upcomingSession?: {
    studentName: string;
    time: string;
  };
  onCheckIn?: () => void;
  onViewSchedule?: () => void;
  className?: string;
}

export default function TeacherDashboardHero({
  teacherName,
  activeSessions = 0,
  totalHours = 0,
  upcomingSession,
  onCheckIn,
  onViewSchedule,
  className = '',
}: TeacherDashboardHeroProps) {
  return (
    <div className={`relative w-full overflow-hidden rounded-3xl ${className}`}>
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <Image
          src="/images/optimized/dashboard-heroes/teacher-planning.webp"
          alt="Teacher Dashboard"
          fill
          className="object-cover"
          priority
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/90 via-teal-900/80 to-cyan-900/70" />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-white/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 p-8 md:p-12">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left: Welcome Message & Stats */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Welcome Back{teacherName && `, ${teacherName}`}! 👋
              </h1>
              <p className="text-xl text-emerald-100 mb-8">
                Ready to inspire and educate today?
              </p>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="grid grid-cols-2 gap-4 mb-8"
            >
              {/* Active Sessions */}
              <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20">
                <div className="text-3xl font-bold text-white mb-1">
                  {activeSessions}
                </div>
                <div className="text-sm text-emerald-100">
                  Active {activeSessions === 1 ? 'Session' : 'Sessions'}
                </div>
              </div>

              {/* Total Hours */}
              <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20">
                <div className="text-3xl font-bold text-white mb-1">
                  {totalHours}h
                </div>
                <div className="text-sm text-emerald-100">This Week</div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-wrap gap-4"
            >
              {onCheckIn && (
                <LiquidButton
                  variant="primary"
                  size="lg"
                  onClick={onCheckIn}
                  className="bg-white text-emerald-900 hover:bg-emerald-50"
                >
                  📍 Check In
                </LiquidButton>
              )}
              {onViewSchedule && (
                <LiquidButton
                  variant="ghost"
                  size="lg"
                  onClick={onViewSchedule}
                  className="border-white text-white hover:bg-white/10"
                >
                  📅 View Schedule
                </LiquidButton>
              )}
            </motion.div>
          </div>

          {/* Right: Upcoming Session Card */}
          {upcomingSession && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-2xl">
                  ⏰
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Upcoming Session
                  </h3>
                  <p className="text-emerald-100 mb-1">
                    <span className="font-medium">
                      {upcomingSession.studentName}
                    </span>
                  </p>
                  <p className="text-sm text-emerald-200">
                    {upcomingSession.time}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-400"
                  initial={{ width: 0 }}
                  animate={{ width: '75%' }}
                  transition={{ delay: 0.8, duration: 1 }}
                />
              </div>
              <p className="text-xs text-emerald-200 mt-2">
                Preparation: 75% complete
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Interactive Liquid 3D Orbs */}
      <div className="absolute top-4 right-4 z-0 pointer-events-none opacity-70">
        <Liquid3DOrb
          size="xl"
          variant="secondary"
          theme="stem"
          interactive={false}
        />
      </div>
      <div className="absolute bottom-4 left-4 z-0 pointer-events-none opacity-70">
        <Liquid3DOrb
          size="lg"
          variant="gradient"
          theme="literacy"
          interactive={false}
        />
      </div>
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 z-0 pointer-events-none opacity-50 hidden lg:block">
        <Liquid3DOrb
          size="md"
          variant="secondary"
          theme="stem"
          interactive={false}
        />
      </div>
    </div>
  );
}
