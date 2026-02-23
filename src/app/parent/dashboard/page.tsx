'use client';

import { useAuthContext } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CreateStudentForm from '@/components/parent/CreateStudentForm';
import { DataSheetsViewer } from '@/components/parent/DataSheetsViewer';
import TeacherCreationForm from '@/components/parent/TeacherCreationForm';
import TeacherQRCodes from '@/components/parent/TeacherQRCodes';
import StudentTeacherAssignment from '@/components/parent/StudentTeacherAssignment';
import { StudentProfile, TeacherProfile } from '@/types';
import { academicStandardsService } from '@/services/academic-standards.service';
import { DatabaseService } from '@/services/database.service';
import { TimesheetService, TimesheetEntry } from '@/services/timesheet.service';
import {
  LiquidLearningLayout,
  GlassHeader,
  LiquidButton,
} from '@/components/layouts/LiquidLearningLayout';
import { FloatingActionButton } from '@/design-system/components/interactive/FloatingActionButton';
import ParentDashboardHero from '@/components/parent/ParentDashboardHero';
import StudentMediaGallery from '@/components/parent/StudentMediaGallery';
import { Liquid3DOrb } from '@/components/ui/Liquid3DOrb';
import { supabase } from '@/lib/supabase';

// Dashboard Components
import {
  DashboardStats,
  StudentList,
  TeacherList,
  SessionsList,
} from '@/components/parent/dashboard';

interface DashboardStatsData {
  avgProgress: number;
  monthlyHours: number;
  studentProgress: {
    studentId: string;
    studentName: string;
    progress: number;
  }[];
}

