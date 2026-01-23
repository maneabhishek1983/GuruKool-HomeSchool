'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect } from 'react';
import LiquidButton from '@/components/ui/LiquidButton';
import { triggerConfetti } from '@/lib/confetti';

interface AchievementCelebrationProps {
  achievementTitle: string;
  achievementDescription: string;
  studentName: string;
  icon?: string; // emoji or icon
  points?: number;
  badge?: string;
  date?: string;
  onShare?: () => void;
  onClose?: () => void;
  autoConfetti?: boolean;
  className?: string;
}

export default function AchievementCelebration({
  achievementTitle,
  achievementDescription,
  studentName,
  icon = '🏆',
  points,
  badge,
  date = new Date().toLocaleDateString(),
  onShare,
  onClose,
  autoConfetti = true,
  className = '',
}: AchievementCelebrationProps) {
  // Trigger confetti on mount
  useEffect(() => {
    if (autoConfetti) {
      const timer = setTimeout(() => {
        triggerConfetti('fireworks');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoConfetti]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 50 }}
      transition={{ type: 'spring', damping: 15 }}
      className={`relative overflow-hidden rounded-3xl ${className}`}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/optimized/progress/achievement-celebration.webp"
          alt="Achievement Celebration"
          fill
          className="object-cover"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/90 via-orange-900/85 to-amber-900/90" />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 8 + 4,
              height: Math.random() * 8 + 4,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: [
                'rgba(255, 215, 0, 0.6)',
                'rgba(255, 165, 0, 0.6)',
                'rgba(255, 140, 0, 0.6)',
              ][Math.floor(Math.random() * 3)],
            }}
            animate={{
              y: [0, -80, 0],
              x: [0, Math.random() * 60 - 30, 0],
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.8, 1],
            }}
            transition={{
              duration: 5 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Animated Stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute text-4xl"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            initial={{ opacity: 0, scale: 0, rotate: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          >
            ⭐
          </motion.div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 p-8">
        {/* Icon/Badge */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 10, delay: 0.2 }}
          className="flex justify-center mb-6"
        >
          <div className="relative">
            {/* Pulsing Ring */}
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
              className="absolute inset-0 rounded-full bg-yellow-400 blur-xl"
            />
            
            {/* Icon Container */}
            <div className="relative backdrop-blur-xl bg-white/20 rounded-full w-32 h-32 flex items-center justify-center border-4 border-white/40 shadow-2xl">
              <span className="text-7xl">{icon}</span>
            </div>

            {/* Badge Overlay */}
            {badge && (
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute -bottom-2 -right-2 backdrop-blur-xl bg-orange-500 text-white rounded-full px-3 py-1 text-xs font-bold border-2 border-white shadow-lg"
              >
                {badge}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-4"
        >
          <h2 className="text-4xl font-bold text-white mb-2">
            🎉 Congratulations!
          </h2>
          <h3 className="text-2xl font-bold text-yellow-100">
            {achievementTitle}
          </h3>
        </motion.div>

        {/* Student Name */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-6"
        >
          <div className="inline-block backdrop-blur-xl bg-white/10 rounded-full px-6 py-2 border border-white/20">
            <span className="text-lg font-semibold text-white">{studentName}</span>
          </div>
        </motion.div>

        {/* Description Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20 mb-6"
        >
          <p className="text-center text-white text-lg leading-relaxed">
            {achievementDescription}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-2 gap-4 mb-6"
        >
          {points !== undefined && (
            <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20 text-center">
              <div className="text-3xl font-bold text-yellow-300 mb-1">
                +{points}
              </div>
              <div className="text-sm text-yellow-100">Points Earned</div>
            </div>
          )}

          <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20 text-center">
            <div className="text-lg font-bold text-white mb-1">
              {date}
            </div>
            <div className="text-sm text-yellow-100">Achievement Date</div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex gap-3"
        >
          {onShare && (
            <LiquidButton
              variant="primary"
              size="large"
              onClick={onShare}
              className="flex-1 bg-white text-orange-900 hover:bg-yellow-50"
            >
              📤 Share Achievement
            </LiquidButton>
          )}

          {onClose && (
            <LiquidButton
              variant="secondary"
              size="large"
              onClick={onClose}
              className="flex-1 bg-white/10 text-white hover:bg-white/20 border border-white/20"
            >
              ✨ Continue Learning
            </LiquidButton>
          )}
        </motion.div>

        {/* Motivational Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6 text-center"
        >
          <p className="text-sm text-yellow-100 italic">
            "Success is the sum of small efforts repeated day in and day out."
          </p>
        </motion.div>
      </div>

      {/* Decorative Gradient Orbs */}
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-yellow-400 rounded-full blur-3xl opacity-20" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-orange-400 rounded-full blur-3xl opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-400 rounded-full blur-3xl opacity-10" />

      {/* Sparkle Effect */}
      <motion.div
        animate={{
          opacity: [0, 1, 0],
          scale: [0.8, 1.2, 0.8],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
        className="absolute top-10 right-10 text-4xl"
      >
        ✨
      </motion.div>
      <motion.div
        animate={{
          opacity: [0, 1, 0],
          scale: [0.8, 1.2, 0.8],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          delay: 1,
        }}
        className="absolute bottom-10 left-10 text-4xl"
      >
        ✨
      </motion.div>
    </motion.div>
  );
}
