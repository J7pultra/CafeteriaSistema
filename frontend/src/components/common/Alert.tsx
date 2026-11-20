import React from 'react'
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react'

interface AlertProps {
  type?: 'error' | 'warning' | 'success' | 'info'
  message: string
  onClose?: () => void
}

export const Alert: React.FC<AlertProps> = ({ type = 'info', message, onClose }) => {
  const styles = {
    error: {
      bg: 'var(--accent-red-soft)',
      border: 'rgba(239, 68, 68, 0.4)',
      color: 'var(--accent-red)',
      icon: <AlertCircle size={18} />,
    },
    warning: {
      bg: 'var(--accent-gold-soft)',
      border: 'rgba(200, 141, 77, 0.4)',
      color: 'var(--accent-gold)',
      icon: <AlertTriangle size={18} />,
    },
    success: {
      bg: 'var(--accent-green-soft)',
      border: 'rgba(16, 185, 129, 0.4)',
      color: 'var(--accent-green)',
      icon: <CheckCircle2 size={18} />,
    },
    info: {
      bg: 'var(--accent-blue-soft)',
      border: 'rgba(59, 130, 246, 0.4)',
      color: 'var(--accent-blue)',
      icon: <Info size={18} />,
    },
  }[type]

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: styles.bg,
        border: `1px solid ${styles.border}`,
        color: styles.color,
        fontSize: '0.88rem',
        marginBottom: '16px',
      }}
      role="alert"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {styles.icon}
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{ color: styles.color, display: 'flex', alignItems: 'center' }}
          aria-label="Cerrar alerta"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}

export default Alert
