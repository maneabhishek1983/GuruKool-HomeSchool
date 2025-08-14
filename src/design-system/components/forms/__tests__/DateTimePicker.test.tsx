import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { DateTimePicker } from '../DateTimePicker';
import { ConflictInfo } from '../types';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'MMM d, yyyy h:mm a') {
      return 'Jan 1, 2024 10:00 AM';
    }
    if (formatStr === 'h:mm a') {
      return '11:00 AM';
    }
    return '2024-01-01T10:00';
  }),
  isValid: jest.fn(() => true),
  parseISO: jest.fn((dateStr) => new Date(dateStr)),
}));

const TestWrapper = ({ children, defaultValues = {} }: any) => {
  const methods = useForm({ defaultValues });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('DateTimePicker', () => {
  const mockOnConflictCheck = jest.fn();

  beforeEach(() => {
    mockOnConflictCheck.mockClear();
  });

  it('renders input with label', () => {
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

  it('accepts datetime-local input format', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <DateTimePicker name="datetime" />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox') as HTMLInputElement;
    await user.type(input, '2024-01-01T10:00');

    expect(input.value).toBe('2024-01-01T10:00');
  });

  it('checks for conflicts when conflict detection is enabled', async () => {
    const user = userEvent.setup();
    const mockConflicts: ConflictInfo[] = [
      {
        id: '1',
        title: 'Math Session',
        startTime: new Date('2024-01-01T10:00'),
        endTime: new Date('2024-01-01T11:00'),
        type: 'session',
        severity: 'high',
      },
    ];
    
    mockOnConflictCheck.mockResolvedValue(mockConflicts);
    
    render(
      <TestWrapper>
        <DateTimePicker
          name="datetime"
          conflictDetection={true}
          onConflictCheck={mockOnConflictCheck}
        />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    await user.type(input, '2024-01-01T10:00');

    await waitFor(() => {
      expect(mockOnConflictCheck).toHaveBeenCalledWith(expect.any(Date));
    });

    await waitFor(() => {
      expect(screen.getByText('!')).toBeInTheDocument();
    });
  });

  it('displays conflicts when found', async () => {
    const user = userEvent.setup();
    const mockConflicts: ConflictInfo[] = [
      {
        id: '1',
        title: 'Math Session',
        startTime: new Date('2024-01-01T10:00'),
        endTime: new Date('2024-01-01T11:00'),
        type: 'session',
        severity: 'high',
      },
    ];
    
    mockOnConflictCheck.mockResolvedValue(mockConflicts);
    
    render(
      <TestWrapper>
        <DateTimePicker
          name="datetime"
          conflictDetection={true}
          onConflictCheck={mockOnConflictCheck}
        />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    await user.type(input, '2024-01-01T10:00');

    await waitFor(() => {
      expect(screen.getByText('!')).toBeInTheDocument();
    });

    const conflictButton = screen.getByText('!');
    await user.click(conflictButton);

    expect(screen.getByText('Scheduling Conflicts Detected:')).toBeInTheDocument();
    expect(screen.getByText('Math Session')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
  });

  it('shows loading indicator while checking conflicts', async () => {
    const user = userEvent.setup();
    mockOnConflictCheck.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve([]), 100))
    );
    
    render(
      <TestWrapper>
        <DateTimePicker
          name="datetime"
          conflictDetection={true}
          onConflictCheck={mockOnConflictCheck}
        />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    await user.type(input, '2024-01-01T10:00');

    // Should show loading spinner
    expect(screen.getByRole('textbox').parentElement?.querySelector('.animate-spin')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('textbox').parentElement?.querySelector('.animate-spin')).not.toBeInTheDocument();
    });
  });

  it('handles conflict check errors gracefully', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockOnConflictCheck.mockRejectedValue(new Error('Conflict check failed'));
    
    render(
      <TestWrapper>
        <DateTimePicker
          name="datetime"
          conflictDetection={true}
          onConflictCheck={mockOnConflictCheck}
        />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    await user.type(input, '2024-01-01T10:00');

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to check conflicts:', expect.any(Error));
    });

    // Should not show conflict indicator
    expect(screen.queryByText('!')).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('applies min and max date constraints', () => {
    const minDate = new Date('2024-01-01');
    const maxDate = new Date('2024-12-31');
    
    render(
      <TestWrapper>
        <DateTimePicker
          name="datetime"
          minDate={minDate}
          maxDate={maxDate}
        />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.min).toBe('2024-01-01T00:00');
    expect(input.max).toBe('2024-12-31T00:00');
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

  it('debounces conflict checking', async () => {
    const user = userEvent.setup();
    mockOnConflictCheck.mockResolvedValue([]);
    
    render(
      <TestWrapper>
        <DateTimePicker
          name="datetime"
          conflictDetection={true}
          onConflictCheck={mockOnConflictCheck}
        />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    
    // Type multiple characters quickly
    await user.type(input, '2024-01-01T10:00');

    // Should only call once after debounce
    await waitFor(() => {
      expect(mockOnConflictCheck).toHaveBeenCalledTimes(1);
    });
  });

  it('hides conflicts when hide button is clicked', async () => {
    const user = userEvent.setup();
    const mockConflicts: ConflictInfo[] = [
      {
        id: '1',
        title: 'Math Session',
        startTime: new Date('2024-01-01T10:00'),
        endTime: new Date('2024-01-01T11:00'),
        type: 'session',
        severity: 'high',
      },
    ];
    
    mockOnConflictCheck.mockResolvedValue(mockConflicts);
    
    render(
      <TestWrapper>
        <DateTimePicker
          name="datetime"
          conflictDetection={true}
          onConflictCheck={mockOnConflictCheck}
        />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    await user.type(input, '2024-01-01T10:00');

    await waitFor(() => {
      expect(screen.getByText('!')).toBeInTheDocument();
    });

    const conflictButton = screen.getByText('!');
    await user.click(conflictButton);

    expect(screen.getByText('Math Session')).toBeInTheDocument();

    const hideButton = screen.getByText('Hide conflicts');
    await user.click(hideButton);

    expect(screen.queryByText('Math Session')).not.toBeInTheDocument();
  });

  it('displays different severity colors for conflicts', async () => {
    const user = userEvent.setup();
    const mockConflicts: ConflictInfo[] = [
      {
        id: '1',
        title: 'High Priority',
        startTime: new Date('2024-01-01T10:00'),
        endTime: new Date('2024-01-01T11:00'),
        type: 'session',
        severity: 'high',
      },
      {
        id: '2',
        title: 'Medium Priority',
        startTime: new Date('2024-01-01T11:00'),
        endTime: new Date('2024-01-01T12:00'),
        type: 'appointment',
        severity: 'medium',
      },
      {
        id: '3',
        title: 'Low Priority',
        startTime: new Date('2024-01-01T12:00'),
        endTime: new Date('2024-01-01T13:00'),
        type: 'event',
        severity: 'low',
      },
    ];
    
    mockOnConflictCheck.mockResolvedValue(mockConflicts);
    
    render(
      <TestWrapper>
        <DateTimePicker
          name="datetime"
          conflictDetection={true}
          onConflictCheck={mockOnConflictCheck}
        />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    await user.type(input, '2024-01-01T10:00');

    await waitFor(() => {
      expect(screen.getByText('!')).toBeInTheDocument();
    });

    const conflictButton = screen.getByText('!');
    await user.click(conflictButton);

    const highPriorityElement = screen.getByText('High Priority').closest('div');
    const mediumPriorityElement = screen.getByText('Medium Priority').closest('div');
    const lowPriorityElement = screen.getByText('Low Priority').closest('div');

    expect(highPriorityElement).toHaveClass('text-red-600');
    expect(mediumPriorityElement).toHaveClass('text-yellow-600');
    expect(lowPriorityElement).toHaveClass('text-blue-600');
  });
});