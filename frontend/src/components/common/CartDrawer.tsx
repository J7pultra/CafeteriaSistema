import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Coffee } from 'lucide-react'
import { useCart } from '../../context/CartContext'

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    totalCount,
  } = useCart()
  const navigate = useNavigate()
  const [isClosing, setIsClosing] = useState(false)
  const [removingId, setRemovingId] = useState<number | null>(null)

  useEffect(() => {
    if (isCartOpen) {
      setIsClosing(false)
    }
  }, [isCartOpen])

  if (!isCartOpen) return null

  const handleClose = () => {
    setIsClosing(true)
    window.setTimeout(() => {
      setIsClosing(false)
      closeCart()
    }, 220)
  }

  const handleRemove = (productId: number) => {
    setRemovingId(productId)
    window.setTimeout(() => {
      removeFromCart(productId)
      setRemovingId(null)
    }, 200)
  }

  const handleCheckout = () => {
    setIsClosing(true)
    window.setTimeout(() => {
      setIsClosing(false)
      closeCart()
      navigate('/carritocliente')
    }, 180)
  }

  const taxAmount = subtotal * 0.12
  const grandTotal = subtotal + taxAmount

  return (
    <div
      className="drawer-backdrop"
      onClick={handleClose}
      data-testid="cart-drawer-backdrop"
    >
      <aside
        className={`drawer-panel ${isClosing ? 'closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Menú del Carrito"
        data-testid="cart-drawer-panel"
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(212, 163, 115, 0.08) 0%, transparent 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--accent-gold-soft)',
                border: '1px solid var(--border-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-gold)',
              }}
            >
              <ShoppingBag size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Mi Carrito
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {totalCount} {totalCount === 1 ? 'producto seleccionado' : 'productos seleccionados'}
              </span>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px', borderRadius: '50%' }}
            aria-label="Cerrar menú del carrito"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cart Items List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {cart.length === 0 ? (
            <div
              className="animate-stagger stagger-1"
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '40px 20px',
              }}
            >
              <div className="float-slow" style={{ marginBottom: '16px', color: 'var(--accent-gold)', opacity: 0.55 }}>
                <Coffee size={52} />
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
                Tu carrito está vacío
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '260px', marginBottom: '20px' }}>
                Añade bebidas calientes, frías o repostería desde el menú para iniciar tu pedido.
              </p>
              <button onClick={handleClose} className="btn btn-outline btn-sm">
                Explorar Menú
              </button>
            </div>
          ) : (
            cart.map((item, index) => {
              const unitPrice = Number(item.product.unitPrice ?? item.product.price ?? 0)
              const lineTotal = unitPrice * item.quantity
              const isItemRemoving = removingId === item.product.id
              const staggerClass = `stagger-${Math.min(index + 1, 10)}`

              return (
                <div
                  key={item.product.id}
                  className={`animate-stagger ${staggerClass}`}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    alignItems: 'center',
                    transition: 'all 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
                    opacity: isItemRemoving ? 0 : 1,
                    transform: isItemRemoving ? 'translateX(36px) scale(0.95)' : 'translateX(0) scale(1)',
                  }}
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      flexShrink: 0,
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-primary)',
                    }}
                  >
                    <img
                      src={
                        item.product.imageUrl ||
                        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&auto=format&fit=crop&q=80'
                      }
                      alt={item.product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.product.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      ${unitPrice.toFixed(2)} c/u
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '3px 7px' }}
                        aria-label={`Disminuir cantidad de ${item.product.name}`}
                      >
                        <Minus size={12} />
                      </button>
                      <span
                        key={item.quantity}
                        className="badge-pop"
                        style={{ fontWeight: 700, fontSize: '0.85rem', minWidth: '18px', textAlign: 'center' }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '3px 7px' }}
                        disabled={item.quantity >= (item.product.stockQuantity || 50)}
                        aria-label={`Aumentar cantidad de ${item.product.name}`}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent-gold)', fontSize: '0.95rem' }}>
                      ${lineTotal.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleRemove(item.product.id)}
                      className="btn btn-danger btn-sm"
                      style={{ padding: '5px 7px' }}
                      title="Eliminar producto"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer Totals & Checkout CTA */}
        {cart.length > 0 && (
          <div
            style={{
              padding: '20px 24px',
              borderTop: '1px solid var(--border-color)',
              backgroundColor: 'rgba(13, 12, 11, 0.9)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)} USD</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '12px', color: 'var(--text-muted)' }}>
              <span>IVA estimado (12%)</span>
              <span>${taxAmount.toFixed(2)} USD</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.15rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                paddingTop: '10px',
                borderTop: '1px dashed var(--border-color)',
                marginBottom: '16px',
              }}
            >
              <span>Total</span>
              <span style={{ color: 'var(--accent-gold)' }}>${grandTotal.toFixed(2)} USD</span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={clearCart}
                className="btn btn-secondary btn-sm"
                style={{ padding: '10px 14px' }}
                title="Vaciar carrito"
              >
                Vaciar
              </button>
              <button
                onClick={handleCheckout}
                className="btn btn-primary"
                style={{ flex: 1, padding: '12px', justifyContent: 'center' }}
                data-testid="drawer-checkout-btn"
              >
                <span>Ir a Facturar y Pagar</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}

export default CartDrawer
