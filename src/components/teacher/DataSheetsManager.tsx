'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Co-operation/Willingness level options
const COOPERATION_LEVELS = [
  { value: 'excellent', label: 'Excellent', color: 'bg-green-100 text-green-800' },
  { value: 'good', label: 'Good', color: 'bg-blue-100 text-blue-800' },
  { value: 'moderate', label: 'Moderate', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'poor', label: 'Poor', color: 'bg-orange-100 text-orange-800' },
  { value: 'refused', label: 'Refused', color: 'bg-red-100 text-red-800' },
];

// Behaviour options
const BEHAVIOUR_OPTIONS = [
  { value: 'engaged', label: 'Engaged & Focused' },
  { value: 'settled', label: 'Settled' },
  { value: 'excited', label: 'Excited' },
  { value: 'calm', label: 'Calm' },
  { value: 'distracted', label: 'Got Distracted' },
  { value: 'frustrated', label: 'Frustrated' },
  { value: 'shouting', label: 'Shouting/Loud' },
  { value: 'pushing', label: 'Pushing' },
  { value: 'crying', label: 'Crying' },
  { value: 'tired', label: 'Tired' },
  { value: 'hyperactive', label: 'Hyperactive' },
  { value: 'anxious', label: 'Anxious' },
  { value: 'happy', label: 'Happy' },
  { value: 'unresponsive', label: 'Unresponsive' },
];

interface AssignedStudent {
  id: string;
  name: string;
  grade: string;
  country: string;
  parentId?: string;
}

interface StudentActivity {
  id: string;
  name: string;
  category: 'socialization' | 'physical_education' | 'extracurricular' | 'community' | 'sensory' | 'writing' | 'communication' | 'social' | 'motor' | 'academic';
}

interface ActivityEntry {
  id: string;
  activityId: string;
  activityName: string;
  category: string;
  completed: boolean;
  cooperationLevel: string;
  behaviour: string;
  comments: string;
  date: string;
}

interface DataSheetsManagerProps {
  teacherId: string;
  selectedDate?: string;
  assignedStudents?: AssignedStudent[];
}

