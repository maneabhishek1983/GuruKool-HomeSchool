'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { academicStandardsService } from '@/services/academic-standards.service';
import {
  Country,
  AcademicStandard,
  Subject,
  GradeLevel,
  SocializationOption,
  PhysicalEducationOption,
  ExtracurricularOption,
  CommunityInvolvementOption,
} from '@/types';

interface StudentFormData {
  name: string;
  age: string;
  country: Country;
  gradeLevel: string;
  selectedSubjects: Subject[];
  selectedSocialization: SocializationOption[];
  selectedPhysicalEducation: PhysicalEducationOption[];
  selectedExtracurricular: ExtracurricularOption[];
  selectedCommunityInvolvement: CommunityInvolvementOption[];
  // Data Sheet Activity Categories
  selectedSensoryActivities: string[];
  selectedWritingActivities: string[];
  selectedCommunicationActivities: string[];
  selectedSocialActivities: string[];
  selectedMotorActivities: string[];
  selectedAcademicActivities: string[];
  learningStyle?: string;
  specialNeeds?: string;
  interests?: string;
}

interface CreateStudentFormProps {
  onSubmit: (data: StudentFormData) => void;
  onCancel: () => void;
}

const learningStyles = ['Visual', 'Auditory', 'Kinesthetic', 'Reading/Writing'];

// Data Sheet Activity Options
const sensoryActivities = [
  'Visual tracking exercises',
  'Auditory discrimination games',
  'Tactile exploration activities',
  'Olfactory (smell) activities',
  'Gustatory (taste) activities',
  'Proprioceptive activities',
  'Vestibular activities',
  'Sensory integration exercises',
  'Texture exploration',
  'Sound discrimination',
  'Visual scanning exercises',
  'Body awareness activities',
];

const writingActivities = [
  'Handwriting practice',
  'Letter formation',
  'Word writing',
  'Sentence writing',
  'Paragraph writing',
  'Creative writing',
  'Journal writing',
  'Story writing',
  'Essay writing',
  'Note-taking',
  'Copy work',
  'Dictation exercises',
  'Writing prompts',
  'Grammar exercises',
  'Spelling practice',
];

const communicationActivities = [
  'Verbal expression',
  'Listening comprehension',
  'Conversation skills',
  'Public speaking',
  'Storytelling',
  'Role-playing',
  'Debate activities',
  'Presentation skills',
  'Question and answer sessions',
  'Vocabulary building',
  'Language games',
  'Sign language (if applicable)',
  'Non-verbal communication',
  'Active listening exercises',
];

const socialActivities = [
  'Peer interaction',
  'Group activities',
  'Team building exercises',
  'Social skills training',
  'Conflict resolution',
  'Empathy building',
  'Friendship skills',
  'Cooperation activities',
  'Leadership development',
  'Community involvement',
  'Cultural awareness',
  'Social etiquette',
  'Play skills',
  'Social problem solving',
];

const motorActivities = [
  'Fine motor activities',
  'Gross motor activities',
  'Hand-eye coordination',
  'Balance exercises',
  'Coordination activities',
  'Motor planning',
  'Motor control exercises',
  'Strength building',
  'Endurance activities',
  'Motor skills development',
  'Physical activities',
  'Sports participation',
  'Dance activities',
  'Yoga exercises',
  'Gymnastics',
  'Swimming',
  'Running activities',
  'Jumping exercises',
  'Climbing activities',
  'Throwing and catching',
];

const academicActivities = [
  'Mathematics exercises',
  'Reading comprehension',
  'Science experiments',
  'History studies',
  'Geography exploration',
  'Art projects',
  'Music activities',
  'Physical education',
  'Computer skills',
  'Research projects',
  'Study skills',
  'Test preparation',
  'Homework assistance',
  'Educational games',
  'Field trips',
];

