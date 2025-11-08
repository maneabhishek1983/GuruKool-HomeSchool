'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BackgroundImageSettingsProps {
  theme: 'netflix' | 'amazon' | 'kids';
  onSettingsChange: (settings: BackgroundImageSettings) => void;
  className?: string;
}

interface BackgroundImageSettings {
  opacity: number;
  blur: number;
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  enableParallax: boolean;
  enableHover: boolean;
  enableAnimations: boolean;
}

const defaultSettings: Record<
  'netflix' | 'amazon' | 'kids',
  BackgroundImageSettings
> = {
  netflix: {
    opacity: 0.2,
    blur: 0,
    brightness: 0.5,
    contrast: 1.2,
    saturation: 0.8,
    hue: 0,
    enableParallax: true,
    enableHover: true,
    enableAnimations: true,
  },
  amazon: {
    opacity: 0.1,
    blur: 0,
    brightness: 1.0,
    contrast: 1.0,
    saturation: 0.6,
    hue: 0,
    enableParallax: false,
    enableHover: false,
    enableAnimations: true,
  },
  kids: {
    opacity: 0.25,
    blur: 0,
    brightness: 0.9,
    contrast: 1.1,
    saturation: 1.2,
    hue: 10,
    enableParallax: true,
    enableHover: true,
    enableAnimations: true,
  },
};

export function BackgroundImageSettings({
  theme,
  onSettingsChange,
  className = '',
}: BackgroundImageSettingsProps) {
  const [settings, setSettings] = useState<BackgroundImageSettings>(() => {
    const themeSettings = defaultSettings[theme];
    if (themeSettings) {
      return themeSettings;
    }
    return defaultSettings.netflix;
  });
  const [isOpen, setIsOpen] = useState(false);

  const handleSettingChange = (
    key: keyof BackgroundImageSettings,
    value: any
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const resetToDefault = () => {
    const themeSettings = defaultSettings[theme];
    const defaultSetting = themeSettings ?? defaultSettings.netflix;
    setSettings(defaultSetting);
    onSettingsChange(defaultSetting);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'netflix':
        return '🎬';
      case 'amazon':
        return '🛒';
      case 'kids':
        return '🎈';
      default:
        return '🎨';
    }
  };

  const getThemeName = () => {
    switch (theme) {
      case 'netflix':
        return 'Netflix';
      case 'amazon':
        return 'Amazon';
      case 'kids':
        return 'Kids';
      default:
        return 'Theme';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Settings Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="flex items-center space-x-2">
          <span className="text-xl">{getThemeIcon()}</span>
          <span className="text-sm font-medium">
            {getThemeName()} Background
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
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
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </motion.div>
        </div>
      </motion.button>

      {/* Settings Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-20 right-4 z-40 bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl max-w-sm w-full"
          >
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">
                  Background Settings
                </h3>
                <button
                  onClick={resetToDefault}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Reset
                </button>
              </div>

              {/* Opacity Control */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Opacity: {Math.round(settings.opacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.opacity}
                  onChange={e =>
                    handleSettingChange('opacity', parseFloat(e.target.value))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Blur Control */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Blur: {settings.blur}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={settings.blur}
                  onChange={e =>
                    handleSettingChange('blur', parseFloat(e.target.value))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Brightness Control */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Brightness: {Math.round(settings.brightness * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="2"
                  step="0.1"
                  value={settings.brightness}
                  onChange={e =>
                    handleSettingChange(
                      'brightness',
                      parseFloat(e.target.value)
                    )
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Contrast Control */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Contrast: {Math.round(settings.contrast * 100)}%
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={settings.contrast}
                  onChange={e =>
                    handleSettingChange('contrast', parseFloat(e.target.value))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Saturation Control */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Saturation: {Math.round(settings.saturation * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.saturation}
                  onChange={e =>
                    handleSettingChange(
                      'saturation',
                      parseFloat(e.target.value)
                    )
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Hue Control */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Hue: {settings.hue}°
                </label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="10"
                  value={settings.hue}
                  onChange={e =>
                    handleSettingChange('hue', parseInt(e.target.value))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Feature Toggles */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Features</h4>

                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">
                    Parallax Effect
                  </label>
                  <input
                    type="checkbox"
                    checked={settings.enableParallax}
                    onChange={e =>
                      handleSettingChange('enableParallax', e.target.checked)
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">Hover Effects</label>
                  <input
                    type="checkbox"
                    checked={settings.enableHover}
                    onChange={e =>
                      handleSettingChange('enableHover', e.target.checked)
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">Animations</label>
                  <input
                    type="checkbox"
                    checked={settings.enableAnimations}
                    onChange={e =>
                      handleSettingChange('enableAnimations', e.target.checked)
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Preview
                </label>
                <div
                  className="w-full h-20 rounded-lg bg-cover bg-center relative"
                  style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80')`,
                    filter: `brightness(${settings.brightness}) contrast(${settings.contrast}) saturate(${settings.saturation}) hue-rotate(${settings.hue}deg) blur(${settings.blur}px)`,
                    opacity: settings.opacity,
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Background Image Presets
export const backgroundImagePresets = {
  netflix: {
    cinematic: {
      opacity: 0.25,
      blur: 0,
      brightness: 0.5,
      contrast: 1.2,
      saturation: 0.8,
    },
    dramatic: {
      opacity: 0.3,
      blur: 1,
      brightness: 0.4,
      contrast: 1.4,
      saturation: 0.6,
    },
    subtle: {
      opacity: 0.15,
      blur: 0,
      brightness: 0.6,
      contrast: 1.0,
      saturation: 0.7,
    },
  },
  amazon: {
    professional: {
      opacity: 0.1,
      blur: 0,
      brightness: 1.0,
      contrast: 1.0,
      saturation: 0.6,
    },
    clean: {
      opacity: 0.05,
      blur: 0,
      brightness: 1.1,
      contrast: 0.9,
      saturation: 0.5,
    },
    modern: {
      opacity: 0.15,
      blur: 0.5,
      brightness: 0.9,
      contrast: 1.1,
      saturation: 0.7,
    },
  },
  kids: {
    vibrant: {
      opacity: 0.3,
      blur: 0,
      brightness: 0.9,
      contrast: 1.1,
      saturation: 1.2,
    },
    playful: {
      opacity: 0.25,
      blur: 0.5,
      brightness: 1.0,
      contrast: 1.0,
      saturation: 1.3,
    },
    soft: {
      opacity: 0.2,
      blur: 1,
      brightness: 1.1,
      contrast: 0.9,
      saturation: 0.8,
    },
  },
};
