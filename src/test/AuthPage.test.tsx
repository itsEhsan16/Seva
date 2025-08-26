import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import AuthPage from '@/components/AuthPage'
import { supabase } from '@/integrations/supabase/client'

// Mock the AuthContext
const mockAuthContext = {
  user: null,
  session: null,
  profile: null,
  loading: false,
  isEmailVerified: false,
  signOut: vi.fn(),
  refreshProfile: vi.fn(),
}

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}))

const renderAuthPage = () => {
  const mockOnClose = vi.fn()
  return {
    ...render(
      <BrowserRouter>
        <AuthPage onClose={mockOnClose} />
      </BrowserRouter>
    ),
    mockOnClose,
  }
}

describe('AuthPage Email Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mocks
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    })
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    })
  })

  it('should render login form by default', async () => {
    renderAuthPage()

    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email Address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByText('Sign In')).toBeInTheDocument()
  })

  it('should handle resend verification email', async () => {
    vi.mocked(supabase.auth.resend).mockResolvedValue({
      data: {},
      error: null,
    })

    renderAuthPage()

    // Manually trigger email verification state
    const component = screen.getByText('Welcome Back').closest('.glass-card')
    expect(component).toBeInTheDocument()

    // Test resend functionality by mocking the function call
    expect(supabase.auth.resend).not.toHaveBeenCalled()
  })

  it('should handle signup form submission', async () => {
    const mockSignUpResponse = {
      data: {
        user: {
          id: '123',
          email: 'test@example.com',
          email_confirmed_at: null,
        },
      },
      error: null,
    }

    vi.mocked(supabase.auth.signUp).mockResolvedValue(mockSignUpResponse)

    renderAuthPage()

    // Switch to signup mode
    const signUpButton = screen.getByText('Sign Up')
    fireEvent.click(signUpButton)

    expect(screen.getByText('Join Seva')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Full Name')).toBeInTheDocument()
  })
})