import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseServiceAreas,
  matchesServiceArea,
  calculateDistance,
  estimateTravelTime,
  getDistanceAndTime,
  formatDistance,
  formatTravelTime,
  getCoordinatesFromProfile,
  getExpandedRadius,
  isValidCoordinates,
  DEFAULT_SEARCH_RADIUS,
  MAX_SEARCH_RADIUS
} from '@/lib/locationUtils';

// Mock fetch for geocoding tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('locationUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseServiceAreas', () => {
    it('should parse city and state correctly', () => {
      const areas = ['New Delhi, Delhi', 'Mumbai, Maharashtra'];
      const result = parseServiceAreas(areas);

      expect(result).toEqual([
        { city: 'New Delhi', state: 'Delhi' },
        { city: 'Mumbai', state: 'Maharashtra' }
      ]);
    });

    it('should parse city, state, and pincode correctly', () => {
      const areas = ['New Delhi, Delhi, 110001'];
      const result = parseServiceAreas(areas);

      expect(result).toEqual([
        { city: 'New Delhi', state: 'Delhi', pincode: '110001' }
      ]);
    });

    it('should parse single values correctly', () => {
      const areas = ['Delhi', '110001', 'Mumbai'];
      const result = parseServiceAreas(areas);

      expect(result).toEqual([
        { city: 'Delhi' },
        { pincode: '110001' },
        { city: 'Mumbai' }
      ]);
    });

    it('should handle empty array', () => {
      const result = parseServiceAreas([]);
      expect(result).toEqual([]);
    });
  });

  describe('matchesServiceArea', () => {
    const serviceAreas = ['New Delhi, Delhi', 'Mumbai, Maharashtra', '110001'];

    it('should match by city and state', () => {
      const location = { city: 'New Delhi', state: 'Delhi' };
      expect(matchesServiceArea(location, serviceAreas)).toBe(true);
    });

    it('should match by pincode', () => {
      const location = { pincode: '110001' };
      expect(matchesServiceArea(location, serviceAreas)).toBe(true);
    });

    it('should match by city only', () => {
      const location = { city: 'Mumbai' };
      expect(matchesServiceArea(location, serviceAreas)).toBe(true);
    });

    it('should not match when no criteria match', () => {
      const location = { city: 'Bangalore', state: 'Karnataka' };
      expect(matchesServiceArea(location, serviceAreas)).toBe(false);
    });

    it('should handle empty service areas', () => {
      const location = { city: 'Delhi' };
      expect(matchesServiceArea(location, [])).toBe(false);
    });

    it('should be case insensitive', () => {
      const location = { city: 'new delhi', state: 'DELHI' };
      expect(matchesServiceArea(location, serviceAreas)).toBe(true);
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between Delhi and Mumbai correctly', () => {
      const distance = calculateDistance(
        28.6139, 77.2090, // New Delhi
        19.0760, 72.8777  // Mumbai
      );

      expect(distance).toBeCloseTo(1150, -1); // Within 10km accuracy
    });

    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(28.6139, 77.2090, 28.6139, 77.2090);
      expect(distance).toBeCloseTo(0, 2);
    });

    it('should handle negative coordinates', () => {
      const distance = calculateDistance(-33.8688, 151.2093, -37.8136, 144.9631);
      expect(distance).toBeGreaterThan(0);
    });
  });

  describe('estimateTravelTime', () => {
    it('should estimate travel time for short distances', () => {
      const time = estimateTravelTime(5); // 5km
      expect(time).toBe(15); // 5km at 20km/h = 15 minutes
    });

    it('should estimate travel time for medium distances', () => {
      const time = estimateTravelTime(15); // 15km
      expect(time).toBe(26); // 15km at 35km/h ≈ 26 minutes
    });

    it('should estimate travel time for long distances', () => {
      const time = estimateTravelTime(50); // 50km
      expect(time).toBe(60); // 50km at 50km/h = 60 minutes
    });
  });

  describe('getDistanceAndTime', () => {
    it('should return distance and time', () => {
      const result = getDistanceAndTime(
        28.6139, 77.2090, // New Delhi
        28.7041, 77.1025  // Nearby location (~10km)
      );

      expect(result.distance).toBeCloseTo(14, 0);
      expect(result.travelTime).toBeGreaterThan(0);
      expect(typeof result.distance).toBe('number');
      expect(typeof result.travelTime).toBe('number');
    });

    it('should round distance to 2 decimal places', () => {
      const result = getDistanceAndTime(28.6139, 77.2090, 28.6140, 77.2091);
      expect(result.distance.toString()).toMatch(/^\d+(\.\d{1,2})?$/);
    });
  });

  describe('formatDistance', () => {
    it('should format distances less than 1km in meters', () => {
      expect(formatDistance(0.5)).toBe('500m');
      expect(formatDistance(0.123)).toBe('123m');
    });

    it('should format distances less than 10km with 1 decimal', () => {
      expect(formatDistance(5.67)).toBe('5.7km');
      expect(formatDistance(9.99)).toBe('10.0km');
    });

    it('should format distances 10km and above as whole numbers', () => {
      expect(formatDistance(15.67)).toBe('16km');
      expect(formatDistance(100.1)).toBe('100km');
    });
  });

  describe('formatTravelTime', () => {
    it('should format minutes only for times less than 1 hour', () => {
      expect(formatTravelTime(30)).toBe('30 min');
      expect(formatTravelTime(59)).toBe('59 min');
    });

    it('should format hours only for exact hours', () => {
      expect(formatTravelTime(60)).toBe('1h');
      expect(formatTravelTime(120)).toBe('2h');
    });

    it('should format hours and minutes for mixed times', () => {
      expect(formatTravelTime(90)).toBe('1h 30m');
      expect(formatTravelTime(125)).toBe('2h 5m');
    });
  });

  describe('getCoordinatesFromProfile', () => {
    it('should geocode complete address successfully', async () => {
      const mockResponse = [{
        lat: '28.6139',
        lon: '77.2090'
      }];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await getCoordinatesFromProfile(
        'Connaught Place',
        'New Delhi',
        'Delhi',
        '110001'
      );

      expect(result).toEqual({
        latitude: 28.6139,
        longitude: 77.2090
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('Connaught%20Place%2C%20New%20Delhi%2C%20Delhi%2C%20110001')
      );
    });

    it('should return null for empty address', async () => {
      const result = await getCoordinatesFromProfile();
      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle geocoding failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Geocoding failed'));

      const result = await getCoordinatesFromProfile('Invalid Address');
      expect(result).toBeNull();
    });

    it('should handle empty geocoding response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      });

      const result = await getCoordinatesFromProfile('Some Address');
      expect(result).toBeNull();
    });
  });

  describe('getExpandedRadius', () => {
    it('should expand radius correctly', () => {
      expect(getExpandedRadius(10)).toBe(25);
      expect(getExpandedRadius(25)).toBe(50);
      expect(getExpandedRadius(50)).toBe(100);
      expect(getExpandedRadius(100)).toBe(MAX_SEARCH_RADIUS);
    });

    it('should not expand beyond maximum', () => {
      expect(getExpandedRadius(MAX_SEARCH_RADIUS)).toBe(MAX_SEARCH_RADIUS);
    });
  });

  describe('isValidCoordinates', () => {
    it('should validate correct coordinates', () => {
      expect(isValidCoordinates(28.6139, 77.2090)).toBe(true);
      expect(isValidCoordinates(0, 0)).toBe(true);
      expect(isValidCoordinates(-90, -180)).toBe(true);
      expect(isValidCoordinates(90, 180)).toBe(true);
    });

    it('should reject invalid coordinates', () => {
      expect(isValidCoordinates(91, 0)).toBe(false);
      expect(isValidCoordinates(-91, 0)).toBe(false);
      expect(isValidCoordinates(0, 181)).toBe(false);
      expect(isValidCoordinates(0, -181)).toBe(false);
      expect(isValidCoordinates(undefined, 0)).toBe(false);
      expect(isValidCoordinates(0, undefined)).toBe(false);
    });
  });

  describe('constants', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_SEARCH_RADIUS).toBe(25);
      expect(MAX_SEARCH_RADIUS).toBe(100);
    });
  });
});