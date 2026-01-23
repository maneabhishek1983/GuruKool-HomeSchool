'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { LiquidButton } from '@/components/ui/LiquidButton';

export type EmptyStateType = 'no-data' | 'no-results' | 'welcome' | 'no-students' | 'no-teachers' | 'no-sessions';

interface EmptyStateProps {
  type: EmptyStateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const emptyStateConfig: Record<EmptyStateType, {
  image: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultAction: string;
  gradient: string;
}> = {
  'no-data': {
    image: '/images/optimized/empty-states/no-data.webp',
    defaultTitle: 'No Data Yet',
    defaultDescription: 'Get started by adding your first item to see it here',
    defaultAction: 'Get Started',
    gradient: 'from-blue-500 to-cyan-500',
  },
  'no-results': {
    image: '/images/optimized/empty-states/no-results.webp',
    defaultTitle: 'No Results Found',
    defaultDescription: 'Try adjusting your search terms or filters to find what you\'re looking for',
    defaultAction: 'Clear Filters',
    gradient: 'from-purple-500 to-pink-500',
  },
  'welcome': {
    image: '/images/optimized/empty-states/welcome.webp',
    defaultTitle: 'Welcome to GuruKool!',
    defaultDescription: 'Let\'s get started on your homeschool management journey',
    defaultAction: 'Begin Setup',
    gradient: 'from-emerald-500 to-teal-500',
  },
  'no-students': {
    image: '/images/optimized/empty-states/no-data.webp',
    defaultTitle: 'No Students Added',
    defaultDescription: 'Add your first student to start managing their homeschool education',
    defaultAction: 'Add Student',
    gradient: 'from-amber-500 to-orange-500',
  },
  'no-teachers': {
    image: '/images/optimized/empty-states/no-data.webp',
    defaultTitle: 'No Teachers Assigned',
    defaultDescription: 'Invite teachers to join your homeschool program',
    defaultAction: 'Invite Teacher',
    gradient: 'from-indigo-500 to-purple-500',
  },
  'no-sessions': {
    image: '/images/optimized/empty-states/no-data.webp',
    defaultTitle: 'No Sessions Scheduled',
    defaultDescription: 'Schedule your first teaching session to get started',
    defaultAction: 'Schedule Session',
    gradient: 'from-rose-500 to-pink-500',
  },
};

export default function EmptyState({
  type,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  const config = emptyStateConfig[type];
  const displayTitle = title || config.defaultTitle;
  const displayDescription = description || config.defaultDescription;
  const displayAction = actionLabel || config.defaultAction;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex flex-col items-center justify-center py-16 px-6 ${className}`}
    >
      {/* Glass Card Container */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="relative backdrop-blur-xl bg-white/10 rounded-3xl p-12 border border-white/20 shadow-2xl max-w-2xl w-full"
      >
        {/* Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-5 rounded-3xl`} />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Image with Animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5, type: 'spring' }}
            className="mb-8 relative"
          >
            <Image
              src={config.image}
              alt={displayTitle}
              width={300}
              height={300}
              className="w-64 h-64 object-contain"
              priority
            />

            {/* Floating particles around image */}
            <div className="absolute inset-0 -z-10">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className={`absolute w-2 h-2 rounded-full bg-gradient-to-br ${config.gradient}`}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.3, 0.8, 0.3],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* Title */}
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl font-bold text-gray-900 dark:text-white mb-3 text-center"
          >
            {displayTitle}
          </motion.h3>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-gray-600 dark:text-gray-300 mb-8 text-center max-w-md text-lg"
          >
            {displayDescription}
          </motion.p>

          {/* Action Button */}
          {onAction && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              <LiquidButton
                variant="primary"
                size="large"
                onClick={onAction}
              >
                {displayAction}
              </LiquidButton>
            </motion.div>
          )}
        </div>

        {/* Decorative gradient orbs */}
        <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${config.gradient} rounded-full blur-3xl opacity-20`} />
        <div className={`absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br ${config.gradient} rounded-full blur-3xl opacity-20`} />
      </motion.div>
    </motion.div>
  );
}
