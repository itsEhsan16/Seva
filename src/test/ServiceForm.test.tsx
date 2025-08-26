import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ServiceForm } from '@/components/ServiceForm';
import { useAuth } from '@/contexts/AuthContext';
import { useServiceCategories } from '@/hooks/useServices';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('@/contexts/AuthContext');
vi.mock('@/hooks/useServices');
vi.mock('@/integrations/supabase/client');
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockProfile = {
  id: 'provider-1',
  role: 'provider' as const,
};

const mockCategories = [
  { id: 'cat-1', name: 'Cleaning', icon: '🧹' },
  { id: 'cat-2', name: 'Repairs', icon: '🔧' },
];

const mockService = {
  id: 'service-1',
  name: 'House Cleaning',
  description: 'Professional house cleaning service',
  price: 500,
  duration_minutes: 120,
  category_id: 'cat-1',
  service_areas: ['Mumbai', 'Pune'],
  image_url: '/test-image.jpg',
  is_active: true
};

describe('ServiceForm', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      profile: mockProfile,
    } as any);

    vi.mocked(useServiceCategories).mockReturnValue({
      categories: mockCategories,
    } as any);

    // Mock Supabase operations
    vi.mocked(supabase).from = vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      })
    });

    vi.mocked(supabase).storage = {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'test-url' } })
      })
    } as any;
  });

  it('renders form when open', () => {
    render(
      <ServiceForm
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('Add New Service')).toBeInTheDocument();
    expect(screen.getByLabelText(/Service Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Price/)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <ServiceForm
        isOpen={false}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.queryByText('Add New Service')).not.toBeInTheDocument();
  });

  it('populates form with service data when editing', () => {
    render(
      <ServiceForm
        service={mockService}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('Edit Service')).toBeInTheDocument();
    expect(screen.getByDisplayValue('House Cleaning')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Professional house cleaning service')).toBeInTheDocument();
    expect(screen.getByDisplayValue('500')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <ServiceForm
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const submitButton = screen.getByText('Add Service');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Service name must be at least 3 characters')).toBeInTheDocument();
      expect(screen.getByText('Description must be at least 10 characters')).toBeInTheDocument();
      expect(screen.getByText('Price must be greater than 0')).toBeInTheDocument();
    });
  });

  it('adds service areas', async () => {
    render(
      <ServiceForm
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const areaInput = screen.getByPlaceholderText(/Add service area/);
    const addButton = screen.getByText('Add');

    fireEvent.change(areaInput, { target: { value: 'Mumbai' } });
    fireEvent.click(addButton);

    expect(screen.getByText('Mumbai')).toBeInTheDocument();
  });

  it('removes service areas', async () => {
    render(
      <ServiceForm
        service={mockService}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const removeButton = screen.getAllByRole('button')[0]; // X button for Mumbai
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.queryByText('Mumbai')).not.toBeInTheDocument();
    });
  });

  it('handles form submission for new service', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase).from = vi.fn().mockReturnValue({
      insert: mockInsert
    });

    render(
      <ServiceForm
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Fill form
    fireEvent.change(screen.getByLabelText(/Service Name/), { 
      target: { value: 'Test Service' } 
    });
    fireEvent.change(screen.getByLabelText(/Description/), { 
      target: { value: 'Test description for service' } 
    });
    fireEvent.change(screen.getByLabelText(/Price/), { 
      target: { value: '100' } 
    });

    // Add service area
    const areaInput = screen.getByPlaceholderText(/Add service area/);
    fireEvent.change(areaInput, { target: { value: 'Mumbai' } });
    fireEvent.click(screen.getByText('Add'));

    // Submit form
    fireEvent.click(screen.getByText('Add Service'));

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('handles form submission for service update', async () => {
    const mockUpdate = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase).from = vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: mockUpdate
        })
      })
    });

    render(
      <ServiceForm
        service={mockService}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    fireEvent.click(screen.getByText('Update Service'));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('handles image upload', async () => {
    const mockUpload = vi.fn().mockResolvedValue({ 
      data: { path: 'test-path' }, 
      error: null 
    });
    
    vi.mocked(supabase).storage = {
      from: vi.fn().mockReturnValue({
        upload: mockUpload,
        getPublicUrl: vi.fn().mockReturnValue({ 
          data: { publicUrl: 'test-url' } 
        })
      })
    } as any;

    render(
      <ServiceForm
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const fileInput = screen.getByLabelText(/Upload Image/);
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Fill required fields and submit
    fireEvent.change(screen.getByLabelText(/Service Name/), { 
      target: { value: 'Test Service' } 
    });
    fireEvent.change(screen.getByLabelText(/Description/), { 
      target: { value: 'Test description for service' } 
    });
    fireEvent.change(screen.getByLabelText(/Price/), { 
      target: { value: '100' } 
    });

    const areaInput = screen.getByPlaceholderText(/Add service area/);
    fireEvent.change(areaInput, { target: { value: 'Mumbai' } });
    fireEvent.click(screen.getByText('Add'));

    fireEvent.click(screen.getByText('Add Service'));

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalled();
    });
  });

  it('closes form when close button is clicked', () => {
    render(
      <ServiceForm
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes form when cancel button is clicked', () => {
    render(
      <ServiceForm
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays duration options in dropdown', () => {
    render(
      <ServiceForm
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const durationSelect = screen.getByRole('combobox', { name: /duration/i });
    fireEvent.click(durationSelect);

    expect(screen.getByText('15 minutes')).toBeInTheDocument();
    expect(screen.getByText('1 hour')).toBeInTheDocument();
    expect(screen.getByText('2 hours')).toBeInTheDocument();
  });

  it('displays service categories in dropdown', () => {
    render(
      <ServiceForm
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const categorySelect = screen.getByRole('combobox', { name: /category/i });
    fireEvent.click(categorySelect);

    expect(screen.getByText('Cleaning')).toBeInTheDocument();
    expect(screen.getByText('Repairs')).toBeInTheDocument();
  });

  it('handles service status toggle', () => {
    render(
      <ServiceForm
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const statusCheckbox = screen.getByLabelText(/Service is active/);
    expect(statusCheckbox).toBeChecked();

    fireEvent.click(statusCheckbox);
    expect(statusCheckbox).not.toBeChecked();
  });

  it('prevents duplicate service areas', () => {
    render(
      <ServiceForm
        service={mockService}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const areaInput = screen.getByPlaceholderText(/Add service area/);
    const addButton = screen.getByText('Add');

    // Try to add Mumbai again (already exists)
    fireEvent.change(areaInput, { target: { value: 'Mumbai' } });
    fireEvent.click(addButton);

    // Should still only have one Mumbai
    const mumbaiElements = screen.getAllByText('Mumbai');
    expect(mumbaiElements).toHaveLength(1);
  });

  it('allows adding service area with Enter key', () => {
    render(
      <ServiceForm
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const areaInput = screen.getByPlaceholderText(/Add service area/);
    fireEvent.change(areaInput, { target: { value: 'Delhi' } });
    fireEvent.keyPress(areaInput, { key: 'Enter', code: 'Enter' });

    expect(screen.getByText('Delhi')).toBeInTheDocument();
  });
});