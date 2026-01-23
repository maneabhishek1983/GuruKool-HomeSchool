'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LiquidButton } from '@/components/ui/LiquidButton';

export type ErrorType = '404' | '500' | 'offline' | '403';

interface ErrorPageProps {
  type: ErrorType;
  title?: string;
  description?: string;
  showHomeButton?: boolean;
  showRetryButton?: boolean;
  onRetry?: () => void;
  className?: string;
}

const errorConfig: Record<ErrorType, {
  image: string;
  defaultTitle: string;
  defaultDescription: string;
  gradient: string;
  icon: string;
}> = {
  '404': {
    image: '/images/optimized/errors/404.webp',
    defaultTitle: 'Page Not Found',
    defaultDescription: 'The page you\'re looking for doesn\'t exist or has been moved to a new location.',
    gradient: 'from-blue-500 to-purple-500',
    icon: '🔍',
  },
  '500': {
    image: '/images/optimized/errors/500.webp',
    defaultTitle: 'Server Error',
    defaultDescription: 'Something went wrong on our end. Our team has been notified and is working to fix it.',
    gradient: 'from-red-500 to-orange-500',
    icon: '⚠️',
  },
  'offline': {
    image: '/images/optimized/errors/offline.webp',
    defaultTitle: 'You\'re Offline',
    defaultDescription: 'Please check your internet connection and try again. Some features may not be available offline.',
    gradient: 'from-gray-500 to-slate-500',
    icon: '📡',
  },
  '403': {
    image: '/images/optimized/errors/404.webp',
    defaultTitle: 'Access Denied',
    defaultDescription: 'You don\'t have permission to access this page. Please contact your administrator.',
    gradient: 'from-amber-500 to-red-500',
    icon: '🔒',
  },
};

export default function ErrorPage({
  type,
  title,
  description,
  showHomeButton = true,
  showRetryButton = false,
  onRetry,
  className = '',
}: ErrorPageProps) {
  const config = errorConfig[type];
  const displayTitle = title || config.defaultTitle;
  const displayDescription = description || config.defaultDescription;

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl w-full"
      >
        {/* Glass Card Container */}
        <div className="relative backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 rounded-3xl p-12 border border-white/30 shadow-2xl overflow-hidden">
          {/* Gradient Background */}
          <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-5`} />

          {/* Content Grid */}
          <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Image */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6, type: 'spring' }}
              className="relative"
            >
              <Image
                src={config.image}
                alt={displayTitle}
                width={400}
                height={400}
                className="w-full h-auto object-contain"
                priority
              />

              {/* Floating particles */}
              <div className="absolute inset-0 -z-10">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className={`absolute w-3 h-3 rounded-full bg-gradient-to-br ${config.gradient}`}
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, -30, 0],
                      x: [0, Math.random() * 20 - 10, 0],
                      opacity: [0.2, 0.6, 0.2],
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Right: Content */}
            <div className="flex flex-col">
              {/* Error Code Badge */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className={`inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-gradient-to-r ${config.gradient} text-white font-bold text-sm w-fit`}
              >
                <span className="text-2xl">{config.icon}</span>
                <span>Error {type}</span>
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
              >
                {displayTitle}
              </motion.h1>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="text-gray-600 dark:text-gray-300 mb-8 text-lg leading-relaxed"
              >
                {displayDescription}
              </motion.p>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap gap-4"
              >
                {showHomeButton && (
                  <Link href="/">
                    <LiquidButton variant="primary" size="large">
                      🏠 Go Home
                    </LiquidButton>
                  </Link>
                )}

                {showRetryButton && onRetry && (
                  <LiquidButton
                    variant="secondary"
                    size="large"
                    onClick={onRetry}
                  >
                    🔄 Try Again
                  </LiquidButton>
                )}

                {type === '404' && (
                  <Link href="/search">
                    <LiquidButton variant="outline" size="large">
                      🔍 Search
                    </LiquidButton>
                  </Link>
                )}
              </motion.div>

              {/* Help Text */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-8 text-sm text-gray-500 dark:text-gray-400"
              >
                {type === '500' && 'Error ID: ' + Math.random().toString(36).substring(7).toUpperCase()}
                {type === 'offline' && 'Trying to reconnect...'}
                {type === '404' && 'If you believe this is a mistake, please contact support.'}
                {type === '403' && 'Need access? Contact your administrator.'}
              </motion.p>
            </div>
          </div>

          {/* Decorative gradient orbs */}
          <div className={`absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br ${config.gradient} rounded-full blur-3xl opacity-20`} />
          <div className={`absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-br ${config.gradient} rounded-full blur-3xl opacity-20`} />
        </div>

        {/* Additional Help Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-center"
        >
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Need help? Check out these resources:
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/help" className="text-blue-600 dark:text-blue-400 hover:underline">
              Help Center
            </Link>
            <Link href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">
              Contact Support
            </Link>
            <Link href="/status" className="text-blue-600 dark:text-blue-400 hover:underline">
              System Status
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
