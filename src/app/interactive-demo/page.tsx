'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  GestureCard,
  presetSwipeActions,
  AnalyticsDashboard,
  generateSampleData,
  NotificationCenter,
  generateSampleNotifications,
  ProgressTracker,
  generateSampleProgressData,
} from '../../design-system/components/interactive';
import type {
  SwipeAction,
  AnalyticsData,
  Notification,
  ProgressData,
} from '../../design-system/components/interactive';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../../design-system/components/base/Card';
import { animationPresets } from '../../design-system/animations/presets';

export default function InteractiveDemoPage() {
  const [notifications, setNotifications] = useState<Notification[]>(
    generateSampleNotifications(8)
  );

  // Sample analytics data
  const analyticsCharts: AnalyticsData[] = [
    {
      title: 'Student Progress',
      data: generateSampleData('line', 7),
      type: 'line',
      color: '#0ea5e9',
      gradient: true,
      showGrid: true,
      showLegend: true,
    },
    {
      title: 'Session Distribution',
      data: generateSampleData('pie', 5),
      type: 'pie',
      showLegend: true,
    },
    {
      title: 'Weekly Activity',
      data: generateSampleData('bar', 7),
      type: 'bar',
      color: '#10b981',
      showGrid: true,
    },
    {
      title: 'Learning Trends',
      data: generateSampleData('area', 10),
      type: 'area',
      color: '#d946ef',
      gradient: true,
      showGrid: true,
    },
    {
      title: 'Performance Metrics',
      data: generateSampleData('radial', 4),
      type: 'radial',
      color: '#f59e0b',
    },
  ];

  // Sample progress data
  const progressData: ProgressData[] = generateSampleProgressData(6);

  // Custom swipe actions
  const customSwipeActions: SwipeAction[] = [
    {
      id: 'complete',
      label: 'Complete',
      color: 'success',
      action: () => alert('Task completed!'),
    },
    {
      id: 'postpone',
      label: 'Postpone',
      color: 'warning',
      action: () => alert('Task postponed!'),
    },
  ];

  const handleNotificationClick = (notification: Notification) => {
    console.log('Notification clicked:', notification);
  };

  const handleNotificationDismiss = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleChartClick = (chartData: AnalyticsData, dataPoint?: any) => {
    console.log('Chart clicked:', chartData.title, dataPoint);
  };

  const handleStepClick = (progressId: string, step: any) => {
    console.log('Step clicked:', progressId, step);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={animationPresets.fadeInDown}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Interactive Dashboard Components
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Premium UI components with advanced interactions and AI-powered
            features
          </p>
        </motion.div>

        {/* Gesture Cards Section */}
        <motion.section
          initial="initial"
          animate="animate"
          variants={animationPresets.fadeInUp}
          className="space-y-6"
        >
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Gesture Cards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <GestureCard
              swipeActions={{
                left: [presetSwipeActions.favorite, presetSwipeActions.share],
                right: [presetSwipeActions.archive, presetSwipeActions.delete],
              }}
              onSwipe={(direction, action) =>
                console.log(`Swiped ${direction}:`, action.label)
              }
            >
              <CardContent>
                <h3 className="font-semibold mb-2">Swipeable Card</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Swipe left for favorite/share actions, right for
                  archive/delete. Try dragging this card horizontally!
                </p>
              </CardContent>
            </GestureCard>

            <GestureCard
              swipeActions={{
                right: customSwipeActions,
              }}
              hapticFeedback={true}
            >
              <CardContent>
                <h3 className="font-semibold mb-2">Task Card</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Swipe right to complete or postpone this task. Includes haptic
                  feedback on supported devices.
                </p>
              </CardContent>
            </GestureCard>

            <GestureCard dragEnabled={false}>
              <CardContent>
                <h3 className="font-semibold mb-2">Static Card</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  This card has drag disabled but still has premium animations
                  and styling.
                </p>
              </CardContent>
            </GestureCard>
          </div>
        </motion.section>

        {/* Analytics Dashboard Section */}
        <motion.section
          initial="initial"
          animate="animate"
          variants={animationPresets.fadeInUp}
          className="space-y-6"
        >
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Analytics Dashboard
          </h2>
          <AnalyticsDashboard
            charts={analyticsCharts}
            layout="grid"
            interactive={true}
            aiInsights={{
              title: 'AI-Powered Insights',
              insights: [
                'Student engagement has increased by 23% this week',
                'Math sessions show the highest completion rate',
                'Recommend scheduling more science sessions on Wednesdays',
                'Overall learning progress is 15% above average',
              ],
              confidence: 87,
            }}
            onChartClick={handleChartClick}
          />
        </motion.section>

        {/* Notification Center Section */}
        <motion.section
          initial="initial"
          animate="animate"
          variants={animationPresets.fadeInUp}
          className="space-y-6"
        >
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Notification Center
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <NotificationCenter
              notifications={notifications}
              aiFilterEnabled={true}
              maxVisible={6}
              groupByCategory={true}
              onNotificationClick={handleNotificationClick}
              onNotificationDismiss={handleNotificationDismiss}
              onMarkAllRead={handleMarkAllRead}
            />

            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Notification Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <button
                  onClick={() =>
                    setNotifications(generateSampleNotifications(5))
                  }
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Generate New Notifications
                </button>
                <button
                  onClick={() => setNotifications([])}
                  className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Clear All Notifications
                </button>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <p>
                    • AI filtering prioritizes notifications by urgency and
                    relevance
                  </p>
                  <p>• Hover over notifications to see dismiss buttons</p>
                  <p>• Click action buttons to interact with notifications</p>
                  <p>• Use filters to view specific notification types</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Progress Tracker Section */}
        <motion.section
          initial="initial"
          animate="animate"
          variants={animationPresets.fadeInUp}
          className="space-y-6"
        >
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Progress Tracker
          </h2>
          <ProgressTracker
            progressData={progressData}
            layout="grid"
            interactive={true}
            onStepClick={handleStepClick}
          />
        </motion.section>

        {/* Feature Highlights */}
        <motion.section
          initial="initial"
          animate="animate"
          variants={animationPresets.fadeInUp}
          className="space-y-6"
        >
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card variant="elevated">
              <CardContent className="text-center p-6">
                <div className="text-3xl mb-3">👆</div>
                <h3 className="font-semibold mb-2">Gesture Support</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Swipe, drag, and tap interactions with haptic feedback
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="text-center p-6">
                <div className="text-3xl mb-3">🤖</div>
                <h3 className="font-semibold mb-2">AI-Powered</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Intelligent filtering, insights, and recommendations
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="text-center p-6">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="font-semibold mb-2">Rich Visualizations</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Interactive charts with multiple visualization types
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="text-center p-6">
                <div className="text-3xl mb-3">✨</div>
                <h3 className="font-semibold mb-2">Premium Animations</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Smooth transitions and micro-interactions
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
