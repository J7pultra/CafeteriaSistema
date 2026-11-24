import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import { User as UserIcon, Menu, PanelLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

interface NavbarProps {
  onOpenMobileMenu?: () => void
  onToggleDesktopSidebar?: () => void
  isSidebarCollapsed?: boolean
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMobileMenu,
  onToggleDesktopSidebar,
  isSidebarCollapsed = false,
}) => {
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

  const sectionTitle = getSectionTitle(location.pathname)

  const roleLabel = hasRole('ROLE_ADMIN')
    ? 'Administrador'
    : hasRole('ROLE_BARISTA')
    ? 'Barista'
    : 'Cliente'

  return (
    <header className="top-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="btn btn-secondary btn-sm mobile-menu-btn"
            style={{ padding: '6px 8px' }}
            aria-label="Abrir menú lateral"
          >
            <Menu size={18} />
          </button>
        )}

        {onToggleDesktopSidebar && (
          <button
            type="button"
            onClick={onToggleDesktopSidebar}
            className="btn btn-secondary btn-sm"
            style={{ padding: '5px 8px' }}
            title={isSidebarCollapsed ? 'Mostrar menú lateral completo' : 'Contraer menú lateral'}
            aria-label="Alternar barra lateral"
            data-testid="navbar-sidebar-toggle"
          >
            <PanelLeft
              size={16}
              style={{
                color: isSidebarCollapsed ? 'var(--accent-gold)' : 'var(--text-secondary)',
                transition: 'color 0.2s ease, transform 0.25s ease',
                transform: isSidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </button>
        )}

        <h2
          key={sectionTitle}
          className="page-transition-enter"
          style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}
        >
          {sectionTitle}
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
              transition: 'var(--transition)',
            }}
          >
            <span className="pulse-dot-green" />
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
