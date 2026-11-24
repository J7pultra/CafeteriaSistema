import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingBag,
  Plus,
  Minus,
  Search,
  Filter,
  Coffee,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import productService from '../services/productService'
import customerService from '../services/customerService'
import { CategoryBadge, TierBadge } from '../components/common/Badge'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Alert from '../components/common/Alert'
import type {
  Product,
  Customer,
  CustomerTier,
  ProductCategory,
} from '../types'

const TIER_DISCOUNTS: Record<CustomerTier, number> = {
  BRONZE: 0.0,
  SILVER: 0.05,
  GOLD: 0.1,
  PLATINUM: 0.15,
}

const CATEGORY_FILTER_OPTIONS: { value: ProductCategory | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Todas las Categorías' },
  { value: 'HOT_BEVERAGES', label: 'Bebidas Calientes' },
  { value: 'COLD_BEVERAGES', label: 'Bebidas Frías' },
  { value: 'BAKERY', label: 'Repostería' },
  { value: 'BREAKFAST', label: 'Desayunos' },
  { value: 'SNACKS', label: 'Snacks' },
  { value: 'OTHER', label: 'Otros' },
]

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
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStoreData = async () => {
      setLoading(true)
      try {
        const prodRes = await productService.getProducts(0, 100).catch(() => ({
          content: [] as Product[],
        }))
        setProducts(prodRes?.content?.filter((p) => p.active) ?? [])

        if (user?.email) {
          const custRes = await customerService.getCustomerByEmail(user.email).catch(() => null)
          setCustomer(custRes)
        } else {
          setCustomer(null)
        }
      } catch {
        setError('No se pudo cargar la información del menú.')
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    loadStoreData()
  }, [user])

  const discountRate = customer ? TIER_DISCOUNTS[customer.tier] : 0
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
    const matchesCat = categoryFilter === 'ALL' || p.category === categoryFilter
    return matchesSearch && matchesCat
  })

  if (loading) return <LoadingSpinner label="Cargando menú de cafetería..." />

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
                Menú de Cafetería
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
                  . Disfruta de nuestras bebidas y repostería con beneficios de cliente frecuente.
                </>
              ) : (
                <>Bebidas calientes, frías y repostería artesanal preparadas al momento.</>
              )}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
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
                Compra Libre (Sin cuenta requerida)
              </div>
            )}

            {/* Cart Button */}
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
            style={{ paddingLeft: '40px', width: '100%' }}
            placeholder="Buscar por nombre o descripción..."
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
            {CATEGORY_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
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
            <Coffee size={48} color="var(--accent-gold)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>
              No hay productos disponibles en esta selección
            </h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto' }}>
              El catálogo se encuentra limpio y listo para el registro de nuevos productos desde el panel de administración.
            </p>
          </div>
        ) : (
          filteredProducts.map((p) => {
            const unitPrice = Number(p.unitPrice ?? p.price ?? 0)
            const inCart = cart.find((item) => item.product.id === p.id)
            const isOutOfStock = p.stockQuantity <= 0
            const thumb =
              p.imageUrl ||
              'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80'

            return (
              <div
                key={p.id}
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
                  <div
                    style={{
                      width: '100%',
                      height: '170px',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      marginBottom: '14px',
                      backgroundColor: 'var(--bg-secondary)',
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

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px',
                    }}
                  >
                    <CategoryBadge category={p.category} />
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: isOutOfStock ? 'var(--accent-red)' : 'var(--text-muted)',
                      }}
                    >
                      {isOutOfStock ? 'AGOTADO' : `${p.stockQuantity} uds disponibles`}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '4px',
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
                    SKU: {p.sku}
                  </div>

                  <p
                    style={{
                      fontSize: '0.84rem',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.45',
                      marginBottom: '14px',
                      minHeight: '38px',
                    }}
                  >
                    {p.description || 'Producto preparado con ingredientes selectos de la más alta calidad.'}
                  </p>
                </div>

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
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Precio unitario</div>
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
          })
        )}
      </div>
    </div>
  )
}

export default CustomerStorePage
