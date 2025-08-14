'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRAuthState } from '@/types';

interface AuthStatusIndicatorProps {
  authStatus: QRAuthState['authStatus'];
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function AuthStatusIndicator({ 
  authStatus, 
  className = '', 
  showText = true,
  size = 'md' 
}: AuthStatusIndicatorProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'success':
        return {
          color: 'bg-success-500',
          icon: '✓',
          text: 'Authenticated',
          animation: { scale: [1, 1.2, 1], transition: { duration: 0.6 } },
        };
      case 'expired':
        return {
          color: 'bg-warning-500',
          icon: '⏰',
          text: 'Expired',
          animation: { opacity: [1, 0.5, 1], transition: { duration: 1, repeat: Infinity } },
        };
      case 'error':
        return {
          color: 'bg-error-500',
          icon: '✗',
          text: 'Failed',
          animation: { x: [-2, 2, -2, 2, 0], transition: { duration: 0.4 } },
        };
      default: // pending
        return {
          color: 'bg-primary-500',
          icon: '⟳',
          text: 'Scanning...',
          animation: { 
            rotate: 360, 
            transition: { duration: 2, repeat: Infinity, ease: 'linear' as const } 
          },
        };
    }
  };

  const config = getStatusConfig(authStatus);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <motion.div
        className={`${sizeClasses[size]} ${config.color} rounded-full flex items-center justify-center text-white font-bold ${textSizeClasses[size]}`}
        animate={config.animation}
        key={authStatus} // Re-trigger animation on status change
      >
        <span>{config.icon}</span>
      </motion.div>
      
      {showText && (
        <AnimatePresence mode="wait">
          <motion.span
            key={authStatus}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className={`font-medium ${textSizeClasses[size]} ${
              authStatus === 'success' ? 'text-success-700' :
              authStatus === 'expired' ? 'text-warning-700' :
              authStatus === 'error' ? 'text-error-700' :
              'text-primary-700'
            }`}
          >
            {config.text}
          </motion.span>
        </AnimatePresence>
      )}
    </div>
  );
}

/**
 * Enhanced Auth Status Card with detailed information
 */
interface AuthStatusCardProps {
  authState: QRAuthState;
  onRefresh?: () => void;
  className?: string;
}

export function AuthStatusCard({ authState, onRefresh, className = '' }: AuthStatusCardProps) {
  const getStatusDetails = (status: string) => {
    switch (status) {
      case 'success':
        return {
          title: 'Authentication Successful',
          description: 'You have been successfully authenticated',
          bgColor: 'bg-success-50',
          borderColor: 'border-success-200',
          textColor: 'text-success-800',
          showRefresh: false,
        };
      case 'expired':
        return {
          title: 'QR Code Expired',
          description: 'Please refresh to generate a new QR code',
          bgColor: 'bg-warning-50',
          borderColor: 'border-warning-200',
          textColor: 'text-warning-800',
          showRefresh: true,
        };
      case 'error':
        return {
          title: 'Authentication Failed',
          description: 'Please try again or use alternative login method',
          bgColor: 'bg-error-50',
          borderColor: 'border-error-200',
          textColor: 'text-error-800',
          showRefresh: true,
        };
      default: // pending
        return {
          title: 'Ready to Scan',
          description: 'Use your mobile device to scan the QR code',
          bgColor: 'bg-primary-50',
          borderColor: 'border-primary-200',
          textColor: 'text-primary-800',
          showRefresh: false,
        };
    }
  };

  const details = getStatusDetails(authState.authStatus);

  return (
    <motion.div
      className={`${details.bgColor} ${details.borderColor} border rounded-2xl p-4 ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <AuthStatusIndicator 
            authStatus={authState.authStatus} 
            showText={false}
            size="lg"
          />
          <div>
            <h3 className={`font-semibold ${details.textColor}`}>
              {details.title}
            </h3>
            <p className={`text-sm ${details.textColor} opacity-80 mt-1`}>
              {details.description}
            </p>
            
            {authState.user && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-2 text-xs bg-white bg-opacity-50 rounded-lg px-2 py-1"
              >
                Welcome, {authState.user.name}!
              </motion.div>
            )}
          </div>
        </div>

        {details.showRefresh && onRefresh && (
          <motion.button
            onClick={onRefresh}
            className="text-sm font-medium px-3 py-1 rounded-lg bg-white bg-opacity-50 hover:bg-opacity-75 transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Refresh
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}