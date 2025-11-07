'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BackgroundImageGalleryProps {
  theme: 'netflix' | 'amazon' | 'kids';
  onImageSelect: (image: BackgroundImage) => void;
  className?: string;
}

interface BackgroundImage {
  id: string;
  url: string;
  alt: string;
  category: string;
  tags: string[];
  preview: string;
}

const imageGallery: Record<string, BackgroundImage[]> = {
  netflix: [
    {
      id: 'netflix-1',
      url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=2025&q=80',
      alt: 'Cinematic cityscape at night',
      category: 'hero',
      tags: ['cityscape', 'night', 'cinematic', 'urban'],
      preview: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'netflix-2',
      url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80',
      alt: 'Modern tech office',
      category: 'dashboard',
      tags: ['office', 'tech', 'modern', 'professional'],
      preview: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'netflix-3',
      url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      alt: 'Abstract tech pattern',
      category: 'card',
      tags: ['abstract', 'tech', 'pattern', 'geometric'],
      preview: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'netflix-4',
      url: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      alt: 'Dark tech environment',
      category: 'hero',
      tags: ['dark', 'tech', 'environment', 'moody'],
      preview: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    }
  ],
  amazon: [
    {
      id: 'amazon-1',
      url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80',
      alt: 'Professional office workspace',
      category: 'hero',
      tags: ['office', 'workspace', 'professional', 'clean'],
      preview: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'amazon-2',
      url: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      alt: 'Modern business environment',
      category: 'dashboard',
      tags: ['business', 'modern', 'corporate', 'professional'],
      preview: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'amazon-3',
      url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      alt: 'Subtle business pattern',
      category: 'card',
      tags: ['pattern', 'business', 'subtle', 'minimal'],
      preview: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'amazon-4',
      url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80',
      alt: 'Clean workspace',
      category: 'hero',
      tags: ['clean', 'workspace', 'minimal', 'organized'],
      preview: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    }
  ],
  kids: [
    {
      id: 'kids-1',
      url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2022&q=80',
      alt: 'Colorful learning environment',
      category: 'hero',
      tags: ['colorful', 'learning', 'education', 'bright'],
      preview: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'kids-2',
      url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      alt: 'Fun classroom with toys',
      category: 'dashboard',
      tags: ['classroom', 'toys', 'fun', 'playful'],
      preview: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'kids-3',
      url: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      alt: 'Playful educational toys',
      category: 'card',
      tags: ['toys', 'educational', 'playful', 'colorful'],
      preview: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'kids-4',
      url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2022&q=80',
      alt: 'Bright learning space',
      category: 'hero',
      tags: ['bright', 'learning', 'space', 'vibrant'],
      preview: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    }
  ]
};

export function BackgroundImageGallery({ 
  theme, 
  onImageSelect, 
  className = '' 
}: BackgroundImageGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const themeImages = imageGallery[theme] || [];
  const categories = ['all', ...Array.from(new Set(themeImages.map(img => img.category)))];
  
  const filteredImages = selectedCategory === 'all' 
    ? themeImages 
    : themeImages.filter(img => img.category === selectedCategory);

  const handleImageSelect = (image: BackgroundImage) => {
    setSelectedImage(image.id);
    onImageSelect(image);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'netflix': return '🎬';
      case 'amazon': return '🛒';
      case 'kids': return '🎈';
      default: return '🖼️';
    }
  };

  const getThemeName = () => {
    switch (theme) {
      case 'netflix': return 'Netflix';
      case 'amazon': return 'Amazon';
      case 'kids': return 'Kids';
      default: return 'Theme';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Gallery Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 z-50 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="flex items-center space-x-2">
          <span className="text-xl">{getThemeIcon()}</span>
          <span className="text-sm font-medium">{getThemeName()} Gallery</span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </div>
      </motion.button>

      {/* Gallery Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-20 left-4 z-40 bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl max-w-md w-full max-h-96 overflow-y-auto"
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">
                  Background Gallery
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>

              {/* Image Grid */}
              <div className="grid grid-cols-2 gap-3">
                {filteredImages.map(image => (
                  <motion.div
                    key={image.id}
                    onClick={() => handleImageSelect(image)}
                    className={`relative cursor-pointer rounded-lg overflow-hidden group ${
                      selectedImage === image.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="aspect-video bg-gray-200">
                      <img
                        src={image.preview}
                        alt={image.alt}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="text-sm font-medium">{image.alt}</div>
                        <div className="text-xs mt-1">
                          {image.tags.slice(0, 2).join(', ')}
                        </div>
                      </div>
                    </div>
                    
                    {/* Selected Indicator */}
                    {selectedImage === image.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Image Info */}
              {selectedImage && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    <div className="font-medium">
                      {themeImages.find(img => img.id === selectedImage)?.alt}
                    </div>
                    <div className="mt-1">
                      Tags: {themeImages.find(img => img.id === selectedImage)?.tags.join(', ')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Background Image Features
export const backgroundImageFeatures = {
  // Image Categories
  categories: {
    netflix: ['cinematic', 'dark', 'tech', 'entertainment', 'urban', 'moody'],
    amazon: ['professional', 'business', 'office', 'clean', 'corporate', 'minimal'],
    kids: ['colorful', 'playful', 'educational', 'fun', 'bright', 'vibrant']
  },
  
  // Image Properties
  properties: {
    resolution: ['4K', '2K', 'HD', 'SD'],
    format: ['JPEG', 'PNG', 'WebP', 'AVIF'],
    aspectRatio: ['16:9', '4:3', '1:1', '21:9']
  },
  
  // Filter Options
  filters: {
    color: ['dark', 'light', 'colorful', 'monochrome'],
    mood: ['professional', 'playful', 'dramatic', 'calm'],
    style: ['modern', 'classic', 'abstract', 'realistic']
  }
};
