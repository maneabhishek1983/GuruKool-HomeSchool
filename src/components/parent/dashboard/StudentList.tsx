'use client';

import { motion } from 'framer-motion';
import { StudentProfile } from '@/types';
import StudentProfileCard from '@/components/parent/StudentProfileCard';
import {
  LiquidButton,
  SectionTitle,
} from '@/components/layouts/LiquidLearningLayout';

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

interface StudentListProps {
  students: StudentProfile[];
  onAddStudent: () => void;
  onEditStudent: (student: StudentProfile) => void;
  onDeleteStudent: (studentId: string) => void;
  onViewDataSheets: (student: StudentProfile) => void;
  onAssignTeacher: (student: StudentProfile) => void;
}

export default function StudentList({
  students,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onViewDataSheets,
  onAssignTeacher,
}: StudentListProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <SectionTitle subtitle="Manage your children's learning profiles">
          Your Students
        </SectionTitle>
        {students.length > 0 && (
          <LiquidButton
            variant="primary"
            size="sm"
            icon={
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
            }
            onClick={onAddStudent}
          >
            Add Student
          </LiquidButton>
        )}
      </div>

      {students.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-12 text-center border border-slate-200/50"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-sky-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-sky-600"
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
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            No Students Yet
          </h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Get started by creating your first student profile. You'll be
            able to track their progress and manage their learning journey.
          </p>
          <LiquidButton
            variant="primary"
            size="lg"
            onClick={onAddStudent}
          >
            Create Your First Student
          </LiquidButton>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {students.map((student) => (
            <motion.div key={student.id} variants={itemVariants}>
              <StudentProfileCard
                student={student}
                onEdit={() => onEditStudent(student)}
                onDelete={() => onDeleteStudent(student.id)}
                onViewDataSheets={() => onViewDataSheets(student)}
                onAssignTeacher={() => onAssignTeacher(student)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
