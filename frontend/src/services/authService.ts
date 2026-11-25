import api from './api'
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '../types'

const GUEST_CART_KEY = 'coffee_cart:guest'
const LEGACY_CART_KEY = 'coffee_cart'

const readCartArray = (key: string): Array<{ product: { id: number; stockQuantity?: number }; quantity: number }> => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const transferGuestCartOnAuth = (username: string, roles: string[], isNewRegister: boolean) => {
  const isStaff = roles.includes('ROLE_ADMIN') || roles.includes('ROLE_BARISTA')
  const guestItems = readCartArray(GUEST_CART_KEY)
  localStorage.removeItem(GUEST_CART_KEY)
  localStorage.removeItem(LEGACY_CART_KEY)

  const userKey = `coffee_cart:${username}`

  if (isStaff) {
    return
  }

  if (isNewRegister) {
    if (guestItems.length > 0) {
      localStorage.setItem(userKey, JSON.stringify(guestItems))
    } else {
      localStorage.removeItem(userKey)
    }
    return
  }

  if (guestItems.length > 0) {
    const existing = readCartArray(userKey)
    const merged = [...existing]
    for (const gItem of guestItems) {
      const idx = merged.findIndex((m) => m.product?.id === gItem.product?.id)
      if (idx > -1) {
        const maxStock = merged[idx].product?.stockQuantity || 50
        merged[idx] = {
          ...merged[idx],
          quantity: Math.min(merged[idx].quantity + gItem.quantity, maxStock),
        }
      } else {
        merged.push(gItem)
      }
    }
    localStorage.setItem(userKey, JSON.stringify(merged))
  }
}

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
    transferGuestCartOnAuth(username, roles || [], false)
    window.dispatchEvent(new CustomEvent('auth:login', { detail: { username } }))
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
    transferGuestCartOnAuth(username, roles || [], true)
    window.dispatchEvent(new CustomEvent('auth:register', { detail: { username } }))
    return response.data
  },

  logout(): void {
    localStorage.removeItem('coffee_access_token')
    localStorage.removeItem('coffee_refresh_token')
    localStorage.removeItem('coffee_user')
    localStorage.removeItem(LEGACY_CART_KEY)
    localStorage.removeItem(GUEST_CART_KEY)
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
