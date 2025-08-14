'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthContext } from '@/lib/authContext';
import { AuthStatusIndicator } from './AuthStatusIndicator';

/**
 * QR Authentication Integration Component
 * Handles QR token verification and authentication flow
 */
export function QRAuthIntegration() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyQRToken, isLoading } = useAuthContext();
  
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'expired'>('verifying');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleQRAuth = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setError('No authentication token provided');
        return;
      }

      try {
        setStatus('verifying');
        
        // Verify the QR token
        const isValid = await verifyQRToken(token);
        
        if (isValid) {
          setStatus('success');
          // Redirect will be handled by the auth context
        } else {
          setStatus('error');
          setError('Invalid or expired authentication token');
        }
      } catch (err) {
        setStatus('error');
        setError('Authentication failed. Please try again.');
      }
    };

    handleQRAuth();
  }, [searchParams, verifyQRToken]);

  const handleRetry = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <motion.div
        className="max-w-md mx-auto text-center space-y-6 p-8"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {/* Status Indicator */}
        <div className="flex justify-center">
          <AuthStatusIndicator
            authStatus={status === 'verifying' ? 'pending' : status === 'success' ? 'success' : 'error'}
            size="lg"
            showText={false}
          />
        </div>

        {/* Status Content */}
        <div className="space-y-4">
          {status === 'verifying' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-2xl font-bold text-neutral-800 mb-2">
                Verifying Authentication
              </h1>
              <p className="text-neutral-600">
                Please wait while we verify your QR code authentication...
              </p>
              <div className="mt-4">
                <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
              </div>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-2xl font-bold text-success-800 mb-2">
                Authentication Successful!
              </h1>
              <p className="text-success-600">
                You have been successfully authenticated. Redirecting to your dashboard...
              </p>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-2xl font-bold text-error-800 mb-2">
                Authentication Failed
              </h1>
              <p className="text-error-600 mb-4">
                {error || 'Unable to verify your authentication. Please try again.'}
              </p>
              
              <div className="space-y-3">
                <motion.button
                  onClick={handleRetry}
                  className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Try Again
                </motion.button>
                
                <motion.button
                  onClick={() => router.push('/')}
                  className="w-full px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-xl transition-colors duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Go Home
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Security Info */}
        <div className="text-xs text-neutral-500 space-y-1">
          <p>🔒 Secure authentication powered by AI</p>
          <p>Your authentication is protected by advanced security measures</p>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * QR Authentication Success Component
 * Shows success state with user information
 */
interface QRAuthSuccessProps {
  user: any;
  onContinue: () => void;
}

export function QRAuthSuccess({ user, onContinue }: QRAuthSuccessProps) {
  return (
    <motion.div
      className="text-center space-y-6"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto">
        <span className="text-2xl">✅</span>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold text-success-800 mb-2">
          Welcome back, {user.name}!
        </h2>
        <p className="text-success-600">
          You have been successfully authenticated via QR code.
        </p>
      </div>

      <div className="bg-success-50 border border-success-200 rounded-xl p-4">
        <div className="text-sm text-success-700 space-y-1">
          <p><strong>Role:</strong> {user.role}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Authentication:</strong> QR Code (AI-Enhanced)</p>
        </div>
      </div>

      <motion.button
        onClick={onContinue}
        className="w-full px-6 py-3 bg-success-600 hover:bg-success-700 text-white font-medium rounded-xl transition-colors duration-200"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Continue to Dashboard
      </motion.button>
    </motion.div>
  );
}