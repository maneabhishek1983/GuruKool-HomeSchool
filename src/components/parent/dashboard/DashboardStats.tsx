'use client';

import { motion } from 'framer-motion';
import { GlassStatCard } from '@/components/layouts/LiquidLearningLayout';
import { StudentProfile, TeacherProfile } from '@/types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface DashboardStatsProps {
  totalStudents: number;
  totalTeachers: number;
  totalSessions: number;
  monthlyHours: string;
  avgProgress: number;
  students?: StudentProfile[];
  teachers?: TeacherProfile[];
  onAssignTeacher?: (student: StudentProfile) => void;
}

export default function DashboardStats({
  totalStudents,
  totalTeachers,
  totalSessions,
  monthlyHours,
  avgProgress,
  students = [],
  teachers = [],
  onAssignTeacher,
}: DashboardStatsProps) {
  // Calculate insightful stats
  const studentsWithoutTeachers = students.filter(
    s => !s.assignedTeachers || s.assignedTeachers.length === 0
  );
  const studentsWithTeachers = students.filter(
    s => s.assignedTeachers && s.assignedTeachers.length > 0
  );
  const totalAssignments = students.reduce(
    (sum, s) => sum + (s.assignedTeachers?.length || 0),
    0
  );

  return (
    <div className="space-y-6 mb-8">
      {/* Main Stats Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
      >
        <motion.div variants={itemVariants}>
          <GlassStatCard
            title="Total Students"
            value={totalStudents}
            color="primary"
            icon={
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
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            }
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <GlassStatCard
            title="Active Teachers"
            value={totalTeachers}
            color="secondary"
            icon={
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
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            }
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <GlassStatCard
            title="Sessions"
            value={totalSessions}
            color="secondary"
            icon={
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            }
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <GlassStatCard
            title="This Month"
            value={monthlyHours}
            color="success"
            icon={
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <GlassStatCard
            title="Avg Progress"
            value={`${avgProgress}%`}
            color="warning"
            trend="up"
            trendValue="+5% this week"
            icon={
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            }
          />
        </motion.div>
      </motion.div>

      {/* Quick Insights Section */}
      {students.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {/* Assignment Overview */}
          <div className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-slate-200/50 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-700">
                Teacher Assignments
              </h4>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                {totalAssignments} total
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Students with teachers</span>
                <span className="font-medium text-emerald-600">
                  {studentsWithTeachers.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  Students without teachers
                </span>
                <span
                  className={`font-medium ${studentsWithoutTeachers.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}
                >
                  {studentsWithoutTeachers.length}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width:
                      students.length > 0
                        ? `${(studentsWithTeachers.length / students.length) * 100}%`
                        : '0%',
                  }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {students.length > 0
                  ? `${Math.round((studentsWithTeachers.length / students.length) * 100)}% of students have assigned teachers`
                  : 'No students yet'}
              </p>
            </div>
          </div>

          {/* Students Needing Attention */}
          {studentsWithoutTeachers.length > 0 && (
            <div className="bg-amber-50/80 backdrop-blur-xl rounded-xl p-4 border border-amber-200/50 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <svg
                  className="w-5 h-5 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <h4 className="text-sm font-semibold text-amber-800">
                  Needs Attention
                </h4>
              </div>
              <p className="text-sm text-amber-700 mb-3">
                {studentsWithoutTeachers.length} student
                {studentsWithoutTeachers.length > 1 ? 's need' : ' needs'} a
                teacher assigned
              </p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {studentsWithoutTeachers.slice(0, 3).map(student => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-amber-200 rounded-full flex items-center justify-center text-amber-800 text-xs font-medium">
                        {student.name.charAt(0)}
                      </div>
                      <span className="text-sm text-amber-900 truncate max-w-[120px]">
                        {student.name}
                      </span>
                    </div>
                    {onAssignTeacher && (
                      <button
                        onClick={() => onAssignTeacher(student)}
                        className="text-xs text-amber-700 hover:text-amber-900 font-medium hover:underline"
                      >
                        Assign
                      </button>
                    )}
                  </div>
                ))}
                {studentsWithoutTeachers.length > 3 && (
                  <p className="text-xs text-amber-600 text-center">
                    +{studentsWithoutTeachers.length - 3} more
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Teacher Utilization */}
          {teachers.length > 0 && (
            <div className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-slate-200/50 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-slate-700">
                  Teacher Overview
                </h4>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                  {teachers.length} active
                </span>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {teachers.slice(0, 4).map(teacher => {
                  const assignedStudentCount = students.filter(s =>
                    s.assignedTeachers?.includes(teacher.id)
                  ).length;
                  return (
                    <div
                      key={teacher.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 text-xs font-medium">
                          {teacher.name.charAt(0)}
                        </div>
                        <span className="text-slate-700 truncate max-w-[120px]">
                          {teacher.name}
                        </span>
                      </div>
                      <span className="text-slate-500">
                        {assignedStudentCount} student
                        {assignedStudentCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  );
                })}
                {teachers.length > 4 && (
                  <p className="text-xs text-slate-500 text-center">
                    +{teachers.length - 4} more teachers
                  </p>
                )}
              </div>
            </div>
          )}

          {/* All students assigned - success state */}
          {studentsWithoutTeachers.length === 0 &&
            students.length > 0 &&
            teachers.length === 0 && (
              <div className="bg-slate-50/80 backdrop-blur-xl rounded-xl p-4 border border-slate-200/50 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-5 h-5 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h4 className="text-sm font-semibold text-slate-700">
                    Get Started
                  </h4>
                </div>
                <p className="text-sm text-slate-600">
                  Add teachers to start assigning them to your students.
                </p>
              </div>
            )}

          {studentsWithoutTeachers.length === 0 &&
            students.length > 0 &&
            teachers.length > 0 && (
              <div className="bg-emerald-50/80 backdrop-blur-xl rounded-xl p-4 border border-emerald-200/50 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-5 h-5 text-emerald-600"
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
                  <h4 className="text-sm font-semibold text-emerald-800">
                    All Set!
                  </h4>
                </div>
                <p className="text-sm text-emerald-700">
                  All students have teachers assigned. Great job!
                </p>
              </div>
            )}
        </motion.div>
      )}
    </div>
  );
}
