'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface AmazonBackgroundProps {
  children: React.ReactNode;
  variant?: 'hero' | 'dashboard' | 'card' | 'minimal';
  className?: string;
}

export function AmazonBackground({ 
  children, 
  variant = 'hero', 
  className = '' 
}: AmazonBackgroundProps) {
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
        return 'bg-amazon-white bg-amazon-gradient min-h-screen';
      case 'dashboard':
        return 'bg-amazon-white bg-amazon-hero min-h-screen';
      case 'card':
        return 'bg-amazon-card rounded-lg shadow-lg';
      case 'minimal':
        return 'bg-amazon-light-gray';
      default:
        return 'bg-amazon-white';
    }
  };

  return (
    <div className={`relative overflow-hidden ${getBackgroundVariant()} ${className}`}>
      {/* Professional Background Images */}
      <div className="absolute inset-0">
        {/* Hero Background - Modern office/workspace */}
        {variant === 'hero' && (
          <div className="absolute inset-0">
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80')`
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-amazon-white/90 via-amazon-white/95 to-amazon-white" />
          </div>
        )}
        
        {/* Dashboard Background - Professional workspace */}
        {variant === 'dashboard' && (
          <div className="absolute inset-0">
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-amazon-white/95 via-amazon-light-gray/90 to-amazon-white/95" />
          </div>
        )}
        
        {/* Card Background - Subtle business pattern */}
        {variant === 'card' && (
          <div className="absolute inset-0">
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-8"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-amazon-white/98 via-amazon-light-gray/95 to-amazon-white/98" />
          </div>
        )}
        
        {/* Minimal Background - Clean professional gradient */}
        {variant === 'minimal' && (
          <div className="absolute inset-0 bg-gradient-to-br from-amazon-white via-amazon-light-gray to-amazon-white" />
        )}
      </div>
      
      {/* Amazon-style subtle patterns */}
      <div className="absolute inset-0">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-amazon-orange rounded-full opacity-10"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -10, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      {/* Amazon-style subtle overlay */}
      <motion.div
        className="absolute inset-0 bg-amazon-hero"
        animate={{
          background: [
            'linear-gradient(180deg, rgba(255,153,0,0.1) 0%, rgba(255,153,0,0.05) 100%)',
            'linear-gradient(180deg, rgba(255,153,0,0.05) 0%, rgba(255,153,0,0.1) 100%)',
            'linear-gradient(180deg, rgba(255,153,0,0.1) 0%, rgba(255,153,0,0.05) 100%)',
          ],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Amazon-style subtle spotlight */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,153,0,0.05), transparent 40%)`,
        }}
        transition={{ type: 'tween', ease: 'easeOut', duration: 0.8 }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

// Amazon-style card component
export function AmazonCard({ 
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
      className={`bg-amazon-card rounded-lg shadow-md border border-amazon-medium-gray ${className}`}
      whileHover={hover ? { 
        scale: 1.02, 
        boxShadow: '0 8px 25px rgba(255,153,0,0.15)',
        borderColor: '#ff9900'
      } : {}}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

// Amazon-style button component
export function AmazonButton({ 
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
        return 'bg-amazon-orange hover:bg-amazon-orange-dark text-white';
      case 'secondary':
        return 'bg-amazon-light-gray hover:bg-amazon-medium-gray text-amazon-blue';
      case 'outline':
        return 'border border-amazon-orange text-amazon-orange hover:bg-amazon-orange hover:text-white';
      default:
        return 'bg-amazon-orange hover:bg-amazon-orange-dark text-white';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'md':
        return 'px-4 py-2 text-base';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  return (
    <motion.button
      className={`rounded-md font-medium transition-all duration-200 ${getVariantStyles()} ${getSizeStyles()} ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
