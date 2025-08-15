'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="flex justify-between items-center p-6">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-gray-900">GuruKool</h1>
          <span className="text-sm text-gray-500">HomeSchool</span>
        </div>
        <Link
          href="/login"
          className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium rounded-lg hover:bg-blue-50 transition-colors"
        >
          Login
        </Link>
      </div>

      {/* Main Content */}
      <div
        className="flex items-center justify-center px-6"
        style={{ minHeight: 'calc(100vh - 120px)' }}
      >
        <motion.div
          className="max-w-4xl w-full text-center space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Hero Section */}
          <div className="space-y-4">
            <motion.h1
              className="text-5xl font-bold text-gray-900 mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              AI-Enhanced Homeschooling Platform
            </motion.h1>
            <motion.p
              className="text-xl text-gray-600 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              Connect parents and administrators with intelligent learning
              management, real-time progress tracking, and personalized AI
              assistance. Teachers work through the platform to support student
              learning.
            </motion.p>
          </div>

          {/* Role-based Access Cards */}
          <motion.div
            className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            {/* Parent Access */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl">👨‍👩‍👧‍👦</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Parents</h3>
                <p className="text-gray-600 text-sm">
                  Monitor your children&apos;s progress, create student
                  profiles, and receive AI insights
                </p>
                <Link
                  href="/parent/dashboard"
                  className="inline-block w-full py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
                >
                  Parent Dashboard
                </Link>
              </div>
            </div>

            {/* Admin Access */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl">🛠️</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Administrators
                </h3>
                <p className="text-gray-600 text-sm">
                  Manage system settings, monitor platform health, and oversee
                  all operations
                </p>
                <Link
                  href="/admin/dashboard"
                  className="inline-block w-full py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                >
                  Admin Dashboard
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Teacher Info Section */}
          <motion.div
            className="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <div className="flex items-center justify-center space-x-3 mb-3">
              <span className="text-2xl">👨‍🏫</span>
              <h3 className="text-lg font-semibold text-blue-900">
                For Teachers
              </h3>
            </div>
            <p className="text-blue-700 text-sm">
              Teachers work through the platform to support student learning.
              Access is managed by parents and administrators.
            </p>
          </motion.div>

          {/* Features Preview */}
          <motion.div
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.5 }}
          >
            <div className="space-y-2">
              <div className="text-3xl">🤖</div>
              <h4 className="font-semibold text-gray-900">AI-Powered</h4>
              <p className="text-sm text-gray-600">
                Intelligent insights and personalized recommendations
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl">👨‍🎓</div>
              <h4 className="font-semibold text-gray-900">Student Profiles</h4>
              <p className="text-sm text-gray-600">
                Create and manage comprehensive learning profiles
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl">📊</div>
              <h4 className="font-semibold text-gray-900">
                Progress Analytics
              </h4>
              <p className="text-sm text-gray-600">
                Comprehensive learning progress visualization
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
