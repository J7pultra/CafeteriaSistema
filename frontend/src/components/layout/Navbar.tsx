import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import { User as UserIcon } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export const Navbar: React.FC = () => {
  const { user, hasRole } = useAuth()
  const location = useLocation()

  const getSectionTitle = (path: string): string => {
    if (path.startsWith('/dashboard')) return 'Dashboard'
    if (path.startsWith('/catalog')) return hasRole('ROLE_ADMIN') ? 'Productos' : 'Disponibilidad'
    if (path.startsWith('/orders')) return 'Pedidos y POS'
    if (path.startsWith('/customers')) return 'Clientes'
    if (path.startsWith('/chat')) return 'Asistente'
    if (path.startsWith('/store') || path === '/') return 'Menú'
    if (path.startsWith('/carritocliente')) return 'Mi Carrito'
    if (path.startsWith('/my-orders')) return 'Mis Pedidos'
    return 'Sistema de Cafetería'
  }

  const roleLabel = hasRole('ROLE_ADMIN')
    ? 'Administrador'
    : hasRole('ROLE_BARISTA')
    ? 'Barista'
    : 'Cliente'

  return (
    <header className="top-bar">
      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          {getSectionTitle(location.pathname)}
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {user ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              padding: '4px 12px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
            }}
          >
            <UserIcon size={14} color="var(--accent-gold)" />
            <span style={{ fontWeight: 500 }}>{user.username}</span>
            <span style={{ color: 'var(--border-color)' }}>|</span>
            <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>{roleLabel}</span>
          </div>
        ) : (
          <Link
            to="/login"
            className="btn btn-primary btn-sm"
            style={{ padding: '6px 14px', fontSize: '0.8rem', textDecoration: 'none' }}
          >
            Iniciar Sesión / Registrarse
          </Link>
        )}
      </div>
    </header>
  )
}

export default Navbar
