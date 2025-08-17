'use client';

import { useAuthContext } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import CreateStudentForm from '@/components/parent/CreateStudentForm';
import StudentProfileCard from '@/components/parent/StudentProfileCard';
import { DataSheetsViewer } from '@/components/parent/DataSheetsViewer';
import { StudentProfile, Country } from '@/types';
import { academicStandardsService } from '@/services/academic-standards.service';

interface Teacher {
  id: string;
  name: string;
  email: string;
  subjects: string[];
  status: 'available' | 'assigned';
  hourlyRate?: number;
}

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
  const [teachers, setTeachers] = useState<Teacher[]>([
    {
      id: '1',
      name: 'John Teacher',
      email: 'john.teacher@example.com',
      subjects: ['Mathematics', 'Science'],
      status: 'assigned',
    },
    {
      id: '2',
      name: 'Sarah Wilson',
      email: 'sarah.wilson@example.com',
      subjects: ['English', 'History'],
      status: 'available',
    },
    {
      id: '3',
      name: 'Mike Brown',
      email: 'mike.brown@example.com',
      subjects: ['Mathematics', 'Physics'],
      status: 'available',
    },
  ]);

  const [showCreateStudentModal, setShowCreateStudentModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showDataSheetsModal, setShowDataSheetsModal] = useState(false);
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

  // Load demo students with academic standards
  useEffect(() => {
    const loadDemoStudents = () => {
      const demoStudents: StudentProfile[] = [
        {
          id: '1',
          name: 'Emma Johnson',
          age: 8,
          grade: 'Year 3',
          country: 'UK',
          academicStandard: academicStandardsService.getAcademicStandard('UK'),
          selectedSubjects: academicStandardsService
            .getSubjects('UK')
            .slice(0, 3),
          selectedSocialization: academicStandardsService
            .getSocializationOptions()
            .slice(0, 2),
          selectedPhysicalEducation: academicStandardsService
            .getPhysicalEducationOptions()
            .slice(0, 2),
          selectedExtracurricular: academicStandardsService
            .getExtracurricularOptions()
            .slice(0, 2),
          selectedCommunityInvolvement: academicStandardsService
            .getCommunityInvolvementOptions()
            .slice(0, 1),
          learningStyle: 'Visual',
          specialNeeds: '',
          interests: 'Art, Science, Reading',
          parentId: user?.id || 'parent-1',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Alex Chen',
          age: 10,
          grade: 'Grade 4',
          country: 'US',
          academicStandard: academicStandardsService.getAcademicStandard('US'),
          selectedSubjects: academicStandardsService
            .getSubjects('US')
            .slice(0, 4),
          selectedSocialization: academicStandardsService
            .getSocializationOptions()
            .slice(0, 1),
          selectedPhysicalEducation: academicStandardsService
            .getPhysicalEducationOptions()
            .slice(0, 3),
          selectedExtracurricular: academicStandardsService
            .getExtracurricularOptions()
            .slice(0, 3),
          selectedCommunityInvolvement: academicStandardsService
            .getCommunityInvolvementOptions()
            .slice(0, 2),
          learningStyle: 'Kinesthetic',
          specialNeeds: '',
          interests: 'Sports, Technology, Music',
          parentId: user?.id || 'parent-1',
          createdAt: new Date('2024-01-20'),
          updatedAt: new Date(),
        },
      ];
      setStudents(demoStudents);
    };

    loadDemoStudents();
  }, [user?.id]);

  const handleCreateStudent = (formData: any) => {
    // Convert form data to StudentProfile format
    const newStudent: StudentProfile = {
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
      parentId: user?.id || 'parent-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setStudents(prev => [...prev, newStudent]);
    setShowCreateStudentModal(false);
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudents(prev => prev.filter(student => student.id !== studentId));
  };

  const handleEditStudent = (student: StudentProfile) => {
    setSelectedStudent(student);
    setShowCreateStudentModal(true);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Parent Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Welcome back, {user.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user.email}
                </p>
                <p className="text-xs text-gray-500">Parent</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <button
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
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
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Assigned Teachers
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {teachers.filter(t => t.status === 'assigned').length}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">24h</p>
              </div>
            </div>
          </motion.div>
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

        {/* Academic Standards Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm border"
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
                <h3 className="font-medium text-gray-900 mb-2">
                  UK Curriculum
                </h3>
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
                <h3 className="font-medium text-gray-900 mb-2">
                  India NEP 2020
                </h3>
                <p className="text-sm text-gray-600">
                  National Education Policy with Foundation through Higher
                  Secondary
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

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
          {/* Teacher Timesheet Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-8 bg-white rounded-lg shadow-sm border"
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
                    This Month's Hours
                  </h3>
                  <div className="space-y-3">
                    {teachers
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
                      ))}
                  </div>
                </div>

                {/* Recent Sessions */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">
                    Recent Sessions
                  </h3>
                  <div className="space-y-3">
                    {[
                      {
                        teacher: 'John Teacher',
                        student: 'Emma Johnson',
                        subject: 'Mathematics',
                        date: '2024-01-15',
                        duration: '2h',
                      },
                      {
                        teacher: 'Sarah Wilson',
                        student: 'Alex Chen',
                        subject: 'English',
                        date: '2024-01-14',
                        duration: '1.5h',
                      },
                      {
                        teacher: 'John Teacher',
                        student: 'Emma Johnson',
                        subject: 'Science',
                        date: '2024-01-13',
                        duration: '2h',
                      },
                    ].map((session, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {session.teacher}
                          </p>
                          <p className="text-sm text-gray-600">
                            {session.student} - {session.subject}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {session.duration}
                          </p>
                          <p className="text-xs text-gray-500">
                            {session.date}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          {/* Teacher Timesheet Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-8 bg-white rounded-lg shadow-sm border"
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
                    This Month's Hours
                  </h3>
                  <div className="space-y-3">
                    {teachers
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
                      ))}
                  </div>
                </div>

                {/* Recent Sessions */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">
                    Recent Sessions
                  </h3>
                  <div className="space-y-3">
                    {[
                      {
                        teacher: 'John Teacher',
                        student: 'Emma Johnson',
                        subject: 'Mathematics',
                        date: '2024-01-15',
                        duration: '2h',
                      },
                      {
                        teacher: 'Sarah Wilson',
                        student: 'Alex Chen',
                        subject: 'English',
                        date: '2024-01-14',
                        duration: '1.5h',
                      },
                      {
                        teacher: 'John Teacher',
                        student: 'Emma Johnson',
                        subject: 'Science',
                        date: '2024-01-13',
                        duration: '2h',
                      },
                    ].map((session, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {session.teacher}
                          </p>
                          <p className="text-sm text-gray-600">
                            {session.student} - {session.subject}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {session.duration}
                          </p>
                          <p className="text-xs text-gray-500">
                            {session.date}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          {/* Teacher Timesheet Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-8 bg-white rounded-lg shadow-sm border"
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
                    This Month's Hours
                  </h3>
                  <div className="space-y-3">
                    {teachers
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
                      ))}
                  </div>
                </div>

                {/* Recent Sessions */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">
                    Recent Sessions
                  </h3>
                  <div className="space-y-3">
                    {[
                      {
                        teacher: 'John Teacher',
                        student: 'Emma Johnson',
                        subject: 'Mathematics',
                        date: '2024-01-15',
                        duration: '2h',
                      },
                      {
                        teacher: 'Sarah Wilson',
                        student: 'Alex Chen',
                        subject: 'English',
                        date: '2024-01-14',
                        duration: '1.5h',
                      },
                      {
                        teacher: 'John Teacher',
                        student: 'Emma Johnson',
                        subject: 'Science',
                        date: '2024-01-13',
                        duration: '2h',
                      },
                    ].map((session, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {session.teacher}
                          </p>
                          <p className="text-sm text-gray-600">
                            {session.student} - {session.subject}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {session.duration}
                          </p>
                          <p className="text-xs text-gray-500">
                            {session.date}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>{' '}
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
    </div>
  );
}
