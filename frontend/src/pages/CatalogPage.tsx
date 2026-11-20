import React, { useEffect, useState } from 'react'
import { Plus, Search, Filter, Package, AlertCircle, Coffee, Trash2 } from 'lucide-react'
import productService from '../services/productService'
import { RoastBadge } from '../components/common/Badge'
import Modal from '../components/common/Modal'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Alert from '../components/common/Alert'
import type { Product, ProductCategory, RoastLevel, ProductRequest } from '../types'

export const CatalogPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [roastFilter, setRoastFilter] = useState<string>('ALL')
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
    origin: '',
    imageUrl: '',
    roastLevel: 'MEDIUM',
    category: 'SPECIALTY_BEANS',
    price: 18.0,
    stockQuantity: 50,
    active: true,
  })

  const loadProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await productService.getProducts(0, 100)
      setProducts(res?.content ?? [])
    } catch {
      setError('No se pudo conectar con el catálogo de café. Verifica la conexión con el backend.')
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
    setError(null)
    try {
      const payload: ProductRequest = {
        ...formData,
        unitPrice: formData.price,
      }
      const created = await productService.createProduct(payload)
      setProducts((prev) => [created, ...prev])
      setSuccess(`Lote ${created.name} (${created.sku}) creado exitosamente.`)
      setIsCreateOpen(false)
      setFormData({
        sku: '',
        name: '',
        description: '',
        origin: '',
        imageUrl: '',
        roastLevel: 'MEDIUM',
        category: 'SPECIALTY_BEANS',
        price: 18.0,
        stockQuantity: 50,
        active: true,
      })
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Error al registrar el producto en el backend.'
      setError(msg)
    }
  }

  const handleDeleteProduct = async (id: number, name: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas desactivar el lote "${name}"?`)) return
    try {
      await productService.deleteProduct(id)
      setProducts((prev) => prev.filter((p) => p.id !== id))
      setSuccess(`Lote "${name}" desactivado con éxito.`)
    } catch {
      setError('Error al desactivar el lote de café.')
    }
  }

  const handleUpdateStock = async () => {
    if (!selectedProduct) return
    setError(null)
    try {
      await productService.updateStock(selectedProduct.id, stockToAdd).catch(() => {
        // Fallback local update
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
      setSuccess(`Stock actualizado: +${stockToAdd} kg para ${selectedProduct.name}.`)
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
      (p.origin?.toLowerCase() || '').includes(term)
    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter
    const matchesRoast = roastFilter === 'ALL' || p.roastLevel === roastFilter
    return matchesSearch && matchesCategory && matchesRoast
  })

  if (loading) return <LoadingSpinner label="Cargando catálogo de granos de café..." />

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Lotes de Café & Inventario</h1>
          <p className="page-desc">
            Trazabilidad de origen, altitud, perfiles de cata y control de existencias.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="btn btn-primary"
          data-testid="add-product-btn"
        >
          <Plus size={18} />
          Nuevo Lote de Café
        </button>
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
            data-sommelier-id="catalog-search-input"
            style={{ paddingLeft: '40px', width: '100%' }}
            placeholder="Buscar por variedad, origen o SKU (ej. Huila, COF-COL)..."
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
            <option value="SPECIALTY_BEANS">Especialidad (Specialty)</option>
            <option value="ESPRESSO_SINGLE_ORIGIN">Origen Único (Single Origin)</option>
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

      {/* Products Table */}
      <div className="card">
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <Coffee size={48} color="var(--accent-gold)" style={{ margin: '0 auto 16px', opacity: 0.6 }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>No hay lotes de café registrados</h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 20px', fontSize: '0.9rem' }}>
              El catálogo está listo para producción. Registra el primer lote con información real de origen y control de inventario.
            </p>
            <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary">
              <Plus size={16} />
              Registrar Primer Lote
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Foto</th>
                  <th>SKU</th>
                  <th>Variedad / Nombre</th>
                  <th>Origen</th>
                  <th>Tueste</th>
                  <th>Precio / kg</th>
                  <th>Stock</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const isCritical = p.stockQuantity < 10
                  const thumb =
                    p.imageUrl ||
                    'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=120&auto=format&fit=crop&q=80'
                  return (
                    <tr key={p.id} data-sommelier-id={`product-card-${p.id}`}>
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
                      <td>{p.origin || 'N/A'}</td>
                      <td>
                        <RoastBadge roast={p.roastLevel} />
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
                            {p.stockQuantity} kg
                          </span>
                          {isCritical && (
                            <span title="Stock crítico">
                              <AlertCircle size={16} color="var(--accent-red)" />
                            </span>
                          )}
                        </div>
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
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="btn btn-secondary btn-sm"
                            style={{ color: 'var(--accent-red)' }}
                            title="Desactivar producto"
                          >
                            <Trash2 size={14} />
                          </button>
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

      {/* Modal: Add New Coffee Product */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Registrar Nuevo Lote de Café"
      >
        <form onSubmit={handleCreateProduct}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">SKU</label>
              <input
                type="text"
                className="form-input"
                placeholder="ej. COF-CRI-TAR"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nombre del Lote / Variedad</label>
              <input
                type="text"
                className="form-input"
                placeholder="ej. Café Costa Rica Tarrazú"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Origen / Región</label>
            <input
              type="text"
              className="form-input"
              placeholder="ej. Tarrazú, Costa Rica"
              value={formData.origin}
              onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Nivel de Tueste</label>
              <select
                className="form-select"
                value={formData.roastLevel}
                onChange={(e) =>
                  setFormData({ ...formData, roastLevel: e.target.value as RoastLevel })
                }
              >
                <option value="LIGHT">Claro (Light)</option>
                <option value="MEDIUM_LIGHT">Medio Claro</option>
                <option value="MEDIUM">Medio (Medium)</option>
                <option value="MEDIUM_DARK">Medio Oscuro</option>
                <option value="DARK">Oscuro (Dark)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Categoría</label>
              <select
                className="form-select"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as ProductCategory })
                }
              >
                <option value="SPECIALTY_BEANS">Especialidad (Specialty)</option>
                <option value="ESPRESSO_SINGLE_ORIGIN">Origen Único (Single Origin)</option>
                <option value="COLD_BREW_BLEND">Mezcla / Cold Brew</option>
                <option value="DECAF_ORGANIC">Descafeinado Orgánico</option>
                <option value="BARISTA_EQUIPMENT">Equipamiento Barista</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Precio por kg ($)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Stock Inicial (kg)</label>
              <input
                type="number"
                className="form-input"
                value={formData.stockQuantity}
                onChange={(e) =>
                  setFormData({ ...formData, stockQuantity: parseInt(e.target.value, 10) })
                }
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">URL de Fotografía / Miniatura</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://images.unsplash.com/..."
              value={formData.imageUrl || ''}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fotos recomendadas:</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                onClick={() =>
                  setFormData({
                    ...formData,
                    imageUrl:
                      'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=500&auto=format&fit=crop&q=80',
                  })
                }
              >
                Granos Huila
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                onClick={() =>
                  setFormData({
                    ...formData,
                    imageUrl:
                      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80',
                  })
                }
              >
                Tueste Claro
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                onClick={() =>
                  setFormData({
                    ...formData,
                    imageUrl:
                      'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&auto=format&fit=crop&q=80',
                  })
                }
              >
                Espresso Dark
              </button>
            </div>
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

          <div className="form-group">
            <label className="form-label">Notas de Cata / Descripción</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Perfil sensorial, proceso de beneficio, altitud..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
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
              Guardar Lote
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Quick Restock */}
      <Modal
        isOpen={isStockOpen}
        onClose={() => setIsStockOpen(false)}
        title={`Reabastecer: ${selectedProduct?.name || ''}`}
      >
        <div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
            Stock actual:{' '}
            <strong style={{ color: 'var(--accent-gold)' }}>
              {selectedProduct?.stockQuantity} kg
            </strong>
          </p>

          <div className="form-group">
            <label className="form-label">Cantidad a añadir (kg)</label>
            <input
              type="number"
              className="form-input"
              value={stockToAdd}
              min="1"
              onChange={(e) => setStockToAdd(parseInt(e.target.value, 10) || 0)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {[5, 10, 25, 50].map((qty) => (
              <button
                key={qty}
                type="button"
                onClick={() => setStockToAdd(qty)}
                className="btn btn-secondary btn-sm"
              >
                +{qty} kg
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setIsStockOpen(false)}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleUpdateStock}
              className="btn btn-primary"
            >
              Confirmar Reabastecimiento
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default CatalogPage
