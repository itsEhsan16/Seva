import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock dependencies first
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('@/contexts/AuthContext');
vi.mock('@/hooks/use-toast');
vi.mock('@/lib/notificationService');

import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const mockSupabase = {
  from: vi.fn(),
};

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
    priority: 'normal',
    created_at: '2024-01-15T09:00:00Z',
  },
];

describe('useNotifications', () => {
  const mockToast = vi.fn();
  const mockSupabaseFrom = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(useAuth).mockReturnValue({
      profile: { id: 'user-123', role: 'customer' },
    } as any);

    vi.mocked(useToast).mockReturnValue({
      toast: mockToast,
    } as any);

    // Get fresh reference to mocked supabase
    const { supabase } = require('@/integrations/supabase/client');
    supabase.from.mockReturnValue(mockSupabaseFrom);
  });

  it('fetches notifications on mount', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: mockNotifications,
              error: null,
            }),
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.notifications).toEqual(mockNotifications);
    expect(result.current.unreadCount).toBe(1);
  });

  it('calculates unread count correctly', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: mockNotifications,
              error: null,
            }),
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(1);
    });
  });

  it('marks notification as read', async () => {
    const mockUpdate = vi.fn().mockResolvedValue({ error: null });
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: mockNotifications,
              error: null,
            }),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue(mockUpdate),
      }),
    });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.markAsRead('notif-1');

    expect(mockUpdate).toHaveBeenCalled();
    expect(result.current.unreadCount).toBe(0);
  });

  it('marks all notifications as read', async () => {
    const mockUpdate = vi.fn().mockResolvedValue({ error: null });
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: mockNotifications,
              error: null,
            }),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue(mockUpdate),
        }),
      }),
    });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.markAllAsRead();

    expect(mockUpdate).toHaveBeenCalled();
    expect(result.current.unreadCount).toBe(0);
  });

  it('deletes notification', async () => {
    const mockDelete = vi.fn().mockResolvedValue({ error: null });
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: mockNotifications,
              error: null,
            }),
          }),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue(mockDelete),
      }),
    });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.deleteNotification('notif-1');

    expect(mockDelete).toHaveBeenCalled();
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.unreadCount).toBe(0);
  });

  it('filters notifications by type', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: mockNotifications,
              error: null,
            }),
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const bookingNotifications = result.current.getNotificationsByType('booking_confirmed');
    expect(bookingNotifications).toHaveLength(1);
    expect(bookingNotifications[0].type).toBe('booking_confirmed');
  });

  it('gets unread notifications', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: mockNotifications,
              error: null,
            }),
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const unreadNotifications = result.current.getUnreadNotifications();
    expect(unreadNotifications).toHaveLength(1);
    expect(unreadNotifications[0].is_read).toBe(false);
  });

  it('handles fetch error gracefully', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error'),
            }),
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: "Error",
      description: "Failed to load notifications",
      variant: "destructive",
    });
  });

  it('returns empty state when no profile', async () => {
    vi.mocked(useAuth).mockReturnValue({
      profile: null,
    } as any);

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });
});