import React, { useEffect, useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Coffee, LogIn, MessageSquare, ShoppingBag, ShoppingCart } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import FloatingChatWidget from '../common/FloatingChatWidget'
import SommelierHighlighter from '../common/SommelierHighlighter'
import CartDrawer from '../common/CartDrawer'
import FlyingCartOverlay from '../common/FlyingCartOverlay'

export const Layout: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const { totalCount, openCart, lastAddedAt } = useCart()
  const location = useLocation()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [guestCartBump, setGuestCartBump] = useState(false)

  useEffect(() => {
    if (lastAddedAt > 0) {
      setGuestCartBump(true)
      const timer = window.setTimeout(() => setGuestCartBump(false), 600)
      return () => window.clearTimeout(timer)
    }
  }, [lastAddedAt])

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
        {/* Guest Header */}
        <header
          style={{
            height: '70px',
            backgroundColor: 'rgba(20, 18, 17, 0.92)',
            backdropFilter: 'blur(10px)',
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
            className="nav-link-animated"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textDecoration: 'none',
            }}
          >
            <div
              className="brand-icon"
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'var(--accent-gold)',
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
              className="nav-link-animated"
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

            <button
              type="button"
              onClick={openCart}
              data-testid="guest-cart-link"
              className={`nav-link-animated ${guestCartBump ? 'cart-bump' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
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
                  key={totalCount}
                  className="badge-pop"
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
            </button>

            <Link
              to="/chat"
              className="nav-link-animated"
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
          <div key={location.pathname} className="page-transition-enter">
            <Outlet />
          </div>
        </main>

        <CartDrawer />
        <FlyingCartOverlay />
        <FloatingChatWidget />
        <SommelierHighlighter />
      </div>
    )
  }

  return (
    <div className="app-container">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />
      <div className="main-content">
        <Navbar onOpenMobileMenu={() => setIsMobileSidebarOpen(true)} />
        <main className="page-container">
          <div key={location.pathname} className="page-transition-enter">
            <Outlet />
          </div>
        </main>
      </div>
      <CartDrawer />
      <FlyingCartOverlay />
      <FloatingChatWidget />
      <SommelierHighlighter />
    </div>
  )
}

export default Layout
