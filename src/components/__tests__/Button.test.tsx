import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from '@/design-system/components/base/Button';

describe('Button Component', () => {
  const defaultProps = {
    children: 'Test Button',
    onClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders button with correct text', () => {
    render(<Button {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    render(<Button {...defaultProps} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant styles correctly', () => {
    const { rerender } = render(<Button {...defaultProps} variant="primary" />);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-600');

    rerender(<Button {...defaultProps} variant="secondary" />);
    button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-600');
  });

  it('applies size styles correctly', () => {
    const { rerender } = render(<Button {...defaultProps} size="sm" />);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('px-3 py-1.5 text-sm');

    rerender(<Button {...defaultProps} size="lg" />);
    button = screen.getByRole('button');
    expect(button).toHaveClass('px-6 py-3 text-lg');
  });

  it('disables button when disabled prop is true', () => {
    render(<Button {...defaultProps} disabled />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('does not call onClick when disabled', () => {
    render(<Button {...defaultProps} disabled />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(defaultProps.onClick).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<Button {...defaultProps} className="custom-class" />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('renders with loading state', () => {
    render(<Button {...defaultProps} loading />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('opacity-75');
    expect(button).toBeDisabled();
  });

  it('renders with icon when provided', () => {
    const Icon = () => <span data-testid="icon">🚀</span>;
    render(<Button {...defaultProps} icon={<Icon />} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('applies full width when fullWidth prop is true', () => {
    render(<Button {...defaultProps} fullWidth />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('w-full');
  });
});
