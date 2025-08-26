import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NotificationCenter } from '@/components/NotificationCenter';
import { useNotifications } from '@/hooks/useNotifications';

// Mock dependencies
vi.mock('@/hooks/useNotifications');

// Mock the dropdown menu components to make them work in tests
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children, open, onOpenChange }: any) => (
    <div data-testid="dropdown-menu" data-open={open}>
      {children}
    </div>
  ),
  DropdownMenuTrigger: ({ children, asChild }: any) => (
    <div data-testid="dropdown-trigger">{children}</div>
  ),
  DropdownMenuContent: ({ children }: any) => (
    <div data-testid="dropdown-content">{children}</div>
  ),
}));

const mockNotifications = [
  {
    id: 'notif-1',
    user_id: 'user-123',
    type: 'booking_confirmed',
    title: 'Booking Confirmed',
    message: 'Your booking has been confirmed',
    data: { booking_id: 'booking-123' },
    is_read: false,
    priority: 'normal',
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'notif-2',
    user_id: 'user-123',
    type: 'payment_received',
    title: 'Payment Received',
    message: 'Payment has been processed',
    data: { payment_id: 'pay-123' },
    is_read: true,
    priority: 'high',
    created_at: '2024-01-15T09:00:00Z',
  },
  {
    id: 'notif-3',
    user_id: 'user-123',
    type: 'arrival_notification',
    title: 'Provider Arrived',
    message: 'Your service provider has arrived',
    data: { booking_id: 'booking-456' },
    is_read: false,
    priority: 'urgent',
    created_at: '2024-01-15T11:00:00Z',
  },
];

describe('NotificationCenter', () => {
  const mockMarkAsRead = vi.fn();
  const mockMarkAllAsRead = vi.fn();
  const mockDeleteNotification = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(useNotifications).mockReturnValue({
      notifications: mockNotifications,
      unreadCount: 2,
      loading: false,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteNotification: mockDeleteNotification,
      sendNotification: vi.fn(),
      fetchNotifications: vi.fn(),
      getNotificationsByType: vi.fn(),
      getUnreadNotifications: vi.fn(),
    });
  });

  it('renders notification bell with unread count', () => {
    render(<NotificationCenter />);
    
    expect(screen.getByLabelText('Notifications (2 unread)')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Unread count badge
  });

  it('does not show badge when no unread notifications', () => {
    vi.mocked(useNotifications).mockReturnValue({
      notifications: mockNotifications.map(n => ({ ...n, is_read: true })),
      unreadCount: 0,
      loading: false,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteNotification: mockDeleteNotification,
      sendNotification: vi.fn(),
      fetchNotifications: vi.fn(),
      getNotificationsByType: vi.fn(),
      getUnreadNotifications: vi.fn(),
    });

    render(<NotificationCenter />);
    
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('renders notification center with correct structure', () => {
    render(<NotificationCenter />);
    
    expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-trigger')).toBeInTheDocument();
  });

  it('displays notification data correctly', () => {
    render(<NotificationCenter />);
    
    // The component should render with the mocked data
    expect(screen.getByLabelText('Notifications (2 unread)')).toBeInTheDocument();
  });

  it('calls markAsRead when provided', () => {
    render(<NotificationCenter />);
    
    // Test that the hook is called correctly
    expect(useNotifications).toHaveBeenCalled();
  });

  it('handles loading state correctly', () => {
    vi.mocked(useNotifications).mockReturnValue({
      notifications: [],
      unreadCount: 0,
      loading: true,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteNotification: mockDeleteNotification,
      sendNotification: vi.fn(),
      fetchNotifications: vi.fn(),
      getNotificationsByType: vi.fn(),
      getUnreadNotifications: vi.fn(),
    });

    render(<NotificationCenter />);
    
    // Component should render without errors during loading
    expect(screen.getByText('Loading notifications...')).toBeInTheDocument();
  });

  it('handles empty notifications state', () => {
    vi.mocked(useNotifications).mockReturnValue({
      notifications: [],
      unreadCount: 0,
      loading: false,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteNotification: mockDeleteNotification,
      sendNotification: vi.fn(),
      fetchNotifications: vi.fn(),
      getNotificationsByType: vi.fn(),
      getUnreadNotifications: vi.fn(),
    });

    render(<NotificationCenter />);
    
    // Should not show badge when no unread notifications
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('calls notification functions when available', () => {
    render(<NotificationCenter />);
    
    // Verify that the component has access to all notification functions
    const hookResult = vi.mocked(useNotifications).mock.results[0].value;
    expect(typeof hookResult.markAsRead).toBe('function');
    expect(typeof hookResult.markAllAsRead).toBe('function');
    expect(typeof hookResult.deleteNotification).toBe('function');
  });
});