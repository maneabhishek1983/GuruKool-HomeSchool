import React from 'react';
import { render, screen } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { SmartForm, AutoCompleteInput, DateTimePicker, FileUpload } from '../index';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    form: React.forwardRef<HTMLFormElement, any>(({ children, ...props }, ref) => 
      <form ref={ref} {...props}>{children}</form>
    ),
    div: React.forwardRef<HTMLDivElement, any>(({ children, ...props }, ref) => 
      <div ref={ref} {...props}>{children}</div>
    ),
    ul: React.forwardRef<HTMLUListElement, any>(({ children, ...props }, ref) => 
      <ul ref={ref} {...props}>{children}</ul>
    ),
    li: React.forwardRef<HTMLLIElement, any>(({ children, ...props }, ref) => 
      <li ref={ref} {...props}>{children}</li>
    ),
    button: React.forwardRef<HTMLButtonElement, any>(({ children, ...props }, ref) => 
      <button ref={ref} {...props}>{children}</button>
    ),
    p: React.forwardRef<HTMLParagraphElement, any>(({ children, ...props }, ref) => 
      <p ref={ref} {...props}>{children}</p>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn(() => 'Jan 1, 2024 10:00 AM'),
  isValid: jest.fn(() => true),
  parseISO: jest.fn((dateStr) => new Date(dateStr)),
}));

const TestWrapper = ({ children, defaultValues = {} }: any) => {
  const methods = useForm({ defaultValues });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('Form Components Basic Tests', () => {
  describe('SmartForm', () => {
    const testSchema = z.object({
      name: z.string().min(1, 'Name is required'),
    });

    it('renders form with submit and reset buttons', () => {
      const mockOnSubmit = jest.fn();
      
      render(
        <SmartForm schema={testSchema} onSubmit={mockOnSubmit}>
          <input name="name" placeholder="Name" />
        </SmartForm>
      );

      expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const mockOnSubmit = jest.fn();
      const { container } = render(
        <SmartForm 
          schema={testSchema} 
          onSubmit={mockOnSubmit}
          className="custom-form-class"
        >
          <input name="name" />
        </SmartForm>
      );

      expect(container.querySelector('.custom-form-class')).toBeInTheDocument();
    });
  });

  describe('AutoCompleteInput', () => {
    it('renders input with label and placeholder', () => {
      render(
        <TestWrapper>
          <AutoCompleteInput
            name="fruit"
            label="Select Fruit"
            placeholder="Type to search..."
          />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Select Fruit')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Type to search...')).toBeInTheDocument();
    });

    it('shows required indicator when required', () => {
      render(
        <TestWrapper>
          <AutoCompleteInput
            name="fruit"
            label="Select Fruit"
            required={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('shows AI badge when AI powered', () => {
      render(
        <TestWrapper>
          <AutoCompleteInput
            name="fruit"
            label="Select Fruit"
            aiPowered={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('AI')).toBeInTheDocument();
    });

    it('is disabled when disabled prop is true', () => {
      render(
        <TestWrapper>
          <AutoCompleteInput
            name="fruit"
            disabled={true}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('textbox')).toBeDisabled();
    });
  });

  describe('DateTimePicker', () => {
    it('renders datetime input with label', () => {
      render(
        <TestWrapper>
          <DateTimePicker
            name="datetime"
            label="Select Date & Time"
            placeholder="Choose date and time"
          />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Select Date & Time')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Choose date and time')).toBeInTheDocument();
    });

    it('shows smart scheduling badge when conflict detection is enabled', () => {
      render(
        <TestWrapper>
          <DateTimePicker
            name="datetime"
            label="Select Date & Time"
            conflictDetection={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Smart Scheduling')).toBeInTheDocument();
    });

    it('shows required indicator when required', () => {
      render(
        <TestWrapper>
          <DateTimePicker
            name="datetime"
            label="Select Date & Time"
            required={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('is disabled when disabled prop is true', () => {
      render(
        <TestWrapper>
          <DateTimePicker
            name="datetime"
            disabled={true}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('textbox')).toBeDisabled();
    });
  });

  describe('FileUpload', () => {
    it('renders upload area with label', () => {
      render(
        <TestWrapper>
          <FileUpload
            name="files"
            label="Upload Files"
          />
        </TestWrapper>
      );

      expect(screen.getByText('Upload Files')).toBeInTheDocument();
      expect(screen.getByText('Click to upload')).toBeInTheDocument();
    });

    it('shows drag and drop text when enabled', () => {
      render(
        <TestWrapper>
          <FileUpload
            name="files"
            dragAndDrop={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
    });

    it('hides drag and drop text when disabled', () => {
      render(
        <TestWrapper>
          <FileUpload
            name="files"
            dragAndDrop={false}
          />
        </TestWrapper>
      );

      expect(screen.queryByText(/drag and drop/i)).not.toBeInTheDocument();
      expect(screen.getByText('Click to upload')).toBeInTheDocument();
    });

    it('shows required indicator when required', () => {
      render(
        <TestWrapper>
          <FileUpload
            name="files"
            label="Upload Files"
            required={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('displays file size information', () => {
      render(
        <TestWrapper>
          <FileUpload
            name="files"
            maxSize={5 * 1024 * 1024} // 5MB
            maxFiles={3}
            accept="image/*"
          />
        </TestWrapper>
      );

      expect(screen.getByText('Accepted: image/*')).toBeInTheDocument();
      expect(screen.getByText('Max size: 5 MB')).toBeInTheDocument();
      expect(screen.getByText('Max files: 3')).toBeInTheDocument();
    });

    it('is disabled when disabled prop is true', () => {
      render(
        <TestWrapper>
          <FileUpload
            name="files"
            disabled={true}
          />
        </TestWrapper>
      );

      const fileInput = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
      expect(fileInput).toBeDisabled();
    });
  });

  describe('Form Components Integration', () => {
    it('renders all form components together', () => {
      const formSchema = z.object({
        name: z.string(),
        subject: z.string(),
        datetime: z.string(),
        files: z.array(z.any()),
      });

      const mockOnSubmit = jest.fn();

      render(
        <SmartForm schema={formSchema} onSubmit={mockOnSubmit}>
          <div className="space-y-4">
            <input name="name" placeholder="Student Name" />
            
            <AutoCompleteInput
              name="subject"
              label="Subject"
              placeholder="Select subject"
              suggestions={['Math', 'Science']}
              aiPowered={true}
            />

            <DateTimePicker
              name="datetime"
              label="Session Date & Time"
              placeholder="Select date and time"
              conflictDetection={true}
            />

            <FileUpload
              name="files"
              label="Session Materials"
              accept=".pdf,.doc"
              multiple={true}
              dragAndDrop={true}
            />
          </div>
        </SmartForm>
      );

      // Check all components are rendered
      expect(screen.getByPlaceholderText('Student Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Subject')).toBeInTheDocument();
      expect(screen.getByLabelText('Session Date & Time')).toBeInTheDocument();
      expect(screen.getByLabelText('Session Materials')).toBeInTheDocument();

      // Check form buttons
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();

      // Check AI and smart features indicators
      expect(screen.getByText('AI')).toBeInTheDocument();
      expect(screen.getByText('Smart Scheduling')).toBeInTheDocument();
    });
  });
});