'use client';

import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  NetflixBackground,
  NetflixButton,
  NetflixCard,
} from '@/components/NetflixBackground';
import { supabase } from '@/lib/supabase';

interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: Date;
  status: 'pending' | 'in-progress' | 'completed';
  description: string;
}

interface Session {
  id: string;
  teacherName: string;
  subject: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
}

interface StudentProfile {
  name: string;
  grade: string;
  country: string;
  selectedSubjects: string[];
}

export default function StudentDashboard() {
  const { user, logout } = useAuthContext();
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'assignments' | 'sessions' | 'progress'
  >('overview');

  useEffect(() => {
    if (user && user.role === 'student') {
      loadStudentData();
    } else if (user && user.role !== 'student') {
      // Redirect to appropriate dashboard
      router.push(`/${user.role}/dashboard`);
    }
  }, [user, router]);

  const loadStudentData = async () => {
    if (!user) {
      return;
    }

    setIsLoading(true);
    try {
      // Load student profile
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', user.id)
        .single();

      if (studentError) {
        console.error('Error loading student profile:', studentError);
      } else if (studentData) {
        setProfile({
          name: studentData.name,
          grade: studentData.grade,
          country: studentData.country,
          selectedSubjects: studentData.selected_subjects || [],
        });
      }

      // Load upcoming sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select(
          `
          id,
          subject,
          scheduled_start,
          scheduled_end,
          status,
          teachers!inner(name)
        `
        )
        .eq('student_id', user.id)
        .gte('scheduled_start', new Date().toISOString())
        .order('scheduled_start', { ascending: true })
        .limit(5);

      if (sessionsError) {
        console.error('Error loading sessions:', sessionsError);
      } else if (sessionsData) {
        setUpcomingSessions(
          sessionsData.map((session: any) => ({
            id: session.id,
            teacherName: session.teachers?.name || 'Unknown Teacher',
            subject: session.subject,
            scheduledStart: new Date(session.scheduled_start),
            scheduledEnd: new Date(session.scheduled_end),
            status: session.status,
          }))
        );
      }

      // Mock assignments for now (can be loaded from database later)
      setAssignments([
        {
          id: '1',
          title: 'Math Worksheet - Fractions',
          subject: 'Mathematics',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          status: 'pending',
          description: 'Complete exercises 1-15 on fractions',
        },
        {
          id: '2',
          title: 'Science Project - Solar System',
          subject: 'Science',
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          status: 'in-progress',
          description: 'Create a model of the solar system',
        },
      ]);
    } catch (error) {
      console.error('Error loading student data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600">
            Please log in to access the student dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <NetflixBackground variant="dashboard">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold mb-4">Student Dashboard</h1>
          <p className="text-xl max-w-2xl mx-auto">
            Welcome back, {profile?.name || user.name}
          </p>
        </motion.div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'assignments', label: 'Assignments' },
                  { id: 'sessions', label: 'Sessions' },
                  { id: 'progress', label: 'Progress' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <button
                onClick={async () => {
                  await logout();
                  router.push('/login');
                }}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <NetflixCard className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Assignments
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {assignments.length}
                    </p>
                  </div>
                </div>
              </NetflixCard>

              <NetflixCard className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Upcoming Sessions
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {upcomingSessions.length}
                    </p>
                  </div>
                </div>
              </NetflixCard>

              <NetflixCard className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-purple-600"
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
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Overall Progress
                    </p>
                    <p className="text-2xl font-bold text-gray-900">85%</p>
                  </div>
                </div>
              </NetflixCard>

              <NetflixCard className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-orange-600"
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
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Subjects
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {profile?.selectedSubjects.length || 0}
                    </p>
                  </div>
                </div>
              </NetflixCard>
            </div>

            {/* Recent Assignments & Upcoming Sessions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Assignments */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-lg shadow-sm border"
              >
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Recent Assignments
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {assignments.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        No assignments yet
                      </p>
                    ) : (
                      assignments.map(assignment => (
                        <div
                          key={assignment.id}
                          className="p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {assignment.title}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {assignment.subject}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Due: {assignment.dueDate.toLocaleDateString()}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                assignment.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : assignment.status === 'in-progress'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {assignment.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Upcoming Sessions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-lg shadow-sm border"
              >
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Upcoming Sessions
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {upcomingSessions.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        No upcoming sessions
                      </p>
                    ) : (
                      upcomingSessions.map(session => (
                        <div
                          key={session.id}
                          className="p-4 bg-gray-50 rounded-lg"
                        >
                          <h3 className="font-medium text-gray-900">
                            {session.subject}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            with {session.teacherName}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {session.scheduledStart.toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}

        {/* Other Tabs (Placeholder) */}
        {activeTab !== 'overview' && (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {activeTab === 'assignments' && 'Assignments'}
              {activeTab === 'sessions' && 'Sessions'}
              {activeTab === 'progress' && 'Progress Tracking'}
            </h2>
            <p className="text-gray-600">This section is coming soon!</p>
          </div>
        )}
      </div>
    </NetflixBackground>
  );
}
