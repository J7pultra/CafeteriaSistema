import React, { useEffect, useState } from 'react'
import { Plus, Search, UserCheck } from 'lucide-react'
import customerService from '../services/customerService'
import { TierBadge } from '../components/common/Badge'
import Modal from '../components/common/Modal'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Alert from '../components/common/Alert'
import type { Customer, CustomerTier, CustomerRequest } from '../types'

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<string>('ALL')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [formData, setFormData] = useState<CustomerRequest>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    tier: 'BRONZE',
  })

  const loadCustomers = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await customerService.getCustomers(0, 100).catch(() => ({
        content: [] as Customer[],
      }))
      setCustomers(res?.content ?? [])
    } catch {
      setError('Error al sincronizar clientes con el backend.')
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const created = await customerService.createCustomer(formData)
      setCustomers((prev) => [created, ...prev])
      setSuccess(`Cliente ${created.firstName} ${created.lastName} registrado con éxito.`)
      setIsCreateOpen(false)
      setFormData({ firstName: '', lastName: '', email: '', phone: '', tier: 'BRONZE' })
    } catch {
      setError('Error al registrar cliente en el backend.')
    }
  }

  const filteredCustomers = customers.filter((c) => {
    const fullName = `${c.firstName} ${c.lastName}`.toLowerCase()
    const matchesSearch =
      fullName.includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
    const matchesTier = tierFilter === 'ALL' || c.tier === tierFilter
    return matchesSearch && matchesTier
  })

  if (loading) return <LoadingSpinner label="Cargando base de datos de clientes y lealtad..." />

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-desc">
            Seguimiento de clientes, nivel de fidelización y acumulación de puntos.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="btn btn-primary"
          data-testid="add-customer-btn"
        >
          <Plus size={18} />
          Registrar Cliente
        </button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      {/* Filter and Search */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          backgroundColor: 'var(--bg-card)',
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          flexWrap: 'wrap',
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
            placeholder="Buscar por nombre, apellido o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
        >
          <option value="ALL">Todos los Niveles</option>
          <option value="PLATINUM">Platino (15% Desc)</option>
          <option value="GOLD">Oro (10% Desc)</option>
          <option value="SILVER">Plata (5% Desc)</option>
          <option value="BRONZE">Bronce</option>
        </select>
      </div>

      {/* Customers Table */}
      <div className="card">
        {filteredCustomers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <UserCheck size={48} color="var(--accent-gold)" className="float-slow" style={{ margin: '0 auto 16px', opacity: 0.6 }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>No hay clientes registrados aún</h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 20px', fontSize: '0.9rem' }}>
              Los clientes registrados en el programa de lealtad o aquellos que compren como invitados aparecerán aquí automáticamente.
            </p>
            <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary">
              <Plus size={16} />
              Registrar Cliente
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Nivel Lealtad</th>
                  <th>Puntos Acumulados</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c, idx) => (
                  <tr
                    key={c.id}
                    className="animate-row"
                    style={{ animationDelay: `${Math.min(idx, 12) * 35}ms` }}
                  >
                    <td style={{ color: 'var(--text-muted)' }}>#{c.id}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {c.firstName} {c.lastName}
                    </td>
                    <td>{c.email}</td>
                    <td>{c.phone || 'No registrado'}</td>
                    <td>
                      <TierBadge tier={c.tier} />
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>
                      {c.loyaltyPoints} pts
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: 'var(--accent-green)',
                          fontSize: '0.8rem',
                        }}
                      >
                        <span className="pulse-dot-green" />
                        <UserCheck size={14} /> Activo
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Register Customer */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Registrar Nuevo Cliente"
      >
        <form onSubmit={handleCreateCustomer}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Nombre</label>
              <input
                type="text"
                className="form-input"
                placeholder="ej. Mateo"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Apellido</label>
              <input
                type="text"
                className="form-input"
                placeholder="ej. Gómez"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Correo Electrónico</label>
            <input
              type="email"
              className="form-input"
              placeholder="ej. mateo.g@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input
                type="text"
                className="form-input"
                placeholder="+57 300 000 0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nivel Inicial</label>
              <select
                className="form-select"
                value={formData.tier}
                onChange={(e) =>
                  setFormData({ ...formData, tier: e.target.value as CustomerTier })
                }
              >
                <option value="BRONZE">Bronce</option>
                <option value="SILVER">Plata</option>
                <option value="GOLD">Oro</option>
                <option value="PLATINUM">Platino</option>
              </select>
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
              Guardar Cliente
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default CustomersPage
