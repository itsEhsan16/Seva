import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProviderProfileCard from '@/components/ProviderProfileCard';
import { ServiceWithDistance } from '@/hooks/useServices';
import * as useReviewsModule from '@/hooks/useReviews';

// Mock the useReviewStats hook
vi.mock('@/hooks/useReviews');

const mockService: ServiceWithDistance = {
  id: '1',
  name: 'Deep House Cleaning',
  description: 'Comprehensive cleaning service for your entire home',
  price: 2500,
  duration_minutes: 120,
  image_url: '/service-image.jpg',
  is_active: true,
  service_areas: ['Mumbai', 'Pune'],
  category_id: 'cat-1',
  provider_id: 'provider-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  distance: 2.5,
  travelTime: 15,
  provider: {
    full_name: 'John Doe',
    avatar_url: '/avatar.jpg',
    address: '123 Main St',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    business_name: 'Clean Pro Services',
    experience_years: 5,
    skills: ['Deep Cleaning', 'Office Cleaning', 'Post Construction Cleaning'],
    verification_status: 'verified',
    is_verified: true,
  },
};

describe('ProviderProfileCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders service and provider information correctly', () => {
    const mockUseReviewStats = vi.mocked(useReviewsModule.useReviewStats);
    mockUseReviewStats.mockReturnValue({
      stats: {
        averageRating: 4.5,
        totalReviews: 10,
        ratingDistribution: [0, 0, 1, 4, 5],
      },
      loading: false,
    });

    const mockOnSelect = vi.fn();
    
    render(
      <ProviderProfileCard
        service={mockService}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Deep House Cleaning')).toBeInTheDocument();
    expect(screen.getByText('Comprehensive cleaning service for your entire home')).toBeInTheDocument();
    expect(screen.getByText('₹2500')).toBeInTheDocument();
    expect(screen.getByText('Clean Pro Services')).toBeInTheDocument();
    expect(screen.getByText('4.5 (10)')).toBeInTheDocument();
    expect(screen.getByText('5 years exp')).toBeInTheDocument();
    expect(screen.getByText('2.5km')).toBeInTheDocument();
    expect(screen.getByText('120 min')).toBeInTheDocument();
  });

  it('displays "New Provider" badge for providers without reviews', () => {
    const mockUseReviewStats = vi.mocked(useReviewsModule.useReviewStats);
    mockUseReviewStats.mockReturnValue({
      stats: {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: [0, 0, 0, 0, 0],
      },
      loading: false,
    });

    const mockOnSelect = vi.fn();
    
    render(
      <ProviderProfileCard
        service={mockService}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('New Provider')).toBeInTheDocument();
    expect(screen.getByText('No reviews yet')).toBeInTheDocument();
  });

  it('shows verification checkmark for verified providers', () => {
    const mockUseReviewStats = vi.mocked(useReviewsModule.useReviewStats);
    mockUseReviewStats.mockReturnValue({
      stats: {
        averageRating: 4.0,
        totalReviews: 5,
        ratingDistribution: [0, 0, 1, 2, 2],
      },
      loading: false,
    });

    const mockOnSelect = vi.fn();
    
    render(
      <ProviderProfileCard
        service={mockService}
        onSelect={mockOnSelect}
      />
    );

    // Check for verification icon (CheckCircle)
    const verificationIcon = screen.getByText('Clean Pro Services').parentElement?.querySelector('svg');
    expect(verificationIcon).toBeInTheDocument();
  });

  it('displays provider skills', () => {
    const mockUseReviewStats = vi.mocked(useReviewsModule.useReviewStats);
    mockUseReviewStats.mockReturnValue({
      stats: {
        averageRating: 4.0,
        totalReviews: 5,
        ratingDistribution: [0, 0, 1, 2, 2],
      },
      loading: false,
    });

    const mockOnSelect = vi.fn();
    
    render(
      <ProviderProfileCard
        service={mockService}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Deep Cleaning')).toBeInTheDocument();
    expect(screen.getByText('Office Cleaning')).toBeInTheDocument();
    expect(screen.getByText('Post Construction Cleaning')).toBeInTheDocument();
  });

  it('shows availability indicator when enabled', () => {
    const mockUseReviewStats = vi.mocked(useReviewsModule.useReviewStats);
    mockUseReviewStats.mockReturnValue({
      stats: {
        averageRating: 4.0,
        totalReviews: 5,
        ratingDistribution: [0, 0, 1, 2, 2],
      },
      loading: false,
    });

    const mockOnSelect = vi.fn();
    
    render(
      <ProviderProfileCard
        service={mockService}
        onSelect={mockOnSelect}
        showAvailability={true}
      />
    );

    expect(screen.getByText('Available Today')).toBeInTheDocument();
  });

  it('hides availability indicator when disabled', () => {
    const mockUseReviewStats = vi.mocked(useReviewsModule.useReviewStats);
    mockUseReviewStats.mockReturnValue({
      stats: {
        averageRating: 4.0,
        totalReviews: 5,
        ratingDistribution: [0, 0, 1, 2, 2],
      },
      loading: false,
    });

    const mockOnSelect = vi.fn();
    
    render(
      <ProviderProfileCard
        service={mockService}
        onSelect={mockOnSelect}
        showAvailability={false}
      />
    );

    expect(screen.queryByText('Available Today')).not.toBeInTheDocument();
  });

  it('calls onSelect when card is clicked', () => {
    const mockUseReviewStats = vi.mocked(useReviewsModule.useReviewStats);
    mockUseReviewStats.mockReturnValue({
      stats: {
        averageRating: 4.0,
        totalReviews: 5,
        ratingDistribution: [0, 0, 1, 2, 2],
      },
      loading: false,
    });

    const mockOnSelect = vi.fn();
    
    render(
      <ProviderProfileCard
        service={mockService}
        onSelect={mockOnSelect}
      />
    );

    fireEvent.click(screen.getByText('Deep House Cleaning'));
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });

  it('handles service without provider gracefully', () => {
    const serviceWithoutProvider = { ...mockService, provider: undefined };
    const mockOnSelect = vi.fn();
    
    const { container } = render(
      <ProviderProfileCard
        service={serviceWithoutProvider}
        onSelect={mockOnSelect}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('shows loading state for reviews', () => {
    const mockUseReviewStats = vi.mocked(useReviewsModule.useReviewStats);
    mockUseReviewStats.mockReturnValue({
      stats: {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: [0, 0, 0, 0, 0],
      },
      loading: true,
    });

    const mockOnSelect = vi.fn();
    
    render(
      <ProviderProfileCard
        service={mockService}
        onSelect={mockOnSelect}
      />
    );

    // Should show loading skeleton for reviews - check for the loading div
    const ratingSection = screen.getByText('Clean Pro Services').parentElement?.parentElement;
    const loadingSkeleton = ratingSection?.querySelector('.animate-pulse');
    expect(loadingSkeleton).toBeInTheDocument();
  });

  it('handles provider with many skills correctly', () => {
    const mockUseReviewStats = vi.mocked(useReviewsModule.useReviewStats);
    mockUseReviewStats.mockReturnValue({
      stats: {
        averageRating: 4.0,
        totalReviews: 5,
        ratingDistribution: [0, 0, 1, 2, 2],
      },
      loading: false,
    });

    const serviceWithManySkills = {
      ...mockService,
      provider: {
        ...mockService.provider!,
        skills: ['Skill 1', 'Skill 2', 'Skill 3', 'Skill 4', 'Skill 5'],
      },
    };

    const mockOnSelect = vi.fn();
    
    render(
      <ProviderProfileCard
        service={serviceWithManySkills}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Skill 1')).toBeInTheDocument();
    expect(screen.getByText('Skill 2')).toBeInTheDocument();
    expect(screen.getByText('Skill 3')).toBeInTheDocument();
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });
});