export default function ParentDashboard() {
  const { user, logout } = useAuthContext();
  const router = useRouter();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [sessions, setSessions] = useState<TimesheetEntry[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStatsData>({
    avgProgress: 0,
    monthlyHours: 0,
    studentProgress: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
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

  // Active tab for dashboard sections
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions'>(
    'overview'
  );

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
      const [studentsData, teachersData, sessionsData] = await Promise.all([
        DatabaseService.getStudents(user.id),
        DatabaseService.getTeachers(user.id),
        TimesheetService.getParentTimesheet(user.id),
      ]);

      setStudents(studentsData);
      setTeachers(teachersData);
      setSessions(sessionsData);

      // Fetch real dashboard stats (avgProgress, monthlyHours)
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const statsResponse = await fetch(
          `/api/parent/dashboard?parentId=${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${session?.access_token || ''}`,
            },
          }
        );
        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          setDashboardStats({
            avgProgress: stats.avgProgress || 0,
            monthlyHours: stats.monthlyHours || 0,
            studentProgress: stats.studentProgress || [],
          });
        }
      } catch (statsErr) {
        console.error('Error loading dashboard stats:', statsErr);
        // Non-critical, continue with defaults
      }
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
        selectedSensoryActivities: formData.selectedSensoryActivities || [],
        selectedWritingActivities: formData.selectedWritingActivities || [],
        selectedCommunicationActivities:
          formData.selectedCommunicationActivities || [],
        selectedSocialActivities: formData.selectedSocialActivities || [],
        selectedMotorActivities: formData.selectedMotorActivities || [],
        selectedAcademicActivities: formData.selectedAcademicActivities || [],
        assignedTeachers: formData.assignedTeachers || [],
        teacherNotes: formData.teacherNotes || '',
        learningStyle: formData.learningStyle,
        specialNeeds: formData.specialNeeds,
        interests: formData.interests,
      };

      if (selectedStudent) {
        const updatedStudent = await DatabaseService.updateStudent(
          selectedStudent.id,
          studentData
        );

        if (updatedStudent) {
          setStudents(prev =>
            prev.map(s => (s.id === selectedStudent.id ? updatedStudent : s))
          );
          setShowCreateStudentModal(false);
          setSelectedStudent(null);
        } else {
          setError('Failed to update student. Please try again.');
        }
      } else {
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
      }
    } catch (err) {
      console.error('Error saving student:', err);
      setError('Failed to save student. Please try again.');
    }
  };

  const handleCreateTeacher = async (formData: any) => {
    if (!user?.id) {
      return;
    }

    try {
      const teacherData = {
        ...formData,
        experience_years: parseInt(formData.experience) || 0,
        hourlyRate: formData.hourlyRate || '0',
      };

      const newTeacher = await DatabaseService.createTeacher(
        teacherData,
        user.id
      );

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
    if (!window.confirm('Are you sure you want to delete this student?')) {
      return;
    }

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
    if (!window.confirm('Are you sure you want to delete this teacher?')) {
      return;
    }

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
    loadData();
  };

  const handleEditStudent = (student: StudentProfile) => {
    setSelectedStudent(student);
    setShowCreateStudentModal(true);
  };

  // Calculate stats
  const activeSessions = sessions.filter(s => s.status === 'checked_in').length;
  const totalSessionHours = Math.round(
    sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / 60
  );
  // Use real progress from datasheets (fetched from API)
  const avgProgress = dashboardStats.avgProgress;
  // Use monthly hours from API (filters to current month)
  const monthlyHours = dashboardStats.monthlyHours;

  // FAB actions
  const fabActions = [
    {
      id: 'add-student',
      icon: (
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
            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
          />
        </svg>
      ),
      label: 'Add Student',
      onClick: () => setShowCreateStudentModal(true),
      color: 'primary' as const,
    },
    {
      id: 'add-teacher',
      icon: (
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
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
      label: 'Add Teacher',
      onClick: () => setShowCreateTeacherModal(true),
      color: 'secondary' as const,
    },
    {
      id: 'manage-assignments',
      icon: (
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
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      label: 'Manage Assignments',
      onClick: () => setShowAssignmentModal(true),
      color: 'success' as const,
    },
  ];

  if (!user) {
    return (
      <LiquidLearningLayout variant="default" gradientTheme="primary">
        <div className="min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-slate-200/50"
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Access Denied
            </h1>
            <p className="text-slate-600 mb-6">
              Please log in to access the parent dashboard.
            </p>
            <LiquidButton
              variant="primary"
              onClick={() => router.push('/login')}
            >
              Go to Login
            </LiquidButton>
          </motion.div>
        </div>
      </LiquidLearningLayout>
    );
  }

  if (isLoading) {
    return (
      <LiquidLearningLayout variant="default" gradientTheme="primary">
        <div className="min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-sky-200 border-t-sky-500 animate-spin mx-auto" />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <svg
                  className="w-8 h-8 text-sky-600"
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
              </motion.div>
            </div>
            <p className="mt-6 text-slate-600 font-medium">
              Loading your dashboard...
            </p>
            <p className="text-sm text-slate-500 mt-2">Please wait a moment</p>
          </motion.div>
        </div>
      </LiquidLearningLayout>
    );
  }

  return (
    <LiquidLearningLayout
      variant="default"
      gradientTheme="primary"
      showMeshBackground
    >
      {/* Glass Header */}
      <GlassHeader>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <Liquid3DOrb
                  size="sm"
                  variant="primary"
                  theme="literacy"
                  interactive={true}
                  className="scale-125"
                >
                  <span className="text-xl">👨‍👩‍👧‍👦</span>
                </Liquid3DOrb>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                  Parent Dashboard
                </h1>
                <p className="text-sm text-slate-600">
                  Welcome back, {user.name}!
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                Home
              </button>
              <LiquidButton variant="primary" onClick={() => logout()}>
                Logout
              </LiquidButton>
            </div>
          </div>
        </div>
      </GlassHeader>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Hero */}
        <ParentDashboardHero
          parentName={user?.name}
          students={students.map(s => {
            // Get individual student progress from API data
            const studentData = dashboardStats.studentProgress.find(
              sp => sp.studentId === s.id
            );
            return {
              id: s.id,
              name: s.name,
              progress: studentData?.progress || 0,
              activeSession: sessions.some(
                sess => sess.student_id === s.id && sess.status === 'checked_in'
              ),
            };
          })}
          totalStudents={students.length}
          weeklyHours={monthlyHours}
          onAddStudent={() => setShowCreateStudentModal(true)}
          onViewProgress={() => setActiveTab('sessions')}
          className="mb-8"
        />

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 bg-red-50/90 backdrop-blur-sm border border-red-200/50 rounded-xl p-4 shadow-lg"
            >
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-red-500 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-red-700 font-medium flex-1">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-red-500 hover:text-red-700"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-8 bg-white/80 backdrop-blur-sm rounded-xl p-1 border border-slate-200/50 w-fit">
          {(['overview', 'sessions'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab === 'overview' ? 'Overview' : 'Sessions'}
              {tab === 'sessions' && activeSessions > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-500 text-white rounded-full">
                  {activeSessions}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Statistics Cards */}
        <DashboardStats
          totalStudents={students.length}
          totalTeachers={teachers.length}
          totalSessions={sessions.length}
          monthlyHours={`${monthlyHours}h`}
          avgProgress={avgProgress}
        />

        {/* Student Media Gallery - Netflix Style */}
        <StudentMediaGallery
          className="mb-8"
          students={students.map(s => ({ id: s.id, name: s.name }))}
          onUpload={() => {
            // TODO: Implement upload modal
            console.log('Upload media clicked');
          }}
        />

        {/* Content based on active tab */}
        {activeTab === 'overview' ? (
          <>
            {/* Students Section */}
            <StudentList
              students={students}
              onAddStudent={() => setShowCreateStudentModal(true)}
              onEditStudent={handleEditStudent}
              onDeleteStudent={handleDeleteStudent}
              onViewDataSheets={student => {
                setSelectedStudent(student);
                setShowDataSheetsModal(true);
              }}
              onAssignTeacher={student => {
                setSelectedStudent(student);
                setShowAssignmentModal(true);
              }}
            />

            {/* Teachers Section */}
            <TeacherList
              teachers={teachers}
              onAddTeacher={() => setShowCreateTeacherModal(true)}
              onViewQRCodes={handleViewTeacherQRCodes}
              onDeleteTeacher={handleDeleteTeacher}
            />
          </>
        ) : (
          /* Sessions Section */
          <SessionsList
            parentId={user.id}
            students={students}
            teachers={teachers}
          />
        )}
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton
        actions={fabActions}
        position="bottom-right"
        variant="solid"
        color="primary"
      />

      {/* Modals */}
      <AnimatePresence>
        {showCreateStudentModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                    {selectedStudent
                      ? 'Edit Student Profile'
                      : 'Create Student Profile'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateStudentModal(false);
                      setSelectedStudent(null);
                    }}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
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
                  initialData={selectedStudent}
                />
              </div>
            </motion.div>
          </div>
        )}

        {showCreateTeacherModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                    Create Teacher Profile
                  </h2>
                  <button
                    onClick={() => setShowCreateTeacherModal(false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
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
            </motion.div>
          </div>
        )}

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

        {showTeacherQRModal && selectedTeacherForQR && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900">
                    QR Codes for {selectedTeacherForQR.name}
                  </h2>
                  <button
                    onClick={() => setShowTeacherQRModal(false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
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
            </motion.div>
          </div>
        )}

        {showAssignmentModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Student-Teacher Assignments
                  </h2>
                  <button
                    onClick={() => {
                      setShowAssignmentModal(false);
                      setSelectedStudent(null);
                    }}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
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
                  preSelectedStudentId={selectedStudent?.id}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </LiquidLearningLayout>
  );
}
