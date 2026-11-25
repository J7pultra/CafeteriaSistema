import React, { useEffect, useState } from 'react'
import { Plus, Search, ShieldCheck, Coffee, Power, Mail, Lock, User } from 'lucide-react'
import baristaService, { type StaffUser, type CreateBaristaRequest } from '../services/baristaService'
import Modal from '../components/common/Modal'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Alert from '../components/common/Alert'

export const BaristasPage: React.FC = () => {
  const [baristas, setBaristas] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<CreateBaristaRequest>({
    username: '',
    email: '',
    password: '',
  })

  const loadBaristas = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await baristaService.listBaristas()
      setBaristas(Array.isArray(data) ? data : [])
    } catch {
      setError('No se pudo cargar la lista de baristas desde el servidor.')
      setBaristas([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBaristas()
  }, [])

  const handleCreateBarista = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)
    try {
      const created = await baristaService.createBarista(formData)
      setBaristas((prev) => [created, ...prev])
      setSuccess(`Barista '${created.username}' registrado con éxito.`)
      setIsCreateOpen(false)
      setFormData({ username: '', email: '', password: '' })
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Error al registrar el barista. Verifica que el usuario y correo no existan y la contraseña tenga al menos 8 caracteres.'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (barista: StaffUser) => {
    setError(null)
    setSuccess(null)
    try {
      const updated = await baristaService.updateBaristaStatus(barista.id, !barista.enabled)
      setBaristas((prev) => prev.map((b) => (b.id === barista.id ? updated : b)))
      setSuccess(
        `Cuenta '${updated.username}' ${updated.enabled ? 'activada' : 'desactivada'} correctamente.`
      )
    } catch {
      setError('No se pudo actualizar el estado de la cuenta de barista.')
    }
  }

  const filtered = baristas.filter(
    (b) =>
      b.username.toLowerCase().includes(search.toLowerCase()) ||
      b.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <LoadingSpinner label="Cargando equipo de baristas..." />

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Personal Barista</h1>
          <p className="page-desc">
            Gestión exclusiva de cuentas de barista y operadores de barra del sistema.
          </p>
        </div>
        <button
          onClick={() => {
            setError(null)
            setIsCreateOpen(true)
          }}
          className="btn btn-primary"
          data-testid="add-barista-btn"
        >
          <Plus size={18} />
          Registrar Nuevo Barista
        </button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          backgroundColor: 'var(--bg-card)',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
          <input
            type="text"
            className="form-input"
            style={{ width: '100%', paddingLeft: '40px' }}
            placeholder="Buscar barista por usuario o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <Coffee size={48} color="var(--accent-gold)" className="float-slow" style={{ margin: '0 auto 16px', opacity: 0.6 }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>
              No hay baristas que coincidan con la búsqueda
            </h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 20px', fontSize: '0.9rem' }}>
              Solo un administrador puede crear credenciales de acceso para el personal de barra y despacho.
            </p>
            <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary">
              <Plus size={16} />
              Registrar Nuevo Barista
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Usuario</th>
                  <th>Correo Electrónico</th>
                  <th>Rol Asignado</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b, idx) => (
                  <tr
                    key={b.id}
                    className="animate-row"
                    style={{ animationDelay: `${Math.min(idx, 12) * 35}ms` }}
                  >
                    <td style={{ color: 'var(--text-muted)' }}>#{b.id}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.username}</td>
                    <td>{b.email}</td>
                    <td>
                      <span className="badge badge-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <ShieldCheck size={12} />
                        Barista
                      </span>
                    </td>
                    <td>
                      {b.enabled ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: 'var(--accent-green)',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                          }}
                        >
                          <span className="pulse-dot-green" />
                          Activo
                        </span>
                      ) : (
                        <span className="badge badge-red">Suspendido</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(b)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: b.enabled ? 'var(--accent-red)' : 'var(--accent-green)' }}
                        title={b.enabled ? 'Suspender acceso' : 'Reactivar acceso'}
                      >
                        <Power size={14} />
                        <span>{b.enabled ? 'Suspender' : 'Activar'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Registrar Nuevo Barista"
      >
        <form onSubmit={handleCreateBarista}>
          <div className="form-group">
            <label className="form-label" htmlFor="barista-username">
              Nombre de Usuario
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                id="barista-username"
                type="text"
                className="form-input"
                style={{ paddingLeft: '36px', width: '100%' }}
                placeholder="ej. barista_luis"
                minLength={3}
                maxLength={50}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="barista-email">
              Correo Electrónico
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                id="barista-email"
                type="email"
                className="form-input"
                style={{ paddingLeft: '36px', width: '100%' }}
                placeholder="ej. luis@sistemacafe.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="barista-password">
              Contraseña Inicial (mínimo 8 caracteres)
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                id="barista-password"
                type="password"
                className="form-input"
                style={{ paddingLeft: '36px', width: '100%' }}
                placeholder="••••••••"
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '16px 0 0 0' }}>
            <button type="button" onClick={() => setIsCreateOpen(false)} className="btn btn-secondary">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              data-testid="create-barista-submit"
            >
              {isSubmitting ? 'Registrando...' : 'Crear Cuenta de Barista'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default BaristasPage
