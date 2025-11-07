'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { NetflixBackground, NetflixCard, NetflixButton } from './NetflixBackground';

interface NetflixDashboardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function NetflixDashboard({ 
  children, 
  title, 
  subtitle, 
  className = '' 
}: NetflixDashboardProps) {
  return (
    <NetflixBackground variant="dashboard" className={className}>
      <div className="container mx-auto px-4 py-8">
        {(title || subtitle) && (
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {title && (
              <h1 className="text-4xl font-bold text-white mb-4 netflix-text-gradient">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-xl text-netflix-text-gray max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </motion.div>
        )}
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {children}
        </motion.div>
      </div>
    </NetflixBackground>
  );
}

// Netflix-style stats card
export function NetflixStatsCard({ 
  title, 
  value, 
  subtitle, 
  icon,
  trend,
  className = '' 
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-400';
      case 'down': return 'text-red-400';
      default: return 'text-netflix-text-gray';
    }
  };

  return (
    <NetflixCard className={`p-6 netflix-hover-lift ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {icon && (
            <div className="w-10 h-10 bg-netflix-red rounded-lg flex items-center justify-center">
              {icon}
            </div>
          )}
          <h3 className="text-sm font-medium text-netflix-text-gray">{title}</h3>
        </div>
        {trend && (
          <div className={`text-sm ${getTrendColor()}`}>
            {trend === 'up' && '↗'}
            {trend === 'down' && '↘'}
            {trend === 'neutral' && '→'}
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <p className="text-3xl font-bold text-white">{value}</p>
        {subtitle && (
          <p className="text-sm text-netflix-text-gray">{subtitle}</p>
        )}
      </div>
    </NetflixCard>
  );
}

// Netflix-style feature grid
export function NetflixFeatureGrid({ 
  features, 
  className = '' 
}: {
  features: Array<{
    title: string;
    description: string;
    icon: React.ReactNode;
    href?: string;
  }>;
  className?: string;
}) {
  return (
    <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {features.map((feature, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
        >
          <NetflixCard className="p-6 netflix-hover-lift h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-netflix-red rounded-full flex items-center justify-center mx-auto mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-netflix-text-gray mb-4">
                {feature.description}
              </p>
              {feature.href && (
                <NetflixButton 
                  as="a" 
                  href={feature.href}
                  variant="outline"
                  size="sm"
                >
                  Learn More
                </NetflixButton>
              )}
            </div>
          </NetflixCard>
        </motion.div>
      ))}
    </div>
  );
}

// Netflix-style loading skeleton
export function NetflixSkeleton({ 
  className = '',
  lines = 3 
}: {
  className?: string;
  lines?: number;
}) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-netflix-medium-gray rounded"
            style={{ width: `${100 - i * 10}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// Netflix-style navigation
export function NetflixNavigation({ 
  items, 
  className = '' 
}: {
  items: Array<{
    label: string;
    href: string;
    active?: boolean;
  }>;
  className?: string;
}) {
  return (
    <nav className={`flex space-x-1 ${className}`}>
      {items.map((item, index) => (
        <motion.a
          key={index}
          href={item.href}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            item.active
              ? 'bg-netflix-red text-white'
              : 'text-netflix-text-gray hover:text-white hover:bg-netflix-medium-gray'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {item.label}
        </motion.a>
      ))}
    </nav>
  );
}
