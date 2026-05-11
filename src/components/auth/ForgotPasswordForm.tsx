'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingInput } from '@/components/ui/FloatingInput';
import { LiquidGlassButton } from '@/components/ui/LiquidGlassButton';

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Simulate API call for now since actual backend might not be ready
      await new Promise(resolve => setTimeout(resolve, 1500));

      // In a real app, call supabase.auth.resetPasswordForEmail(email)
      setIsSubmitted(true);
    } catch {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Check your email
          </h3>
          <p className="text-gray-600 mb-6">
            We've sent password reset instructions to <strong>{email}</strong>
          </p>
          <LiquidGlassButton onClick={onBackToLogin} className="w-full">
            Back to Login
          </LiquidGlassButton>
        </motion.div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
      data-testid="forgot-password-form"
    >
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Reset Password</h3>
        <p className="text-gray-500 text-sm">
          Enter your email to receive reset instructions
        </p>
      </div>

      <FloatingInput
        label="Email Address"
        type="email"
        name="email"
        autoComplete="email"
        data-testid="forgot-password-email-input"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
        icon={
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        }
      />

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <LiquidGlassButton
        type="submit"
        disabled={isLoading}
        className="w-full"
        isLoading={isLoading}
        data-testid="forgot-password-submit-button"
      >
        Send Reset Link
      </LiquidGlassButton>

      <div className="text-center mt-4">
        <button
          type="button"
          onClick={onBackToLogin}
          className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
        >
          Cancel and go back
        </button>
      </div>
    </form>
  );
}
