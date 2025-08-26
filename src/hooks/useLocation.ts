import { useState, useEffect } from 'react';

export interface Location {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  pincode?: string;
}

export interface LocationError {
  code: number;
  message: string;
}

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  pincode?: string;
}

export interface DistanceResult {
  distance: number; // in kilometers
  travelTime?: number; // in minutes (estimated)
}

export const useLocation = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<LocationError | null>(null);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by this browser.'
      });
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const geocodedLocation = await reverseGeocode(latitude, longitude);
          setLocation(geocodedLocation);
        } catch (geocodeError) {
          // Still set coordinates even if geocoding fails
          setLocation({ latitude, longitude });
        }
        
        setLoading(false);
      },
      (error) => {
        setError({
          code: error.code,
          message: getGeolocationErrorMessage(error.code)
        });
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const geocodeAddress = async (address: string): Promise<GeocodingResult | null> => {
    try {
      setLoading(true);
      setError(null);

      // Try multiple geocoding services for better reliability
      const encodedAddress = encodeURIComponent(address);
      
      // Primary: OpenCage (free tier)
      try {
        const response = await fetch(
          `https://api.opencagedata.com/geocode/v1/json?q=${encodedAddress}&key=demo&limit=1&countrycode=in`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            const result = data.results[0];
            return {
              latitude: result.geometry.lat,
              longitude: result.geometry.lng,
              city: result.components?.city || result.components?.town || result.components?.village,
              state: result.components?.state,
              country: result.components?.country,
              address: result.formatted,
              pincode: result.components?.postcode
            };
          }
        }
      } catch (openCageError) {
        console.warn('OpenCage geocoding failed:', openCageError);
      }

      // Fallback: Nominatim (OpenStreetMap)
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&countrycodes=in&limit=1&addressdetails=1`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            const result = data[0];
            return {
              latitude: parseFloat(result.lat),
              longitude: parseFloat(result.lon),
              city: result.address?.city || result.address?.town || result.address?.village,
              state: result.address?.state,
              country: result.address?.country,
              address: result.display_name,
              pincode: result.address?.postcode
            };
          }
        }
      } catch (nominatimError) {
        console.warn('Nominatim geocoding failed:', nominatimError);
      }

      throw new Error('Unable to geocode the provided address');
    } catch (err: any) {
      setError({
        code: -1,
        message: err.message || 'Failed to geocode address'
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reverseGeocode = async (latitude: number, longitude: number): Promise<Location> => {
    try {
      // Try OpenCage first
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=demo&limit=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const result = data.results[0];
          return {
            latitude,
            longitude,
            city: result.components?.city || result.components?.town || result.components?.village,
            state: result.components?.state,
            country: result.components?.country,
            address: result.formatted,
            pincode: result.components?.postcode
          };
        }
      }
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
    }

    // Fallback with just coordinates
    return { latitude, longitude };
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateDistanceAndTime = (
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): DistanceResult => {
    const distance = calculateDistance(lat1, lon1, lat2, lon2);
    
    // Estimate travel time based on distance
    // Assuming average speed of 30 km/h in urban areas
    const averageSpeed = 30; // km/h
    const travelTime = Math.round((distance / averageSpeed) * 60); // in minutes
    
    return {
      distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
      travelTime
    };
  };

  const isWithinRadius = (
    centerLat: number,
    centerLon: number,
    targetLat: number,
    targetLon: number,
    radiusKm: number
  ): boolean => {
    const distance = calculateDistance(centerLat, centerLon, targetLat, targetLon);
    return distance <= radiusKm;
  };

  const getGeolocationErrorMessage = (code: number): string => {
    switch (code) {
      case 1:
        return 'Location access denied. Please enable location permissions.';
      case 2:
        return 'Location unavailable. Please check your connection.';
      case 3:
        return 'Location request timed out. Please try again.';
      default:
        return 'Unable to retrieve your location.';
    }
  };

  return {
    location,
    loading,
    error,
    getCurrentLocation,
    geocodeAddress,
    reverseGeocode,
    calculateDistance,
    calculateDistanceAndTime,
    isWithinRadius
  };
};