'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthContext } from '@/lib/authContext';
import { FloatingInput } from '@/components/ui/FloatingInput';
import { LiquidGlassButton } from '@/components/ui/LiquidGlassButton';
import { triggerConfetti } from '@/lib/confetti';

interface SignupFormProps {
  onLoginClick: () => void;
  onSuccess?: () => void;
}

export function SignupForm({ onLoginClick, onSuccess }: SignupFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'parent' | 'teacher' | 'admin' | 'student'>(
    'parent'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const { signup } = useAuthContext();

  const roles = [
    { id: 'parent', label: 'Parent', icon: '👨‍👩‍👧', desc: 'Manage your family' },
    { id: 'teacher', label: 'Teacher', icon: '👩‍🏫', desc: 'Inspire students' },
    { id: 'student', label: 'Student', icon: '🎓', desc: 'Learn & grow' },
    { id: 'admin', label: 'Admin', icon: '⚙️', desc: 'Platform settings' },
  ] as const;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signup(email, password, name, role);

      if (result.success) {
        triggerConfetti('fireworks');
        if (onSuccess) {
          onSuccess();
        }

        setTimeout(() => {
          if (result.user?.role === 'admin') {
            router.push('/admin/dashboard');
          } else if (result.user?.role === 'teacher') {
            router.push('/teacher/dashboard');
          } else if (result.user?.role === 'student') {
            router.push('/student/dashboard');
          } else {
            router.push('/parent/dashboard');
          }
        }, 1500);
      } else {
        setError(result.error || 'Signup failed');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
      data-testid="signup-form"
    >
      {/* Role Selection */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="overflow-hidden"
      >
        <label className="block text-sm font-medium text-gray-600 mb-3">
          I am a...
        </label>
        <div className="grid grid-cols-2 gap-3">
          {roles.map((r, index) => (
            <motion.button
              key={r.id}
              type="button"
              data-testid={`signup-role-${r.id}`}
              onClick={() => setRole(r.id)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`
                relative p-4 rounded-xl border-2 transition-all duration-300
                ${
                  role === r.id
                    ? 'border-purple-400 bg-purple-50/80 shadow-lg shadow-purple-500/10'
                    : 'border-gray-200/60 bg-white/30 hover:border-purple-300 hover:bg-purple-50/50'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-2xl mb-1">{r.icon}</div>
              <div
                className={`text-sm font-medium ${role === r.id ? 'text-purple-700' : 'text-gray-700'}`}
              >
                {r.label}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{r.desc}</div>

              {/* Selected indicator */}
              {role === r.id && (
                <motion.div
                  layoutId="roleIndicator"
                  className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center"
                >
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <FloatingInput
        label="Full Name"
        type="text"
        name="name"
        autoComplete="name"
        data-testid="signup-name-input"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Enter your full name"
        required
        delay={0.2}
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
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        }
      />

      <FloatingInput
        label="Email Address"
        type="email"
        name="email"
        autoComplete="email"
        data-testid="signup-email-input"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
        delay={0.3}
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
        autoComplete="new-password"
        data-testid="signup-password-input"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Create a password (min 6 chars)"
        required
        minLength={6}
        delay={0.4}
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

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            role="alert"
            data-testid="signup-error-message"
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
        data-testid="signup-submit-button"
      >
        Create Account
      </LiquidGlassButton>

      <div className="text-center mt-6">
        <button
          type="button"
          onClick={onLoginClick}
          data-testid="signup-login-link"
          className="text-purple-600 hover:text-purple-800 text-sm font-medium transition-colors"
        >
          Already have an account? Sign in
        </button>
      </div>
    </form>
  );
}
