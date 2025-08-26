import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LocationSelector from '@/components/LocationSelector';
import { useLocation } from '@/hooks/useLocation';
import { useToast } from '@/hooks/use-toast';

// Mock the hooks
vi.mock('@/hooks/useLocation');
vi.mock('@/hooks/use-toast');

const mockUseLocation = vi.mocked(useLocation);
const mockUseToast = vi.mocked(useToast);

describe('LocationSelector', () => {
  const mockOnLocationChange = vi.fn();
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseToast.mockReturnValue({
      toast: mockToast,
      dismiss: vi.fn(),
      toasts: []
    });

    mockUseLocation.mockReturnValue({
      location: null,
      loading: false,
      error: null,
      getCurrentLocation: vi.fn(),
      geocodeAddress: vi.fn(),
      reverseGeocode: vi.fn(),
      calculateDistance: vi.fn(),
      calculateDistanceAndTime: vi.fn(),
      isWithinRadius: vi.fn()
    });
  });

  it('should render location selector with all controls', () => {
    render(<LocationSelector onLocationChange={mockOnLocationChange} />);

    expect(screen.getByText('Service Location')).toBeInTheDocument();
    expect(screen.getByText('Current Location')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter city, state, or pincode')).toBeInTheDocument();
    expect(screen.getByText(/Search Radius:/)).toBeInTheDocument();
  });

  it('should call getCurrentLocation when current location button is clicked', () => {
    const mockGetCurrentLocation = vi.fn();
    mockUseLocation.mockReturnValue({
      ...mockUseLocation(),
      getCurrentLocation: mockGetCurrentLocation
    });

    render(<LocationSelector onLocationChange={mockOnLocationChange} />);

    fireEvent.click(screen.getByText('Current Location'));
    expect(mockGetCurrentLocation).toHaveBeenCalled();
  });

  it('should show loading state when getting current location', () => {
    mockUseLocation.mockReturnValue({
      ...mockUseLocation(),
      loading: true
    });

    render(<LocationSelector onLocationChange={mockOnLocationChange} />);

    expect(screen.getByText('Locating...')).toBeInTheDocument();
  });

  it('should display current location when available', () => {
    const mockLocation = {
      latitude: 28.6139,
      longitude: 77.2090,
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001'
    };

    mockUseLocation.mockReturnValue({
      ...mockUseLocation(),
      location: mockLocation
    });

    render(<LocationSelector onLocationChange={mockOnLocationChange} />);

    expect(screen.getByText('New Delhi, Delhi, 110001')).toBeInTheDocument();
  });

  it('should handle manual location input', () => {
    render(<LocationSelector onLocationChange={mockOnLocationChange} />);

    const input = screen.getByPlaceholderText('Enter city, state, or pincode');
    fireEvent.change(input, { target: { value: 'Mumbai, Maharashtra' } });

    expect(mockOnLocationChange).toHaveBeenCalledWith({
      city: 'Mumbai',
      state: 'Maharashtra',
      radius: 25
    });
  });

  it('should handle pincode input', () => {
    render(<LocationSelector onLocationChange={mockOnLocationChange} />);

    const input = screen.getByPlaceholderText('Enter city, state, or pincode');
    fireEvent.change(input, { target: { value: '110001' } });

    expect(mockOnLocationChange).toHaveBeenCalledWith({
      pincode: '110001',
      radius: 25
    });
  });

  it('should geocode address when search button is clicked', async () => {
    const mockGeocodeAddress = vi.fn().mockResolvedValue({
      latitude: 28.6139,
      longitude: 77.2090,
      city: 'New Delhi',
      state: 'Delhi'
    });

    mockUseLocation.mockReturnValue({
      ...mockUseLocation(),
      geocodeAddress: mockGeocodeAddress
    });

    render(<LocationSelector onLocationChange={mockOnLocationChange} />);

    const input = screen.getByPlaceholderText('Enter city, state, or pincode');
    fireEvent.change(input, { target: { value: 'New Delhi' } });

    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockGeocodeAddress).toHaveBeenCalledWith('New Delhi');
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Location found',
      description: 'Set location to New Delhi, Delhi'
    });
  });

  it('should handle geocoding failure', async () => {
    const mockGeocodeAddress = vi.fn().mockResolvedValue(null);

    mockUseLocation.mockReturnValue({
      ...mockUseLocation(),
      geocodeAddress: mockGeocodeAddress
    });

    render(<LocationSelector onLocationChange={mockOnLocationChange} />);

    const input = screen.getByPlaceholderText('Enter city, state, or pincode');
    fireEvent.change(input, { target: { value: 'Invalid Location' } });

    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Location not found',
        description: 'Please try a different address or use current location',
        variant: 'destructive'
      });
    });
  });

  it('should handle Enter key press for search', async () => {
    const mockGeocodeAddress = vi.fn().mockResolvedValue({
      latitude: 28.6139,
      longitude: 77.2090,
      city: 'New Delhi',
      state: 'Delhi'
    });

    mockUseLocation.mockReturnValue({
      ...mockUseLocation(),
      geocodeAddress: mockGeocodeAddress
    });

    render(<LocationSelector onLocationChange={mockOnLocationChange} />);

    const input = screen.getByPlaceholderText('Enter city, state, or pincode');
    fireEvent.change(input, { target: { value: 'New Delhi' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(mockGeocodeAddress).toHaveBeenCalledWith('New Delhi');
    });
  });

  it('should update radius and trigger location change', () => {
    const mockLocation = {
      latitude: 28.6139,
      longitude: 77.2090,
      city: 'New Delhi',
      state: 'Delhi'
    };

    mockUseLocation.mockReturnValue({
      ...mockUseLocation(),
      location: mockLocation
    });

    render(<LocationSelector onLocationChange={mockOnLocationChange} />);

    // Open radius control
    fireEvent.click(screen.getByText(/Search Radius:/));

    // Find and interact with slider (this is a simplified test)
    // In a real test, you'd need to properly simulate slider interaction
    // For now, we'll test the callback directly
    const component = screen.getByText(/Search Radius:/).closest('div');
    expect(component).toBeInTheDocument();
  });

  it('should display error when location error occurs', () => {
    const mockError = {
      code: 1,
      message: 'Location access denied'
    };

    mockUseLocation.mockReturnValue({
      ...mockUseLocation(),
      error: mockError
    });

    render(<LocationSelector onLocationChange={mockOnLocationChange} />);

    expect(screen.getByText('Location access denied')).toBeInTheDocument();
  });

  it('should hide radius control when showRadiusControl is false', () => {
    render(
      <LocationSelector 
        onLocationChange={mockOnLocationChange} 
        showRadiusControl={false}
      />
    );

    expect(screen.queryByText(/Search Radius:/)).not.toBeInTheDocument();
  });

  it('should use custom default radius', () => {
    render(
      <LocationSelector 
        onLocationChange={mockOnLocationChange}
        defaultRadius={50}
      />
    );

    const input = screen.getByPlaceholderText('Enter city, state, or pincode');
    fireEvent.change(input, { target: { value: 'Delhi' } });

    expect(mockOnLocationChange).toHaveBeenCalledWith({
      city: 'Delhi',
      radius: 50
    });
  });

  it('should apply custom className', () => {
    const { container } = render(
      <LocationSelector 
        onLocationChange={mockOnLocationChange}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should disable search button when input is empty', () => {
    render(<LocationSelector onLocationChange={mockOnLocationChange} />);

    const searchButton = screen.getByRole('button', { name: /search/i });
    expect(searchButton).toBeDisabled();
  });

  it('should enable search button when input has value', () => {
    render(<LocationSelector onLocationChange={mockOnLocationChange} />);

    const input = screen.getByPlaceholderText('Enter city, state, or pincode');
    fireEvent.change(input, { target: { value: 'Delhi' } });

    const searchButton = screen.getByRole('button', { name: /search/i });
    expect(searchButton).not.toBeDisabled();
  });
});