'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { LiquidButton } from '@/components/ui/LiquidButton';

interface FeedbackCardProps {
  teacherName: string;
  teacherAvatar?: string;
  studentName: string;
  subject: string;
  date: string;
  rating: number; // 1-5
  strengths: string[];
  improvements: string[];
  overallFeedback: string;
  nextSteps?: string;
  onReply?: () => void;
  onViewDetails?: () => void;
  className?: string;
}

export default function FeedbackCard({
  teacherName,
  teacherAvatar,
  studentName,
  subject,
  date,
  rating,
  strengths,
  improvements,
  overallFeedback,
  nextSteps,
  onReply,
  onViewDetails,
  className = '',
}: FeedbackCardProps) {
  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) {
      return 'text-green-300';
    }
    if (rating >= 3.5) {
      return 'text-blue-300';
    }
    if (rating >= 2.5) {
      return 'text-yellow-300';
    }
    return 'text-orange-300';
  };

  const getRatingText = (rating: number) => {
    if (rating >= 4.5) {
      return 'Excellent Progress!';
    }
    if (rating >= 3.5) {
      return 'Good Work!';
    }
    if (rating >= 2.5) {
      return 'Making Progress';
    }
    return 'Needs Attention';
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
          src="/images/optimized/communication/feedback-card.webp"
          alt="Teacher Feedback"
          fill
          className="object-cover"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/90 via-amber-900/85 to-yellow-900/90" />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(18)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-white/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -65, 0],
              x: [0, Math.random() * 45 - 22, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.6, 1],
            }}
            transition={{
              duration: 6.5 + Math.random() * 2,
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
          <div className="flex items-center gap-3">
            {/* Teacher Avatar */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-xl border-2 border-white/40">
              {teacherAvatar ? (
                <Image
                  src={teacherAvatar}
                  alt={teacherName}
                  fill
                  className="rounded-full"
                />
              ) : (
                teacherName.charAt(0)
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">{teacherName}</h3>
              <p className="text-sm text-yellow-100">Teacher Feedback</p>
            </div>
          </div>

          {/* Rating Badge */}
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 10, delay: 0.2 }}
            className="backdrop-blur-xl bg-white/20 rounded-2xl p-3 border border-white/20 text-center"
          >
            <div className={`text-3xl font-bold ${getRatingColor(rating)}`}>
              {rating.toFixed(1)}
            </div>
            <div className="flex gap-0.5 mt-1">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={
                    i < Math.floor(rating) ? 'text-yellow-300' : 'text-white/30'
                  }
                >
                  ⭐
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Student & Subject Info */}
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20 mb-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-yellow-100 mb-1">Student</div>
              <div className="text-sm font-semibold text-white">
                {studentName}
              </div>
            </div>
            <div>
              <div className="text-xs text-yellow-100 mb-1">Subject</div>
              <div className="text-sm font-semibold text-white">{subject}</div>
            </div>
            <div>
              <div className="text-xs text-yellow-100 mb-1">Date</div>
              <div className="text-sm font-semibold text-white">{date}</div>
            </div>
          </div>
        </div>

        {/* Rating Status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-4"
        >
          <div className={`text-2xl font-bold ${getRatingColor(rating)}`}>
            {getRatingText(rating)}
          </div>
        </motion.div>

        {/* Strengths */}
        {strengths.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="backdrop-blur-xl bg-green-500/20 rounded-2xl p-4 border border-green-400/30 mb-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">💪</span>
              <h4 className="text-sm font-semibold text-white">Strengths</h4>
            </div>
            <ul className="space-y-2">
              {strengths.map((strength, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-white"
                >
                  <span className="text-green-300 mt-0.5">✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Areas for Improvement */}
        {improvements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="backdrop-blur-xl bg-orange-500/20 rounded-2xl p-4 border border-orange-400/30 mb-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🎯</span>
              <h4 className="text-sm font-semibold text-white">
                Areas for Improvement
              </h4>
            </div>
            <ul className="space-y-2">
              {improvements.map((improvement, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-white"
                >
                  <span className="text-orange-300 mt-0.5">→</span>
                  <span>{improvement}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Overall Feedback */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20 mb-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">💬</span>
            <h4 className="text-sm font-semibold text-white">
              Overall Feedback
            </h4>
          </div>
          <p className="text-sm text-white leading-relaxed">
            {overallFeedback}
          </p>
        </motion.div>

        {/* Next Steps */}
        {nextSteps && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="backdrop-blur-xl bg-blue-500/20 rounded-2xl p-4 border border-blue-400/30 mb-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🚀</span>
              <h4 className="text-sm font-semibold text-white">Next Steps</h4>
            </div>
            <p className="text-sm text-white leading-relaxed">{nextSteps}</p>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {onReply && (
            <LiquidButton
              variant="primary"
              size="lg"
              onClick={onReply}
              className="flex-1 bg-white text-orange-900 hover:bg-yellow-50"
            >
              💬 Reply to Teacher
            </LiquidButton>
          )}

          {onViewDetails && (
            <LiquidButton
              variant="secondary"
              size="lg"
              onClick={onViewDetails}
              className="flex-1 bg-white/10 text-white hover:bg-white/20 border border-white/20"
            >
              📊 View Full Report
            </LiquidButton>
          )}
        </div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-4 text-xs text-yellow-100 text-center"
        >
          💡 Feedback helps guide personalized learning paths
        </motion.div>
      </div>

      {/* Decorative Gradient Orbs */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-400 rounded-full blur-3xl opacity-20" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-yellow-400 rounded-full blur-3xl opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-amber-400 rounded-full blur-3xl opacity-10" />
    </motion.div>
  );
}
