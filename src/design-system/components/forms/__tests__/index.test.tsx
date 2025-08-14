import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';
import { useForm, FormProvider } from 'react-hook-form';
import { SmartForm, AutoCompleteInput, DateTimePicker, FileUpload } from '../index';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    ul: ({ children, ...props }: any) => <ul {...props}>{children}</ul>,
    li: ({ children, ...props }: any) => <li {...props}>{children}</li>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn(() => 'Jan 1, 2024 10:00 AM'),
  isValid: jest.fn(() => true),
  parseISO: jest.fn((dateStr) => new Date(dateStr)),
}));

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  subject: z.string().min(1, 'Subject is required'),
  datetime: z.string().min(1, 'Date and time is required'),
  files: z.array(z.any()).min(1, 'At least one file is required'),
});

type FormData = z.infer<typeof formSchema>;

const TestWrapper = ({ children, defaultValues = {} }: any) => {
  const methods = useForm({ defaultValues });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('Form Components Integration', () => {
  const mockOnSubmit = jest.fn();
  const mockSuggestions = ['Math', 'Science', 'English', 'History'];
  const mockOnSuggestionsFetch = jest.fn();
  const mockOnConflictCheck = jest.fn();
  const mockOnUpload = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnSuggestionsFetch.mockClear();
    mockOnConflictCheck.mockClear();
    mockOnUpload.mockClear();
  });

  const CompleteForm = () => (
    <SmartForm<FormData>
      schema={formSchema}
      onSubmit={mockOnSubmit}
      realTimeValidation={true}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Student Name
          </label>
          <input
            name="name"
            id="name"
            placeholder="Enter student name"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            name="email"
            id="email"
            type="email"
            placeholder="Enter email"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <AutoCompleteInput
          name="subject"
          label="Subject"
          placeholder="Select or type subject"
          suggestions={mockSuggestions}
          aiPowered={true}
          onSuggestionsFetch={mockOnSuggestionsFetch}
          required={true}
        />

        <DateTimePicker
          name="datetime"
          label="Session Date & Time"
          placeholder="Select date and time"
          conflictDetection={true}
          onConflictCheck={mockOnConflictCheck}
          required={true}
        />

        <FileUpload
          name="files"
          label="Session Materials"
          accept=".pdf,.doc,.docx,image/*"
          multiple={true}
          maxSize={5 * 1024 * 1024}
          maxFiles={3}
          dragAndDrop={true}
          showProgress={true}
          onUpload={mockOnUpload}
          required={true}
        />
      </div>
    </SmartForm>
  );

  it('renders all form components together', () => {
    render(<CompleteForm />);

    // Check all components are rendered
    expect(screen.getByLabelText('Student Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
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

  it('validates all fields and shows errors', async () => {
    const user = userEvent.setup();
    
    render(<CompleteForm />);

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
      expect(screen.getByText(/subject is required/i)).toBeInTheDocument();
      expect(screen.getByText(/date and time is required/i)).toBeInTheDocument();
      expect(screen.getByText(/at least one file is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form with all valid data', async () => {
    const user = userEvent.setup();
    mockOnSuggestionsFetch.mockResolvedValue(['Math']);
    mockOnConflictCheck.mockResolvedValue([]);
    mockOnUpload.mockResolvedValue(['file-url']);

    // Create a mock file
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    
    render(<CompleteForm />);

    // Fill out all fields
    await user.type(screen.getByLabelText('Student Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    
    // Use AutoComplete
    const subjectInput = screen.getByLabelText('Subject');
    await user.type(subjectInput, 'Math');
    await waitFor(() => {
      expect(screen.getByText('Math')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Math'));

    // Set datetime
    const datetimeInput = screen.getByLabelText('Session Date & Time');
    await user.type(datetimeInput, '2024-01-01T10:00');

    // Upload file
    const fileInput = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    await user.upload(fileInput, mockFile);

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Math',
        datetime: '2024-01-01T10:00',
        files: [mockFile],
      });
    });
  });

  it('handles AI suggestions in AutoComplete', async () => {
    const user = userEvent.setup();
    mockOnSuggestionsFetch.mockResolvedValue(['Advanced Mathematics', 'Mathematical Analysis']);
    
    render(<CompleteForm />);

    const subjectInput = screen.getByLabelText('Subject');
    await user.type(subjectInput, 'math');

    await waitFor(() => {
      expect(mockOnSuggestionsFetch).toHaveBeenCalledWith('math');
    });

    await waitFor(() => {
      expect(screen.getByText('Advanced Mathematics')).toBeInTheDocument();
      expect(screen.getByText('Mathematical Analysis')).toBeInTheDocument();
    });
  });

  it('handles conflict detection in DateTimePicker', async () => {
    const user = userEvent.setup();
    const mockConflicts = [
      {
        id: '1',
        title: 'Existing Session',
        startTime: new Date('2024-01-01T10:00'),
        endTime: new Date('2024-01-01T11:00'),
        type: 'session' as const,
        severity: 'high' as const,
      },
    ];
    mockOnConflictCheck.mockResolvedValue(mockConflicts);
    
    render(<CompleteForm />);

    const datetimeInput = screen.getByLabelText('Session Date & Time');
    await user.type(datetimeInput, '2024-01-01T10:00');

    await waitFor(() => {
      expect(mockOnConflictCheck).toHaveBeenCalledWith(expect.any(Date));
    });

    await waitFor(() => {
      expect(screen.getByText('!')).toBeInTheDocument();
    });

    // Click to show conflicts
    await user.click(screen.getByText('!'));
    expect(screen.getByText('Existing Session')).toBeInTheDocument();
  });

  it('handles file upload with progress', async () => {
    const user = userEvent.setup();
    mockOnUpload.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(['file-url']), 100))
    );

    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    
    render(<CompleteForm />);

    const fileInput = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    await user.upload(fileInput, mockFile);

    // Should show upload progress
    await waitFor(() => {
      expect(screen.getByText('Upload Progress')).toBeInTheDocument();
      expect(screen.getByText('uploading')).toBeInTheDocument();
    });

    // Should complete
    await waitFor(() => {
      expect(screen.getByText('completed')).toBeInTheDocument();
    });
  });

  it('resets all form fields when reset is clicked', async () => {
    const user = userEvent.setup();
    
    render(<CompleteForm />);

    // Fill some fields
    await user.type(screen.getByLabelText('Student Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');

    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();

    // Reset form
    const resetButton = screen.getByRole('button', { name: /reset/i });
    await user.click(resetButton);

    expect(screen.queryByDisplayValue('John Doe')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('john@example.com')).not.toBeInTheDocument();
  });

  it('shows loading state during form submission', async () => {
    const user = userEvent.setup();
    const slowSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    const SlowForm = () => (
      <SmartForm schema={formSchema} onSubmit={slowSubmit}>
        <input name="name" defaultValue="John Doe" />
        <input name="email" defaultValue="john@example.com" />
        <input name="subject" defaultValue="Math" />
        <input name="datetime" defaultValue="2024-01-01T10:00" />
        <input name="files" defaultValue={[]} />
      </SmartForm>
    );

    render(<SlowForm />);

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    expect(screen.getByText(/submitting/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.queryByText(/submitting/i)).not.toBeInTheDocument();
    });
  });

  it('maintains form state across component interactions', async () => {
    const user = userEvent.setup();
    mockOnSuggestionsFetch.mockResolvedValue(['Mathematics']);
    
    render(<CompleteForm />);

    // Fill name field
    await user.type(screen.getByLabelText('Student Name'), 'John Doe');
    
    // Use autocomplete
    const subjectInput = screen.getByLabelText('Subject');
    await user.type(subjectInput, 'math');
    
    await waitFor(() => {
      expect(screen.getByText('Mathematics')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Mathematics'));

    // Verify both fields maintain their values
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Mathematics')).toBeInTheDocument();
  });
});