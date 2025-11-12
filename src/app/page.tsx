'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Logo } from '@/components/Logo';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gurukool-gray-50 via-white to-gurukool-primary-lightest">
      <main
        id="main-content"
        role="main"
        tabIndex={0}
        autoFocus
        className="container mx-auto px-4 py-16"
      >
        {/* Logo and Branding */}
        <motion.div
          className="flex flex-col items-center mb-12"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="flex items-center gap-6 mb-6">
            <Logo size="xl" variant="default" />
          </div>
          <p className="text-sm text-gurukool-gray-600 tracking-wider uppercase font-medium mb-4">
            Homeschool Management Platform
          </p>
          <motion.div
            className="mt-4 flex items-center justify-center gap-2 text-gurukool-secondary"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <span className="text-lg">👥</span>
            <span className="text-sm font-medium">
              Join our study community - where learning happens naturally!
            </span>
            <span className="text-lg">📚</span>
          </motion.div>
        </motion.div>

        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-gurukool-primary via-gurukool-secondary to-gurukool-accent bg-clip-text text-transparent">
            AI-Enhanced Learning Experience
          </h2>
          <p className="text-lg md:text-xl text-gurukool-gray-700 max-w-3xl mx-auto leading-relaxed">
            Streamline your homeschooling experience with AI-powered insights,
            secure authentication, and comprehensive student management.
          </p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        >
          {/* Parent Access */}
          <div className="p-8 bg-white rounded-xl shadow-lg border border-gurukool-gray-200 hover:shadow-xl transition-shadow">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gurukool-primary rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
                <svg
                  className="w-8 h-8 text-white"
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
              <h2 className="text-2xl font-semibold text-gurukool-gray-900 mb-2">
                Parent Access
              </h2>
              <p className="text-gurukool-gray-600 mb-6">
                Manage your child&apos;s education journey with AI-powered
                insights and progress tracking.
              </p>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm text-gurukool-gray-700">
                <svg
                  className="w-4 h-4 text-gurukool-primary mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Student Profiles & Management
              </div>
              <div className="flex items-center text-sm text-gurukool-gray-700">
                <svg
                  className="w-4 h-4 text-gurukool-primary mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                AI-Powered Progress Insights
              </div>
              <div className="flex items-center text-sm text-gurukool-gray-700">
                <svg
                  className="w-4 h-4 text-gurukool-primary mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Teacher Assignment & Communication
              </div>
            </div>
            <Link
              href="/login"
              className="block w-full text-center px-6 py-3 bg-gurukool-primary hover:bg-gurukool-primary-dark text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Parent Login
            </Link>
          </div>

          {/* Teacher Access */}
          <div className="p-8 bg-white rounded-xl shadow-lg border border-gurukool-gray-200 hover:shadow-xl transition-shadow">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gurukool-secondary rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
                <svg
                  className="w-8 h-8 text-white"
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
              <h2 className="text-2xl font-semibold text-gurukool-gray-900 mb-2">
                Teacher Access
              </h2>
              <p className="text-gurukool-gray-600 mb-6">
                Manage student sessions, track progress, and communicate with
                parents.
              </p>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm text-gurukool-gray-700">
                <svg
                  className="w-4 h-4 text-gurukool-secondary mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Student Session Management
              </div>
              <div className="flex items-center text-sm text-gurukool-gray-700">
                <svg
                  className="w-4 h-4 text-gurukool-secondary mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Progress Tracking & Reports
              </div>
              <div className="flex items-center text-sm text-gurukool-gray-700">
                <svg
                  className="w-4 h-4 text-gurukool-secondary mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Timesheet & Billing
              </div>
            </div>
            <Link
              href="/login"
              className="block w-full text-center px-6 py-3 bg-gurukool-secondary hover:bg-gurukool-secondary-dark text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Teacher Login
            </Link>
          </div>
        </motion.div>

        {/* Admin Portal Link */}
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <p className="text-sm text-gurukool-gray-500 mb-2">
            Platform Administration
          </p>
          <Link
            href="/admin-portal"
            className="text-sm text-gurukool-primary hover:text-gurukool-primary-dark underline transition-colors font-medium"
          >
            Admin Portal Access
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
