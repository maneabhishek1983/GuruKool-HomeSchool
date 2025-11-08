'use client';

import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function AdminPortalPage() {
  const { login, getAllUsers, createUser } = useAuthContext();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    // Check if any users exist
    const users = getAllUsers();
    if (users.length === 0) {
      // No users exist, show setup
      setShowSetup(true);
    }
  }, [getAllUsers]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await login(email, password);
      if (result.success) {
        if (result.user?.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          setError('Access denied. Admin credentials required.');
        }
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (!name || !email || !password) {
      setError('All fields are required');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const result = await createUser({
        name: name,
        email: email,
        role: 'admin',
        preferences: {
          notifications: {
            email: true,
            push: true,
            sms: false,
            inApp: true,
            frequency: 'daily',
          },
          dashboard: {
            layout: 'detailed',
            theme: 'light',
            widgets: ['analytics', 'users', 'system'],
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
      });

      if (result.success) {
        // Auto-login after setup
        const loginResult = await login(email, password);
        if (loginResult.success) {
          router.push('/admin/dashboard');
        }
      } else {
        setError(result.error || 'Failed to create admin account');
      }
    } catch (error) {
      setError('An error occurred during setup');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
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
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Admin Portal
          </h1>
          <p className="text-gray-600">
            {showSetup
              ? 'Create your first admin account to access the platform.'
              : 'Sign in to access administrative functions.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form
          onSubmit={showSetup ? handleSetup : handleLogin}
          className="space-y-6"
        >
          {showSetup && (
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter your full name"
                required
              />
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Enter admin email"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder={
                showSetup ? 'Create admin password' : 'Enter admin password'
              }
              required
            />
            {showSetup && (
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 8 characters long
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {showSetup ? 'Creating Account...' : 'Signing In...'}
              </div>
            ) : showSetup ? (
              'Create Admin Account'
            ) : (
              'Sign In to Admin Portal'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            {showSetup
              ? 'This will create the first admin account for the platform.'
              : 'This portal is for administrative access only.'}
          </p>
          <div className="mt-4">
            <a
              href="/"
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              ← Back to Main Application
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
