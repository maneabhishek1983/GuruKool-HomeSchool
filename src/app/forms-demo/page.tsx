'use client';

import React from 'react';
import { z } from 'zod';
import {
  SmartForm,
  AutoCompleteInput,
  DateTimePicker,
  FileUpload,
} from '@/design-system/components/forms';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  subject: z.string().min(1, 'Subject is required'),
  datetime: z.string().min(1, 'Date and time is required'),
  files: z.array(z.any()).min(1, 'At least one file is required'),
});

type FormData = z.infer<typeof formSchema>;

export default function FormsDemo() {
  const handleSubmit = async (data: FormData) => {
    console.log('Form submitted:', data);
    alert('Form submitted successfully! Check console for data.');
  };

  const handleSuggestionsFetch = async (query: string) => {
    // Simulate AI suggestions
    const subjects = [
      'Mathematics',
      'Science',
      'English',
      'History',
      'Art',
      'Music',
    ];
    return subjects.filter(subject =>
      subject.toLowerCase().includes(query.toLowerCase())
    );
  };

  const handleConflictCheck = async (date: Date) => {
    // Simulate conflict detection
    const conflicts = [
      {
        id: '1',
        title: 'Math Session with John',
        startTime: new Date(date.getTime() - 30 * 60 * 1000), // 30 minutes before
        endTime: new Date(date.getTime() + 30 * 60 * 1000), // 30 minutes after
        type: 'session' as const,
        severity: 'medium' as const,
      },
    ];

    // Only return conflicts if the selected time overlaps
    const selectedHour = date.getHours();
    if (selectedHour >= 10 && selectedHour <= 12) {
      return conflicts;
    }
    return [];
  };

  const handleFileUpload = async (files: File[]) => {
    // Simulate file upload
    return files.map(file => `uploaded/${file.name}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Advanced Form Components Demo
          </h1>
          <p className="text-gray-600">
            Showcasing SmartForm, AutoCompleteInput, DateTimePicker, and
            FileUpload components
          </p>
        </div>

        <SmartForm<FormData>
          schema={formSchema}
          onSubmit={handleSubmit}
          realTimeValidation={true}
          aiAssisted={true}
        >
          <div className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Student Name
              </label>
              <input
                name="name"
                id="name"
                placeholder="Enter student name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <input
                name="email"
                id="email"
                type="email"
                placeholder="Enter email address"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <AutoCompleteInput
              name="subject"
              label="Subject"
              placeholder="Select or type subject"
              suggestions={[
                'Mathematics',
                'Science',
                'English',
                'History',
                'Art',
                'Music',
              ]}
              aiPowered={true}
              onSuggestionsFetch={handleSuggestionsFetch}
              required={true}
            />

            <DateTimePicker
              name="datetime"
              label="Session Date & Time"
              placeholder="Select date and time"
              conflictDetection={true}
              onConflictCheck={handleConflictCheck}
              required={true}
            />

            <FileUpload
              name="files"
              label="Session Materials"
              accept=".pdf,.doc,.docx,image/*"
              multiple={true}
              maxSize={5 * 1024 * 1024} // 5MB
              maxFiles={3}
              dragAndDrop={true}
              showProgress={true}
              onUpload={handleFileUpload}
              required={true}
            />
          </div>
        </SmartForm>

        <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Features Demonstrated
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">SmartForm</h3>
              <ul className="space-y-1">
                <li>• Real-time validation with Zod</li>
                <li>• AI-assisted form completion</li>
                <li>• Animated error states</li>
                <li>• Loading states during submission</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                AutoCompleteInput
              </h3>
              <ul className="space-y-1">
                <li>• AI-powered suggestions</li>
                <li>• Keyboard navigation</li>
                <li>• Debounced search</li>
                <li>• Fallback to local suggestions</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">DateTimePicker</h3>
              <ul className="space-y-1">
                <li>• Smart conflict detection</li>
                <li>• Visual conflict indicators</li>
                <li>• Severity-based styling</li>
                <li>• Debounced conflict checking</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">FileUpload</h3>
              <ul className="space-y-1">
                <li>• Drag and drop support</li>
                <li>• Upload progress tracking</li>
                <li>• File validation</li>
                <li>• Multiple file support</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
