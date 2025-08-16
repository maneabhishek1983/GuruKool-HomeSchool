'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/lib/authContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuthContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await login(email, password);
      if (result.success) {
        // Redirect based on role
        if (result.user?.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/parent/dashboard');
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

  const handleDemoLogin = async (role: 'parent' | 'admin') => {
    setIsLoading(true);
    setError('');

    try {
      let demoEmail = '';
      let demoPassword = '';

      if (role === 'parent') {
        demoEmail = 'parent@example.com';
        demoPassword = 'parent123';
      } else if (role === 'admin') {
        demoEmail = 'admin@example.com';
        demoPassword = 'admin123';
      }

      const result = await login(demoEmail, demoPassword);
      if (result.success) {
        if (role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/parent/dashboard');
        }
      } else {
        setError(result.error || 'Demo login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
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
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or try demo accounts
              </span>
            </div>
          </div>

          {/* Demo Credentials Info */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Demo Credentials
            </h3>
            <div className="space-y-3">
              <div className="bg-white rounded border p-3">
                <div className="flex items-center mb-2">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                    <svg
                      className="w-3 h-3 text-green-600"
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
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    Parent Account
                  </span>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>
                    <span className="font-medium">Email:</span>{' '}
                    parent@example.com
                  </p>
                  <p>
                    <span className="font-medium">Password:</span> parent123
                  </p>
                  <p className="text-green-600">
                    → Access: Student management, progress tracking, teacher
                    assignment
                  </p>
                </div>
              </div>

              <div className="bg-white rounded border p-3">
                <div className="flex items-center mb-2">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-2">
                    <svg
                      className="w-3 h-3 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    Admin Account
                  </span>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>
                    <span className="font-medium">Email:</span>{' '}
                    admin@example.com
                  </p>
                  <p>
                    <span className="font-medium">Password:</span> admin123
                  </p>
                  <p className="text-purple-600">
                    → Access: User management, system analytics, platform
                    settings
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={() => handleDemoLogin('parent')}
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Demo Parent Login
            </button>
            <button
              onClick={() => handleDemoLogin('admin')}
              disabled={isLoading}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Demo Admin Login
            </button>
          </div>
        </div>

        {/* What Happens Next Info */}
        <div className="mt-8 bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            What happens after login?
          </h3>
          <div className="text-xs text-blue-800 space-y-2">
            <div className="flex items-start">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
              <p>
                <strong>Parent:</strong> Access dashboard to manage students,
                track progress, assign teachers
              </p>
            </div>
            <div className="flex items-start">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
              <p>
                <strong>Admin:</strong> Access dashboard to manage users, view
                analytics, configure system
              </p>
            </div>
            <div className="flex items-start">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
              <p>
                <strong>New Users:</strong> Admins can create new users with
                generated passwords and QR codes
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <a
              href="/contact-admin"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Contact administrator
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
