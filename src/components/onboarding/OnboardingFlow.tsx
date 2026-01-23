'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { LiquidButton } from '@/components/ui/LiquidButton';
import confetti from 'canvas-confetti';

interface OnboardingStep {
  image: string;
  title: string;
  description: string;
  gradient: string;
  icon: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    image: '/images/optimized/onboarding/welcome.webp',
    title: 'Welcome to GuruKool',
    description: 'Your comprehensive homeschool management platform. Track sessions, manage students, and streamline your teaching workflow.',
    gradient: 'from-blue-500 to-cyan-500',
    icon: '👋',
  },
  {
    image: '/images/optimized/onboarding/setup.webp',
    title: 'Set Up Your Account',
    description: 'Add your students, invite teachers, and configure your homeschool program. It only takes a few minutes to get started.',
    gradient: 'from-purple-500 to-pink-500',
    icon: '⚙️',
  },
  {
    image: '/images/optimized/onboarding/success.webp',
    title: 'You\'re All Set!',
    description: 'Start managing your homeschool journey with confidence. Track progress, schedule sessions, and celebrate achievements.',
    gradient: 'from-emerald-500 to-teal-500',
    icon: '🎉',
  },
];

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip?: () => void;
  className?: string;
}

export default function OnboardingFlow({
  onComplete,
  onSkip,
  className = '',
}: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      // Celebrate completion
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      setTimeout(() => onComplete(), 500);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 ${className}`}>
      <div className="max-w-5xl w-full">
        {/* Progress Indicators */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center gap-2 mb-8"
        >
          {onboardingSteps.map((_, index) => (
            <motion.div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${index === currentStep
                  ? `w-12 bg-gradient-to-r ${step.gradient}`
                  : index < currentStep
                    ? 'w-8 bg-green-500'
                    : 'w-8 bg-gray-300 dark:bg-gray-600'
                }`}
              initial={{ scale: 0.8 }}
              animate={{ scale: index === currentStep ? 1.1 : 1 }}
            />
          ))}
        </motion.div>

        {/* Main Content Card */}
        <div className="relative backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 rounded-3xl p-12 border border-white/30 shadow-2xl overflow-hidden">
          {/* Gradient Background */}
          <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-5`} />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="relative z-10"
            >
              {/* Content Grid */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                {/* Left: Image */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="relative"
                >
                  <Image
                    src={step.image}
                    alt={step.title}
                    width={400}
                    height={400}
                    className="w-full h-auto object-contain"
                    priority
                  />

                  {/* Floating particles */}
                  <div className="absolute inset-0 -z-10">
                    {[...Array(10)].map((_, i) => (
                      <motion.div
                        key={i}
                        className={`absolute w-2 h-2 rounded-full bg-gradient-to-br ${step.gradient}`}
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                          y: [0, -25, 0],
                          opacity: [0.3, 0.7, 0.3],
                        }}
                        transition={{
                          duration: 2 + Math.random() * 2,
                          repeat: Infinity,
                          delay: Math.random() * 2,
                        }}
                      />
                    ))}
                  </div>
                </motion.div>

                {/* Right: Content */}
                <div className="flex flex-col">
                  {/* Icon Badge */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className={`inline-flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br ${step.gradient} text-white text-3xl shadow-lg`}
                  >
                    {step.icon}
                  </motion.div>

                  {/* Step Counter */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2"
                  >
                    Step {currentStep + 1} of {onboardingSteps.length}
                  </motion.p>

                  {/* Title */}
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
                  >
                    {step.title}
                  </motion.h2>

                  {/* Description */}
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-gray-600 dark:text-gray-300 mb-8 text-lg leading-relaxed"
                  >
                    {step.description}
                  </motion.p>

                  {/* Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="flex flex-wrap gap-4"
                  >
                    {currentStep > 0 && (
                      <LiquidButton
                        variant="outline"
                        size="large"
                        onClick={handlePrevious}
                      >
                        ← Previous
                      </LiquidButton>
                    )}

                    <LiquidButton
                      variant="primary"
                      size="large"
                      onClick={handleNext}
                      className="flex-1"
                    >
                      {isLastStep ? '🚀 Get Started' : 'Next →'}
                    </LiquidButton>
                  </motion.div>

                  {/* Skip Button */}
                  {!isLastStep && onSkip && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                      onClick={handleSkip}
                      className="mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                      Skip onboarding →
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Decorative gradient orbs */}
          <div className={`absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br ${step.gradient} rounded-full blur-3xl opacity-20`} />
          <div className={`absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-br ${step.gradient} rounded-full blur-3xl opacity-20`} />
        </div>
      </div>
    </div>
  );
}
