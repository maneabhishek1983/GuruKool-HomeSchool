'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { LiquidButton } from '@/components/ui/LiquidButton';
import { Liquid3DOrb } from '@/components/ui/Liquid3DOrb';

interface Student {
  id: string;
  name: string;
  avatar?: string;
  progress: number;
  activeSession?: boolean;
}

interface ParentDashboardHeroProps {
  parentName?: string;
  students?: Student[];
  totalStudents?: number;
  weeklyHours?: number;
  onAddStudent?: () => void;
  onViewProgress?: () => void;
  className?: string;
}

export default function ParentDashboardHero({
  parentName,
  students = [],
  totalStudents = 0,
  weeklyHours = 0,
  onAddStudent,
  onViewProgress,
  className = '',
}: ParentDashboardHeroProps) {
  return (
    <div className={`relative w-full overflow-hidden rounded-3xl ${className}`}>
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <Image
          src="/images/optimized/dashboard-heroes/parent-reviewing.webp"
          alt="Parent Dashboard"
          fill
          className="object-cover"
          priority
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/90 via-purple-900/80 to-pink-900/70" />
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
                Welcome{parentName && `, ${parentName}`}! 🏡
              </h1>
              <p className="text-xl text-indigo-100 mb-8">
                Manage your homeschool journey with confidence
              </p>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="grid grid-cols-2 gap-4 mb-8"
            >
              {/* Total Students */}
              <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20">
                <div className="text-3xl font-bold text-white mb-1">
                  {totalStudents}
                </div>
                <div className="text-sm text-indigo-100">
                  {totalStudents === 1 ? 'Student' : 'Students'}
                </div>
              </div>

              {/* Weekly Hours */}
              <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20">
                <div className="text-3xl font-bold text-white mb-1">
                  {weeklyHours}h
                </div>
                <div className="text-sm text-indigo-100">This Week</div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-wrap gap-4"
            >
              {onAddStudent && (
                <LiquidButton
                  variant="primary"
                  size="lg"
                  onClick={onAddStudent}
                  className="bg-white text-indigo-900 hover:bg-indigo-50"
                >
                  ➕ Add Student
                </LiquidButton>
              )}
              {onViewProgress && (
                <LiquidButton
                  variant="ghost"
                  size="lg"
                  onClick={onViewProgress}
                  className="border-white text-white hover:bg-white/10"
                >
                  📊 View Progress
                </LiquidButton>
              )}
            </motion.div>
          </div>

          {/* Right: Student Cards */}
          {students.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="space-y-4"
            >
              {students.slice(0, 3).map((student, index) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.6 }}
                  className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-2xl font-bold text-white">
                      {student.avatar || student.name.charAt(0)}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-white">
                          {student.name}
                        </h3>
                        {student.activeSession && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-300 text-xs rounded-full">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                            Active
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-indigo-400 to-purple-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${student.progress}%` }}
                            transition={{
                              delay: 0.8 + index * 0.1,
                              duration: 1,
                            }}
                          />
                        </div>
                        <span className="text-xs text-indigo-200 font-medium">
                          {student.progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {students.length > 3 && (
                <div className="text-center text-indigo-200 text-sm">
                  +{students.length - 3} more{' '}
                  {students.length - 3 === 1 ? 'student' : 'students'}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Interactive Liquid 3D Orbs */}
      <div className="absolute top-4 right-4 z-0 pointer-events-none opacity-70">
        <Liquid3DOrb
          size="xl"
          variant="primary"
          theme="literacy"
          interactive={false}
        />
      </div>
      <div className="absolute bottom-4 left-4 z-0 pointer-events-none opacity-70">
        <Liquid3DOrb
          size="lg"
          variant="glow"
          theme="creative"
          interactive={false}
        />
      </div>
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 z-0 pointer-events-none opacity-50 hidden lg:block">
        <Liquid3DOrb
          size="md"
          variant="secondary"
          theme="literacy"
          interactive={false}
        />
      </div>
    </div>
  );
}
