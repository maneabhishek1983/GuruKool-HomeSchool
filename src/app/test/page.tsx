'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { NetflixBackground, NetflixButton, NetflixCard } from '@/components/NetflixBackground';

export default function TestPage() {
  return (
    <NetflixBackground variant="hero">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-4 netflix-text-gradient">
            🎉 Application Test Page
          </h1>
          <p className="text-xl text-netflix-text-gray">
            Testing the multi-theme application
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <NetflixCard className="p-6 text-center">
            <div className="w-16 h-16 bg-netflix-red rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎬</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Netflix Theme</h3>
            <p className="text-netflix-text-gray mb-4">
              Dark, cinematic design for parents
            </p>
            <NetflixButton size="lg">
              Test Netflix Theme
            </NetflixButton>
          </NetflixCard>

          <NetflixCard className="p-6 text-center">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🛒</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Amazon Theme</h3>
            <p className="text-netflix-text-gray mb-4">
              Clean, professional design for teachers
            </p>
            <NetflixButton size="lg" variant="secondary">
              Test Amazon Theme
            </NetflixButton>
          </NetflixCard>

          <NetflixCard className="p-6 text-center">
            <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎈</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Kids Theme</h3>
            <p className="text-netflix-text-gray mb-4">
              Colorful, playful design for students
            </p>
            <NetflixButton size="lg" variant="outline">
              Test Kids Theme
            </NetflixButton>
          </NetflixCard>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-12 text-center"
        >
          <h2 className="text-2xl font-bold mb-4">Application Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-green-500 text-white p-4 rounded-lg">
              <div className="text-2xl mb-2">✅</div>
              <div className="font-bold">Server Running</div>
              <div className="text-sm">Port 3003</div>
            </div>
            <div className="bg-blue-500 text-white p-4 rounded-lg">
              <div className="text-2xl mb-2">🎨</div>
              <div className="font-bold">Themes Ready</div>
              <div className="text-sm">3 Themes</div>
            </div>
            <div className="bg-purple-500 text-white p-4 rounded-lg">
              <div className="text-2xl mb-2">📱</div>
              <div className="font-bold">Responsive</div>
              <div className="text-sm">All Devices</div>
            </div>
            <div className="bg-orange-500 text-white p-4 rounded-lg">
              <div className="text-2xl mb-2">⚡</div>
              <div className="font-bold">Performance</div>
              <div className="text-sm">Optimized</div>
            </div>
          </div>
        </motion.div>
      </div>
    </NetflixBackground>
  );
}
