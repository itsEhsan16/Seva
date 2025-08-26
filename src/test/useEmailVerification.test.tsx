import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { useEmailVerification } from '@/hooks/useEmailVerification'

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

const mockNavigate = vi.fn()
const mockToast = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

describe('useEmailVerification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock context
    Object.assign(mockAuthContext, {
      user: null,
      session: null,
      profile: null,
      loading: false,
      isEmailVerified: false,
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    })
  })

  it('should return correct values when user is not logged in', () => {
    const { result } = renderHook(() => useEmailVerification(), { wrapper })

    expect(result.current.user).toBeNull()
    expect(result.current.isEmailVerified).toBe(false)
    expect(result.current.loading).toBe(false)
    expect(result.current.needsVerification).toBeFalsy()
  })

  it('should return correct values when user is logged in and verified', () => {
    mockAuthContext.user = { id: '123', email: 'test@example.com' } as any
    mockAuthContext.isEmailVerified = true

    const { result } = renderHook(() => useEmailVerification(), { wrapper })

    expect(result.current.user).toBeTruthy()
    expect(result.current.isEmailVerified).toBe(true)
    expect(result.current.loading).toBe(false)
    expect(result.current.needsVerification).toBe(false)
  })

  it('should detect when user needs verification', () => {
    mockAuthContext.user = { id: '123', email: 'test@example.com' } as any
    mockAuthContext.isEmailVerified = false

    const { result } = renderHook(() => useEmailVerification(), { wrapper })

    expect(result.current.user).toBeTruthy()
    expect(result.current.isEmailVerified).toBe(false)
    expect(result.current.loading).toBe(false)
    expect(result.current.needsVerification).toBe(true)
  })

  it('should show warning toast for unverified user when verification not required', () => {
    mockAuthContext.user = { id: '123', email: 'test@example.com' } as any
    mockAuthContext.isEmailVerified = false

    renderHook(() => useEmailVerification(false), { wrapper })

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Email not verified',
      description: 'Please check your email and verify your account for full access.',
      variant: 'destructive',
    })
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('should redirect to auth when verification is required', () => {
    mockAuthContext.user = { id: '123', email: 'test@example.com' } as any
    mockAuthContext.isEmailVerified = false

    renderHook(() => useEmailVerification(true), { wrapper })

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Email verification required',
      description: 'Please verify your email address to access this feature.',
      variant: 'destructive',
    })
    expect(mockNavigate).toHaveBeenCalledWith('/auth')
  })

  it('should not show toast or redirect when loading', () => {
    mockAuthContext.user = { id: '123', email: 'test@example.com' } as any
    mockAuthContext.isEmailVerified = false
    mockAuthContext.loading = true

    renderHook(() => useEmailVerification(true), { wrapper })

    expect(mockToast).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('should not show toast or redirect when user is verified', () => {
    mockAuthContext.user = { id: '123', email: 'test@example.com' } as any
    mockAuthContext.isEmailVerified = true

    renderHook(() => useEmailVerification(true), { wrapper })

    expect(mockToast).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})