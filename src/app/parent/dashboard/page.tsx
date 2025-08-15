'use client';

import { useAuthContext } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Student {
  id: string;
  name: string;
  age: number;
  grade: string;
  subjects: string[];
  teacher?: string;
  progress: number;
  createdAt: Date;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  subjects: string[];
  status: 'available' | 'assigned';
}

export default function ParentDashboard() {
  const { user, logout } = useAuthContext();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([
    {
      id: '1',
      name: 'Emma Johnson',
      age: 8,
      grade: 'Grade 3',
      subjects: ['Mathematics', 'English', 'Science'],
      teacher: 'John Teacher',
      progress: 75,
      createdAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      name: 'James Johnson',
      age: 10,
      grade: 'Grade 5',
      subjects: ['Mathematics', 'English', 'Science', 'History'],
      progress: 82,
      createdAt: new Date('2024-01-20'),
    },
  ]);

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
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const [newStudent, setNewStudent] = useState({
    name: '',
    age: 0,
    grade: '',
    subjects: [] as string[],
  });

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else if (user.role !== 'parent') {
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleCreateStudent = () => {
    if (newStudent.name && newStudent.age && newStudent.grade) {
      const student: Student = {
        id: Date.now().toString(),
        name: newStudent.name,
        age: newStudent.age,
        grade: newStudent.grade,
        subjects: newStudent.subjects,
        progress: 0,
        createdAt: new Date(),
      };
      setStudents([...students, student]);
      setNewStudent({ name: '', age: 0, grade: '', subjects: [] });
      setShowCreateStudentModal(false);
      alert(`Student ${student.name} created successfully!`);
    } else {
      alert('Please fill in all required fields');
    }
  };

  const handleAssignTeacher = (studentId: string, teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    const updatedStudents = students.map(s =>
      s.id === studentId ? { ...s, teacher: teacher?.name } : s
    );
    setStudents(updatedStudents);

    const updatedTeachers = teachers.map(t =>
      t.id === teacherId ? { ...t, status: 'assigned' as const } : t
    );
    setTeachers(updatedTeachers);

    alert(`Teacher ${teacher?.name} assigned to student successfully!`);
  };

  const handleButtonClick = (action: string) => {
    switch (action) {
      case 'manage-students':
        setShowCreateStudentModal(true);
        break;
      case 'view-progress':
        setShowProgressModal(true);
        break;
      case 'manage-teachers':
        setShowTeacherModal(true);
        break;
      case 'view-insights':
        setShowInsightsModal(true);
        break;
      case 'open-messages':
        setShowMessagesModal(true);
        break;
      case 'open-settings':
        setShowSettingsModal(true);
        break;
      default:
        alert('Feature coming soon!');
    }
  };

  if (!user || user.role !== 'parent') {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Parent Dashboard
              </h1>
              <p className="text-sm text-gray-600">Welcome back, {user.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Student Management Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Student Profiles
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Create and manage your children's learning profiles
            </p>
            <button
              onClick={() => handleButtonClick('manage-students')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Manage Students
            </button>
          </div>

          {/* Progress Tracking Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Progress Tracking
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Monitor your children's learning progress and achievements
            </p>
            <button
              onClick={() => handleButtonClick('view-progress')}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              View Progress
            </button>
          </div>

          {/* Teacher Management Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-purple-600"
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
              <h3 className="text-lg font-semibold text-gray-900">
                Teacher Assignment
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Assign teachers to your children and manage communication
            </p>
            <button
              onClick={() => handleButtonClick('manage-teachers')}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Manage Teachers
            </button>
          </div>

          {/* AI Insights Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-yellow-600"
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
              <h3 className="text-lg font-semibold text-gray-900">
                AI Insights
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Get personalized AI-powered recommendations for your children
            </p>
            <button
              onClick={() => handleButtonClick('view-insights')}
              className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors"
            >
              View Insights
            </button>
          </div>

          {/* Communication Hub Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Communication
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Stay connected with teachers and receive updates
            </p>
            <button
              onClick={() => handleButtonClick('open-messages')}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Open Messages
            </button>
          </div>

          {/* Settings Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Customize your dashboard and notification preferences
            </p>
            <button
              onClick={() => handleButtonClick('open-settings')}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Open Settings
            </button>
          </div>
        </div>
      </main>

      {/* Create Student Modal */}
      {showCreateStudentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Create New Student Profile
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student Name *
                </label>
                <input
                  type="text"
                  value={newStudent.name}
                  onChange={e =>
                    setNewStudent({ ...newStudent, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter student name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age *
                </label>
                <input
                  type="number"
                  value={newStudent.age || ''}
                  onChange={e =>
                    setNewStudent({
                      ...newStudent,
                      age: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter age"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grade Level *
                </label>
                <select
                  value={newStudent.grade}
                  onChange={e =>
                    setNewStudent({ ...newStudent, grade: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Grade</option>
                  <option value="Grade 1">Grade 1</option>
                  <option value="Grade 2">Grade 2</option>
                  <option value="Grade 3">Grade 3</option>
                  <option value="Grade 4">Grade 4</option>
                  <option value="Grade 5">Grade 5</option>
                  <option value="Grade 6">Grade 6</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subjects
                </label>
                <div className="space-y-2">
                  {[
                    'Mathematics',
                    'English',
                    'Science',
                    'History',
                    'Geography',
                    'Art',
                  ].map(subject => (
                    <label key={subject} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newStudent.subjects.includes(subject)}
                        onChange={e => {
                          if (e.target.checked) {
                            setNewStudent({
                              ...newStudent,
                              subjects: [...newStudent.subjects, subject],
                            });
                          } else {
                            setNewStudent({
                              ...newStudent,
                              subjects: newStudent.subjects.filter(
                                s => s !== subject
                              ),
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      {subject}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateStudentModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateStudent}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">
              Student Progress Overview
            </h3>
            <div className="space-y-4">
              {students.map(student => (
                <div
                  key={student.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">
                      {student.name} ({student.grade})
                    </h4>
                    <span className="text-sm text-gray-600">
                      Age: {student.age}
                    </span>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Overall Progress</span>
                      <span>{student.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${student.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Subjects: {student.subjects.join(', ')}</p>
                    {student.teacher && <p>Teacher: {student.teacher}</p>}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowProgressModal(false)}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Teacher Assignment Modal */}
      {showTeacherModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Teacher Assignment</h3>
            <div className="space-y-4">
              {students.map(student => (
                <div
                  key={student.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <h4 className="font-medium mb-2">{student.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Current Teacher: {student.teacher || 'None assigned'}
                  </p>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      Assign Teacher:
                    </label>
                    <select
                      onChange={e =>
                        handleAssignTeacher(student.id, e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select Teacher</option>
                      {teachers
                        .filter(
                          teacher =>
                            teacher.status === 'available' ||
                            teacher.name === student.teacher
                        )
                        .map(teacher => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.name} ({teacher.subjects.join(', ')})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowTeacherModal(false)}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* AI Insights Modal */}
      {showInsightsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">AI Learning Insights</h3>
            <div className="space-y-4">
              {students.map(student => (
                <div key={student.id} className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">
                    {student.name}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      🎯 <strong>Recommendation:</strong> Focus on Mathematics
                      practice
                    </p>
                    <p>
                      📈 <strong>Strength:</strong> Excellent reading
                      comprehension
                    </p>
                    <p>
                      💡 <strong>Suggestion:</strong> Consider advanced Science
                      projects
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowInsightsModal(false)}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Messages Modal */}
      {showMessagesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Communication Hub</h3>
            <div className="space-y-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-green-800">
                  📧 New message from John Teacher
                </p>
                <p className="text-sm text-green-600">
                  Emma completed her math assignment successfully!
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-blue-800">📅 Upcoming session reminder</p>
                <p className="text-sm text-blue-600">
                  Science class with Sarah Wilson tomorrow at 2 PM
                </p>
              </div>
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Send New Message
              </button>
            </div>
            <button
              onClick={() => setShowMessagesModal(false)}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  Email notifications
                </label>
              </div>
              <div>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  Progress report notifications
                </label>
              </div>
              <div>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  Weekly summary emails
                </label>
              </div>
              <div>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  Teacher communication alerts
                </label>
              </div>
            </div>
            <button
              onClick={() => setShowSettingsModal(false)}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
