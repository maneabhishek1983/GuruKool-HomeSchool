'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import LiquidButton from '@/components/ui/LiquidButton';

interface ActiveSessionCardProps {
  teacherName: string;
  studentName: string;
  startTime: string; // ISO string or formatted time
  subject?: string;
  location?: string;
  onEndSession?: () => void;
  onViewDetails?: () => void;
  className?: string;
}

export default function ActiveSessionCard({
  teacherName,
  studentName,
  startTime,
  subject = 'General Learning',
  location,
  onEndSession,
  onViewDetails,
  className = '',
}: ActiveSessionCardProps) {
  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  useEffect(() => {
    const calculateElapsed = () => {
      const start = new Date(startTime).getTime();
      const now = Date.now();
      const diff = now - start;

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setElapsedTime(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative overflow-hidden rounded-3xl ${className}`}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/optimized/sessions/active-session.webp"
          alt="Active Learning Session"
          fill
          className="object-cover"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/90 via-emerald-900/85 to-teal-900/90" />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + Math.random(),
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 p-6">
        {/* Header with Pulse Indicator */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-3 h-3 bg-green-400 rounded-full" />
              <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Active Session</h3>
              <p className="text-sm text-green-100">In Progress</p>
            </div>
          </div>
          
          {/* Elapsed Time */}
          <motion.div
            className="backdrop-blur-xl bg-white/10 rounded-2xl px-4 py-2 border border-white/20"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <div className="text-2xl font-mono font-bold text-white">
              {elapsedTime}
            </div>
            <div className="text-xs text-green-100 text-center">Elapsed</div>
          </motion.div>
        </div>

        {/* Session Details */}
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-green-100 mb-1">Teacher</div>
              <div className="text-white font-semibold flex items-center gap-2">
                <span>👨‍🏫</span>
                <span>{teacherName}</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-green-100 mb-1">Student</div>
              <div className="text-white font-semibold flex items-center gap-2">
                <span>🎓</span>
                <span>{studentName}</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-green-100 mb-1">Subject</div>
              <div className="text-white font-semibold flex items-center gap-2">
                <span>📚</span>
                <span>{subject}</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-green-100 mb-1">Started</div>
              <div className="text-white font-semibold flex items-center gap-2">
                <span>🕐</span>
                <span>{new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>

          {location && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="text-xs text-green-100 mb-1">Location</div>
              <div className="text-white font-semibold flex items-center gap-2">
                <span>📍</span>
                <span>{location}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {onEndSession && (
            <LiquidButton
              variant="primary"
              size="large"
              onClick={onEndSession}
              className="flex-1 bg-white text-green-900 hover:bg-green-50"
            >
              ⏹️ End Session
            </LiquidButton>
          )}
          {onViewDetails && (
            <LiquidButton
              variant="outline"
              size="large"
              onClick={onViewDetails}
              className="border-white text-white hover:bg-white/10"
            >
              📋 Details
            </LiquidButton>
          )}
        </div>

        {/* Session Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 flex items-center justify-between text-xs text-green-100"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>Session active and tracking</span>
          </div>
          <div>
            {location && '✓ Location verified'}
          </div>
        </motion.div>
      </div>

      {/* Decorative Gradient Orbs */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-400 rounded-full blur-3xl opacity-20" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-teal-400 rounded-full blur-3xl opacity-20" />
    </motion.div>
  );
}
