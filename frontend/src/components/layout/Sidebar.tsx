import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Coffee,
  ShoppingCart,
  Users,
  LogOut,
  Coffee as CoffeeIcon,
  ShoppingBag,
  PackageCheck,
  MessageSquare,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'

export const Sidebar: React.FC = () => {
  const { user, logout, hasRole } = useAuth()
  const { totalCount } = useCart()

  const isAdmin = hasRole('ROLE_ADMIN')
  const isBarista = hasRole('ROLE_BARISTA')

  interface NavItem {
    to: string
    label: string
    icon: React.ReactNode
    badge?: number
  }

  let navItems: NavItem[] = []

  if (isAdmin) {
    navItems = [
      { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
      { to: '/catalog', label: 'Productos', icon: <Coffee size={18} /> },
      { to: '/orders', label: 'Pedidos y POS', icon: <ShoppingCart size={18} /> },
      { to: '/customers', label: 'Clientes', icon: <Users size={18} /> },
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
      { to: '/carritocliente', label: 'Mi Carrito', icon: <ShoppingCart size={18} />, badge: totalCount > 0 ? totalCount : undefined },
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
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-icon">
          <CoffeeIcon size={20} />
        </div>
        <div>
          <h1 className="brand-title">Sistema Café</h1>
          <span className="brand-subtitle">Gestión de Cafetería</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {item.icon}
              <span>{item.label}</span>
            </div>
            {item.badge !== undefined && (
              <span
                style={{
                  backgroundColor: 'var(--accent-gold)',
                  color: '#1a120c',
                  borderRadius: '9999px',
                  padding: '1px 7px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
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
  )
}

export default Sidebar
