'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/lib/authContext';

function LoginForm() {
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, signup } = useAuthContext();

  useEffect(() => {
    // Check if setup was completed
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
      console.log('Starting login submission...', { isSignupMode, email, role });

      // Safety timeout - force stop loading after 15 seconds
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Login timed out')), 15000)
      );

      if (isSignupMode) {
        // Sign up new user
        const result = await Promise.race([
          signup(email, password, name, role),
          timeoutPromise
        ]) as any;

        if (result.success) {
          setSuccessMessage('Account created successfully! Redirecting...');
          setTimeout(() => {
            // Redirect based on role
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
        // Login existing user
        console.log('Calling login function...');
        const result = await Promise.race([
          login(email, password),
          timeoutPromise
        ]) as any;

        console.log('Login result:', result);

        if (result.success) {
          console.log('Login success, redirecting to role:', result.user?.role);
          // Redirect based on role
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
          console.error('Login failed with error:', result.error);
          setError(result.error || 'Login failed');
        }
      }
    } catch (err: any) {
      console.error('Login form exception:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      console.log('Login process finished, resetting loading state');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-netflix-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-netflix-dark-gray rounded-lg shadow-2xl p-8 border border-netflix-medium-gray">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isSignupMode ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-netflix-text-gray">
            {isSignupMode
              ? 'Sign up for a new account'
              : 'Sign in to your account'}
          </p>
        </div>

        {successMessage && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
            <p className="text-green-500 text-sm">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {isSignupMode && (
            <>
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-netflix-light-gray rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-netflix-red focus:border-transparent"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Account Type
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={e => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-netflix-light-gray rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-netflix-red focus:border-transparent"
                  required
                >
                  <option value="parent">Parent</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-white mb-2"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-netflix-light-gray rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-netflix-red focus:border-transparent"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-white mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-netflix-light-gray rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-netflix-red focus:border-transparent"
              placeholder={
                isSignupMode
                  ? 'Create a password (min 6 characters)'
                  : 'Enter your password'
              }
              required
              minLength={isSignupMode ? 6 : undefined}
            />
          </div>

          {error && (
            <div className="bg-netflix-red/10 border border-netflix-red/30 text-netflix-red px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-netflix-red text-white py-3 px-4 rounded-lg hover:bg-netflix-red-dark focus:outline-none focus:ring-2 focus:ring-netflix-red focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {isLoading
              ? isSignupMode
                ? 'Creating Account...'
                : 'Signing in...'
              : isSignupMode
                ? 'Create Account'
                : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignupMode(!isSignupMode);
              setError('');
              setSuccessMessage('');
            }}
            className="text-netflix-red hover:text-netflix-red-dark text-sm font-medium"
          >
            {isSignupMode
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </button>
        </div>

        {/* What Happens Next Info */}
        {!isSignupMode && (
          <div className="mt-8 bg-netflix-medium-gray rounded-lg p-4 border border-netflix-light-gray">
            <h3 className="text-sm font-medium text-white mb-2">
              What happens after login?
            </h3>
            <div className="text-xs text-netflix-text-gray space-y-2">
              <div className="flex items-start">
                <div className="w-1.5 h-1.5 bg-netflix-red rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                <p>
                  <strong>Parent:</strong> Access dashboard to manage students,
                  track progress, assign teachers, create student profiles with
                  country-specific academic standards
                </p>
              </div>
              <div className="flex items-start">
                <div className="w-1.5 h-1.5 bg-netflix-red rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                <p>
                  <strong>Teacher:</strong> Access dashboard to manage assigned
                  students, create lesson plans, track progress, and provide
                  feedback
                </p>
              </div>
              <div className="flex items-start">
                <div className="w-1.5 h-1.5 bg-netflix-red rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                <p>
                  <strong>Student:</strong> View assignments, track your
                  progress, and access learning materials
                </p>
              </div>
            </div>
          </div>
        )}
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
