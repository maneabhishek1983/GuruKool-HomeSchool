'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFormContext, FieldValues } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { AutoCompleteInputProps } from './types';

export function AutoCompleteInput<T extends FieldValues = FieldValues>({
  name,
  label,
  placeholder,
  suggestions = [],
  aiPowered = false,
  onSuggestionsFetch,
  className,
  required = false,
  disabled = false,
}: AutoCompleteInputProps<T>) {
  const { register, setValue, watch, formState: { errors } } = useFormContext<T>();
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const inputValue = watch(name) || '';
  const error = errors[name];

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!inputValue.trim()) {
        setFilteredSuggestions([]);
        return;
      }

      if (aiPowered && onSuggestionsFetch) {
        setLoading(true);
        try {
          const aiSuggestions = await onSuggestionsFetch(inputValue);
          setFilteredSuggestions(aiSuggestions);
        } catch (error) {
          console.error('Failed to fetch AI suggestions:', error);
          // Fallback to local filtering
          const filtered = suggestions.filter(suggestion =>
            suggestion.toLowerCase().includes(inputValue.toLowerCase())
          );
          setFilteredSuggestions(filtered);
        } finally {
          setLoading(false);
        }
      } else {
        // Local filtering
        const filtered = suggestions.filter(suggestion =>
          suggestion.toLowerCase().includes(inputValue.toLowerCase())
        );
        setFilteredSuggestions(filtered);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [inputValue, suggestions, aiPowered, onSuggestionsFetch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue(name, value as any);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setValue(name, suggestion as any);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSuggestionClick(filteredSuggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleBlur = () => {
    // Delay closing to allow for suggestion clicks
    setTimeout(() => setIsOpen(false), 150);
  };

  return (
    <div className={clsx('relative', className)}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {aiPowered && (
            <span className="ml-2 text-xs bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-1 rounded-full">
              AI
            </span>
          )}
        </label>
      )}
      
      <div className="relative">
        <input
          {...register(name, { required })}
          ref={inputRef}
          type="text"
          id={name}
          placeholder={placeholder}
          disabled={disabled}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          onBlur={handleBlur}
          className={clsx(
            'w-full px-3 py-2 border rounded-md shadow-sm',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            'transition-colors duration-200',
            error
              ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
          )}
        />
        
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && filteredSuggestions.length > 0 && (
          <motion.ul
            ref={listRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={clsx(
              'absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600',
              'rounded-md shadow-lg max-h-60 overflow-auto'
            )}
          >
            {filteredSuggestions.map((suggestion, index) => (
              <motion.li
                key={suggestion}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className={clsx(
                  'px-3 py-2 cursor-pointer text-sm',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                  'transition-colors duration-150',
                  highlightedIndex === index && 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                )}
                onClick={() => handleSuggestionClick(suggestion)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {suggestion}
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-sm text-red-600 dark:text-red-400"
        >
          {error.message as string}
        </motion.p>
      )}
    </div>
  );
}