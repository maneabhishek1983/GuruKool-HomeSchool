'use client';

import React, { useState, useEffect } from 'react';
import {
  motion,
  useAnimation,
  useMotionValue,
  useTransform,
} from 'framer-motion';
import { cn, themeClasses } from '../../themes/theme-utils';
import { Card, CardHeader, CardTitle, CardContent } from '../base/Card';
import { animationPresets } from '../../animations/presets';

export interface ProgressStep {
  id: string;
  label: string;
  description?: string;
  completed: boolean;
  current?: boolean;
  icon?: React.ReactNode;
  metadata?: Record<string, any>;
}

export interface ProgressData {
  title: string;
  steps: ProgressStep[];
  overallProgress: number; // 0-100
  type: 'linear' | 'circular' | 'radial' | 'milestone';
  animated?: boolean;
  showPercentage?: boolean;
  color?: string;
  gradient?: boolean;
}

interface ProgressTrackerProps {
  progressData: ProgressData[];
  layout?: 'grid' | 'list' | 'compact';
  interactive?: boolean;
  onStepClick?: (progressId: string, step: ProgressStep) => void;
  className?: string;
}

const LinearProgress = ({
  progress,
  animated = true,
  color = '#0ea5e9',
  gradient = false,
  showPercentage = true,
}: {
  progress: number;
  animated?: boolean;
  color?: string;
  gradient?: boolean;
  showPercentage?: boolean;
}) => {
  const progressValue = useMotionValue(0);
  const width = useTransform(progressValue, [0, 100], ['0%', '100%']);
  const controls = useAnimation();

  useEffect(() => {
    if (animated) {
      controls.start({
        width: `${progress}%`,
        transition: { duration: 1.5, ease: 'easeOut' },
      });
      progressValue.set(progress);
    }
  }, [progress, animated, controls, progressValue]);

  return (
    <div className="relative">
      <div
        className={cn(
          'w-full h-3 rounded-full overflow-hidden',
          'bg-gray-200 dark:bg-gray-700'
        )}
      >
        <motion.div
          className={cn(
            'h-full rounded-full',
            gradient
              ? 'bg-gradient-to-r from-blue-500 to-purple-500'
              : 'bg-blue-500'
          )}
          style={{ backgroundColor: !gradient ? color : undefined }}
          initial={{ width: '0%' }}
          animate={animated ? controls : { width: `${progress}%` }}
        />
      </div>
      {showPercentage && (
        <motion.span
          className="absolute right-0 -top-6 text-xs font-medium text-gray-600 dark:text-gray-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {Math.round(progress)}%
        </motion.span>
      )}
    </div>
  );
};

const CircularProgress = ({
  progress,
  size = 80,
  strokeWidth = 8,
  animated = true,
  color = '#0ea5e9',
  showPercentage = true,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  animated?: boolean;
  color?: string;
  showPercentage?: boolean;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{
            strokeDashoffset: animated ? undefined : offset,
            transition: animated
              ? 'stroke-dashoffset 1.5s ease-out'
              : undefined,
          }}
        />
      </svg>
      {showPercentage && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="text-sm font-semibold">{Math.round(progress)}%</span>
        </motion.div>
      )}
    </div>
  );
};

