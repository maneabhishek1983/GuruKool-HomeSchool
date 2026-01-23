'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Logo } from '@/components/Logo';
import { LiquidButton } from '@/components/ui/LiquidButton';
import { GlassCard } from '@/components/ui/GlassCard';

export default function EnhancedHome() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50" />
        
        {/* Animated blobs */}
        <motion.div
          className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-indigo-400/30 to-purple-400/30 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-400/30 to-rose-400/30 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl"
          animate={{
            x: [-50, 50, -50],
            y: [-50, 50, -50],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      <main className="relative z-10">
        {/* Hero Section */}
        <motion.section
          className="container mx-auto px-4 pt-20 pb-32 text-center"
          style={{ y, opacity }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="mb-8"
          >
            <Logo size="xl" variant="default" />
          </motion.div>

          <motion.h1
            className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Learning Flows
            <br />
            Naturally Here
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto mb-12 leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Transform your homeschooling journey with AI-powered insights,
            seamless time tracking, and biometric security—all in one beautiful platform.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link href="/login">
              <LiquidButton
                variant="primary"
                size="lg"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
              >
                Get Started
              </LiquidButton>
            </Link>
            <Link href="#features">
              <LiquidButton variant="secondary" size="lg">
                Explore Features
              </LiquidButton>
            </Link>
          </motion.div>
        </motion.section>

        {/* Role Selection Section */}
        <section id="features" className="container mx-auto px-4 py-20">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Choose Your Journey
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Whether you're a parent managing your child's education or a teacher tracking sessions,
              we've designed the perfect experience for you.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Parent Card */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <GlassCard variant="default" gradient>
                <div className="p-8">
                  <motion.div
                    className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </motion.div>

                  <h3 className="text-3xl font-bold text-gray-900 mb-4 text-center">
                    For Parents
                  </h3>

                  <p className="text-gray-700 mb-6 text-center leading-relaxed">
                    Manage your child's education with AI-powered insights, track progress,
                    and stay connected with teachers—all in one place.
                  </p>

                  <div className="space-y-3 mb-8">
                    {[
                      { icon: '🎯', text: 'AI-Powered Progress Insights' },
                      { icon: '👥', text: 'Teacher Management & Communication' },
                      { icon: '📊', text: 'Real-Time Session Tracking' },
                      { icon: '🔒', text: 'Biometric Security & Geofencing' },
                    ].map((feature, index) => (
                      <motion.div
                        key={index}
                        className="flex items-center gap-3 text-gray-800"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <span className="text-2xl">{feature.icon}</span>
                        <span className="font-medium">{feature.text}</span>
                      </motion.div>
                    ))}
                  </div>

                  <Link href="/login" className="block">
                    <LiquidButton variant="primary" className="w-full">
                      Parent Portal
                    </LiquidButton>
                  </Link>
                </div>
              </GlassCard>
            </motion.div>

            {/* Teacher Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <GlassCard variant="default" gradient>
                <div className="p-8">
                  <motion.div
                    className="w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl"
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </motion.div>

                  <h3 className="text-3xl font-bold text-gray-900 mb-4 text-center">
                    For Teachers
                  </h3>

                  <p className="text-gray-700 mb-6 text-center leading-relaxed">
                    Streamline your teaching sessions with instant check-in/out,
                    automated timesheets, and seamless parent communication.
                  </p>

                  <div className="space-y-3 mb-8">
                    {[
                      { icon: '⚡', text: '5-Second Biometric Check-In' },
                      { icon: '📍', text: 'Location-Verified Sessions' },
                      { icon: '⏱️', text: 'Automatic Timesheet Generation' },
                      { icon: '📝', text: 'Session Notes & Reports' },
                    ].map((feature, index) => (
                      <motion.div
                        key={index}
                        className="flex items-center gap-3 text-gray-800"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <span className="text-2xl">{feature.icon}</span>
                        <span className="font-medium">{feature.text}</span>
                      </motion.div>
                    ))}
                  </div>

                  <Link href="/login" className="block">
                    <LiquidButton variant="secondary" className="w-full">
                      Teacher Portal
                    </LiquidButton>
                  </Link>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </section>

        {/* Features Showcase */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Why Choose GuruKool?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We've reimagined homeschool management from the ground up
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: '🔒',
                title: 'Bulletproof Security',
                description: 'Biometric authentication + geofencing ensures teachers are physically present',
                gradient: 'from-indigo-500 to-purple-600',
              },
              {
                icon: '🤖',
                title: 'AI-Powered Insights',
                description: 'Get personalized recommendations and track progress with intelligent analytics',
                gradient: 'from-pink-500 to-rose-600',
              },
              {
                icon: '⚡',
                title: 'Lightning Fast',
                description: 'Check in/out in 5 seconds with biometric authentication—no QR codes needed',
                gradient: 'from-emerald-500 to-teal-600',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <GlassCard variant="light">
                  <div className="p-8 text-center">
                    <motion.div
                      className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mx-auto mb-6 text-4xl shadow-lg`}
                      whileHover={{ scale: 1.1, rotate: 10 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      {feature.icon}
                    </motion.div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <GlassCard variant="dark" className="max-w-4xl mx-auto">
            <div className="p-12 text-center">
              <motion.h2
                className="text-4xl md:text-5xl font-bold mb-6 text-gray-900"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                Ready to Transform Your
                <br />
                Homeschooling Experience?
              </motion.h2>
              <motion.p
                className="text-xl text-gray-700 mb-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                Join thousands of families already using GuruKool
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <Link href="/login">
                  <LiquidButton
                    variant="success"
                    size="lg"
                    icon={
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    }
                  >
                    Start Your Journey
                  </LiquidButton>
                </Link>
              </motion.div>
            </div>
          </GlassCard>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-8 text-center text-gray-600">
          <p className="mb-2">© 2026 GuruKool HomeSchool. All rights reserved.</p>
          <Link
            href="/admin-portal"
            className="text-sm text-indigo-600 hover:text-indigo-700 underline"
          >
            Admin Portal
          </Link>
        </footer>
      </main>
    </div>
  );
}
