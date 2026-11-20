import React, { useEffect, useState } from 'react'
import { Plus, ShoppingBag, CheckCircle, Ban, Clock } from 'lucide-react'
import orderService from '../services/orderService'
import productService from '../services/productService'
import customerService from '../services/customerService'
import { OrderStatusBadge, TierBadge } from '../components/common/Badge'
import Modal from '../components/common/Modal'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Alert from '../components/common/Alert'
import type {
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  Customer,
  OrderItemRequest,
} from '../types'

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Create Order Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(1)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TARJETA_CREDITO')
  const [notes, setNotes] = useState('')
  const [cartItems, setCartItems] = useState<Array<{ productId: number; quantity: number }>>([
    { productId: 1, quantity: 2 },
  ])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [ordersRes, productsRes, customersRes] = await Promise.all([
        orderService.getOrders(0, 50).catch(() => ({ content: [] as Order[] })),
        productService.getProducts(0, 50).catch(() => ({ content: [] as Product[] })),
        customerService.getCustomers(0, 50).catch(() => ({ content: [] as Customer[] })),
      ])

      setOrders(ordersRes?.content ?? [])
      setProducts(productsRes?.content ?? [])
      setCustomers(customersRes?.content ?? [])
      if (customersRes?.content?.length) {
        setSelectedCustomerId(customersRes.content[0].id)
      }
    } catch {
      setError('Error al sincronizar las órdenes con el backend.')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleStatusChange = async (orderId: number, nextStatus: OrderStatus) => {
    setError(null)
    try {
      await orderService.updateOrderStatus(orderId, nextStatus)
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
      )
      setSuccess(`Orden #${orderId} actualizada a estado: ${nextStatus}.`)
    } catch {
      setError('Error al actualizar el estado de la orden.')
    }
  }

  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm('¿Está seguro de cancelar esta orden? El stock se reintegrará automáticamente.')) {
      return
    }
    setError(null)
    try {
      await orderService.cancelOrder(orderId)
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'CANCELADO' } : o))
      )
      setSuccess(`Orden #${orderId} cancelada. Granos de café restituidos al inventario.`)
    } catch {
      setError('Error al cancelar la orden.')
    }
  }

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const itemsPayload: OrderItemRequest[] = cartItems.map((ci) => ({
        productId: ci.productId,
        quantity: ci.quantity,
      }))

      const newOrder: Order = await orderService.createOrder({
        customerId: selectedCustomerId,
        items: itemsPayload,
        paymentMethod,
        notes,
      })

      setOrders((prev) => [newOrder, ...prev])
      setSuccess(`Orden ${newOrder.orderNumber} creada exitosamente por $${Number(newOrder.total).toFixed(2)}.`)
      setIsCreateOpen(false)
      setNotes('')
    } catch {
      setError('Error al registrar la orden.')
    }
  }

  const filteredOrders =
    statusFilter === 'ALL' ? orders : orders.filter((o) => o.status === statusFilter)

  if (loading) return <LoadingSpinner label="Cargando historial de pedidos de café..." />

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de Órdenes & POS</h1>
          <p className="page-desc">
            Recepción, despacho y facturación de café con aplicación automática de lealtad.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="btn btn-primary"
          data-testid="new-order-btn"
        >
          <Plus size={18} />
          Nueva Venta / Orden
        </button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { key: 'ALL', label: 'Todas las Órdenes' },
          { key: 'PENDIENTE', label: 'Pendientes' },
          { key: 'EN_PREPARACION', label: 'En Preparación' },
          { key: 'LISTO', label: 'Listas' },
          { key: 'ENTREGADO', label: 'Entregadas' },
          { key: 'CANCELADO', label: 'Canceladas' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`btn btn-sm ${statusFilter === tab.key ? 'btn-primary' : 'btn-secondary'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="card">
        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <ShoppingBag size={48} color="var(--accent-gold)" style={{ margin: '0 auto 16px', opacity: 0.6 }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>No hay órdenes registradas aún</h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 20px', fontSize: '0.9rem' }}>
              Cuando los clientes o visitantes realicen compras en la tienda, las órdenes aparecerán aquí en tiempo real para ser preparadas por los baristas.
            </p>
            <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary">
              <Plus size={16} />
              Crear Orden Manual
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nº Orden</th>
                  <th>Cliente</th>
                  <th>Nivel</th>
                  <th>Items</th>
                  <th>Total ($)</th>
                  <th>Pago</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>
                    {o.orderNumber}
                  </td>
                  <td>{o.customerName || `Cliente #${o.customerId}`}</td>
                  <td>{o.customerTier && <TierBadge tier={o.customerTier} />}</td>
                  <td>
                    <div style={{ fontSize: '0.82rem' }}>
                      {o.items?.map((item, idx) => (
                        <div key={idx}>
                          {item.quantity}x {item.productName}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    ${o.total?.toFixed(2)}
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>{o.paymentMethod}</td>
                  <td>
                    <OrderStatusBadge status={o.status} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {o.status === 'PENDIENTE' && (
                        <button
                          onClick={() => handleStatusChange(o.id, 'EN_PREPARACION')}
                          className="btn btn-secondary btn-sm"
                          title="Iniciar preparación"
                        >
                          <Clock size={14} /> Preparar
                        </button>
                      )}
                      {o.status === 'EN_PREPARACION' && (
                        <button
                          onClick={() => handleStatusChange(o.id, 'LISTO')}
                          className="btn btn-secondary btn-sm"
                          title="Marcar como listo"
                        >
                          <CheckCircle size={14} color="var(--accent-green)" /> Listo
                        </button>
                      )}
                      {o.status === 'LISTO' && (
                        <button
                          onClick={() => handleStatusChange(o.id, 'ENTREGADO')}
                          className="btn btn-primary btn-sm"
                          title="Entregar al cliente"
                        >
                          <ShoppingBag size={14} /> Entregar
                        </button>
                      )}
                      {o.status !== 'ENTREGADO' && o.status !== 'CANCELADO' && (
                        <button
                          onClick={() => handleCancelOrder(o.id)}
                          className="btn btn-danger btn-sm"
                          title="Cancelar orden y restituir inventario"
                        >
                          <Ban size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Modal: Create Order POS */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Crear Nueva Orden de Café"
      >
        <form onSubmit={handleCreateOrder}>
          <div className="form-group">
            <label className="form-label">Cliente Asociado (Descuento por Lealtad)</label>
            <select
              className="form-select"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(parseInt(e.target.value, 10))}
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} ({c.tier} - {c.loyaltyPoints} pts)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Productos Seleccionados</label>
            {cartItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '10px',
                  alignItems: 'center',
                }}
              >
                <select
                  className="form-select"
                  style={{ flex: 2 }}
                  value={item.productId}
                  onChange={(e) => {
                    const newItems = [...cartItems]
                    newItems[idx].productId = parseInt(e.target.value, 10)
                    setCartItems(newItems)
                  }}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (${Number(p.unitPrice ?? p.price ?? 0).toFixed(2)}/kg) - Stock: {p.stockQuantity}kg
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  className="form-input"
                  style={{ width: '80px' }}
                  value={item.quantity}
                  onChange={(e) => {
                    const newItems = [...cartItems]
                    newItems[idx].quantity = parseInt(e.target.value, 10) || 1
                    setCartItems(newItems)
                  }}
                />

                {cartItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setCartItems(cartItems.filter((_, i) => i !== idx))}
                    className="btn btn-danger btn-sm"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                setCartItems([...cartItems, { productId: products[0]?.id || 1, quantity: 1 }])
              }
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '8px' }}
            >
              + Agregar otro lote de café
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Método de Pago</label>
              <select
                className="form-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              >
                <option value="TARJETA_CREDITO">Tarjeta de Crédito</option>
                <option value="TARJETA_DEBITO">Tarjeta de Débito</option>
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="PUNTOS_LEALTAD">Puntos de Lealtad</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Notas de Barista</label>
              <input
                type="text"
                className="form-input"
                placeholder="ej. Molienda Aeropress, empaque al vacío"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Procesar y Confirmar Orden
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default OrdersPage
