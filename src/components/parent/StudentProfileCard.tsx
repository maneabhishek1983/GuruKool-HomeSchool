'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  StudentProfile,
  Country,
  AcademicStandard,
  SocializationOption,
  PhysicalEducationOption,
  ExtracurricularOption,
  CommunityInvolvementOption,
} from '@/types';

interface StudentProfileCardProps {
  student: StudentProfile;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export default function StudentProfileCard({
  student,
  onEdit,
  onDelete,
  className = '',
}: StudentProfileCardProps) {
  const getCountryFlag = (country: Country) => {
    switch (country) {
      case 'UK':
        return '🇬🇧';
      case 'US':
        return '🇺🇸';
      case 'India':
        return '🇮🇳';
      default:
        return '🌍';
    }
  };

  const getCostColor = (cost: string) => {
    switch (cost) {
      case 'free':
        return 'text-green-600 bg-green-100';
      case 'low':
        return 'text-blue-600 bg-blue-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const renderOptionsList = (
    options: (
      | SocializationOption
      | PhysicalEducationOption
      | ExtracurricularOption
      | CommunityInvolvementOption
    )[],
    title: string
  ) => {
    if (options.length === 0) {
      return (
        <div className="text-sm text-gray-500 italic">
          No {title.toLowerCase()} options selected
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {options.map(option => (
          <div
            key={option.id}
            className="flex items-center justify-between p-2 bg-gray-50 rounded"
          >
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-sm">{option.name}</span>
                <span
                  className={`text-xs px-2 py-1 rounded ${getCostColor(option.cost)}`}
                >
                  {option.cost} cost
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">{option.description}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl">
              {student.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-bold">{student.name}</h3>
              <div className="flex items-center space-x-2 text-sm opacity-90">
                <span>{student.age} years old</span>
                <span>•</span>
                <span>
                  {getCountryFlag(student.country)} {student.country}
                </span>
                <span>•</span>
                <span>{student.academicStandard.name}</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            {onEdit && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onEdit}
                className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
                title="Edit Profile"
              >
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </motion.button>
            )}
            {onDelete && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onDelete}
                className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
                title="Delete Profile"
              >
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Academic Information */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            Academic Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-2">
                Academic Standard
              </h5>
              <p className="text-sm text-blue-700">
                {student.academicStandard.name}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {student.academicStandard.description}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h5 className="font-medium text-green-900 mb-2">
                Selected Subjects
              </h5>
              <div className="flex flex-wrap gap-1">
                {student.selectedSubjects.map(subject => (
                  <span
                    key={subject.id}
                    className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
                  >
                    {subject.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Homeschooling Options */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Homeschooling Options
          </h4>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Socialization */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h5 className="font-medium text-purple-900 mb-3">
                Socialization
              </h5>
              {renderOptionsList(
                student.selectedSocialization,
                'Socialization'
              )}
            </div>

            {/* Physical Education */}
            <div className="bg-orange-50 p-4 rounded-lg">
              <h5 className="font-medium text-orange-900 mb-3">
                Physical Education
              </h5>
              {renderOptionsList(
                student.selectedPhysicalEducation,
                'Physical Education'
              )}
            </div>

            {/* Extracurricular */}
            <div className="bg-teal-50 p-4 rounded-lg">
              <h5 className="font-medium text-teal-900 mb-3">
                Extracurricular Activities
              </h5>
              {renderOptionsList(
                student.selectedExtracurricular,
                'Extracurricular'
              )}
            </div>

            {/* Community Involvement */}
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h5 className="font-medium text-indigo-900 mb-3">
                Community Involvement
              </h5>
              {renderOptionsList(
                student.selectedCommunityInvolvement,
                'Community Involvement'
              )}
            </div>
          </div>
        </div>

        {/* Learning Preferences */}
        {(student.learningStyle ||
          student.interests ||
          student.specialNeeds) && (
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              Learning Preferences
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {student.learningStyle && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">
                    Learning Style
                  </h5>
                  <p className="text-sm text-gray-700">
                    {student.learningStyle}
                  </p>
                </div>
              )}
              {student.interests && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">
                    Interests & Hobbies
                  </h5>
                  <p className="text-sm text-gray-700">{student.interests}</p>
                </div>
              )}
              {student.specialNeeds && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">
                    Special Needs
                  </h5>
                  <p className="text-sm text-gray-700">
                    {student.specialNeeds}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profile Metadata */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>
                Created: {new Date(student.createdAt).toLocaleDateString()}
              </span>
              <span>
                Updated: {new Date(student.updatedAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                {student.selectedSubjects.length} subjects
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                {student.selectedSocialization.length +
                  student.selectedPhysicalEducation.length +
                  student.selectedExtracurricular.length +
                  student.selectedCommunityInvolvement.length}{' '}
                activities
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
