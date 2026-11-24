import React from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Coffee, LogIn, MessageSquare, ShoppingBag, ShoppingCart } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import FloatingChatWidget from '../common/FloatingChatWidget'
import SommelierHighlighter from '../common/SommelierHighlighter'

export const Layout: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const { totalCount } = useCart()
  const location = useLocation()

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
        {/* Guest Header */}
        <header
          style={{
            height: '70px',
            backgroundColor: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          <Link
            to="/store"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--accent-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1a120c',
              }}
            >
              <Coffee size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                Sistema Café
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Gestión de Cafetería
              </div>
            </div>
          </Link>

          {/* Guest Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Link
              to="/store"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none',
                color: location.pathname === '/store' || location.pathname === '/' ? 'var(--accent-gold)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              <ShoppingBag size={17} />
              <span>Menú</span>
            </Link>

            <Link
              to="/carritocliente"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none',
                color: location.pathname === '/carritocliente' ? 'var(--accent-gold)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.9rem',
                position: 'relative',
              }}
            >
              <ShoppingCart size={17} />
              <span>Mi Carrito</span>
              {totalCount > 0 && (
                <span
                  style={{
                    backgroundColor: 'var(--accent-gold)',
                    color: '#1a120c',
                    borderRadius: '9999px',
                    padding: '1px 6px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                  }}
                >
                  {totalCount}
                </span>
              )}
            </Link>

            <Link
              to="/chat"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none',
                color: location.pathname === '/chat' ? 'var(--accent-gold)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              <MessageSquare size={17} />
              <span>Asistente</span>
            </Link>

            <Link
              to="/login"
              className="btn btn-secondary btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
              }}
            >
              <LogIn size={15} />
              <span>Iniciar Sesión</span>
            </Link>
          </div>
        </header>

        {/* Guest Main Content */}
        <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
          <Outlet />
        </main>

        <FloatingChatWidget />
        <SommelierHighlighter />
      </div>
    )
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main className="page-container">
          <Outlet />
        </main>
      </div>
      <FloatingChatWidget />
      <SommelierHighlighter />
    </div>
  )
}

export default Layout
