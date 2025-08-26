import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ProviderAnalytics } from '@/components/ProviderAnalytics';
import { useProviderStats } from '@/hooks/useProviderStats';

// Mock the hook
vi.mock('@/hooks/useProviderStats');

const mockStats = {
  total_services: 5,
  total_bookings: 50,
  completed_bookings: 45,
  total_earnings: 25000,
  average_rating: 4.7,
  total_reviews: 38,
  monthly_earnings: 8500,
  monthly_bookings: 15
};

describe('ProviderAnalytics', () => {
  beforeEach(() => {
    vi.mocked(useProviderStats).mockReturnValue({
      stats: mockStats,
      loading: false,
    } as any);
  });

  it('renders loading state', () => {
    vi.mocked(useProviderStats).mockReturnValue({
      stats: mockStats,
      loading: true,
    } as any);

    render(<ProviderAnalytics />);

    // Check for loading spinner
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('displays key performance indicators', () => {
    render(<ProviderAnalytics />);

    expect(screen.getByText('Monthly Revenue')).toBeInTheDocument();
    expect(screen.getByText('₹8,500')).toBeInTheDocument();

    expect(screen.getByText('Monthly Bookings')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();

    expect(screen.getByText('Customer Rating')).toBeInTheDocument();
    expect(screen.getByText('4.7')).toBeInTheDocument();
  });

  it('calculates completion rate correctly', () => {
    render(<ProviderAnalytics />);

    expect(screen.getAllByText('Completion Rate')[0]).toBeInTheDocument();
    expect(screen.getAllByText('90.0%')[0]).toBeInTheDocument(); // 45/50 * 100 - first occurrence
  });

  it('displays business overview metrics', () => {
    render(<ProviderAnalytics />);

    expect(screen.getByText('Business Overview')).toBeInTheDocument();
    expect(screen.getByText('Total Services')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    expect(screen.getByText('Total Bookings')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();

    expect(screen.getByText('Completed Services')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();

    expect(screen.getByText('Total Lifetime Earnings')).toBeInTheDocument();
    expect(screen.getByText('₹25,000')).toBeInTheDocument();
  });

  it('calculates average booking value correctly', () => {
    render(<ProviderAnalytics />);

    expect(screen.getByText('Average Booking Value')).toBeInTheDocument();
    expect(screen.getByText('₹556')).toBeInTheDocument(); // 25000/45 rounded
  });

  it('displays performance metrics with progress bars', () => {
    render(<ProviderAnalytics />);

    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();

    // Check for progress bars by their style attributes
    const progressBars = document.querySelectorAll('.bg-primary');
    expect(progressBars.length).toBeGreaterThan(0);

    const satisfactionBars = document.querySelectorAll('.bg-yellow-500');
    expect(satisfactionBars.length).toBeGreaterThan(0);
  });

  it('shows excellent performance message for high ratings', () => {
    render(<ProviderAnalytics />);

    expect(screen.getByText('Excellent performance! Keep up the great work.')).toBeInTheDocument();
  });

  it('shows good performance message for medium ratings', () => {
    vi.mocked(useProviderStats).mockReturnValue({
      stats: { ...mockStats, average_rating: 4.0 },
      loading: false,
    } as any);

    render(<ProviderAnalytics />);

    expect(screen.getByText('Good performance. Consider improving service quality.')).toBeInTheDocument();
  });

  it('shows improvement needed message for low ratings', () => {
    vi.mocked(useProviderStats).mockReturnValue({
      stats: { ...mockStats, average_rating: 3.0 },
      loading: false,
    } as any);

    render(<ProviderAnalytics />);

    expect(screen.getByText('Performance needs improvement. Focus on customer satisfaction.')).toBeInTheDocument();
  });

  it('handles zero bookings gracefully', () => {
    vi.mocked(useProviderStats).mockReturnValue({
      stats: {
        ...mockStats,
        total_bookings: 0,
        completed_bookings: 0,
        total_earnings: 0
      },
      loading: false,
    } as any);

    render(<ProviderAnalytics />);

    expect(screen.getAllByText('0%')[0]).toBeInTheDocument(); // Completion rate (first occurrence)
    expect(screen.getAllByText('₹0')[0]).toBeInTheDocument(); // Average booking value (first occurrence)
  });

  it('displays positive change indicators', () => {
    render(<ProviderAnalytics />);

    expect(screen.getByText('+12% from last month')).toBeInTheDocument();
    expect(screen.getByText('+8% from last month')).toBeInTheDocument();
  });

  it('shows completion rate status based on percentage', () => {
    // Test excellent completion rate
    render(<ProviderAnalytics />);
    expect(screen.getByText('Excellent')).toBeInTheDocument();

    // Test good completion rate
    vi.mocked(useProviderStats).mockReturnValue({
      stats: { ...mockStats, completed_bookings: 38 }, // 76% completion rate
      loading: false,
    } as any);

    render(<ProviderAnalytics />);
    expect(screen.getByText('Good')).toBeInTheDocument();

    // Test needs improvement
    vi.mocked(useProviderStats).mockReturnValue({
      stats: { ...mockStats, completed_bookings: 30 }, // 60% completion rate
      loading: false,
    } as any);

    render(<ProviderAnalytics />);
    expect(screen.getByText('Needs improvement')).toBeInTheDocument();
  });
});