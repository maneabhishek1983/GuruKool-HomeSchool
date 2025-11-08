'use client';

import { useAuthContext, User as AuthUser } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { QRCodeGenerator } from '@/utils/qr-code-generator';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'parent' | 'admin' | 'teacher' | 'student';
  status: 'active' | 'inactive';
  createdAt: Date;
  password?: string;
  qrCode?: string;
}

export default function AdminDashboard() {
  const { user, logout, createUser, getAllUsers } = useAuthContext();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);

  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'parent' as const,
  });
  const [createdUser, setCreatedUser] = useState<User | null>(null);
  const [createdUserPassword, setCreatedUserPassword] = useState<string | null>(
    null
  );

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
      // Load users from auth context
      const allUsers = getAllUsers();
      setUsers(
        allUsers.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          status: 'active' as const,
          createdAt: u.createdAt,
        }))
      );
    }
  }, [user, router, getAllUsers]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const generatePassword = () => {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const generateQRCode = (email: string, password: string) => {
    try {
      // Generate a simple QR code data string
      const qrData = JSON.stringify({
        email,
        password,
        timestamp: new Date().toISOString(),
        type: 'login',
      });

      // Create SVG content
      const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
          <rect width="200" height="200" fill="white"/>
          <text x="100" y="100" text-anchor="middle" font-family="monospace" font-size="8">${qrData}</text>
        </svg>
      `;

      // Convert to base64
      const base64Data = btoa(svgContent);
      const qrCodeUrl = `data:image/svg+xml;base64,${base64Data}`;

      console.log('QR Code generated successfully:', {
        email,
        qrCodeLength: qrCodeUrl.length,
        hasData: qrCodeUrl.includes(email),
      });

      return qrCodeUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      // Return a fallback QR code
      return `data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
          <rect width="200" height="200" fill="white"/>
          <text x="100" y="100" text-anchor="middle" font-family="monospace" font-size="12" fill="red">QR Code Error</text>
        </svg>
      `)}`;
    }
  };

  const handleCreateUser = async () => {
    if (newUser.name && newUser.email) {
      try {
        console.log('Creating new user:', newUser);

        const password = generatePassword();
        console.log('Generated password:', password);

        const qrCode = generateQRCode(newUser.email, password);
        console.log('Generated QR code:', qrCode ? 'Success' : 'Failed');

        // Create user with proper preferences structure
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
              layout: 'compact' as const,
              theme: 'light' as const,
              widgets: ['sessions', 'progress', 'notifications'],
            },
            privacy: {
              dataSharing: true,
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
        } as Omit<AuthUser, 'id' | 'createdAt' | 'lastActive'>;

        // Use the auth context to create the user
        const result = await createUser(userData);

        if (result.success && result.user) {
          const createdUser = {
            ...result.user,
            qrCode,
            status: 'active' as const,
          };

          console.log('Created user object:', {
            id: createdUser.id,
            name: createdUser.name,
            email: createdUser.email,
            role: createdUser.role,
            hasPassword: !!password,
            hasQRCode: !!createdUser.qrCode,
          });

          // Update local users list
          const allUsers = getAllUsers();
          setUsers(
            allUsers.map(u => ({
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.role,
              status: 'active' as const,
              createdAt: u.createdAt,
            }))
          );

          setCreatedUser(createdUser);
          setCreatedUserPassword(password);
          setNewUser({ name: '', email: '', role: 'parent' });
          setShowCreateUserModal(false);
          setShowCredentialsModal(true);

          console.log('User creation completed successfully');
        } else {
          alert(result.error || 'Failed to create user');
        }
      } catch (error) {
        console.error('Error creating user:', error);
        alert('Error creating user. Please check console for details.');
      }
    } else {
      alert('Please fill in all fields');
    }
  };

  const handleDeleteUser = (userId: string) => {
    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    alert('User deleted successfully!');
  };

  const handleButtonClick = (action: string) => {
    switch (action) {
      case 'manage-users':
        setShowCreateUserModal(true);
        break;
      case 'view-analytics':
        setShowAnalyticsModal(true);
        break;
      case 'configure-system':
        setShowSettingsModal(true);
        break;
      case 'security-dashboard':
        setShowSecurityModal(true);
        break;
      case 'manage-content':
        setShowContentModal(true);
        break;
      case 'health-dashboard':
        setShowHealthModal(true);
        break;
      default:
        alert('Feature coming soon!');
    }
  };

  if (!user || user.role !== 'admin') {
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
                Admin Dashboard
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
          {/* User Management Card */}
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
                User Management
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Manage parents, students, and teacher assignments
            </p>
            <button
              onClick={() => handleButtonClick('manage-users')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Manage Users
            </button>
          </div>

          {/* System Analytics Card */}
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
                System Analytics
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Monitor platform usage and performance metrics
            </p>
            <button
              onClick={() => handleButtonClick('view-analytics')}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              View Analytics
            </button>
          </div>

          {/* Platform Configuration Card */}
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
              <h3 className="text-lg font-semibold text-gray-900">
                Platform Settings
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Configure system settings and security policies
            </p>
            <button
              onClick={() => handleButtonClick('configure-system')}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Configure System
            </button>
          </div>

          {/* Security Monitoring Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-red-600"
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
              <h3 className="text-lg font-semibold text-gray-900">
                Security Monitoring
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Monitor security events and access logs
            </p>
            <button
              onClick={() => handleButtonClick('security-dashboard')}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
            >
              Security Dashboard
            </button>
          </div>

          {/* Content Management Card */}
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
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Content Management
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Manage educational content and resources
            </p>
            <button
              onClick={() => handleButtonClick('manage-content')}
              className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Manage Content
            </button>
          </div>

          {/* System Health Card */}
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                System Health
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Monitor system performance and health status
            </p>
            <button
              onClick={() => handleButtonClick('health-dashboard')}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Health Dashboard
            </button>
          </div>
        </div>
      </main>

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={e =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter user name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={e =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter user email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={newUser.role}
                  onChange={e =>
                    setNewUser({ ...newUser, role: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="parent">Parent</option>
                  <option value="admin">Admin</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateUserModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Credentials Modal */}
      {showCredentialsModal && createdUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="text-center mb-6">
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                User Created Successfully!
              </h3>
              <p className="text-sm text-gray-600">
                Share these credentials with {createdUser.name}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <p className="text-sm font-medium text-gray-900">
                    {createdUser.name}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <p className="text-sm font-medium text-gray-900">
                    {createdUser.email}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {createdUser.role}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-mono text-gray-900 bg-white px-2 py-1 rounded border">
                      {createdUserPassword || ''}
                    </p>
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(createdUserPassword || '')
                      }
                      className="text-blue-600 hover:text-blue-800"
                      title="Copy password"
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
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {createdUser.role === 'parent' && (
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  QR Code Login
                </h4>
                <div className="text-center">
                  {createdUser.qrCode ? (
                    <>
                      <img
                        src={createdUser.qrCode}
                        alt="QR Code for login"
                        className="w-32 h-32 mx-auto border border-gray-300 rounded"
                        onError={e => {
                          console.error('QR Code image failed to load:', e);
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove(
                            'hidden'
                          );
                        }}
                      />
                      <div className="hidden w-32 h-32 mx-auto border border-gray-300 rounded bg-red-50 flex items-center justify-center">
                        <p className="text-xs text-red-600">QR Code Error</p>
                      </div>
                      <p className="text-xs text-blue-700 mt-2">
                        Users can scan this QR code to log in quickly
                      </p>
                      <button
                        onClick={() => {
                          if (createdUser.qrCode) {
                            navigator.clipboard.writeText(createdUser.qrCode);
                            alert('QR Code data copied to clipboard');
                          }
                        }}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        Copy QR Code Data
                      </button>
                    </>
                  ) : (
                    <div className="w-32 h-32 mx-auto border border-gray-300 rounded bg-yellow-50 flex items-center justify-center">
                      <p className="text-xs text-yellow-600">
                        QR Code Not Generated
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-yellow-50 rounded-lg p-3 mb-4">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Important:</p>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>• Save these credentials securely</li>
                    <li>• Share them with the user via secure channels</li>
                    <li>• Users should change their password on first login</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCredentialsModal(false);
                  setCreatedUser(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalyticsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">System Analytics</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900">Total Users</h4>
                <p className="text-2xl font-bold text-blue-600">
                  {users.length}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900">Active Users</h4>
                <p className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.status === 'active').length}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">User Breakdown:</h4>
              <p>Parents: {users.filter(u => u.role === 'parent').length}</p>
              <p>Admins: {users.filter(u => u.role === 'admin').length}</p>
              <p>Teachers: {users.filter(u => u.role === 'teacher').length}</p>
            </div>
            <button
              onClick={() => setShowAnalyticsModal(false)}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Platform Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  Enable email notifications
                </label>
              </div>
              <div>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  Enable push notifications
                </label>
              </div>
              <div>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  Require 2FA for admins
                </label>
              </div>
            </div>
            <button
              onClick={() => setShowSettingsModal(false)}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* Security Modal */}
      {showSecurityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Security Dashboard</h3>
            <div className="space-y-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-green-800">✅ System Status: Secure</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-blue-800">📊 Recent Login Attempts: 12</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-yellow-800">⚠️ Failed Logins: 2</p>
              </div>
            </div>
            <button
              onClick={() => setShowSecurityModal(false)}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Content Modal */}
      {showContentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Content Management</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Upload Content
                  </h4>
                  <input
                    type="file"
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                  <button className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Upload File
                  </button>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Create Resource
                  </h4>
                  <input
                    type="text"
                    placeholder="Resource name"
                    className="w-full p-2 border border-gray-300 rounded mb-2"
                  />
                  <textarea
                    placeholder="Description"
                    className="w-full p-2 border border-gray-300 rounded mb-2"
                    rows={3}
                  ></textarea>
                  <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Create Resource
                  </button>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  Manage Curriculum
                </h4>
                <div className="space-y-2">
                  <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    UK Curriculum Management
                  </button>
                  <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    US Standards Management
                  </button>
                  <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    India NEP 2020 Management
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowContentModal(false)}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Health Modal */}
      {showHealthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">System Health</h3>
            <div className="space-y-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-green-800">✅ Server Status: Healthy</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-green-800">✅ Database: Connected</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-green-800">✅ API Services: Operational</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-blue-800">📊 Response Time: 45ms</p>
              </div>
            </div>
            <button
              onClick={() => setShowHealthModal(false)}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
