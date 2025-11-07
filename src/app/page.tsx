'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { NetflixBackground, NetflixButton, NetflixCard } from '@/components/NetflixBackground';

export default function Home() {
  return (
    <NetflixBackground variant="hero">
      <main
        id="main-content"
        role="main"
        tabIndex={0}
        autoFocus
        className="container mx-auto px-4 py-16"
      >
        {/* Logo and Branding */}
        <motion.div
          className="flex flex-col items-center mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="flex items-center gap-6 mb-4">
            {/* Study Group Mascot - Students in Natural Environment */}
            <motion.div
              className="relative"
              animate={{ 
                y: [0, -8, 0],
                scale: [1, 1.02, 1]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="w-24 h-20 bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl relative overflow-hidden">
                {/* Natural Study Environment */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-300/20 via-blue-400/20 to-purple-500/20 rounded-2xl"></div>
                
                {/* Study Group - Girl and Boy Students */}
                <div className="relative z-10 flex items-center gap-1">
                  {/* Girl Student */}
                  <div className="w-6 h-8 bg-pink-300 rounded-full flex items-center justify-center relative">
                    {/* Head */}
                    <div className="w-4 h-4 bg-pink-200 rounded-full flex items-center justify-center">
                      {/* Hair */}
                      <div className="absolute -top-1 w-5 h-2 bg-pink-400 rounded-full"></div>
                      {/* Eyes */}
                      <div className="flex gap-0.5">
                        <div className="w-0.5 h-0.5 bg-slate-700 rounded-full"></div>
                        <div className="w-0.5 h-0.5 bg-slate-700 rounded-full"></div>
                      </div>
                    </div>
                    {/* Body */}
                    <div className="absolute top-3 w-3 h-4 bg-blue-400 rounded-sm"></div>
                    {/* Book */}
                    <div className="absolute top-4 left-1 w-2 h-3 bg-yellow-200 rounded-sm"></div>
                  </div>
                  
                  {/* Boy Student */}
                  <div className="w-6 h-8 bg-blue-300 rounded-full flex items-center justify-center relative">
                    {/* Head */}
                    <div className="w-4 h-4 bg-blue-200 rounded-full flex items-center justify-center">
                      {/* Hair */}
                      <div className="absolute -top-1 w-5 h-2 bg-blue-500 rounded-full"></div>
                      {/* Eyes */}
                      <div className="flex gap-0.5">
                        <div className="w-0.5 h-0.5 bg-slate-700 rounded-full"></div>
                        <div className="w-0.5 h-0.5 bg-slate-700 rounded-full"></div>
                      </div>
                    </div>
                    {/* Body */}
                    <div className="absolute top-3 w-3 h-4 bg-green-400 rounded-sm"></div>
                    {/* Book */}
                    <div className="absolute top-4 left-1 w-2 h-3 bg-orange-200 rounded-sm"></div>
                  </div>
                </div>
                
                {/* Natural Elements */}
                <div className="absolute top-1 left-1 w-2 h-2 bg-green-400 rounded-full opacity-60"></div>
                <div className="absolute top-2 right-1 w-1.5 h-1.5 bg-yellow-300 rounded-full opacity-60"></div>
                <div className="absolute bottom-1 left-2 w-1 h-1 bg-blue-300 rounded-full opacity-60"></div>
              </div>
            </motion.div>
            
            {/* Enhanced Logo Icon */}
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden">
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 via-orange-400 to-red-400 animate-pulse opacity-50"></div>
              
              {/* Study Group Icon */}
              <div className="relative z-10 flex items-center gap-1">
                {/* Girl Student */}
                <div className="w-6 h-8 bg-pink-300 rounded-full flex items-center justify-center relative">
                  <div className="w-4 h-4 bg-pink-200 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-slate-700 rounded-full"></div>
                  </div>
                  <div className="absolute -top-1 w-5 h-2 bg-pink-400 rounded-full"></div>
                </div>
                
                {/* Boy Student */}
                <div className="w-6 h-8 bg-blue-300 rounded-full flex items-center justify-center relative">
                  <div className="w-4 h-4 bg-blue-200 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-slate-700 rounded-full"></div>
                  </div>
                  <div className="absolute -top-1 w-5 h-2 bg-blue-500 rounded-full"></div>
                </div>
              </div>
              
              {/* Sparkle effects */}
              <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full animate-ping"></div>
              <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-yellow-200 rounded-full animate-pulse"></div>
            </div>
            <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent drop-shadow-2xl">
              GuruKool
            </h1>
          </div>
          <p className="text-sm text-gray-400 tracking-wider uppercase">Homeschool Management Platform</p>
          <motion.div
            className="mt-4 flex items-center justify-center gap-2 text-green-400"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <span className="text-lg">👥</span>
            <span className="text-sm font-medium">Join our study community - where learning happens naturally!</span>
            <span className="text-lg">📚</span>
          </motion.div>
        </motion.div>

        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            AI-Enhanced Learning Experience
          </h2>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
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
          <NetflixCard className="p-8 backdrop-blur-sm bg-slate-800/40">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
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
              <h2 className="text-2xl font-semibold text-white mb-2">
                Parent Access
              </h2>
              <p className="text-gray-300 mb-6">
                Manage your child&apos;s education journey with AI-powered
                insights and progress tracking.
              </p>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm text-gray-300">
                <svg
                  className="w-4 h-4 text-blue-400 mr-2 flex-shrink-0"
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
              <div className="flex items-center text-sm text-gray-300">
                <svg
                  className="w-4 h-4 text-blue-400 mr-2 flex-shrink-0"
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
              <div className="flex items-center text-sm text-gray-300">
                <svg
                  className="w-4 h-4 text-blue-400 mr-2 flex-shrink-0"
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
              className="block w-full text-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Parent Login
            </Link>
          </NetflixCard>

          {/* Teacher Access */}
          <NetflixCard className="p-8 backdrop-blur-sm bg-slate-800/40">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
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
              <h2 className="text-2xl font-semibold text-white mb-2">
                Teacher Access
              </h2>
              <p className="text-gray-300 mb-6">
                Manage student sessions, track progress, and communicate with
                parents.
              </p>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm text-gray-300">
                <svg
                  className="w-4 h-4 text-purple-400 mr-2 flex-shrink-0"
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
              <div className="flex items-center text-sm text-gray-300">
                <svg
                  className="w-4 h-4 text-purple-400 mr-2 flex-shrink-0"
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
              <div className="flex items-center text-sm text-gray-300">
                <svg
                  className="w-4 h-4 text-purple-400 mr-2 flex-shrink-0"
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
              className="block w-full text-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Teacher Login
            </Link>
          </NetflixCard>
        </motion.div>

        {/* Admin Portal Link */}
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <p className="text-sm text-gray-400 mb-2">Platform Administration</p>
          <Link
            href="/admin-portal"
            className="text-sm text-indigo-400 hover:text-indigo-300 underline transition-colors"
          >
            Admin Portal Access
          </Link>
        </motion.div>
      </main>
    </NetflixBackground>
  );
}
