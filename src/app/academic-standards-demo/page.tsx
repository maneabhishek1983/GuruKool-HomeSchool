'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { academicStandardsService } from '@/services/academic-standards.service';
import { Country, AcademicStandard, Subject, GradeLevel } from '@/types';
import CreateStudentForm from '@/components/parent/CreateStudentForm';
import StudentProfileCard from '@/components/parent/StudentProfileCard';
import { StudentProfile } from '@/types';

export default function AcademicStandardsDemo() {
  const [selectedCountry, setSelectedCountry] = useState<Country>('US');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createdStudent, setCreatedStudent] = useState<StudentProfile | null>(
    null
  );

  const countries = academicStandardsService.getAvailableCountries();
  const academicStandard =
    academicStandardsService.getAcademicStandard(selectedCountry);
  const gradeLevels = academicStandardsService.getGradeLevels(selectedCountry);
  const subjects = academicStandardsService.getSubjects(selectedCountry);
  const homeschoolingOptions =
    academicStandardsService.getHomeschoolingOptions();

  const handleCreateStudent = (formData: any) => {
    // Convert form data to StudentProfile format
    const studentProfile: StudentProfile = {
      id: `student-${Date.now()}`,
      name: formData.name,
      age: parseInt(formData.age),
      grade: formData.gradeLevel,
      country: formData.country,
      academicStandard: academicStandardsService.getAcademicStandard(
        formData.country
      ),
      selectedSubjects: formData.selectedSubjects,
      selectedSocialization: formData.selectedSocialization,
      selectedPhysicalEducation: formData.selectedPhysicalEducation,
      selectedExtracurricular: formData.selectedExtracurricular,
      selectedCommunityInvolvement: formData.selectedCommunityInvolvement,
      learningStyle: formData.learningStyle,
      specialNeeds: formData.specialNeeds,
      interests: formData.interests,
      parentId: 'demo-parent',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setCreatedStudent(studentProfile);
    setShowCreateForm(false);
  };

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Academic Standards & Homeschooling Options Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore academic standards for UK, US, and India, along with
            comprehensive homeschooling options for socialization and physical
            education.
          </p>
        </div>

        {/* Country Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Select Academic Standard
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {countries.map(country => (
              <motion.button
                key={country}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedCountry(country);
                  setSelectedGrade('');
                }}
                className={`p-6 rounded-lg border-2 transition-all ${
                  selectedCountry === country
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-2">{getCountryFlag(country)}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{country}</h3>
                <p className="text-sm text-gray-600">
                  {academicStandardsService.getAcademicStandard(country).name}
                </p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Academic Standard Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Grade Levels */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Grade Levels
            </h3>
            <div className="space-y-3">
              {gradeLevels.map(grade => (
                <motion.div
                  key={grade.id}
                  whileHover={{ scale: 1.01 }}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedGrade === grade.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedGrade(grade.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {grade.name}
                      </h4>
                      <p className="text-sm text-gray-600">{grade.ageRange}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {grade.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Key Skills:</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {grade.keySkills.slice(0, 3).map((skill, index) => (
                          <span
                            key={index}
                            className="text-xs bg-gray-100 px-2 py-1 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Subjects */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Available Subjects
            </h3>
            <div className="space-y-3">
              {subjects.map(subject => (
                <motion.div
                  key={subject.id}
                  whileHover={{ scale: 1.01 }}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-all"
                >
                  <h4 className="font-medium text-gray-900 mb-2">
                    {subject.name}
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    {subject.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {subject.skills.slice(0, 4).map((skill, index) => (
                      <span
                        key={index}
                        className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Homeschooling Options Preview */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Homeschooling Options
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Socialization */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-3">
                Socialization
              </h3>
              <div className="space-y-2">
                {homeschoolingOptions.socialization.slice(0, 3).map(option => (
                  <div key={option.id} className="text-sm">
                    <div className="font-medium text-purple-800">
                      {option.name}
                    </div>
                    <div className="text-purple-600 text-xs">
                      {option.frequency} • {option.location}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Physical Education */}
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-900 mb-3">
                Physical Education
              </h3>
              <div className="space-y-2">
                {homeschoolingOptions.physicalEducation
                  .slice(0, 3)
                  .map(option => (
                    <div key={option.id} className="text-sm">
                      <div className="font-medium text-orange-800">
                        {option.name}
                      </div>
                      <div className="text-orange-600 text-xs">
                        {option.category} • {option.duration}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Extracurricular */}
            <div className="bg-teal-50 p-4 rounded-lg">
              <h3 className="font-semibold text-teal-900 mb-3">
                Extracurricular
              </h3>
              <div className="space-y-2">
                {homeschoolingOptions.extracurricular
                  .slice(0, 3)
                  .map(option => (
                    <div key={option.id} className="text-sm">
                      <div className="font-medium text-teal-800">
                        {option.name}
                      </div>
                      <div className="text-teal-600 text-xs">
                        {option.category} • {option.frequency}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Community Involvement */}
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="font-semibold text-indigo-900 mb-3">
                Community Involvement
              </h3>
              <div className="space-y-2">
                {homeschoolingOptions.communityInvolvement
                  .slice(0, 3)
                  .map(option => (
                    <div key={option.id} className="text-sm">
                      <div className="font-medium text-indigo-800">
                        {option.name}
                      </div>
                      <div className="text-indigo-600 text-xs">
                        {option.category} • {option.frequency}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Create Student Button */}
        <div className="text-center mb-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Create Student Profile
          </motion.button>
        </div>

        {/* Create Student Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Create Student Profile
                  </h2>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <CreateStudentForm
                  onSubmit={handleCreateStudent}
                  onCancel={() => setShowCreateForm(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Created Student Profile */}
        {createdStudent && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Created Student Profile
            </h2>
            <StudentProfileCard
              student={createdStudent}
              onEdit={() => setShowCreateForm(true)}
              onDelete={() => setCreatedStudent(null)}
            />
          </div>
        )}

        {/* Features Summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Multi-Country Standards
              </h3>
              <p className="text-sm text-gray-600">
                Support for UK, US, and India academic standards with
                country-specific curricula and grade levels.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-green-600"
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
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Socialization Options
              </h3>
              <p className="text-sm text-gray-600">
                Comprehensive socialization opportunities including co-ops,
                online communities, and local clubs.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Physical Education
              </h3>
              <p className="text-sm text-gray-600">
                Diverse physical education options from home fitness to local
                sports programs and outdoor activities.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-purple-600"
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
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Extracurricular Activities
              </h3>
              <p className="text-sm text-gray-600">
                Wide range of extracurricular activities including arts, music,
                technology, and more.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-indigo-600"
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
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Community Involvement
              </h3>
              <p className="text-sm text-gray-600">
                Community service, religious education, and other involvement
                opportunities for holistic development.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-teal-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Comprehensive Profiles
              </h3>
              <p className="text-sm text-gray-600">
                Detailed student profiles with academic standards, learning
                preferences, and activity selections.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
