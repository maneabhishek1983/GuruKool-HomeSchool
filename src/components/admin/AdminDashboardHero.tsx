'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { LiquidButton } from '@/components/ui/LiquidButton';
import { Liquid3DOrb } from '@/components/ui/Liquid3DOrb';

interface SystemMetric {
  label: string;
  value: number | string;
  icon: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

interface AdminDashboardHeroProps {
  adminName?: string;
  metrics?: SystemMetric[];
  onViewReports?: () => void;
  onManageUsers?: () => void;
  className?: string;
}

const defaultMetrics: SystemMetric[] = [
  {
    label: 'Total Users',
    value: 0,
    icon: '👥',
    trend: 'up',
    trendValue: '+0%',
  },
  {
    label: 'Active Sessions',
    value: 0,
    icon: '📚',
    trend: 'neutral',
    trendValue: '0',
  },
  {
    label: 'System Health',
    value: '100%',
    icon: '💚',
    trend: 'up',
    trendValue: 'Optimal',
  },
  { label: 'Revenue', value: '$0', icon: '💰', trend: 'up', trendValue: '+0%' },
];

export default function AdminDashboardHero({
  adminName,
  metrics = defaultMetrics,
  onViewReports,
  onManageUsers,
  className = '',
}: AdminDashboardHeroProps) {
  return (
    <div className={`relative w-full overflow-hidden rounded-3xl ${className}`}>
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <Image
          src="/images/optimized/dashboard-heroes/admin-analytics.webp"
          alt="Admin Dashboard"
          fill
          className="object-cover"
          priority
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/95 via-indigo-900/90 to-purple-900/85" />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-white/40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -40, 0],
              x: [0, Math.random() * 30 - 15, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 p-8 md:p-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Admin Portal{adminName && ` - ${adminName}`} 🛡️
          </h1>
          <p className="text-xl text-blue-100">
            System overview and platform management
          </p>
        </motion.div>

        {/* Metrics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
              className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{metric.icon}</span>
                {metric.trend && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      metric.trend === 'up'
                        ? 'bg-green-500/20 text-green-300'
                        : metric.trend === 'down'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-gray-500/20 text-gray-300'
                    }`}
                  >
                    {metric.trendValue}
                  </span>
                )}
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {metric.value}
              </div>
              <div className="text-sm text-blue-100">{metric.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="flex flex-wrap gap-4"
        >
          {onViewReports && (
            <LiquidButton
              variant="primary"
              size="lg"
              onClick={onViewReports}
              className="bg-white text-blue-900 hover:bg-blue-50"
            >
              📊 View Reports
            </LiquidButton>
          )}
          {onManageUsers && (
            <LiquidButton
              variant="ghost"
              size="lg"
              onClick={onManageUsers}
              className="border-white text-white hover:bg-white/10"
            >
              👥 Manage Users
            </LiquidButton>
          )}
          <LiquidButton
            variant="ghost"
            size="lg"
            className="border-white text-white hover:bg-white/10"
          >
            ⚙️ Settings
          </LiquidButton>
        </motion.div>

        {/* System Status Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mt-8 backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white font-medium">
                All Systems Operational
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-blue-100">
              <div>
                <span className="text-white font-medium">Uptime:</span> 99.9%
              </div>
              <div>
                <span className="text-white font-medium">Response Time:</span>{' '}
                45ms
              </div>
              <div>
                <span className="text-white font-medium">Last Update:</span>{' '}
                Just now
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Interactive Liquid 3D Orbs */}
      <div className="absolute -top-16 -right-16 pointer-events-none opacity-60">
        <Liquid3DOrb size="xl" variant="primary" interactive={false} />
      </div>
      <div className="absolute -bottom-16 -left-16 pointer-events-none opacity-60">
        <Liquid3DOrb size="xl" variant="glow" interactive={false} />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-30">
        <Liquid3DOrb size="xl" variant="gradient" interactive={false} />
      </div>
      <div className="absolute bottom-1/4 right-12 pointer-events-none opacity-40 hidden lg:block">
        <Liquid3DOrb size="md" variant="primary" interactive={false} />
      </div>
    </div>
  );
}
