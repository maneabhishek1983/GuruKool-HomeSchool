'use client';

import { useAuthContext } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { NetflixDashboard } from '@/components/NetflixDashboard';
import { NetflixButton, NetflixCard } from '@/components/NetflixBackground';
import CreateStudentForm from '@/components/parent/CreateStudentForm';
import StudentProfileCard from '@/components/parent/StudentProfileCard';
import { DataSheetsViewer } from '@/components/parent/DataSheetsViewer';
import TeacherCreationForm from '@/components/parent/TeacherCreationForm';
import TeacherQRCodes from '@/components/parent/TeacherQRCodes';
import StudentTeacherAssignment from '@/components/parent/StudentTeacherAssignment';
import { StudentProfile, Country, TeacherProfile } from '@/types';
import { academicStandardsService } from '@/services/academic-standards.service';
import { DatabaseService } from '@/services/database.service';

// Use TeacherProfile type directly instead of Teacher interface

interface TimesheetEntry {
  id: string;
  teacherId: string;
  teacherName: string;
  studentId: string;
  studentName: string;
  subject: string;
  date: Date;
  startTime: string;
  endTime: string;
  hours: number;
  description: string;
  status: 'completed' | 'scheduled' | 'cancelled';
}

interface TimesheetSummary {
  daily: { [date: string]: number };
  weekly: { [week: string]: number };
  monthly: { [month: string]: number };
  total: number;
}

