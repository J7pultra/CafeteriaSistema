import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingBag,
  Plus,
  Minus,
  Search,
  Filter,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import productService from '../services/productService'
import customerService from '../services/customerService'
import { RoastBadge, TierBadge } from '../components/common/Badge'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Alert from '../components/common/Alert'
import type {
  Product,
  Customer,
  CustomerTier,
} from '../types'

const TIER_DISCOUNTS: Record<CustomerTier, number> = {
  BRONZE: 0.0,
  SILVER: 0.05,
  GOLD: 0.1,
  PLATINUM: 0.15,
}

export const CustomerStorePage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const {
    cart,
    addToCart,
    updateQuantity,
  } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [roastFilter, setRoastFilter] = useState('ALL')

  const [orderSuccess, setOrderSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load products and customer profile
  useEffect(() => {
    const loadStoreData = async () => {
      setLoading(true)
      try {
        // 1. Fetch real products from backend
        const prodRes = await productService.getProducts(0, 100).catch(() => ({
          content: [] as Product[],
        }))
        setProducts(prodRes?.content?.filter((p) => p.active) ?? [])

        // 2. Fetch customer profile if authenticated
        if (user?.email) {
          const custRes = await customerService.getCustomerByEmail(user.email).catch(() => null)
          setCustomer(custRes)
        } else {
          setCustomer(null)
        }
      } catch {
        setError('No se pudo cargar la información de la tienda.')
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    loadStoreData()
  }, [user])

  const discountRate = customer ? TIER_DISCOUNTS[customer.tier] : 0
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.origin && p.origin.toLowerCase().includes(search.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
    const matchesCat = categoryFilter === 'ALL' || p.category === categoryFilter
    const matchesRoast = roastFilter === 'ALL' || p.roastLevel === roastFilter
    return matchesSearch && matchesCat && matchesRoast
  })

  if (loading) return <LoadingSpinner label="Preparando vitrina de cafés de especialidad..." />

  return (
    <div style={{ position: 'relative' }}>
      {/* Header & Loyalty Status */}
      <div
        className="card"
        style={{
          marginBottom: '28px',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <h1 className="page-title" style={{ margin: 0 }}>
                Cafés de Temporada & Mesa de Cata
              </h1>
              {customer && <TierBadge tier={customer.tier} />}
            </div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {customer ? (
                <>
                  Bienvenido,{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {customer.firstName} {customer.lastName}
                  </strong>
                  . Granos de especialidad tostados bajo demanda con beneficio de membresía.
                </>
              ) : (
                <>
                  Granos de origen seleccionados por altitud y proceso. Tueste artesanal bajo pedido.
                </>
              )}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {/* Loyalty or Guest Tag */}
            {customer ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                    Puntos Lealtad
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                    {customer.loyaltyPoints} pts
                  </div>
                </div>

                <div style={{ width: '1px', height: '28px', backgroundColor: 'var(--border-color)' }} />

                <div>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                    Beneficio
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-green)' }}>
                    {discountRate > 0 ? `${discountRate * 100}% Descuento` : 'Estándar'}
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                }}
              >
                Compra Libre (Sin registro previo)
              </div>
            )}

            {/* Cart Trigger Button */}
            <button
              onClick={() => navigate('/carritocliente')}
              className="btn btn-primary"
              style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}
              data-testid="cart-drawer-btn"
            >
              <ShoppingBag size={18} />
              <span>Mi Carrito</span>
              {totalCartCount > 0 && (
                <span
                  style={{
                    backgroundColor: 'var(--accent-red)',
                    color: '#fff',
                    borderRadius: '50%',
                    padding: '2px 7px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                  }}
                >
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {orderSuccess && (
        <Alert type="success" message={orderSuccess} onClose={() => setOrderSuccess(null)} />
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          alignItems: 'center',
          backgroundColor: 'var(--bg-card)',
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search
            size={18}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '12px', top: '12px' }}
          />
          <input
            type="text"
            className="form-input"
            data-sommelier-id="catalog-search-input"
            style={{ paddingLeft: '40px', width: '100%' }}
            placeholder="Buscar por notas de cata (caramelo, jazmín), origen o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Filter size={18} color="var(--accent-gold)" />
          <select
            className="form-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">Todas las Categorías</option>
            <option value="SPECIALTY_BEANS">Granos de Especialidad</option>
            <option value="ESPRESSO_SINGLE_ORIGIN">Espresso Origen Único</option>
            <option value="COLD_BREW_BLEND">Mezcla / Cold Brew</option>
            <option value="DECAF_ORGANIC">Descafeinado Orgánico</option>
          </select>

          <select
            className="form-select"
            value={roastFilter}
            onChange={(e) => setRoastFilter(e.target.value)}
          >
            <option value="ALL">Todos los Tuestes</option>
            <option value="LIGHT">Claro (Light)</option>
            <option value="MEDIUM_LIGHT">Medio Claro</option>
            <option value="MEDIUM">Medio (Medium)</option>
            <option value="MEDIUM_DARK">Medio Oscuro</option>
            <option value="DARK">Oscuro (Dark)</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: '24px',
          marginBottom: '40px',
        }}
      >
        {filteredProducts.length === 0 ? (
          <div
            className="card"
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '60px 20px',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>☕</div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>
              No hay cafés disponibles en esta selección
            </h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto' }}>
              El catálogo se encuentra limpio y listo para registrar nuevos lotes desde el panel de administración.
            </p>
          </div>
        ) : (
          filteredProducts.map((p) => {
            const unitPrice = Number(p.unitPrice ?? p.price ?? 0)
            const inCart = cart.find((item) => item.product.id === p.id)
            const isOutOfStock = p.stockQuantity <= 0
            const thumb =
              p.imageUrl ||
              (p.roastLevel === 'LIGHT' || p.roastLevel === 'MEDIO_CLARO'
                ? 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80'
                : p.roastLevel === 'DARK'
                ? 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=600&auto=format&fit=crop&q=80'
                : 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&auto=format&fit=crop&q=80')

            return (
              <div
                key={p.id}
                data-sommelier-id={`product-card-${p.id}`}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  border: inCart ? '1px solid var(--accent-gold)' : '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-card)',
                }}
              >
                <div>
                  {/* Product Thumbnail Photo */}
                  <div
                    style={{
                      width: '100%',
                      height: '170px',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      marginBottom: '14px',
                      backgroundColor: '#1b130e',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <img
                      src={thumb}
                      alt={p.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </div>

                  {/* Badges Row */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px',
                    }}
                  >
                    <RoastBadge roast={p.roastLevel} />
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: isOutOfStock ? 'var(--accent-red)' : 'var(--text-muted)',
                      }}
                    >
                      {isOutOfStock ? 'AGOTADO' : `${p.stockQuantity} kg disponibles`}
                    </span>
                  </div>

                  {/* Title & SKU */}
                  <h3
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '4px',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {p.name}
                  </h3>
                  <div
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--accent-gold)',
                      fontWeight: 500,
                      marginBottom: '10px',
                    }}
                  >
                    📍 {p.origin || 'Terroir de Especialidad'} • SKU: {p.sku}
                  </div>

                  {/* Tasting notes / Description */}
                  <p
                    style={{
                      fontSize: '0.84rem',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.45',
                      marginBottom: '14px',
                      minHeight: '38px',
                    }}
                  >
                    {p.description || 'Café seleccionado a mano con perfil sensorial equilibrado.'}
                  </p>

                  {p.flavorNotes && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                      {p.flavorNotes.split(',').map((note, idx) => (
                        <span key={idx} className="flavor-chip">
                          {note.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

              {/* Price & Add to Cart */}
              <div
                style={{
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '14px',
                  marginTop: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Precio / kg</div>
                  <div
                    style={{
                      fontSize: '1.3rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                    }}
                  >
                    ${unitPrice.toFixed(2)}
                  </div>
                </div>

                {inCart ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: 'rgba(212, 163, 115, 0.15)',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <button
                      onClick={() => updateQuantity(p.id, -1)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 8px' }}
                    >
                      <Minus size={14} />
                    </button>
                    <span style={{ fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>
                      {inCart.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(p.id, 1)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 8px' }}
                      disabled={inCart.quantity >= p.stockQuantity}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addToCart(p)}
                    disabled={isOutOfStock}
                    className="btn btn-primary"
                    style={{
                      padding: '8px 14px',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <ShoppingBag size={15} />
                    {isOutOfStock ? 'Sin Stock' : 'Agregar'}
                  </button>
                )}
              </div>
            </div>
          )
        }))}
      </div>
    </div>
  )
}

export default CustomerStorePage
