import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../common/LoadingSpinner'

interface ProtectedRouteProps {
  requiredRole?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole }) => {
  const { isAuthenticated, isLoading, hasRole } = useAuth()

  if (isLoading) {
    return <LoadingSpinner label="Verificando sesión segura..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && !hasRole(requiredRole)) {
    // Si es un cliente intentando ingresar a un área de administración, redirigir a la tienda
    if (hasRole('ROLE_CUSTOMER') || !hasRole('ROLE_ADMIN')) {
      return <Navigate to="/store" replace />
    }
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--accent-red)', marginBottom: '12px' }}>Acceso Restringido</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Tu cuenta no cuenta con los privilegios requeridos ({requiredRole}) para acceder a este módulo.
        </p>
      </div>
    )
  }

  return <Outlet />
}

export default ProtectedRoute
