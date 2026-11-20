import React from 'react'
import { Sparkles, Circle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export const Navbar: React.FC = () => {
  const { user } = useAuth()

  const roleName = user?.roles?.includes('ROLE_ADMIN')
    ? 'Administración'
    : user?.roles?.includes('ROLE_BARISTA')
    ? 'Estación de Barra'
    : 'Miembro'

  return (
    <header className="top-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <Circle size={8} fill="var(--accent-green)" color="var(--accent-green)" />
          <span>Tostaduría en Operación</span>
        </div>
        <span style={{ color: 'var(--border-color)' }}>•</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Lotes de Especialidad Calibrados
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(212, 163, 115, 0.1)',
            padding: '5px 12px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--border-gold)',
            fontSize: '0.78rem',
            color: 'var(--accent-gold)',
            fontWeight: 600,
          }}
        >
          <Sparkles size={13} />
          <span>Gemini 3 Asistente Activo</span>
        </div>

        <div
          style={{
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            fontWeight: 500,
          }}
        >
          {roleName}
        </div>
      </div>
    </header>
  )
}

export default Navbar
