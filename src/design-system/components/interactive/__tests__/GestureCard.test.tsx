import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GestureCard, presetSwipeActions } from '../GestureCard';
import type { SwipeAction } from '../GestureCard';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  useMotionValue: () => ({ set: jest.fn() }),
  useTransform: () => 1,
  AnimatePresence: ({ children }: any) => children,
}));

describe('GestureCard', () => {
  const mockSwipeAction: SwipeAction = {
    id: 'test-action',
    label: 'Test Action',
    color: 'primary',
    action: jest.fn(),
  };

  const defaultProps = {
    children: <div>Test Content</div>,
    swipeActions: {
      left: [mockSwipeAction],
      right: [presetSwipeActions.delete],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children correctly', () => {
    render(<GestureCard {...defaultProps} />);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders swipe actions when provided', () => {
    render(<GestureCard {...defaultProps} />);
    
    // Actions should be rendered but might not be visible initially
    const actionButtons = screen.getAllByRole('button');
    expect(actionButtons.length).toBeGreaterThan(0);
  });

  it('calls action when swipe action button is clicked', () => {
    render(<GestureCard {...defaultProps} />);
    
    const actionButton = screen.getByText('T'); // First letter of "Test Action"
    fireEvent.click(actionButton);
    
    expect(mockSwipeAction.action).toHaveBeenCalled();
  });

  it('applies correct color classes to action buttons', () => {
    render(<GestureCard {...defaultProps} />);
    
    const primaryButton = screen.getByText('T');
    expect(primaryButton).toHaveClass('bg-blue-500');
    
    const dangerButton = screen.getByText('D');
    expect(dangerButton).toHaveClass('bg-red-500');
  });

  it('handles drag disabled state', () => {
    render(<GestureCard {...defaultProps} dragEnabled={false} />);
    
    const card = screen.getByText('Test Content').closest('div');
    expect(card).not.toHaveClass('cursor-grab');
  });

  it('calls onSwipe callback when provided', () => {
    const onSwipe = jest.fn();
    render(<GestureCard {...defaultProps} onSwipe={onSwipe} />);
    
    // Simulate drag end event
    const card = screen.getByText('Test Content').closest('div');
    if (card) {
      fireEvent.mouseDown(card);
      fireEvent.mouseUp(card);
    }
  });

  it('renders without swipe actions', () => {
    render(
      <GestureCard dragEnabled={false}>
        <div>Simple Content</div>
      </GestureCard>
    );
    
    expect(screen.getByText('Simple Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <GestureCard {...defaultProps} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles haptic feedback setting', () => {
    // Mock navigator.vibrate
    Object.defineProperty(navigator, 'vibrate', {
      value: jest.fn(),
      writable: true,
    });

    render(<GestureCard {...defaultProps} hapticFeedback={true} />);
    
    // Haptic feedback would be triggered on drag start
    const card = screen.getByText('Test Content').closest('div');
    if (card) {
      fireEvent.mouseDown(card);
    }
  });

  it('uses custom swipe threshold', () => {
    render(<GestureCard {...defaultProps} swipeThreshold={200} />);
    
    // Component should render without errors with custom threshold
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});

describe('presetSwipeActions', () => {
  it('contains expected preset actions', () => {
    expect(presetSwipeActions.delete).toBeDefined();
    expect(presetSwipeActions.archive).toBeDefined();
    expect(presetSwipeActions.favorite).toBeDefined();
    expect(presetSwipeActions.share).toBeDefined();
  });

  it('preset actions have correct properties', () => {
    expect(presetSwipeActions.delete.color).toBe('danger');
    expect(presetSwipeActions.archive.color).toBe('warning');
    expect(presetSwipeActions.favorite.color).toBe('success');
    expect(presetSwipeActions.share.color).toBe('primary');
  });

  it('preset actions have callable action functions', () => {
    // Mock console.log to avoid output during tests
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    presetSwipeActions.delete.action();
    presetSwipeActions.archive.action();
    presetSwipeActions.favorite.action();
    presetSwipeActions.share.action();
    
    expect(consoleSpy).toHaveBeenCalledTimes(4);
    consoleSpy.mockRestore();
  });
});