export default function CreateStudentForm({
  onSubmit,
  onCancel,
}: CreateStudentFormProps) {
  const [formData, setFormData] = useState<StudentFormData>({
    name: '',
    age: '',
    country: 'US',
    gradeLevel: '',
    selectedSubjects: [],
    selectedSocialization: [],
    selectedPhysicalEducation: [],
    selectedExtracurricular: [],
    selectedCommunityInvolvement: [],
    // Data Sheet Activity Categories
    selectedSensoryActivities: [],
    selectedWritingActivities: [],
    selectedCommunicationActivities: [],
    selectedSocialActivities: [],
    selectedMotorActivities: [],
    selectedAcademicActivities: [],
    learningStyle: '',
    specialNeeds: '',
    interests: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [academicStandard, setAcademicStandard] =
    useState<AcademicStandard | null>(null);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [homeschoolingOptions, setHomeschoolingOptions] = useState<any>(null);

  // Load academic standards and homeschooling options
  useEffect(() => {
    const loadData = () => {
      try {
        const standard = academicStandardsService.getAcademicStandard(
          formData.country
        );
        const grades = academicStandardsService.getGradeLevels(
          formData.country
        );
        const subjects = academicStandardsService.getSubjects(formData.country);
        const options = academicStandardsService.getHomeschoolingOptions();

        setAcademicStandard(standard);
        setGradeLevels(grades);
        setAvailableSubjects(subjects);
        setHomeschoolingOptions(options);
      } catch (error) {
        console.error('Error loading academic standards:', error);
      }
    };

    loadData();
  }, [formData.country]);

  // Get recommended options based on student age
  const getRecommendedOptions = () => {
    if (!formData.age) {
      return null;
    }

    const age = parseInt(formData.age);
    return academicStandardsService.getRecommendedOptions(
      age,
      formData.country,
      []
    );
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.age.trim()) {
      newErrors.age = 'Age is required';
    } else if (
      isNaN(parseInt(formData.age)) ||
      parseInt(formData.age) < 3 ||
      parseInt(formData.age) > 18
    ) {
      newErrors.age = 'Age must be between 3 and 18';
    }

    if (!formData.country) {
      newErrors.country = 'Country is required';
    }

    if (!formData.gradeLevel) {
      newErrors.gradeLevel = 'Grade level is required';
    }

    if (formData.selectedSubjects.length === 0) {
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

  const handleSubjectToggle = (subject: Subject) => {
    setFormData(prev => ({
      ...prev,
      selectedSubjects: prev.selectedSubjects.find(s => s.id === subject.id)
        ? prev.selectedSubjects.filter(s => s.id !== subject.id)
        : [...prev.selectedSubjects, subject],
    }));
  };

  const handleOptionToggle = (
    option: any,
    category: keyof Omit<
      StudentFormData,
      | 'name'
      | 'age'
      | 'country'
      | 'gradeLevel'
      | 'learningStyle'
      | 'specialNeeds'
      | 'interests'
    >
  ) => {
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].find((o: any) => o.id === option.id)
        ? (prev[category] as any[]).filter((o: any) => o.id !== option.id)
        : [...(prev[category] as any[]), option],
    }));
  };

  // Activity toggle functions for data sheet activities
  const handleActivityToggle = (
    activity: string,
    category:
      | 'selectedSensoryActivities'
      | 'selectedWritingActivities'
      | 'selectedCommunicationActivities'
      | 'selectedSocialActivities'
      | 'selectedMotorActivities'
      | 'selectedAcademicActivities'
  ) => {
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].includes(activity)
        ? prev[category].filter(a => a !== activity)
        : [...prev[category], activity],
    }));
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      {[1, 2, 3, 4, 5].map(step => (
        <div key={step} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step <= currentStep
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {step}
          </div>
          {step < 5 && (
            <div
              className={`w-12 h-1 mx-2 ${
                step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderBasicInformation = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Basic Information
        </h3>

        <div className="space-y-4">
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
              placeholder="Enter student's full name"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="age"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Age *
              </label>
              <input
                type="number"
                id="age"
                min="3"
                max="18"
                value={formData.age}
                onChange={e =>
                  setFormData(prev => ({ ...prev, age: e.target.value }))
                }
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.age ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Age"
              />
              {errors.age && (
                <p className="text-red-500 text-xs mt-1">{errors.age}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="country"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Country *
              </label>
              <select
                id="country"
                value={formData.country}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    country: e.target.value as Country,
                    gradeLevel: '', // Reset grade level when country changes
                  }))
                }
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.country ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select country</option>
                <option value="UK">United Kingdom</option>
                <option value="US">United States</option>
                <option value="India">India</option>
              </select>
              {errors.country && (
                <p className="text-red-500 text-xs mt-1">{errors.country}</p>
              )}
            </div>
          </div>

          {formData.country && (
            <div>
              <label
                htmlFor="gradeLevel"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Grade Level *
              </label>
              <select
                id="gradeLevel"
                value={formData.gradeLevel}
                onChange={e =>
                  setFormData(prev => ({ ...prev, gradeLevel: e.target.value }))
                }
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.gradeLevel ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select grade level</option>
                {gradeLevels.map(grade => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name} ({grade.ageRange})
                  </option>
                ))}
              </select>
              {errors.gradeLevel && (
                <p className="text-red-500 text-xs mt-1">{errors.gradeLevel}</p>
              )}
            </div>
          )}

          {academicStandard && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                Academic Standard: {academicStandard.name}
              </h4>
              <p className="text-sm text-blue-700">
                {academicStandard.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSubjects = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Academic Subjects
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Select the subjects your child will study based on the{' '}
          {academicStandard?.name}
        </p>

        <div className="grid grid-cols-2 gap-4">
          {availableSubjects.map(subject => (
            <div key={subject.id} className="border rounded-lg p-4">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.selectedSubjects.some(
                    s => s.id === subject.id
                  )}
                  onChange={() => handleSubjectToggle(subject)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{subject.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {subject.description}
                  </p>
                  <div className="mt-2">
                    <span className="text-xs font-medium text-gray-500">
                      Skills:
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {subject.skills.slice(0, 3).map((skill, index) => (
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
              </label>
            </div>
          ))}
        </div>
        {errors.subjects && (
          <p className="text-red-500 text-xs mt-2">{errors.subjects}</p>
        )}
      </div>
    </div>
  );

  const renderHomeschoolingOptions = () => {
    const recommendedOptions = getRecommendedOptions();

    return (
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Homeschooling Options
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Select options for socialization and physical education to ensure a
            well-rounded homeschooling experience
          </p>
        </div>

        {/* Socialization Options */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">
            Socialization Opportunities
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {homeschoolingOptions?.socialization.map(
              (option: SocializationOption) => (
                <div key={option.id} className="border rounded-lg p-4">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.selectedSocialization.some(
                        s => s.id === option.id
                      )}
                      onChange={() =>
                        handleOptionToggle(option, 'selectedSocialization')
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-gray-900">
                          {option.name}
                        </h5>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            option.cost === 'free'
                              ? 'bg-green-100 text-green-800'
                              : option.cost === 'low'
                                ? 'bg-blue-100 text-blue-800'
                                : option.cost === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {option.cost} cost
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {option.description}
                      </p>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span>Frequency: {option.frequency}</span>
                        <span>Group: {option.groupSize}</span>
                        <span>Location: {option.location}</span>
                      </div>
                    </div>
                  </label>
                </div>
              )
            )}
          </div>
        </div>

        {/* Physical Education Options */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Physical Education</h4>
          <div className="grid grid-cols-1 gap-3">
            {homeschoolingOptions?.physicalEducation.map(
              (option: PhysicalEducationOption) => (
                <div key={option.id} className="border rounded-lg p-4">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.selectedPhysicalEducation.some(
                        p => p.id === option.id
                      )}
                      onChange={() =>
                        handleOptionToggle(option, 'selectedPhysicalEducation')
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-gray-900">
                          {option.name}
                        </h5>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            option.cost === 'free'
                              ? 'bg-green-100 text-green-800'
                              : option.cost === 'low'
                                ? 'bg-blue-100 text-blue-800'
                                : option.cost === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {option.cost} cost
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {option.description}
                      </p>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span>Category: {option.category}</span>
                        <span>Duration: {option.duration}</span>
                        <span>Location: {option.location}</span>
                      </div>
                    </div>
                  </label>
                </div>
              )
            )}
          </div>
        </div>

        {/* Extracurricular Options */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">
            Extracurricular Activities
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {homeschoolingOptions?.extracurricular.map(
              (option: ExtracurricularOption) => (
                <div key={option.id} className="border rounded-lg p-4">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.selectedExtracurricular.some(
                        e => e.id === option.id
                      )}
                      onChange={() =>
                        handleOptionToggle(option, 'selectedExtracurricular')
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-gray-900">
                          {option.name}
                        </h5>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            option.cost === 'free'
                              ? 'bg-green-100 text-green-800'
                              : option.cost === 'low'
                                ? 'bg-blue-100 text-blue-800'
                                : option.cost === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {option.cost} cost
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {option.description}
                      </p>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span>Category: {option.category}</span>
                        <span>Frequency: {option.frequency}</span>
                        <span>Location: {option.location}</span>
                      </div>
                    </div>
                  </label>
                </div>
              )
            )}
          </div>
        </div>

        {/* Community Involvement Options */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">
            Community Involvement
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {homeschoolingOptions?.communityInvolvement.map(
              (option: CommunityInvolvementOption) => (
                <div key={option.id} className="border rounded-lg p-4">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.selectedCommunityInvolvement.some(
                        c => c.id === option.id
                      )}
                      onChange={() =>
                        handleOptionToggle(
                          option,
                          'selectedCommunityInvolvement'
                        )
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-gray-900">
                          {option.name}
                        </h5>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            option.cost === 'free'
                              ? 'bg-green-100 text-green-800'
                              : option.cost === 'low'
                                ? 'bg-blue-100 text-blue-800'
                                : option.cost === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {option.cost} cost
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {option.description}
                      </p>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span>Category: {option.category}</span>
                        <span>Frequency: {option.frequency}</span>
                        <span>Location: {option.location}</span>
                      </div>
                    </div>
                  </label>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderLearningPreferences = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Learning Preferences (Optional)
        </h3>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="learningStyle"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Learning Style
            </label>
            <select
              id="learningStyle"
              value={formData.learningStyle}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  learningStyle: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select learning style</option>
              {learningStyles.map(style => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="interests"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Interests & Hobbies
            </label>
            <textarea
              id="interests"
              value={formData.interests}
              onChange={e =>
                setFormData(prev => ({ ...prev, interests: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="e.g., Sports, Reading, Music, Art, Science, Technology..."
            />
          </div>

          <div>
            <label
              htmlFor="specialNeeds"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Special Learning Needs
            </label>
            <textarea
              id="specialNeeds"
              value={formData.specialNeeds}
              onChange={e =>
                setFormData(prev => ({ ...prev, specialNeeds: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Any special accommodations or learning requirements..."
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderDataSheetActivities = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Data Sheet Activity Categories
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Select activities for each category that will be tracked in your
          student's data sheets.
        </p>
      </div>

      {/* Sensory Activities */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">
          Sensory Activities
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sensoryActivities.map(activity => (
            <label
              key={activity}
              className="flex items-center space-x-3 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={formData.selectedSensoryActivities.includes(activity)}
                onChange={() =>
                  handleActivityToggle(activity, 'selectedSensoryActivities')
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{activity}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Writing Activities */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">
          Writing Activities
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {writingActivities.map(activity => (
            <label
              key={activity}
              className="flex items-center space-x-3 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={formData.selectedWritingActivities.includes(activity)}
                onChange={() =>
                  handleActivityToggle(activity, 'selectedWritingActivities')
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{activity}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Communication Activities */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">
          Communication Activities
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {communicationActivities.map(activity => (
            <label
              key={activity}
              className="flex items-center space-x-3 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={formData.selectedCommunicationActivities.includes(
                  activity
                )}
                onChange={() =>
                  handleActivityToggle(
                    activity,
                    'selectedCommunicationActivities'
                  )
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{activity}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Social Activities */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">
          Social Activities
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {socialActivities.map(activity => (
            <label
              key={activity}
              className="flex items-center space-x-3 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={formData.selectedSocialActivities.includes(activity)}
                onChange={() =>
                  handleActivityToggle(activity, 'selectedSocialActivities')
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{activity}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Motor Activities */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">
          Motor Activities
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {motorActivities.map(activity => (
            <label
              key={activity}
              className="flex items-center space-x-3 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={formData.selectedMotorActivities.includes(activity)}
                onChange={() =>
                  handleActivityToggle(activity, 'selectedMotorActivities')
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{activity}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Academic Activities */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">
          Academic Activities
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {academicActivities.map(activity => (
            <label
              key={activity}
              className="flex items-center space-x-3 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={formData.selectedAcademicActivities.includes(activity)}
                onChange={() =>
                  handleActivityToggle(activity, 'selectedAcademicActivities')
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{activity}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInformation();
      case 2:
        return renderSubjects();
      case 3:
        return renderHomeschoolingOptions();
      case 4:
        return renderDataSheetActivities();
      case 5:
        return renderLearningPreferences();

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {renderStepIndicator()}

      <form onSubmit={handleSubmit} className="space-y-6">
        {renderCurrentStep()}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={currentStep === 1 ? onCancel : prevStep}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            {currentStep === 1 ? 'Cancel' : 'Previous'}
          </motion.button>

          <div className="flex space-x-3">
            {currentStep < 5 ? (
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextStep}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Next
              </motion.button>
            ) : (
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Create Profile
              </motion.button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
