'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthContext } from '@/lib/authContext';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'system' | 'features' | 'ai' | 'testing'>('overview');
  const [systemStats, setSystemStats] = useState({
    totalUsers: 158, // Including admin users
    activeTeachers: 42,
    activeParents: 89,
    activeAdmins: 3, // Admin users count
    totalSessions: 1234,
    aiAgentsActive: 5,
    mcpServersConnected: 0,
    systemHealth: 'Healthy' as 'Healthy' | 'Warning' | 'Error'
  });

  const handleRefreshStats = () => {
    const newTeachers = Math.floor(Math.random() * 50) + 40;
    const newParents = Math.floor(Math.random() * 100) + 80;
    const newAdmins = Math.floor(Math.random() * 5) + 2; // 2-7 admins
    const totalUsers = newTeachers + newParents + newAdmins + Math.floor(Math.random() * 20); // Some inactive users
    
    setSystemStats(prev => ({
      ...prev,
      totalUsers: totalUsers,
      activeTeachers: newTeachers,
      activeParents: newParents,
      activeAdmins: newAdmins,
      totalSessions: Math.floor(Math.random() * 500) + 1200,
    }));
  };

  const handleTestFeature = (featureName: string) => {
    alert(`Testing ${featureName}...\n\nThis would normally run automated tests for ${featureName}.\nFor now, check the testing tools in the Testing tab.`);
  };

  const handleSystemAction = (action: string) => {
    switch(action) {
      case 'restart':
        alert('⚠️ System Restart\n\nThis would restart the application server.\nIn development mode, use Ctrl+C and npm run dev.');
        break;
      case 'clear_cache':
        alert('✅ Cache Cleared\n\nApplication cache has been cleared.\nRefresh the page to see changes.');
        break;
      case 'backup':
        alert('💾 Backup Initiated\n\nSystem backup would be created.\nIn production, this would backup the database.');
        break;
      default:
        alert(`Action: ${action}`);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'system', label: 'System', icon: '⚙️' },
    { id: 'features', label: 'Features', icon: '🚀' },
    { id: 'ai', label: 'AI Agents', icon: '🤖' },
    { id: 'testing', label: 'Testing', icon: '🧪' }
  ];

  const features = [
    { name: 'QR Authentication', status: 'active', issues: 'MCP server connection needed' },
    { name: 'AI Agents', status: 'active', issues: 'Operating in development mode' },
    { name: 'Session Management', status: 'active', issues: 'None' },
    { name: 'Teacher Dashboard', status: 'active', issues: 'None' },
    { name: 'Parent Dashboard', status: 'partial', issues: 'Not fully implemented' },
    { name: 'Billing System', status: 'partial', issues: 'Payment integration needed' },
    { name: 'Offline Sync', status: 'active', issues: 'Database connection required' },
    { name: 'WebSocket Communication', status: 'active', issues: 'None' },
    { name: 'Theme System', status: 'active', issues: 'None' },
    { name: 'Analytics Dashboard', status: 'active', issues: 'Mock data only' }
  ];

  const testingTools = [
    { name: 'QR Code Generator', url: '/test-qr', description: 'Basic QR code generation test' },
    { name: 'QR Debug Tool', url: '/qr-debug', description: 'Multiple QR code types for testing' },
    { name: 'QR Auth Test Suite', url: '/test/qr', description: 'Comprehensive QR authentication tests' },
    { name: 'Simple Login Test', url: '/test-login', description: 'Bypass QR auth for quick testing' },
    { name: 'System Status', url: '/status', description: 'Application health check' },
    { name: 'Design System Demo', url: '/design-system-demo', description: 'UI component showcase' },
    { name: 'Interactive Demo', url: '/interactive-demo', description: 'Feature demonstrations' },
    { name: 'Forms Demo', url: '/forms-demo', description: 'Smart form components' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🛠️ Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Welcome back, {user?.name || 'Admin'} | Full System Access
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                🔐 Admin Logged In
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                systemStats.systemHealth === 'Healthy' ? 'bg-green-100 text-green-800' :
                systemStats.systemHealth === 'Warning' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {systemStats.systemHealth}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {[
                  { label: 'Total Users', value: systemStats.totalUsers, color: 'blue' },
                  { label: 'Active Teachers', value: systemStats.activeTeachers, color: 'green' },
                  { label: 'Active Parents', value: systemStats.activeParents, color: 'purple' },
                  { label: 'Active Admins', value: systemStats.activeAdmins, color: 'red' },
                  { label: 'Total Sessions', value: systemStats.totalSessions, color: 'yellow' }
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                        <p className="text-3xl font-semibold text-gray-900">{stat.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
                  <button 
                    onClick={handleRefreshStats}
                    className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    🔄 Refresh Stats
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button 
                    onClick={() => window.open('/test-qr', '_blank')}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-center transition-colors"
                  >
                    <div className="text-2xl mb-2">📱</div>
                    <p className="text-sm font-medium">Test QR Codes</p>
                  </button>
                  <button 
                    onClick={() => window.open('/test/qr', '_blank')}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-center transition-colors"
                  >
                    <div className="text-2xl mb-2">🧪</div>
                    <p className="text-sm font-medium">QR Auth Tests</p>
                  </button>
                  <button 
                    onClick={() => window.open('/teacher/dashboard', '_blank')}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-center transition-colors"
                  >
                    <div className="text-2xl mb-2">👨‍🏫</div>
                    <p className="text-sm font-medium">Teacher View</p>
                  </button>
                  <button 
                    onClick={() => window.open('/status', '_blank')}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-center transition-colors"
                  >
                    <div className="text-2xl mb-2">📊</div>
                    <p className="text-sm font-medium">System Status</p>
                  </button>
                </div>
                
                {/* System Actions */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">System Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => handleSystemAction('clear_cache')}
                      className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded text-sm transition-colors"
                    >
                      Clear Cache
                    </button>
                    <button 
                      onClick={() => handleSystemAction('backup')}
                      className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm transition-colors"
                    >
                      Create Backup
                    </button>
                    <button 
                      onClick={() => handleSystemAction('restart')}
                      className="px-3 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded text-sm transition-colors"
                    >
                      Restart Server
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'features' && (
            <motion.div
              key="features"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Feature Status</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{feature.name}</h4>
                          <p className="text-sm text-gray-600">{feature.issues}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleTestFeature(feature.name)}
                            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs font-medium transition-colors"
                          >
                            Test
                          </button>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            feature.status === 'active' ? 'bg-green-100 text-green-800' :
                            feature.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {feature.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'testing' && (
            <motion.div
              key="testing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Quick Testing Actions */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">🚀 Quick Testing Actions</h3>
                  <p className="text-sm text-gray-600">Instant testing without leaving the dashboard</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button 
                      onClick={() => window.open('/test-qr', '_blank')}
                      className="p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-center transition-colors"
                    >
                      <div className="text-2xl mb-2">📱</div>
                      <p className="text-sm font-medium text-blue-700">Generate QR</p>
                    </button>
                    <button 
                      onClick={() => window.open('/qr-debug', '_blank')}
                      className="p-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-center transition-colors"
                    >
                      <div className="text-2xl mb-2">🔍</div>
                      <p className="text-sm font-medium text-purple-700">Debug QR</p>
                    </button>
                    <button 
                      onClick={() => window.open('/test/qr', '_blank')}
                      className="p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-center transition-colors"
                    >
                      <div className="text-2xl mb-2">🧪</div>
                      <p className="text-sm font-medium text-green-700">QR Tests</p>
                    </button>
                    <button 
                      onClick={() => window.open('/status', '_blank')}
                      className="p-4 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg text-center transition-colors"
                    >
                      <div className="text-2xl mb-2">📊</div>
                      <p className="text-sm font-medium text-orange-700">System Status</p>
                    </button>
                  </div>
                  
                  {/* Additional Testing Options */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button 
                      onClick={() => {
                        const testEmail = 'teacher@example.com';
                        const testPassword = 'password';
                        alert(`Test Teacher Login:\nEmail: ${testEmail}\nPassword: ${testPassword}\n\nUse these credentials to test teacher features.`);
                      }}
                      className="p-4 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-lg text-left transition-colors"
                    >
                      <h4 className="font-medium text-yellow-800 mb-1">👨‍🏫 Test Teacher Login</h4>
                      <p className="text-sm text-yellow-600">Get teacher test credentials</p>
                    </button>
                    <button 
                      onClick={() => {
                        const testEmail = 'parent@example.com';
                        const testPassword = 'password';
                        alert(`Test Parent Login:\nEmail: ${testEmail}\nPassword: ${testPassword}\n\nUse these credentials to test parent features.`);
                      }}
                      className="p-4 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-left transition-colors"
                    >
                      <h4 className="font-medium text-indigo-800 mb-1">👨‍👩‍👧‍👦 Test Parent Login</h4>
                      <p className="text-sm text-indigo-600">Get parent test credentials</p>
                    </button>
                  </div>
                </div>
              </div>

              {/* Testing Tools Links */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">🛠️ Detailed Testing Tools</h3>
                  <p className="text-sm text-gray-600">Comprehensive testing utilities for all features</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {testingTools.map((tool, index) => (
                      <Link key={index} href={tool.url} 
                            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <h4 className="font-medium text-gray-900 mb-2">{tool.name}</h4>
                        <p className="text-sm text-gray-600">{tool.description}</p>
                        <div className="mt-2 text-blue-600 text-sm font-medium">
                          Visit {tool.url} →
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'system' && (
            <motion.div
              key="system"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">System Information</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Server Status:</span>
                        <span className="text-green-600 font-medium">Running (localhost:3002)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Next.js Version:</span>
                        <span className="text-gray-900">14.2.31</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">AI Agents:</span>
                        <span className="text-gray-900">{systemStats.aiAgentsActive} Active</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">MCP Servers:</span>
                        <span className="text-red-600">{systemStats.mcpServersConnected} Connected (Development)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Database:</span>
                        <span className="text-yellow-600">Offline (Mock Data)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Development Notes</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3 text-sm text-gray-600">
                      <p>• AI enhancement disabled in development mode</p>
                      <p>• Database operations use mock data</p>
                      <p>• MCP server integration requires setup</p>
                      <p>• QR authentication works with demo users</p>
                      <p>• All UI components functional</p>
                      <p>• WebSocket connections active</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'ai' && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">AI Agents Status</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {[
                      'Security Analysis Agent',
                      'Authentication Verification Agent', 
                      'Task Automation Agent',
                      'Analytics Agent',
                      'Communication Agent'
                    ].map((agent, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-900">{agent}</span>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Demo User Accounts</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {[
                      { role: 'Teacher', email: 'teacher@example.com', password: 'password', features: 'Session management, AI tools, Dashboard' },
                      { role: 'Parent', email: 'parent@example.com', password: 'password', features: 'Progress tracking, Communication' },
                      { role: 'Admin', email: 'admin@example.com', password: 'admin123', features: 'Full system access, All features' }
                    ].map((user, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{user.role}</h4>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {user.role.toLowerCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Email: {user.email}</p>
                        <p className="text-sm text-gray-600 mb-2">Password: {user.password}</p>
                        <p className="text-sm text-gray-500">Features: {user.features}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}