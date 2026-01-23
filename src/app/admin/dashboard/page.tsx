'use client';

import React, { useState, useEffect } from 'react';
import { useAuthContext, User as AuthUser } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LiquidLearningLayout,
  GlassHeader,
  GlassStatCard,
  LiquidButton,
  SectionTitle,
} from '@/components/layouts/LiquidLearningLayout';
import { FloatingActionButton } from '@/design-system/components/interactive/FloatingActionButton';
import AdminDashboardHero from '@/components/admin/AdminDashboardHero';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface LocalUser {
  id: string;
  name: string;
  email: string;
  role: 'parent' | 'admin' | 'teacher' | 'student';
  status: 'active' | 'inactive';
  createdAt: Date;
  password?: string;
  qrCode?: string;
}

type TabId = 'overview' | 'users' | 'analytics' | 'settings';

export default function AdminDashboard() {
  const { user, logout, createUser, getAllUsers } = useAuthContext();
  const router = useRouter();
  const [users, setUsers] = useState<LocalUser[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [isLoading, setIsLoading] = useState(true);

  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);

  const [newUser, setNewUser] = useState<{
    name: string;
    email: string;
    role: 'parent' | 'admin' | 'teacher';
  }>({
    name: '',
    email: '',
    role: 'parent',
  });
  const [createdUser, setCreatedUser] = useState<LocalUser | null>(null);
  const [createdUserPassword, setCreatedUserPassword] = useState<string | null>(
    null
  );

  const tabs = [
    { id: 'overview' as TabId, label: 'Overview', icon: '📊' },
    { id: 'users' as TabId, label: 'User Management', icon: '👥' },
    { id: 'analytics' as TabId, label: 'Analytics', icon: '📈' },
    { id: 'settings' as TabId, label: 'Settings', icon: '⚙️' },
  ];

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else if (user.role !== 'admin') {
      if (user.role === 'parent') {
        router.push('/parent/dashboard');
      } else {
        router.push('/login');
      }
    } else {
      loadUsers();
    }
  }, [user, router]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      if (getAllUsers) {
        const allUsers = await getAllUsers();
        const localUsers: LocalUser[] = allUsers.map((u: AuthUser) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          status: 'active' as const,
          createdAt: new Date(),
        }));
        setUsers(localUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createUser) {
      return;
    }

    try {
      // Create user data object with default preferences
      const userData = {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        preferences: {
          notifications: {
            email: true,
            push: true,
            sms: false,
            inApp: true,
            frequency: 'immediate' as const,
          },
          dashboard: {
            layout: 'detailed' as const,
            theme: 'light' as const,
            widgets: [],
          },
          privacy: {
            dataSharing: false,
            analytics: true,
            aiTraining: false,
          },
          accessibility: {
            fontSize: 'medium' as const,
            highContrast: false,
            reducedMotion: false,
            screenReader: false,
          },
        },
      };

      const result = await createUser(userData);

      if (result.success && result.user) {
        // Generate a simple token for QR code
        const qrCode = `qr_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        const tempPassword = `temp_${Math.random().toString(36).substring(2, 10)}`;
        const localUser: LocalUser = {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          status: 'active',
          createdAt: new Date(),
          qrCode,
        };
        setCreatedUser(localUser);
        setCreatedUserPassword(tempPassword);
        setShowCreateUserModal(false);
        setShowCredentialsModal(true);
        setNewUser({ name: '', email: '', role: 'parent' });
        loadUsers();
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const stats = {
    totalUsers: users.length,
    activeParents: users.filter(u => u.role === 'parent').length,
    activeTeachers: users.filter(u => u.role === 'teacher').length,
    totalStudents: users.filter(u => u.role === 'student').length,
  };

  const recentActivity = [
    {
      id: '1',
      type: 'user_signup' as const,
      description: 'New parent registration',
      timestamp: '5 min ago',
      user: 'Sarah Johnson',
    },
    {
      id: '2',
      type: 'session_completed' as const,
      description: 'Math tutoring session completed',
      timestamp: '12 min ago',
      user: 'Alex Teacher',
    },
    {
      id: '3',
      type: 'payment_received' as const,
      description: 'Monthly subscription payment',
      timestamp: '1 hour ago',
      user: 'Mike Parent',
    },
    {
      id: '4',
      type: 'report_generated' as const,
      description: 'Weekly analytics report generated',
      timestamp: '2 hours ago',
      user: 'System',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_signup':
        return '👤';
      case 'session_completed':
        return '✅';
      case 'payment_received':
        return '💳';
      case 'report_generated':
        return '📄';
      default:
        return '📌';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'user_signup':
        return 'from-green-500 to-emerald-600';
      case 'session_completed':
        return 'from-blue-500 to-cyan-600';
      case 'payment_received':
        return 'from-violet-500 to-purple-600';
      case 'report_generated':
        return 'from-amber-500 to-orange-600';
      default:
        return 'from-slate-500 to-gray-600';
    }
  };

  // FAB actions
  const fabActions = [
    {
      id: 'add-user',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
          />
        </svg>
      ),
      label: 'Add User',
      onClick: () => setShowCreateUserModal(true),
      color: 'primary' as const,
    },
    {
      id: 'view-analytics',
      icon: (
        <svg
          className="w-5 h-5"
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
      ),
      label: 'View Analytics',
      onClick: () => setActiveTab('analytics'),
      color: 'secondary' as const,
    },
  ];

  if (!user || user.role !== 'admin') {
    return (
      <LiquidLearningLayout variant="default" gradientTheme="aurora">
        <div className="min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-slate-200/50"
          >
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
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Access Denied
            </h1>
            <p className="text-slate-600 mb-6">
              Admin credentials required to access this dashboard.
            </p>
            <LiquidButton
              variant="primary"
              onClick={() => router.push('/login')}
            >
              Go to Login
            </LiquidButton>
          </motion.div>
        </div>
      </LiquidLearningLayout>
    );
  }

  if (isLoading) {
    return (
      <LiquidLearningLayout variant="default" gradientTheme="aurora">
        <div className="min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-violet-200 border-t-violet-500 animate-spin mx-auto" />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <svg
                  className="w-8 h-8 text-violet-600"
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
              </motion.div>
            </div>
            <p className="mt-6 text-slate-600 font-medium">
              Loading admin dashboard...
            </p>
          </motion.div>
        </div>
      </LiquidLearningLayout>
    );
  }

  return (
    <LiquidLearningLayout
      variant="default"
      gradientTheme="aurora"
      showMeshBackground
    >
      {/* Glass Header */}
      <GlassHeader>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25"
              >
                <svg
                  className="w-7 h-7 text-white"
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
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-slate-600">
                  Platform Administration
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden lg:flex bg-white/50 backdrop-blur-sm rounded-xl p-1 border border-slate-200/50">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'bg-white text-violet-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
              <LiquidButton
                variant="secondary"
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
              >
                Logout
              </LiquidButton>
            </div>
          </div>
        </div>
      </GlassHeader>

      {/* Mobile Tabs */}
      <div className="lg:hidden px-4 py-3 bg-white/50 backdrop-blur-sm border-b border-slate-200/50">
        <div className="flex space-x-2 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'bg-violet-100 text-violet-700'
                  : 'text-slate-600 bg-white/50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Hero */}
        <AdminDashboardHero
          adminName={user?.name}
          metrics={[
            { label: 'Total Users', value: stats.totalUsers, icon: '👥', trend: 'up', trendValue: '+12%' },
            { label: 'Active Sessions', value: stats.activeSessions, icon: '📚', trend: 'neutral', trendValue: String(stats.activeSessions) },
            { label: 'System Health', value: '99.9%', icon: '💚', trend: 'up', trendValue: 'Optimal' },
            { label: 'Total Parents', value: stats.totalParents, icon: '👨‍👩‍👧', trend: 'up', trendValue: '+8%' },
          ]}
          onViewReports={() => setActiveTab('reports')}
          onManageUsers={() => setActiveTab('users')}
          className="mb-8"
        />

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Stats Grid */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
              >
                <motion.div variants={itemVariants}>
                  <GlassStatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    color="primary"
                    icon={
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    }
                  />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <GlassStatCard
                    title="Parents"
                    value={stats.activeParents}
                    color="success"
                    icon={
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                    }
                  />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <GlassStatCard
                    title="Teachers"
                    value={stats.activeTeachers}
                    color="secondary"
                    icon={
                      <svg
                        className="w-6 h-6"
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
                    }
                  />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <GlassStatCard
                    title="Students"
                    value={stats.totalStudents}
                    color="warning"
                    icon={
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                        />
                      </svg>
                    }
                  />
                </motion.div>
              </motion.div>

              {/* Activity & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden"
                >
                  <div className="px-6 py-4 border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-white">
                    <h2 className="text-lg font-semibold text-slate-900">
                      Recent Activity
                    </h2>
                  </div>
                  <div className="p-6 space-y-4">
                    {recentActivity.map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center space-x-4 p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-100"
                      >
                        <div
                          className={`w-10 h-10 bg-gradient-to-br ${getActivityColor(activity.type)} rounded-lg flex items-center justify-center text-white shadow-lg`}
                        >
                          <span className="text-lg">
                            {getActivityIcon(activity.type)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">
                            {activity.description}
                          </p>
                          <p className="text-sm text-slate-500">
                            {activity.user}
                          </p>
                        </div>
                        <span className="text-xs text-slate-400">
                          {activity.timestamp}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden"
                >
                  <div className="px-6 py-4 border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-white">
                    <h2 className="text-lg font-semibold text-slate-900">
                      Quick Actions
                    </h2>
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-4">
                    {[
                      {
                        label: 'Create User',
                        icon: '👤',
                        color: 'from-sky-500 to-blue-600',
                        action: () => setShowCreateUserModal(true),
                      },
                      {
                        label: 'View Reports',
                        icon: '📊',
                        color: 'from-violet-500 to-purple-600',
                        action: () => setActiveTab('analytics'),
                      },
                      {
                        label: 'Manage Users',
                        icon: '👥',
                        color: 'from-amber-500 to-orange-600',
                        action: () => setActiveTab('users'),
                      },
                      {
                        label: 'Settings',
                        icon: '⚙️',
                        color: 'from-green-500 to-emerald-600',
                        action: () => setActiveTab('settings'),
                      },
                    ].map((action, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={action.action}
                        className="flex flex-col items-center p-4 bg-gradient-to-b from-white to-slate-50 rounded-xl border border-slate-100 hover:shadow-lg transition-all"
                      >
                        <div
                          className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center text-white shadow-lg mb-3`}
                        >
                          <span className="text-xl">{action.icon}</span>
                        </div>
                        <span className="text-sm font-medium text-slate-900">
                          {action.label}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-center justify-between mb-6">
                <SectionTitle subtitle="Manage platform users">
                  All Users
                </SectionTitle>
                <LiquidButton
                  variant="primary"
                  icon={
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  }
                  onClick={() => setShowCreateUserModal(true)}
                >
                  Create User
                </LiquidButton>
              </div>
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">
                          User
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">
                          Role
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((u, index) => (
                        <motion.tr
                          key={u.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-slate-50/50"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">
                                  {u.name}
                                </p>
                                <p className="text-sm text-slate-500">
                                  {u.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-violet-100 text-violet-700' : u.role === 'teacher' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              Active
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button className="text-slate-400 hover:text-violet-600 transition-colors">
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                />
                              </svg>
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/50 p-8"
            >
              <SectionTitle subtitle="Platform-wide analytics and insights">
                Analytics Dashboard
              </SectionTitle>
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-10 h-10 text-violet-600"
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
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Advanced Analytics Coming Soon
                </h3>
                <p className="text-slate-600 max-w-md mx-auto">
                  Detailed analytics with custom reports and trend analysis.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/50 p-8"
            >
              <SectionTitle subtitle="Configure platform settings">
                Platform Settings
              </SectionTitle>
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-10 h-10 text-violet-600"
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
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Settings Panel Coming Soon
                </h3>
                <p className="text-slate-600 max-w-md mx-auto">
                  Comprehensive settings management.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create User Modal */}
      <AnimatePresence>
        {showCreateUserModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-900">
                    Create New User
                  </h2>
                  <button
                    onClick={() => setShowCreateUserModal(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={e =>
                        setNewUser({ ...newUser, name: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={e =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Role
                    </label>
                    <select
                      value={newUser.role}
                      onChange={e =>
                        setNewUser({
                          ...newUser,
                          role: e.target.value as
                            | 'parent'
                            | 'admin'
                            | 'teacher',
                        })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    >
                      <option value="parent">Parent</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateUserModal(false)}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <LiquidButton
                      type="submit"
                      variant="secondary"
                      className="flex-1"
                    >
                      Create User
                    </LiquidButton>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {showCredentialsModal && createdUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  User Created Successfully
                </h2>
                <p className="text-slate-600 mb-6">
                  Save these credentials securely:
                </p>
                <div className="bg-slate-50 rounded-lg p-4 text-left space-y-2 mb-6">
                  <p>
                    <span className="font-medium">Email:</span>{' '}
                    {createdUser.email}
                  </p>
                  <p>
                    <span className="font-medium">Password:</span>{' '}
                    {createdUserPassword}
                  </p>
                </div>
                <LiquidButton
                  variant="primary"
                  onClick={() => {
                    setShowCredentialsModal(false);
                    setCreatedUser(null);
                    setCreatedUserPassword(null);
                  }}
                  className="w-full"
                >
                  Done
                </LiquidButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <FloatingActionButton
        actions={fabActions}
        position="bottom-right"
        variant="solid"
        color="secondary"
      />
    </LiquidLearningLayout>
  );
}
