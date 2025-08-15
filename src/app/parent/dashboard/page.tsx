'use client';

import { useAuthContext } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ParentDashboard() {
  const { user, logout } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else if (user.role !== 'parent') {
      // Redirect non-parent users to appropriate dashboard
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleButtonClick = (action: string) => {
    switch (action) {
      case 'manage-students':
        alert(
          "Student Management: This would open a comprehensive student profile management interface where you can add, edit, and manage your children's learning profiles."
        );
        break;
      case 'view-progress':
        alert(
          'Progress Tracking: This would display detailed progress reports, learning analytics, and achievement tracking for your children.'
        );
        break;
      case 'manage-teachers':
        alert(
          'Teacher Assignment: This would allow you to assign teachers to your children, manage communication preferences, and view teacher profiles.'
        );
        break;
      case 'view-insights':
        alert(
          'AI Insights: This would show personalized AI-powered recommendations, learning suggestions, and educational insights for your children.'
        );
        break;
      case 'open-messages':
        alert(
          'Communication Hub: This would open a messaging interface to communicate with teachers, receive updates, and manage notifications.'
        );
        break;
      case 'open-settings':
        alert(
          'Settings: This would open your account settings, notification preferences, and dashboard customization options.'
        );
        break;
      default:
        alert('Feature coming soon!');
    }
  };

  if (!user || user.role !== 'parent') {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Parent Dashboard
              </h1>
              <p className="text-sm text-gray-600">Welcome back, {user.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Student Management Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Student Profiles
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Create and manage your children's learning profiles
            </p>
            <button
              onClick={() => handleButtonClick('manage-students')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Manage Students
            </button>
          </div>

          {/* Progress Tracking Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Progress Tracking
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Monitor your children's learning progress and achievements
            </p>
            <button
              onClick={() => handleButtonClick('view-progress')}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              View Progress
            </button>
          </div>

          {/* Teacher Management Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Teacher Assignment
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Assign teachers to your children and manage communication
            </p>
            <button
              onClick={() => handleButtonClick('manage-teachers')}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Manage Teachers
            </button>
          </div>

          {/* AI Insights Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                AI Insights
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Get personalized AI-powered recommendations for your children
            </p>
            <button
              onClick={() => handleButtonClick('view-insights')}
              className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors"
            >
              View Insights
            </button>
          </div>

          {/* Communication Hub Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Communication
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Stay connected with teachers and receive updates
            </p>
            <button
              onClick={() => handleButtonClick('open-messages')}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Open Messages
            </button>
          </div>

          {/* Settings Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Customize your dashboard and notification preferences
            </p>
            <button
              onClick={() => handleButtonClick('open-settings')}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Open Settings
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
