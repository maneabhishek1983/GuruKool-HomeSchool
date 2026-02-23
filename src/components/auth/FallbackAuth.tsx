'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthContext } from '@/lib/authContext';

interface FallbackAuthProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function FallbackAuth({ onSuccess, onCancel, className = '' }: FallbackAuthProps) {
  const { login } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone' | 'backup'>('email');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCode, setBackupCode] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Simulate authentication delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Authenticate via Supabase
      const result = await login(email, password);
      if (result.success && result.user) {
        onSuccess?.();
      } else {
        throw new Error(result.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Phone verification should use Supabase OTP verification
      // For now, reject - this flow requires proper phone auth setup
      throw new Error('Phone verification is not yet configured. Please use email login.');
    } catch (err) {
      setError('Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackupAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Backup code verification should validate against stored backup codes
      // For now, reject - this flow requires proper backup code setup
      throw new Error('Backup code verification is not yet configured. Please use email login.');
    } catch (err) {
      setError('Invalid backup code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-3xl shadow-soft p-6 ${className}`}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-neutral-800 mb-2">
          Alternative Authentication
        </h2>
        <p className="text-sm text-neutral-600">
          Choose an alternative method to sign in securely
        </p>
      </div>

      {/* Method Selection */}
      <div className="flex bg-neutral-100 rounded-2xl p-1 mb-6">
        {[
          { id: 'email', label: 'Email', icon: '📧' },
          { id: 'phone', label: 'SMS', icon: '📱' },
          { id: 'backup', label: 'Backup', icon: '🔑' },
        ].map((method) => (
          <button
            key={method.id}
            onClick={() => setAuthMethod(method.id as any)}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-xl transition-all duration-200 ${
              authMethod === method.id
                ? 'bg-white text-primary-700 shadow-soft'
                : 'text-neutral-600 hover:text-neutral-800'
            }`}
          >
            <span className="flex items-center justify-center space-x-1">
              <span>{method.icon}</span>
              <span>{method.label}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-error-50 border border-error-200 rounded-xl p-3 mb-4"
          >
            <p className="text-error-700 text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Authentication Forms */}
      <AnimatePresence mode="wait">
        {authMethod === 'email' && (
          <motion.form
            key="email-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleEmailAuth}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-medium rounded-xl transition-colors duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? 'Signing in...' : 'Sign In with Email'}
            </motion.button>
            <p className="text-xs text-neutral-500 text-center">
              Demo: teacher@example.com / password
            </p>
          </motion.form>
        )}

        {authMethod === 'phone' && (
          <motion.form
            key="phone-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handlePhoneAuth}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter 6-digit code"
                maxLength={6}
                required
              />
            </div>
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-medium rounded-xl transition-colors duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </motion.button>
            <p className="text-xs text-neutral-500 text-center">
              Demo code: 123456
            </p>
          </motion.form>
        )}

        {authMethod === 'backup' && (
          <motion.form
            key="backup-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleBackupAuth}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Backup Code
              </label>
              <input
                type="text"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                placeholder="Enter backup code"
                required
              />
            </div>
            <div className="bg-warning-50 border border-warning-200 rounded-xl p-3">
              <p className="text-warning-700 text-sm">
                ⚠️ Backup codes can only be used once. Make sure to generate new ones after use.
              </p>
            </div>
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-medium rounded-xl transition-colors duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? 'Verifying...' : 'Use Backup Code'}
            </motion.button>
            <p className="text-xs text-neutral-500 text-center">
              Demo code: BACKUP123
            </p>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Cancel Button */}
      {onCancel && (
        <motion.button
          onClick={onCancel}
          className="w-full mt-4 py-2 text-neutral-600 hover:text-neutral-800 text-sm font-medium transition-colors duration-200"
          whileHover={{ scale: 1.02 }}
        >
          Back to QR Code
        </motion.button>
      )}
    </motion.div>
  );
}