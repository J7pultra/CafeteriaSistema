import api from './api'
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '../types'

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', {
      usernameOrEmail: credentials.username,
      username: credentials.username,
      password: credentials.password,
    })
    const { accessToken, refreshToken, username, roles } = response.data
    localStorage.setItem('coffee_access_token', accessToken)
    localStorage.setItem('coffee_refresh_token', refreshToken)
    localStorage.setItem(
      'coffee_user',
      JSON.stringify({ username, roles, email: `${username}@sistemacafe.com` })
    )
    return response.data
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data)
    const { accessToken, refreshToken, username, roles } = response.data
    localStorage.setItem('coffee_access_token', accessToken)
    localStorage.setItem('coffee_refresh_token', refreshToken)
    localStorage.setItem(
      'coffee_user',
      JSON.stringify({ username, roles, email: data.email })
    )
    return response.data
  },

  logout(): void {
    localStorage.removeItem('coffee_access_token')
    localStorage.removeItem('coffee_refresh_token')
    localStorage.removeItem('coffee_user')
    window.dispatchEvent(new Event('auth:logout'))
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('coffee_user')
    if (!userStr) return null
    try {
      return JSON.parse(userStr) as User
    } catch {
      return null
    }
  },

  getToken(): string | null {
    return localStorage.getItem('coffee_access_token')
  },

  isAuthenticated(): boolean {
    return Boolean(this.getToken())
  },

  hasRole(role: string): boolean {
    const user = this.getCurrentUser()
    if (!user || !user.roles) return false
    return user.roles.includes(role) || user.roles.includes('ROLE_ADMIN')
  },
}

export default authService