export const DataSheetsManager: React.FC<DataSheetsManagerProps> = ({
  teacherId,
  selectedDate: initialDate,
  assignedStudents: propStudents,
}) => {
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<AssignedStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<AssignedStudent | null>(null);
  const [studentActivities, setStudentActivities] = useState<StudentActivity[]>([]);
  const [activityEntries, setActivityEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    loadStudents();
  }, [teacherId, propStudents]);

  useEffect(() => {
    if (selectedStudent) {
      loadStudentActivities(selectedStudent.id);
    }
  }, [selectedStudent, selectedDate]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      if (propStudents && propStudents.length > 0) {
        setStudents(propStudents);
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/teacher/dashboard?userId=${teacherId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.students && data.students.length > 0) {
          setStudents(data.students);
        }
      }
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentActivities = async (studentId: string) => {
    setLoading(true);
    try {
      // Fetch student profile to get their selected activities
      const response = await fetch(`/api/students/${studentId}`);
      if (response.ok) {
        const student = await response.json();

        const activities: StudentActivity[] = [];

        // Add socialization activities
        if (student.selectedSocialization) {
          student.selectedSocialization.forEach((item: { id: string; name: string }) => {
            activities.push({ id: item.id, name: item.name, category: 'socialization' });
          });
        }

        // Add physical education activities
        if (student.selectedPhysicalEducation) {
          student.selectedPhysicalEducation.forEach((item: { id: string; name: string }) => {
            activities.push({ id: item.id, name: item.name, category: 'physical_education' });
          });
        }

        // Add extracurricular activities
        if (student.selectedExtracurricular) {
          student.selectedExtracurricular.forEach((item: { id: string; name: string }) => {
            activities.push({ id: item.id, name: item.name, category: 'extracurricular' });
          });
        }

        // Add community involvement
        if (student.selectedCommunityInvolvement) {
          student.selectedCommunityInvolvement.forEach((item: { id: string; name: string }) => {
            activities.push({ id: item.id, name: item.name, category: 'community' });
          });
        }

        // Add sensory activities
        if (student.selectedSensoryActivities) {
          student.selectedSensoryActivities.forEach((name: string, index: number) => {
            activities.push({ id: `sensory-${index}`, name, category: 'sensory' });
          });
        }

        // Add writing activities
        if (student.selectedWritingActivities) {
          student.selectedWritingActivities.forEach((name: string, index: number) => {
            activities.push({ id: `writing-${index}`, name, category: 'writing' });
          });
        }

        // Add communication activities
        if (student.selectedCommunicationActivities) {
          student.selectedCommunicationActivities.forEach((name: string, index: number) => {
            activities.push({ id: `comm-${index}`, name, category: 'communication' });
          });
        }

        // Add social activities
        if (student.selectedSocialActivities) {
          student.selectedSocialActivities.forEach((name: string, index: number) => {
            activities.push({ id: `social-${index}`, name, category: 'social' });
          });
        }

        // Add motor activities
        if (student.selectedMotorActivities) {
          student.selectedMotorActivities.forEach((name: string, index: number) => {
            activities.push({ id: `motor-${index}`, name, category: 'motor' });
          });
        }

        // Add academic activities
        if (student.selectedAcademicActivities) {
          student.selectedAcademicActivities.forEach((name: string, index: number) => {
            activities.push({ id: `academic-${index}`, name, category: 'academic' });
          });
        }

        setStudentActivities(activities);

        // Initialize activity entries for the selected date
        const dateStr = selectedDate || new Date().toISOString().split('T')[0] || '';
        const entries: ActivityEntry[] = activities.map(activity => ({
          id: `${activity.id}-${dateStr}`,
          activityId: activity.id,
          activityName: activity.name,
          category: activity.category,
          completed: false,
          cooperationLevel: '',
          behaviour: '',
          comments: '',
          date: dateStr,
        }));

        setActivityEntries(entries);

        // Try to load saved entries from database
        await loadSavedEntries(studentId, dateStr);
      }
    } catch (error) {
      console.error('Error loading student activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedEntries = async (studentId: string, date: string) => {
    try {
      const response = await fetch(`/api/data-sheets/entries?studentId=${studentId}&date=${date}`);
      if (response.ok) {
        const savedEntries = await response.json();
        if (savedEntries && savedEntries.length > 0) {
          // Merge saved entries with current entries
          setActivityEntries(prev => prev.map(entry => {
            const saved = savedEntries.find((s: ActivityEntry) => s.activityId === entry.activityId);
            return saved ? { ...entry, ...saved } : entry;
          }));
        }
      }
    } catch (error) {
      console.error('Error loading saved entries:', error);
    }
  };

  const updateEntry = (entryId: string, field: keyof ActivityEntry, value: string | boolean) => {
    setActivityEntries(prev => prev.map(entry =>
      entry.id === entryId ? { ...entry, [field]: value } : entry
    ));
  };

  const handleSave = async () => {
    if (!selectedStudent) return;

    setSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/data-sheets/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          teacherId,
          date: selectedDate,
          entries: activityEntries.filter(e => e.completed),
        }),
      });

      if (response.ok) {
        setSaveMessage('Data sheet saved successfully!');
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage('Error saving data sheet. Please try again.');
      }
    } catch (error) {
      console.error('Error saving data sheet:', error);
      setSaveMessage('Error saving data sheet. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'socialization': return 'bg-purple-50 border-purple-200';
      case 'physical_education': return 'bg-orange-50 border-orange-200';
      case 'extracurricular': return 'bg-teal-50 border-teal-200';
      case 'community': return 'bg-indigo-50 border-indigo-200';
      case 'sensory': return 'bg-pink-50 border-pink-200';
      case 'writing': return 'bg-blue-50 border-blue-200';
      case 'communication': return 'bg-green-50 border-green-200';
      case 'social': return 'bg-yellow-50 border-yellow-200';
      case 'motor': return 'bg-red-50 border-red-200';
      case 'academic': return 'bg-cyan-50 border-cyan-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'socialization': return 'Socialization';
      case 'physical_education': return 'Physical Education';
      case 'extracurricular': return 'Extracurricular';
      case 'community': return 'Community';
      case 'sensory': return 'Sensory';
      case 'writing': return 'Writing';
      case 'communication': return 'Communication';
      case 'social': return 'Social';
      case 'motor': return 'Motor Skills';
      case 'academic': return 'Academic';
      default: return category;
    }
  };

  if (loading && students.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Sheets</h2>
          <p className="text-gray-600">Track daily activities and behaviour</p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Student Selection */}
      {!selectedStudent && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Student</h3>
          {students.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No students assigned. Please contact the parent to assign you to their student.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map(student => (
                <motion.div
                  key={student.id}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
                  onClick={() => setSelectedStudent(student)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-medium text-blue-600">
                        {student.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-600">
                        {student.grade} • {student.country}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Data Sheet Form */}
      {selectedStudent && (
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setStudentActivities([]);
                  setActivityEntries([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back
              </button>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedStudent.name}&apos;s Data Sheet
                </h3>
                <p className="text-sm text-gray-600">Date: {selectedDate}</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                'Save Data Sheet'
              )}
            </button>
          </div>

          {/* Save Message */}
          <AnimatePresence>
            {saveMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mx-6 mt-4 p-3 rounded-md ${
                  saveMessage.includes('success')
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {saveMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Activities Table */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : studentActivities.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">
                  No activities found in student profile.
                </p>
                <p className="text-sm text-gray-400">
                  Activities are set up when creating the student profile.
                  Ask the parent to add activities for this student.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 w-10">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 rounded"
                          onChange={(e) => {
                            setActivityEntries(prev => prev.map(entry => ({
                              ...entry,
                              completed: e.target.checked
                            })));
                          }}
                        />
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Activity</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 w-40">
                        Co-operation Level
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 w-44">
                        Behaviour Exhibited
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Group by category */}
                    {Object.entries(
                      activityEntries.reduce((acc, entry) => {
                        const cat = entry.category;
                        if (!acc[cat]) acc[cat] = [];
                        acc[cat].push(entry);
                        return acc;
                      }, {} as Record<string, ActivityEntry[]>)
                    ).map(([category, entries]) => (
                      <React.Fragment key={category}>
                        {/* Category Header */}
                        <tr className={`${getCategoryColor(category)}`}>
                          <td colSpan={5} className="py-2 px-4 font-semibold text-gray-700 text-sm">
                            {getCategoryLabel(category)}
                          </td>
                        </tr>
                        {/* Activity Rows */}
                        {entries.map(entry => (
                          <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <input
                                type="checkbox"
                                checked={entry.completed}
                                onChange={(e) => updateEntry(entry.id, 'completed', e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-medium text-gray-900">{entry.activityName}</span>
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={entry.cooperationLevel}
                                onChange={(e) => updateEntry(entry.id, 'cooperationLevel', e.target.value)}
                                disabled={!entry.completed}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                              >
                                <option value="">Select...</option>
                                {COOPERATION_LEVELS.map(level => (
                                  <option key={level.value} value={level.value}>
                                    {level.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={entry.behaviour}
                                onChange={(e) => updateEntry(entry.id, 'behaviour', e.target.value)}
                                disabled={!entry.completed}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                              >
                                <option value="">Select...</option>
                                {BEHAVIOUR_OPTIONS.map(opt => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="text"
                                value={entry.comments}
                                onChange={(e) => updateEntry(entry.id, 'comments', e.target.value)}
                                disabled={!entry.completed}
                                placeholder="Add comments..."
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                              />
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Summary */}
          {activityEntries.filter(e => e.completed).length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">
                    {activityEntries.filter(e => e.completed).length}
                  </span>
                  {' '}of{' '}
                  <span className="font-semibold text-gray-900">
                    {activityEntries.length}
                  </span>
                  {' '}activities completed
                </div>
                <div className="flex gap-4 text-sm">
                  {COOPERATION_LEVELS.filter(level =>
                    activityEntries.some(e => e.completed && e.cooperationLevel === level.value)
                  ).map(level => {
                    const count = activityEntries.filter(
                      e => e.completed && e.cooperationLevel === level.value
                    ).length;
                    return (
                      <span key={level.value} className={`px-2 py-1 rounded-full ${level.color}`}>
                        {level.label}: {count}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
