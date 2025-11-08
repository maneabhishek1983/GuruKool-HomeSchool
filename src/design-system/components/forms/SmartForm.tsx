'use client';

import React, { useEffect } from 'react';
import { useForm, FormProvider, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { SmartFormProps } from './types';

export function SmartForm<T extends FieldValues = FieldValues>({
  schema,
  onSubmit,
  children,
  defaultValues,
  aiAssisted = false,
  realTimeValidation = true,
  className,
  form: externalForm,
}: SmartFormProps<T>) {
  const formConfig: any = {
    resolver: zodResolver(schema as any),
    ...(defaultValues ? { defaultValues } : {}),
    mode: realTimeValidation ? 'onChange' : 'onSubmit',
    reValidateMode: 'onChange',
  };

  const internalForm = useForm<T>(formConfig);

  const form = externalForm || internalForm;
  const {
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = form;

  // AI-assisted form enhancement
  useEffect(() => {
    if (aiAssisted) {
      // TODO: Implement AI suggestions for form completion
      // This could include auto-filling based on context, suggesting corrections, etc.
      console.log('AI assistance enabled for form');
    }
  }, [aiAssisted]);

  const handleFormSubmit = async (data: T) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
      // TODO: Handle form submission errors with user feedback
    }
  };

  return (
    <FormProvider {...(form as any)}>
      <motion.form
        onSubmit={handleSubmit(handleFormSubmit as any)}
        className={clsx(
          'space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm',
          'border border-gray-200 dark:border-gray-700',
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}

        <AnimatePresence>
          {Object.keys(errors).length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4"
            >
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                Please fix the following errors:
              </h3>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field}>
                    {field}: {error?.message as string}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <motion.button
            type="button"
            className={clsx(
              'px-4 py-2 text-sm font-medium rounded-md',
              'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700',
              'hover:bg-gray-200 dark:hover:bg-gray-600',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500',
              'transition-colors duration-200'
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => form.reset()}
          >
            Reset
          </motion.button>

          <motion.button
            type="submit"
            disabled={isSubmitting || (!isValid && realTimeValidation)}
            className={clsx(
              'px-6 py-2 text-sm font-medium rounded-md',
              'text-white bg-blue-600 hover:bg-blue-700',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-200'
            )}
            whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Submitting...</span>
              </div>
            ) : (
              'Submit'
            )}
          </motion.button>
        </div>
      </motion.form>
    </FormProvider>
  );
}
