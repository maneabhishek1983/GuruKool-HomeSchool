'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthContext } from '@/lib/authContext';
import {
  QRAuthProvider,
  QRCodeDisplay,
} from '@/components/auth/QRAuthProvider';

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuthContext();
  const [authMethod, setAuthMethod] = useState<'qr' | 'traditional'>('qr');
  const [isLoading, setIsLoading] = useState(false);

  // Traditional login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/parent/dashboard');
      }
    }
  }, [user, router]);

  const handleTraditionalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Demo credentials validation - only parent and admin
      if (email === 'parent@example.com' && password === 'password') {
        login({
          id: 'parent-1',
          name: 'Jane Parent',
          role: 'parent',
          email: 'parent@example.com',
          preferences: {
            notifications: {
              email: true,
              push: true,
              sms: true,
              inApp: true,
              frequency: 'immediate',
            },
            dashboard: {
              layout: 'compact',
              theme: 'light',
              widgets: ['sessions', 'progress', 'notifications'],
            },
            privacy: {
              dataSharing: false,
              analytics: true,
              aiTraining: true,
            },
            accessibility: {
              fontSize: 'medium',
              highContrast: false,
              reducedMotion: false,
              screenReader: false,
            },
          },
          createdAt: new Date(),
          lastActive: new Date(),
        });
      } else if (email === 'admin@example.com' && password === 'admin123') {
        login({
          id: 'admin-1',
          name: 'Admin User',
          role: 'admin',
          email: 'admin@example.com',
          preferences: {
            notifications: {
              email: true,
              push: true,
              sms: true,
              inApp: true,
              frequency: 'immediate',
            },
            dashboard: {
              layout: 'detailed',
              theme: 'light',
              widgets: [
                'sessions',
                'analytics',
                'notifications',
                'users',
                'system',
              ],
            },
            privacy: {
              dataSharing: true,
              analytics: true,
              aiTraining: true,
            },
            accessibility: {
              fontSize: 'medium',
              highContrast: false,
              reducedMotion: false,
              screenReader: false,
            },
          },
          createdAt: new Date(),
          lastActive: new Date(),
        });
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      alert('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="max-w-md w-full space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold text-neutral-900 mb-2">
              GuruKool
            </h1>
            <div className="w-16 h-1 bg-gradient-to-r from-primary-500 to-secondary-500 mx-auto rounded-full mb-4" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-2xl font-semibold text-neutral-800 mb-2">
              Welcome Back
            </h2>
            <p className="text-neutral-600">
              Sign in to access your AI-enhanced homeschool platform
            </p>
          </motion.div>
        </div>

        {/* Auth Method Toggle */}
        <motion.div
          className="flex bg-neutral-100 rounded-2xl p-1"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <button
            type="button"
            onClick={() => setAuthMethod('qr')}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-xl transition-all duration-200 ${
              authMethod === 'qr'
                ? 'bg-white text-primary-700 shadow-soft'
                : 'text-neutral-600 hover:text-neutral-800'
            }`}
          >
            <span className="flex items-center justify-center space-x-2">
              <span>📱</span>
              <span>QR Code</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setAuthMethod('traditional')}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-xl transition-all duration-200 ${
              authMethod === 'traditional'
                ? 'bg-white text-primary-700 shadow-soft'
                : 'text-neutral-600 hover:text-neutral-800'
            }`}
          >
            <span className="flex items-center justify-center space-x-2">
              <span>🔐</span>
              <span>Password</span>
            </span>
          </button>
        </motion.div>

        {/* Authentication Content */}
        <AnimatePresence mode="wait">
          {authMethod === 'qr' ? (
            <motion.div
              key="qr-auth"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <QRAuthProvider>
                <div className="bg-white rounded-3xl shadow-soft p-8">
                  <QRCodeDisplay
                    className="w-full"
                    showStatus={true}
                    showRefreshButton={true}
                  />
                </div>
              </QRAuthProvider>
            </motion.div>
          ) : (
            <motion.div
              key="traditional-auth"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white rounded-3xl shadow-soft p-8">
                <form onSubmit={handleTraditionalLogin} className="space-y-6">
                  {/* Email Field */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-neutral-700 mb-2"
                    >
                      Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-neutral-50 focus:bg-white"
                      placeholder="Enter your email"
                    />
                  </div>

                  {/* Password Field */}
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-neutral-700 mb-2"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-12 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-neutral-50 focus:bg-white"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-primary-300 disabled:to-primary-400 text-white font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 shadow-soft"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Signing in...</span>
                      </span>
                    ) : (
                      'Sign In'
                    )}
                  </motion.button>

                  {/* Demo Credentials */}
                  <div className="bg-neutral-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-neutral-600 mb-2 font-medium">
                      Demo Credentials:
                    </p>
                    <div className="space-y-1 text-xs text-neutral-500">
                      <p>
                        <strong>Parent:</strong> parent@example.com / password
                      </p>
                      <p>
                        <strong>Admin:</strong> admin@example.com / admin123
                      </p>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.div
          className="text-center text-xs text-neutral-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p>Powered by AI • Secured by Advanced Authentication</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
