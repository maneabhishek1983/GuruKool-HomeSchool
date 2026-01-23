'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/lib/authContext';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedGradientBackground from '@/components/ui/AnimatedGradientBackground';
import FloatingParticles from '@/components/ui/FloatingParticles';
import RoleIcon from '@/components/ui/RoleIcon';
import GlassCard from '@/components/ui/GlassCard';
import LiquidButton from '@/components/ui/LiquidButton';
import { triggerConfetti } from '@/lib/confetti';

function EnhancedLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'parent' | 'teacher' | 'admin' | 'student'>(
    'parent'
  );
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
      setSuccessMessage(
        'Admin account created successfully! You can now login.'
      );
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
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const roleThemes = {
    parent: {
      gradient: 'from-indigo-500/20 via-purple-500/20 to-pink-500/20',
      text: 'text-indigo-400',
      button: 'bg-gradient-to-r from-indigo-500 to-purple-500',
      icon: '👨‍👩‍👧‍👦',
      title: 'Parent Portal',
      subtitle: 'Manage your homeschool journey',
    },
    teacher: {
      gradient: 'from-emerald-500/20 via-teal-500/20 to-cyan-500/20',
      text: 'text-emerald-400',
      button: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      icon: '👨‍🏫',
      title: 'Teacher Portal',
      subtitle: 'Inspire and educate',
    },
    student: {
      gradient: 'from-amber-500/20 via-orange-500/20 to-red-500/20',
      text: 'text-amber-400',
      button: 'bg-gradient-to-r from-amber-500 to-orange-500',
      icon: '🎓',
      title: 'Student Portal',
      subtitle: 'Learn and grow',
    },
    admin: {
      gradient: 'from-blue-500/20 via-indigo-500/20 to-purple-500/20',
      text: 'text-blue-400',
      button: 'bg-gradient-to-r from-blue-500 to-indigo-500',
      icon: '🛡️',
      title: 'Admin Portal',
      subtitle: 'Manage the platform',
    },
  };

  const currentTheme = roleThemes[role];

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Background */}
      <AnimatedGradientBackground theme={role} />
      <FloatingParticles theme={role} />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <GlassCard blur="xl" className="p-8">
          {/* Role Icon */}
          <motion.div
            className="flex justify-center mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          >
            <div className={`${currentTheme.text}`}>
              <RoleIcon role={role} size={80} />
            </div>
          </motion.div>

          {/* Header */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-4xl font-bold text-white mb-2">
              {isSignupMode ? 'Create Account' : currentTheme.title}
            </h1>
            <p className="text-gray-400">
              {isSignupMode ? 'Join GuruKool today' : currentTheme.subtitle}
            </p>
          </motion.div>

          {/* Success Message */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6 backdrop-blur-sm"
              >
                <p className="text-green-400 text-sm text-center">
                  {successMessage}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selector (Signup only) */}
            {isSignupMode && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  I am a...
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['parent', 'teacher', 'student', 'admin'] as const).map(
                    (r, index) => (
                      <motion.button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          role === r
                            ? `${roleThemes[r].button} border-transparent text-white shadow-lg`
                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                      >
                        <div className="text-2xl mb-1">
                          {roleThemes[r].icon}
                        </div>
                        <div className="text-sm font-medium capitalize">{r}</div>
                      </motion.button>
                    )
                  )}
                </div>
              </motion.div>
            )}

            {/* Name (Signup only) */}
            {isSignupMode && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent backdrop-blur-sm transition-all"
                  placeholder="Enter your full name"
                  required
                />
              </motion.div>
            )}

            {/* Email */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: isSignupMode ? 0.7 : 0.4 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent backdrop-blur-sm transition-all"
                placeholder="Enter your email"
                required
              />
            </motion.div>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: isSignupMode ? 0.8 : 0.5 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent backdrop-blur-sm transition-all pr-12"
                  placeholder={
                    isSignupMode
                      ? 'Create a password (min 6 characters)'
                      : 'Enter your password'
                  }
                  required
                  minLength={isSignupMode ? 6 : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </motion.div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 backdrop-blur-sm"
                >
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: isSignupMode ? 0.9 : 0.6 }}
            >
              <LiquidButton
                type="submit"
                disabled={isLoading}
                variant="primary"
                className="w-full"
              >
                {isLoading
                  ? isSignupMode
                    ? 'Creating Account...'
                    : 'Signing in...'
                  : isSignupMode
                    ? 'Create Account'
                    : 'Sign In'}
              </LiquidButton>
            </motion.div>
          </form>

          {/* Toggle Mode */}
          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <button
              onClick={() => {
                setIsSignupMode(!isSignupMode);
                setError('');
                setSuccessMessage('');
              }}
              className={`${currentTheme.text} hover:text-white text-sm font-medium transition-colors`}
            >
              {isSignupMode
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </motion.div>

          {/* Role Info */}
          {!isSignupMode && (
            <motion.div
              className="mt-8 bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
                <span className="mr-2">ℹ️</span>
                What happens after login?
              </h3>
              <div className="space-y-2 text-xs text-gray-400">
                <div className="flex items-start">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                  <p>
                    <strong className="text-indigo-400">Parent:</strong> Manage
                    students, track progress, assign teachers
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                  <p>
                    <strong className="text-emerald-400">Teacher:</strong>{' '}
                    Create lesson plans, track progress, provide feedback
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                  <p>
                    <strong className="text-amber-400">Student:</strong> View
                    assignments, track progress, access materials
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </GlassCard>

        {/* Footer */}
        <motion.div
          className="text-center mt-6 text-gray-400 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p>
            © 2026 GuruKool HomeSchool •{' '}
            <a href="#" className="hover:text-white transition-colors">
              Privacy
            </a>{' '}
            •{' '}
            <a href="#" className="hover:text-white transition-colors">
              Terms
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function EnhancedLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full"
          />
        </div>
      }
    >
      <EnhancedLoginForm />
    </Suspense>
  );
}
