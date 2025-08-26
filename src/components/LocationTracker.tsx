import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { useAuth } from '@/contexts/AuthContext';

interface LocationTrackerProps {
  bookingId: string;
  isActive?: boolean;
  onTrackingChange?: (isTracking: boolean) => void;
}

export const LocationTracker: React.FC<LocationTrackerProps> = ({
  bookingId,
  isActive = false,
  onTrackingChange
}) => {
  const { profile } = useAuth();
  const {
    isTracking,
    currentLocation,
    error,
    startTracking,
    stopTracking,
    notifyArrival,
  } = useLocationTracking(bookingId);

  const [hasNotifiedArrival, setHasNotifiedArrival] = useState(false);

  // Only show for providers
  if (profile?.role !== 'provider') {
    return null;
  }

  useEffect(() => {
    onTrackingChange?.(isTracking);
  }, [isTracking, onTrackingChange]);

  const handleStartTracking = async () => {
    await startTracking();
  };

  const handleStopTracking = () => {
    stopTracking();
    setHasNotifiedArrival(false);
  };

  const handleNotifyArrival = async () => {
    await notifyArrival();
    setHasNotifiedArrival(true);
  };

  const formatCoordinate = (coord: number) => {
    return coord.toFixed(6);
  };

  const formatSpeed = (speed?: number) => {
    if (!speed) return 'N/A';
    return `${speed.toFixed(1)} km/h`;
  };

  const formatAccuracy = (accuracy?: number) => {
    if (!accuracy) return 'N/A';
    return `±${accuracy.toFixed(0)}m`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location Tracking
          {isTracking && (
            <Badge variant="secondary" className="ml-auto">
              Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          {!isTracking ? (
            <Button 
              onClick={handleStartTracking}
              disabled={!isActive}
              className="flex-1"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Start Tracking
            </Button>
          ) : (
            <Button 
              onClick={handleStopTracking}
              variant="outline"
              className="flex-1"
            >
              Stop Tracking
            </Button>
          )}
          
          {isTracking && !hasNotifiedArrival && (
            <Button 
              onClick={handleNotifyArrival}
              variant="secondary"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              I've Arrived
            </Button>
          )}
        </div>

        {hasNotifiedArrival && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Customer has been notified of your arrival.
            </AlertDescription>
          </Alert>
        )}

        {currentLocation && (
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm">Current Location</h4>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Latitude:</span>
                <p className="font-mono">{formatCoordinate(currentLocation.latitude)}</p>
              </div>
              
              <div>
                <span className="text-gray-600">Longitude:</span>
                <p className="font-mono">{formatCoordinate(currentLocation.longitude)}</p>
              </div>
              
              <div>
                <span className="text-gray-600">Accuracy:</span>
                <p>{formatAccuracy(currentLocation.accuracy)}</p>
              </div>
              
              <div>
                <span className="text-gray-600">Speed:</span>
                <p>{formatSpeed(currentLocation.speed)}</p>
              </div>
            </div>

            {currentLocation.estimated_arrival && (
              <div className="pt-2 border-t">
                <span className="text-gray-600 text-sm">Estimated Arrival:</span>
                <p className="font-medium">
                  {new Date(currentLocation.estimated_arrival).toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>
        )}

        {!isActive && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Location tracking is only available for active bookings.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};