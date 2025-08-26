import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useLocation } from '@/hooks/useLocation';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

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

describe('useLocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getCurrentLocation', () => {
    it('should get current location successfully', async () => {
      const mockPosition = {
        coords: {
          latitude: 28.6139,
          longitude: 77.2090,
        },
      };

      const mockGeocodingResponse = {
        results: [{
          geometry: { lat: 28.6139, lng: 77.2090 },
          components: {
            city: 'New Delhi',
            state: 'Delhi',
            country: 'India',
            postcode: '110001'
          },
          formatted: 'New Delhi, Delhi, India'
        }]
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse),
      });

      const { result } = renderHook(() => useLocation());

      act(() => {
        result.current.getCurrentLocation();
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.location).toEqual({
        latitude: 28.6139,
        longitude: 77.2090,
        city: 'New Delhi',
        state: 'Delhi',
        country: 'India',
        address: 'New Delhi, Delhi, India',
        pincode: '110001'
      });
      expect(result.current.error).toBeNull();
    });

    it('should handle geolocation error', async () => {
      const mockError = {
        code: 1,
        message: 'User denied the request for Geolocation.',
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      const { result } = renderHook(() => useLocation());

      act(() => {
        result.current.getCurrentLocation();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toEqual({
        code: 1,
        message: 'Location access denied. Please enable location permissions.',
      });
      expect(result.current.location).toBeNull();
    });

    it('should handle geocoding failure gracefully', async () => {
      const mockPosition = {
        coords: {
          latitude: 28.6139,
          longitude: 77.2090,
        },
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      mockFetch.mockRejectedValueOnce(new Error('Geocoding failed'));

      const { result } = renderHook(() => useLocation());

      act(() => {
        result.current.getCurrentLocation();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.location).toEqual({
        latitude: 28.6139,
        longitude: 77.2090,
      });
      expect(result.current.error).toBeNull();
    });
  });

  describe('geocodeAddress', () => {
    it('should geocode address successfully', async () => {
      const mockGeocodingResponse = {
        results: [{
          geometry: { lat: 28.6139, lng: 77.2090 },
          components: {
            city: 'New Delhi',
            state: 'Delhi',
            country: 'India',
            postcode: '110001'
          },
          formatted: 'New Delhi, Delhi, India'
        }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse),
      });

      const { result } = renderHook(() => useLocation());

      let geocodingResult;
      await act(async () => {
        geocodingResult = await result.current.geocodeAddress('New Delhi, India');
      });

      expect(geocodingResult).toEqual({
        latitude: 28.6139,
        longitude: 77.2090,
        city: 'New Delhi',
        state: 'Delhi',
        country: 'India',
        address: 'New Delhi, Delhi, India',
        pincode: '110001'
      });
    });

    it('should fallback to Nominatim when OpenCage fails', async () => {
      const mockNominatimResponse = [{
        lat: '28.6139',
        lon: '77.2090',
        address: {
          city: 'New Delhi',
          state: 'Delhi',
          country: 'India',
          postcode: '110001'
        },
        display_name: 'New Delhi, Delhi, India'
      }];

      // First call (OpenCage) fails
      mockFetch.mockRejectedValueOnce(new Error('OpenCage failed'));
      
      // Second call (Nominatim) succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockNominatimResponse),
      });

      const { result } = renderHook(() => useLocation());

      let geocodingResult;
      await act(async () => {
        geocodingResult = await result.current.geocodeAddress('New Delhi, India');
      });

      expect(geocodingResult).toEqual({
        latitude: 28.6139,
        longitude: 77.2090,
        city: 'New Delhi',
        state: 'Delhi',
        country: 'India',
        address: 'New Delhi, Delhi, India',
        pincode: '110001'
      });
    });

    it('should return null when geocoding fails', async () => {
      mockFetch.mockRejectedValue(new Error('All geocoding services failed'));

      const { result } = renderHook(() => useLocation());

      let geocodingResult;
      await act(async () => {
        geocodingResult = await result.current.geocodeAddress('Invalid Address');
      });

      expect(geocodingResult).toBeNull();
      expect(result.current.error).toEqual({
        code: -1,
        message: 'Unable to geocode the provided address'
      });
    });
  });

  describe('distance calculations', () => {
    it('should calculate distance correctly', () => {
      const { result } = renderHook(() => useLocation());

      // Distance between New Delhi and Mumbai (approximately 1150 km)
      const distance = result.current.calculateDistance(
        28.6139, 77.2090, // New Delhi
        19.0760, 72.8777  // Mumbai
      );

      expect(distance).toBeCloseTo(1150, -1); // Within 10km accuracy
    });

    it('should calculate distance and time correctly', () => {
      const { result } = renderHook(() => useLocation());

      // Distance between two nearby points (approximately 14 km)
      const distanceResult = result.current.calculateDistanceAndTime(
        28.6139, 77.2090, // New Delhi
        28.7041, 77.1025  // Nearby location
      );

      expect(distanceResult.distance).toBeCloseTo(14, 0);
      expect(distanceResult.travelTime).toBeGreaterThan(0);
      expect(distanceResult.travelTime).toBeLessThan(60); // Should be less than 1 hour
    });

    it('should check if location is within radius', () => {
      const { result } = renderHook(() => useLocation());

      // Points 5km apart
      const isWithin10km = result.current.isWithinRadius(
        28.6139, 77.2090, // Center
        28.6589, 77.2090, // 5km north
        10 // 10km radius
      );

      const isWithin2km = result.current.isWithinRadius(
        28.6139, 77.2090, // Center
        28.6589, 77.2090, // 5km north
        2 // 2km radius
      );

      expect(isWithin10km).toBe(true);
      expect(isWithin2km).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle unsupported geolocation', () => {
      // Temporarily remove geolocation support
      const originalGeolocation = global.navigator.geolocation;
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        writable: true,
      });

      const { result } = renderHook(() => useLocation());

      act(() => {
        result.current.getCurrentLocation();
      });

      expect(result.current.error).toEqual({
        code: 0,
        message: 'Geolocation is not supported by this browser.'
      });

      // Restore geolocation
      Object.defineProperty(global.navigator, 'geolocation', {
        value: originalGeolocation,
        writable: true,
      });
    });

    it('should provide appropriate error messages for different error codes', () => {
      const { result } = renderHook(() => useLocation());

      const testCases = [
        { code: 1, expected: 'Location access denied. Please enable location permissions.' },
        { code: 2, expected: 'Location unavailable. Please check your connection.' },
        { code: 3, expected: 'Location request timed out. Please try again.' },
        { code: 999, expected: 'Unable to retrieve your location.' },
      ];

      testCases.forEach(({ code, expected }) => {
        mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
          error({ code, message: 'Original message' });
        });

        act(() => {
          result.current.getCurrentLocation();
        });

        expect(result.current.error?.message).toBe(expected);
      });
    });
  });
});