import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Coffee, Lock, User, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Alert from '../components/common/Alert'

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const res = await login({ username, password })
      const roles = res?.roles || []
      if (roles.includes('ROLE_ADMIN')) {
        navigate('/dashboard')
      } else if (roles.includes('ROLE_BARISTA')) {
        navigate('/orders')
      } else {
        navigate('/store')
      }
    } catch {
      setError('Credenciales inválidas. Por favor verifique usuario y contraseña.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u)
    setPassword(p)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)',
        padding: '20px',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '36px',
          boxShadow: 'var(--shadow-lg)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              margin: '0 auto 16px',
              background: 'linear-gradient(135deg, var(--accent-gold), #8c5b23)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(200, 141, 77, 0.4)',
            }}
          >
            <Coffee size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Sistema Café
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Acceso a la plataforma de gestión & ventas
          </p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Usuario o Correo
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={18}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '12px', top: '12px' }}
              />
              <input
                id="username"
                type="text"
                className="form-input"
                style={{ paddingLeft: '40px', width: '100%' }}
                placeholder="ej. barista_juan"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" htmlFor="password">
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '12px', top: '12px' }}
              />
              <input
                id="password"
                type="password"
                className="form-input"
                style={{ paddingLeft: '40px', width: '100%' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Iniciando sesión...' : 'Ingresar al Sistema'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div
          style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
          }}
        >
          <span style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
            Accesos Rápidos de Prueba:
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin', 'admin123')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '6px 4px' }}
            >
              Admin Demo
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('barista', 'barista123')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '6px 4px' }}
            >
              Barista Demo
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('cliente_carlos', 'cliente123')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '6px 4px' }}
            >
              Cliente Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
