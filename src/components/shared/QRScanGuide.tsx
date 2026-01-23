'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import LiquidButton from '@/components/ui/LiquidButton';

interface QRScanGuideProps {
  type?: 'check-in' | 'check-out';
  studentName?: string;
  qrCodeUrl?: string;
  onScanComplete?: () => void;
  onCancel?: () => void;
  className?: string;
}

const steps = [
  {
    number: 1,
    icon: '📱',
    title: 'Open Camera',
    description: 'Open your phone camera or QR scanner app',
  },
  {
    number: 2,
    icon: '🎯',
    title: 'Point at QR Code',
    description: 'Align the QR code within the camera frame',
  },
  {
    number: 3,
    icon: '✨',
    title: 'Auto-Scan',
    description: 'The code will scan automatically',
  },
  {
    number: 4,
    icon: '✅',
    title: 'Confirm',
    description: 'Verify your check-in/out details',
  },
];

export default function QRScanGuide({
  type = 'check-in',
  studentName,
  qrCodeUrl,
  onScanComplete,
  onCancel,
  className = '',
}: QRScanGuideProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative overflow-hidden rounded-3xl ${className}`}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/optimized/sessions/qr-scan-guide.webp"
          alt="QR Code Scanning"
          fill
          className="object-cover"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/90 via-blue-900/85 to-indigo-900/90" />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white/40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -50, 0],
              x: [0, Math.random() * 30 - 15, 0],
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 5 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="inline-block mb-4"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-cyan-500/50">
              <span className="text-4xl">
                {type === 'check-in' ? '📥' : '📤'}
              </span>
            </div>
          </motion.div>
          
          <h3 className="text-2xl font-bold text-white mb-2">
            {type === 'check-in' ? 'Check-In' : 'Check-Out'} with QR Code
          </h3>
          {studentName && (
            <p className="text-cyan-100">
              Session with <span className="font-semibold">{studentName}</span>
            </p>
          )}
        </div>

        {/* QR Code Display (if provided) */}
        {qrCodeUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="backdrop-blur-xl bg-white/95 rounded-3xl p-6 mb-6 text-center"
          >
            <div className="relative inline-block">
              <Image
                src={qrCodeUrl}
                alt="QR Code"
                width={200}
                height={200}
                className="rounded-2xl"
              />
              {/* Scanning Animation */}
              <motion.div
                className="absolute inset-0 border-4 border-cyan-500 rounded-2xl"
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-3">
              Scan this code to {type === 'check-in' ? 'start' : 'end'} your session
            </p>
          </motion.div>
        )}

        {/* Step-by-Step Guide */}
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-5 border border-white/20 mb-6">
          <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <span>📖</span>
            <span>How to Scan</span>
          </h4>
          
          <div className="space-y-3">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-start gap-3"
              >
                {/* Step Number */}
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  {step.number}
                </div>
                
                {/* Step Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{step.icon}</span>
                    <span className="text-white font-semibold text-sm">
                      {step.title}
                    </span>
                  </div>
                  <p className="text-xs text-cyan-100">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="backdrop-blur-xl bg-cyan-500/20 rounded-2xl p-4 border border-cyan-400/30 mb-6"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h5 className="text-white font-semibold text-sm mb-1">Pro Tip</h5>
              <p className="text-xs text-cyan-100">
                Make sure you're at the student's home location for biometric verification. 
                The QR code works best in good lighting conditions.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {onScanComplete && (
            <LiquidButton
              variant="primary"
              size="large"
              onClick={onScanComplete}
              className="flex-1 bg-white text-cyan-900 hover:bg-cyan-50"
            >
              {type === 'check-in' ? '✓ Start Session' : '✓ End Session'}
            </LiquidButton>
          )}
          {onCancel && (
            <LiquidButton
              variant="outline"
              size="large"
              onClick={onCancel}
              className="border-white text-white hover:bg-white/10"
            >
              Cancel
            </LiquidButton>
          )}
        </div>

        {/* Security Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-4 text-xs text-cyan-100 text-center flex items-center justify-center gap-2"
        >
          <span>🔒</span>
          <span>Secured with biometric and location verification</span>
        </motion.div>
      </div>

      {/* Decorative Gradient Orbs */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-400 rounded-full blur-3xl opacity-20" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-400 rounded-full blur-3xl opacity-20" />
      <div className="absolute top-1/2 right-1/4 w-60 h-60 bg-indigo-400 rounded-full blur-3xl opacity-10" />
    </motion.div>
  );
}
