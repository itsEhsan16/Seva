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

import { useLocationTracking } from '@/hooks/useLocationTracking';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const mockSupabase = {
  from: vi.fn(),
};

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

describe('useLocationTracking', () => {
  const mockToast = vi.fn();
  const mockSupabaseFrom = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(useAuth).mockReturnValue({
      profile: { id: 'provider-123', role: 'provider' },
    } as any);

    vi.mocked(useToast).mockReturnValue({
      toast: mockToast,
    } as any);

    // Get fresh reference to mocked supabase
    const { supabase } = require('@/integrations/supabase/client');
    supabase.from.mockReturnValue(mockSupabaseFrom);
  });

  it('starts location tracking successfully', async () => {
    const mockPosition = {
      coords: {
        latitude: 12.9716,
        longitude: 77.5946,
        accuracy: 10,
        heading: 45,
        speed: 5, // m/s
      },
    };

    mockGeolocation.watchPosition.mockImplementation((success) => {
      success(mockPosition);
      return 1; // watch ID
    });

    mockSupabaseFrom.mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    });

    const { result } = renderHook(() => 
      useLocationTracking('booking-123')
    );

    await result.current.startTracking();

    await waitFor(() => {
      expect(result.current.isTracking).toBe(true);
    });

    expect(mockGeolocation.watchPosition).toHaveBeenCalled();
    expect(result.current.currentLocation).toMatchObject({
      provider_id: 'provider-123',
      booking_id: 'booking-123',
      latitude: 12.9716,
      longitude: 77.5946,
      accuracy: 10,
      heading: 45,
      speed: 18, // Converted to km/h
    });
  });

  it('handles geolocation permission denied', async () => {
    const mockError = {
      code: 1, // PERMISSION_DENIED
      message: 'Permission denied',
    };

    mockGeolocation.watchPosition.mockImplementation((success, error) => {
      error(mockError);
    });

    const { result } = renderHook(() => 
      useLocationTracking('booking-123')
    );

    await result.current.startTracking();

    await waitFor(() => {
      expect(result.current.error).toBe('Location access denied by user');
    });

    expect(result.current.isTracking).toBe(false);
    expect(mockToast).toHaveBeenCalledWith({
      title: "Location Error",
      description: "Location access denied by user",
      variant: "destructive",
    });
  });

  it('handles geolocation position unavailable', async () => {
    const mockError = {
      code: 2, // POSITION_UNAVAILABLE
      message: 'Position unavailable',
    };

    mockGeolocation.watchPosition.mockImplementation((success, error) => {
      error(mockError);
    });

    const { result } = renderHook(() => 
      useLocationTracking('booking-123')
    );

    await result.current.startTracking();

    await waitFor(() => {
      expect(result.current.error).toBe('Location information unavailable');
    });
  });

  it('handles geolocation timeout', async () => {
    const mockError = {
      code: 3, // TIMEOUT
      message: 'Timeout',
    };

    mockGeolocation.watchPosition.mockImplementation((success, error) => {
      error(mockError);
    });

    const { result } = renderHook(() => 
      useLocationTracking('booking-123')
    );

    await result.current.startTracking();

    await waitFor(() => {
      expect(result.current.error).toBe('Location request timed out');
    });
  });

  it('stops location tracking', async () => {
    mockGeolocation.watchPosition.mockReturnValue(1);

    const { result } = renderHook(() => 
      useLocationTracking('booking-123')
    );

    // Start tracking first
    await result.current.startTracking();
    
    await waitFor(() => {
      expect(result.current.isTracking).toBe(true);
    });

    // Stop tracking
    result.current.stopTracking();

    expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(1);
    expect(result.current.isTracking).toBe(false);
    expect(result.current.currentLocation).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('sends arrival notification', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { customer_id: 'customer-123' },
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => 
      useLocationTracking('booking-123')
    );

    await result.current.notifyArrival();

    expect(mockToast).toHaveBeenCalledWith({
      title: "Arrival Notification Sent",
      description: "Customer has been notified of your arrival",
    });
  });

  it('handles arrival notification error', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('Booking not found'),
          }),
        }),
      }),
    });

    const { result } = renderHook(() => 
      useLocationTracking('booking-123')
    );

    await result.current.notifyArrival();

    expect(mockToast).toHaveBeenCalledWith({
      title: "Error",
      description: "Failed to send arrival notification",
      variant: "destructive",
    });
  });

  it('prevents tracking for non-providers', async () => {
    vi.mocked(useAuth).mockReturnValue({
      profile: { id: 'customer-123', role: 'customer' },
    } as any);

    const { result } = renderHook(() => 
      useLocationTracking('booking-123')
    );

    await result.current.startTracking();

    expect(result.current.error).toBe('Invalid tracking configuration');
    expect(result.current.isTracking).toBe(false);
  });

  it('prevents tracking without booking ID', async () => {
    const { result } = renderHook(() => 
      useLocationTracking()
    );

    await result.current.startTracking();

    expect(result.current.error).toBe('Invalid tracking configuration');
    expect(result.current.isTracking).toBe(false);
  });

  it('handles unsupported geolocation', async () => {
    // Temporarily remove geolocation support
    const originalGeolocation = global.navigator.geolocation;
    delete (global.navigator as any).geolocation;

    const { result } = renderHook(() => 
      useLocationTracking('booking-123')
    );

    await result.current.startTracking();

    expect(result.current.error).toBe('Geolocation is not supported by this browser');
    expect(result.current.isTracking).toBe(false);

    // Restore geolocation
    global.navigator.geolocation = originalGeolocation;
  });

  it('subscribes to location updates', () => {
    const mockUnsubscribe = vi.fn();
    const mockNotificationService = {
      subscribeToLocationUpdates: vi.fn().mockReturnValue(mockUnsubscribe),
    };

    vi.doMock('@/lib/notificationService', () => ({
      notificationService: mockNotificationService,
    }));

    const { result } = renderHook(() => 
      useLocationTracking('booking-123')
    );

    const onLocationUpdate = vi.fn();
    const unsubscribe = result.current.subscribeToLocationUpdates(onLocationUpdate);

    expect(mockNotificationService.subscribeToLocationUpdates).toHaveBeenCalledWith(
      'booking-123',
      onLocationUpdate
    );

    unsubscribe();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('cleans up watch on unmount', () => {
    mockGeolocation.watchPosition.mockReturnValue(1);

    const { result, unmount } = renderHook(() => 
      useLocationTracking('booking-123')
    );

    result.current.startTracking();

    unmount();

    expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(1);
  });
});