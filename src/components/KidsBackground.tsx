'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface KidsBackgroundProps {
  children: React.ReactNode;
  variant?: 'hero' | 'dashboard' | 'card' | 'minimal';
  className?: string;
}

export function KidsBackground({ 
  children, 
  variant = 'hero', 
  className = '' 
}: KidsBackgroundProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const getBackgroundVariant = () => {
    switch (variant) {
      case 'hero':
        return 'bg-kids-purple bg-kids-gradient min-h-screen';
      case 'dashboard':
        return 'bg-kids-purple bg-kids-hero min-h-screen';
      case 'card':
        return 'bg-kids-card rounded-2xl shadow-lg';
      case 'minimal':
        return 'bg-kids-white';
      default:
        return 'bg-kids-purple';
    }
  };

  return (
    <div className={`relative overflow-hidden ${getBackgroundVariant()} ${className}`}>
      {/* Playful Background Images */}
      <div className="absolute inset-0">
        {/* Hero Background - Colorful learning environment */}
        {variant === 'hero' && (
          <div className="absolute inset-0">
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2022&q=80')`
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-kids-purple/80 via-kids-purple/60 to-kids-purple/90" />
          </div>
        )}
        
        {/* Dashboard Background - Fun classroom/playroom */}
        {variant === 'dashboard' && (
          <div className="absolute inset-0">
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-kids-purple/70 via-kids-pink/50 to-kids-turquoise/70" />
          </div>
        )}
        
        {/* Card Background - Playful pattern */}
        {variant === 'card' && (
          <div className="absolute inset-0">
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-kids-purple/80 via-kids-pink/60 to-kids-turquoise/80" />
          </div>
        )}
        
        {/* Minimal Background - Colorful gradient */}
        {variant === 'minimal' && (
          <div className="absolute inset-0 bg-gradient-to-br from-kids-purple via-kids-pink to-kids-turquoise" />
        )}
      </div>
      
      {/* Kids-style fun shapes */}
      <div className="absolute inset-0">
        {Array.from({ length: 25 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 360, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            {i % 4 === 0 && (
              <div className="w-4 h-4 bg-kids-pink rounded-full opacity-30" />
            )}
            {i % 4 === 1 && (
              <div className="w-3 h-3 bg-kids-turquoise rounded-full opacity-30" />
            )}
            {i % 4 === 2 && (
              <div className="w-6 h-6 bg-kids-pink rounded-full opacity-20" />
            )}
            {i % 4 === 3 && (
              <div className="w-5 h-5 bg-kids-turquoise rounded-full opacity-25" />
            )}
          </motion.div>
        ))}
      </div>

      {/* Kids-style colorful overlay */}
      <motion.div
        className="absolute inset-0 bg-kids-hero"
        animate={{
          background: [
            'linear-gradient(180deg, rgba(255,107,157,0.1) 0%, rgba(78,205,196,0.1) 100%)',
            'linear-gradient(180deg, rgba(78,205,196,0.1) 0%, rgba(255,107,157,0.1) 100%)',
            'linear-gradient(180deg, rgba(255,107,157,0.1) 0%, rgba(78,205,196,0.1) 100%)',
          ],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Kids-style rainbow spotlight */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(500px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,107,157,0.1), rgba(78,205,196,0.1), transparent 50%)`,
        }}
        transition={{ type: 'tween', ease: 'easeOut', duration: 0.6 }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

// Kids-style card component
export function KidsCard({ 
  children, 
  className = '',
  hover = true 
}: { 
  children: React.ReactNode; 
  className?: string;
  hover?: boolean;
}) {
  return (
    <motion.div
      className={`bg-kids-card rounded-2xl shadow-lg border-2 border-kids-border ${className}`}
      whileHover={hover ? { 
        scale: 1.05, 
        boxShadow: '0 10px 30px rgba(255,107,157,0.2)',
        borderColor: '#ff6b9d',
        rotate: [0, 2, -2, 0]
      } : {}}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

// Kids-style button component
export function KidsButton({ 
  children, 
  variant = 'primary',
  size = 'md',
  className = '',
  ...props 
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  [key: string]: any;
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-kids-pink hover:bg-kids-pink-light text-white';
      case 'secondary':
        return 'bg-kids-turquoise hover:bg-kids-turquoise-light text-white';
      case 'outline':
        return 'border-2 border-kids-pink text-kids-pink hover:bg-kids-pink hover:text-white';
      default:
        return 'bg-kids-pink hover:bg-kids-pink-light text-white';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-4 py-2 text-sm';
      case 'md':
        return 'px-6 py-3 text-base';
      case 'lg':
        return 'px-8 py-4 text-lg';
      default:
        return 'px-6 py-3 text-base';
    }
  };

  return (
    <motion.button
      className={`rounded-2xl font-bold transition-all duration-200 ${getVariantStyles()} ${getSizeStyles()} ${className}`}
      whileHover={{ scale: 1.1, rotate: [0, 5, -5, 0] }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
