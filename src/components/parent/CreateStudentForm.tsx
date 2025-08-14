'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface StudentFormData {
  name: string;
  age: string;
  year: string;
  subjects: string[];
  learningStyle?: string;
  specialNeeds?: string;
  interests?: string;
}

interface CreateStudentFormProps {
  onSubmit: (data: StudentFormData) => void;
  onCancel: () => void;
}

const predefinedSubjects = [
  'Mathematics',
  'English',
  'Science',
  'History',
  'Geography',
  'Art',
  'Music',
  'Physical Education',
  'Computer Science',
  'Foreign Language'
];

const yearLevels = [
  'Pre-K',
  'Kindergarten',
  'Year 1',
  'Year 2',
  'Year 3',
  'Year 4',
  'Year 5',
  'Year 6',
  'Year 7',
  'Year 8',
  'Year 9',
  'Year 10',
  'Year 11',
  'Year 12'
];

const learningStyles = [
  'Visual',
  'Auditory',
  'Kinesthetic',
  'Reading/Writing'
];

export default function CreateStudentForm({ onSubmit, onCancel }: CreateStudentFormProps) {
  const [formData, setFormData] = useState<StudentFormData>({
    name: '',
    age: '',
    year: '',
    subjects: [],
    learningStyle: '',
    specialNeeds: '',
    interests: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.age.trim()) {
      newErrors.age = 'Age is required';
    } else if (isNaN(parseInt(formData.age)) || parseInt(formData.age) < 3 || parseInt(formData.age) > 18) {
      newErrors.age = 'Age must be between 3 and 18';
    }

    if (!formData.year) {
      newErrors.year = 'Year level is required';
    }

    if (formData.subjects.length === 0) {
      newErrors.subjects = 'At least one subject is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleSubjectToggle = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Basic Information</h4>
        
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter student's full name"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
              Age *
            </label>
            <input
              type="number"
              id="age"
              min="3"
              max="18"
              value={formData.age}
              onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.age ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Age"
            />
            {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
          </div>

          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
              Year Level *
            </label>
            <select
              id="year"
              value={formData.year}
              onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.year ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select year level</option>
              {yearLevels.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year}</p>}
          </div>
        </div>
      </div>

      {/* Subjects */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Subjects *</h4>
        <div className="grid grid-cols-2 gap-2">
          {predefinedSubjects.map(subject => (
            <label key={subject} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.subjects.includes(subject)}
                onChange={() => handleSubjectToggle(subject)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{subject}</span>
            </label>
          ))}
        </div>
        {errors.subjects && <p className="text-red-500 text-xs mt-1">{errors.subjects}</p>}
      </div>

      {/* Learning Preferences */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Learning Preferences (Optional)</h4>
        
        <div>
          <label htmlFor="learningStyle" className="block text-sm font-medium text-gray-700 mb-1">
            Learning Style
          </label>
          <select
            id="learningStyle"
            value={formData.learningStyle}
            onChange={(e) => setFormData(prev => ({ ...prev, learningStyle: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select learning style</option>
            {learningStyles.map(style => (
              <option key={style} value={style}>{style}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="interests" className="block text-sm font-medium text-gray-700 mb-1">
            Interests & Hobbies
          </label>
          <textarea
            id="interests"
            value={formData.interests}
            onChange={(e) => setFormData(prev => ({ ...prev, interests: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            placeholder="e.g., Sports, Reading, Music, Art..."
          />
        </div>

        <div>
          <label htmlFor="specialNeeds" className="block text-sm font-medium text-gray-700 mb-1">
            Special Learning Needs
          </label>
          <textarea
            id="specialNeeds"
            value={formData.specialNeeds}
            onChange={(e) => setFormData(prev => ({ ...prev, specialNeeds: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            placeholder="Any special accommodations or learning requirements..."
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 pt-4 border-t border-gray-200">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          Cancel
        </motion.button>
        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Create Profile
        </motion.button>
      </div>
    </form>
  );
}