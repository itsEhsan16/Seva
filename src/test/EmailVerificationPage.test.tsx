import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import EmailVerificationPage from '@/components/EmailVerificationPage'
import { supabase } from '@/integrations/supabase/client'

// Mock useSearchParams to return test parameters
let mockSearchParams = new URLSearchParams()
const mockSetSearchParams = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useSearchParams: () => [mockSearchParams, mockSetSearchParams],
    useNavigate: () => vi.fn(),
  }
})

const renderEmailVerificationPage = () => {
  return render(
    <BrowserRouter>
      <EmailVerificationPage />
    </BrowserRouter>
  )
}

describe('EmailVerificationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams()
  })

  it('should show loading state initially', () => {
    mockSearchParams.set('token', 'test-token')
    mockSearchParams.set('type', 'email')

    renderEmailVerificationPage()

    expect(screen.getByText('Verifying Your Email')).toBeInTheDocument()
    expect(screen.getByText('Please wait while we verify your email address...')).toBeInTheDocument()
  })

  it('should show success state when verification succeeds', async () => {
    mockSearchParams.set('token', 'test-token')
    mockSearchParams.set('type', 'email')

    vi.mocked(supabase.auth.verifyOtp).mockResolvedValue({
      data: {
        user: {
          id: '123',
          email: 'test@example.com',
          email_confirmed_at: new Date().toISOString(),
        },
        session: null,
      },
      error: null,
    })

    renderEmailVerificationPage()

    await waitFor(() => {
      expect(screen.getByText('Email Verified Successfully!')).toBeInTheDocument()
      expect(screen.getByText('Your account is now active. You will be redirected to the home page shortly.')).toBeInTheDocument()
    })

    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
      token_hash: 'test-token',
      type: 'email',
    })
  })

  it('should show error state when verification fails', async () => {
    mockSearchParams.set('token', 'invalid-token')
    mockSearchParams.set('type', 'email')

    vi.mocked(supabase.auth.verifyOtp).mockResolvedValue({
      data: { user: null, session: null },
      error: {
        message: 'Invalid token',
        name: 'AuthError',
      },
    })

    renderEmailVerificationPage()

    await waitFor(() => {
      expect(screen.getByText('Verification Failed')).toBeInTheDocument()
      expect(screen.getByText('Invalid token')).toBeInTheDocument()
      expect(screen.getByText('Send New Verification Email')).toBeInTheDocument()
    })
  })

  it('should show error for expired token', async () => {
    mockSearchParams.set('token', 'expired-token')
    mockSearchParams.set('type', 'email')

    vi.mocked(supabase.auth.verifyOtp).mockResolvedValue({
      data: { user: null, session: null },
      error: {
        message: 'Token expired',
        name: 'AuthError',
      },
    })

    renderEmailVerificationPage()

    await waitFor(() => {
      expect(screen.getByText('Verification Failed')).toBeInTheDocument()
      expect(screen.getByText('This verification link has expired. Please request a new one.')).toBeInTheDocument()
    })
  })

  it('should show error for invalid verification link', async () => {
    // Missing token parameter
    mockSearchParams.set('type', 'email')

    renderEmailVerificationPage()

    await waitFor(() => {
      expect(screen.getByText('Verification Failed')).toBeInTheDocument()
      expect(screen.getByText('Invalid verification link. Please check your email and try again.')).toBeInTheDocument()
    })
  })

  it('should show error for wrong type parameter', async () => {
    mockSearchParams.set('token', 'test-token')
    mockSearchParams.set('type', 'recovery') // Wrong type

    renderEmailVerificationPage()

    await waitFor(() => {
      expect(screen.getByText('Verification Failed')).toBeInTheDocument()
      expect(screen.getByText('Invalid verification link. Please check your email and try again.')).toBeInTheDocument()
    })
  })

  it('should handle resend verification email', async () => {
    mockSearchParams.set('token', 'invalid-token')
    mockSearchParams.set('type', 'email')

    // Mock failed verification
    vi.mocked(supabase.auth.verifyOtp).mockResolvedValue({
      data: { user: null, session: null },
      error: {
        message: 'Invalid token',
        name: 'AuthError',
      },
    })

    // Mock current session for resend
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: {
            id: '123',
            email: 'test@example.com',
          },
        },
      },
      error: null,
    })

    vi.mocked(supabase.auth.resend).mockResolvedValue({
      data: {},
      error: null,
    })

    renderEmailVerificationPage()

    await waitFor(() => {
      expect(screen.getByText('Send New Verification Email')).toBeInTheDocument()
    })

    const resendButton = screen.getByText('Send New Verification Email')
    resendButton.click()

    await waitFor(() => {
      expect(supabase.auth.resend).toHaveBeenCalledWith({
        type: 'signup',
        email: 'test@example.com',
        options: {
          emailRedirectTo: expect.stringContaining('/auth/verify'),
        },
      })
    })
  })
})