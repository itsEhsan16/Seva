import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ServiceCategoryCard from '@/components/ServiceCategoryCard';
import { ServiceCategory } from '@/hooks/useServices';

const mockCategory: ServiceCategory = {
  id: '1',
  name: 'Home Cleaning',
  description: 'Professional cleaning services for homes and offices',
  icon: 'CleaningServices',
  image_url: '/test-image.jpg',
  is_active: true,
  sort_order: 1,
};

describe('ServiceCategoryCard', () => {
  it('renders category information correctly', () => {
    const mockOnClick = vi.fn();
    
    render(
      <ServiceCategoryCard
        category={mockCategory}
        serviceCount={5}
        onClick={mockOnClick}
      />
    );

    expect(screen.getByText('Home Cleaning')).toBeInTheDocument();
    expect(screen.getByText('Professional cleaning services for homes and offices')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Browse Services →')).toBeInTheDocument();
  });

  it('displays category image when provided', () => {
    const mockOnClick = vi.fn();
    
    render(
      <ServiceCategoryCard
        category={mockCategory}
        serviceCount={3}
        onClick={mockOnClick}
      />
    );

    const image = screen.getByAltText('Home Cleaning');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/test-image.jpg');
  });

  it('displays icon when no image is provided', () => {
    const mockOnClick = vi.fn();
    const categoryWithoutImage = { ...mockCategory, image_url: null };
    
    render(
      <ServiceCategoryCard
        category={categoryWithoutImage}
        serviceCount={2}
        onClick={mockOnClick}
      />
    );

    // Should render the icon container (look for the div with rounded-full class)
    const iconContainer = screen.getByText('Home Cleaning').parentElement?.parentElement?.querySelector('div[class*="rounded-full"]');
    expect(iconContainer).toBeInTheDocument();
  });

  it('does not show service count badge when count is 0', () => {
    const mockOnClick = vi.fn();
    
    render(
      <ServiceCategoryCard
        category={mockCategory}
        serviceCount={0}
        onClick={mockOnClick}
      />
    );

    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    const mockOnClick = vi.fn();
    
    render(
      <ServiceCategoryCard
        category={mockCategory}
        serviceCount={1}
        onClick={mockOnClick}
      />
    );

    fireEvent.click(screen.getByText('Home Cleaning'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('handles category without description', () => {
    const mockOnClick = vi.fn();
    const categoryWithoutDescription = { ...mockCategory, description: null };
    
    render(
      <ServiceCategoryCard
        category={categoryWithoutDescription}
        serviceCount={1}
        onClick={mockOnClick}
      />
    );

    expect(screen.getByText('Home Cleaning')).toBeInTheDocument();
    expect(screen.queryByText('Professional cleaning services for homes and offices')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const mockOnClick = vi.fn();
    
    render(
      <ServiceCategoryCard
        category={mockCategory}
        serviceCount={1}
        onClick={mockOnClick}
        className="custom-class"
      />
    );

    const card = screen.getByText('Home Cleaning').closest('[class*="cursor-pointer"]');
    expect(card).toHaveClass('custom-class');
  });
});