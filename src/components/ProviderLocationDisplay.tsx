import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Navigation, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { ProviderLocation } from '@/lib/notificationService';
import { formatDistanceToNow } from 'date-fns';

interface ProviderLocationDisplayProps {
  bookingId: string;
  providerName?: string;
}

export const ProviderLocationDisplay: React.FC<ProviderLocationDisplayProps> = ({
  bookingId,
  providerName = 'Service Provider'
}) => {
  const { subscribeToLocationUpdates } = useLocationTracking();
  const [providerLocation, setProviderLocation] = useState<ProviderLocation | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToLocationUpdates((location) => {
      setProviderLocation(location);
      setLastUpdate(new Date());
    });

    return unsubscribe;
  }, [subscribeToLocationUpdates]);

  const formatCoordinate = (coord: number) => {
    return coord.toFixed(6);
  };

  const formatSpeed = (speed?: number) => {
    if (!speed) return null;
    return `${speed.toFixed(1)} km/h`;
  };

  const getLocationStatus = () => {
    if (!providerLocation) return 'No location data';
    if (!lastUpdate) return 'Location available';
    
    const minutesAgo = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60));
    if (minutesAgo < 2) return 'Live';
    if (minutesAgo < 5) return 'Recent';
    return 'Last seen';
  };

  const getStatusColor = () => {
    if (!providerLocation) return 'secondary';
    if (!lastUpdate) return 'secondary';
    
    const minutesAgo = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60));
    if (minutesAgo < 2) return 'default';
    if (minutesAgo < 5) return 'secondary';
    return 'outline';
  };

  if (!providerLocation) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Provider Location
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Location tracking is not available for this booking yet.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {providerName} Location
          <Badge variant={getStatusColor()} className="ml-auto">
            {getLocationStatus()}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Latitude:</span>
              <p className="font-mono">{formatCoordinate(providerLocation.latitude)}</p>
            </div>
            
            <div>
              <span className="text-gray-600">Longitude:</span>
              <p className="font-mono">{formatCoordinate(providerLocation.longitude)}</p>
            </div>
            
            {providerLocation.accuracy && (
              <div>
                <span className="text-gray-600">Accuracy:</span>
                <p>±{providerLocation.accuracy.toFixed(0)}m</p>
              </div>
            )}
            
            {providerLocation.speed && (
              <div>
                <span className="text-gray-600">Speed:</span>
                <p>{formatSpeed(providerLocation.speed)}</p>
              </div>
            )}
          </div>

          {lastUpdate && (
            <div className="pt-2 border-t">
              <span className="text-gray-600 text-sm">Last Updated:</span>
              <p className="text-sm">
                {formatDistanceToNow(lastUpdate, { addSuffix: true })}
              </p>
            </div>
          )}
        </div>

        {providerLocation.estimated_arrival && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Clock className="h-4 w-4 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">Estimated Arrival</p>
              <p className="text-sm text-blue-700">
                {new Date(providerLocation.estimated_arrival).toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Navigation className="h-4 w-4" />
          <span>
            Location updates are provided in real-time when available
          </span>
        </div>
      </CardContent>
    </Card>
  );
};