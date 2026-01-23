'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LiquidButton } from '@/components/ui/LiquidButton';
import { GlassCard } from '@/components/ui/GlassCard';

export default function EnhancedHomePage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0.3]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      {/* Hero Section with Parallax */}
      <section
        ref={heroRef}
        className="relative h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Parallax Background Image */}
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="absolute inset-0 z-0"
        >
          <Image
            src="/images/hero/mentor-student.jpg"
            alt="Mentor and student learning together outdoors"
            fill
            className="object-cover"
            priority
          />
          {/* Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
        </motion.div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight">
              Cool Learning for{' '}
              <span className="bg-gradient-to-r from-teal-400 to-orange-400 bg-clip-text text-transparent">
                Modern Kids
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto">
              Where ancient wisdom meets modern technology. GuruKool brings
              personalized mentorship and engaging learning to your homeschool.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <LiquidButton variant="primary" className="text-lg px-8 py-4">
                  Start Free Trial
                </LiquidButton>
              </Link>
              <Link href="/login">
                <LiquidButton variant="secondary" className="text-lg px-8 py-4">
                  Sign In
                </LiquidButton>
              </Link>
            </div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
              <motion.div
                className="w-1.5 h-1.5 bg-white rounded-full"
                animate={{ y: [0, 16, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bento Box Feature Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Why Parents Love <span className="text-teal-600">GuruKool</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Modern tools, personalized learning, and real-world skills for your
            homeschool journey
          </p>
        </motion.div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Large Feature Block */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="lg:col-span-2 lg:row-span-2"
          >
            <GlassCard
              blur="lg"
              className="group relative h-full overflow-hidden cursor-pointer"
            >
              <div className="relative h-full min-h-[400px]">
                <Image
                  src="/images/features/mentorship.jpg"
                  alt="One-on-one mentorship session"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <h3 className="text-3xl font-bold text-white mb-3">
                    Personalized Mentorship
                  </h3>
                  <p className="text-gray-200 text-lg">
                    Connect with experienced educators who tailor lessons to
                    your child's unique learning style and pace.
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Medium Feature Block */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <GlassCard
              blur="lg"
              className="group relative h-full overflow-hidden cursor-pointer"
            >
              <div className="relative h-full min-h-[250px]">
                <Image
                  src="/images/features/tablet-learning.jpg"
                  alt="Children learning with tablets outdoors"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-teal-900/90 via-teal-900/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="text-4xl mb-3">📱</div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Tech-Enabled Learning
                  </h3>
                  <p className="text-gray-200">
                    Modern tools that make learning fun and engaging
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Small Feature Block - Gamification */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <GlassCard
              blur="lg"
              className="group relative h-full overflow-hidden cursor-pointer bg-gradient-to-br from-orange-500 to-pink-500"
            >
              <div className="relative h-full min-h-[200px] p-6 flex flex-col justify-center items-center text-center">
                <motion.div
                  className="text-6xl mb-4"
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🏆
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Gamified Progress
                </h3>
                <p className="text-white/90">
                  Earn badges, track achievements, celebrate milestones
                </p>
              </div>
            </GlassCard>
          </motion.div>

          {/* Medium Feature Block - Collaborative */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <GlassCard
              blur="lg"
              className="group relative h-full overflow-hidden cursor-pointer"
            >
              <div className="relative h-full min-h-[250px]">
                <Image
                  src="/images/features/collaborative-space.jpg"
                  alt="Modern collaborative learning space"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-blue-900/50 to-transparent" />
                <div className="absolute inset-0 p-8 flex flex-col justify-center">
                  <div className="text-5xl mb-4">🤝</div>
                  <h3 className="text-3xl font-bold text-white mb-3">
                    Collaborative Learning
                  </h3>
                  <p className="text-gray-200 text-lg max-w-xl">
                    Join group sessions, work on projects together, and build
                    social skills in a supportive environment
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Small Feature Block - Real World Skills */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <GlassCard
              blur="lg"
              className="group relative h-full overflow-hidden cursor-pointer bg-gradient-to-br from-emerald-500 to-teal-500"
            >
              <div className="relative h-full min-h-[200px] p-6 flex flex-col justify-center items-center text-center">
                <motion.div
                  className="text-6xl mb-4"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🌱
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Real-World Skills
                </h3>
                <p className="text-white/90">
                  Practical knowledge that prepares kids for life
                </p>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-teal-600 to-orange-500 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {[
              { number: '10K+', label: 'Happy Students' },
              { number: '500+', label: 'Expert Mentors' },
              { number: '95%', label: 'Parent Satisfaction' },
              { number: '24/7', label: 'Support Available' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="text-5xl font-bold mb-2">{stat.number}</div>
                <div className="text-white/90">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            What Parents Say
          </h2>
          <p className="text-xl text-gray-600">
            Real stories from real homeschool families
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: 'Sarah Johnson',
              role: 'Parent of 2',
              avatar: '👩',
              color: 'from-teal-500 to-cyan-500',
              text: 'GuruKool transformed our homeschool experience. My kids are more engaged than ever!',
            },
            {
              name: 'Michael Chen',
              role: 'Parent of 3',
              avatar: '👨',
              color: 'from-orange-500 to-red-500',
              text: "The mentors are incredible. They truly understand each child's unique needs.",
            },
            {
              name: 'Emily Rodriguez',
              role: 'Parent of 1',
              avatar: '👩',
              color: 'from-purple-500 to-pink-500',
              text: 'Best decision we made for our homeschool. The progress tracking is amazing!',
            },
          ].map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <GlassCard blur="md" className="p-8 h-full">
                <div className="flex items-center mb-6">
                  <div
                    className={`w-16 h-16 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-3xl ring-4 ring-white shadow-lg`}
                  >
                    {testimonial.avatar}
                  </div>
                  <div className="ml-4">
                    <div className="font-bold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{testimonial.text}"</p>
                <div className="mt-4 flex text-yellow-400">
                  {'★★★★★'.split('').map((star, i) => (
                    <span key={i}>{star}</span>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-orange-500 opacity-10" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Ready to Transform Your Homeschool?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of families who've discovered the joy of modern,
              personalized learning
            </p>
            <Link href="/signup">
              <LiquidButton variant="primary" className="text-lg px-10 py-5">
                Start Your Free Trial Today
              </LiquidButton>
            </Link>
            <p className="text-sm text-gray-500 mt-4">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
