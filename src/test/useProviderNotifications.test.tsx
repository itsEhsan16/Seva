import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useProviderNotifications } from '@/hooks/useProviderNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('@/contexts/AuthContext');
vi.mock('@/integrations/supabase/client');
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockProfile = {
  id: 'provider-1',
  role: 'provider' as const,
};

const mockNotifications = [
  {
    id: 'notif-1',
    type: 'new_booking',
    title: 'New Booking',
    message: 'You have a new booking',
    is_read: false,
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'notif-2',
    type: 'payment_received',
    title: 'Payment Received',
    message: 'Payment of ₹500 received',
    is_read: true,
    created_at: '2024-01-14T15:30:00Z'
  }
];

describe('useProviderNotifications', () => {
  const mockSupabaseFrom = vi.fn();
  const mockSupabaseChannel = vi.fn();
  const mockSupabaseRemoveChannel = vi.fn();

  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      profile: mockProfile,
    } as any);

    vi.mocked(supabase).from = mockSupabaseFrom;
    vi.mocked(supabase).channel = mockSupabaseChannel;
    vi.mocked(supabase).removeChannel = mockSupabaseRemoveChannel;

    // Mock successful fetch
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: mockNotifications,
              error: null
            })
          })
        })
      })
    });

    // Mock channel subscription
    mockSupabaseChannel.mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn()
    });
  });

  it('fetches notifications on mount', async () => {
    const { result } = renderHook(() => useProviderNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.notifications).toEqual(mockNotifications);
    expect(result.current.unreadCount).toBe(1);
  });

  it('calculates unread count correctly', async () => {
    const { result } = renderHook(() => useProviderNotifications());

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
              error: null
            })
          })
        })
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: mockUpdate
        })
      })
    });

    const { result } = renderHook(() => useProviderNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.markAsRead('notif-1');

    expect(mockUpdate).toHaveBeenCalled();
  });

  it('marks all notifications as read', async () => {
    const mockUpdate = vi.fn().mockResolvedValue({ error: null });
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: mockNotifications,
              error: null
            })
          })
        })
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: mockUpdate
        })
      })
    });

    const { result } = renderHook(() => useProviderNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.markAllAsRead();

    expect(mockUpdate).toHaveBeenCalled();
  });

  it('handles fetch error gracefully', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Fetch failed')
            })
          })
        })
      })
    });

    const { result } = renderHook(() => useProviderNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it('does not fetch when no profile', () => {
    vi.mocked(useAuth).mockReturnValue({
      profile: null,
    } as any);

    const { result } = renderHook(() => useProviderNotifications());

    expect(result.current.loading).toBe(true);
    expect(mockSupabaseFrom).not.toHaveBeenCalled();
  });
});