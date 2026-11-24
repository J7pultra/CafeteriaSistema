import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Coffee,
  CheckCircle2,
  Calendar,
  ShoppingBag,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import orderService from '../services/orderService'
import customerService from '../services/customerService'
import { OrderStatusBadge } from '../components/common/Badge'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Alert from '../components/common/Alert'
import type { Order, OrderStatus } from '../types'

const STATUS_STEPS: OrderStatus[] = [
  'PENDIENTE',
  'CONFIRMADO',
  'EN_PREPARACION',
  'LISTO',
  'ENTREGADO',
]

export const CustomerOrdersPage: React.FC = () => {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      try {
        if (!user?.email) {
          setOrders([])
          setLoading(false)
          return
        }
        const custRes = await customerService.getCustomerByEmail(user.email).catch(() => null)
        if (!custRes) {
          setOrders([])
          setLoading(false)
          return
        }

        const ordersRes = await orderService.getOrdersByCustomer(custRes.id, 0, 50).catch(() => ({
          content: [] as Order[],
        }))
        setOrders(ordersRes?.content ?? [])
      } catch {
        setError('No se pudo recuperar el historial de tus pedidos.')
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [user])

  const getStepProgress = (status: OrderStatus) => {
    if (status === 'CANCELADO') return -1
    const idx = STATUS_STEPS.indexOf(status)
    return idx >= 0 ? idx : 0
  }

  if (loading) return <LoadingSpinner label="Recuperando tus pedidos..." />

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mis Pedidos</h1>
          <p className="page-desc">
            Seguimiento en tiempo real del estado de preparación y entrega de tus pedidos.
          </p>
        </div>
        <Link to="/store" className="btn btn-primary" style={{ display: 'flex', gap: '8px' }}>
          <ShoppingBag size={18} />
          Ir al Menú
        </Link>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {orders.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: 'var(--bg-card)',
          }}
        >
          <Coffee size={56} style={{ color: 'var(--accent-gold)', opacity: 0.4, margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Aún no tienes pedidos registrados</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            Explora nuestro menú y disfruta de nuestras especialidades de cafetería y repostería.
          </p>
          <Link to="/store" className="btn btn-primary">
            Explorar Menú
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {orders.map((order) => {
            const stepIndex = getStepProgress(order.status)
            const isCancelled = order.status === 'CANCELADO'

            return (
              <div
                key={order.id}
                className="card"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  padding: '24px',
                }}
              >
                {/* Header Row */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid var(--border-color)',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: 800,
                        color: 'var(--accent-gold)',
                      }}
                    >
                      #{order.orderNumber || order.id}
                    </span>
                    <OrderStatusBadge status={order.status} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                      <Calendar size={15} />
                      <span>{order.createdAt ? new Date(order.createdAt).toLocaleDateString([], { dateStyle: 'medium' }) : 'N/A'}</span>
                    </div>
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                      ${Number(order.total || 0).toFixed(2)} USD
                    </div>
                  </div>
                </div>

                {/* Progress Steps Indicator */}
                {!isCancelled && (
                  <div style={{ margin: '20px 0 24px 0' }}>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        position: 'relative',
                        alignItems: 'center',
                      }}
                    >
                      {/* Connecting Line */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '14px',
                          left: '10%',
                          right: '10%',
                          height: '3px',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          zIndex: 1,
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            backgroundColor: 'var(--accent-gold)',
                            width: `${Math.min(100, Math.max(0, (stepIndex / 4) * 100))}%`,
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>

                      {STATUS_STEPS.map((step, idx) => {
                        const isDone = idx <= stepIndex
                        const isCurrent = idx === stepIndex
                        const labels: Record<OrderStatus, string> = {
                          PENDIENTE: 'Recibido',
                          CONFIRMADO: 'Confirmado',
                          EN_PREPARACION: 'En Preparación',
                          LISTO: 'Listo',
                          ENTREGADO: 'Entregado',
                          CANCELADO: 'Cancelado',
                        }

                        return (
                          <div
                            key={step}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              position: 'relative',
                              zIndex: 2,
                            }}
                          >
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                backgroundColor: isDone
                                  ? 'var(--accent-gold)'
                                  : 'var(--bg-primary)',
                                color: isDone ? '#1a120c' : 'var(--text-muted)',
                                border: isCurrent
                                  ? '2px solid #fff'
                                  : '2px solid rgba(255,255,255,0.1)',
                                marginBottom: '6px',
                              }}
                            >
                              {isDone ? <CheckCircle2 size={16} /> : idx + 1}
                            </div>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: isCurrent ? 700 : 500,
                                color: isCurrent
                                  ? 'var(--accent-gold)'
                                  : isDone
                                    ? 'var(--text-primary)'
                                    : 'var(--text-muted)',
                                textAlign: 'center',
                              }}
                            >
                              {labels[step]}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Items in Order */}
                <div
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.78rem',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      marginBottom: '8px',
                      fontWeight: 700,
                    }}
                  >
                    Productos:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {order.items?.map((it, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.88rem',
                        }}
                      >
                        <div>
                          <strong style={{ color: 'var(--text-primary)' }}>{it.productName}</strong>
                          <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>
                            x{it.quantity}
                          </span>
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>
                          ${(it.unitPrice * it.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CustomerOrdersPage
