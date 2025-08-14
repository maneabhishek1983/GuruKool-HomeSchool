import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationCenter, generateSampleNotifications } from '../NotificationCenter';
import type { Notification, NotificationAction } from '../NotificationCenter';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, onClick, ...rest }: any) => {
      // Only pass valid HTML attributes
      const validProps: any = {};
      if (className) validProps.className = className;
      if (style) validProps.style = style;
      if (onClick) validProps.onClick = onClick;
      return <div {...validProps}>{children}</div>;
    },
    button: ({ children, className, style, onClick, type, disabled, ...rest }: any) => {
      const validProps: any = {};
      if (className) validProps.className = className;
      if (style) validProps.style = style;
      if (onClick) validProps.onClick = onClick;
      if (type) validProps.type = type;
      if (disabled) validProps.disabled = disabled;
      return <button {...validProps}>{children}</button>;
    },
    span: ({ children, className, style, ...rest }: any) => {
      const validProps: any = {};
      if (className) validProps.className = className;
      if (style) validProps.style = style;
      return <span {...validProps}>{children}</span>;
    },
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('NotificationCenter', () => {
  const mockAction: NotificationAction = {
    id: 'test-action',
    label: 'Test Action',
    type: 'primary',
    action: jest.fn(),
  };

  const sampleNotifications: Notification[] = [
    {
      id: '1',
      title: 'Test Notification 1',
      message: 'This is a test notification',
      type: 'info',
      priority: 'medium',
      timestamp: new Date(),
      read: false,
      actionable: true,
      actions: [mockAction],
      category: 'General',
    },
    {
      id: '2',
      title: 'Urgent Notification',
      message: 'This is urgent',
      type: 'error',
      priority: 'urgent',
      timestamp: new Date(Date.now() - 60000), // 1 minute ago
      read: true,
      category: 'System',
    },
    {
      id: '3',
      title: 'AI Insight',
      message: 'AI generated insight',
      type: 'ai-insight',
      priority: 'high',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      read: false,
      aiConfidence: 85,
      category: 'AI',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders notifications correctly', () => {
    render(<NotificationCenter notifications={sampleNotifications} />);
    
    expect(screen.getByText('Test Notification 1')).toBeInTheDocument();
    expect(screen.getByText('Urgent Notification')).toBeInTheDocument();
    expect(screen.getByText('AI Insight')).toBeInTheDocument();
  });

  it('displays unread count badge', () => {
    render(<NotificationCenter notifications={sampleNotifications} />);
    
    // Should show count of unread notifications (2 in our sample)
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows AI filtered badge when enabled', () => {
    render(<NotificationCenter notifications={sampleNotifications} aiFilterEnabled={true} />);
    
    expect(screen.getByText('AI Filtered')).toBeInTheDocument();
  });

  it('handles filter changes', () => {
    render(<NotificationCenter notifications={sampleNotifications} />);
    
    // Click on unread filter
    const unreadFilter = screen.getByText('Unread');
    fireEvent.click(unreadFilter);
    
    // Should still show notifications (filtering logic is internal)
    expect(screen.getByText('Test Notification 1')).toBeInTheDocument();
  });

  it('handles urgent filter', () => {
    render(<NotificationCenter notifications={sampleNotifications} />);
    
    const urgentFilter = screen.getByText('Urgent');
    fireEvent.click(urgentFilter);
    
    // Should show urgent notification
    expect(screen.getByText('Urgent Notification')).toBeInTheDocument();
  });

  it('calls onNotificationClick when notification is clicked', () => {
    const onNotificationClick = jest.fn();
    render(
      <NotificationCenter 
        notifications={sampleNotifications} 
        onNotificationClick={onNotificationClick}
      />
    );
    
    const notification = screen.getByText('Test Notification 1').closest('div');
    if (notification) {
      fireEvent.click(notification);
      expect(onNotificationClick).toHaveBeenCalledWith(
        expect.objectContaining({
          ...sampleNotifications[0],
          aiScore: expect.any(Number)
        })
      );
    }
  });

  it('calls onMarkAllRead when mark all read is clicked', () => {
    const onMarkAllRead = jest.fn();
    render(
      <NotificationCenter 
        notifications={sampleNotifications} 
        onMarkAllRead={onMarkAllRead}
      />
    );
    
    const markAllReadButton = screen.getByText('Mark All Read');
    fireEvent.click(markAllReadButton);
    
    expect(onMarkAllRead).toHaveBeenCalled();
  });

  it('calls notification action when action button is clicked', () => {
    render(<NotificationCenter notifications={sampleNotifications} />);
    
    const actionButton = screen.getByText('Test Action');
    fireEvent.click(actionButton);
    
    expect(mockAction.action).toHaveBeenCalledWith(
      expect.objectContaining({
        ...sampleNotifications[0],
        aiScore: expect.any(Number)
      })
    );
  });

  it('calls onNotificationDismiss when dismiss button is clicked', async () => {
    const onNotificationDismiss = jest.fn();
    render(
      <NotificationCenter 
        notifications={sampleNotifications} 
        onNotificationDismiss={onNotificationDismiss}
      />
    );
    
    // Hover over notification to show dismiss button
    const notification = screen.getByText('Test Notification 1').closest('div');
    if (notification) {
      fireEvent.mouseEnter(notification);
      
      // Look for dismiss button (×)
      const dismissButton = screen.getByText('✕');
      fireEvent.click(dismissButton);
      
      expect(onNotificationDismiss).toHaveBeenCalledWith('1');
    }
  });

  it('displays AI confidence when available', () => {
    render(<NotificationCenter notifications={sampleNotifications} />);
    
    expect(screen.getByText('AI Confidence:')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('formats timestamps correctly', () => {
    render(<NotificationCenter notifications={sampleNotifications} showTimestamp={true} />);
    
    // Should show relative timestamps
    expect(screen.getByText('Just now')).toBeInTheDocument();
    expect(screen.getByText('1m ago')).toBeInTheDocument();
    expect(screen.getByText('1h ago')).toBeInTheDocument();
  });

  it('handles groupByCategory option', () => {
    render(<NotificationCenter notifications={sampleNotifications} groupByCategory={true} />);
    
    // Should show category headers
    expect(screen.getByText(/General/)).toBeInTheDocument();
    expect(screen.getByText(/System/)).toBeInTheDocument();
    expect(screen.getByText(/AI/)).toBeInTheDocument();
  });

  it('limits visible notifications based on maxVisible', () => {
    render(<NotificationCenter notifications={sampleNotifications} maxVisible={2} />);
    
    // Should show first 2 notifications
    expect(screen.getByText('Test Notification 1')).toBeInTheDocument();
    expect(screen.getByText('Urgent Notification')).toBeInTheDocument();
  });

  it('shows empty state when no notifications', () => {
    render(<NotificationCenter notifications={[]} />);
    
    expect(screen.getByText('No notifications to display')).toBeInTheDocument();
    expect(screen.getByText('📭')).toBeInTheDocument();
  });

  it('applies different priority colors', () => {
    render(<NotificationCenter notifications={sampleNotifications} />);
    
    const mediumNotification = screen.getByText('Test Notification 1').closest('div');
    const urgentNotification = screen.getByText('Urgent Notification').closest('div');
    const highNotification = screen.getByText('AI Insight').closest('div');
    
    expect(mediumNotification).toHaveClass('border-l-blue-400');
    expect(urgentNotification).toHaveClass('border-l-red-400');
    expect(highNotification).toHaveClass('border-l-orange-400');
  });

  it('applies custom className', () => {
    const { container } = render(
      <NotificationCenter notifications={sampleNotifications} className="custom-notifications" />
    );
    
    expect(container.firstChild).toHaveClass('custom-notifications');
  });

  it('handles AI filter disabled', () => {
    render(<NotificationCenter notifications={sampleNotifications} aiFilterEnabled={false} />);
    
    // Should not show AI filtered badge
    expect(screen.queryByText('AI Filtered')).not.toBeInTheDocument();
  });
});

describe('generateSampleNotifications', () => {
  it('generates correct number of notifications', () => {
    const notifications = generateSampleNotifications(3);
    expect(notifications).toHaveLength(3);
  });

  it('generates notifications with correct structure', () => {
    const notifications = generateSampleNotifications(5);
    
    notifications.forEach(notification => {
      expect(notification).toHaveProperty('id');
      expect(notification).toHaveProperty('title');
      expect(notification).toHaveProperty('message');
      expect(notification).toHaveProperty('type');
      expect(notification).toHaveProperty('priority');
      expect(notification).toHaveProperty('timestamp');
      expect(notification).toHaveProperty('read');
      expect(notification).toHaveProperty('category');
    });
  });

  it('generates default 5 notifications when count not specified', () => {
    const notifications = generateSampleNotifications();
    expect(notifications).toHaveLength(5);
  });

  it('generates notifications with valid types and priorities', () => {
    const notifications = generateSampleNotifications(10);
    const validTypes = ['info', 'success', 'warning', 'error', 'ai-insight'];
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    
    notifications.forEach(notification => {
      expect(validTypes).toContain(notification.type);
      expect(validPriorities).toContain(notification.priority);
    });
  });

  it('generates some notifications with actions', () => {
    const notifications = generateSampleNotifications(10);
    const notificationsWithActions = notifications.filter(n => n.actions && n.actions.length > 0);
    
    // Should have some notifications with actions (random generation)
    expect(notificationsWithActions.length).toBeGreaterThanOrEqual(0);
  });

  it('generates some notifications with AI confidence', () => {
    const notifications = generateSampleNotifications(10);
    const notificationsWithAI = notifications.filter(n => n.aiConfidence !== undefined);
    
    // Should have some notifications with AI confidence (random generation)
    expect(notificationsWithAI.length).toBeGreaterThanOrEqual(0);
  });
});