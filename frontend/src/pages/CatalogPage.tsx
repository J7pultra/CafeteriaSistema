import React, { useEffect, useState } from 'react'
import { Plus, Search, Filter, Package, AlertCircle, Coffee, Trash2 } from 'lucide-react'
import productService from '../services/productService'
import { CategoryBadge } from '../components/common/Badge'
import Modal from '../components/common/Modal'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Alert from '../components/common/Alert'
import { useAuth } from '../context/AuthContext'
import type { Product, ProductCategory, ProductRequest } from '../types'

const CATEGORY_OPTIONS: { value: ProductCategory; label: string }[] = [
  { value: 'HOT_BEVERAGES', label: 'Bebidas Calientes' },
  { value: 'COLD_BEVERAGES', label: 'Bebidas Frías' },
  { value: 'BAKERY', label: 'Repostería' },
  { value: 'BREAKFAST', label: 'Desayunos' },
  { value: 'SNACKS', label: 'Snacks' },
  { value: 'OTHER', label: 'Otros' },
]

export const CatalogPage: React.FC = () => {
  const { hasRole } = useAuth()
  const isAdmin = hasRole('ROLE_ADMIN')

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isStockOpen, setIsStockOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [stockToAdd, setStockToAdd] = useState<number>(10)

  // New product form
  const [formData, setFormData] = useState<ProductRequest>({
    sku: '',
    name: '',
    description: '',
    imageUrl: '',
    category: 'HOT_BEVERAGES',
    price: 3.5,
    unitPrice: 3.5,
    stockQuantity: 25,
    active: true,
  })

  const loadProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await productService.getProducts(0, 100)
      setProducts(res?.content ?? [])
    } catch {
      setError('No se pudo conectar con el catálogo de productos. Verifica la conexión con el backend.')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) return
    setError(null)
    try {
      const payload: ProductRequest = {
        ...formData,
        unitPrice: formData.price,
        stockQuantity: Number(formData.stockQuantity),
      }
      const created = await productService.createProduct(payload)
      setProducts((prev) => [created, ...prev])
      setSuccess(`Producto ${created.name} (${created.sku}) registrado exitosamente.`)
      setIsCreateOpen(false)
      setFormData({
        sku: '',
        name: '',
        description: '',
        imageUrl: '',
        category: 'HOT_BEVERAGES',
        price: 3.5,
        unitPrice: 3.5,
        stockQuantity: 25,
        active: true,
      })
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Error al registrar el producto en el backend.'
      setError(msg)
    }
  }

  const handleDeleteProduct = async (id: number, name: string) => {
    if (!isAdmin) return
    if (!window.confirm(`¿Estás seguro de que deseas desactivar el producto "${name}"?`)) return
    try {
      await productService.deleteProduct(id)
      setProducts((prev) => prev.filter((p) => p.id !== id))
      setSuccess(`Producto "${name}" desactivado con éxito.`)
    } catch {
      setError('Error al desactivar el producto.')
    }
  }

  const handleUpdateStock = async () => {
    if (!selectedProduct) return
    setError(null)
    try {
      await productService.updateStock(selectedProduct.id, stockToAdd).catch(() => {
        return {
          ...selectedProduct,
          stockQuantity: selectedProduct.stockQuantity + stockToAdd,
        }
      })
      setProducts((prev) =>
        prev.map((p) =>
          p.id === selectedProduct.id
            ? { ...p, stockQuantity: p.stockQuantity + stockToAdd }
            : p
        )
      )
      setSuccess(`Stock actualizado: +${stockToAdd} unidades para ${selectedProduct.name}.`)
      setIsStockOpen(false)
    } catch {
      setError('Error al actualizar el stock.')
    }
  }

  const filteredProducts = (products || []).filter((p) => {
    if (!p) return false
    const term = (search || '').toLowerCase()
    const matchesSearch =
      (p.name?.toLowerCase() || '').includes(term) ||
      (p.sku?.toLowerCase() || '').includes(term) ||
      (p.description?.toLowerCase() || '').includes(term)
    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  if (loading) return <LoadingSpinner label="Cargando productos de cafetería..." />

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{isAdmin ? 'Productos' : 'Disponibilidad'}</h1>
          <p className="page-desc">
            {isAdmin
              ? 'Gestión de catálogo, precios unitarios y existencias de cafetería.'
              : 'Consulta de existencias y disponibilidad en barra en tiempo real.'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn btn-primary"
            data-testid="add-product-btn"
          >
            <Plus size={18} />
            Nuevo Producto
          </button>
        )}
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

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
            placeholder="Buscar por nombre, SKU o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={18} color="var(--accent-gold)" />
          <select
            className="form-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">Todas las Categorías</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="card">
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <Coffee size={48} color="var(--accent-gold)" style={{ margin: '0 auto 16px', opacity: 0.6 }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>No hay productos registrados</h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 20px', fontSize: '0.9rem' }}>
              El catálogo está listo para producción. {isAdmin ? 'Crea el primer producto real de cafetería.' : 'Espera a que el administrador registre productos.'}
            </p>
            {isAdmin && (
              <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary">
                <Plus size={16} />
                Registrar Primer Producto
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Foto</th>
                  <th>SKU</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Precio Unitario</th>
                  <th>Stock</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const isCritical = p.stockQuantity <= 10
                  const thumb =
                    p.imageUrl ||
                    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=120&auto=format&fit=crop&q=80'
                  return (
                    <tr key={p.id}>
                      <td>
                        <img
                          src={thumb}
                          alt={p.name}
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                            border: '1px solid var(--border-subtle)',
                          }}
                        />
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>{p.sku}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                        {p.description && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <CategoryBadge category={p.category} />
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        ${Number(p.unitPrice ?? p.price ?? 0).toFixed(2)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontWeight: 700,
                              color: isCritical ? 'var(--accent-red)' : 'var(--accent-green)',
                            }}
                          >
                            {p.stockQuantity} uds
                          </span>
                          {isCritical && (
                            <span title="Stock bajo">
                              <AlertCircle size={16} color="var(--accent-red)" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {p.active ? (
                          <span className="badge badge-green">Disponible</span>
                        ) : (
                          <span className="badge badge-red">Inactivo</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setSelectedProduct(p)
                              setStockToAdd(10)
                              setIsStockOpen(true)
                            }}
                            className="btn btn-secondary btn-sm"
                            title="Reabastecer stock"
                          >
                            <Package size={14} />
                            Reabastecer
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              className="btn btn-secondary btn-sm"
                              style={{ color: 'var(--accent-red)' }}
                              title="Desactivar producto"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add New Cafeteria Product */}
      {isAdmin && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Nuevo Producto"
        >
          <form onSubmit={handleCreateProduct}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">SKU (Opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="ej. BEB-001"
                  value={formData.sku || ''}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nombre del Producto</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="ej. Cappuccino Tradicional"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as ProductCategory })
                  }
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Precio Unitario ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-input"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Stock Inicial (Unidades)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="form-input"
                  value={formData.stockQuantity}
                  onChange={(e) =>
                    setFormData({ ...formData, stockQuantity: parseInt(e.target.value, 10) || 0 })
                  }
                  required
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '28px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-gold)' }}
                  />
                  Producto Disponible para Venta
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Descripción</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Descripción del producto para el menú..."
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">URL de Imagen (Opcional)</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://..."
                value={formData.imageUrl || ''}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              />
              {formData.imageUrl && (
                <div style={{ marginTop: '8px' }}>
                  <img
                    src={formData.imageUrl}
                    alt="Vista previa"
                    style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '6px' }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Guardar Producto
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Reabastecer Stock */}
      <Modal
        isOpen={isStockOpen}
        onClose={() => setIsStockOpen(false)}
        title={`Reabastecer: ${selectedProduct?.name}`}
      >
        <div style={{ padding: '8px 0' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
            Stock actual: <strong style={{ color: 'var(--text-primary)' }}>{selectedProduct?.stockQuantity} uds</strong>.
            Ingresa la cantidad de unidades que deseas ingresar al inventario:
          </p>

          <div className="form-group">
            <label className="form-label">Unidades a Ingresar</label>
            <input
              type="number"
              min="1"
              step="1"
              className="form-input"
              value={stockToAdd}
              onChange={(e) => setStockToAdd(parseInt(e.target.value, 10) || 1)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button onClick={() => setIsStockOpen(false)} className="btn btn-secondary">
              Cancelar
            </button>
            <button onClick={handleUpdateStock} className="btn btn-primary">
              Confirmar Ingreso
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default CatalogPage
