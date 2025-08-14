import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';
import { SmartForm } from '../SmartForm';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

const testSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  age: z.number().min(18, 'Must be at least 18'),
});

type TestFormData = z.infer<typeof testSchema>;

describe('SmartForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  const TestFormContent = () => (
    <>
      <input name="name" placeholder="Name" />
      <input name="email" type="email" placeholder="Email" />
      <input name="age" type="number" placeholder="Age" />
    </>
  );

  it('renders form with children', () => {
    render(
      <SmartForm schema={testSchema} onSubmit={mockOnSubmit}>
        <TestFormContent />
      </SmartForm>
    );

    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Age')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });

  it('validates form on submit', async () => {
    const user = userEvent.setup();
    
    render(
      <SmartForm schema={testSchema} onSubmit={mockOnSubmit}>
        <TestFormContent />
      </SmartForm>
    );

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits valid form data', async () => {
    const user = userEvent.setup();
    
    render(
      <SmartForm schema={testSchema} onSubmit={mockOnSubmit}>
        <TestFormContent />
      </SmartForm>
    );

    await user.type(screen.getByPlaceholderText('Name'), 'John Doe');
    await user.type(screen.getByPlaceholderText('Email'), 'john@example.com');
    await user.type(screen.getByPlaceholderText('Age'), '25');

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
      });
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    const slowSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(
      <SmartForm schema={testSchema} onSubmit={slowSubmit}>
        <TestFormContent />
      </SmartForm>
    );

    await user.type(screen.getByPlaceholderText('Name'), 'John Doe');
    await user.type(screen.getByPlaceholderText('Email'), 'john@example.com');
    await user.type(screen.getByPlaceholderText('Age'), '25');

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    expect(screen.getByText(/submitting/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.queryByText(/submitting/i)).not.toBeInTheDocument();
    });
  });

  it('resets form when reset button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <SmartForm schema={testSchema} onSubmit={mockOnSubmit}>
        <TestFormContent />
      </SmartForm>
    );

    const nameInput = screen.getByPlaceholderText('Name');
    await user.type(nameInput, 'John Doe');
    expect(nameInput).toHaveValue('John Doe');

    const resetButton = screen.getByRole('button', { name: /reset/i });
    await user.click(resetButton);

    expect(nameInput).toHaveValue('');
  });

  it('applies default values', () => {
    const defaultValues = {
      name: 'Default Name',
      email: 'default@example.com',
      age: 30,
    };

    render(
      <SmartForm 
        schema={testSchema} 
        onSubmit={mockOnSubmit}
        defaultValues={defaultValues}
      >
        <TestFormContent />
      </SmartForm>
    );

    expect(screen.getByDisplayValue('Default Name')).toBeInTheDocument();
    expect(screen.getByDisplayValue('default@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('30')).toBeInTheDocument();
  });

  it('shows real-time validation when enabled', async () => {
    const user = userEvent.setup();
    
    render(
      <SmartForm 
        schema={testSchema} 
        onSubmit={mockOnSubmit}
        realTimeValidation={true}
      >
        <TestFormContent />
      </SmartForm>
    );

    const emailInput = screen.getByPlaceholderText('Email');
    await user.type(emailInput, 'invalid-email');

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('handles submission errors gracefully', async () => {
    const user = userEvent.setup();
    const errorSubmit = jest.fn().mockRejectedValue(new Error('Submission failed'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    render(
      <SmartForm schema={testSchema} onSubmit={errorSubmit}>
        <TestFormContent />
      </SmartForm>
    );

    await user.type(screen.getByPlaceholderText('Name'), 'John Doe');
    await user.type(screen.getByPlaceholderText('Email'), 'john@example.com');
    await user.type(screen.getByPlaceholderText('Age'), '25');

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Form submission error:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('applies custom className', () => {
    const { container } = render(
      <SmartForm 
        schema={testSchema} 
        onSubmit={mockOnSubmit}
        className="custom-form-class"
      >
        <TestFormContent />
      </SmartForm>
    );

    expect(container.querySelector('.custom-form-class')).toBeInTheDocument();
  });
});