'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/lib/authContext';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, getAllUsers } = useAuthContext();

  useEffect(() => {
    // Check if setup was completed
    const message = searchParams.get('message');
    if (message === 'setup-complete') {
      setSuccessMessage(
        'Admin account created successfully! You can now login.'
      );
    }

    // Check if any users exist, if not redirect to admin portal
    const users = getAllUsers();
    if (users.length === 0) {
      router.push('/admin-portal');
    }
  }, [searchParams, getAllUsers, router]);

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
        } else if (result.user?.role === 'teacher') {
          router.push('/teacher/dashboard');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-700 text-sm">{successMessage}</p>
          </div>
        )}

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

        {/* Demo Credentials Info */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Platform Access Information
          </h3>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="font-medium text-gray-900">
                  Parent Account
                </span>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">Email:</span> parent@example.com
                </p>
                <p>
                  <span className="font-medium">Password:</span> parent123
                </p>
                <p className="text-green-600">
                  → Access: Student management, progress tracking, teacher
                  communication
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center mb-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="font-medium text-gray-900">
                  Teacher Account
                </span>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">Email:</span>{' '}
                  teacher@example.com
                </p>
                <p>
                  <span className="font-medium">Password:</span> teacher123
                </p>
                <p className="text-blue-600">
                  → Access: Student sessions, lesson plans, progress reports
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center mb-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                <span className="font-medium text-gray-900">Admin Account</span>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">Email:</span> admin@example.com
                </p>
                <p>
                  <span className="font-medium">Password:</span> admin123
                </p>
                <p className="text-purple-600">
                  → Access: User management, system analytics, platform settings
                </p>
              </div>
            </div>
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
                track progress, assign teachers, create student profiles with
                country-specific academic standards
              </p>
            </div>
            <div className="flex items-start">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
              <p>
                <strong>Teacher:</strong> Access dashboard to manage assigned
                students, create lesson plans, track progress, and provide
                feedback
              </p>
            </div>
            <div className="flex items-start">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
              <p>
                <strong>Admin:</strong> Access dashboard to manage users, view
                analytics, configure system, and manage academic standards
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
            Don&apos;t have an account?{' '}
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
