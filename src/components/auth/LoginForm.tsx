'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthContext } from '@/lib/authContext';
import { FloatingInput } from '@/components/ui/FloatingInput';
import { LiquidGlassButton } from '@/components/ui/LiquidGlassButton';
import { triggerConfetti } from '@/lib/confetti';

interface LoginFormProps {
  onSignupClick: () => void;
  onForgotClick: () => void;
  onSuccess?: () => void;
}

export function LoginForm({
  onSignupClick,
  onForgotClick,
  onSuccess,
}: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const { login } = useAuthContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await login(email, password);

      if (result.success) {
        triggerConfetti('success');
        if (onSuccess) {
          onSuccess();
        }

        // Navigation based on role
        if (result.user?.role === 'admin') {
          router.push('/admin/dashboard');
        } else if (result.user?.role === 'teacher') {
          router.push('/teacher/dashboard');
        } else if (result.user?.role === 'student') {
          router.push('/student/dashboard');
        } else {
          router.push('/parent/dashboard');
        }
      } else {
        setError(
          result.error || 'Login failed. Please check your credentials.'
        );
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
      data-testid="login-form"
    >
      <FloatingInput
        label="Email Address"
        type="email"
        name="email"
        autoComplete="email"
        data-testid="login-email-input"
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

      <FloatingInput
        label="Password"
        type="password"
        name="password"
        autoComplete="current-password"
        data-testid="login-password-input"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Enter your password"
        required
        showToggle
        onToggle={() => setShowPassword(!showPassword)}
        toggleState={showPassword}
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
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        }
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onForgotClick}
          data-testid="login-forgot-password-link"
          className="text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors"
        >
          Forgot password?
        </button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            role="alert"
            data-testid="login-error-message"
            className="p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl"
          >
            <p className="text-red-600 text-sm text-center flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <LiquidGlassButton
        type="submit"
        disabled={isLoading}
        className="w-full"
        isLoading={isLoading}
        data-testid="login-submit-button"
      >
        Sign In
      </LiquidGlassButton>

      <div className="text-center mt-6">
        <button
          type="button"
          onClick={onSignupClick}
          data-testid="login-signup-link"
          className="text-purple-600 hover:text-purple-800 text-sm font-medium transition-colors"
        >
          Don't have an account? Sign up
        </button>
      </div>
    </form>
  );
}
