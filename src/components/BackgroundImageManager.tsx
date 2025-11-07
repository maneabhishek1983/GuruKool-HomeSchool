'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BackgroundImageManagerProps {
  theme: 'netflix' | 'amazon' | 'kids';
  variant: 'hero' | 'dashboard' | 'card' | 'minimal';
  className?: string;
  children: React.ReactNode;
}

interface BackgroundImage {
  id: string;
  url: string;
  alt: string;
  category: string;
  opacity: number;
  gradient: string;
}

const backgroundImages: Record<string, BackgroundImage[]> = {
  netflix: [
    {
      id: 'netflix-hero-1',
      url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=2025&q=80',
      alt: 'Cinematic cityscape at night',
      category: 'hero',
      opacity: 0.25,
      gradient: 'from-netflix-black/60 via-netflix-black/40 to-netflix-black/80'
    },
    {
      id: 'netflix-dashboard-1',
      url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80',
      alt: 'Modern tech office',
      category: 'dashboard',
      opacity: 0.20,
      gradient: 'from-netflix-black/70 via-netflix-black/50 to-netflix-black/80'
    },
    {
      id: 'netflix-card-1',
      url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      alt: 'Abstract tech pattern',
      category: 'card',
      opacity: 0.15,
      gradient: 'from-netflix-black/80 via-netflix-black/60 to-netflix-black/90'
    }
  ],
  amazon: [
    {
      id: 'amazon-hero-1',
      url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80',
      alt: 'Professional office workspace',
      category: 'hero',
      opacity: 0.15,
      gradient: 'from-amazon-white/90 via-amazon-white/95 to-amazon-white'
    },
    {
      id: 'amazon-dashboard-1',
      url: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      alt: 'Modern business environment',
      category: 'dashboard',
      opacity: 0.10,
      gradient: 'from-amazon-white/95 via-amazon-light-gray/90 to-amazon-white/95'
    },
    {
      id: 'amazon-card-1',
      url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      alt: 'Subtle business pattern',
      category: 'card',
      opacity: 0.08,
      gradient: 'from-amazon-white/98 via-amazon-light-gray/95 to-amazon-white/98'
    }
  ],
  kids: [
    {
      id: 'kids-hero-1',
      url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2022&q=80',
      alt: 'Colorful learning environment',
      category: 'hero',
      opacity: 0.30,
      gradient: 'from-kids-purple/80 via-kids-purple/60 to-kids-purple/90'
    },
    {
      id: 'kids-dashboard-1',
      url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      alt: 'Fun classroom with toys',
      category: 'dashboard',
      opacity: 0.25,
      gradient: 'from-kids-purple/70 via-kids-pink/50 to-kids-turquoise/70'
    },
    {
      id: 'kids-card-1',
      url: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      alt: 'Playful educational toys',
      category: 'card',
      opacity: 0.20,
      gradient: 'from-kids-purple/80 via-kids-pink/60 to-kids-turquoise/80'
    }
  ]
};

export function BackgroundImageManager({ 
  theme, 
  variant, 
  className = '', 
  children 
}: BackgroundImageManagerProps) {
  const [currentImage, setCurrentImage] = useState<BackgroundImage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const themeImages = backgroundImages[theme] || [];
    const variantImage = themeImages.find(img => img.category === variant);
    
    if (variantImage) {
      setCurrentImage(variantImage);
      setIsLoading(true);
      setImageError(false);
    }
  }, [theme, variant]);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  const getFallbackBackground = () => {
    switch (theme) {
      case 'netflix':
        return 'bg-gradient-to-br from-netflix-black via-netflix-dark-gray to-netflix-black';
      case 'amazon':
        return 'bg-gradient-to-br from-amazon-white via-amazon-light-gray to-amazon-white';
      case 'kids':
        return 'bg-gradient-to-br from-kids-purple via-kids-pink to-kids-turquoise';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background Image Layer */}
      <div className="absolute inset-0">
        {currentImage && !imageError ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImage.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: currentImage.opacity }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url('${currentImage.url}')`,
              }}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </AnimatePresence>
        ) : (
          <div className={`absolute inset-0 ${getFallbackBackground()}`} />
        )}
        
        {/* Gradient Overlay */}
        {currentImage && !imageError && (
          <div className={`absolute inset-0 bg-gradient-to-b ${currentImage.gradient}`} />
        )}
        
        {/* Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-gray-200 flex items-center justify-center"
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600" />
          </motion.div>
        )}
        
        {/* Error State */}
        {imageError && (
          <div className={`absolute inset-0 ${getFallbackBackground()}`} />
        )}
      </div>

      {/* Content Layer */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

// Background Image Features
export const backgroundImageFeatures = {
  // Image Categories
  categories: {
    netflix: ['cinematic', 'dark', 'tech', 'entertainment'],
    amazon: ['professional', 'business', 'office', 'clean'],
    kids: ['colorful', 'playful', 'educational', 'fun']
  },
  
  // Image Properties
  properties: {
    opacity: {
      netflix: { min: 0.1, max: 0.3, default: 0.2 },
      amazon: { min: 0.05, max: 0.2, default: 0.1 },
      kids: { min: 0.2, max: 0.4, default: 0.25 }
    },
    blur: {
      netflix: { min: 0, max: 2, default: 0 },
      amazon: { min: 0, max: 1, default: 0 },
      kids: { min: 0, max: 1, default: 0 }
    },
    brightness: {
      netflix: { min: 0.3, max: 0.8, default: 0.5 },
      amazon: { min: 0.8, max: 1.2, default: 1.0 },
      kids: { min: 0.7, max: 1.1, default: 0.9 }
    }
  },
  
  // Animation Settings
  animations: {
    transition: {
      duration: 0.5,
      ease: 'easeInOut'
    },
    hover: {
      scale: 1.02,
      duration: 0.3
    },
    parallax: {
      enabled: true,
      intensity: 0.5
    }
  },
  
  // Performance Settings
  performance: {
    lazyLoading: true,
    preload: true,
    compression: 'auto',
    format: 'webp'
  }
};

// Utility Functions
export const backgroundImageUtils = {
  // Get random background image
  getRandomImage: (theme: string, variant: string) => {
    const themeImages = backgroundImages[theme] || [];
    const variantImages = themeImages.filter(img => img.category === variant);
    return variantImages[Math.floor(Math.random() * variantImages.length)];
  },
  
  // Preload background images
  preloadImages: (theme: string) => {
    const themeImages = backgroundImages[theme] || [];
    themeImages.forEach(img => {
      const image = new Image();
      image.src = img.url;
    });
  },
  
  // Get image metadata
  getImageMetadata: (imageId: string) => {
    for (const theme in backgroundImages) {
      const image = backgroundImages[theme].find(img => img.id === imageId);
      if (image) return image;
    }
    return null;
  }
};
