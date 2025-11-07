'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface NetflixBackgroundProps {
  children: React.ReactNode;
  variant?: 'hero' | 'dashboard' | 'card' | 'minimal';
  className?: string;
}

export function NetflixBackground({ 
  children, 
  variant = 'hero', 
  className = '' 
}: NetflixBackgroundProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [backgroundSettings, setBackgroundSettings] = useState({
    opacity: 0.2,
    blur: 0,
    brightness: 0.5,
    contrast: 1.2,
    saturation: 0.8,
    hue: 0,
    enableParallax: true,
    enableHover: true,
    enableAnimations: true
  });
  const [selectedImage, setSelectedImage] = useState(null);

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
        return 'bg-netflix-black bg-netflix-gradient min-h-screen';
      case 'dashboard':
        return 'bg-netflix-black bg-netflix-hero min-h-screen';
      case 'card':
        return 'bg-netflix-card rounded-lg shadow-2xl';
      case 'minimal':
        return 'bg-netflix-dark-gray';
      default:
        return 'bg-netflix-black';
    }
  };

  return (
    <div className={`relative overflow-hidden ${getBackgroundVariant()} ${className}`}>
      {/* Educational Background with GuruKool Mascot */}
      <div className="absolute inset-0">
        {/* Hero Background - Educational theme with Guru the Owl */}
        {variant === 'hero' && (
          <div className="absolute inset-0">
            {/* Main background image - Bright Study Environment */}
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-95"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2022&q=80')`
              }}
            />
            {/* Study Group SVG overlay - Natural Learning Environment */}
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1080'%3E%3Cdefs%3E%3ClinearGradient id='bg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23059669;stop-opacity:0.3' /%3E%3Cstop offset='100%25' style='stop-color:%230f766e;stop-opacity:0.4' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1920' height='1080' fill='url(%23bg)'/%3E%3C!-- Study Group --%3E%3Cg transform='translate(1400 200)'%3E%3C!-- Girl Student --%3E%3Cg%3E%3C!-- Body --%3E%3Cellipse cx='0' cy='40' rx='25' ry='35' fill='%23fbbf24' opacity='0.8'/%3E%3C!-- Head --%3E%3Ccircle cx='0' cy='-10' r='20' fill='%23fde68a' opacity='0.9'/%3E%3C!-- Hair --%3E%3Cpath d='M-15,-25 Q0,-35 15,-25 Q10,-15 0,-10 Q-10,-15 -15,-25' fill='%23f59e0b' opacity='0.9'/%3E%3C!-- Eyes --%3E%3Ccircle cx='-8' cy='-12' r='2' fill='%231e293b'/%3E%3Ccircle cx='8' cy='-12' r='2' fill='%231e293b'/%3E%3C!-- Smile --%3E%3Cpath d='M-6,-2 Q0,2 6,-2' fill='none' stroke='%231e293b' stroke-width='1'/%3E%3C!-- Book --%3E%3Crect x='-15' y='25' width='30' height='20' rx='2' fill='%23ef4444' opacity='0.8'/%3E%3Cline x1='-10' y1='30' x2='10' y2='30' stroke='%23f1f5f9' stroke-width='0.5'/%3E%3Cline x1='-10' y1='35' x2='10' y2='35' stroke='%23f1f5f9' stroke-width='0.5'/%3E%3C/g%3E%3C!-- Boy Student --%3E%3Cg transform='translate(60 0)'%3E%3C!-- Body --%3E%3Cellipse cx='0' cy='40' rx='25' ry='35' fill='%2306b6d4' opacity='0.8'/%3E%3C!-- Head --%3E%3Ccircle cx='0' cy='-10' r='20' fill='%23fde68a' opacity='0.9'/%3E%3C!-- Hair --%3E%3Cpath d='M-15,-25 Q0,-35 15,-25 Q10,-15 0,-10 Q-10,-15 -15,-25' fill='%231e40af' opacity='0.9'/%3E%3C!-- Eyes --%3E%3Ccircle cx='-8' cy='-12' r='2' fill='%231e293b'/%3E%3Ccircle cx='8' cy='-12' r='2' fill='%231e293b'/%3E%3C!-- Smile --%3E%3Cpath d='M-6,-2 Q0,2 6,-2' fill='none' stroke='%231e293b' stroke-width='1'/%3E%3C!-- Book --%3E%3Crect x='-15' y='25' width='30' height='20' rx='2' fill='%2316a34a' opacity='0.8'/%3E%3Cline x1='-10' y1='30' x2='10' y2='30' stroke='%23f1f5f9' stroke-width='0.5'/%3E%3Cline x1='-10' y1='35' x2='10' y2='35' stroke='%23f1f5f9' stroke-width='0.5'/%3E%3C/g%3E%3C/g%3E%3C!-- Natural Study Environment --%3E%3C!-- Books Stack --%3E%3Cg transform='translate(300 800)'%3E%3Crect x='0' y='40' width='100' height='20' rx='2' fill='%23dc2626' opacity='0.6'/%3E%3Crect x='5' y='20' width='110' height='20' rx='2' fill='%2316a34a' opacity='0.6'/%3E%3Crect x='10' y='0' width='90' height='20' rx='2' fill='%232563eb' opacity='0.6'/%3E%3C/g%3E%3C!-- Study Table --%3E%3Cg transform='translate(200 700)'%3E%3Crect x='0' y='0' width='200' height='8' rx='2' fill='%238b5a2b' opacity='0.7'/%3E%3Crect x='10' y='8' width='8' height='60' fill='%236b7280' opacity='0.6'/%3E%3Crect x='182' y='8' width='8' height='60' fill='%236b7280' opacity='0.6'/%3E%3C/g%3E%3C!-- Plants --%3E%3Cg transform='translate(100 600)'%3E%3Ccircle cx='0' cy='0' r='15' fill='%2316a34a' opacity='0.5'/%3E%3Crect x='-2' y='0' width='4' height='40' fill='%238b5a2b' opacity='0.6'/%3E%3C/g%3E%3Cg transform='translate(1800 600)'%3E%3Ccircle cx='0' cy='0' r='15' fill='%2316a34a' opacity='0.5'/%3E%3Crect x='-2' y='0' width='4' height='40' fill='%238b5a2b' opacity='0.6'/%3E%3C/g%3E%3C!-- Laptop --%3E%3Cg transform='translate(400 650)'%3E%3Crect x='0' y='0' width='80' height='50' rx='3' fill='%23374151' opacity='0.7'/%3E%3Crect x='5' y='5' width='70' height='35' rx='2' fill='%2306b6d4' opacity='0.8'/%3E%3Crect x='35' y='50' width='10' height='5' fill='%236b7280' opacity='0.6'/%3E%3C/g%3E%3C!-- Natural Elements --%3E%3Cg opacity='0.4'%3E%3Ccircle cx='500' cy='200' r='8' fill='%23fbbf24'/%3E%3Ccircle cx='800' cy='300' r='6' fill='%2306b6d4'/%3E%3Ccircle cx='1200' cy='150' r='7' fill='%23a78bfa'/%3E%3Ccircle cx='1600' cy='400' r='5' fill='%2316a34a'/%3E%3C/g%3E%3C/svg%3E")`
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/30" />
          </div>
        )}
        
        {/* Dashboard Background - Modern office/tech */}
        {variant === 'dashboard' && (
          <div className="absolute inset-0">
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80')`
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-netflix-black/70 via-netflix-black/50 to-netflix-black/80" />
          </div>
        )}
        
        {/* Card Background - Subtle tech pattern */}
        {variant === 'card' && (
          <div className="absolute inset-0">
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-netflix-black/80 via-netflix-black/60 to-netflix-black/90" />
          </div>
        )}
        
        {/* Minimal Background - Clean gradient */}
        {variant === 'minimal' && (
          <div className="absolute inset-0 bg-gradient-to-br from-netflix-black via-netflix-dark-gray to-netflix-black" />
        )}
      </div>

      {/* Subtle animated particles - reduced count */}
      <div className="absolute inset-0">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-10"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -15, 0],
              opacity: [0.05, 0.15, 0.05],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Subtle gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.85) 100%)',
        }}
      />

      {/* Very subtle interactive spotlight effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(99,102,241,0.08), transparent 60%)`,
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

// Netflix-style card component
export function NetflixCard({ 
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
      className={`bg-netflix-card rounded-lg shadow-lg border border-netflix-medium-gray ${className}`}
      whileHover={hover ? { 
        scale: 1.02, 
        boxShadow: '0 8px 32px rgba(229,9,20,0.3)',
        borderColor: '#e50914'
      } : {}}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

// Netflix-style button component
export function NetflixButton({ 
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
        return 'bg-netflix-red hover:bg-netflix-red-dark text-white';
      case 'secondary':
        return 'bg-netflix-dark-gray hover:bg-netflix-medium-gray text-white';
      case 'outline':
        return 'border border-netflix-red text-netflix-red hover:bg-netflix-red hover:text-white';
      default:
        return 'bg-netflix-red hover:bg-netflix-red-dark text-white';
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
      className={`rounded-md font-semibold transition-all duration-200 ${getVariantStyles()} ${getSizeStyles()} ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
