'use client';

import React, { useId, useState } from 'react';
import { motion } from 'framer-motion';

interface FloatingInputProps {
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  delay?: number;
  icon?: React.ReactNode;
  showToggle?: boolean;
  onToggle?: () => void;
  toggleState?: boolean;
  className?: string;
  name?: string;
  autoComplete?: string;
  'data-testid'?: string;
}

export function FloatingInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  minLength,
  delay = 0,
  icon,
  showToggle = false,
  onToggle,
  toggleState = false,
  className = '',
  name,
  autoComplete,
  'data-testid': testId,
}: FloatingInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const isActive = isFocused || value.length > 0;
  const reactId = useId();
  const inputId = name ? `floating-input-${name}` : reactId;

  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <div className="relative">
        {/* Input container */}
        <div
          className={`
            relative flex items-center bg-white/50 backdrop-blur-sm
            border-2 rounded-xl transition-all duration-300
            ${isFocused ? 'border-purple-400 shadow-lg shadow-purple-500/10' : 'border-gray-200/60 hover:border-gray-300/80'}
          `}
        >
          {/* Icon */}
          {icon && <span className="pl-4 text-gray-400">{icon}</span>}

          {/* Input */}
          <input
            id={inputId}
            name={name}
            autoComplete={autoComplete}
            data-testid={testId}
            type={showToggle ? (toggleState ? 'text' : 'password') : type}
            value={value}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            required={required}
            minLength={minLength}
            aria-label={label}
            className={`
              w-full px-4 py-4 bg-transparent text-gray-800
              placeholder-gray-400 focus:outline-none
              ${icon ? 'pl-2' : ''}
              ${showToggle ? 'pr-12' : ''}
            `}
          />

          {/* Toggle button for password */}
          {showToggle && (
            <button
              type="button"
              onClick={onToggle}
              className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {toggleState ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Floating label */}
        <motion.label
          htmlFor={inputId}
          className={`
            absolute left-4 px-1 pointer-events-none
            transition-all duration-300 bg-gradient-to-b from-white/80 to-white/60
            ${
              isActive
                ? '-top-2.5 text-xs text-purple-600 font-medium'
                : 'top-4 text-gray-400'
            }
            ${icon && !isActive ? 'left-12' : 'left-4'}
          `}
        >
          {label}
        </motion.label>
      </div>
    </motion.div>
  );
}
