'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TeacherProfile } from '@/types';

interface TeacherFormData {
  name: string;
  email: string;
  phone: string;
  subjects: string[];
  experience: string;
  qualifications: string[];
  specializations: string[];
  hourlyRate: string;
  availability: {
    days: string[];
    timeSlots: string[];
  };
  location: {
    address: string;
  };
  bio: string;
}

interface TeacherCreationFormProps {
  onSubmit: (data: TeacherFormData) => void;
  onCancel: () => void;
}

const availableSubjects = [
  'Mathematics',
  'English',
  'Science',
  'History',
  'Geography',
  'Art',
  'Music',
  'Physical Education',
  'Computer Science',
  'Foreign Languages',
  'Special Education',
  'Early Childhood Education',
];

const availableQualifications = [
  "Bachelor's Degree in Education",
  "Master's Degree in Education",
  'Teaching Certification',
  'Special Education Certification',
  'Early Childhood Certification',
  'Subject-specific Certification',
  'Montessori Certification',
  'Waldorf Certification',
  'Homeschooling Experience',
  'Tutoring Experience',
];

const availableSpecializations = [
  'Learning Disabilities',
  'ADHD/ADD',
  'Autism Spectrum',
  'Gifted Education',
  'ESL/English as Second Language',
  'Math Anxiety',
  'Reading Difficulties',
  'Behavioral Issues',
  'Social Skills',
  'Executive Functioning',
  'Sensory Processing',
  'Motor Skills',
];

const daysOfWeek = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const timeSlots = [
  '9:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '12:00 PM - 1:00 PM',
  '1:00 PM - 2:00 PM',
  '2:00 PM - 3:00 PM',
  '3:00 PM - 4:00 PM',
  '4:00 PM - 5:00 PM',
  '5:00 PM - 6:00 PM',
  '6:00 PM - 7:00 PM',
];

export default function TeacherCreationForm({
  onSubmit,
  onCancel,
}: TeacherCreationFormProps) {
  const [formData, setFormData] = useState<TeacherFormData>({
    name: '',
    email: '',
    phone: '',
    subjects: [],
    experience: '',
    qualifications: [],
    specializations: [],
    hourlyRate: '',
    availability: {
      days: [],
      timeSlots: [],
    },
    location: {
      address: '',
    },
    bio: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.subjects.length) {
      newErrors.subjects = 'At least one subject is required';
    }

    if (!formData.experience) {
      newErrors.experience = 'Experience is required';
    }

    if (!formData.hourlyRate) {
      newErrors.hourlyRate = 'Hourly rate is required';
    }

    if (!formData.location.address.trim()) {
      newErrors.address = 'Address is required';
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

  const handleArrayToggle = (
    item: string,
    field:
      | 'subjects'
      | 'qualifications'
      | 'specializations'
      | 'days'
      | 'timeSlots'
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item],
    }));
  };

  const handleAvailabilityToggle = (
    item: string,
    field: 'days' | 'timeSlots'
  ) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [field]: prev.availability[field].includes(item)
          ? prev.availability[field].filter(i => i !== item)
          : [...prev.availability[field], item],
      },
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Create Teacher Profile
          </h2>
          <p className="text-gray-600">
            Add a new teacher to your homeschooling team. This teacher will be
            available for your students.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter teacher's full name"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={e =>
                  setFormData(prev => ({ ...prev, email: e.target.value }))
                }
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter teacher's email"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={e =>
                  setFormData(prev => ({ ...prev, phone: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label
                htmlFor="experience"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Years of Experience *
              </label>
              <input
                type="number"
                id="experience"
                min="0"
                max="50"
                value={formData.experience}
                onChange={e =>
                  setFormData(prev => ({ ...prev, experience: e.target.value }))
                }
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.experience ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Years of experience"
              />
              {errors.experience && (
                <p className="text-red-500 text-xs mt-1">{errors.experience}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="hourlyRate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Hourly Rate ($) *
              </label>
              <input
                type="number"
                id="hourlyRate"
                min="0"
                step="0.01"
                value={formData.hourlyRate}
                onChange={e =>
                  setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))
                }
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.hourlyRate ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Hourly rate in USD"
              />
              {errors.hourlyRate && (
                <p className="text-red-500 text-xs mt-1">{errors.hourlyRate}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Address *
              </label>
              <input
                type="text"
                id="address"
                value={formData.location.address}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    location: { ...prev.location, address: e.target.value },
                  }))
                }
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.address ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter address"
              />
              {errors.address && (
                <p className="text-red-500 text-xs mt-1">{errors.address}</p>
              )}
            </div>
          </div>

          {/* Subjects */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Subjects Taught *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableSubjects.map(subject => (
                <label
                  key={subject}
                  className="flex items-center space-x-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.subjects.includes(subject)}
                    onChange={() => handleArrayToggle(subject, 'subjects')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{subject}</span>
                </label>
              ))}
            </div>
            {errors.subjects && (
              <p className="text-red-500 text-xs mt-1">{errors.subjects}</p>
            )}
          </div>

          {/* Qualifications */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Qualifications
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableQualifications.map(qualification => (
                <label
                  key={qualification}
                  className="flex items-center space-x-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.qualifications.includes(qualification)}
                    onChange={() =>
                      handleArrayToggle(qualification, 'qualifications')
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{qualification}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Specializations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Specializations
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableSpecializations.map(specialization => (
                <label
                  key={specialization}
                  className="flex items-center space-x-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.specializations.includes(specialization)}
                    onChange={() =>
                      handleArrayToggle(specialization, 'specializations')
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {specialization}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Available Days
              </label>
              <div className="grid grid-cols-2 gap-3">
                {daysOfWeek.map(day => (
                  <label
                    key={day}
                    className="flex items-center space-x-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.availability.days.includes(day)}
                      onChange={() => handleAvailabilityToggle(day, 'days')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{day}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Available Time Slots
              </label>
              <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto">
                {timeSlots.map(slot => (
                  <label
                    key={slot}
                    className="flex items-center space-x-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.availability.timeSlots.includes(slot)}
                      onChange={() =>
                        handleAvailabilityToggle(slot, 'timeSlots')
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{slot}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label
              htmlFor="bio"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Bio/Description
            </label>
            <textarea
              id="bio"
              rows={4}
              value={formData.bio}
              onChange={e =>
                setFormData(prev => ({ ...prev, bio: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tell us about the teacher's background, teaching style, and approach..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCancel}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Teacher Profile
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}
