'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TeacherProfile } from '@/types';
import TeacherRateManagement, { TeacherRate } from './TeacherRateManagement';

interface TeacherCardProps {
  teacher: TeacherProfile;
  onEdit?: (teacher: TeacherProfile) => void;
  onDelete?: (teacherId: string) => void;
}

export default function TeacherCard({
  teacher,
  onEdit,
  onDelete,
}: TeacherCardProps) {
  const [showRates, setShowRates] = useState(false);
  const [rates, setRates] = useState<TeacherRate[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [editingRates, setEditingRates] = useState(false);

  // Fetch teacher rates
  const fetchRates = async () => {
    setLoadingRates(true);
    try {
      const response = await fetch(`/api/teachers/${teacher.id}/rates`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRates(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching rates:', error);
    } finally {
      setLoadingRates(false);
    }
  };

  // Update teacher rates
  const handleSaveRates = async () => {
    try {
      const response = await fetch(`/api/teachers/${teacher.id}/rates`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ rates }),
      });

      if (response.ok) {
        alert('Rates updated successfully!');
        setEditingRates(false);
      } else {
        const error = await response.json();
        alert(`Failed to update rates: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving rates:', error);
      alert('An error occurred while saving rates');
    }
  };

  useEffect(() => {
    if (showRates && rates.length === 0) {
      fetchRates();
    }
  }, [showRates]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          {teacher.profilePictureUrl ? (
            <img
              src={teacher.profilePictureUrl}
              alt={teacher.name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xl">
              {teacher.name.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="text-xl font-bold text-gray-900">{teacher.name}</h3>
            <p className="text-gray-600 text-sm">{teacher.email}</p>
            <p className="text-gray-500 text-sm">{teacher.phone}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(teacher)}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => {
                if (
                  confirm(`Are you sure you want to delete ${teacher.name}?`)
                ) {
                  onDelete(teacher.id);
                }
              }}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-700">Experience</p>
            <p className="text-gray-900">{teacher.experience} years</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Status</p>
          <span
            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
              teacher.status === 'available'
                ? 'bg-green-100 text-green-800'
                : teacher.status === 'assigned'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
            }`}
          >
            {teacher.status}
          </span>
        </div>
      </div>

      {/* Subjects */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Subjects</p>
        <div className="flex flex-wrap gap-2">
          {teacher.subjects.map((subject, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
            >
              {subject}
            </span>
          ))}
        </div>
      </div>

      {/* Qualifications */}
      {teacher.qualifications && teacher.qualifications.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Qualifications
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            {teacher.qualifications.map((qual, index) => (
              <li key={index}>{qual}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Bio */}
      {teacher.bio && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-1">Bio</p>
          <p className="text-sm text-gray-600">{teacher.bio}</p>
        </div>
      )}

      {/* Rates Section (Collapsible) */}
      <div className="border-t pt-4 mt-4">
        <button
          onClick={() => setShowRates(!showRates)}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="text-sm font-medium text-gray-700">
            Subject Rates
          </span>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${
              showRates ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {showRates && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-4"
          >
            {loadingRates ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : (
              <>
                {editingRates ? (
                  <>
                    <TeacherRateManagement
                      subjects={teacher.subjects}
                      rates={rates}
                      onChange={setRates}
                    />
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={handleSaveRates}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                      >
                        Save Rates
                      </button>
                      <button
                        onClick={() => {
                          setEditingRates(false);
                          fetchRates(); // Reload original rates
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <TeacherRateManagement
                      subjects={teacher.subjects}
                      rates={rates}
                      onChange={() => {}}
                      readOnly={true}
                    />
                    <button
                      onClick={() => setEditingRates(true)}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                    >
                      Edit Rates
                    </button>
                  </>
                )}
              </>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
