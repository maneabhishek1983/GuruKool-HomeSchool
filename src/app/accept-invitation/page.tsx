'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [invitationEmail, setInvitationEmail] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
  });

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setError('No invitation token provided');
      setIsValidating(false);
      return;
    }

    validateToken();
  }, [token]);

  // Update password strength indicators
  useEffect(() => {
    setPasswordStrength({
      hasMinLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    });
  }, [password]);

  const validateToken = async () => {
    try {
      const response = await fetch(`/api/invitations/accept?token=${token}`);
      const data = await response.json();

      if (response.ok) {
        setIsValid(true);
        setInvitationEmail(data.data.email);
        setExpiresAt(data.data.expiresAt);
      } else {
        setError(data.error || 'Invalid invitation token');
        setIsValid(false);
      }
    } catch (err) {
      setError('Failed to validate invitation');
      setIsValid(false);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (!Object.values(passwordStrength).every(v => v)) {
      setError('Password does not meet requirements');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push(
            '/login?message=Account created successfully. Please log in.'
          );
        }, 3000);
      } else {
        setError(data.error || 'Failed to accept invitation');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (!isValid || !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Invalid Invitation
          </h1>
          <p className="text-neutral-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors"
          >
            Go to Home
          </button>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Account Created!
          </h1>
          <p className="text-neutral-600 mb-6">
            Your teacher account has been created successfully. Redirecting to
            login...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎓</div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Welcome to GuruKool!
          </h1>
          <p className="text-neutral-600">
            You've been invited to join as a teacher
          </p>
        </div>

        {/* Invitation Details */}
        <div className="bg-primary-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-neutral-600 mb-1">Invitation for:</p>
          <p className="font-semibold text-neutral-900">{invitationEmail}</p>
          <p className="text-xs text-neutral-500 mt-2">
            Expires: {new Date(expiresAt).toLocaleDateString()} at{' '}
            {new Date(expiresAt).toLocaleTimeString()}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-error-50 border border-error-200 rounded-xl p-4 mb-6">
            <p className="text-error-700 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Create Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter password"
              required
            />
          </div>

          {/* Password Strength Indicators */}
          {password && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-neutral-600">
                Password requirements:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-4 h-4 rounded-full ${passwordStrength.hasMinLength ? 'bg-green-500' : 'bg-neutral-300'}`}
                  >
                    {passwordStrength.hasMinLength && (
                      <span className="text-white text-xs">✓</span>
                    )}
                  </div>
                  <span className="text-xs text-neutral-600">
                    8+ characters
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-4 h-4 rounded-full ${passwordStrength.hasUppercase ? 'bg-green-500' : 'bg-neutral-300'}`}
                  >
                    {passwordStrength.hasUppercase && (
                      <span className="text-white text-xs">✓</span>
                    )}
                  </div>
                  <span className="text-xs text-neutral-600">Uppercase</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-4 h-4 rounded-full ${passwordStrength.hasLowercase ? 'bg-green-500' : 'bg-neutral-300'}`}
                  >
                    {passwordStrength.hasLowercase && (
                      <span className="text-white text-xs">✓</span>
                    )}
                  </div>
                  <span className="text-xs text-neutral-600">Lowercase</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-4 h-4 rounded-full ${passwordStrength.hasNumber ? 'bg-green-500' : 'bg-neutral-300'}`}
                  >
                    {passwordStrength.hasNumber && (
                      <span className="text-white text-xs">✓</span>
                    )}
                  </div>
                  <span className="text-xs text-neutral-600">Number</span>
                </div>
              </div>
            </div>
          )}

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Re-enter password"
              required
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-error-600 mt-1">
                Passwords do not match
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              isSubmitting ||
              !Object.values(passwordStrength).every(v => v) ||
              password !== confirmPassword
            }
            className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Footer */}
        <p className="text-xs text-neutral-500 text-center mt-6">
          By creating an account, you agree to our Terms of Service and Privacy
          Policy.
        </p>
      </motion.div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  );
}
