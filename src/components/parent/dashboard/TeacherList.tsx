'use client';

import { motion } from 'framer-motion';
import { TeacherProfile } from '@/types';
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

interface TeacherListProps {
  teachers: TeacherProfile[];
  onAddTeacher: () => void;
  onViewQRCodes: (teacher: TeacherProfile) => void;
  onDeleteTeacher: (teacherId: string) => void;
}

export default function TeacherList({
  teachers,
  onAddTeacher,
  onViewQRCodes,
  onDeleteTeacher,
}: TeacherListProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <SectionTitle subtitle="Manage your teaching team">
          Your Teachers
        </SectionTitle>
        {teachers.length > 0 && (
          <LiquidButton
            variant="secondary"
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
            onClick={onAddTeacher}
          >
            Add Teacher
          </LiquidButton>
        )}
      </div>

      {teachers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-12 text-center border border-slate-200/50"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-violet-600"
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
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            No Teachers Yet
          </h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Add teacher profiles to provide specialized instruction for your
            students.
          </p>
          <LiquidButton
            variant="secondary"
            size="lg"
            onClick={onAddTeacher}
          >
            Add Your First Teacher
          </LiquidButton>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {teachers.map((teacher) => (
            <motion.div
              key={teacher.id}
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-violet-500/25">
                    {teacher.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {teacher.name}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {teacher.email}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="text-sm">
                  <p className="text-slate-600 font-medium">Subjects:</p>
                  <p className="text-slate-900">
                    {teacher.subjects.join(', ')}
                  </p>
                </div>
                {teacher.hourlyRate && (
                  <div className="text-sm">
                    <p className="text-slate-600 font-medium">Rate:</p>
                    <p className="text-slate-900">
                      ${teacher.hourlyRate}/hour
                    </p>
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onViewQRCodes(teacher)}
                  className="flex-1 px-3 py-2 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition-colors text-sm font-medium"
                >
                  View QR
                </button>
                <button
                  onClick={() => onDeleteTeacher(teacher.id)}
                  className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
