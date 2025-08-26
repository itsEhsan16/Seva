import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useServiceCounts } from '@/hooks/useServiceCounts';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const mockSupabase = vi.mocked(supabase);

describe('useServiceCounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and counts services by category correctly', async () => {
    const mockServices = [
      { category_id: 'cat-1' },
      { category_id: 'cat-1' },
      { category_id: 'cat-2' },
      { category_id: 'cat-3' },
      { category_id: 'cat-3' },
      { category_id: 'cat-3' },
    ];

    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: mockServices,
        error: null,
      }),
    };

    mockSupabase.from.mockReturnValue(mockQuery as any);

    const { result } = renderHook(() => useServiceCounts());

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.counts).toEqual({});
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should have correct counts
    expect(result.current.counts).toEqual({
      'cat-1': 2,
      'cat-2': 1,
      'cat-3': 3,
    });
    expect(result.current.error).toBeNull();

    // Verify Supabase calls
    expect(mockSupabase.from).toHaveBeenCalledWith('services');
    expect(mockQuery.select).toHaveBeenCalledWith('category_id');
    expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true);
  });

  it('handles empty service list', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    mockSupabase.from.mockReturnValue(mockQuery as any);

    const { result } = renderHook(() => useServiceCounts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.counts).toEqual({});
    expect(result.current.error).toBeNull();
  });

  it('handles services with null category_id', async () => {
    const mockServices = [
      { category_id: 'cat-1' },
      { category_id: null },
      { category_id: 'cat-1' },
      { category_id: undefined },
    ];

    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: mockServices,
        error: null,
      }),
    };

    mockSupabase.from.mockReturnValue(mockQuery as any);

    const { result } = renderHook(() => useServiceCounts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should only count services with valid category_id
    expect(result.current.counts).toEqual({
      'cat-1': 2,
    });
    expect(result.current.error).toBeNull();
  });

  it('handles Supabase error', async () => {
    const mockError = new Error('Database connection failed');
    
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      }),
    };

    mockSupabase.from.mockReturnValue(mockQuery as any);

    const { result } = renderHook(() => useServiceCounts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.counts).toEqual({});
    expect(result.current.error).toBe('Database connection failed');
  });

  it('handles null data response', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };

    mockSupabase.from.mockReturnValue(mockQuery as any);

    const { result } = renderHook(() => useServiceCounts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.counts).toEqual({});
    expect(result.current.error).toBeNull();
  });

  it('starts with correct initial state', () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue(new Promise(() => {})), // Never resolves
    };

    mockSupabase.from.mockReturnValue(mockQuery as any);

    const { result } = renderHook(() => useServiceCounts());

    expect(result.current.loading).toBe(true);
    expect(result.current.counts).toEqual({});
    expect(result.current.error).toBeNull();
  });
});