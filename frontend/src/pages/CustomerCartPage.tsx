import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  CreditCard,
  Building,
  Banknote,
  Coffee,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import customerService from '../services/customerService'
import orderService from '../services/orderService'
import Alert from '../components/common/Alert'
import LoadingSpinner from '../components/common/LoadingSpinner'
import type { Customer, CustomerTier, PaymentMethod, Order } from '../types'

const TIER_DISCOUNTS: Record<CustomerTier, number> = {
  BRONZE: 0.0,
  SILVER: 0.05,
  GOLD: 0.1,
  PLATINUM: 0.15,
}

export const CustomerCartPage: React.FC = () => {
  const { user } = useAuth()
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart()
  const navigate = useNavigate()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loadingCustomer, setLoadingCustomer] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null)

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TARJETA_CREDITO')

  const [billingInfo, setBillingInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  })

  // Cargar datos del cliente si está autenticado
  useEffect(() => {
    const fetchCustomer = async () => {
      if (!user?.email) return
      setLoadingCustomer(true)
      try {
        const cust = await customerService.getCustomerByEmail(user.email).catch(() => null)
        if (cust) {
          setCustomer(cust)
          setBillingInfo({
            fullName: `${cust.firstName} ${cust.lastName}`.trim(),
            email: cust.email || user.email,
            phone: cust.phone || '+593 99 876 5432',
            address: 'Av. de las Palmeras 123',
            notes: '',
          })
        } else {
          setBillingInfo((prev) => ({
            ...prev,
            fullName: user.username || 'Cliente Carlos',
            email: user.email,
          }))
        }
      } catch {
        // Fallback silencioso
      } finally {
        setLoadingCustomer(false)
      }
    }

    fetchCustomer()
  }, [user])

  // Cálculos financieros
  const currentTier: CustomerTier = customer?.tier || 'BRONZE'
  const discountRate = TIER_DISCOUNTS[currentTier]
  const subtotal = cart.reduce((sum, item) => {
    const price = Number(item.product.unitPrice ?? item.product.price ?? 0)
    return sum + price * item.quantity
  }, 0)
  const discountAmount = subtotal * discountRate
  const taxableAmount = subtotal - discountAmount
  const taxAmount = taxableAmount * 0.12 // 12% IVA
  const grandTotal = taxableAmount + taxAmount
  const pointsToEarn = Math.floor(grandTotal)

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) return

    if (!billingInfo.fullName.trim() || !billingInfo.email.trim() || !billingInfo.phone.trim()) {
      setError('Por favor completa Nombre, Correo Electrónico y Teléfono de contacto.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      let orderCreated: Order

      if (customer?.id) {
        // Flujo usuario registrado
        orderCreated = await orderService.createOrder({
          customerId: customer.id,
          paymentMethod,
          notes: billingInfo.notes || 'Pedido web confirmado en /carritocliente',
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
        })
      } else {
        // Flujo invitado
        orderCreated = await orderService.guestCheckout({
          fullName: billingInfo.fullName.trim(),
          email: billingInfo.email.trim(),
          phone: billingInfo.phone.trim(),
          paymentMethod,
          notes: billingInfo.notes || 'Pedido web invitado /carritocliente',
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
        })
      }

      setCompletedOrder(orderCreated)
      clearCart()
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Error al procesar la orden de compra.'
      setError(`No se pudo procesar tu pedido: ${msg}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Pantalla de Pedido Completado Exitosamente
  if (completedOrder) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
        <div
          className="card"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--accent-gold)',
            borderRadius: 'var(--radius-md)',
            padding: '48px 32px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          <div
            className="badge-pop"
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: 'rgba(34, 197, 94, 0.15)',
              border: '2px solid var(--accent-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: 'var(--accent-green)',
              boxShadow: '0 0 24px rgba(34, 197, 94, 0.3)',
            }}
          >
            <CheckCircle2 size={40} />
          </div>

          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>
            ¡Pedido Confirmado con Éxito!
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '24px' }}>
            Tu pedido ha sido registrado y enviado para su preparación inmediata.
          </p>

          <div
            style={{
              backgroundColor: 'rgba(0,0,0,0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '20px',
              border: '1px solid var(--border-color)',
              maxWidth: '480px',
              margin: '0 auto 32px',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Código de Orden:</span>
              <strong style={{ color: 'var(--accent-gold)', letterSpacing: '0.5px' }}>
                {completedOrder.orderNumber}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Facturado:</span>
              <strong style={{ fontSize: '1.1rem' }}>${Number(completedOrder.total ?? 0).toFixed(2)} USD</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Estado:</span>
              <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>CONFIRMADO</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Puntos Acumulados:</span>
              <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>
                +{completedOrder.loyaltyPointsEarned != null ? completedOrder.loyaltyPointsEarned : Math.floor(Number(completedOrder.total ?? completedOrder.totalAmount ?? 0))} Puntos
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link to="/my-orders" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Ver Mis Pedidos</span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/store" className="btn btn-secondary">
              Volver al Menú
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Carrito Vacío
  if (cart.length === 0) {
    return (
      <div style={{ maxWidth: '700px', margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
        <div
          className="card"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '56px 24px',
          }}
        >
          <div
            className="float-slow"
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(212, 163, 115, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: 'var(--accent-gold)',
            }}
          >
            <ShoppingBag size={40} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>
            Tu Carrito está Vacío
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '28px', maxWidth: '420px', margin: '0 auto 28px' }}>
            Aún no has seleccionado productos de nuestra cafetería. Explora nuestro menú y elige tus favoritos.
          </p>
          <Link
            to="/store"
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
          >
            <Coffee size={18} />
            <span>Explorar Menú</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px 60px' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <button
            onClick={() => navigate('/store')}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', padding: '6px 12px' }}
          >
            <ChevronLeft size={16} />
            <span>Continuar Comprando</span>
          </button>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Mi Carrito de Compras
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Revisa tus productos seleccionados y confirma tu orden.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-gold)', fontSize: '0.9rem', fontWeight: 600 }}>
          <ShieldCheck size={18} />
          <span>Checkout Seguro SSL</span>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Grid: 2 Columnas (Items a la izquierda, Facturación a la derecha) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '28px', alignItems: 'start' }}>
        {/* Columna Izquierda: Lista detallada de productos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            className="card"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Coffee size={20} color="var(--accent-gold)" />
              <span>Productos en tu Orden ({cart.length})</span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {cart.map((item) => {
                const price = Number(item.product.unitPrice ?? item.product.price ?? 0)
                const itemTotal = price * item.quantity
                return (
                  <div
                    key={item.product.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '80px 1fr auto auto',
                      gap: '16px',
                      alignItems: 'center',
                      padding: '16px',
                      backgroundColor: 'rgba(0,0,0,0.25)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    {/* Imagen / Miniatura */}
                    <div
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                        backgroundColor: '#1f1610',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {item.product.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.1)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)'
                          }}
                        />
                      ) : (
                        <Coffee size={32} color="var(--accent-gold)" style={{ opacity: 0.6 }} />
                      )}
                    </div>

                    {/* Información */}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {item.product.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        SKU: {item.product.sku}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
                        ${price.toFixed(2)} c/u
                      </div>
                    </div>

                    {/* Controles de Cantidad */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px 8px', borderRadius: 'var(--radius-sm)' }}
                      >
                        <Minus size={14} />
                      </button>
                      <span
                        key={item.quantity}
                        className="badge-pop"
                        style={{ fontWeight: 800, fontSize: '0.95rem', minWidth: '24px', textAlign: 'center', display: 'inline-block' }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px 8px', borderRadius: 'var(--radius-sm)' }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Subtotal y Eliminar */}
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                        ${itemTotal.toFixed(2)}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '5px 8px', color: 'var(--accent-red)', border: 'none' }}
                        title="Eliminar producto"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Resumen Financiero y Formulario de Facturación */}
        <div className="animate-stagger stagger-2" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Resumen Financiero */}
          <div
            className="card"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '18px' }}>
              Resumen de la Orden
            </h2>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>Subtotal:</span>
              <span style={{ fontWeight: 600 }}>${subtotal.toFixed(2)} USD</span>
            </div>

            {discountRate > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: 'var(--accent-green)' }}>
                <span style={{ fontSize: '0.92rem' }}>Descuento ({currentTier} -{discountRate * 100}%):</span>
                <span style={{ fontWeight: 700 }}>-${discountAmount.toFixed(2)} USD</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>IVA (12%):</span>
              <span style={{ fontWeight: 600 }}>${taxAmount.toFixed(2)} USD</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '14px',
                borderTop: '1px dashed var(--border-color)',
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--accent-gold)',
                marginBottom: '14px',
              }}
            >
              <span>Total a Pagar:</span>
              <span>${grandTotal.toFixed(2)} USD</span>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(212, 163, 115, 0.08)',
                border: '1px solid var(--border-gold)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px',
                fontSize: '0.82rem',
                color: 'var(--accent-gold)',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <ShieldCheck size={14} />
              <span>Acumularás <strong>+{pointsToEarn} puntos</strong> en tu cuenta</span>
            </div>
          </div>

          {/* Formulario de Facturación y Pago Integrado */}
          <form
            onSubmit={handleConfirmOrder}
            className="card"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '18px' }}>
              Datos de Facturación y Entrega
            </h2>

            {loadingCustomer && <LoadingSpinner label="Cargando perfil..." />}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={billingInfo.fullName}
                  onChange={(e) => setBillingInfo({ ...billingInfo, fullName: e.target.value })}
                  className="form-control"
                  placeholder="Ej: Carlos Mendoza"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={billingInfo.email}
                  onChange={(e) => setBillingInfo({ ...billingInfo, email: e.target.value })}
                  className="form-control"
                  placeholder="correo@ejemplo.com"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    required
                    value={billingInfo.phone}
                    onChange={(e) => setBillingInfo({ ...billingInfo, phone: e.target.value })}
                    className="form-control"
                    placeholder="+593 99..."
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                    Dirección de Entrega
                  </label>
                  <input
                    type="text"
                    value={billingInfo.address}
                    onChange={(e) => setBillingInfo({ ...billingInfo, address: e.target.value })}
                    className="form-control"
                    placeholder="Calle y número"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                  Notas de Preparación / Entrega
                </label>
                <textarea
                  rows={2}
                  value={billingInfo.notes}
                  onChange={(e) => setBillingInfo({ ...billingInfo, notes: e.target.value })}
                  className="form-control"
                  placeholder="Ej: Sin azúcar, leche deslactosada, servir caliente, entregar en mesa 4..."
                  style={{ width: '100%', resize: 'none' }}
                />
              </div>
            </div>

            {/* Selección de Método de Pago */}
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px' }}>
              Método de Pago
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
              <button
                type="button"
                onClick={() => setPaymentMethod('TARJETA_CREDITO')}
                style={{
                  padding: '12px 8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: paymentMethod === 'TARJETA_CREDITO' ? 'rgba(212, 163, 115, 0.15)' : 'rgba(0,0,0,0.2)',
                  border: `1px solid ${paymentMethod === 'TARJETA_CREDITO' ? 'var(--accent-gold)' : 'var(--border-color)'}`,
                  color: paymentMethod === 'TARJETA_CREDITO' ? 'var(--accent-gold)' : 'var(--text-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                }}
              >
                <CreditCard size={18} />
                <span>Tarjeta</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('TRANSFERENCIA')}
                style={{
                  padding: '12px 8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: paymentMethod === 'TRANSFERENCIA' ? 'rgba(212, 163, 115, 0.15)' : 'rgba(0,0,0,0.2)',
                  border: `1px solid ${paymentMethod === 'TRANSFERENCIA' ? 'var(--accent-gold)' : 'var(--border-color)'}`,
                  color: paymentMethod === 'TRANSFERENCIA' ? 'var(--accent-gold)' : 'var(--text-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  transition: 'all 0.24s cubic-bezier(0.22, 1, 0.36, 1)',
                  transform: paymentMethod === 'TRANSFERENCIA' ? 'translateY(-2px) scale(1.02)' : 'scale(1)',
                  boxShadow: paymentMethod === 'TRANSFERENCIA' ? '0 4px 12px rgba(212, 163, 115, 0.2)' : 'none',
                }}
              >
                <Building size={18} />
                <span>Transferencia</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('EFECTIVO')}
                style={{
                  padding: '12px 8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: paymentMethod === 'EFECTIVO' ? 'rgba(212, 163, 115, 0.15)' : 'rgba(0,0,0,0.2)',
                  border: `1px solid ${paymentMethod === 'EFECTIVO' ? 'var(--accent-gold)' : 'var(--border-color)'}`,
                  color: paymentMethod === 'EFECTIVO' ? 'var(--accent-gold)' : 'var(--text-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  transition: 'all 0.24s cubic-bezier(0.22, 1, 0.36, 1)',
                  transform: paymentMethod === 'EFECTIVO' ? 'translateY(-2px) scale(1.02)' : 'scale(1)',
                  boxShadow: paymentMethod === 'EFECTIVO' ? '0 4px 12px rgba(212, 163, 115, 0.2)' : 'none',
                }}
              >
                <Banknote size={18} />
                <span>Efectivo</span>
              </button>
            </div>

            {/* Botón de Confirmación y Pago */}
            <button
              type="submit"
              disabled={isSubmitting || cart.length === 0}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '1.05rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {isSubmitting ? (
                <span>Procesando Pedido...</span>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Confirmar y Facturar (${grandTotal.toFixed(2)})</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CustomerCartPage