const RadialProgress = ({
  progress,
  size = 120,
  animated = true,
  color = '#0ea5e9',
  showPercentage = true,
}: {
  progress: number;
  size?: number;
  animated?: boolean;
  color?: string;
  showPercentage?: boolean;
}) => {
  const angle = (progress / 100) * 360;

  return (
    <div className="relative inline-flex items-center justify-center">
      <motion.div
        className="rounded-full border-8 border-gray-200 dark:border-gray-700"
        style={{ width: size, height: size }}
      >
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(${color} ${angle}deg, transparent ${angle}deg)`,
            mask: 'radial-gradient(circle at center, transparent 60%, black 60%)',
          }}
          initial={{ rotate: 0 }}
          {...(animated ? { animate: { rotate: 0 } } : {})}
        />
      </motion.div>
      {showPercentage && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="text-lg font-bold">{Math.round(progress)}%</span>
        </motion.div>
      )}
    </div>
  );
};

const MilestoneProgress = ({
  steps,
  onStepClick,
  animated = true,
}: {
  steps: ProgressStep[];
  onStepClick?: (step: ProgressStep) => void;
  animated?: boolean;
}) => {
  return (
    <div className="relative">
      {/* Progress line */}
      <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-gray-200 dark:bg-gray-700" />

      <div className="space-y-6">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            {...(animated ? { initial: { opacity: 0, x: -20 } } : {})}
            {...(animated ? { animate: { opacity: 1, x: 0 } } : {})}
            {...(animated ? { transition: { delay: index * 0.1 } } : {})}
            className="relative flex items-start gap-4"
          >
            {/* Step indicator */}
            <motion.div
              className={cn(
                'relative z-10 flex items-center justify-center',
                'w-8 h-8 rounded-full border-2',
                'transition-all duration-300',
                step.completed
                  ? 'bg-green-500 border-green-500 text-white'
                  : step.current
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
              )}
              {...(onStepClick ? { whileHover: { scale: 1.1 } } : {})}
              {...(onStepClick ? { whileTap: { scale: 0.95 } } : {})}
              onClick={() => onStepClick?.(step)}
            >
              {step.completed ? (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  ✓
                </motion.span>
              ) : step.current ? (
                <motion.div
                  className="w-2 h-2 bg-white rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              ) : (
                <span className="text-xs font-medium">{index + 1}</span>
              )}
            </motion.div>

            {/* Step content */}
            <div className="flex-1 min-w-0 pb-4">
              <h4
                className={cn(
                  'font-medium text-sm',
                  step.completed && 'text-green-600 dark:text-green-400',
                  step.current && 'text-blue-600 dark:text-blue-400'
                )}
              >
                {step.label}
              </h4>
              {step.description && (
                <p className="text-xs text-gray-500 mt-1">{step.description}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const ProgressTrackerCard = ({
  data,
  interactive = true,
  onStepClick,
}: {
  data: ProgressData;
  interactive?: boolean;
  onStepClick?: (progressId: string, step: ProgressStep) => void;
}) => {
  const handleStepClick = (step: ProgressStep) => {
    if (interactive && onStepClick) {
      onStepClick(data.title, step);
    }
  };

  const renderProgress = () => {
    switch (data.type) {
      case 'linear':
        return (
          <LinearProgress
            progress={data.overallProgress}
            {...(data.animated !== undefined
              ? { animated: data.animated }
              : {})}
            {...(data.color !== undefined ? { color: data.color } : {})}
            {...(data.gradient !== undefined
              ? { gradient: data.gradient }
              : {})}
            {...(data.showPercentage !== undefined
              ? { showPercentage: data.showPercentage }
              : {})}
          />
        );

      case 'circular':
        return (
          <div className="flex justify-center">
            <CircularProgress
              progress={data.overallProgress}
              {...(data.animated !== undefined
                ? { animated: data.animated }
                : {})}
              {...(data.color !== undefined ? { color: data.color } : {})}
              {...(data.showPercentage !== undefined
                ? { showPercentage: data.showPercentage }
                : {})}
            />
          </div>
        );

      case 'radial':
        return (
          <div className="flex justify-center">
            <RadialProgress
              progress={data.overallProgress}
              {...(data.animated !== undefined
                ? { animated: data.animated }
                : {})}
              {...(data.color !== undefined ? { color: data.color } : {})}
              {...(data.showPercentage !== undefined
                ? { showPercentage: data.showPercentage }
                : {})}
            />
          </div>
        );

      case 'milestone':
        return (
          <MilestoneProgress
            steps={data.steps}
            {...(handleStepClick ? { onStepClick: handleStepClick } : {})}
            {...(data.animated !== undefined
              ? { animated: data.animated }
              : {})}
          />
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={animationPresets.fadeInUp}
      {...(interactive ? { whileHover: { y: -2 } } : {})}
    >
      <Card variant="elevated" className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{data.title}</span>
            {data.type !== 'milestone' && data.showPercentage && (
              <motion.span
                className="text-sm font-normal text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {Math.round(data.overallProgress)}% Complete
              </motion.span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderProgress()}

          {/* Steps summary for non-milestone types */}
          {data.type !== 'milestone' && data.steps.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  {data.steps.filter(s => s.completed).length} of{' '}
                  {data.steps.length} steps completed
                </span>
                <span>
                  {data.steps.filter(s => !s.completed).length} remaining
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export function ProgressTracker({
  progressData,
  layout = 'grid',
  interactive = true,
  onStepClick,
  className,
}: ProgressTrackerProps) {
  const layoutClasses = {
    grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    list: 'space-y-6',
    compact: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
  };

  return (
    <motion.div
      className={cn(layoutClasses[layout], className)}
      initial="container"
      animate="container"
      variants={{
        container: {
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
    >
      {progressData.map((data, index) => (
        <motion.div
          key={data.title}
          variants={{
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
          }}
        >
          <ProgressTrackerCard
            data={data}
            interactive={interactive}
            {...(onStepClick ? { onStepClick } : {})}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

// Sample data generator for testing
export const generateSampleProgressData = (
  count: number = 3
): ProgressData[] => {
  const types: ProgressData['type'][] = [
    'linear',
    'circular',
    'radial',
    'milestone',
  ];
  const colors = ['#0ea5e9', '#d946ef', '#10b981', '#f59e0b', '#ef4444'];

  return Array.from({ length: count }, (_, i) => {
    const selectedType = types[i % types.length];
    const selectedColor = colors[i % colors.length];
    const stepCount = Math.floor(Math.random() * 5) + 3;
    const completedSteps = Math.floor(Math.random() * stepCount);

    const steps: ProgressStep[] = Array.from({ length: stepCount }, (_, j) => ({
      id: `step-${i}-${j}`,
      label: `Step ${j + 1}`,
      description: `Description for step ${j + 1}`,
      completed: j < completedSteps,
      current: j === completedSteps,
    }));

    return {
      title: `Progress Tracker ${i + 1}`,
      steps,
      overallProgress: (completedSteps / stepCount) * 100,
      type: selectedType ?? 'linear',
      animated: true,
      showPercentage: true,
      color: selectedColor ?? '#0ea5e9',
      gradient: Math.random() > 0.5,
    };
  });
};
