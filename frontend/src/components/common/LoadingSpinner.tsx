import React from 'react'

export const LoadingSpinner: React.FC<{ size?: number; label?: string }> = ({
  size = 32,
  label = 'Cargando datos...',
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        gap: '12px',
      }}
      data-testid="loading-spinner"
    >
      <div
        style={{
          width: size,
          height: size,
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--accent-gold)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      {label && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{label}</span>}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default LoadingSpinner
