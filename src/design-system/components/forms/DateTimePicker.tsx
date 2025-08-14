'use client';

import React, { useState, useEffect } from 'react';
import { useFormContext, FieldValues } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { format, isValid, parseISO } from 'date-fns';
import { DateTimePickerProps, ConflictInfo } from './types';

export function DateTimePicker<T extends FieldValues = FieldValues>({
  name,
  label,
  placeholder = 'Select date and time',
  minDate,
  maxDate,
  conflictDetection = false,
  onConflictCheck,
  className,
  required = false,
  disabled = false,
}: DateTimePickerProps<T>) {
  const { register, setValue, watch, formState: { errors } } = useFormContext<T>();
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
  const [showConflicts, setShowConflicts] = useState(false);

  const inputValue = watch(name) || '';
  const error = errors[name];

  useEffect(() => {
    const checkConflicts = async () => {
      if (!conflictDetection || !onConflictCheck || !inputValue) {
        setConflicts([]);
        return;
      }

      const date = typeof inputValue === 'string' ? parseISO(inputValue) : inputValue;
      if (!isValid(date)) return;

      setIsCheckingConflicts(true);
      try {
        const foundConflicts = await onConflictCheck(date);
        setConflicts(foundConflicts);
        setShowConflicts(foundConflicts.length > 0);
      } catch (error) {
        console.error('Failed to check conflicts:', error);
        setConflicts([]);
      } finally {
        setIsCheckingConflicts(false);
      }
    };

    const debounceTimer = setTimeout(checkConflicts, 500);
    return () => clearTimeout(debounceTimer);
  }, [inputValue, conflictDetection, onConflictCheck]);

  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue(name, value as any);
  };

  const formatDateTimeLocal = (date: Date | string) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '';
    
    // Format for datetime-local input (YYYY-MM-DDTHH:mm)
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const getConflictSeverityColor = (severity: ConflictInfo['severity']) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const displayValue = inputValue ? formatDateTimeLocal(inputValue) : '';

  return (
    <div className={clsx('relative', className)}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {conflictDetection && (
            <span className="ml-2 text-xs bg-gradient-to-r from-green-500 to-blue-500 text-white px-2 py-1 rounded-full">
              Smart Scheduling
            </span>
          )}
        </label>
      )}
      
      <div className="relative">
        <input
          {...register(name, { required })}
          type="datetime-local"
          id={name}
          placeholder={placeholder}
          disabled={disabled}
          value={displayValue}
          onChange={handleDateTimeChange}
          min={minDate ? formatDateTimeLocal(minDate) : undefined}
          max={maxDate ? formatDateTimeLocal(maxDate) : undefined}
          className={clsx(
            'w-full px-3 py-2 border rounded-md shadow-sm',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            'transition-colors duration-200',
            error
              ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
              : conflicts.length > 0
              ? 'border-yellow-300 text-yellow-900 focus:ring-yellow-500 focus:border-yellow-500'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
          )}
        />
        
        {isCheckingConflicts && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {conflicts.length > 0 && !isCheckingConflicts && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
            <motion.button
              type="button"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-5 h-5 bg-yellow-500 text-white rounded-full text-xs font-bold hover:bg-yellow-600 transition-colors"
              onClick={() => setShowConflicts(!showConflicts)}
              title={`${conflicts.length} conflict${conflicts.length > 1 ? 's' : ''} found`}
            >
              !
            </motion.button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showConflicts && conflicts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 space-y-2"
          >
            <div className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
              Scheduling Conflicts Detected:
            </div>
            {conflicts.map((conflict, index) => (
              <motion.div
                key={conflict.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={clsx(
                  'p-3 rounded-md border text-sm',
                  getConflictSeverityColor(conflict.severity)
                )}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{conflict.title}</div>
                    <div className="text-xs opacity-75 mt-1">
                      {format(conflict.startTime, 'MMM d, yyyy h:mm a')} - {format(conflict.endTime, 'h:mm a')}
                    </div>
                    <div className="text-xs opacity-75 capitalize">
                      {conflict.type} • {conflict.severity} priority
                    </div>
                  </div>
                  <div className={clsx(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    conflict.severity === 'high' ? 'bg-red-100 text-red-800' :
                    conflict.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  )}>
                    {conflict.severity}
                  </div>
                </div>
              </motion.div>
            ))}
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
              onClick={() => setShowConflicts(false)}
            >
              Hide conflicts
            </motion.button>
          </motion.div>
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