'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/lib/authContext';
import { motion, AnimatePresence } from 'framer-motion';
import WarmGradientBackground from '@/components/ui/WarmGradientBackground';
import { triggerConfetti } from '@/lib/confetti';

// Floating orbs component for extra depth
function FloatingOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 100 + i * 50,
            height: 100 + i * 50,
            background: `radial-gradient(circle, ${
              ['rgba(251,113,133,0.15)', 'rgba(244,114,182,0.15)', 'rgba(192,132,252,0.15)', 'rgba(129,140,248,0.15)', 'rgba(96,165,250,0.12)', 'rgba(34,211,238,0.1)'][i]
            } 0%, transparent 70%)`,
            left: `${10 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 6 + i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.3,
          }}
        />
      ))}
    </div>
  );
}

// Liquid glass card component
function LiquidGlassCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* Outer glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-pink-300/30 via-purple-300/30 to-indigo-300/30 rounded-3xl blur-xl opacity-70" />

      {/* Glass card */}
      <div className="relative bg-white/60 backdrop-blur-2xl rounded-3xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.08)] overflow-hidden">
        {/* Inner highlight */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-transparent to-transparent opacity-60 pointer-events-none" />

        {/* Subtle rainbow border reflection */}
        <div className="absolute inset-0 rounded-3xl opacity-30 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(251,113,133,0.3) 0%, rgba(192,132,252,0.3) 50%, rgba(96,165,250,0.3) 100%)',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            padding: '1px',
          }}
        />

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </div>
    </motion.div>
  );
}

// Liquid button component
function LiquidGlassButton({
  children,
  type = 'button',
  disabled = false,
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  type?: 'button' | 'submit';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl font-semibold text-white
        bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500
        shadow-lg shadow-purple-500/25
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-300
        ${className}
      `}
      whileHover={disabled ? {} : { scale: 1.02, boxShadow: '0 20px 40px rgba(168,85,247,0.35)' }}
      whileTap={disabled ? {} : { scale: 0.98 }}
    >
      {/* Animated gradient overlay */}
      <motion.div
        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
        }}
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <span className="relative z-10 px-8 py-4 block">{children}</span>
    </motion.button>
  );
}

