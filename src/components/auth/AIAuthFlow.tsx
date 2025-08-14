'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRAuthState, AIInsight } from '@/types';

interface AIAuthFlowProps {
  authState: QRAuthState;
  aiInsights?: AIInsight[];
  onStepComplete?: (step: string) => void;
  className?: string;
}

interface AuthStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  aiEnhanced: boolean;
  duration?: number;
}

export function AIAuthFlow({ authState, aiInsights = [], onStepComplete, className = '' }: AIAuthFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<AuthStep[]>([
    {
      id: 'qr_generation',
      title: 'QR Code Generation',
      description: 'Creating secure QR code with AI-enhanced security',
      status: 'completed',
      aiEnhanced: true,
    },
    {
      id: 'device_analysis',
      title: 'Device Analysis',
      description: 'AI analyzing device fingerprint and trust level',
      status: 'processing',
      aiEnhanced: true,
      duration: 2000,
    },
    {
      id: 'behavior_check',
      title: 'Behavior Verification',
      description: 'Checking authentication patterns with ML models',
      status: 'pending',
      aiEnhanced: true,
      duration: 1500,
    },
    {
      id: 'risk_assessment',
      title: 'Risk Assessment',
      description: 'AI-powered fraud detection and risk scoring',
      status: 'pending',
      aiEnhanced: true,
      duration: 1000,
    },
    {
      id: 'final_verification',
      title: 'Final Verification',
      description: 'Multi-factor authentication completion',
      status: 'pending',
      aiEnhanced: false,
      duration: 500,
    },
  ]);

  useEffect(() => {
    // Simulate AI processing steps
    const processSteps = async () => {
      for (let i = 1; i < steps.length; i++) {
        const currentStep = steps[i];
        if (currentStep && currentStep.status === 'processing') {
          await new Promise(resolve => setTimeout(resolve, currentStep.duration || 1000));
          
          setSteps(prev => prev.map((step, index) => {
            if (index === i) {
              return { ...step, status: 'completed' };
            } else if (index === i + 1) {
              return { ...step, status: 'processing' };
            }
            return step;
          }));

          setCurrentStep(i);
          onStepComplete?.(currentStep.id);
        }
      }
    };

    if (authState.authStatus === 'pending') {
      processSteps();
    }
  }, [authState.authStatus, onStepComplete, steps]);

  const getStepIcon = (step: AuthStep) => {
    if (step.status === 'completed') {
      return '✓';
    } else if (step.status === 'processing') {
      return '⟳';
    } else if (step.status === 'failed') {
      return '✗';
    }
    return '○';
  };

  const getStepColor = (step: AuthStep) => {
    switch (step.status) {
      case 'completed':
        return 'text-success-600 bg-success-100';
      case 'processing':
        return 'text-primary-600 bg-primary-100';
      case 'failed':
        return 'text-error-600 bg-error-100';
      default:
        return 'text-neutral-400 bg-neutral-100';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* AI Authentication Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center space-x-2 bg-primary-50 rounded-full px-4 py-2">
          <motion.div
            className="w-2 h-2 bg-primary-500 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
          <span className="text-sm font-medium text-primary-700">
            AI-Enhanced Authentication
          </span>
        </div>
      </motion.div>

      {/* Authentication Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-start space-x-4 p-4 rounded-2xl border transition-all duration-300 ${
              step.status === 'processing' 
                ? 'bg-primary-50 border-primary-200 shadow-soft' 
                : step.status === 'completed'
                ? 'bg-success-50 border-success-200'
                : step.status === 'failed'
                ? 'bg-error-50 border-error-200'
                : 'bg-neutral-50 border-neutral-200'
            }`}
          >
            {/* Step Icon */}
            <motion.div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${getStepColor(step)}`}
              animate={step.status === 'processing' ? {
                rotate: 360,
                transition: { duration: 2, repeat: Infinity, ease: 'linear' }
              } : {}}
            >
              {getStepIcon(step)}
            </motion.div>

            {/* Step Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-neutral-800">
                  {step.title}
                </h3>
                {step.aiEnhanced && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700">
                    AI
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-600 mt-1">
                {step.description}
              </p>

              {/* Processing Animation */}
              {step.status === 'processing' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-neutral-200 rounded-full h-1">
                      <motion.div
                        className="bg-primary-500 h-1 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: (step.duration || 1000) / 1000 }}
                      />
                    </div>
                    <span className="text-xs text-neutral-500">
                      Processing...
                    </span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Step Status */}
            <div className="flex flex-col items-end space-y-1">
              {step.status === 'completed' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-xs text-success-600 font-medium"
                >
                  Complete
                </motion.div>
              )}
              {step.status === 'processing' && (
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-xs text-primary-600 font-medium"
                >
                  Processing
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* AI Insights Panel */}
      <AnimatePresence>
        {aiInsights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-4"
          >
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">AI</span>
              </div>
              <h3 className="font-semibold text-purple-800">
                AI Security Insights
              </h3>
            </div>
            
            <div className="space-y-2">
              {aiInsights.slice(0, 3).map((insight, index) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-2"
                >
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-purple-700">
                      {insight.content}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-purple-600">
                        Confidence: {Math.round(insight.confidence * 100)}%
                      </span>
                      <span className="text-xs text-purple-500">
                        {insight.type}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Security Score */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white border border-neutral-200 rounded-2xl p-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-neutral-800">Security Score</h3>
            <p className="text-sm text-neutral-600">
              AI-calculated authentication security level
            </p>
          </div>
          <div className="text-right">
            <motion.div
              className="text-2xl font-bold text-success-600"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1, type: 'spring' }}
            >
              95%
            </motion.div>
            <div className="text-xs text-success-600 font-medium">
              High Security
            </div>
          </div>
        </div>
        
        <div className="mt-3">
          <div className="bg-neutral-200 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-success-400 to-success-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '95%' }}
              transition={{ delay: 1, duration: 1 }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}