import React, { createContext, useContext, useState, useEffect } from 'react'
import type { User, LoginRequest, RegisterRequest, AuthResponse } from '../types'
import authService from '../services/authService'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginRequest) => Promise<AuthResponse>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
  hasRole: (role: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const savedToken = authService.getToken()
    const savedUser = authService.getCurrentUser()
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(savedUser)
    }
    setIsLoading(false)

    const handleLogout = () => {
      setUser(null)
      setToken(null)
    }

    window.addEventListener('auth:logout', handleLogout)
    return () => window.removeEventListener('auth:logout', handleLogout)
  }, [])

  const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
    const res = await authService.login(credentials)
    setToken(res.accessToken)
    const email =
      res.username === 'cliente_carlos'
        ? 'carlos.mendoza@example.com'
        : `${res.username}@sistemacafe.com`
    setUser({
      id: 1,
      username: res.username,
      email,
      roles: res.roles,
    })
    return res
  }

  const register = async (data: RegisterRequest) => {
    const res = await authService.register(data)
    setToken(res.accessToken)
    setUser({
      id: 1,
      username: res.username,
      email: data.email,
      roles: res.roles,
    })
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    setToken(null)
  }

  const hasRole = (role: string) => {
    if (!user || !user.roles) return false
    return user.roles.includes(role) || user.roles.includes('ROLE_ADMIN')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token),
        isLoading,
        login,
        register,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
