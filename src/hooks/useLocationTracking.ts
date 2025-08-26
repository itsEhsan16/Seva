import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  ProviderLocation, 
  notificationService 
} from '@/lib/notificationService';

interface LocationTrackingOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  updateInterval?: number; // in milliseconds
}

export const useLocationTracking = (
  bookingId?: string,
  options: LocationTrackingOptions = {}
) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<ProviderLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 60000,
    updateInterval = 30000 // Update every 30 seconds
  } = options;

  // Start location tracking for providers
  const startTracking = useCallback(async () => {
    if (!profile?.id || profile.role !== 'provider' || !bookingId) {
      setError('Invalid tracking configuration');
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setIsTracking(true);
    setError(null);

    const geoOptions: PositionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge
    };

    const handleSuccess = async (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy, heading, speed } = position.coords;
      
      try {
        // Calculate estimated arrival time (this is a simplified calculation)
        // In a real app, you'd use a routing service like Google Maps
        const estimatedArrival = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

        await notificationService.updateProviderLocation(
          profile.id,
          bookingId,
          {
            latitude,
            longitude,
            accuracy: accuracy || undefined,
            heading: heading || undefined,
            speed: speed ? speed * 3.6 : undefined, // Convert m/s to km/h
            estimated_arrival: estimatedArrival.toISOString()
          }
        );

        setCurrentLocation({
          id: '', // Will be set by database
          provider_id: profile.id,
          booking_id: bookingId,
          latitude,
          longitude,
          accuracy: accuracy || undefined,
          heading: heading || undefined,
          speed: speed ? speed * 3.6 : undefined,
          estimated_arrival: estimatedArrival.toISOString(),
          created_at: new Date().toISOString()
        });
      } catch (err) {
        console.error('Error updating location:', err);
        setError('Failed to update location');
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      let errorMessage = 'Unknown location error';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location access denied by user';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information unavailable';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out';
          break;
      }
      
      setError(errorMessage);
      setIsTracking(false);
      
      toast({
        title: "Location Error",
        description: errorMessage,
        variant: "destructive",
      });
    };

    // Start watching position
    const id = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      geoOptions
    );

    setWatchId(id);
  }, [profile, bookingId, enableHighAccuracy, timeout, maximumAge, toast]);

  // Stop location tracking
  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
    setCurrentLocation(null);
    setError(null);
  }, [watchId]);

  // Send arrival notification
  const notifyArrival = useCallback(async () => {
    if (!profile?.id || !bookingId) return;

    try {
      // Get customer ID from booking
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: booking } = await supabase
        .from('bookings')
        .select('customer_id')
        .eq('id', bookingId)
        .single();

      if (booking) {
        await notificationService.sendArrivalNotification(
          booking.customer_id,
          profile.id,
          bookingId
        );
        
        toast({
          title: "Arrival Notification Sent",
          description: "Customer has been notified of your arrival",
        });
      }
    } catch (err) {
      console.error('Error sending arrival notification:', err);
      toast({
        title: "Error",
        description: "Failed to send arrival notification",
        variant: "destructive",
      });
    }
  }, [profile?.id, bookingId, toast]);

  // Subscribe to location updates for customers
  const subscribeToLocationUpdates = useCallback((
    onLocationUpdate: (location: ProviderLocation) => void
  ) => {
    if (!bookingId) return () => {};

    return notificationService.subscribeToLocationUpdates(
      bookingId,
      onLocationUpdate
    );
  }, [bookingId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return {
    isTracking,
    currentLocation,
    error,
    startTracking,
    stopTracking,
    notifyArrival,
    subscribeToLocationUpdates,
  };
};