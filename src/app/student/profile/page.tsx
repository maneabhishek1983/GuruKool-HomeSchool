'use client';

import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ThemeBackground, ThemeButton, ThemeCard } from '@/components/RoleBasedTheme';

export default function StudentProfile() {
  const { user, logout } = useAuthContext();
  const router = useRouter();
  const [profile, setProfile] = useState({
    name: 'Alex Johnson',
    age: 8,
    grade: '3rd Grade',
    subjects: ['Math', 'Science', 'Reading', 'Art'],
    progress: 85,
    achievements: [
      { title: 'Math Master', description: 'Completed 50 math problems', date: '2024-01-15' },
      { title: 'Reading Star', description: 'Read 10 books this month', date: '2024-01-10' },
      { title: 'Science Explorer', description: 'Completed science project', date: '2024-01-05' },
    ],
    recentActivities: [
      { subject: 'Math', activity: 'Multiplication tables', time: '2 hours ago' },
      { subject: 'Reading', activity: 'Chapter 5 of "The Magic Tree"', time: '1 day ago' },
      { subject: 'Science', activity: 'Plant growth experiment', time: '2 days ago' },
    ]
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-kids-purple flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-kids-text-dark mb-4">
            Access Denied
          </h1>
          <p className="text-kids-text-medium">
            Please log in to access your student profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ThemeBackground variant="dashboard">
      <div className="container mx-auto px-4 py-8">
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold mb-4">
            My Learning Journey
          </h1>
          <p className="text-xl max-w-2xl mx-auto">
            Welcome back, {profile.name}! Let's learn something amazing today! 🌟
          </p>
        </motion.div>

        {/* Profile Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <ThemeCard className="p-6 text-center">
            <div className="w-16 h-16 bg-kids-pink rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👋</span>
            </div>
            <h3 className="text-xl font-bold mb-2">{profile.name}</h3>
            <p className="text-kids-text-medium">{profile.age} years old</p>
            <p className="text-kids-text-medium">{profile.grade}</p>
          </ThemeCard>

          <ThemeCard className="p-6 text-center">
            <div className="w-16 h-16 bg-kids-turquoise rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📚</span>
            </div>
            <h3 className="text-xl font-bold mb-2">My Subjects</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {profile.subjects.map((subject, index) => (
                <span key={index} className="bg-kids-pink text-white px-3 py-1 rounded-full text-sm">
                  {subject}
                </span>
              ))}
            </div>
          </ThemeCard>

          <ThemeCard className="p-6 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏆</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Progress</h3>
            <div className="text-3xl font-bold text-kids-pink mb-2">{profile.progress}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-kids-pink h-2 rounded-full transition-all duration-500"
                style={{ width: `${profile.progress}%` }}
              />
            </div>
          </ThemeCard>
        </div>

        {/* Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ThemeCard className="p-6">
            <h3 className="text-2xl font-bold mb-4 flex items-center">
              <span className="mr-2">🎯</span>
              Recent Activities
            </h3>
            <div className="space-y-4">
              {profile.recentActivities.map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-center p-3 bg-kids-purple rounded-lg"
                >
                  <div className="w-10 h-10 bg-kids-turquoise rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold">
                      {activity.subject.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">{activity.activity}</p>
                    <p className="text-sm text-kids-text-medium">{activity.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </ThemeCard>

          <ThemeCard className="p-6">
            <h3 className="text-2xl font-bold mb-4 flex items-center">
              <span className="mr-2">🏆</span>
              My Achievements
            </h3>
            <div className="space-y-4">
              {profile.achievements.map((achievement, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-center p-3 bg-kids-purple rounded-lg"
                >
                  <div className="w-10 h-10 bg-kids-pink rounded-full flex items-center justify-center mr-3">
                    <span className="text-white">🏅</span>
                  </div>
                  <div>
                    <p className="font-semibold">{achievement.title}</p>
                    <p className="text-sm text-kids-text-medium">{achievement.description}</p>
                    <p className="text-xs text-kids-text-light">{achievement.date}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </ThemeCard>
        </div>

        {/* Learning Games */}
        <ThemeCard className="p-6">
          <h3 className="text-2xl font-bold mb-4 flex items-center">
            <span className="mr-2">🎮</span>
            Learning Games
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-kids-pink text-white p-4 rounded-2xl text-center cursor-pointer"
            >
              <div className="text-3xl mb-2">🧮</div>
              <h4 className="font-bold">Math Adventure</h4>
              <p className="text-sm">Solve fun math problems!</p>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-kids-turquoise text-white p-4 rounded-2xl text-center cursor-pointer"
            >
              <div className="text-3xl mb-2">📖</div>
              <h4 className="font-bold">Reading Quest</h4>
              <p className="text-sm">Explore amazing stories!</p>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-green-500 text-white p-4 rounded-2xl text-center cursor-pointer"
            >
              <div className="text-3xl mb-2">🔬</div>
              <h4 className="font-bold">Science Lab</h4>
              <p className="text-sm">Discover cool experiments!</p>
            </motion.div>
          </div>
        </ThemeCard>
      </div>
    </ThemeBackground>
  );
}