// Floating input component
function FloatingInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  minLength,
  delay = 0,
  icon,
  showToggle = false,
  onToggle,
  toggleState = false,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number | undefined;
  delay?: number;
  icon?: React.ReactNode;
  showToggle?: boolean;
  onToggle?: () => void;
  toggleState?: boolean;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const isActive = isFocused || value.length > 0;

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <div className="relative">
        {/* Input container */}
        <div
          className={`
            relative flex items-center bg-white/50 backdrop-blur-sm
            border-2 rounded-xl transition-all duration-300
            ${isFocused ? 'border-purple-400 shadow-lg shadow-purple-500/10' : 'border-gray-200/60 hover:border-gray-300/80'}
          `}
        >
          {/* Icon */}
          {icon && (
            <span className="pl-4 text-gray-400">{icon}</span>
          )}

          {/* Input */}
          <input
            type={showToggle ? (toggleState ? 'text' : 'password') : type}
            value={value}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            required={required}
            minLength={minLength}
            className={`
              w-full px-4 py-4 bg-transparent text-gray-800
              placeholder-gray-400 focus:outline-none
              ${icon ? 'pl-2' : ''}
              ${showToggle ? 'pr-12' : ''}
            `}
          />

          {/* Toggle button for password */}
          {showToggle && (
            <button
              type="button"
              onClick={onToggle}
              className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {toggleState ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Floating label */}
        <motion.label
          className={`
            absolute left-4 px-1 pointer-events-none
            transition-all duration-300 bg-gradient-to-b from-white/80 to-white/60
            ${isActive
              ? '-top-2.5 text-xs text-purple-600 font-medium'
              : 'top-4 text-gray-400'
            }
            ${icon && !isActive ? 'left-12' : 'left-4'}
          `}
        >
          {label}
        </motion.label>
      </div>
    </motion.div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'parent' | 'teacher' | 'admin' | 'student'>('parent');
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, signup } = useAuthContext();

  useEffect(() => {
    const message = searchParams.get('message');
    if (message === 'setup-complete') {
      setSuccessMessage('Admin account created successfully! You can now login.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (isSignupMode) {
        const result = await signup(email, password, name, role);
        if (result.success) {
          setSuccessMessage('Account created successfully! Redirecting...');
          triggerConfetti('fireworks');
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
      } else {
        const result = await login(email, password);
        if (result.success) {
          triggerConfetti('success');
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
          setError(result.error || 'Login failed');
        }
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    { id: 'parent', label: 'Parent', icon: '👨‍👩‍👧', desc: 'Manage your family' },
    { id: 'teacher', label: 'Teacher', icon: '👩‍🏫', desc: 'Inspire students' },
    { id: 'student', label: 'Student', icon: '🎓', desc: 'Learn & grow' },
    { id: 'admin', label: 'Admin', icon: '⚙️', desc: 'Platform settings' },
  ] as const;

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Warm background */}
      <WarmGradientBackground variant="dawn" />
      <FloatingOrbs />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        <LiquidGlassCard>
          <div className="p-8 md:p-10">
            {/* Logo & Header */}
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Animated logo */}
              <motion.div
                className="w-20 h-20 mx-auto mb-6 relative"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-rose-400 via-purple-500 to-indigo-500 rounded-2xl shadow-lg shadow-purple-500/30" />
                <div className="absolute inset-0 flex items-center justify-center text-white text-3xl font-bold">
                  G
                </div>
                {/* Floating particles around logo */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-purple-400/60 rounded-full"
                    style={{
                      top: -8 + i * 10,
                      right: -4 + i * 5,
                    }}
                    animate={{
                      y: [0, -8, 0],
                      opacity: [0.6, 1, 0.6],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.3,
                    }}
                  />
                ))}
              </motion.div>

              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 via-purple-700 to-indigo-700 bg-clip-text text-transparent">
                {isSignupMode ? 'Join GuruKool' : 'Welcome Back'}
              </h1>
              <p className="text-gray-500 mt-2">
                {isSignupMode
                  ? 'Start your homeschool journey today'
                  : 'Sign in to continue your journey'}
              </p>
            </motion.div>

            {/* Success Message */}
            <AnimatePresence>
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="mb-6 p-4 bg-emerald-50/80 backdrop-blur-sm border border-emerald-200 rounded-xl"
                >
                  <p className="text-emerald-700 text-sm text-center flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {successMessage}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role Selection (Signup only) */}
              <AnimatePresence>
                {isSignupMode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
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
                          onClick={() => setRole(r.id)}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className={`
                            relative p-4 rounded-xl border-2 transition-all duration-300
                            ${role === r.id
                              ? 'border-purple-400 bg-purple-50/80 shadow-lg shadow-purple-500/10'
                              : 'border-gray-200/60 bg-white/30 hover:border-purple-300 hover:bg-purple-50/50'
                            }
                          `}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="text-2xl mb-1">{r.icon}</div>
                          <div className={`text-sm font-medium ${role === r.id ? 'text-purple-700' : 'text-gray-700'}`}>
                            {r.label}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">{r.desc}</div>

                          {/* Selected indicator */}
                          {role === r.id && (
                            <motion.div
                              layoutId="roleIndicator"
                              className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center"
                            >
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </motion.div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Name Field (Signup only) */}
              <AnimatePresence>
                {isSignupMode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FloatingInput
                      label="Full Name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                      delay={0.4}
                      icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      }
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Field */}
              <FloatingInput
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                delay={isSignupMode ? 0.5 : 0.3}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />

              {/* Password Field */}
              <FloatingInput
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignupMode ? 'Create a password (min 6 chars)' : 'Enter your password'}
                required
                minLength={isSignupMode ? 6 : undefined}
                delay={isSignupMode ? 0.6 : 0.4}
                showToggle
                onToggle={() => setShowPassword(!showPassword)}
                toggleState={showPassword}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
              />

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl"
                  >
                    <p className="text-red-600 text-sm text-center flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {error}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: isSignupMode ? 0.7 : 0.5 }}
              >
                <LiquidGlassButton
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.div
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      {isSignupMode ? 'Creating Account...' : 'Signing in...'}
                    </span>
                  ) : (
                    isSignupMode ? 'Create Account' : 'Sign In'
                  )}
                </LiquidGlassButton>
              </motion.div>
            </form>

            {/* Toggle Mode */}
            <motion.div
              className="mt-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <button
                onClick={() => {
                  setIsSignupMode(!isSignupMode);
                  setError('');
                  setSuccessMessage('');
                }}
                className="text-purple-600 hover:text-purple-800 text-sm font-medium transition-colors"
              >
                {isSignupMode
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"}
              </button>
            </motion.div>

            {/* Role benefits info (Login only) */}
            {!isSignupMode && (
              <motion.div
                className="mt-8 p-5 bg-gradient-to-br from-purple-50/80 to-indigo-50/80 backdrop-blur-sm rounded-xl border border-purple-100/50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </span>
                  Your personalized dashboard awaits
                </h3>
                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-rose-400 rounded-full"></span>
                    <span><strong className="text-rose-600">Parents</strong> manage students & track progress</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                    <span><strong className="text-emerald-600">Teachers</strong> create lessons & provide feedback</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                    <span><strong className="text-amber-600">Students</strong> access materials & track growth</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </LiquidGlassCard>

        {/* Footer */}
        <motion.div
          className="text-center mt-6 text-gray-500 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p>
            © 2026 GuruKool HomeSchool •{' '}
            <a href="#" className="hover:text-purple-600 transition-colors">Privacy</a>
            {' • '}
            <a href="#" className="hover:text-purple-600 transition-colors">Terms</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-50 flex items-center justify-center">
          <motion.div
            className="relative w-16 h-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="absolute inset-0 border-4 border-purple-200 border-t-purple-500 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-purple-500 font-bold">
              G
            </div>
          </motion.div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
