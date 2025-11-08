'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TeacherRate {
  subject: string;
  rate_type: 'hourly' | 'fixed' | 'session';
  rate_amount: number;
  currency: string;
  notes?: string;
}

interface TeacherRateManagementProps {
  subjects: string[];
  rates: TeacherRate[];
  onChange: (rates: TeacherRate[]) => void;
  readOnly?: boolean;
}

const RATE_TYPES = [
  { value: 'hourly', label: 'Per Hour' },
  { value: 'fixed', label: 'Fixed Rate' },
  { value: 'session', label: 'Per Session' },
];

const CURRENCIES = ['USD', 'GBP', 'EUR', 'INR'];

export default function TeacherRateManagement({
  subjects,
  rates,
  onChange,
  readOnly = false,
}: TeacherRateManagementProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const addRate = () => {
    // Find subjects that don't have rates yet
    const usedSubjects = new Set(rates.map(r => r.subject));
    const availableSubjects = subjects.filter(s => !usedSubjects.has(s));

    if (availableSubjects.length === 0) {
      alert('All subjects already have rates assigned');
      return;
    }

    const newRate: TeacherRate = {
      subject: availableSubjects[0] || '',
      rate_type: 'hourly',
      rate_amount: 0,
      currency: 'USD',
      notes: '',
    };

    onChange([...rates, newRate]);
    setEditingIndex(rates.length);
  };

  const updateRate = (index: number, field: keyof TeacherRate, value: any) => {
    const updatedRates = [...rates];
    const currentRate = updatedRates[index];
    if (currentRate) {
      updatedRates[index] = { ...currentRate, [field]: value } as TeacherRate;
    }
    onChange(updatedRates);
  };

  const removeRate = (index: number) => {
    const updatedRates = rates.filter((_, i) => i !== index);
    onChange(updatedRates);
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const getAvailableSubjects = (currentSubject: string) => {
    const usedSubjects = new Set(rates.map(r => r.subject));
    return subjects.filter(s => s === currentSubject || !usedSubjects.has(s));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Subject Rates</h3>
        {!readOnly && (
          <button
            type="button"
            onClick={addRate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            disabled={rates.length >= subjects.length}
          >
            + Add Rate
          </button>
        )}
      </div>

      {rates.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500">
            No rates added yet. Click "Add Rate" to set rates for each subject.
          </p>
        </div>
      )}

      <AnimatePresence>
        {rates.map((rate, index) => (
          <motion.div
            key={`${rate.subject}-${index}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                {readOnly ? (
                  <div className="text-gray-900">{rate.subject}</div>
                ) : (
                  <select
                    value={rate.subject}
                    onChange={e => updateRate(index, 'subject', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={readOnly}
                  >
                    <option value="">Select subject</option>
                    {getAvailableSubjects(rate.subject).map(subject => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Rate Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rate Type *
                </label>
                {readOnly ? (
                  <div className="text-gray-900">
                    {RATE_TYPES.find(t => t.value === rate.rate_type)?.label}
                  </div>
                ) : (
                  <select
                    value={rate.rate_type}
                    onChange={e =>
                      updateRate(index, 'rate_type', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={readOnly}
                  >
                    {RATE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Rate Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rate Amount *
                </label>
                {readOnly ? (
                  <div className="text-gray-900">
                    {rate.currency} {rate.rate_amount.toFixed(2)}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select
                      value={rate.currency}
                      onChange={e =>
                        updateRate(index, 'currency', e.target.value)
                      }
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={readOnly}
                    >
                      {CURRENCIES.map(curr => (
                        <option key={curr} value={curr}>
                          {curr}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={rate.rate_amount}
                      onChange={e =>
                        updateRate(
                          index,
                          'rate_amount',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      disabled={readOnly}
                    />
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                {readOnly ? (
                  <div className="text-gray-600 text-sm">
                    {rate.notes || '-'}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={rate.notes || ''}
                    onChange={e => updateRate(index, 'notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Additional notes"
                    disabled={readOnly}
                    maxLength={500}
                  />
                )}
              </div>
            </div>

            {/* Delete button */}
            {!readOnly && (
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeRate(index)}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  Remove
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Summary */}
      {rates.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <h4 className="font-medium text-blue-900 mb-2">Rate Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {rates.map((rate, index) => (
              <div key={index} className="flex justify-between text-blue-800">
                <span>{rate.subject}:</span>
                <span className="font-medium">
                  {rate.currency} {rate.rate_amount.toFixed(2)} /{' '}
                  {rate.rate_type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
