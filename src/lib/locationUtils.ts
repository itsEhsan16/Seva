import { Location, GeocodingResult, DistanceResult } from '@/hooks/useLocation';

export interface ServiceArea {
  city?: string;
  state?: string;
  pincode?: string;
  radius?: number; // in kilometers
}

export interface LocationFilter {
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  pincode?: string;
  radius?: number; // in kilometers, default 25
}

export const DEFAULT_SEARCH_RADIUS = 25; // kilometers
export const MAX_SEARCH_RADIUS = 100; // kilometers

/**
 * Parse service areas from string array to structured format
 */
export const parseServiceAreas = (serviceAreas: string[]): ServiceArea[] => {
  return serviceAreas.map(area => {
    const parts = area.split(',').map(part => part.trim());
    const serviceArea: ServiceArea = {};
    
    // Try to parse different formats:
    // "City, State"
    // "City, State, Pincode"
    // "State"
    // "Pincode"
    
    if (parts.length >= 2) {
      serviceArea.city = parts[0];
      serviceArea.state = parts[1];
      if (parts.length >= 3 && /^\d{6}$/.test(parts[2])) {
        serviceArea.pincode = parts[2];
      }
    } else if (parts.length === 1) {
      const part = parts[0];
      if (/^\d{6}$/.test(part)) {
        serviceArea.pincode = part;
      } else {
        serviceArea.city = part;
      }
    }
    
    return serviceArea;
  });
};

/**
 * Check if a location matches service areas
 */
export const matchesServiceArea = (
  location: LocationFilter,
  serviceAreas: string[]
): boolean => {
  if (!serviceAreas || serviceAreas.length === 0) return false;
  
  const parsedAreas = parseServiceAreas(serviceAreas);
  
  return parsedAreas.some(area => {
    // Exact pincode match
    if (area.pincode && location.pincode) {
      return area.pincode === location.pincode;
    }
    
    // City and state match
    if (area.city && area.state && location.city && location.state) {
      return (
        area.city.toLowerCase() === location.city.toLowerCase() &&
        area.state.toLowerCase() === location.state.toLowerCase()
      );
    }
    
    // City match only
    if (area.city && location.city) {
      return area.city.toLowerCase() === location.city.toLowerCase();
    }
    
    // State match only
    if (area.state && location.state) {
      return area.state.toLowerCase() === location.state.toLowerCase();
    }
    
    return false;
  });
};

/**
 * Calculate distance between two coordinates
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
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

/**
 * Estimate travel time based on distance
 */
export const estimateTravelTime = (distanceKm: number): number => {
  // Different speed estimates based on distance
  let averageSpeed: number;
  
  if (distanceKm <= 5) {
    averageSpeed = 20; // Urban traffic
  } else if (distanceKm <= 20) {
    averageSpeed = 35; // Mixed urban/suburban
  } else {
    averageSpeed = 50; // Highway/rural
  }
  
  return Math.round((distanceKm / averageSpeed) * 60); // in minutes
};

/**
 * Get distance and travel time between two points
 */
export const getDistanceAndTime = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): DistanceResult => {
  const distance = calculateDistance(lat1, lon1, lat2, lon2);
  const travelTime = estimateTravelTime(distance);
  
  return {
    distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
    travelTime
  };
};

/**
 * Format distance for display
 */
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km`;
  } else {
    return `${Math.round(distanceKm)}km`;
  }
};

/**
 * Format travel time for display
 */
export const formatTravelTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${remainingMinutes}m`;
    }
  }
};

/**
 * Get coordinates from profile address
 */
export const getCoordinatesFromProfile = async (
  address?: string,
  city?: string,
  state?: string,
  pincode?: string
): Promise<{ latitude: number; longitude: number } | null> => {
  // Build address string
  const addressParts = [];
  if (address) addressParts.push(address);
  if (city) addressParts.push(city);
  if (state) addressParts.push(state);
  if (pincode) addressParts.push(pincode);
  
  if (addressParts.length === 0) return null;
  
  const fullAddress = addressParts.join(', ');
  
  try {
    // Use Nominatim for geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&countrycodes=in&limit=1`
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        };
      }
    }
  } catch (error) {
    console.warn('Geocoding failed:', error);
  }
  
  return null;
};

/**
 * Expand search radius when no results found
 */
export const getExpandedRadius = (currentRadius: number): number => {
  if (currentRadius < 25) return 25;
  if (currentRadius < 50) return 50;
  if (currentRadius < 100) return 100;
  return MAX_SEARCH_RADIUS;
};

/**
 * Check if coordinates are valid
 */
export const isValidCoordinates = (lat?: number, lon?: number): boolean => {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
};