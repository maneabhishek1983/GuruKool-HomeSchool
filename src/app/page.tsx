'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Logo } from '@/components/Logo';
import {
  LiquidLearningLayout,
  GlassCard,
  LiquidButton,
} from '@/components/layouts/LiquidLearningLayout';
import {
  HeroSection,
  HeroBadge,
  HeroCTA,
} from '@/design-system/components/layout/HeroSection';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15,
    },
  },
} as const;

const features = [
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    ),
    title: 'AI-Powered Insights',
    description:
      'Get personalized learning recommendations and progress analysis powered by advanced AI.',
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    ),
    title: 'Secure Authentication',
    description:
      "Biometric login, QR codes, and enterprise-grade security protect your family's data.",
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
    title: 'Progress Tracking',
    description:
      'Comprehensive dashboards to monitor learning progress across subjects and standards.',
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    title: 'Global Standards',
    description:
      'Support for UK, US, and India academic standards with localized curriculum tracking.',
  },
];

export default function Home() {
  return (
    <LiquidLearningLayout
      variant="landing"
      gradientTheme="primary"
      showMeshBackground={true}
    >
      {/* Hero Section */}
      <HeroSection
        title={
          <span className="inline-block">
            <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
              Reimagine
            </span>{' '}
            <span className="bg-gradient-to-r from-sky-200 via-violet-200 to-fuchsia-200 bg-clip-text text-transparent">
              Homeschooling
            </span>
          </span>
        }
        subtitle="Welcome to GuruKool"
        description="The intelligent homeschool management platform that combines AI-powered insights, secure authentication, and comprehensive student tracking for modern families."
        background="mesh"
        gradientTheme="ocean"
        size="lg"
        badge={
          <HeroBadge icon={<span>✨</span>} variant="glass">
            AI-Enhanced Learning Platform
          </HeroBadge>
        }
        actions={
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/login">
              <HeroCTA
                variant="solid"
                size="lg"
                icon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                }
              >
                Get Started
              </HeroCTA>
            </Link>
            <Link href="/login">
              <HeroCTA variant="glass" size="lg">
                Parent Login
              </HeroCTA>
            </Link>
          </div>
        }
      />

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent">
              Everything You Need for Successful Homeschooling
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Powerful tools designed to make homeschool management effortless
              and learning engaging.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <GlassCard variant="frosted" className="p-6 h-full bg-white/80">
                  <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-sky-500/25">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 text-sm">
                    {feature.description}
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Access Cards Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-slate-100/50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-8"
          >
            {/* Parent Access Card */}
            <motion.div variants={itemVariants}>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500" />
                <div className="relative bg-white rounded-2xl p-8 shadow-xl border border-slate-200/50">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-500/25">
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
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                      Parent Access
                    </h2>
                    <p className="text-slate-600">
                      Manage your child&apos;s education journey with AI-powered
                      insights.
                    </p>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {[
                      'Student Profiles & Management',
                      'AI-Powered Progress Insights',
                      'Teacher Assignment & Communication',
                    ].map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center text-sm text-slate-700"
                      >
                        <svg
                          className="w-5 h-5 text-sky-500 mr-3 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>

                  <Link href="/login" className="block">
                    <LiquidButton
                      variant="primary"
                      size="lg"
                      className="w-full"
                    >
                      Parent Login
                    </LiquidButton>
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Teacher Access Card */}
            <motion.div variants={itemVariants}>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500" />
                <div className="relative bg-white rounded-2xl p-8 shadow-xl border border-slate-200/50">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/25">
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
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                      Teacher Access
                    </h2>
                    <p className="text-slate-600">
                      Manage sessions, track progress, and communicate
                      effectively.
                    </p>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {[
                      'Student Session Management',
                      'Progress Tracking & Reports',
                      'Timesheet & Billing',
                    ].map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center text-sm text-slate-700"
                      >
                        <svg
                          className="w-5 h-5 text-violet-500 mr-3 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>

                  <Link href="/login" className="block">
                    <LiquidButton
                      variant="secondary"
                      size="lg"
                      className="w-full"
                    >
                      Teacher Login
                    </LiquidButton>
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Admin Portal Link */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-center mt-12"
          >
            <p className="text-sm text-slate-500 mb-2">
              Platform Administration
            </p>
            <Link
              href="/admin-portal"
              className="text-sm text-sky-600 hover:text-sky-700 font-medium transition-colors inline-flex items-center gap-1"
            >
              Admin Portal Access
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-200/50 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Logo size="sm" variant="default" />
          </div>
          <p className="text-sm text-slate-500">
            Join our learning community where education happens naturally.
          </p>
        </div>
      </footer>
    </LiquidLearningLayout>
  );
}
