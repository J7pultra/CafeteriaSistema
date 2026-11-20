import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Coffee,
  ShoppingCart,
  Users,
  Sparkles,
  LogOut,
  Coffee as CoffeeIcon,
  ShoppingBag,
  PackageCheck,
  Bot,
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
      { to: '/dashboard', label: 'Consola de Operaciones', icon: <LayoutDashboard size={18} /> },
      { to: '/catalog', label: 'Lotes e Inventario', icon: <Coffee size={18} /> },
      { to: '/orders', label: 'Despacho & Ventas', icon: <ShoppingCart size={18} /> },
      { to: '/customers', label: 'Comunidad & Clientes', icon: <Users size={18} /> },
      { to: '/skills', label: 'Laboratorio de Tueste', icon: <Sparkles size={18} /> },
      { to: '/chat', label: 'Copiloto de Negocio', icon: <Bot size={18} /> },
    ]
  } else if (isBarista) {
    navItems = [
      { to: '/orders', label: 'Comandas de Barra', icon: <ShoppingCart size={18} /> },
      { to: '/catalog', label: 'Granos Disponibles', icon: <Coffee size={18} /> },
      { to: '/skills', label: 'Fichas de Extracción', icon: <Sparkles size={18} /> },
      { to: '/chat', label: 'Copiloto de Barra', icon: <Bot size={18} /> },
    ]
  } else {
    // Customer
    navItems = [
      { to: '/store', label: 'Cafés de Origen', icon: <ShoppingBag size={18} /> },
      { to: '/carritocliente', label: 'Mi Carrito', icon: <ShoppingCart size={18} />, badge: totalCount > 0 ? totalCount : undefined },
      { to: '/my-orders', label: 'Mis Pedidos', icon: <PackageCheck size={18} /> },
      { to: '/chat', label: 'Sommelier Virtual', icon: <Bot size={18} /> },
    ]
  }

  const roleDisplayNames: Record<string, string> = {
    ROLE_ADMIN: 'Gerente General',
    ROLE_BARISTA: 'Barista de Estación',
    ROLE_CUSTOMER: 'Miembro Leal',
  }

  const userRole = user?.roles?.[0] || 'ROLE_CUSTOMER'
  const displayRole = roleDisplayNames[userRole] || userRole

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-icon">
          <CoffeeIcon size={20} />
        </div>
        <div>
          <h1 className="brand-title">Sistema Café</h1>
          <span className="brand-subtitle">Tostaduría de Especialidad</span>
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
        <div className="user-badge">
          <div className="user-info">
            <span className="user-name">{user?.username || 'Usuario'}</span>
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
      </div>
    </aside>
  )
}

export default Sidebar
