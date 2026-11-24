import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Coffee, Lock, User, Mail, ArrowRight, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Alert from '../components/common/Alert'

export const LoginPage: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)

    try {
      if (isRegister) {
        if (!email.trim() || !username.trim() || !password.trim()) {
          setError('Todos los campos son obligatorios para el registro.')
          setIsSubmitting(false)
          return
        }
        await register({ username, email, password })
        setSuccess('¡Cuenta de cliente creada exitosamente! Redirigiendo...')
        setTimeout(() => {
          navigate('/store')
        }, 800)
      } else {
        const res = await login({ username, password })
        const roles = res?.roles || []
        if (roles.includes('ROLE_ADMIN')) {
          navigate('/dashboard')
        } else if (roles.includes('ROLE_BARISTA')) {
          navigate('/orders')
        } else {
          navigate('/store')
        }
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        (isRegister
          ? (err?.message || 'Error al crear la cuenta. Verifica que el usuario o correo no existan.')
          : 'Credenciales inválidas. Por favor verifique usuario y contraseña.')
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickLogin = (u: string, p: string) => {
    setIsRegister(false)
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
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        className="login-ambient-orb"
        style={{
          width: '340px',
          height: '340px',
          top: '-80px',
          left: '-60px',
          background: 'rgba(212, 163, 115, 0.14)',
        }}
      />
      <div
        className="login-ambient-orb"
        style={{
          width: '380px',
          height: '380px',
          bottom: '-100px',
          right: '-80px',
          background: 'rgba(200, 141, 77, 0.1)',
          animationDelay: '-4.5s',
        }}
      />
      <div
        className="card page-transition-enter"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '36px',
          boxShadow: 'var(--shadow-lg)',
          borderColor: 'var(--border-color)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            className="float-slow"
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
            {isRegister
              ? 'Registro de clientes y beneficios de lealtad'
              : 'Acceso a la plataforma de gestión & ventas'}
          </p>
        </div>

        {/* Tab switch between Login and Register */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px',
            marginBottom: '20px',
            border: '1px solid var(--border-color)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setIsRegister(false)
              setError(null)
              setSuccess(null)
            }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: !isRegister ? 700 : 500,
              backgroundColor: !isRegister ? 'var(--accent-gold)' : 'transparent',
              color: !isRegister ? '#14110E' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            data-testid="tab-register-btn"
            onClick={() => {
              setIsRegister(true)
              setError(null)
              setSuccess(null)
            }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: isRegister ? 700 : 500,
              backgroundColor: isRegister ? 'var(--accent-gold)' : 'transparent',
              color: isRegister ? '#14110E' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Registrarse
          </button>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Usuario
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

          {isRegister && (
            <div className="form-group alert-animate">
              <label className="form-label" htmlFor="email">
                Correo Electrónico
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={18}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: '12px', top: '12px' }}
                />
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '40px', width: '100%' }}
                  placeholder="ej. cliente@sistemacafe.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required={isRegister}
                />
              </div>
            </div>
          )}

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
            data-testid="auth-submit-btn"
          >
            {isSubmitting
              ? isRegister
                ? 'Registrando cuenta...'
                : 'Iniciando sesión...'
              : isRegister
              ? 'Crear Cuenta de Cliente'
              : 'Ingresar al Sistema'}
            {isRegister ? <UserPlus size={18} /> : <ArrowRight size={18} />}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister)
              setError(null)
              setSuccess(null)
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-gold)',
              fontSize: '0.84rem',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            {isRegister
              ? '¿Ya tienes una cuenta? Inicia sesión aquí'
              : '¿Eres un cliente nuevo? Regístrate aquí'}
          </button>
        </div>

        <div
          style={{
            marginTop: '24px',
            paddingTop: '16px',
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
