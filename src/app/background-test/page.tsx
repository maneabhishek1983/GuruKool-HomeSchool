'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { NetflixBackground, NetflixButton, NetflixCard } from '@/components/NetflixBackground';
import { AmazonBackground, AmazonButton, AmazonCard } from '@/components/AmazonBackground';
import { KidsBackground, KidsButton, KidsCard } from '@/components/KidsBackground';

export default function BackgroundTestPage() {
  const [activeTheme, setActiveTheme] = useState<'netflix' | 'amazon' | 'kids'>('netflix');
  const [activeVariant, setActiveVariant] = useState<'hero' | 'dashboard' | 'card' | 'minimal'>('hero');

  const themes = [
    { id: 'netflix', name: 'Netflix', icon: '🎬', color: 'bg-netflix-red' },
    { id: 'amazon', name: 'Amazon', icon: '🛒', color: 'bg-amazon-orange' },
    { id: 'kids', name: 'Kids', icon: '🎈', color: 'bg-kids-pink' }
  ];

  const variants = [
    { id: 'hero', name: 'Hero', description: 'Full-screen cinematic backgrounds' },
    { id: 'dashboard', name: 'Dashboard', description: 'Professional workspace backgrounds' },
    { id: 'card', name: 'Card', description: 'Subtle card backgrounds' },
    { id: 'minimal', name: 'Minimal', description: 'Clean gradient backgrounds' }
  ];

  const getBackgroundComponent = () => {
    switch (activeTheme) {
      case 'netflix':
        return NetflixBackground;
      case 'amazon':
        return AmazonBackground;
      case 'kids':
        return KidsBackground;
      default:
        return NetflixBackground;
    }
  };

  const getButtonComponent = () => {
    switch (activeTheme) {
      case 'netflix':
        return NetflixButton;
      case 'amazon':
        return AmazonButton;
      case 'kids':
        return KidsButton;
      default:
        return NetflixButton;
    }
  };

  const getCardComponent = () => {
    switch (activeTheme) {
      case 'netflix':
        return NetflixCard;
      case 'amazon':
        return AmazonCard;
      case 'kids':
        return KidsCard;
      default:
        return NetflixCard;
    }
  };

  const BackgroundComponent = getBackgroundComponent();
  const ButtonComponent = getButtonComponent();
  const CardComponent = getCardComponent();

  return (
    <div className="min-h-screen">
      {/* Theme Selector */}
      <div className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
        <h3 className="text-lg font-bold mb-4">Theme Selector</h3>
        <div className="space-y-2">
          {themes.map(theme => (
            <button
              key={theme.id}
              onClick={() => setActiveTheme(theme.id as any)}
              className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-all ${
                activeTheme === theme.id
                  ? `${theme.color} text-white`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-xl">{theme.icon}</span>
              <span className="font-medium">{theme.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Variant Selector */}
      <div className="fixed top-4 right-4 z-50 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg max-w-xs">
        <h3 className="text-lg font-bold mb-4">Background Variant</h3>
        <div className="space-y-2">
          {variants.map(variant => (
            <button
              key={variant.id}
              onClick={() => setActiveVariant(variant.id as any)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                activeVariant === variant.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="font-medium">{variant.name}</div>
              <div className="text-sm opacity-75">{variant.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Background Test Area */}
      <BackgroundComponent variant={activeVariant}>
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold mb-4">
              Background Image Testing
            </h1>
            <p className="text-xl">
              Testing {activeTheme} theme with {activeVariant} variant
            </p>
          </motion.div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <CardComponent className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🖼️</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Background Images</h3>
                <p className="text-sm opacity-75">
                  High-quality background images for each theme and variant
                </p>
              </div>
            </CardComponent>

            <CardComponent className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚙️</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Customization</h3>
                <p className="text-sm opacity-75">
                  Adjust opacity, blur, brightness, and other properties
                </p>
              </div>
            </CardComponent>

            <CardComponent className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎨</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Theme Gallery</h3>
                <p className="text-sm opacity-75">
                  Choose from curated background images for each theme
                </p>
              </div>
            </CardComponent>
          </div>

          {/* Interactive Elements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CardComponent className="p-6">
              <h3 className="text-xl font-bold mb-4">Background Features</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Opacity Control</span>
                  <span className="text-sm opacity-75">0-100%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Blur Effect</span>
                  <span className="text-sm opacity-75">0-5px</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Brightness</span>
                  <span className="text-sm opacity-75">10-200%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Contrast</span>
                  <span className="text-sm opacity-75">50-200%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Saturation</span>
                  <span className="text-sm opacity-75">0-200%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Hue Rotation</span>
                  <span className="text-sm opacity-75">-180° to 180°</span>
                </div>
              </div>
            </CardComponent>

            <CardComponent className="p-6">
              <h3 className="text-xl font-bold mb-4">Animation Features</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Parallax Effect</span>
                  <span className="text-sm opacity-75">Mouse tracking</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Hover Effects</span>
                  <span className="text-sm opacity-75">Scale & glow</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Smooth Transitions</span>
                  <span className="text-sm opacity-75">0.5s duration</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Loading States</span>
                  <span className="text-sm opacity-75">Skeleton loading</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Error Handling</span>
                  <span className="text-sm opacity-75">Fallback images</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Performance</span>
                  <span className="text-sm opacity-75">Optimized loading</span>
                </div>
              </div>
            </CardComponent>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center mt-8">
            <ButtonComponent size="lg">
              Test Primary Button
            </ButtonComponent>
            <ButtonComponent size="lg" variant="secondary">
              Test Secondary Button
            </ButtonComponent>
            <ButtonComponent size="lg" variant="outline">
              Test Outline Button
            </ButtonComponent>
          </div>

          {/* Background Image Info */}
          <div className="mt-8 text-center">
            <CardComponent className="p-6">
              <h3 className="text-xl font-bold mb-4">Current Background</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Theme:</strong> {activeTheme.charAt(0).toUpperCase() + activeTheme.slice(1)}
                </div>
                <div>
                  <strong>Variant:</strong> {activeVariant.charAt(0).toUpperCase() + activeVariant.slice(1)}
                </div>
                <div>
                  <strong>Background Type:</strong> {activeVariant === 'minimal' ? 'Gradient' : 'Image + Gradient'}
                </div>
                <div>
                  <strong>Opacity:</strong> {activeVariant === 'minimal' ? '100%' : '20-30%'}
                </div>
              </div>
            </CardComponent>
          </div>
        </div>
      </BackgroundComponent>
    </div>
  );
}
