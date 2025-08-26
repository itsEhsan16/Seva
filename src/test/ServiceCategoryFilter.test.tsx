import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ServiceCategoryFilter from '@/components/ServiceCategoryFilter';
import { ServiceCategory } from '@/hooks/useServices';

const mockCategories: ServiceCategory[] = [
  {
    id: '1',
    name: 'Home Cleaning',
    description: 'Professional cleaning services',
    icon: 'CleaningServices',
    image_url: null,
    is_active: true,
    sort_order: 1,
  },
  {
    id: '2',
    name: 'Electrical Services',
    description: 'Electrical installations and repairs',
    icon: 'Electrical',
    image_url: null,
    is_active: true,
    sort_order: 2,
  },
  {
    id: '3',
    name: 'Plumbing',
    description: 'Plumbing repairs and installations',
    icon: 'Plumbing',
    image_url: null,
    is_active: true,
    sort_order: 3,
  },
];

const mockServiceCounts = {
  '1': 5,
  '2': 3,
  '3': 0,
};

describe('ServiceCategoryFilter', () => {
  it('renders all categories with service counts', () => {
    const mockOnCategorySelect = vi.fn();
    
    render(
      <ServiceCategoryFilter
        categories={mockCategories}
        onCategorySelect={mockOnCategorySelect}
        serviceCountByCategory={mockServiceCounts}
      />
    );

    expect(screen.getByText('Filter by Category')).toBeInTheDocument();
    expect(screen.getByText('All Services')).toBeInTheDocument();
    expect(screen.getByText('Home Cleaning')).toBeInTheDocument();
    expect(screen.getByText('Electrical Services')).toBeInTheDocument();
    expect(screen.getByText('Plumbing')).toBeInTheDocument();
    
    // Check service counts
    expect(screen.getByText('8')).toBeInTheDocument(); // Total count for "All Services"
    expect(screen.getByText('5')).toBeInTheDocument(); // Home Cleaning count
    expect(screen.getByText('3')).toBeInTheDocument(); // Electrical Services count
  });

  it('disables categories with zero services', () => {
    const mockOnCategorySelect = vi.fn();
    
    render(
      <ServiceCategoryFilter
        categories={mockCategories}
        onCategorySelect={mockOnCategorySelect}
        serviceCountByCategory={mockServiceCounts}
      />
    );

    const plumbingButton = screen.getByText('Plumbing').closest('button');
    expect(plumbingButton).toBeDisabled();
  });

  it('calls onCategorySelect when category is clicked', () => {
    const mockOnCategorySelect = vi.fn();
    
    render(
      <ServiceCategoryFilter
        categories={mockCategories}
        onCategorySelect={mockOnCategorySelect}
        serviceCountByCategory={mockServiceCounts}
      />
    );

    fireEvent.click(screen.getByText('Home Cleaning'));
    expect(mockOnCategorySelect).toHaveBeenCalledWith('1');
  });

  it('calls onCategorySelect with undefined when "All Services" is clicked', () => {
    const mockOnCategorySelect = vi.fn();
    
    render(
      <ServiceCategoryFilter
        categories={mockCategories}
        onCategorySelect={mockOnCategorySelect}
        serviceCountByCategory={mockServiceCounts}
      />
    );

    fireEvent.click(screen.getByText('All Services'));
    expect(mockOnCategorySelect).toHaveBeenCalledWith(undefined);
  });

  it('shows selected category information', () => {
    const mockOnCategorySelect = vi.fn();
    
    render(
      <ServiceCategoryFilter
        categories={mockCategories}
        selectedCategoryId="1"
        onCategorySelect={mockOnCategorySelect}
        serviceCountByCategory={mockServiceCounts}
      />
    );

    expect(screen.getByRole('heading', { name: 'Home Cleaning' })).toBeInTheDocument();
    expect(screen.getByText('Professional cleaning services')).toBeInTheDocument();
    expect(screen.getByText('5 services')).toBeInTheDocument();
  });

  it('shows clear filter button when category is selected', () => {
    const mockOnCategorySelect = vi.fn();
    
    render(
      <ServiceCategoryFilter
        categories={mockCategories}
        selectedCategoryId="1"
        onCategorySelect={mockOnCategorySelect}
        serviceCountByCategory={mockServiceCounts}
      />
    );

    const clearButton = screen.getByRole('button', { name: '' }); // X button has no text
    expect(clearButton).toBeInTheDocument();
    
    fireEvent.click(clearButton);
    expect(mockOnCategorySelect).toHaveBeenCalledWith(undefined);
  });

  it('toggles category selection when same category is clicked', () => {
    const mockOnCategorySelect = vi.fn();
    
    render(
      <ServiceCategoryFilter
        categories={mockCategories}
        selectedCategoryId="1"
        onCategorySelect={mockOnCategorySelect}
        serviceCountByCategory={mockServiceCounts}
      />
    );

    const homeCleaningButton = screen.getByRole('button', { name: /Home Cleaning/ });
    fireEvent.click(homeCleaningButton);
    expect(mockOnCategorySelect).toHaveBeenCalledWith(undefined);
  });

  it('highlights selected category button', () => {
    const mockOnCategorySelect = vi.fn();
    
    render(
      <ServiceCategoryFilter
        categories={mockCategories}
        selectedCategoryId="1"
        onCategorySelect={mockOnCategorySelect}
        serviceCountByCategory={mockServiceCounts}
      />
    );

    const homeCleaningButton = screen.getByRole('button', { name: /Home Cleaning/ });
    const electricalButton = screen.getByRole('button', { name: /Electrical Services/ });
    
    // Selected button should have different styling (this is implementation dependent)
    expect(homeCleaningButton).toHaveClass('bg-primary'); // Assuming default variant styling
    expect(electricalButton).not.toHaveClass('bg-primary');
  });

  it('handles empty service counts gracefully', () => {
    const mockOnCategorySelect = vi.fn();
    
    render(
      <ServiceCategoryFilter
        categories={mockCategories}
        onCategorySelect={mockOnCategorySelect}
        serviceCountByCategory={{}}
      />
    );

    expect(screen.getByText('All Services')).toBeInTheDocument();
    expect(screen.getByText('Home Cleaning')).toBeInTheDocument();
    
    // All category buttons should be disabled when no service counts
    const homeCleaningButton = screen.getByText('Home Cleaning').closest('button');
    expect(homeCleaningButton).toBeDisabled();
  });

  it('applies custom className', () => {
    const mockOnCategorySelect = vi.fn();
    
    const { container } = render(
      <ServiceCategoryFilter
        categories={mockCategories}
        onCategorySelect={mockOnCategorySelect}
        serviceCountByCategory={mockServiceCounts}
        className="custom-filter-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-filter-class');
  });

  it('handles category without description', () => {
    const mockOnCategorySelect = vi.fn();
    const categoriesWithoutDescription = [
      { ...mockCategories[0], description: null },
    ];
    
    render(
      <ServiceCategoryFilter
        categories={categoriesWithoutDescription}
        selectedCategoryId="1"
        onCategorySelect={mockOnCategorySelect}
        serviceCountByCategory={mockServiceCounts}
      />
    );

    expect(screen.getByRole('heading', { name: 'Home Cleaning' })).toBeInTheDocument();
    expect(screen.queryByText('Professional cleaning services')).not.toBeInTheDocument();
  });
});