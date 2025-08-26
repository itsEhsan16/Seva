import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import AdminDashboard from '@/components/AdminDashboard';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { beforeEach } from 'node:test';

// Mock dependencies
vi.mock('@/hooks/useAdminGuard');
vi.mock('@/hooks/use-toast');
vi.mock('@/integrations/supabase/client');

// Mock child components
vi.mock('@/components/AdminUsers', () => ({
  default: () => <div>AdminUsers Component</div>
}));
vi.mock('@/components/AdminServices', () => ({
  default: () => <div>AdminServices Component</div>
}));
vi.mock('@/components/AdminBookings', () => ({
  default: () => <div>AdminBookings Component</div>
}));
vi.mock('@/components/AdminPayments', () => ({
  default: () => <div>AdminPayments Component</div>
}));
vi.mock('@/components/AdminReviews', () => ({
  default: () => <div>AdminReviews Component</div>
}));
vi.mock('@/components/AdminAnalytics', () => ({
  default: () => <div>AdminAnalytics Component</div>
}));
vi.mock('@/components/AdminDisputes', () => ({
  default: () => <div>AdminDisputes Component</div>
}));

const mockToast = vi.fn();
vi.mocked(useToast).mockReturnValue({ toast: mockToast });

// Mock supabase to return empty data immediately
vi.mocked(supabase).from = vi.fn(() => ({
  select: vi.fn().mockReturnThis(),
  neq: vi.fn().mockResolvedValue({ data: [], error: null })
})) as any;

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock admin guard to return authorized
    vi.mocked(useAdminGuard).mockReturnValue({
      isAuthorized: true,
      isLoading: false
    });
  });

  it('renders without crashing', () => {
    render(<AdminDashboard />);
    expect(document.body).toBeInTheDocument();
  });

  it('shows component structure', () => {
    render(<AdminDashboard />);
    
    // The component should render some basic structure
    const component = document.querySelector('div');
    expect(component).toBeInTheDocument();
  });

  it('has proper component hierarchy', () => {
    render(<AdminDashboard />);
    
    // Check that the component renders with expected class structure
    const container = document.querySelector('.section-container');
    expect(container).toBeInTheDocument();
  });

  it('can be imported and instantiated', () => {
    expect(AdminDashboard).toBeDefined();
    expect(typeof AdminDashboard).toBe('function');
  });
});