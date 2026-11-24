import React from 'react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  iconBg?: string
  staggerClass?: string
  trend?: {
    value: string
    isPositive: boolean
  }
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBg = 'var(--accent-gold-soft)',
  staggerClass = '',
  trend,
}) => {
  return (
    <div
      className={`stat-card ${staggerClass ? `animate-stagger ${staggerClass}` : ''}`}
      data-testid="stat-card"
    >
      <div className="stat-header">
        <span className="stat-title">{title}</span>
        {icon && (
          <div className="stat-icon" style={{ backgroundColor: iconBg }}>
            {icon}
          </div>
        )}
      </div>
      <div key={String(value)} className="stat-value stat-value-animate">
        {value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {subtitle && <div className="stat-subtitle">{subtitle}</div>}
        {trend && (
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: trend.isPositive ? 'var(--accent-green)' : 'var(--accent-red)',
              marginTop: '6px',
            }}
          >
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
    </div>
  )
}

export default StatCard
