import React from 'react'
import { Coffee } from 'lucide-react'

export const LoadingSpinner: React.FC<{ size?: number; label?: string }> = ({
  size = 44,
  label = 'Cargando datos...',
}) => {
  return (
    <div
      className="page-transition-enter"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        gap: '14px',
      }}
      data-testid="loading-spinner"
    >
      <div
        style={{
          position: 'relative',
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            border: '3px solid var(--border-color)',
            borderTopColor: 'var(--accent-gold)',
            borderRightColor: 'rgba(212, 163, 115, 0.4)',
            borderRadius: '50%',
            animation: 'spin 0.85s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite',
          }}
        />
        <Coffee size={Math.round(size * 0.42)} color="var(--accent-gold)" className="float-slow" />
      </div>
      {label && <span style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>{label}</span>}
    </div>
  )
}

export default LoadingSpinner