export default function ParentDashboard() {
  const { user, logout } = useAuthContext();
  const router = useRouter();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateStudentModal, setShowCreateStudentModal] = useState(false);
  const [showCreateTeacherModal, setShowCreateTeacherModal] = useState(false);
  const [showDataSheetsModal, setShowDataSheetsModal] = useState(false);
  const [showTeacherQRModal, setShowTeacherQRModal] = useState(false);
  const [selectedTeacherForQR, setSelectedTeacherForQR] =
    useState<TeacherProfile | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(
    null
  );
  const [timesheetData, setTimesheetData] = useState<TimesheetEntry[]>([]);
  const [timesheetSummary, setTimesheetSummary] = useState<TimesheetSummary>({
    daily: {},
    weekly: {},
    monthly: {},
    total: 0,
  });

  // Load data from database on component mount
  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Load students and teachers in parallel
      const [studentsData, teachersData] = await Promise.all([
        DatabaseService.getStudents(user.id),
        DatabaseService.getTeachers(user.id),
      ]);

      setStudents(studentsData);
      setTeachers(teachersData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try refreshing the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStudent = async (formData: any) => {
    if (!user?.id) {
      return;
    }

    try {
      // Convert form data to StudentProfile format
      const studentData: Partial<StudentProfile> = {
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
        // Data Sheet Activity Categories
        selectedSensoryActivities: formData.selectedSensoryActivities || [],
        selectedWritingActivities: formData.selectedWritingActivities || [],
        selectedCommunicationActivities:
          formData.selectedCommunicationActivities || [],
        selectedSocialActivities: formData.selectedSocialActivities || [],
        selectedMotorActivities: formData.selectedMotorActivities || [],
        selectedAcademicActivities: formData.selectedAcademicActivities || [],
        // Teacher Assignment
        assignedTeachers: formData.assignedTeachers || [],
        teacherNotes: formData.teacherNotes || '',
        learningStyle: formData.learningStyle,
        specialNeeds: formData.specialNeeds,
        interests: formData.interests,
      };

      const newStudent = await DatabaseService.createStudent(
        studentData,
        user.id
      );

      if (newStudent) {
        setStudents(prev => [newStudent, ...prev]);
        setShowCreateStudentModal(false);
      } else {
        setError('Failed to create student. Please try again.');
      }
    } catch (err) {
      console.error('Error creating student:', err);
      setError('Failed to create student. Please try again.');
    }
  };

  const handleCreateTeacher = async (formData: any) => {
    if (!user?.id) {
      return;
    }

    try {
      const newTeacher = await DatabaseService.createTeacher(formData, user.id);

      if (newTeacher) {
        setTeachers(prev => [newTeacher, ...prev]);
        setShowCreateTeacherModal(false);
      } else {
        setError('Failed to create teacher. Please try again.');
      }
    } catch (err) {
      console.error('Error creating teacher:', err);
      setError('Failed to create teacher. Please try again.');
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      const success = await DatabaseService.deleteStudent(studentId);

      if (success) {
        setStudents(prev => prev.filter(student => student.id !== studentId));
      } else {
        setError('Failed to delete student. Please try again.');
      }
    } catch (err) {
      console.error('Error deleting student:', err);
      setError('Failed to delete student. Please try again.');
    }
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    try {
      const success = await DatabaseService.deleteTeacher(teacherId);

      if (success) {
        setTeachers(prev => prev.filter(teacher => teacher.id !== teacherId));
      } else {
        setError('Failed to delete teacher. Please try again.');
      }
    } catch (err) {
      console.error('Error deleting teacher:', err);
      setError('Failed to delete teacher. Please try again.');
    }
  };

  const handleViewTeacherQRCodes = (teacher: TeacherProfile) => {
    setSelectedTeacherForQR(teacher);
    setShowTeacherQRModal(true);
  };

  const handleAssignmentChange = () => {
    // Refresh data when assignments change
    loadData();
  };

  const handleEditStudent = (student: StudentProfile) => {
    setSelectedStudent(student);
    setShowCreateStudentModal(true);
  };

  const handleClearAllData = async () => {
    if (
      window.confirm(
        'Are you sure you want to clear all student and teacher data? This action cannot be undone.'
      )
    ) {
      try {
        // Delete all students and teachers for this parent
        const deletePromises = [
          ...students.map(student => DatabaseService.deleteStudent(student.id)),
          ...teachers.map(teacher => DatabaseService.deleteTeacher(teacher.id)),
        ];

        await Promise.all(deletePromises);

        setStudents([]);
        setTeachers([]);
      } catch (err) {
        console.error('Error clearing data:', err);
        setError('Failed to clear data. Please try again.');
      }
    }
  };

  const handleClearStudents = async () => {
    if (
      window.confirm(
        'Are you sure you want to clear all student data? This action cannot be undone.'
      )
    ) {
      try {
        const deletePromises = students.map(student =>
          DatabaseService.deleteStudent(student.id)
        );

        await Promise.all(deletePromises);
        setStudents([]);
      } catch (err) {
        console.error('Error clearing students:', err);
        setError('Failed to clear students. Please try again.');
      }
    }
  };

  const handleClearTeachers = async () => {
    if (
      window.confirm(
        'Are you sure you want to clear all teacher data? This action cannot be undone.'
      )
    ) {
      try {
        const deletePromises = teachers.map(teacher =>
          DatabaseService.deleteTeacher(teacher.id)
        );

        await Promise.all(deletePromises);
        setTeachers([]);
      } catch (err) {
        console.error('Error clearing teachers:', err);
        setError('Failed to clear teachers. Please try again.');
      }
    }
  };

  const getCountryFlag = (country: Country) => {
    const flags = {
      UK: '🇬🇧',
      US: '🇺🇸',
      India: '🇮🇳',
    };
    return flags[country] || '🌍';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600">
            Please log in to access the parent dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <NetflixDashboard
      title="Parent Dashboard"
      subtitle={`Welcome back, ${user.name}`}
    >
      {/* Header Actions */}
      <div className="flex flex-wrap gap-4 mb-8">
        <NetflixButton
          onClick={() => setShowCreateStudentModal(true)}
          size="lg"
        >
          Add Student
        </NetflixButton>

        <NetflixButton
          onClick={() => setShowCreateTeacherModal(true)}
          size="lg"
          variant="secondary"
        >
          Add Teacher
        </NetflixButton>

        <NetflixButton
          onClick={() => setShowDataSheetsModal(true)}
          size="lg"
          variant="secondary"
        >
          View Data Sheets
        </NetflixButton>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <NetflixCard className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
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
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Students
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {students.length}
              </p>
            </div>
          </div>
        </NetflixCard>

        <NetflixCard className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Average Progress
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {students.length > 0
                  ? Math.round(
                      students.reduce((acc, student) => acc + 85, 0) /
                        students.length
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        </NetflixCard>

        <NetflixCard className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
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
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Assigned Teachers
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {teachers.filter(t => t.status === 'assigned').length}
              </p>
            </div>
          </div>
        </NetflixCard>

        <NetflixCard className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">24h</p>
              <p className="text-xs text-gray-500">Total hours</p>
            </div>
          </div>
        </NetflixCard>
      </div>

      {/* Data Management Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Data Management
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleClearAllData}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
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
            <span>Clear All Data</span>
          </button>
          <button
            onClick={handleClearStudents}
            className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors flex items-center space-x-2"
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
            <span>Clear Students</span>
          </button>
          <button
            onClick={handleClearTeachers}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
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
            <span>Clear Teachers</span>
          </button>
        </div>
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Student data: {students.length > 0 ? 'Persisted' : 'Not persisted'}
          </p>
          <p>
            Teacher data: {teachers.length > 0 ? 'Persisted' : 'Not persisted'}
          </p>
        </div>
      </div>

      {/* Student Management Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            Student Profiles
          </h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateStudentModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span>Add Student</span>
          </motion.button>
        </div>

        {students.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg shadow-sm border p-12 text-center"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Students Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first student profile to get started with
              homeschooling.
            </p>
            <button
              onClick={() => setShowCreateStudentModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create First Student
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {students.map((student, index) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <StudentProfileCard
                  student={student}
                  onEdit={() => handleEditStudent(student)}
                  onDelete={() => handleDeleteStudent(student.id)}
                  onViewDataSheets={() => {
                    setSelectedStudent(student);
                    setShowDataSheetsModal(true);
                  }}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Teacher Management Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            Teacher Management
          </h2>
          <div className="flex space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAssignmentModal(true)}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>Manage Assignments</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateTeacherModal(true)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span>Add Teacher</span>
            </motion.button>
          </div>
        </div>

        {teachers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg shadow-sm border p-12 text-center"
          >
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-purple-600"
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
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Teachers Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create teacher profiles to assign to your students for specialized
              instruction.
            </p>
            <button
              onClick={() => setShowCreateTeacherModal(true)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Create First Teacher
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {teachers.map((teacher, index) => (
              <motion.div
                key={teacher.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-sm border p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
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
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {teacher.name}
                      </h3>
                      <p className="text-sm text-gray-600">{teacher.email}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      teacher.status === 'available'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {teacher.status}
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Subjects:
                    </p>
                    <p className="text-sm text-gray-600">
                      {teacher.subjects.join(', ')}
                    </p>
                  </div>
                  {teacher.hourlyRate && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Hourly Rate:
                      </p>
                      <p className="text-sm text-gray-600">
                        ${teacher.hourlyRate}/hour
                      </p>
                    </div>
                  )}
                  <div className="pt-2 space-y-2">
                    <button
                      onClick={() => handleViewTeacherQRCodes(teacher)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium block"
                    >
                      View QR Codes
                    </button>
                    <button
                      onClick={() => handleDeleteTeacher(teacher.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium block"
                    >
                      Delete Teacher
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Teacher Timesheet Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-white rounded-lg shadow-sm border"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Teacher Timesheet & Progress
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Timesheet Summary */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">
                This Month&apos;s Hours
              </h3>
              <div className="space-y-3">
                {teachers.filter(t => t.status === 'assigned').length > 0 ? (
                  teachers
                    .filter(t => t.status === 'assigned')
                    .map((teacher, index) => (
                      <div
                        key={teacher.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {teacher.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {teacher.subjects.join(', ')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-blue-600">
                            {24 + index * 2}h
                          </p>
                          <p className="text-xs text-gray-500">This month</p>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No assigned teachers</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Teacher hours will appear here once teachers are assigned
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Sessions */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">
                Recent Sessions
              </h3>
              <div className="space-y-3">
                <div className="text-center py-8">
                  <p className="text-gray-500">No recent sessions</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Sessions will appear here once teachers are assigned
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Academic Standards Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white rounded-lg shadow-sm border mt-8"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Academic Standards Support
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🇬🇧</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">UK Curriculum</h3>
              <p className="text-sm text-gray-600">
                National Curriculum for England with Reception through Year 11
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🇺🇸</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">US Standards</h3>
              <p className="text-sm text-gray-600">
                Common Core State Standards with Kindergarten through Grade 12
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🇮🇳</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">India NEP 2020</h3>
              <p className="text-sm text-gray-600">
                National Education Policy with Foundation through Higher
                Secondary
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Create Student Modal */}
      {showCreateStudentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {selectedStudent
                    ? 'Edit Student Profile'
                    : 'Create Student Profile'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateStudentModal(false);
                    setSelectedStudent(null);
                  }}
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
                onCancel={() => {
                  setShowCreateStudentModal(false);
                  setSelectedStudent(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Create Teacher Modal */}
      {showCreateTeacherModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Create Teacher Profile
                </h2>
                <button
                  onClick={() => setShowCreateTeacherModal(false)}
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
              <TeacherCreationForm
                onSubmit={handleCreateTeacher}
                onCancel={() => setShowCreateTeacherModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Data Sheets Modal */}
      {showDataSheetsModal && selectedStudent && (
        <DataSheetsViewer
          studentId={selectedStudent.id}
          studentName={selectedStudent.name}
          onClose={() => {
            setShowDataSheetsModal(false);
            setSelectedStudent(null);
          }}
        />
      )}

      {/* Teacher QR Codes Modal */}
      {showTeacherQRModal && selectedTeacherForQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                QR Codes for {selectedTeacherForQR.name}
              </h2>
              <button
                onClick={() => setShowTeacherQRModal(false)}
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
            <TeacherQRCodes
              teacherId={selectedTeacherForQR.id}
              parentId={user?.id || ''}
            />
          </div>
        </div>
      )}

      {/* Student-Teacher Assignment Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Student-Teacher Assignments
              </h2>
              <button
                onClick={() => setShowAssignmentModal(false)}
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
            <StudentTeacherAssignment
              parentId={user?.id || ''}
              students={students}
              teachers={teachers}
              onAssignmentChange={handleAssignmentChange}
            />
          </div>
        </div>
      )}
    </NetflixDashboard>
  );
}
