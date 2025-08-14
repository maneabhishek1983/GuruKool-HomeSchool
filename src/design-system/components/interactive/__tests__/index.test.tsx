import * as InteractiveComponents from '../index';

describe('Interactive Components Index', () => {
  it('exports GestureCard component', () => {
    expect(InteractiveComponents.GestureCard).toBeDefined();
    expect(typeof InteractiveComponents.GestureCard).toBe('function');
  });

  it('exports presetSwipeActions', () => {
    expect(InteractiveComponents.presetSwipeActions).toBeDefined();
    expect(typeof InteractiveComponents.presetSwipeActions).toBe('object');
  });

  it('exports AnalyticsDashboard component', () => {
    expect(InteractiveComponents.AnalyticsDashboard).toBeDefined();
    expect(typeof InteractiveComponents.AnalyticsDashboard).toBe('function');
  });

  it('exports generateSampleData function', () => {
    expect(InteractiveComponents.generateSampleData).toBeDefined();
    expect(typeof InteractiveComponents.generateSampleData).toBe('function');
  });

  it('exports NotificationCenter component', () => {
    expect(InteractiveComponents.NotificationCenter).toBeDefined();
    expect(typeof InteractiveComponents.NotificationCenter).toBe('function');
  });

  it('exports generateSampleNotifications function', () => {
    expect(InteractiveComponents.generateSampleNotifications).toBeDefined();
    expect(typeof InteractiveComponents.generateSampleNotifications).toBe('function');
  });

  it('exports ProgressTracker component', () => {
    expect(InteractiveComponents.ProgressTracker).toBeDefined();
    expect(typeof InteractiveComponents.ProgressTracker).toBe('function');
  });

  it('exports generateSampleProgressData function', () => {
    expect(InteractiveComponents.generateSampleProgressData).toBeDefined();
    expect(typeof InteractiveComponents.generateSampleProgressData).toBe('function');
  });

  it('has all expected exports', () => {
    const expectedExports = [
      'GestureCard',
      'presetSwipeActions',
      'AnalyticsDashboard',
      'generateSampleData',
      'NotificationCenter',
      'generateSampleNotifications',
      'ProgressTracker',
      'generateSampleProgressData',
    ];

    expectedExports.forEach(exportName => {
      expect(InteractiveComponents).toHaveProperty(exportName);
    });
  });
});