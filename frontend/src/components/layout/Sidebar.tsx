import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Coffee,
  ShoppingCart,
  Users,
  UserCheck,
  LogOut,
  Coffee as CoffeeIcon,
  ShoppingBag,
  PackageCheck,
  MessageSquare,
  ChevronLeft,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'

interface SidebarProps {
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  isMobileOpen?: boolean
  onCloseMobile?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { user, logout, hasRole } = useAuth()
  const { totalCount, lastAddedAt } = useCart()
  const [badgeAnimating, setBadgeAnimating] = useState(false)

  useEffect(() => {
    if (lastAddedAt > 0) {
      setBadgeAnimating(true)
      const timer = window.setTimeout(() => setBadgeAnimating(false), 600)
      return () => window.clearTimeout(timer)
    }
  }, [lastAddedAt])

  const isAdmin = hasRole('ROLE_ADMIN')
  const isBarista = hasRole('ROLE_BARISTA')

  interface NavItem {
    to: string
    label: string
    icon: React.ReactNode
    badge?: number
    testId?: string
  }

  let navItems: NavItem[] = []

  if (isAdmin) {
    navItems = [
      { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
      { to: '/catalog', label: 'Productos', icon: <Coffee size={18} /> },
      { to: '/orders', label: 'Pedidos y POS', icon: <ShoppingCart size={18} /> },
      { to: '/customers', label: 'Clientes', icon: <Users size={18} /> },
      { to: '/baristas', label: 'Baristas', icon: <UserCheck size={18} /> },
      { to: '/chat', label: 'Asistente', icon: <MessageSquare size={18} /> },
    ]
  } else if (isBarista) {
    navItems = [
      { to: '/orders', label: 'Pedidos y POS', icon: <ShoppingCart size={18} /> },
      { to: '/catalog', label: 'Disponibilidad', icon: <Coffee size={18} /> },
      { to: '/chat', label: 'Asistente', icon: <MessageSquare size={18} /> },
    ]
  } else {
    // Cliente
    navItems = [
      { to: '/store', label: 'Menú', icon: <ShoppingBag size={18} /> },
      {
        to: '/carritocliente',
        label: 'Mi Carrito',
        icon: <ShoppingCart size={18} />,
        badge: totalCount > 0 ? totalCount : undefined,
        testId: 'sidebar-cart-link',
      },
      { to: '/my-orders', label: 'Mis Pedidos', icon: <PackageCheck size={18} /> },
      { to: '/chat', label: 'Soporte', icon: <MessageSquare size={18} /> },
    ]
  }

  const roleDisplayNames: Record<string, string> = {
    ROLE_ADMIN: 'Administrador',
    ROLE_BARISTA: 'Barista',
    ROLE_CUSTOMER: 'Cliente',
  }

  const userRole = user?.roles?.[0] || 'ROLE_CUSTOMER'
  const displayRole = roleDisplayNames[userRole] || 'Cliente'

  return (
    <>
      {isMobileOpen && <div className="sidebar-backdrop" onClick={onCloseMobile} />}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand-group">
            <div className="brand-icon">
              <CoffeeIcon size={20} />
            </div>
            <div className="sidebar-brand-text">
              <h1 className="brand-title">Sistema Café</h1>
              <span className="brand-subtitle">Gestión de Cafetería</span>
            </div>
          </div>

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="sidebar-toggle-btn"
              title={isCollapsed ? 'Expandir menú lateral' : 'Ocultar menú lateral'}
              aria-label={isCollapsed ? 'Expandir menú lateral' : 'Ocultar menú lateral'}
              data-testid="sidebar-toggle-btn"
            >
              <ChevronLeft
                size={16}
                style={{
                  transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, idx) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              title={isCollapsed ? item.label : undefined}
              data-testid={item.testId}
              className={({ isActive }) =>
                `nav-item animate-stagger stagger-${Math.min(idx + 1, 8)} ${isActive ? 'active' : ''}`
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: isCollapsed ? '0px' : '10px' }}>
                <span className={`nav-item-icon ${item.badge !== undefined && badgeAnimating ? 'cart-bump' : ''}`}>
                  {item.icon}
                </span>
                <span className="nav-item-label">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  key={item.badge}
                  className={badgeAnimating ? 'badge-pop' : ''}
                  style={{
                    backgroundColor: 'var(--accent-gold)',
                    color: '#1a120c',
                    borderRadius: '9999px',
                    padding: isCollapsed ? '0px 5px' : '1px 7px',
                    fontSize: isCollapsed ? '0.65rem' : '0.72rem',
                    fontWeight: 800,
                    position: isCollapsed ? 'absolute' : 'relative',
                    top: isCollapsed ? '4px' : undefined,
                    right: isCollapsed ? '8px' : undefined,
                  }}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {user ? (
            <div className="user-badge">
              <div className="user-info">
                <span className="user-name">{user.username}</span>
                <span className="user-role" style={{ color: 'var(--accent-gold)' }}>
                  {displayRole}
                </span>
              </div>
              <button
                onClick={logout}
                className="btn btn-secondary btn-sm"
                style={{ padding: '6px 10px' }}
                title="Cerrar Sesión"
                aria-label="Cerrar Sesión"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <NavLink
              to="/login"
              className="btn btn-primary btn-sm"
              style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}
            >
              Iniciar Sesión
            </NavLink>
          )}
        </div>
      </aside>
    </>
  )
}

export default Sidebar
