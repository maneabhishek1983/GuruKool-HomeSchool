'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DatabaseService } from '@/services/database.service';
import { StudentProfile, TeacherProfile } from '@/types';

interface StudentTeacherAssignmentProps {
  parentId: string;
  students: StudentProfile[];
  teachers: TeacherProfile[];
  onAssignmentChange: () => void;
  preSelectedStudentId?: string | undefined;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  subjects: string[];
  status: 'available' | 'assigned';
  hourlyRate?: number;
}

export default function StudentTeacherAssignment({
  parentId,
  students,
  teachers,
  onAssignmentChange,
  preSelectedStudentId,
}: StudentTeacherAssignmentProps) {
  const [selectedStudent, setSelectedStudent] = useState<string>(
    preSelectedStudentId || ''
  );
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [studentAssignments, setStudentAssignments] = useState<{
    [studentId: string]: string[];
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssignments();
  }, [students]);

  // Update selected student when preSelectedStudentId changes
  useEffect(() => {
    if (preSelectedStudentId) {
      setSelectedStudent(preSelectedStudentId);
    }
  }, [preSelectedStudentId]);

  const loadAssignments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const assignments: { [studentId: string]: string[] } = {};

      for (const student of students) {
        const teacherIds = await DatabaseService.getStudentAssignments(
          student.id
        );
        assignments[student.id] = teacherIds;
      }

      setStudentAssignments(assignments);
    } catch (err) {
      console.error('Error loading assignments:', err);
      setError('Failed to load assignments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignTeacher = async () => {
    if (!selectedStudent || !selectedTeacher) {
      setError('Please select both a student and a teacher');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await DatabaseService.assignTeacherToStudent(
        selectedTeacher,
        selectedStudent,
        parentId
      );

      if (success) {
        await loadAssignments();
        onAssignmentChange();
        setSelectedStudent('');
        setSelectedTeacher('');
      } else {
        setError('Failed to assign teacher to student');
      }
    } catch (err) {
      console.error('Error assigning teacher:', err);
      setError('Failed to assign teacher to student');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnassignTeacher = async (
    studentId: string,
    teacherId: string
  ) => {
    if (window.confirm('Are you sure you want to unassign this teacher?')) {
      setIsLoading(true);
      setError(null);

      try {
        const success = await DatabaseService.unassignTeacherFromStudent(
          teacherId,
          studentId,
          parentId
        );

        if (success) {
          await loadAssignments();
          onAssignmentChange();
        } else {
          setError('Failed to unassign teacher from student');
        }
      } catch (err) {
        console.error('Error unassigning teacher:', err);
        setError('Failed to unassign teacher from student');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? teacher.name : 'Unknown Teacher';
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : 'Unknown Student';
  };

  if (students.length === 0 || teachers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
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
          No Assignments Available
        </h3>
        <p className="text-gray-600">
          {students.length === 0
            ? 'Create students first to assign teachers.'
            : 'Create teachers first to assign to students.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Student-Teacher Assignments
        </h3>
        <button
          onClick={loadAssignments}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
          disabled={isLoading}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Assignment Form */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h4 className="font-medium text-gray-900 mb-4">
          Assign Teacher to Student
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Student
            </label>
            <select
              value={selectedStudent}
              onChange={e => setSelectedStudent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              disabled={isLoading}
            >
              <option value="">Choose a student...</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name} (Age: {student.age}, Grade: {student.grade})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Teacher
            </label>
            <select
              value={selectedTeacher}
              onChange={e => setSelectedTeacher(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              disabled={isLoading}
            >
              <option value="">Choose a teacher...</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} ({teacher.subjects.join(', ')})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleAssignTeacher}
          disabled={!selectedStudent || !selectedTeacher || isLoading}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Assigning...' : 'Assign Teacher to Student'}
        </button>
      </div>

      {/* Current Assignments */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">Current Assignments</h4>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading assignments...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {students.map(student => {
                const assignedTeachers = studentAssignments[student.id] || [];

                return (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-900">
                        {student.name} (Age: {student.age}, Grade:{' '}
                        {student.grade})
                      </h5>
                      <span className="text-sm text-gray-500">
                        {assignedTeachers.length} teacher(s) assigned
                      </span>
                    </div>

                    {assignedTeachers.length === 0 ? (
                      <p className="text-gray-500 text-sm">
                        No teachers assigned
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {assignedTeachers.map(teacherId => (
                          <div
                            key={teacherId}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                          >
                            <div>
                              <p className="font-medium text-gray-900">
                                {getTeacherName(teacherId)}
                              </p>
                              <p className="text-sm text-gray-600">
                                {teachers
                                  .find(t => t.id === teacherId)
                                  ?.subjects.join(', ')}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                handleUnassignTeacher(student.id, teacherId)
                              }
                              disabled={isLoading}
                              className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                            >
                              Unassign
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
