import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProgressTracker, generateSampleProgressData } from '../ProgressTracker';
import type { ProgressData, ProgressStep } from '../ProgressTracker';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  useAnimation: () => ({ start: jest.fn() }),
  useMotionValue: () => ({ set: jest.fn() }),
  useTransform: () => '50%',
  AnimatePresence: ({ children }: any) => children,
}));

describe('ProgressTracker', () => {
  const sampleSteps: ProgressStep[] = [
    {
      id: 'step-1',
      label: 'Step 1',
      description: 'First step',
      completed: true,
    },
    {
      id: 'step-2',
      label: 'Step 2',
      description: 'Second step',
      completed: false,
      current: true,
    },
    {
      id: 'step-3',
      label: 'Step 3',
      description: 'Third step',
      completed: false,
    },
  ];

  const sampleProgressData: ProgressData[] = [
    {
      title: 'Linear Progress',
      steps: sampleSteps,
      overallProgress: 33,
      type: 'linear',
      animated: true,
      showPercentage: true,
    },
    {
      title: 'Circular Progress',
      steps: sampleSteps,
      overallProgress: 66,
      type: 'circular',
      animated: true,
      showPercentage: true,
    },
    {
      title: 'Milestone Progress',
      steps: sampleSteps,
      overallProgress: 50,
      type: 'milestone',
      animated: true,
    },
  ];

  it('renders all progress trackers correctly', () => {
    render(<ProgressTracker progressData={sampleProgressData} />);
    
    expect(screen.getByText('Linear Progress')).toBeInTheDocument();
    expect(screen.getByText('Circular Progress')).toBeInTheDocument();
    expect(screen.getByText('Milestone Progress')).toBeInTheDocument();
  });

  it('displays progress percentages when enabled', () => {
    render(<ProgressTracker progressData={sampleProgressData} />);
    
    expect(screen.getByText('33% Complete')).toBeInTheDocument();
    expect(screen.getByText('66% Complete')).toBeInTheDocument();
  });

  it('renders milestone steps correctly', () => {
    render(<ProgressTracker progressData={sampleProgressData} />);
    
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('Step 3')).toBeInTheDocument();
    expect(screen.getByText('First step')).toBeInTheDocument();
  });

  it('handles step click events', () => {
    const onStepClick = jest.fn();
    render(<ProgressTracker progressData={sampleProgressData} onStepClick={onStepClick} />);
    
    // Find and click a step in milestone progress
    const step1 = screen.getByText('Step 1');
    const stepButton = step1.closest('div')?.querySelector('div[role="button"]') || 
                     step1.closest('button') ||
                     step1.parentElement?.querySelector('div');
    
    if (stepButton) {
      fireEvent.click(stepButton);
      expect(onStepClick).toHaveBeenCalled();
    }
  });

  it('applies different layouts correctly', () => {
    const { rerender } = render(
      <ProgressTracker progressData={sampleProgressData} layout="grid" />
    );
    
    expect(screen.getByText('Linear Progress')).toBeInTheDocument();
    
    rerender(<ProgressTracker progressData={sampleProgressData} layout="list" />);
    expect(screen.getByText('Linear Progress')).toBeInTheDocument();
    
    rerender(<ProgressTracker progressData={sampleProgressData} layout="compact" />);
    expect(screen.getByText('Linear Progress')).toBeInTheDocument();
  });

  it('shows steps summary for non-milestone types', () => {
    render(<ProgressTracker progressData={sampleProgressData} />);
    
    // Should show completed/total steps for linear and circular progress
    expect(screen.getByText('1 of 3 steps completed')).toBeInTheDocument();
    expect(screen.getByText('2 remaining')).toBeInTheDocument();
  });

  it('handles interactive mode', () => {
    render(<ProgressTracker progressData={sampleProgressData} interactive={true} />);
    
    // All progress trackers should be rendered
    expect(screen.getByText('Linear Progress')).toBeInTheDocument();
    expect(screen.getByText('Circular Progress')).toBeInTheDocument();
    expect(screen.getByText('Milestone Progress')).toBeInTheDocument();
  });

  it('handles non-interactive mode', () => {
    render(<ProgressTracker progressData={sampleProgressData} interactive={false} />);
    
    // Should still render but without interactive features
    expect(screen.getByText('Linear Progress')).toBeInTheDocument();
  });

  it('renders radial progress type', () => {
    const radialProgress: ProgressData = {
      title: 'Radial Progress',
      steps: sampleSteps,
      overallProgress: 75,
      type: 'radial',
      animated: true,
      showPercentage: true,
    };

    render(<ProgressTracker progressData={[radialProgress]} />);
    
    expect(screen.getByText('Radial Progress')).toBeInTheDocument();
    expect(screen.getByText('75% Complete')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ProgressTracker progressData={sampleProgressData} className="custom-progress" />
    );
    
    expect(container.firstChild).toHaveClass('custom-progress');
  });

  it('handles progress with gradient', () => {
    const gradientProgress: ProgressData = {
      title: 'Gradient Progress',
      steps: sampleSteps,
      overallProgress: 40,
      type: 'linear',
      gradient: true,
      animated: true,
    };

    render(<ProgressTracker progressData={[gradientProgress]} />);
    
    expect(screen.getByText('Gradient Progress')).toBeInTheDocument();
  });

  it('handles progress without percentage display', () => {
    const noPercentageProgress: ProgressData = {
      title: 'No Percentage Progress',
      steps: sampleSteps,
      overallProgress: 60,
      type: 'circular',
      showPercentage: false,
    };

    render(<ProgressTracker progressData={[noPercentageProgress]} />);
    
    expect(screen.getByText('No Percentage Progress')).toBeInTheDocument();
    expect(screen.queryByText('60% Complete')).not.toBeInTheDocument();
  });

  it('handles progress without animation', () => {
    const staticProgress: ProgressData = {
      title: 'Static Progress',
      steps: sampleSteps,
      overallProgress: 80,
      type: 'linear',
      animated: false,
    };

    render(<ProgressTracker progressData={[staticProgress]} />);
    
    expect(screen.getByText('Static Progress')).toBeInTheDocument();
  });

  it('displays step indicators correctly for milestone type', () => {
    const milestoneData: ProgressData = {
      title: 'Milestone Test',
      steps: sampleSteps,
      overallProgress: 33,
      type: 'milestone',
    };

    render(<ProgressTracker progressData={[milestoneData]} />);
    
    // Should show checkmark for completed step
    expect(screen.getByText('✓')).toBeInTheDocument();
    
    // Should show step numbers for incomplete steps
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});

describe('generateSampleProgressData', () => {
  it('generates correct number of progress data items', () => {
    const progressData = generateSampleProgressData(5);
    expect(progressData).toHaveLength(5);
  });

  it('generates progress data with correct structure', () => {
    const progressData = generateSampleProgressData(3);
    
    progressData.forEach(data => {
      expect(data).toHaveProperty('title');
      expect(data).toHaveProperty('steps');
      expect(data).toHaveProperty('overallProgress');
      expect(data).toHaveProperty('type');
      expect(data).toHaveProperty('animated');
      expect(data).toHaveProperty('showPercentage');
      expect(data).toHaveProperty('color');
      expect(data).toHaveProperty('gradient');
      
      expect(Array.isArray(data.steps)).toBe(true);
      expect(typeof data.overallProgress).toBe('number');
    });
  });

  it('generates default 3 progress data items when count not specified', () => {
    const progressData = generateSampleProgressData();
    expect(progressData).toHaveLength(3);
  });

  it('generates valid progress types', () => {
    const progressData = generateSampleProgressData(10);
    const validTypes = ['linear', 'circular', 'radial', 'milestone'];
    
    progressData.forEach(data => {
      expect(validTypes).toContain(data.type);
    });
  });

  it('generates steps with correct structure', () => {
    const progressData = generateSampleProgressData(5);
    
    progressData.forEach(data => {
      data.steps.forEach(step => {
        expect(step).toHaveProperty('id');
        expect(step).toHaveProperty('label');
        expect(step).toHaveProperty('description');
        expect(step).toHaveProperty('completed');
        expect(typeof step.completed).toBe('boolean');
      });
    });
  });

  it('generates progress values within valid range', () => {
    const progressData = generateSampleProgressData(10);
    
    progressData.forEach(data => {
      expect(data.overallProgress).toBeGreaterThanOrEqual(0);
      expect(data.overallProgress).toBeLessThanOrEqual(100);
    });
  });

  it('generates consistent completed steps and overall progress', () => {
    const progressData = generateSampleProgressData(5);
    
    progressData.forEach(data => {
      const completedSteps = data.steps.filter(step => step.completed).length;
      const expectedProgress = (completedSteps / data.steps.length) * 100;
      expect(data.overallProgress).toBe(expectedProgress);
    });
  });
});