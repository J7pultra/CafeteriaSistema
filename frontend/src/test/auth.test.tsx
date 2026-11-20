import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from '../context/AuthContext'
import LoginPage from '../pages/LoginPage'
import authService from '../services/authService'

// Mock authService
vi.mock('../services/authService', () => ({
  default: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    getToken: vi.fn(),
    isAuthenticated: vi.fn(),
    hasRole: vi.fn(),
  },
}))

describe('LoginPage and AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders login form with title and input fields', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>
    )

    expect(screen.getByText('Sistema Café')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('ej. barista_juan')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ingresar al Sistema/i })).toBeInTheDocument()
  })

  it('populates fields when Admin Demo quick login is clicked', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>
    )

    const adminBtn = screen.getByRole('button', { name: /Admin Demo/i })
    fireEvent.click(adminBtn)

    const userInput = screen.getByPlaceholderText('ej. barista_juan') as HTMLInputElement
    const passInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement

    expect(userInput.value).toBe('admin')
    expect(passInput.value).toBe('admin123')
  })

  it('submits login successfully and invokes authService.login', async () => {
    const mockLogin = vi.mocked(authService.login).mockResolvedValueOnce({
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      tokenType: 'Bearer',
      username: 'admin',
      roles: ['ROLE_ADMIN'],
    })

    render(
      <AuthProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: /Admin Demo/i }))
    fireEvent.click(screen.getByRole('button', { name: /Ingresar al Sistema/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        username: 'admin',
        password: 'admin123',
      })
    })
  })

  it('displays error alert when login fails', async () => {
    vi.mocked(authService.login).mockRejectedValueOnce(new Error('Invalid credentials'))

    render(
      <AuthProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>
    )

    fireEvent.change(screen.getByPlaceholderText('ej. barista_juan'), {
      target: { value: 'bad_user' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'wrong_password' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Ingresar al Sistema/i }))

    await waitFor(() => {
      expect(
        screen.getByText('Credenciales inválidas. Por favor verifique usuario y contraseña.')
      ).toBeInTheDocument()
    })
  })

  it('validates role permissions in AuthContext', () => {
    const TestConsumer = () => {
      const { hasRole } = useAuth()
      return (
        <div>
          <span data-testid="is-admin">{String(hasRole('ROLE_ADMIN'))}</span>
          <span data-testid="is-barista">{String(hasRole('ROLE_BARISTA'))}</span>
        </div>
      )
    }

    vi.mocked(authService.getCurrentUser).mockReturnValue({
      id: 1,
      username: 'barista_juan',
      email: 'barista@sistemacafe.com',
      roles: ['ROLE_BARISTA'],
    })
    vi.mocked(authService.getToken).mockReturnValue('token123')

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    expect(screen.getByTestId('is-barista').textContent).toBe('true')
  })
})
