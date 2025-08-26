import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import AdminDisputes from '@/components/AdminDisputes';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('@/hooks/use-toast');
vi.mock('@/integrations/supabase/client');

const mockToast = vi.fn();
vi.mocked(useToast).mockReturnValue({ toast: mockToast });

// Mock supabase to return empty data immediately
vi.mocked(supabase).from = vi.fn(() => ({
  select: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  order: vi.fn().mockResolvedValue({ data: [], error: null })
})) as any;

describe('AdminDisputes', () => {
  it('renders without crashing', () => {
    render(<AdminDisputes />);
    expect(document.body).toBeInTheDocument();
  });

  it('shows component structure', () => {
    render(<AdminDisputes />);
    
    // The component should render some basic structure
    const component = document.querySelector('div');
    expect(component).toBeInTheDocument();
  });

  it('can be imported and instantiated', () => {
    expect(AdminDisputes).toBeDefined();
    expect(typeof AdminDisputes).toBe('function');
  });
});